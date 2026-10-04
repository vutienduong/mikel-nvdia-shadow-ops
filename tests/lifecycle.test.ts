import test from "node:test";
import assert from "node:assert/strict";
import {
  archiveVersion,
  editWorkflow,
  filterRuns,
  summarizeRuns,
  containsRefundAmount,
} from "../src/domain/lifecycle.ts";
import { createDemoState, OperationsEngine } from "../src/domain/operations.ts";
import { AIService } from "../server/ai.ts";
import type { WorkflowDefinition, WorkflowRun } from "../src/types/index.ts";

test('editing an approval threshold updates its displayed rule and preserves archived evidence', async () => {
  const current = await workflow();
  current.version = 2;
  current.steps.splice(4, 0, {
    id: 'step_approval', skill: 'request_manager_approval', name: 'Manager approval', description: 'Approve refunds above $500',
    args: { ticketId: '{{ticket.id}}', amount: '{{duplicate.amount}}', reason: 'High-value refund' },
    condition: { field: 'duplicate.amount', operator: '>', value: 500, description: 'Manager approval for refunds above $500' },
  });
  current.decisionRules = [{ id: 'RULE_ORIGINAL', conditionStr: 'duplicate.amount > 500', description: 'Manager approval for refunds above $500', confidence: 0.9, discoveredAt: '2026-10-05T00:00:00Z' }];
  const before = structuredClone(current);
  const edited = structuredClone(current);
  edited.steps.find(step => step.skill === 'request_manager_approval')!.condition!.value = 100;
  const result = editWorkflow(current, edited);
  const condition = result.current.steps.find(step => step.skill === 'request_manager_approval')!.condition!;
  assert.equal(condition.value, 100);
  assert.ok(condition.description.includes('100'));
  assert.ok(!condition.description.includes('500'));
  assert.equal(result.current.decisionRules[0].conditionStr, 'duplicate.amount > 100');
  assert.ok(result.current.decisionRules[0].description.includes('100'));
  assert.ok(!result.current.decisionRules[0].description.includes('500'));
  assert.equal(result.current.version, 3);
  assert.equal(result.archived.version, 2);
  assert.equal(result.archived.steps.find(step => step.skill === 'request_manager_approval')!.condition!.value, 500);
  assert.deepEqual(result.archived.decisionRules, before.decisionRules);
  assert.deepEqual(current, before);
});

async function workflow(): Promise<WorkflowDefinition> {
  const state = createDemoState();
  const actions = [
    "find_customer",
    "get_recent_payments",
    "detect_duplicate_payment",
    "check_refund_policy",
    "refund_payment",
    "draft_customer_reply",
    "send_customer_reply",
    "close_ticket",
  ];
  const observationEvents = actions.map((action, i) => ({
    id: `EVT_${i}`,
    demonstrationId: "DEMO_TEST",
    sequence: i + 1,
    timestamp: "2026-10-05T00:00:00Z",
    type: "tool_action",
    action,
    entityType: "ticket",
    entityId: "TICK_1042",
    label: action,
    context: {},
  }));
  const result = await new AIService({}).infer({
    ticket: state.tickets[0],
    observationEvents,
    mode: "offline_demo",
  });
  return { ...result, status: "active" };
}

const reply = async (input: { refundId: string; refundAmount: number }) => ({
  replyText: `Refund ${input.refundId}, amount $${input.refundAmount}, confirmed. Allow 3-5 business days.`,
});
function run(
  id: string,
  status: WorkflowRun["status"],
  startedAt: string,
  durationMs?: number,
): WorkflowRun {
  return {
    id,
    status,
    startedAt,
    durationMs,
    workflowId: "WF_TEST",
    workflowName: "Test",
    workflowVersion: 1,
    ticketId: "TICK_TEST",
    customerName: "Test",
    steps: [],
  };
}

test("archiving creates an isolated prior-version snapshot without mutating the active definition", async () => {
  const current = await workflow();
  const before = structuredClone(current);
  const archived = archiveVersion(current);
  assert.equal(archived.status, "archived");
  assert.equal(archived.version, current.version);
  assert.deepEqual(current, before);
  archived.steps[0].args.customerId = "CUS_CHANGED";
  assert.deepEqual(current, before);
});

