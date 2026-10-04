import test from "node:test";
import assert from "node:assert/strict";
import { AIService } from "../server/ai.ts";
import { createDemoState } from "../src/domain/operations.ts";
import { validateWorkflow } from "../src/domain/contracts.ts";
const state = createDemoState();
const trace = [
  "find_customer",
  "get_recent_payments",
  "detect_duplicate_payment",
  "check_refund_policy",
  "refund_payment",
  "draft_customer_reply",
  "send_customer_reply",
  "close_ticket",
].map((action, i) => ({
  id: `EVT_${i}`,
  demonstrationId: "DEMO_TEST",
  sequence: i + 1,
  timestamp: new Date().toISOString(),
  type: "tool_action",
  action,
  entityType: "ticket",
  entityId: "TICK_1042",
  label: action,
  context: {},
}));
const service = new AIService({});
test("live AI without credentials errors and never silently falls back", async () => {
  await assert.rejects(
    () =>
      service.infer({
        ticket: state.tickets[0],
        observationEvents: trace,
        mode: "live",
      }),
    /not configured/i,
  );
});
test("explicit offline demo is labeled fixture and induces valid executable workflow only from complete trace", async () => {
  const result = await service.infer({
    ticket: state.tickets[0],
    observationEvents: trace,
    mode: "offline_demo",
  });
  assert.equal(result.provenance!.mode, "fixture");
  assert.equal(result.provenance!.provider, "offline_demo");
  validateWorkflow(result);
  await assert.rejects(
    () =>
      service.infer({
        ticket: state.tickets[0],
        observationEvents: trace.slice(0, 1),
        mode: "offline_demo",
      }),
    /complete/i,
  );
});
test("offline comparison distinguishes same trace from an observed new approval", async () => {
  const existingWorkflow = await service.infer({
    ticket: state.tickets[0],
    observationEvents: trace,
    mode: "offline_demo",
  });
  const same = await service.compare({
    existingWorkflow,
    newObservationEvents: trace,
    ticket: state.tickets[0],
    mode: "offline_demo",
    demonstrations: [],
  });
  assert.equal(same.classification, "same_workflow");
  const changed = await service.compare({
    existingWorkflow,
    newObservationEvents: [
      ...trace,
      {
        ...trace[0],
        id: "EVT_APR",
        action: "request_manager_approval",
        sequence: 9,
      },
    ],
    ticket: state.tickets[1],
    mode: "offline_demo",
    demonstrations: [],
  });
  assert.equal(changed.classification, "workflow_variant");
  assert.equal(changed.condition!.value, 500);
});
test("offline matching labels fixture and unrelated ticket does not match", async () => {
  const wf = await service.infer({
    ticket: state.tickets[0],
    observationEvents: trace,
    mode: "offline_demo",
  });
  const result = await service.match({
    ticket: {
      ...state.tickets[0],
      subject: "Please cancel subscription",
      message: "Cancel my account now",
    },
    workflows: [wf],
    mode: "offline_demo",
  });
  assert.equal(result.workflowId, null);
  assert.equal(result.provenance!.mode, "fixture");
});
test("Nebius transport checks model catalog and validates live output without replacing it with a fixture", async () => {
  const wf = await service.infer({
    ticket: state.tickets[0],
    observationEvents: trace,
    mode: "offline_demo",
  });
  const {
    id,
    createdAt,
    updatedAt,
    demonstrationsCount,
    decisionRules,
    status,
    provenance,
    ...core
  } = wf;
  const calls: string[] = [];
  const live = new AIService(
    {
      apiKey: "test-only",
      baseUrl: "https://api.tokenfactory.nebius.com/v1/",
      fastModel: "nvidia/test-nemotron",
      deepModel: "nvidia/test-nemotron",
    },
    async (url, init) => {
      calls.push(String(url));
      if (String(url).endsWith("/models"))
        return new Response(
          JSON.stringify({ data: [{ id: "nvidia/test-nemotron" }] }),
          { status: 200 },
        );
      const body = JSON.parse(init!.body as string);
      assert.equal(body.model, "nvidia/test-nemotron");
      return new Response(
        JSON.stringify({
          id: "req_test",
          choices: [{ message: { content: JSON.stringify(core) } }],
        }),
        { status: 200 },
      );
    },
  );
  const result = await live.infer({
    ticket: state.tickets[0],
    observationEvents: trace,
    mode: "live",
  });
  assert.equal(result.provenance!.provider, "nebius");
  assert.equal(result.provenance!.mode, "live");
  assert.equal(result.provenance!.requestId, "req_test");
  assert.ok(calls[0].endsWith("/models"));
  validateWorkflow(result);
});
test("malformed live response and invalid model fail visibly without fabricated workflow", async () => {
  const fetcher = async (url: any) =>
    new Response(
      JSON.stringify(
        String(url).endsWith("/models")
          ? { data: [{ id: "nvidia/test-nemotron" }] }
          : { choices: [{ message: { content: "not JSON" } }] },
      ),
    );
  const live = new AIService(
    {
      apiKey: "test-only",
      fastModel: "nvidia/test-nemotron",
      deepModel: "nvidia/test-nemotron",
    },
    fetcher,
  );
  await assert.rejects(
    () =>
      live.infer({
        ticket: state.tickets[0],
        observationEvents: trace,
        mode: "live",
      }),
    /invalid|JSON/i,
  );
  const wrong = new AIService(
    { apiKey: "test-only", deepModel: "nvidia/missing-nemotron" },
    fetcher,
  );
  await assert.rejects(
    () =>
      wrong.infer({
        ticket: state.tickets[0],
        observationEvents: trace,
        mode: "live",
      }),
    /model.*available/i,
  );
});
