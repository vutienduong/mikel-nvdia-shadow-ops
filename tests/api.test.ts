import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createApp } from "../server.ts";
import { AIService } from "../server/ai.ts";
import { createDemoState, OperationsEngine } from "../src/domain/operations.ts";

async function withApi(work: (url: string) => Promise<void>) {
  const server = createApp(new AIService({})).listen(0, "127.0.0.1");
  await once(server, "listening");
  const url = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  try {
    await work(url);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}
const trace = (ticketId: string, approval = false) =>
  [
    "find_customer",
    "get_recent_payments",
    "detect_duplicate_payment",
    "check_refund_policy",
    ...(approval ? ["request_manager_approval"] : []),
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
    entityId: ticketId,
    label: action,
    context: { ticketId },
  }));

test("HTTP API rejects missing credentials, malformed data and unknown API routes without fallback", () =>
  withApi(async (base) => {
    const body = {
      ticket: createDemoState().tickets[0],
      observationEvents: trace("TICK_1042"),
      mode: "live",
    };
    const live = await fetch(`${base}/api/ai/infer-workflow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    assert.equal(live.status, 503);
    assert.match((await live.json()).error, /not configured/i);
    const malformed = await fetch(`${base}/api/ai/infer-workflow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    assert.equal(malformed.status, 400);
    assert.equal((await fetch(`${base}/api/unknown`)).status, 404);
    const invalid = await fetch(`${base}/api/ai/infer-workflow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticket: { id: "only" },
        observationEvents: [],
        mode: "offline_demo",
      }),
    });
    assert.equal(invalid.status, 422);
  }));

test("complete offline API/engine A -> B -> C -> D sequence and autonomous approval checkpoint", () =>
  withApi(async (base) => {
    const post = async (route: string, body: any) => {
      const res = await fetch(`${base}/api/ai/${route}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, mode: "offline_demo" }),
      });
      assert.equal(res.status, 200, await res.clone().text());
      return res.json();
    };
    const ops = new OperationsEngine(createDemoState(), {
      generateReply: (input) => post("generate-reply", input),
    });
    ops.refund("PAY_103", "TICK_1042");
    await ops.draftAndSendReply("TICK_1042");
    ops.closeTicket("TICK_1042");
    const v1 = await post("infer-workflow", {
      ticket: ops.state.tickets[0],
      observationEvents: trace("TICK_1042"),
    });
    v1.status = "active";
    assert.equal(v1.version, 1);
    assert.equal(v1.provenance.mode, "fixture");
    const apr = ops.requestApproval("TICK_1043", 1100, "Verified duplicate");
    assert.throws(() => ops.refund("PAY_202", "TICK_1043"));
    await ops.approve(apr);
    ops.refund("PAY_202", "TICK_1043");
    await ops.draftAndSendReply("TICK_1043");
    ops.closeTicket("TICK_1043");
    const proposal = await post("compare-demonstrations", {
      existingWorkflow: v1,
      newObservationEvents: trace("TICK_1043", true),
      ticket: ops.state.tickets[1],
      demonstrations: [{ events: trace("TICK_1042") }],
    });
    const v2 = structuredClone(v1);
    v2.version = 2;
    v2.steps.splice(4, 0, proposal.insertedStep);
    ops.state.workflows = [v2];
    const match = await post("match-workflow", {
      ticket: ops.state.tickets[2],
      workflows: ops.state.workflows,
    });
    assert.equal(match.workflowId, v2.id);
    const run = await ops.startRun(v2, "TICK_1044");
    assert.equal(run.status, "completed");
    assert.equal(run.workflowVersion, 2);
    assert.equal(ops.state.tickets[2].status, "resolved");
    assert.ok(
      ops.state.messages[2].text.includes(
        ops.state.payments.find((p) => p.id === "PAY_302")!.refundId!,
      ),
    );
    const safe = await ops.startRun(v2, "TICK_1045");
    assert.equal(safe.status, "failed");
    assert.equal(ops.state.tickets[3].status, "open");
    assert.equal(ops.state.runs.length, 2);
    ops.reset();
    const high = await ops.startRun(v2, "TICK_1043");
    assert.equal(high.status, "waiting_approval");
    assert.equal(
      ops.state.payments.find((p) => p.id === "PAY_202")!.status,
      "captured",
    );
    await ops.approve(ops.state.approvals[0].id);
    assert.equal(ops.state.runs[0].status, "completed");
  }));