test("editor creates a new version and preserves identity, provenance, and prior version contents", async () => {
  const current = await workflow();
  const before = structuredClone(current);
  const edited = {
    ...structuredClone(current),
    name: "Reviewed duplicate resolution",
    id: "WF_ATTACK",
    slug: "other_slug",
    version: 99,
    createdAt: "changed",
    provenance: undefined,
  };
  const result = editWorkflow(current, edited);
  assert.equal(result.current.version, current.version + 1);
  assert.equal(result.current.id, current.id);
  assert.equal(result.current.slug, current.slug);
  assert.equal(result.current.createdAt, current.createdAt);
  assert.deepEqual(result.current.provenance, current.provenance);
  assert.equal(result.current.status, "active");
  assert.equal(result.current.name, edited.name);
  assert.equal(result.archived.status, "archived");
  assert.deepEqual(result.archived.steps, before.steps);
  assert.deepEqual(current, before);
  result.current.steps[0].args.customerId = "CUS_CHANGED";
  assert.deepEqual(result.archived.steps, before.steps);
});

test("invalid JSON definition is rejected before either active or historical version changes", async () => {
  const current = await workflow();
  const before = structuredClone(current);
  const edited = structuredClone(current);
  edited.steps[0].skill = "unsafe_unknown_skill";
  assert.throws(() => editWorkflow(current, edited));
  assert.deepEqual(current, before);
});

test("run filtering combines status and inclusive timestamp bounds without mutating history", () => {
  const runs = [
    run("before", "completed", "2026-10-04T23:59:59Z"),
    run("start", "completed", "2026-10-05T00:00:00Z"),
    run("failure", "failed", "2026-10-05T12:00:00Z"),
    run("end", "completed", "2026-10-05T23:59:59Z"),
    run("after", "completed", "2026-10-06T00:00:00Z"),
  ];
  const before = structuredClone(runs);
  const filtered = filterRuns(runs, {
    status: "completed",
    from: "2026-10-05T00:00:00Z",
    to: "2026-10-05T23:59:59Z",
  });
  assert.deepEqual(
    filtered.map((item) => item.id),
    ["start", "end"],
  );
  assert.deepEqual(
    filterRuns(runs, {}).map((item) => item.id),
    runs.map((item) => item.id),
  );
  assert.deepEqual(runs, before);
});

test("analytics derives rates from terminal outcomes and excludes unknown durations and pending work", () => {
  const runs = [
    run("done", "completed", "2026-10-05T00:00:00Z", 100),
    run("fail", "failed", "2026-10-05T01:00:00Z", 300),
    run("wait", "waiting_approval", "2026-10-05T02:00:00Z", 9999),
    run("unknown", "completed", "2026-10-05T03:00:00Z"),
  ];
  assert.deepEqual(summarizeRuns(runs), {
    total: 4,
    completed: 2,
    failed: 1,
    waitingApproval: 1,
    successRate: 2 / 3,
    averageDurationMs: 200,
  });
  assert.deepEqual(summarizeRuns([]), {
    total: 0,
    completed: 0,
    failed: 0,
    waitingApproval: 0,
    successRate: null,
    averageDurationMs: null,
  });
});

test("reply failure retry resumes the same version and never repeats a completed refund", async () => {
  let attempts = 0;
  const ops = new OperationsEngine(createDemoState(), {
    generateReply: async (input) => {
      if (++attempts === 1) throw new Error("Provider timed out");
      return reply(input);
    },
  });
  const definition = await workflow();
  ops.state.workflows.push(definition);
  const failed = await ops.startRun(definition, "TICK_1044");
  assert.equal(failed.status, "failed");
  const receipt = ops.state.payments.find(
    (item) => item.id === "PAY_302",
  )!.refundId;
  const refundTrace = structuredClone(
    failed.steps.find((step) => step.skillId === "refund_payment"),
  );
  // Editing the catalog after failure must not replace the immutable run definition.
  definition.name = "New catalog name";
  definition.version = 2;
  const resumed = await ops.retryRun(failed.id);
  assert.equal(resumed.id, failed.id);
  assert.equal(resumed.status, "completed");
  assert.equal(resumed.workflowVersion, 1);
  assert.equal(resumed.definition!.version, 1);
  assert.equal(
    ops.state.payments.find((item) => item.id === "PAY_302")!.refundId,
    receipt,
  );
  assert.deepEqual(
    resumed.steps.find((step) => step.skillId === "refund_payment"),
    refundTrace,
  );
  assert.equal(ops.state.messages.length, 1);
  assert.equal(ops.state.runs.length, 1);
  await assert.rejects(() => ops.retryRun(failed.id));
});

