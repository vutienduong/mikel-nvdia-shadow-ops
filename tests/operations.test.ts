import test from "node:test";
import assert from "node:assert/strict";
import {
  createDemoState,
  findDuplicate,
  validateWorkflow,
  OperationsEngine,
} from "../src/domain/operations.ts";
import type {
  Payment,
  WorkflowDefinition,
  WorkflowStep,
} from "../src/types/index.ts";

function workflow(withApproval = false): WorkflowDefinition {
  const step = (
    id: string,
    skill: string,
    args: Record<string, unknown>,
  ): WorkflowStep => ({ id, skill, name: skill, description: skill, args });
  const steps = [
    step("find", "find_customer", { customerId: "{{ticket.customerId}}" }),
    step("payments", "get_recent_payments", { customerId: "{{customer.id}}" }),
    step("detect", "detect_duplicate_payment", { payments: "{{payments}}" }),
    step("policy", "check_refund_policy", {
      paymentId: "{{duplicate.paymentId}}",
      amount: "{{duplicate.amount}}",
    }),
  ];
  if (withApproval)
    steps.push({
      ...step("approval", "request_manager_approval", {
        ticketId: "{{ticket.id}}",
        amount: "{{duplicate.amount}}",
        reason: "High-value duplicate refund",
      }),
      condition: {
        field: "duplicate.amount",
        operator: ">",
        value: 500,
        description: "Manager approval above $500",
      },
    });
  steps.push(
    step("refund", "refund_payment", { paymentId: "{{duplicate.paymentId}}" }),
    step("draft", "draft_customer_reply", {
      ticketId: "{{ticket.id}}",
      customerName: "{{customer.name}}",
      refundAmount: "{{duplicate.amount}}",
      refundId: "{{refund.refundId}}",
    }),
    step("send", "send_customer_reply", {
      ticketId: "{{ticket.id}}",
      message: "{{reply.replyText}}",
    }),
    step("close", "close_ticket", { ticketId: "{{ticket.id}}" }),
  );
  return {
    id: "WF_TEST",
    slug: "duplicate_payment_resolution",
    name: "Duplicate payment resolution",
    version: withApproval ? 2 : 1,
    description: "Resolve verified duplicate payments",
    trigger: { type: "support_ticket", intent: "duplicate_payment" },
    inputs: ["ticket_id"],
    steps,
    confidence: 0.9,
    status: "active",
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
    demonstrationsCount: 1,
    decisionRules: [],
  };
}

const generateReply = async (input: {
  customerName: string;
  refundAmount: number;
  refundId: string;
}) => ({
  replyText: `Hi ${input.customerName}, your $${input.refundAmount} refund ${input.refundId} is confirmed. Allow 3-5 business days.`,
});
const engine = () => new OperationsEngine(createDemoState(), { generateReply });
const payment = (
  id: string,
  chargedAt: string,
  overrides: Partial<Payment> = {},
): Payment => ({
  id,
  customerId: "CUS_TEST",
  amount: 79,
  currency: "USD",
  status: "captured",
  chargedAt,
  plan: "Pro Monthly",
  description: "Renewal",
  ...overrides,
});

test("demo seed starts unlearned with open tickets and no fabricated ledger history", () => {
  const state = createDemoState();
  assert.equal(state.workflows.length, 0);
  assert.equal(state.runs.length, 0);
  assert.equal(state.approvals.length, 0);
  assert.equal(state.messages.length, 0);
  assert.ok(state.tickets.length >= 4);
  assert.ok(state.tickets.every((ticket) => ticket.status === "open"));
  assert.ok(
    state.payments.every(
      (item) => item.status === "captured" && !item.refundId,
    ),
  );
  state.payments[0].status = "refunded";
  assert.equal(
    createDemoState().payments[0].status,
    "captured",
    "fresh demo state must be isolated",
  );
});

