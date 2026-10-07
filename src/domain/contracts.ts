import { z } from "zod";
import type { WorkflowDefinition } from "../types";

const id = z
  .string()
  .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/)
  .max(100);
const text = z.string().min(1).max(4000);
export const SKILL_IDS = [
  "find_customer",
  "get_recent_payments",
  "detect_duplicate_payment",
  "check_refund_policy",
  "request_manager_approval",
  "refund_payment",
  "draft_customer_reply",
  "send_customer_reply",
  "close_ticket",
] as const;
export const INPUT_SCHEMAS = {
  find_customer: z.object({ customerId: text }).strict(),
  get_recent_payments: z
    .object({
      customerId: text,
      limit: z.number().int().min(1).max(100).optional(),
    })
    .strict(),
  detect_duplicate_payment: z
    .object({
      payments: z.array(z.unknown()).max(100),
      windowMinutes: z.number().positive().max(2880).optional(),
    })
    .strict(),
  check_refund_policy: z
    .object({ paymentId: text, amount: z.number().positive() })
    .strict(),
  request_manager_approval: z
    .object({
      ticketId: text,
      amount: z.number().positive(),
      reason: text.optional(),
    })
    .strict(),
  refund_payment: z
    .object({ paymentId: text, reason: text.optional() })
    .strict(),
  draft_customer_reply: z
    .object({
      ticketId: text,
      customerName: text,
      refundAmount: z.number().positive(),
      refundId: text,
    })
    .strict(),
  send_customer_reply: z.object({ ticketId: text, message: text }).strict(),
  close_ticket: z
    .object({ ticketId: text, resolutionNote: text.optional() })
    .strict(),
};
export const OUTPUT_SCHEMAS = {
  find_customer: z.object({ id: text, name: text, email: text }).passthrough(),
  get_recent_payments: z.array(
    z
      .object({
        id: text,
        customerId: text,
        amount: z.number(),
        currency: text,
        plan: text,
        chargedAt: text,
        status: z.enum(["captured", "refunded", "failed"]),
      })
      .passthrough(),
  ),
  detect_duplicate_payment: z
    .object({
      paymentId: text,
      amount: z.number().positive(),
      payment: z.object({ id: text }).passthrough(),
      original: z.object({ id: text }).passthrough(),
    })
    .passthrough(),
  check_refund_policy: z
    .object({
      eligible: z.literal(true),
      requiresApproval: z.boolean(),
      threshold: z.number(),
      policyId: text,
    })
    .passthrough(),
  request_manager_approval: z.object({
    approvalId: text,
    status: z.enum(["pending", "approved"]),
    amount: z.number(),
  }),
  refund_payment: z.object({
    refundId: text,
    paymentId: text,
    amount: z.number().positive(),
  }),
  draft_customer_reply: z
    .object({ replyText: text, provenance: z.unknown().optional() })
    .strict(),
  send_customer_reply: z.object({
    messageId: text,
    delivered: z.literal(true),
  }),
  close_ticket: z.object({ ticketId: text, status: z.literal("resolved") }),
};
export const ConditionSchema = z
  .object({
    field: text,
    operator: z.enum([">", "<", "==", "!="]),
    value: z.union([z.number().finite(), z.string(), z.boolean()]),
    description: text,
  })
  .strict();
export const StepSchema = z
  .object({
    id,
    skill: z.enum(SKILL_IDS),
    name: text,
    description: text,
    args: z.record(z.string(), z.unknown()),
    condition: ConditionSchema.optional(),
  })
  .strict();