test("safe retry refuses a receipt whose ticket ownership no longer matches its checkpoint", async () => {
  const ops = new OperationsEngine(createDemoState(), {
    generateReply: async () => {
      throw new Error("Provider unavailable");
    },
  });
  const failed = await ops.startRun(await workflow(), "TICK_1044");
  ops.state.payments.find((item) => item.id === "PAY_302")!.refundTicketId =
    "TICK_1042";
  await assert.rejects(() => ops.retryRun(failed.id));
  assert.equal(ops.state.messages.length, 0);
  assert.equal(ops.state.runs[0].status, "failed");
});

test("no-duplicate and rejected approval failures cannot be automatically replayed", async () => {
  const ops = new OperationsEngine(createDemoState(), { generateReply: reply });
  const definition = await workflow();
  const noDuplicate = await ops.startRun(definition, "TICK_1045");
  await assert.rejects(() => ops.retryRun(noDuplicate.id));
  const highValue = await ops.startRun(definition, "TICK_1043");
  ops.reject(
    ops.state.approvals.find((item) => item.runId === highValue.id)!.id,
  );
  await assert.rejects(() => ops.retryRun(highValue.id));
  assert.equal(
    ops.state.payments.filter((item) => item.status === "refunded").length,
    0,
  );
});

test("human escalation records the reason and freezes automatic retry of a partial refund", async () => {
  const ops = new OperationsEngine(createDemoState(), {
    generateReply: async () => {
      throw new Error("Provider unavailable");
    },
  });
  const failed = await ops.startRun(await workflow(), "TICK_1044");
  ops.escalateRun(
    failed.id,
    "Verify the existing receipt with finance before proceeding",
  );
  const saved = ops.state.runs.find((item) => item.id === failed.id)!;
  assert.equal(saved.reviewRequired, true);
  assert.equal(
    saved.reviewReason,
    "Verify the existing receipt with finance before proceeding",
  );
  await assert.rejects(() => ops.retryRun(failed.id));
  assert.equal(ops.state.messages.length, 0);
  assert.equal(
    ops.state.payments.filter((item) => item.status === "refunded").length,
    1,
  );
});

test("concurrent retry cannot duplicate customer confirmation", async () => {
  let attempts = 0;
  let entered!: () => void;
  let release!: (value: { replyText: string }) => void;
  let validReply = "";
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const ops = new OperationsEngine(createDemoState(), {
    generateReply: async (input) => {
      if (++attempts === 1) throw new Error("Provider unavailable");
      validReply = (await reply(input)).replyText;
      entered();
      return new Promise((resolve) => {
        release = resolve;
      });
    },
  });
  const failed = await ops.startRun(await workflow(), "TICK_1044");
  const pending = ops.retryRun(failed.id);
  await started;
  await assert.rejects(() => ops.retryRun(failed.id));
  release({ replyText: validReply });
  await pending;
  assert.equal(ops.state.messages.length, 1);
  assert.equal(
    ops.state.payments.filter((item) => item.status === "refunded").length,
    1,
  );
});