for (const withApproval of [false, true]) {
  test(`high-value run pauses before refund and resumes exactly once (${withApproval ? "v2 explicit approval" : "v1 policy guard"})`, async () => {
    const ops = engine();
    const run = await ops.startRun(workflow(withApproval), "TICK_1043");
    assert.equal(run.status, "waiting_approval");
    assert.equal(
      ops.state.payments.find((item) => item.id === "PAY_202")?.status,
      "captured",
    );
    assert.equal(ops.state.messages.length, 0);
    assert.equal(
      ops.state.tickets.find((item) => item.id === "TICK_1043")?.status,
      "pending_approval",
    );
    assert.equal(ops.state.approvals.length, 1);
    await ops.approve(ops.state.approvals[0].id);
    assert.equal(
      ops.state.runs.find((item) => item.id === run.id)?.status,
      "completed",
    );
    assert.equal(
      ops.state.payments.filter((item) => item.status === "refunded").length,
      1,
    );
    assert.equal(ops.state.messages.length, 1);
    await ops.approve(ops.state.approvals[0].id).catch(() => {});
    assert.equal(
      ops.state.payments.filter((item) => item.status === "refunded").length,
      1,
    );
    assert.equal(ops.state.messages.length, 1);
  });
}

test("rejecting approval terminates the run without refund or customer confirmation", async () => {
  const ops = engine();
  const run = await ops.startRun(workflow(true), "TICK_1043");
  ops.reject(ops.state.approvals[0].id);
  assert.equal(
    ops.state.runs.find((item) => item.id === run.id)?.status,
    "failed",
  );
  assert.equal(
    ops.state.payments.find((item) => item.id === "PAY_202")?.status,
    "captured",
  );
  assert.equal(ops.state.messages.length, 0);
  await ops.approve(ops.state.approvals[0].id).catch(() => {});
  assert.equal(
    ops.state.payments.find((item) => item.id === "PAY_202")?.status,
    "captured",
  );
});

test("Sarah differing legitimate charges fail safely and remain in run history", async () => {
  const ops = engine();
  const run = await ops.startRun(workflow(), "TICK_1045");
  assert.equal(run.status, "failed");
  assert.equal(
    ops.state.runs.find((item) => item.id === run.id)?.status,
    "failed",
  );
  assert.ok(run.steps.some((step) => step.status === "failed" && step.error));
  assert.equal(
    ops.state.payments.filter((item) => item.status === "refunded").length,
    0,
  );
  assert.equal(ops.state.messages.length, 0);
  assert.equal(
    ops.state.tickets.find((item) => item.id === "TICK_1045")?.status,
    "open",
  );
});

test("workflow conditions use their IR threshold rather than a hardcoded $500 branch", async () => {
  const ops = engine();
  const definition = workflow(true);
  definition.steps.find(
    (step) => step.skill === "request_manager_approval",
  )!.condition!.value = 100;
  const run = await ops.startRun(definition, "TICK_1044");
  assert.equal(run.status, "waiting_approval");
  assert.equal(
    ops.state.payments.find((item) => item.id === "PAY_302")?.status,
    "captured",
  );
  assert.equal(ops.state.approvals[0].amount, 119);
});

test("workflow arguments are evaluated and cannot redirect a ticket to another customer", async () => {
  const ops = engine();
  const definition = workflow();
  definition.steps[0].args.customerId = "CUS_001";
  const run = await ops.startRun(definition, "TICK_1044");
  assert.equal(run.status, "failed");
  assert.equal(
    ops.state.payments.filter((item) => item.status === "refunded").length,
    0,
  );
  assert.equal(ops.state.messages.length, 0);
});

test("manual refunds cannot bypass manager approval, duplicate eligibility, or ticket ownership", () => {
  const ops = engine();
  assert.throws(() => ops.refund("PAY_202", "TICK_1043"));
  assert.throws(() => ops.refund("PAY_401", "TICK_1045"));
  assert.throws(() => ops.refund("PAY_103", "TICK_1044"));
  assert.equal(
    ops.state.payments.filter((item) => item.status === "refunded").length,
    0,
  );
});

test("ambiguous policy thresholds fail safely instead of treating eligibility as always true", async () => {
  const state = createDemoState();
  state.policies.find((item) => item.id === "POL_AUTH_02")!.thresholdAmount =
    1000;
  const ops = new OperationsEngine(state, { generateReply });
  const run = await ops.startRun(workflow(), "TICK_1044");
  assert.equal(run.status, "failed");
  assert.equal(
    ops.state.payments.filter((item) => item.status === "refunded").length,
    0,
  );
  assert.equal(ops.state.messages.length, 0);
});

