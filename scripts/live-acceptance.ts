import dotenv from "dotenv";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { AIService } from "../server/ai";
import {
  OperationsEngine,
  createDemoState,
  findDuplicate,
} from "../src/domain/operations";
import { validateWorkflow } from "../src/domain/contracts";
dotenv.config({ path: [".env.local", ".env"], quiet: true });
const ai = new AIService({
  apiKey: process.env.NEBIUS_API_KEY,
  baseUrl: process.env.NEBIUS_BASE_URL,
  fastModel: process.env.NEBIUS_FAST_MODEL,
  deepModel: process.env.NEBIUS_DEEP_MODEL,
});
const evidence: any = { date: new Date().toISOString(), cases: [] };
const ops = new OperationsEngine(createDemoState(), {
  generateReply: (input) => ai.reply({ ...input, mode: "live" }),
});
async function teach(ticketId: string, approval = false) {
  const ticket = ops.state.tickets.find((t) => t.id === ticketId)!;
  const events: any[] = [];
  const record = (action: string, output: any) =>
    events.push({
      id: crypto.randomUUID(),
      demonstrationId: "DEMO_" + ticketId,
      sequence: events.length + 1,
      timestamp: new Date().toISOString(),
      type: "tool_action",
      action,
      entityType: "ticket",
      entityId: ticketId,
      label: action,
      context: { ticketId, output },
    });
  const customer = ops.state.customers.find((c) => c.id === ticket.customerId)!;
  record("find_customer", customer);
  const payments = ops.state.payments.filter(
    (p) => p.customerId === customer.id,
  );
  record("get_recent_payments", structuredClone(payments));
  const duplicate = findDuplicate(payments);
  record("detect_duplicate_payment", structuredClone(duplicate));
  record("check_refund_policy", ops.checkPolicy(duplicate.paymentId, ticketId));
  if (approval) {
    const id = ops.requestApproval(
      ticketId,
      duplicate.amount,
      "Verified high-value duplicate",
    );
    record("request_manager_approval", { approvalId: id });
    await ops.approve(id);
  }
  record("refund_payment", {
    refundId: ops.refund(duplicate.paymentId, ticketId),
  });
  const message = await ops.draftAndSendReply(ticketId);
  record("draft_customer_reply", { replyText: message.text });
  record("send_customer_reply", message);
  ops.closeTicket(ticketId);
  record("close_ticket", { status: "resolved" });
  return { ticket, events };
}
try {
  console.log("A: actual manual resolution and live induction");
  const a = await teach("TICK_1042");
  const v1 = await ai.infer({
    ticket: a.ticket,
    observationEvents: a.events,
    mode: "live",
  });
  v1.status = "active";
  assert.equal(v1.provenance?.mode, "live");
  evidence.v1 = v1;
  console.log("B: approved manual resolution and live comparison");
  const b = await teach("TICK_1043", true);
  const proposal = await ai.compare({
    existingWorkflow: v1,
    newObservationEvents: b.events,
    ticket: b.ticket,
    demonstrations: [{ events: a.events }],
    mode: "live",
  });
  assert.equal(proposal.classification, "workflow_variant");
  assert.ok(proposal.insertedStep);
  const v2 = validateWorkflow({
    ...v1,
    version: 2,
    steps: [
      ...v1.steps.slice(0, 4),
      { ...proposal.insertedStep, condition: proposal.condition },
      ...v1.steps.slice(4),
    ],
  });
  evidence.proposal = proposal;
  evidence.v2 = v2;
  ops.state.workflows = [v2];
  console.log("C: live matching and autonomous resolution");
  const match = await ai.match({
    ticket: ops.state.tickets[2],
    workflows: [v2],
    mode: "live",
  });
  assert.equal(match.workflowId, v2.id);
  assert.ok(match.confidence >= 0.7);
  const c = await ops.startRun(v2, "TICK_1044");
  assert.equal(c.status, "completed", c.outcomeSummary);
  evidence.cases.push({ case: "C", match, run: c });
  console.log("D: no duplicate safe stop");
  const d = await ops.startRun(v2, "TICK_1045");
  assert.equal(d.status, "failed");
  assert.equal(ops.state.tickets[3].status, "open");
  evidence.cases.push({ case: "D", run: d });
  evidence.messages = ops.state.messages;
  evidence.status = "passed";
  console.log("LIVE ACCEPTANCE PASSED");
} catch (error) {
  evidence.status = "failed";
  evidence.error = error instanceof Error ? error.message : "Unknown error";
  console.log("LIVE ACCEPTANCE FAILED:", evidence.error);
  process.exitCode = 1;
} finally {
  await mkdir("docs/evidence", { recursive: true });
  await writeFile(
    "docs/evidence/live-acceptance.json",
    JSON.stringify(evidence, null, 2) + "\n",
  );
}