test("interrupted send with a persisted confirmation refuses ambiguous replay without mutation", async () => {
  const ops = new OperationsEngine(createDemoState(), { generateReply: reply });
  const completed = await ops.startRun(await workflow(), "TICK_1044");
  const snapshot = structuredClone(ops.state);
  const interrupted = snapshot.runs.find((item) => item.id === completed.id)!;
  const sendIndex = interrupted.steps.findIndex(
    (step) => step.skillId === "send_customer_reply",
  );
  interrupted.status = "running";
  interrupted.nextStep = sendIndex;
  delete interrupted.completedAt;
  delete interrupted.context!.message;
  interrupted.steps[sendIndex].status = "running";
  delete interrupted.steps[sendIndex].output;
  interrupted.steps[sendIndex + 1].status = "pending";
  snapshot.tickets.find((item) => item.id === "TICK_1044")!.status = "open";
  const restored = new OperationsEngine(snapshot, { generateReply: reply });
  const receipt = restored.state.payments.find(
    (item) => item.id === "PAY_302",
  )!.refundId;
  const messages = structuredClone(restored.state.messages);
  await assert.rejects(() => restored.retryRun(completed.id));
  assert.deepEqual(restored.state.messages, messages);
  assert.equal(
    restored.state.payments.find((item) => item.id === "PAY_302")!.refundId,
    receipt,
  );
  assert.equal(restored.state.runs[0].status, "failed");
});

test("failed reply checkpoint with a substituted receipt refuses automatic recovery", async () => {
  const ops = new OperationsEngine(createDemoState(), {
    generateReply: async () => {
      throw new Error("Provider unavailable");
    },
  });
  const failed = await ops.startRun(await workflow(), "TICK_1044");
  ops.state.payments.find((item) => item.id === "PAY_302")!.refundId =
    "REF_DIFFERENT";
  await assert.rejects(() => ops.retryRun(failed.id));
  assert.equal(ops.state.messages.length, 0);
  assert.equal(
    ops.state.tickets.find((item) => item.id === "TICK_1044")!.status,
    "open",
  );
});

test("retry refuses a ledger payment reassigned to another customer before sending confirmation", async () => {
  let attempts = 0;
  const ops = new OperationsEngine(createDemoState(), {
    generateReply: async (input) => {
      if (++attempts === 1) throw new Error("Provider unavailable");
      return reply(input);
    },
  });
  const failed = await ops.startRun(await workflow(), "TICK_1044");
  ops.state.payments.find((item) => item.id === "PAY_302")!.customerId =
    "CUS_001";
  await assert.rejects(() => ops.retryRun(failed.id));
  assert.equal(ops.state.messages.length, 0);
});

for (const text of [
  "Refunded $1,100.00.",
  "Refunded $1100.",
  "Refunded USD 1,100.",
  "Refunded USD 1100.00.",
  "Refunded 1,100.00 USD.",
]) {
  test(`refund amount accepts exact USD formatting: ${text}`, () => {
    assert.equal(containsRefundAmount(text, 1100), true);
  });
}

for (const text of [
  "Refunded $11000.",
  "Refunded $110.00.",
  "Refunded 1100.",
  "Refunded EUR 1,100.",
  "Reference REF_1100 processed.",
  "Refunded $1,100.01.",
  "Refunded $1100.50.",
]) {
  test(`refund amount rejects incorrect value or missing USD currency: ${text}`, () => {
    assert.equal(containsRefundAmount(text, 1100), false);
  });
}

test("refund amount compares exact cents without accepting digit substrings", () => {
  assert.equal(containsRefundAmount("Refunded $79.50.", 79.5), true);
  assert.equal(containsRefundAmount("Refunded $795.00.", 79.5), false);
  assert.equal(containsRefundAmount("Refunded $79.05.", 79.5), false);
  assert.equal(containsRefundAmount("Refunded $79.50.", 79), false);
});

test("approved high-value run accepts a formatted reply and preserves its actual refund receipt", async () => {
  let generatedReceipt = "";
  const ops = new OperationsEngine(createDemoState(), {
    generateReply: async (input) => {
      generatedReceipt = input.refundId;
      return {
        replyText: `Refund ${input.refundId} for $1,100.00 confirmed. Allow 3-5 business days.`,
      };
    },
  });
  const pending = await ops.startRun(await workflow(), "TICK_1043");
  assert.equal(pending.status, "waiting_approval");
  await ops.approve(
    ops.state.approvals.find((item) => item.runId === pending.id)!.id,
  );
  assert.equal(
    ops.state.runs.find((item) => item.id === pending.id)!.status,
    "completed",
  );
  assert.equal(
    ops.state.payments.find((item) => item.id === "PAY_202")!.refundId,
    generatedReceipt,
  );
  assert.equal(ops.state.messages[0].refundId, generatedReceipt);
  assert.equal(ops.state.messages.length, 1);
});