test("original charge cannot be refunded in place of the verified secondary transaction", () => {
  const ops = engine();
  assert.throws(() => ops.refund("PAY_102", "TICK_1042"));
  assert.equal(
    ops.state.payments.find((item) => item.id === "PAY_102")?.status,
    "captured",
  );
});

test("manual refunds issue one real receipt and cannot refund the same charge again", () => {
  const ops = engine();
  const receipt = ops.refund("PAY_103", "TICK_1042");
  assert.ok(receipt);
  assert.equal(
    ops.state.payments.find((item) => item.id === "PAY_103")?.refundId,
    receipt,
  );
  assert.throws(() => ops.refund("PAY_103", "TICK_1042"));
  assert.throws(
    () => ops.closeTicket("TICK_1042"),
    "a refund without a sent confirmation does not resolve the ticket",
  );
});

test("manual reply cannot reuse another ticket refund receipt for the same customer", async () => {
  const state = createDemoState();
  const original = state.tickets.find((ticket) => ticket.id === "TICK_1042")!;
  state.tickets.push({
    ...original,
    id: "TICK_UNRELATED",
    subject: "Question about my plan",
    intent: "general_inquiry",
  });
  const ops = new OperationsEngine(state, { generateReply });
  ops.refund("PAY_103", "TICK_1042");
  await assert.rejects(() => ops.draftAndSendReply("TICK_UNRELATED"));
  assert.throws(() => ops.closeTicket("TICK_UNRELATED"));
  assert.equal(ops.state.messages.length, 0);
  assert.equal(
    ops.state.tickets.find((ticket) => ticket.id === "TICK_UNRELATED")?.status,
    "open",
  );
});

test("duplicate detector chooses the secondary charge within the 48-hour policy window", () => {
  const original = payment("original", "2026-10-01T00:00:00Z");
  const secondary = payment("secondary", "2026-10-03T00:00:00Z");
  const result = findDuplicate([secondary, original]);
  assert.equal(result.paymentId, "secondary");
  assert.equal(result.payment.id, "secondary");
  assert.equal(result.original.id, "original");
  assert.equal(result.amount, 79);
  assert.throws(() =>
    findDuplicate([original, payment("late", "2026-10-03T00:00:01Z")]),
  );
});

for (const [label, overrides] of Object.entries({
  currency: { currency: "EUR" },
  plan: { plan: "Extra Seats" },
  customer: { customerId: "CUS_OTHER" },
  amount: { amount: 49 },
  failed: { status: "failed" as const },
  refunded: { status: "refunded" as const },
})) {
  test(`duplicate detector rejects equal-looking charges with different ${label}`, () => {
    assert.throws(() =>
      findDuplicate([
        payment("original", "2026-10-01T00:00:00Z"),
        payment("other", "2026-10-01T00:01:00Z", overrides),
      ]),
    );
  });
}

test("runtime validator accepts canonical workflow and rejects malformed or unsafe IR", () => {
  assert.equal(validateWorkflow(workflow(true)).steps.length, 9);
  assert.throws(() => validateWorkflow(null));
  assert.throws(() => validateWorkflow({ ...workflow(), steps: [] }));
  const unknown = workflow();
  unknown.steps[0].skill = "invented_gateway_action";
  assert.throws(() => validateWorkflow(unknown));
  const duplicateId = workflow();
  duplicateId.steps[1].id = duplicateId.steps[0].id;
  assert.throws(() => validateWorkflow(duplicateId));
  const missingArgs = workflow();
  missingArgs.steps[4].args = {};
  assert.throws(() => validateWorkflow(missingArgs));
  const badReference = workflow();
  badReference.steps[0].args.customerId = "{{imaginary.customerId}}";
  assert.throws(() => validateWorkflow(badReference));
  const forwardReference = workflow();
  forwardReference.steps[0].args.customerId = "{{refund.refundId}}";
  assert.throws(() => validateWorkflow(forwardReference));
});

