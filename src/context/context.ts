import { createContext } from "react";
import type { OperationsEngine } from "../domain/operations";
import type {
  Ticket,
  Customer,
  Payment,
  Policy,
  ApprovalRequest,
  ObservationEvent,
  WorkflowDefinition,
  WorkflowRun,
  ActivityItem,
  SkillSchedule,
  AIProvenance,
  CustomerMessage,
  Demonstration,
} from "../types";

export interface AppContextType {
  // Navigation
  activeTab: "workspace" | "skills" | "runs" | "analytics" | "schedules";
  setActiveTab: (
    tab: "workspace" | "skills" | "runs" | "analytics" | "schedules",
  ) => void;
  workspaceSubTab:
    | "inbox"
    | "customers"
    | "payments"
    | "policies"
    | "approvals"
    | "activity";
  setWorkspaceSubTab: (
    tab:
      | "inbox"
      | "customers"
      | "payments"
      | "policies"
      | "approvals"
      | "activity",
  ) => void;

  // Schedules (Cron-based automated skill triggers)
  schedules: SkillSchedule[];
  addSchedule: (
    sched: Omit<
      SkillSchedule,
      "id" | "createdAt" | "executionCount" | "successCount" | "failureCount"
    >,
  ) => void;
  updateSchedule: (id: string, updates: Partial<SkillSchedule>) => void;
  toggleScheduleStatus: (id: string) => void;
  deleteSchedule: (id: string) => void;
  triggerScheduleNow: (id: string) => Promise<void>;

  // Activity Drawer in Workspace
  isActivityDrawerOpen: boolean;
  setIsActivityDrawerOpen: (open: boolean) => void;
  activities: ActivityItem[];
  recordActivity: (
    activity: Omit<ActivityItem, "id" | "timestamp" | "timeFormatted"> &
      Partial<Pick<ActivityItem, "id" | "timestamp" | "timeFormatted">>,
  ) => void;
  clearActivities: () => void;

  aiMode: "live" | "offline_demo";
  setAiMode: (mode: "live" | "offline_demo") => void;
  aiConfigured: boolean;
  matchingWorkflow: {
    workflowId: string | null;
    confidence: number;
    reasoning: string;
    provenance: AIProvenance;
    intent: string;
  } | null;
  isMatching: boolean;
  matchingError: string | null;
  learningError: string | null;
  messages: CustomerMessage[];
  draftAndSendReply: (ticketId: string) => Promise<void>;
  checkRefundPolicy: (
    paymentId: string,
    ticketId: string,
  ) => ReturnType<OperationsEngine["checkPolicy"]>;
  // Data
  tickets: Ticket[];
  customers: Customer[];
  payments: Payment[];
  policies: Policy[];
  approvals: ApprovalRequest[];
  selectedTicketId: string | null;
  setSelectedTicketId: (id: string | null) => void;
  selectedCustomer: Customer | null;
  selectedPayments: Payment[];

  // Teaching Mode & Brain
  isTeaching: boolean;
  startTeaching: () => void;
  stopTeachingAndLearn: () => Promise<void>;
  cancelTeaching: () => void;
  observationEvents: ObservationEvent[];
  recordAction: (
    action: string,
    entityType: "customer" | "payment" | "policy" | "approval" | "ticket",
    entityId: string,
    label: string,
    context?: Record<string, any>,
  ) => void;

  // AI Workflow Draft & Refinement
  isInferring: boolean;
  draftWorkflow: WorkflowDefinition | null;
  setDraftWorkflow: (wf: WorkflowDefinition | null) => void;
  saveDraftWorkflow: (wf: WorkflowDefinition) => void;

  refinementProposal: any | null;
  setRefinementProposal: (proposal: any | null) => void;
  applyRefinement: () => void;

  // Workflows & Runs
  workflows: WorkflowDefinition[];
  workflowVersions: WorkflowDefinition[];
  workflowDemonstrations: Demonstration[];
  updateWorkflow: (id: string, edited: unknown) => void;
  retryRun: (id: string) => Promise<void>;
  escalateRun: (id: string, reason: string) => void;
  runs: WorkflowRun[];
  activeExecutionRun: WorkflowRun | null;
  setActiveExecutionRun: (run: WorkflowRun | null) => void;
  executeWorkflowOnTicket: (
    workflowId: string,
    ticketId: string,
  ) => Promise<void>;

  // Manual Operations in Workspace
  issueRefund: (paymentId: string, ticketId?: string) => Promise<string>;
  submitApprovalRequest: (
    ticketId: string,
    amount: number,
    reason: string,
  ) => string;
  approveRequest: (approvalId: string) => void;
  rejectRequest: (approvalId: string) => void;
  resolveTicket: (ticketId: string) => void;

  // Reset
  resetAll: () => void;

  // Toast notifications
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

export const AppContext = createContext<AppContextType | null>(null);