test("incorrect amount substring cannot confirm or close a real approved refund", async () => {
  const ops = new OperationsEngine(createDemoState(), {
    generateReply: async (input) => ({
      replyText: `Refund ${input.refundId} for $11000 confirmed.`,
    }),
  });
  const pending = await ops.startRun(await workflow(), "TICK_1043");
  await ops.approve(
    ops.state.approvals.find((item) => item.runId === pending.id)!.id,
  );
  assert.equal(
    ops.state.runs.find((item) => item.id === pending.id)!.status,
    "failed",
  );
  assert.equal(ops.state.messages.length, 0);
  assert.equal(
    ops.state.tickets.find((item) => item.id === "TICK_1043")!.status,
    "open",
  );
  assert.equal(
    ops.state.payments.find((item) => item.id === "PAY_202")!.amount,
    1100,
  );
  assert.equal(
    ops.state.payments.filter((item) => item.status === "refunded").length,
    1,
  );
});

test("live provider reply validation accepts formatted USD and rejects amount substrings", async () => {
  let replyText = "Refund REF_EXACT for USD 1,100.00 confirmed.";
  const service = new AIService(
    { apiKey: "test-only", fastModel: "nvidia/test-nemotron" },
    async (url) => {
      if (String(url).endsWith("/models"))
        return new Response(
          JSON.stringify({ data: [{ id: "nvidia/test-nemotron" }] }),
        );
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ replyText }) } }],
        }),
      );
    },
  );
  const input = {
    customerName: "Alex Morgan",
    refundAmount: 1100,
    refundId: "REF_EXACT",
    ticketSubject: "Duplicate charge",
    ticketId: "TICK_1043",
    mode: "live",
  };
  const valid = await service.reply(input);
  assert.equal(valid.replyText, replyText);
  replyText = "Refund REF_EXACT for $11000 confirmed.";
  await assert.rejects(() => service.reply(input), /receipt|amount/i);
  replyText = "Refund REF_DIFFERENT for $1,100.00 confirmed.";
  await assert.rejects(() => service.reply(input), /receipt|amount/i);
});

test("manual edits preserve source demonstration attribution in both independent versions", async () => {
  const current = {
    ...(await workflow()),
    sourceDemonstrationIds: ["DEMO_A", "DEMO_B"],
  };
  const edited = {
    ...structuredClone(current),
    name: "Human-reviewed workflow",
    sourceDemonstrationIds: ["DEMO_UNRELATED"],
  };
  const result = editWorkflow(current, edited);
  assert.deepEqual(result.current.sourceDemonstrationIds, ["DEMO_A", "DEMO_B"]);
  assert.deepEqual(result.archived.sourceDemonstrationIds, [
    "DEMO_A",
    "DEMO_B",
  ]);
  assert.ok(result.current.humanEditedAt);
  result.current.sourceDemonstrationIds!.push("DEMO_CHANGED");
  assert.deepEqual(result.archived.sourceDemonstrationIds, [
    "DEMO_A",
    "DEMO_B",
  ]);
  assert.deepEqual(current.sourceDemonstrationIds, ["DEMO_A", "DEMO_B"]);
});

test("reset invalidates an in-flight safe retry without recreating history or messages", async () => {
  let attempts = 0;
  let entered!: () => void;
  let release!: (value: { replyText: string }) => void;
  let validReply = "";
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const ops = new OperationsEngine(createDemoState(), {
    generateReply: async (input) => {
      if (++attempts === 1) throw new Error("Provider unavailable");
      validReply = (await reply(input)).replyText;
      entered();
      return new Promise((resolve) => {
        release = resolve;
      });
    },
  });
  const failed = await ops.startRun(await workflow(), "TICK_1044");
  const pending = ops.retryRun(failed.id);
  await started;
  ops.reset();
  release({ replyText: validReply });
  await pending.catch(() => {});
  assert.equal(ops.state.runs.length, 0);
  assert.equal(ops.state.messages.length, 0);
  assert.equal(ops.state.workflows.length, 0);
  assert.equal(ops.state.workflowVersions.length, 0);
  assert.ok(
    ops.state.payments.every(
      (item) => item.status === "captured" && !item.refundId,
    ),
  );
});