test("reply generation failure persists failed run without sending or closing ticket", async () => {
  const ops = new OperationsEngine(createDemoState(), {
    generateReply: async () => {
      throw new Error("Provider unavailable");
    },
  });
  const run = await ops.startRun(workflow(), "TICK_1044");
  assert.equal(run.status, "failed");
  assert.equal(
    ops.state.runs.find((item) => item.id === run.id)?.status,
    "failed",
  );
  assert.equal(
    ops.state.payments.find((item) => item.id === "PAY_302")?.status,
    "refunded",
  );
  assert.equal(ops.state.messages.length, 0);
  assert.equal(
    ops.state.tickets.find((item) => item.id === "TICK_1044")?.status,
    "open",
  );
});

test("successful execution stores a reply containing the actual gateway receipt", async () => {
  const ops = engine();
  const run = await ops.startRun(workflow(), "TICK_1044");
  assert.equal(run.status, "completed");
  const receipt = ops.state.payments.find(
    (item) => item.id === "PAY_302",
  )?.refundId;
  assert.ok(receipt);
  assert.equal(ops.state.messages.length, 1);
  assert.ok(JSON.stringify(ops.state.messages[0]).includes(receipt));
  assert.ok(
    ["resolved", "closed"].includes(
      ops.state.tickets.find((item) => item.id === "TICK_1044")!.status,
    ),
  );
});

test("a provider response without the actual refund receipt cannot be sent or close the ticket", async () => {
  const ops = new OperationsEngine(createDemoState(), {
    generateReply: async () => ({ replyText: "Refund confirmed." }),
  });
  const run = await ops.startRun(workflow(), "TICK_1044");
  assert.equal(run.status, "failed");
  assert.equal(ops.state.messages.length, 0);
  assert.equal(
    ops.state.tickets.find((item) => item.id === "TICK_1044")?.status,
    "open",
  );
});

test("an in-flight run prevents a second run or manual mutation of the same ticket", async () => {
  let release!: (value: { replyText: string }) => void;
  let validReply = "";
  let entered!: () => void;
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const ops = new OperationsEngine(createDemoState(), {
    generateReply: (input) => {
      validReply = `Refund ${input.refundId} for $${input.refundAmount} confirmed.`;
      entered();
      return new Promise((resolve) => {
        release = resolve;
      });
    },
  });
  const pending = ops.startRun(workflow(), "TICK_1044");
  await started;
  await assert.rejects(() => ops.startRun(workflow(), "TICK_1044"));
  assert.throws(() => ops.refund("PAY_302", "TICK_1044"));
  assert.throws(() => ops.closeTicket("TICK_1044"));
  release({ replyText: validReply });
  await pending;
  assert.equal(
    ops.state.payments.filter((item) => item.status === "refunded").length,
    1,
  );
  assert.equal(ops.state.messages.length, 1);
});

test("reset invalidates an in-flight AI reply and prevents late ledger or ticket mutations", async () => {
  let release!: (value: { replyText: string }) => void;
  let entered!: () => void;
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const ops = new OperationsEngine(createDemoState(), {
    generateReply: () => {
      entered();
      return new Promise((resolve) => {
        release = resolve;
      });
    },
  });
  const pending = ops.startRun(workflow(), "TICK_1044");
  await started;
  ops.reset();
  release({ replyText: "Stale refund reply" });
  await pending.catch(() => {});
  assert.equal(ops.state.runs.length, 0);
  assert.equal(ops.state.messages.length, 0);
  assert.equal(ops.state.workflows.length, 0);
  assert.ok(
    ops.state.payments.every(
      (item) => item.status === "captured" && !item.refundId,
    ),
  );
  assert.ok(ops.state.tickets.every((item) => item.status === "open"));
});

test("reset also invalidates a manual customer reply already awaiting the provider", async () => {
  let release!: (value: { replyText: string }) => void;
  let replyText = "";
  const ops = new OperationsEngine(createDemoState(), {
    generateReply: (input) => {
      replyText = `Refund ${input.refundId} for $${input.refundAmount} confirmed.`;
      return new Promise((resolve) => {
        release = resolve;
      });
    },
  });
  ops.refund("PAY_103", "TICK_1042");
  const pending = ops.draftAndSendReply("TICK_1042");
  ops.reset();
  release({ replyText });
  await assert.rejects(() => pending, /reset|cancelled/i);
  assert.equal(ops.state.messages.length, 0);
  assert.ok(
    ops.state.payments.every(
      (item) => item.status === "captured" && !item.refundId,
    ),
  );
});
