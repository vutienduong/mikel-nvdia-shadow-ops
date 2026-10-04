export type TicketStatus = "open" | "pending_approval" | "resolved" | "closed";

export interface Ticket {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  message: string;
  intent: "duplicate_payment" | "cancellation" | "general_inquiry";
  status: TicketStatus;
  createdAt: string;
  amount?: number;
  currency?: string;
  priority: "low" | "medium" | "high";
  tags: string[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  plan: string;
  joinedDate: string;
  lifetimeValue: number;
  status: "active" | "delinquent" | "trial";
}

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  status: "captured" | "refunded" | "failed";
  chargedAt: string;
  plan: string;
  description: string;
  refundId?: string;
  refundedAt?: string;
  refundTicketId?: string;
}

export interface Policy {
  id: string;
  title: string;
  category: string;
  content: string;
  thresholdAmount?: number;
  duplicateWindowHours?: number;
  lastUpdated: string;
  version: string;
}

export interface ApprovalRequest {
  id: string;
  ticketId: string;
  customerName: string;
  amount: number;
  currency: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  paymentId?: string;
  runId?: string;
}

export interface ObservationEvent {
  id: string;
  demonstrationId: string;
  sequence: number;
  timestamp: string;
  type: "tool_action";
  action: string;
  entityType: "customer" | "payment" | "policy" | "approval" | "ticket";
  entityId: string;
  label: string;
  context: Record<string, any>;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  riskLevel: "low" | "medium" | "high";
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
}

export interface WorkflowCondition {
  field: string;
  operator: ">" | "<" | "==" | "!=";
  value: any;
  description: string;
}

export interface WorkflowStep {
  id: string;
  skill: string;
  name: string;
  description: string;
  args: Record<string, any>;
  condition?: WorkflowCondition;
}

export interface DecisionRule {
  id: string;
  description: string;
  conditionStr: string;
  confidence: number;
  discoveredAt: string;
}

export interface WorkflowDefinition {
  id: string;
  slug: string;
  name: string;
  version: number;
  description: string;
  trigger: {
    type: "support_ticket";
    intent: string;
  };
  inputs: string[];
  steps: WorkflowStep[];
  confidence: number;
  status: "active" | "draft" | "archived";
  createdAt: string;
  updatedAt: string;
  demonstrationsCount: number;
  decisionRules: DecisionRule[];
  sourceDemonstrationIds?: string[];
  humanEditedAt?: string;
  provenance?: AIProvenance;
}

export interface WorkflowRunStep {
  id: string;
  skillId: string;
  name: string;
  status: "pending" | "running" | "completed" | "skipped" | "failed";
  startedAt?: string;
  completedAt?: string;
  latencyMs: number;
  input?: any;
  output?: any;
  error?: string;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  workflowName: string;
  workflowVersion: number;
  ticketId: string;
  customerName: string;
  status: "queued" | "running" | "waiting_approval" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  steps: WorkflowRunStep[];
  outcomeSummary?: string;
  definition?: WorkflowDefinition;
  context?: Record<string, any>;
  nextStep?: number;
  reviewRequired?: boolean;
  reviewReason?: string;
  retryCount?: number;
}

export interface AIProvenance {
  provider: "nebius" | "offline_demo";
  model: string;
  mode: "live" | "fixture";
  requestId?: string;
  generatedAt: string;
}

export interface CustomerMessage {
  id: string;
  ticketId: string;
  paymentId: string;
  refundId: string;
  text: string;
  sentAt: string;
  provenance?: AIProvenance;
}

export interface Demonstration {
  id: string;
  ticketId: string;
  events: ObservationEvent[];
  startedAt: string;
  endedAt?: string;
  workflowId?: string;
}

export type ActivityCategory =
  | "task"
  | "demonstration"
  | "execution"
  | "governance";

export interface ActivityItem {
  id: string;
  category: ActivityCategory;
  title: string;
  description: string;
  timestamp: string;
  timeFormatted: string;
  ticketId?: string;
  customerName?: string;
  status: "success" | "pending" | "warning" | "info" | "failed";
  metadata?: Record<string, any>;
  runId?: string;
  workflowId?: string;
  skillId?: string;
}

export interface SkillSchedule {
  id: string;
  workflowId: string;
  workflowName: string;
  cronExpression: string;
  humanReadable: string;
  description: string;
  timezone: string;
  status: "active" | "paused";
  targetScope: "matching_tickets" | "pending_inbox" | "reconciliation_scan";
  lastRunAt?: string;
  nextRunAt: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
}