export const WorkflowSchema = z
  .object({
    id,
    slug: id,
    name: text,
    version: z.number().int().positive(),
    description: text,
    trigger: z
      .object({
        type: z.literal("support_ticket"),
        intent: z.literal("duplicate_payment"),
      })
      .strict(),
    inputs: z.array(z.literal("ticket_id")).length(1),
    steps: z.array(StepSchema).min(1).max(30),
    confidence: z.number().min(0).max(1),
    status: z.enum(["active", "draft", "archived"]),
    createdAt: text,
    updatedAt: text,
    demonstrationsCount: z.number().int().nonnegative(),
    sourceDemonstrationIds: z.array(text).optional(),
    humanEditedAt: z.string().optional(),
    decisionRules: z
      .array(
        z
          .object({
            id,
            description: text,
            conditionStr: text,
            confidence: z.number().min(0).max(1),
            discoveredAt: text,
          })
          .strict(),
      )
      .max(30),
    provenance: z
      .object({
        provider: z.enum(["nebius", "offline_demo"]),
        model: text,
        mode: z.enum(["live", "fixture"]),
        requestId: text.optional(),
        generatedAt: text,
      })
      .strict()
      .optional(),
  })
  .strict();
export const ALIASES: Record<string, string> = {
  find_customer: "customer",
  get_recent_payments: "payments",
  detect_duplicate_payment: "duplicate",
  check_refund_policy: "policy",
  request_manager_approval: "approval",
  refund_payment: "refund",
  draft_customer_reply: "reply",
  send_customer_reply: "message",
  close_ticket: "closed",
};
const properties: Record<string, string[]> = {
  ticket: [
    "id",
    "customerId",
    "customerName",
    "customerEmail",
    "subject",
    "message",
    "amount",
    "currency",
    "intent",
    "status",
  ],
  find_customer: ["id", "name", "email", "plan", "status"],
  get_recent_payments: [],
  detect_duplicate_payment: [
    "paymentId",
    "amount",
    "payment",
    "payment.id",
    "payment.amount",
    "original",
    "original.id",
    "original.amount",
  ],
  check_refund_policy: [
    "eligible",
    "requiresApproval",
    "threshold",
    "policyId",
    "amount",
  ],
  request_manager_approval: ["approvalId", "status", "amount"],
  refund_payment: ["refundId", "paymentId", "amount"],
  draft_customer_reply: ["replyText"],
  send_customer_reply: ["messageId", "delivered"],
  close_ticket: ["ticketId", "status"],
};
function checkPath(path: string, roots: Map<string, string>) {
  const [root, ...rest] = path.split(".");
  const kind = roots.get(root);
  if (
    !kind ||
    path
      .split(".")
      .some((p) => ["__proto__", "constructor", "prototype"].includes(p)) ||
    (rest.length && !properties[kind]?.includes(rest.join(".")))
  )
    throw new Error(`Invalid workflow reference: ${path}`);
}
export function validateWorkflow(input: unknown): WorkflowDefinition {
  const wf = WorkflowSchema.parse(input);
  const roots = new Map([["ticket", "ticket"]]);
  const ids = new Set<string>();
  const skills = new Set<string>();
  for (const step of wf.steps) {
    if (
      ids.has(step.id) ||
      roots.has(step.id) ||
      (Object.values(ALIASES).includes(step.id) &&
        step.id !== ALIASES[step.skill])
    )
      throw new Error(`Duplicate or reserved step ID: ${step.id}`);
    ids.add(step.id);
    const shape = INPUT_SCHEMAS[step.skill].shape as Record<string, z.ZodType>;
    for (const key of Object.keys(step.args))
      if (!(key in shape))
        throw new Error(`Unsupported argument ${step.skill}.${key}`);
    for (const [key, schema] of Object.entries(shape))
      if (!(key in step.args) && !schema.isOptional())
        throw new Error(`Missing argument ${step.skill}.${key}`);
    for (const [key, value] of Object.entries(step.args)) {
      if (typeof value === "string" && value.includes("{{")) {
        if (!/^\{\{[a-zA-Z][\w]*(?:\.[a-zA-Z][\w]*)*\}\}$/.test(value))
          throw new Error("References must occupy the complete argument");
        checkPath(value.slice(2, -2), roots);
      } else shape[key].parse(value);
    }
    if (step.condition) checkPath(step.condition.field, roots);
    if (skills.has(step.skill))
      throw new Error(`Duplicate skill step: ${step.skill}`);
    // Effects and prerequisites must be unconditional; only an approval branch is optional.
    if (step.condition && step.skill !== "request_manager_approval")
      throw new Error("Only approval steps may be conditional in V1");
    const prerequisites: Record<string, string[]> = {
      get_recent_payments: ["find_customer"],
      detect_duplicate_payment: ["get_recent_payments"],
      check_refund_policy: ["detect_duplicate_payment"],
      request_manager_approval: ["check_refund_policy"],
      refund_payment: ["check_refund_policy"],
      draft_customer_reply: ["refund_payment"],
      send_customer_reply: ["draft_customer_reply"],
      close_ticket: ["send_customer_reply"],
    };
    if (prerequisites[step.skill]?.some((s) => !skills.has(s)))
      throw new Error(`Missing prerequisite for ${step.skill}`);
    skills.add(step.skill);
    roots.set(step.id, step.skill);
    roots.set(ALIASES[step.skill], step.skill);
  }
  for (const required of [
    "find_customer",
    "get_recent_payments",
    "detect_duplicate_payment",
    "check_refund_policy",
    "refund_payment",
    "draft_customer_reply",
    "send_customer_reply",
    "close_ticket",
  ])
    if (!skills.has(required))
      throw new Error(`Incomplete workflow: ${required}`);
  return wf as WorkflowDefinition;
}
export function resolveArguments(
  args: Record<string, unknown>,
  context: Record<string, any>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(args).map(([k, v]) => [
      k,
      typeof v === "string" && /^\{\{.*\}\}$/.test(v)
        ? readPath(v.slice(2, -2), context)
        : v,
    ]),
  );
}
export function readPath(path: string, context: Record<string, any>): any {
  let value: any = context;
  for (const key of path.split(".")) {
    if (
      ["__proto__", "constructor", "prototype"].includes(key) ||
      value == null ||
      !Object.hasOwn(value, key)
    )
      throw new Error(`Unresolved reference: ${path}`);
    value = value[key];
  }
  return value;
}
export function evaluateCondition(
  condition: z.infer<typeof ConditionSchema>,
  context: Record<string, any>,
): boolean {
  const value = readPath(condition.field, context);
  if (typeof value !== typeof condition.value)
    throw new Error("Condition operands have different types");
  switch (condition.operator) {
    case ">":
      return value > condition.value;
    case "<":
      return value < condition.value;
    case "==":
      return value === condition.value;
    case "!=":
      return value !== condition.value;
  }
}
export const ObservationSchema = z.object({
  id: text,
  demonstrationId: text,
  sequence: z.number().int().positive(),
  timestamp: text,
  type: z.literal("tool_action"),
  action: z.enum(SKILL_IDS),
  entityType: z.enum(["customer", "payment", "policy", "approval", "ticket"]),
  entityId: text,
  label: text,
  context: z.record(z.string(), z.unknown()),
});
export const TicketSchema = z
  .object({
    id: text,
    customerId: text,
    customerName: text,
    customerEmail: text,
    subject: text,
    message: text,
    intent: z.enum(["duplicate_payment", "cancellation", "general_inquiry"]),
    status: z.enum(["open", "pending_approval", "resolved", "closed"]),
    createdAt: text,
    amount: z.number().optional(),
    currency: text.optional(),
    priority: z.enum(["low", "medium", "high"]),
    tags: z.array(text),
  })
  .strict();
export const MatchSchema = z
  .object({
    workflowId: z.string().nullable(),
    intent: z.enum(["duplicate_payment", "cancellation", "general_inquiry"]),
    confidence: z.number().min(0).max(1),
    reasoning: text,
  })
  .strict();
export const ProposalSchema = z
  .object({
    classification: z.enum([
      "same_workflow",
      "workflow_variant",
      "new_workflow",
    ]),
    workflowId: text,
    confidence: z.number().min(0).max(1),
    reasoning: text,
    ruleDescription: text.optional(),
    conditionStr: text.optional(),
    condition: ConditionSchema.optional(),
    insertedStep: StepSchema.optional(),
    workflow: WorkflowSchema.optional(),
  })
  .strict();
