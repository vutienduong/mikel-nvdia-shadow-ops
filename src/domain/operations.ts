import { containsRefundAmount } from "./lifecycle";
import {
  INITIAL_TICKETS,
  INITIAL_CUSTOMERS,
  INITIAL_PAYMENTS,
  INITIAL_POLICIES,
} from "../data/seedData";
import type {
  Ticket,
  Customer,
  Payment,
  Policy,
  ApprovalRequest,
  WorkflowDefinition,
  WorkflowRun,
  CustomerMessage,
  AIProvenance,
} from "../types";
import {
  validateWorkflow,
  INPUT_SCHEMAS,
  OUTPUT_SCHEMAS,
  ALIASES,
  resolveArguments,
  evaluateCondition,
} from "./contracts";
export { validateWorkflow } from "./contracts";

export interface OperationsState {
  tickets: Ticket[];
  customers: Customer[];
  payments: Payment[];
  policies: Policy[];
  approvals: ApprovalRequest[];
  workflows: WorkflowDefinition[];
  workflowVersions: WorkflowDefinition[];
  runs: WorkflowRun[];
  messages: CustomerMessage[];
}
export function createDemoState(): OperationsState {
  return structuredClone({
    tickets: INITIAL_TICKETS,
    customers: INITIAL_CUSTOMERS,
    payments: INITIAL_PAYMENTS,
    policies: INITIAL_POLICIES,
    approvals: [],
    workflows: [],
    workflowVersions: [],
    runs: [],
    messages: [],
  });
}
export function paymentTime(raw: string): number {
  return Date.parse(raw.replace(" UTC", "Z").replace(" ", "T"));
}
export function findDuplicate(payments: Payment[], windowMinutes = 2880) {
  const captured = payments
    .filter((p) => p.status === "captured")
    .sort((a, b) => paymentTime(a.chargedAt) - paymentTime(b.chargedAt));
  for (let i = 0; i < captured.length; i++)
    for (let j = i + 1; j < captured.length; j++) {
      const a = captured[i],
        b = captured[j];
      const delta = paymentTime(b.chargedAt) - paymentTime(a.chargedAt);
      if (
        Number.isFinite(delta) &&
        delta >= 0 &&
        delta <= windowMinutes * 60000 &&
        a.customerId === b.customerId &&
        a.currency === b.currency &&
        a.plan === b.plan &&
        a.amount === b.amount &&
        a.amount > 0 &&
        a.id !== b.id
      )
        return { payment: b, original: a, amount: b.amount, paymentId: b.id };
    }
  throw new Error("No verified duplicate payment found");
}
export type ReplyInput = {
  customerName: string;
  refundAmount: number;
  refundId: string;
  ticketSubject: string;
  ticketId: string;
};
export type ReplyResult = { replyText: string; provenance?: AIProvenance };
type Options = {
  generateReply: (input: ReplyInput) => Promise<ReplyResult>;
  onChange?: (state: OperationsState) => void;
};
const uid = (prefix: string) =>
  `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
const now = () => new Date().toISOString();

export class OperationsEngine {
  state: OperationsState;
  private options: Options;
  private generation = 0;
  private active = new Set<string>();
  constructor(state: OperationsState, options: Options) {
    this.state = structuredClone(state);
    this.state.workflowVersions ||= [];
    this.options = options;
    // Interrupted steps cannot safely be replayed after a refresh. Approval checkpoints are resumable.
    for (const run of this.state.runs)
      if (run.status === "running" || run.status === "queued") {
        run.status = "failed";
        run.completedAt = now();
        run.outcomeSummary =
          "Execution interrupted. Review the ledger before starting another run.";
      }
  }
  private emit() {
    this.options.onChange?.(structuredClone(this.state));
  }
  private ticket(id: string) {
    const t = this.state.tickets.find((t) => t.id === id);
    if (!t) throw new Error("Ticket not found");
    return t;
  }
  private payment(id: string) {
    const p = this.state.payments.find((p) => p.id === id);
    if (!p) throw new Error("Payment not found");
    return p;
  }
  private assertUnlocked(ticketId: string, runId?: string) {
    if (
      this.state.runs.some(
        (r) =>
          r.ticketId === ticketId &&
          r.id !== runId &&
          ["running", "waiting_approval", "queued"].includes(r.status),
      )
    )
      throw new Error("Ticket already has an active run");
  }
  checkPolicy(paymentId: string, ticketId: string) {
    const ticket = this.ticket(ticketId),
      payment = this.payment(paymentId);
    const customer = this.state.customers.find(
      (c) => c.id === ticket.customerId,
    );
    if (
      !customer ||
      customer.email !== ticket.customerEmail ||
      payment.customerId !== customer.id
    )
      throw new Error("Customer/payment verification failed");
    if (payment.currency !== "USD")
      throw new Error(
        "Policy ambiguous for this currency; human review required",
      );
    const policy = this.state.policies.find((p) => p.id === "POL_REFUND_01");
    const governance = this.state.policies.find((p) => p.id === "POL_AUTH_02");
    if (
      !policy ||
      !governance ||
      !Number.isFinite(policy.thresholdAmount) ||
      policy.thresholdAmount !== governance.thresholdAmount ||
      policy.thresholdAmount! < 0 ||
      policy.duplicateWindowHours !== 48
    )
      throw new Error("Refund policy ambiguous; human review required");
    const duplicate = findDuplicate(
      this.state.payments.filter((p) => p.customerId === customer.id),
      policy.duplicateWindowHours * 60,
    );
    if (duplicate.paymentId !== paymentId)
      throw new Error(
        "Only the verified duplicate transaction may be refunded",
      );
    return {
      eligible: true as const,
      requiresApproval: payment.amount > policy.thresholdAmount!,
      threshold: policy.thresholdAmount!,
      policyId: policy.id,
      amount: payment.amount,
    };
  }
  requestApproval(
    ticketId: string,
    amount: number,
    reason: string,
    paymentId?: string,
    runId?: string,
  ) {
    this.assertUnlocked(ticketId, runId);
    const ticket = this.ticket(ticketId);
    const payment = paymentId
      ? this.payment(paymentId)
      : findDuplicate(
          this.state.payments.filter((p) => p.customerId === ticket.customerId),
        ).payment;
    this.checkPolicy(payment.id, ticketId);
    if (amount !== payment.amount)
      throw new Error("Approval amount does not match payment");
    const prior = this.state.approvals.find(
      (a) =>
        a.ticketId === ticketId &&
        a.paymentId === payment.id &&
        a.runId === runId &&
        a.status !== "rejected",
    );
    if (prior) return prior.id;
    const id = uid("APR");
    this.state.approvals.unshift({
      id,
      ticketId,
      customerName: ticket.customerName,
      amount,
      currency: payment.currency,
      reason,
      status: "pending",
      createdAt: now(),
      paymentId: payment.id,
      runId,
    });
    ticket.status = "pending_approval";
    this.emit();
    return id;
  }
  private refundForRun(paymentId: string, ticketId: string, runId?: string) {
    this.assertUnlocked(ticketId, runId);
    const payment = this.payment(paymentId),
      ticket = this.ticket(ticketId);
    if (ticket.status === "resolved" || ticket.status === "closed")
      throw new Error("Ticket is already resolved");
    if (payment.status !== "captured")
      throw new Error("Payment has already been refunded or is not captured");
    const policy = this.checkPolicy(paymentId, ticketId);
    if (
      policy.requiresApproval &&
      !this.state.approvals.some(
        (a) =>
          a.ticketId === ticketId &&
          a.paymentId === paymentId &&
          a.amount === payment.amount &&
          a.currency === payment.currency &&
          a.runId === runId &&
          a.status === "approved",
      )
    )
      throw new Error("Manager approval required before refund");
    const refundId = uid("REF");
    Object.assign(payment, {
      status: "refunded",
      refundId,
      refundedAt: now(),
      refundTicketId: ticketId,
    });
    ticket.status = "open";
    this.emit();
    return refundId;
  }
  refund(paymentId: string, ticketId?: string): string {
    const payment = this.payment(paymentId);
    const ticket = ticketId
      ? this.ticket(ticketId)
      : this.state.tickets.find(
          (t) =>
            t.customerId === payment.customerId &&
            ["open", "pending_approval"].includes(t.status),
        );
    if (!ticket) throw new Error("An open matching ticket is required");
    return this.refundForRun(paymentId, ticket.id);
  }
  async draftAndSendReply(ticketId: string): Promise<CustomerMessage> {
    this.assertUnlocked(ticketId);
    const ticket = this.ticket(ticketId);
    const payment = this.state.payments.find(
      (p) =>
        p.customerId === ticket.customerId &&
        p.refundTicketId === ticket.id &&
        p.status === "refunded" &&
        p.refundId,
    );
    if (!payment)
      throw new Error(
        "A verified refund is required before sending a resolution",
      );
    if (
      this.state.messages.some(
        (m) => m.ticketId === ticketId && m.refundId === payment.refundId,
      )
    )
      throw new Error("Customer confirmation already sent");
    const epoch = this.generation;
    const result = await this.options.generateReply({
      ticketId,
      customerName: ticket.customerName,
      refundAmount: payment.amount,
      refundId: payment.refundId!,
      ticketSubject: ticket.subject,
    });
    if (epoch !== this.generation)
      throw new Error("Demo was reset; operation cancelled");
    return this.sendReply(
      ticketId,
      payment,
      result.replyText,
      result.provenance,
    );
  }
  private sendReply(
    ticketId: string,
    payment: Payment,
    text: string,
    provenance?: AIProvenance,
  ) {
    if (
      payment.refundTicketId !== ticketId ||
      !payment.refundId ||
      payment.status !== "refunded" ||
      !text.includes(payment.refundId) ||
      !containsRefundAmount(text, payment.amount)
    )
      throw new Error(
        "Reply must contain the actual refund receipt and amount",
      );
    if (
      this.state.messages.some(
        (m) => m.ticketId === ticketId && m.refundId === payment.refundId,
      )
    )
      throw new Error("Customer confirmation already sent");
    const message = {
      id: uid("MSG"),
      ticketId,
      paymentId: payment.id,
      refundId: payment.refundId,
      text,
      sentAt: now(),
      provenance,
    };
    this.state.messages.push(message);
    this.emit();
    return message;
  }
  private closeForRun(ticketId: string, runId?: string) {
    this.assertUnlocked(ticketId, runId);
    const ticket = this.ticket(ticketId);
    const message = this.state.messages.find((m) => m.ticketId === ticketId);
    const payment =
      message &&
      this.state.payments.find(
        (p) =>
          p.id === message.paymentId &&
          p.customerId === ticket.customerId &&
          p.refundTicketId === ticket.id &&
          p.status === "refunded" &&
          p.refundId === message.refundId,
      );
    if (!payment)
      throw new Error(
        "Successful refund and customer confirmation required before closing",
      );
    ticket.status = "resolved";
    this.emit();
  }
  closeTicket(ticketId: string) {
    this.closeForRun(ticketId);
  }
  async approve(approvalId: string) {
    const approval = this.state.approvals.find((a) => a.id === approvalId);
    if (!approval) throw new Error("Approval not found");
    if (approval.status !== "pending")
      throw new Error("Approval already decided");
    Object.assign(approval, {
      status: "approved",
      approvedBy: "Demo Operations Manager",
      approvedAt: now(),
    });
    this.ticket(approval.ticketId).status = "open";
    this.emit();
    const run = this.state.runs.find((r) => r.id === approval.runId);
    if (run?.status === "waiting_approval") await this.advance(run);
  }
  reject(approvalId: string) {
    const approval = this.state.approvals.find((a) => a.id === approvalId);
    if (!approval) throw new Error("Approval not found");
    if (approval.status !== "pending")
      throw new Error("Approval already decided");
    Object.assign(approval, {
      status: "rejected",
      approvedBy: "Demo Operations Manager",
      approvedAt: now(),
    });
    this.ticket(approval.ticketId).status = "open";
    const run = this.state.runs.find((r) => r.id === approval.runId);
    if (run?.status === "waiting_approval") {
      run.status = "failed";
      run.completedAt = now();
      run.outcomeSummary = "Manager rejected refund; no refund issued";
      const step = run.steps[run.nextStep!];
      if (step) {
        step.status = "failed";
        step.error = run.outcomeSummary;
      }
    }
    this.emit();
  }
  async startRun(
    input: WorkflowDefinition,
    ticketId: string,
  ): Promise<WorkflowRun> {
    const definition = validateWorkflow(input);
    const ticket = this.ticket(ticketId);
    this.assertUnlocked(ticketId);
    if (["resolved", "closed"].includes(ticket.status))
      throw new Error("Ticket already resolved");
    const run: WorkflowRun = {
      id: uid("RUN"),
      workflowId: definition.id,
      workflowName: definition.name,
      workflowVersion: definition.version,
      ticketId,
      customerName: ticket.customerName,
      status: "running",
      startedAt: now(),
      steps: definition.steps.map((s) => ({
        id: s.id,
        skillId: s.skill,
        name: s.name,
        status: "pending",
        latencyMs: 0,
      })),
      definition: structuredClone(definition),
      context: { ticket: structuredClone(ticket) },
      nextStep: 0,
    };
    this.state.runs.unshift(run);
    this.emit();
    await this.advance(run);
    return structuredClone(run);
  }
  async retryRun(runId: string): Promise<WorkflowRun> {
    const run = this.state.runs.find((r) => r.id === runId);
    if (!run || run.status !== "failed" || run.reviewRequired)
      throw new Error(
        "Run is not eligible for automatic retry; request human review",
      );
    this.assertUnlocked(run.ticketId);
    const step = run.steps[run.nextStep!];
    if (
      !step ||
      step.status !== "failed" ||
      !["draft_customer_reply", "send_customer_reply", "close_ticket"].includes(
        step.skillId,
      )
    )
      throw new Error(
        "Only failed communication checkpoints can retry; refund is never replayed",
      );
    if (
      run.steps
        .slice(0, run.nextStep)
        .some((s) => !["completed", "skipped"].includes(s.status))
    )
      throw new Error("Incomplete checkpoint; human review required");
    const receipt = run.context?.refund;
    const payment = this.state.payments.find(
      (p) => p.id === receipt?.paymentId,
    );
    if (
      !payment ||
      payment.status !== "refunded" ||
      payment.refundTicketId !== run.ticketId ||
      payment.refundId !== receipt.refundId ||
      payment.amount !== receipt.amount ||
      payment.customerId !== this.ticket(run.ticketId).customerId ||
      payment.currency !== "USD" ||
      this.ticket(run.ticketId).customerEmail !==
        run.context?.ticket?.customerEmail
    )
      throw new Error(
        "Receipt no longer matches the checkpoint; human review required",
      );
    if (
      step.skillId === "send_customer_reply" &&
      this.state.messages.some(
        (m) => m.ticketId === run.ticketId && m.refundId === receipt.refundId,
      )
    )
      throw new Error("Confirmation already exists; human review required");
    if (["resolved", "closed"].includes(this.ticket(run.ticketId).status))
      throw new Error("Ticket already resolved");
    delete step.error;
    delete run.completedAt;
    delete run.durationMs;
    run.retryCount = (run.retryCount || 0) + 1;
    await this.advance(run);
    return structuredClone(run);
  }
  escalateRun(runId: string, reason: string) {
    const run = this.state.runs.find((r) => r.id === runId);
    if (!run || run.status !== "failed" || !reason.trim())
      throw new Error("A failed run and review reason are required");
    run.reviewRequired = true;
    run.reviewReason = reason.trim().slice(0, 1000);
    this.emit();
  }
  private async advance(run: WorkflowRun) {
    if (this.active.has(run.id)) throw new Error("Run is already executing");
    this.active.add(run.id);
    const epoch = this.generation;
    run.status = "running";
    this.emit();
    try {
      const context = run.context!;
      for (let i = run.nextStep!; i < run.definition!.steps.length; i++) {
        if (epoch !== this.generation) return;
        const def = run.definition!.steps[i],
          trace = run.steps[i];
        run.nextStep = i;
        const started = Date.now();
        trace.status = "running";
        trace.startedAt = now();
        this.emit();
        if (def.condition && !evaluateCondition(def.condition, context)) {
          trace.status = "skipped";
          trace.completedAt = now();
          trace.output = { skipped: true, reason: def.condition.description };
          run.nextStep = i + 1;
          this.emit();
          continue;
        }
        const args = INPUT_SCHEMAS[
          def.skill as keyof typeof INPUT_SCHEMAS
        ].parse(resolveArguments(def.args, context)) as Record<string, any>;
        trace.input = args;
        // A learned v1 without an approval branch must still respect the payment handler's policy.
        if (def.skill === "refund_payment") {
          const policy = this.checkPolicy(args.paymentId, run.ticketId);
          if (
            policy.requiresApproval &&
            !this.state.approvals.some(
              (a) =>
                a.runId === run.id &&
                a.paymentId === args.paymentId &&
                a.status === "approved",
            )
          ) {
            const approvalId = this.requestApproval(
              run.ticketId,
              policy.amount,
              "Policy requires manager sign-off",
              args.paymentId,
              run.id,
            );
            run.status = "waiting_approval";
            trace.status = "pending";
            trace.output = { approvalId, status: "pending" };
            this.emit();
            return;
          }
        }
        const output = await this.executeSkill(def.skill, args, run, context);
        if (epoch !== this.generation) return;
        OUTPUT_SCHEMAS[def.skill as keyof typeof OUTPUT_SCHEMAS].parse(output);
        context[def.id] = output;
        context[ALIASES[def.skill]] = output;
        trace.output = output;
        trace.completedAt = now();
        trace.latencyMs = Date.now() - started;
        if (
          def.skill === "request_manager_approval" &&
          (output as any).status === "pending"
        ) {
          trace.status = "pending";
          run.status = "waiting_approval";
          this.emit();
          return;
        }
        trace.status = "completed";
        run.nextStep = i + 1;
        this.emit();
      }
      run.status = "completed";
      run.completedAt = now();
      run.durationMs = Date.parse(run.completedAt) - Date.parse(run.startedAt);
      run.outcomeSummary =
        "Verified duplicate refunded, customer confirmation saved, ticket resolved";
      this.emit();
    } catch (error) {
      if (epoch !== this.generation) return;
      const trace = run.steps[run.nextStep!];
      if (trace) {
        trace.status = "failed";
        trace.error =
          error instanceof Error ? error.message : "Execution failed";
        trace.completedAt = now();
        trace.latencyMs =
          Date.parse(trace.completedAt) - Date.parse(trace.startedAt!);
      }
      run.status = "failed";
      run.completedAt = now();
      run.durationMs = Date.parse(run.completedAt) - Date.parse(run.startedAt);
      run.outcomeSummary = trace?.error || "Execution failed";
      this.emit();
    } finally {
      this.active.delete(run.id);
    }
  }
  private skillHandlers: Record<
    string,
    (
      args: Record<string, any>,
      run: WorkflowRun,
      context: Record<string, any>,
    ) => Promise<unknown>
  > = {
    find_customer: async (args, run) => {
      const ticket = this.ticket(run.ticketId);
      const customer = this.state.customers.find(
        (c) => c.id === args.customerId,
      );
      if (!customer || customer.email !== ticket.customerEmail)
        throw new Error("Customer not found or verification failed");
      return structuredClone(customer);
    },
    get_recent_payments: async (args) =>
      structuredClone(
        this.state.payments
          .filter((p) => p.customerId === args.customerId)
          .slice(0, args.limit || 100),
      ),
    detect_duplicate_payment: async (args, run) => {
      const ticket = this.ticket(run.ticketId);
      if (
        args.payments.some(
          (p: any) =>
            p.customerId !== ticket.customerId ||
            !this.state.payments.some(
              (x) =>
                x.id === p.id && x.amount === p.amount && x.status === p.status,
            ),
        )
      )
        throw new Error("Payment records failed verification");
      return findDuplicate(args.payments, args.windowMinutes || 2880);
    },
    check_refund_policy: async (args, run) => {
      const result = this.checkPolicy(args.paymentId, run.ticketId);
      if (args.amount !== result.amount)
        throw new Error("Policy amount mismatch");
      return result;
    },
    request_manager_approval: async (args, run, context) => {
      const payment = this.payment(context.duplicate.paymentId);
      if (args.amount !== payment.amount)
        throw new Error("Approval amount mismatch");
      const approvalId = this.requestApproval(
        run.ticketId,
        args.amount,
        args.reason || "Learned approval rule",
        payment.id,
        run.id,
      );
      return {
        approvalId,
        status: this.state.approvals.find((a) => a.id === approvalId)!.status,
        amount: args.amount,
      };
    },
    refund_payment: async (args, run, context) => {
      if (args.paymentId !== context.duplicate.paymentId)
        throw new Error("Refund target is not the verified duplicate");
      const refundId = this.refundForRun(args.paymentId, run.ticketId, run.id);
      return {
        refundId,
        paymentId: args.paymentId,
        amount: this.payment(args.paymentId).amount,
      };
    },
    draft_customer_reply: async (args, run, context) => {
      const ticket = this.ticket(run.ticketId);
      if (
        args.refundId !== context.refund.refundId ||
        args.refundAmount !== context.refund.amount ||
        args.customerName !== ticket.customerName
      )
        throw new Error("Reply facts do not match refund");
      return this.options.generateReply({
        ticketId: ticket.id,
        customerName: args.customerName,
        refundAmount: args.refundAmount,
        refundId: args.refundId,
        ticketSubject: ticket.subject,
      });
    },
    send_customer_reply: async (args, run, context) => {
      if (args.message !== context.reply.replyText)
        throw new Error("Reply differs from reviewed draft");
      const message = this.sendReply(
        run.ticketId,
        this.payment(context.refund.paymentId),
        args.message,
        context.reply.provenance,
      );
      return { messageId: message.id, delivered: true };
    },
    close_ticket: async (args, run) => {
      this.closeForRun(run.ticketId, run.id);
      return { ticketId: run.ticketId, status: "resolved" };
    },
  };
  private async executeSkill(
    skill: string,
    args: Record<string, any>,
    run: WorkflowRun,
    context: Record<string, any>,
  ): Promise<unknown> {
    const ticket = this.ticket(run.ticketId);
    if (args.ticketId && args.ticketId !== ticket.id)
      throw new Error("Skill cannot act on another ticket");
    if (args.customerId && args.customerId !== ticket.customerId)
      throw new Error("Skill cannot act on another customer");
    const handler = this.skillHandlers[skill];
    if (!handler) throw new Error(`Unsupported skill: ${skill}`);
    return handler(args, run, context);
  }
  reset() {
    this.generation++;
    this.state = createDemoState();
    this.active.clear();
    this.emit();
  }
}
