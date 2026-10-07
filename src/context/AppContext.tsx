import React, { useContext, useState, useEffect, useRef } from "react";
import {
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
import {
  OperationsEngine,
  createDemoState,
  type OperationsState,
} from "../domain/operations";
import {
  validateWorkflow,
  ProposalSchema,
  MatchSchema,
  WorkflowSchema,
} from "../domain/contracts";
import { AppContext, type AppContextType } from "./context";

import { archiveVersion, editWorkflow } from "../domain/lifecycle";

const STORAGE_KEY = "shadowops_operations_v2";
function readStorage<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
function loadOperations(): OperationsState {
  const seed = createDemoState(),
    saved = readStorage<OperationsState>(STORAGE_KEY, seed);
  try {
    if (
      ![
        "tickets",
        "customers",
        "payments",
        "policies",
        "approvals",
        "workflows",
        "runs",
        "messages",
      ].every((k) => Array.isArray(saved[k as keyof OperationsState]))
    )
      return seed;
    saved.workflows.forEach(validateWorkflow);
    saved.workflowVersions = saved.workflowVersions || [];
    saved.workflowVersions.forEach(validateWorkflow);
    return saved;
  } catch {
    return seed;
  }
}
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeTab, setActiveTab] =
    useState<AppContextType["activeTab"]>("workspace");
  const [workspaceSubTab, setWorkspaceSubTab] =
    useState<AppContextType["workspaceSubTab"]>("inbox");
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
  const [operations, setOperations] = useState<OperationsState>(loadOperations);
  const [schedules, setSchedules] = useState<SkillSchedule[]>(() =>
    readStorage("shadowops_schedules", []),
  );
  const [activities, setActivities] = useState<ActivityItem[]>(() =>
    readStorage("shadowops_activities", []),
  );
  const [selectedId, setSelectedId] = useState<string | null>("TICK_1042");
  const [isTeaching, setIsTeaching] = useState(false);
  const [observationEvents, setObservationEvents] = useState<
    ObservationEvent[]
  >([]);
  const [isInferring, setIsInferring] = useState(false);
  const [draftWorkflow, setDraftWorkflow] = useState<WorkflowDefinition | null>(
    null,
  );
  const [refinementProposal, setRefinementProposal] = useState<any | null>(
    null,
  );
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [learningError, setLearningError] = useState<string | null>(null);
  const [aiMode, setMode] = useState<"live" | "offline_demo">(() =>
    readStorage("shadowops_ai_mode", "live"),
  );
  const [aiConfigured, setAiConfigured] = useState(false);
  const [matchingWorkflow, setMatchingWorkflow] =
    useState<AppContextType["matchingWorkflow"]>(null);
  const [matchingError, setMatchingError] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const aiModeRef = useRef(aiMode);
  aiModeRef.current = aiMode;
  const session = useRef<Demonstration | null>(null);
  const demonstrations = useRef<Demonstration[]>(
    readStorage("shadowops_demonstrations", []),
  );
  const epoch = useRef(0);
  const requests = useRef(new Set<AbortController>());
  const busyReply = useRef(new Set<string>());
  const engineRef = useRef<OperationsEngine | null>(null);
  async function apiPost(
    route: string,
    body: Record<string, unknown>,
    signal?: AbortSignal,
  ) {
    const controller = new AbortController();
    requests.current.add(controller);
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    try {
      const res = await fetch(`/api/ai/${route}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, mode: aiModeRef.current }),
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(120000),
        ]),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || `AI request failed (${res.status})`);
      return data;
    } finally {
      requests.current.delete(controller);
      signal?.removeEventListener("abort", abort);
    }
  }
  if (!engineRef.current)
    engineRef.current = new OperationsEngine(operations, {
      generateReply: (input) => apiPost("generate-reply", input),
      onChange: (state) => {
        setOperations(state);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      },
    });
  const engine = engineRef.current;
  const {
    tickets,
    customers,
    payments,
    policies,
    approvals,
    workflows,
    runs,
    messages,
  } = operations;
  const selectedTicketId = selectedId;
  const selectedTicket = tickets.find((t) => t.id === selectedId) || null;
  const selectedCustomer =
    customers.find((c) => c.id === selectedTicket?.customerId) || null;
  const selectedPayments = payments.filter(
    (p) => p.customerId === selectedCustomer?.id,
  );
  const activeExecutionRun = runs.find((r) => r.id === activeRunId) || null;
  const setActiveExecutionRun = (run: WorkflowRun | null) =>
    setActiveRunId(run?.id || null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(
      () => setToastMessage((current) => (current === msg ? null : current)),
      5000,
    );
  };
  const recordActivity = (
    activity: Parameters<AppContextType["recordActivity"]>[0],
  ) => {
    const date = new Date();
    setActivities((prev) => [
      {
        id: `ACT_${crypto.randomUUID()}`,
        timestamp: date.toISOString(),
        timeFormatted: date.toLocaleTimeString(),
        ...activity,
      },
      ...prev,
    ]);
  };
  const clearActivities = () => setActivities([]);
  useEffect(() => {
    localStorage.setItem("shadowops_activities", JSON.stringify(activities));
  }, [activities]);
  useEffect(() => {
    localStorage.setItem("shadowops_schedules", JSON.stringify(schedules));
  }, [schedules]);
  useEffect(() => {
    publish();
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => setAiConfigured(!!data.ai?.configured))
      .catch(() => {});
  }, []);
  const setSelectedTicketId = (id: string | null) => {
    if (busyReply.current.size > 0) {
      showToast("Wait for the customer reply before changing tickets.");
      return;
    }
    if (session.current && id !== session.current.ticketId) {
      showToast("Finish or cancel this demonstration before changing tickets.");
      return;
    }
    setSelectedId(id);
  };
  const setAiMode = (mode: "live" | "offline_demo") => {
    if (
      busyReply.current.size > 0 ||
      isTeaching ||
      isInferring ||
      runs.some((r) => ["running", "waiting_approval"].includes(r.status))
    ) {
      showToast("Finish the current session/run before changing AI mode.");
      return;
    }
    setMode(mode);
    localStorage.setItem("shadowops_ai_mode", JSON.stringify(mode));
    setLearningError(null);
  };
  const recordAction: AppContextType["recordAction"] = (
    action,
    entityType,
    entityId,
    label,
    context = {},
  ) => {
    recordActivity({
      category: session.current ? "demonstration" : "task",
      title: action,
      description: label,
      ticketId: session.current?.ticketId || selectedId || undefined,
      status: "success",
      metadata: context,
    });
    const demo = session.current;
    if (!demo) return;
    if (
      ![
        "find_customer",
        "get_recent_payments",
        "detect_duplicate_payment",
        "check_refund_policy",
        "request_manager_approval",
        "refund_payment",
        "draft_customer_reply",
        "send_customer_reply",
        "close_ticket",
      ].includes(action)
    )
      return;
    const event: ObservationEvent = {
      id: `EVT_${crypto.randomUUID()}`,
      demonstrationId: demo.id,
      sequence: demo.events.length + 1,
      timestamp: new Date().toISOString(),
      type: "tool_action",
      action,
      entityType,
      entityId,
      label,
      context: { ...context, ticketId: demo.ticketId },
    };
    demo.events.push(event);
    setObservationEvents([...demo.events]);
  };
  const startTeaching = () => {
    if (
      busyReply.current.size > 0 ||
      !selectedTicket ||
      selectedTicket.status !== "open" ||
      isInferring ||
      runs.some((r) => ["running", "waiting_approval"].includes(r.status))
    ) {
      showToast("Select an open ticket without an active run before teaching.");
      return;
    }
    session.current = {
      id: `DEMO_${crypto.randomUUID()}`,
      ticketId: selectedTicket.id,
      events: [],
      startedAt: new Date().toISOString(),
    };
    setObservationEvents([]);
    setIsTeaching(true);
    setLearningError(null);
    showToast("Teach Mode active. Complete the ticket, then Stop & Learn.");
  };
  const cancelTeaching = () => {
    session.current = null;
    setIsTeaching(false);
    setObservationEvents([]);
  };
  const stopTeachingAndLearn = async () => {
    const demo = session.current;
    if (!demo || !demo.events.length) {
      showToast("No demonstration actions recorded.");
      return;
    }
    if (
      engine.state.tickets.find((t) => t.id === demo.ticketId)?.status !==
      "resolved"
    ) {
      showToast(
        "Complete refund, customer reply and ticket closure before learning.",
      );
      return;
    }
    const generation = epoch.current;
    setIsInferring(true);
    setIsTeaching(false);
    setLearningError(null);
    const ticket = engine.state.tickets.find((t) => t.id === demo.ticketId)!;
    demo.endedAt = new Date().toISOString();
    const normalized = demo.events.filter(
      (e, i, all) =>
        i === 0 ||
        e.action !== all[i - 1].action ||
        e.entityId !== all[i - 1].entityId,
    );
    try {
      const existing = engine.state.workflows.find(
        (w) =>
          w.status === "active" && w.trigger.intent === "duplicate_payment",
      );
      if (!existing) {
        const data = await apiPost("infer-workflow", {
          ticket,
          observationEvents: normalized,
        });
        if (generation !== epoch.current) return;
        setDraftWorkflow(validateWorkflow(data));
      } else {
        const data = await apiPost("compare-demonstrations", {
          existingWorkflow: existing,
          newObservationEvents: normalized,
          ticket,
          demonstrations: demonstrations.current
            .filter((d) => d.workflowId === existing.id)
            .slice(-10),
        });
        if (generation !== epoch.current) return;
        const proposal = ProposalSchema.parse(
          Object.fromEntries(
            Object.entries(data).filter(([key]) => key !== "provenance"),
          ),
        );
        if (proposal.classification === "same_workflow") {
          showToast(
            "This demonstration matches the existing workflow; no new rule proposed.",
          );
        } else if (
          proposal.classification === "new_workflow" &&
          proposal.workflow
        ) {
          setDraftWorkflow(
            validateWorkflow({
              ...proposal.workflow,
              provenance: data.provenance,
            }),
          );
        } else if (proposal.classification === "workflow_variant") {
          setRefinementProposal({ ...proposal, provenance: data.provenance });
        } else
          throw new Error("Model did not provide a supported workflow update.");
        demo.workflowId = existing.id;
      }
      demonstrations.current.push(structuredClone(demo));
      localStorage.setItem(
        "shadowops_demonstrations",
        JSON.stringify(demonstrations.current),
      );
      session.current = null;
    } catch (error) {
      if (generation !== epoch.current) return;
      const msg = error instanceof Error ? error.message : "Learning failed";
      setLearningError(msg);
      showToast(msg);
      setIsTeaching(true);
    } finally {
      if (generation === epoch.current) setIsInferring(false);
    }
  };
  function publish() {
    const snapshot = structuredClone(engine.state);
    setOperations(snapshot);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }
  const saveDraftWorkflow = (input: WorkflowDefinition) => {
    try {
      const latest = demonstrations.current.at(-1);
      const wf = validateWorkflow({
        ...input,
        status: "active",
        sourceDemonstrationIds: latest ? [latest.id] : [],
      });
      engine.state.workflows.unshift(wf);
      if (latest) latest.workflowId = wf.id;
      localStorage.setItem(
        "shadowops_demonstrations",
        JSON.stringify(demonstrations.current),
      );
      publish();
      setDraftWorkflow(null);
      showToast(`Saved ${wf.name} v${wf.version}.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Invalid workflow");
    }
  };
  const applyRefinement = () => {
    if (!refinementProposal) return;
    try {
      const proposal = ProposalSchema.parse(
        Object.fromEntries(
          Object.entries(refinementProposal).filter(
            ([key]) => key !== "provenance",
          ),
        ),
      );
      if (
        !proposal.insertedStep ||
        !proposal.condition ||
        proposal.insertedStep.skill !== "request_manager_approval"
      )
        throw new Error("Unsupported refinement");
      const wf = engine.state.workflows.find(
        (w) => w.id === proposal.workflowId,
      );
      if (!wf) throw new Error("Workflow no longer exists");
      if (wf.steps.some((s) => s.skill === "request_manager_approval"))
        throw new Error("Approval rule already exists");
      const steps = [...wf.steps],
        index = steps.findIndex((s) => s.skill === "check_refund_policy");
      steps.splice(index + 1, 0, {
        ...proposal.insertedStep,
        condition: proposal.condition,
      });
      const next = validateWorkflow({
        ...wf,
        steps,
        version: wf.version + 1,
        demonstrationsCount: wf.demonstrationsCount + 1,
        sourceDemonstrationIds: [
          ...(wf.sourceDemonstrationIds || []),
          ...demonstrations.current
            .filter((d) => d.workflowId === wf.id)
            .map((d) => d.id),
        ].filter((id, i, all) => all.indexOf(id) === i),
        updatedAt: new Date().toISOString(),
        provenance: refinementProposal.provenance,
        decisionRules: [
          ...wf.decisionRules,
          {
            id: `RULE_${crypto.randomUUID()}`,
            description:
              proposal.ruleDescription || proposal.condition.description,
            conditionStr:
              proposal.conditionStr ||
              `${proposal.condition.field} ${proposal.condition.operator} ${proposal.condition.value}`,
            confidence: proposal.confidence,
            discoveredAt: new Date().toISOString(),
          },
        ],
      });
      engine.state.workflowVersions = [
        ...(engine.state.workflowVersions || []),
        archiveVersion(wf),
      ];
      engine.state.workflows = engine.state.workflows.map((w) =>
        w.id === wf.id ? next : w,
      );
      publish();
      setRefinementProposal(null);
      showToast(`Workflow updated to v${next.version}.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Invalid refinement");
    }
  };
  const updateWorkflow = (id: string, edited: unknown) => {
    const current = engine.state.workflows.find((w) => w.id === id);
    if (!current) throw new Error("Workflow no longer exists");
    const result = editWorkflow(current, edited);
    engine.state.workflowVersions = [
      ...(engine.state.workflowVersions || []),
      result.archived,
    ];
    engine.state.workflows = engine.state.workflows.map((w) =>
      w.id === id ? result.current : w,
    );
    publish();
    showToast(`Published ${result.current.name} v${result.current.version}.`);
  };
  const retryRun = async (id: string) => {
    if (session.current || isInferring || busyReply.current.size) {
      showToast("Finish the current demonstration before retrying.");
      return;
    }
    const generation = epoch.current;
    try {
      setActiveRunId(id);
      const result = await engine.retryRun(id);
      if (generation !== epoch.current) return;
      showToast(`Retry ${result.status}.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Retry failed");
    }
  };
  const escalateRun = (id: string, reason: string) => {
    try {
      engine.escalateRun(id, reason);
      showToast("Assigned to human review. Automatic retry is disabled.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Escalation failed");
    }
  };
  const issueRefund = async (
    paymentId: string,
    ticketId?: string,
  ): Promise<string> => {
    try {
      if (session.current && ticketId && ticketId !== session.current.ticketId)
        throw new Error("Payment belongs to another demonstration ticket");
      const target = ticketId || session.current?.ticketId;
      const id = engine.refund(paymentId, target);
      recordAction(
        "refund_payment",
        "payment",
        paymentId,
        "Verified duplicate refund issued",
        { paymentId, refundId: id },
      );
      return id;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Refund failed";
      showToast(msg);
      throw error;
    }
  };
  const submitApprovalRequest = (
    ticketId: string,
    amount: number,
    reason: string,
  ) => {
    try {
      const id = engine.requestApproval(ticketId, amount, reason);
      recordAction(
        "request_manager_approval",
        "approval",
        id,
        "Manager approval requested",
        { ticketId, amount, approvalId: id },
      );
      return id;
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Approval request failed",
      );
      return "";
    }
  };
  const approveRequest = (id: string) => {
    void engine
      .approve(id)
      .then(() => showToast("Approval granted; any waiting run resumed."))
      .catch((error) => showToast(error.message));
  };
  const rejectRequest = (id: string) => {
    try {
      engine.reject(id);
      showToast("Approval rejected; refund blocked.");
    } catch (error) {
      showToast((error as Error).message);
    }
  };
  const resolveTicket = (id: string) => {
    try {
      engine.closeTicket(id);
      recordAction("close_ticket", "ticket", id, "Ticket resolved");
      showToast("Ticket resolved.");
    } catch (error) {
      showToast((error as Error).message);
    }
  };
  const checkRefundPolicy = (paymentId: string, ticketId: string) =>
    engine.checkPolicy(paymentId, ticketId);
  const draftAndSendReply = async (ticketId: string) => {
    if (busyReply.current.has(ticketId))
      throw new Error("Reply is already being generated");
    busyReply.current.add(ticketId);
    const generation = epoch.current;
    const demonstrationId = session.current?.id;
    try {
      const message = await engine.draftAndSendReply(ticketId);
      if (generation !== epoch.current) return;
      if (session.current?.id === demonstrationId && selectedId === ticketId) {
        recordAction(
          "draft_customer_reply",
          "ticket",
          ticketId,
          "Drafted customer confirmation",
          { refundId: message.refundId },
        );
        recordAction(
          "send_customer_reply",
          "ticket",
          ticketId,
          "Saved mock customer reply",
          { messageId: message.id, refundId: message.refundId },
        );
      } else {
        recordActivity({
          category: "task",
          title: "Customer confirmation saved",
          description: "Mock reply saved after the teaching session ended",
          ticketId,
          status: "success",
          metadata: { refundId: message.refundId, messageId: message.id },
        });
      }
      showToast("Mock customer confirmation saved.");
    } catch (error) {
      if (generation === epoch.current) showToast((error as Error).message);
      throw error;
    } finally {
      busyReply.current.delete(ticketId);
    }
  };
  const executeWorkflowOnTicket = async (
    workflowId: string,
    ticketId: string,
  ) => {
    if (session.current || isInferring) {
      showToast("Finish teaching before starting a run.");
      return;
    }
    const wf = engine.state.workflows.find(
      (w) => w.id === workflowId || w.slug === workflowId,
    );
    if (!wf || wf.status !== "active") {
      showToast("No active workflow found.");
      return;
    }
    const generation = epoch.current;
    try {
      const pending = engine.startRun(wf, ticketId);
      const running = engine.state.runs.find(
        (r) => r.ticketId === ticketId && r.status === "running",
      );
      if (running) setActiveRunId(running.id);
      const run = await pending;
      if (generation !== epoch.current) return;
      setActiveRunId(run.id);
      recordActivity({
        category: "execution",
        title: `Run ${run.status}`,
        description: run.outcomeSummary || "Waiting for manager approval",
        ticketId,
        runId: run.id,
        status:
          run.status === "completed"
            ? "success"
            : run.status === "failed"
              ? "failed"
              : "warning",
      });
    } catch (error) {
      showToast((error as Error).message);
    }
  };
  // Engine snapshots clone arrays on every trace update; match only meaningful catalog changes.
  const matchingCatalogKey = JSON.stringify(workflows);
  const selectedTicketIsRunning = runs.some(
    (run) => run.ticketId === selectedId &&
      ["running", "queued", "waiting_approval"].includes(run.status),
  );
  useEffect(() => {
    const controller = new AbortController();
    setMatchingWorkflow(null);
    setMatchingError(null);
    const wf = workflows.filter((w) => w.status === "active");
    if (
      busyReply.current.size > 0 ||
      !selectedTicket ||
      selectedTicket.status !== "open" ||
      selectedTicketIsRunning ||
      !wf.length ||
      isTeaching ||
      isInferring
    ) {
      setIsMatching(false);
      return;
    }
    setIsMatching(true);
    apiPost(
      "match-workflow",
      { ticket: selectedTicket, workflows: wf },
      controller.signal,
    )
      .then((data) => {
        if (controller.signal.aborted) return;
        const result = MatchSchema.parse(
          Object.fromEntries(
            Object.entries(data).filter(([key]) => key !== "provenance"),
          ),
        );
        setMatchingWorkflow({ ...result, provenance: data.provenance });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setMatchingError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsMatching(false);
      });
    return () => controller.abort();
  }, [
    selectedId,
    selectedTicket?.status,
    matchingCatalogKey,
    selectedTicketIsRunning,
    aiMode,
    isTeaching,
    isInferring,
  ]);
  // Schedule Management
  const addSchedule = (
    sched: Omit<
      SkillSchedule,
      "id" | "createdAt" | "executionCount" | "successCount" | "failureCount"
    >,
  ) => {
    const newId = `SCHED_${String(schedules.length + 1).padStart(2, "0")}`;
    const newSched: SkillSchedule = {
      ...sched,
      id: newId,
      createdAt: new Date().toISOString(),
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
    };
    setSchedules((prev) => [newSched, ...prev]);
    recordActivity({
      category: "governance",
      title: `Cron Trigger Scheduled: ${sched.workflowName}`,
      description: `Defined autonomous cron trigger '${sched.cronExpression}' (${sched.humanReadable}) targeting ${sched.targetScope}.`,
      status: "info",
      metadata: {
        cron: sched.cronExpression,
        timezone: sched.timezone,
        targetScope: sched.targetScope,
      },
    });
    showToast(`Schedule '${newSched.humanReadable}' created successfully!`);
  };

  const updateSchedule = (id: string, updates: Partial<SkillSchedule>) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
    showToast("Schedule updated successfully");
  };

  const toggleScheduleStatus = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const newStatus = s.status === "active" ? "paused" : "active";
        recordActivity({
          category: "governance",
          title: `Schedule ${s.id} ${newStatus === "active" ? "Resumed" : "Paused"}`,
          description: `Cron trigger '${s.cronExpression}' for ${s.workflowName} is now ${newStatus}.`,
          status: newStatus === "active" ? "success" : "warning",
        });
        return {
          ...s,
          status: newStatus,
          nextRunAt: newStatus === "active" ? "Calculated by cron" : "Paused",
        };
      }),
    );
  };

  const deleteSchedule = (id: string) => {
    const target = schedules.find((s) => s.id === id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    if (target) {
      recordActivity({
        category: "governance",
        title: `Schedule ${id} Deleted`,
        description: `Removed cron schedule '${target.cronExpression}' for ${target.workflowName}.`,
        status: "warning",
      });
    }
    showToast("Schedule deleted");
  };

  const triggerScheduleNow = async (id: string) => {
    const target = schedules.find((s) => s.id === id);
    const wf = workflows.find(
      (w) => w.id === target?.workflowId || w.slug === target?.workflowId,
    );
    const ticket = tickets.find(
      (t) => t.status === "open" && t.intent === wf?.trigger.intent,
    );
    if (!target || !wf || !ticket) {
      showToast(
        "No active workflow and matching open ticket for this schedule.",
      );
      return;
    }
    await executeWorkflowOnTicket(wf.id, ticket.id);
  };

  const resetAll = () => {
    epoch.current++;
    requests.current.forEach((c) => c.abort());
    requests.current.clear();
    session.current = null;
    demonstrations.current = [];
    engine.reset();
    setSelectedId("TICK_1042");
    setWorkspaceSubTab("inbox");
    setIsTeaching(false);
    setIsInferring(false);
    setObservationEvents([]);
    setDraftWorkflow(null);
    setRefinementProposal(null);
    setActiveRunId(null);
    setSchedules([]);
    setActivities([]);
    setLearningError(null);
    setMatchingWorkflow(null);
    setMatchingError(null);
    busyReply.current.clear();
    for (const key of Object.keys(localStorage))
      if (
        key.startsWith("shadowops_") &&
        key !== STORAGE_KEY &&
        key !== "shadowops_ai_mode"
      )
        localStorage.removeItem(key);
    showToast(
      "Clean demo reset: teach Maria, refine with Alex, then run Daniel.",
    );
  };

  return (
    <AppContext.Provider
      value={{
        aiMode,
        setAiMode,
        aiConfigured,
        matchingWorkflow,
        isMatching,
        matchingError,
        learningError,
        messages,
        draftAndSendReply,
        checkRefundPolicy,
        activeTab,
        setActiveTab,
        workspaceSubTab,
        setWorkspaceSubTab,
        isActivityDrawerOpen,
        setIsActivityDrawerOpen,
        activities,
        recordActivity,
        clearActivities,
        tickets,
        customers,
        payments,
        policies,
        approvals,
        selectedTicketId,
        setSelectedTicketId,
        selectedCustomer,
        selectedPayments,
        isTeaching,
        startTeaching,
        stopTeachingAndLearn,
        cancelTeaching,
        observationEvents,
        recordAction,
        isInferring,
        draftWorkflow,
        setDraftWorkflow,
        saveDraftWorkflow,
        refinementProposal,
        setRefinementProposal,
        applyRefinement,
        workflows,
        workflowVersions: operations.workflowVersions || [],
        workflowDemonstrations: demonstrations.current,
        updateWorkflow,
        retryRun,
        escalateRun,
        runs,
        schedules,
        addSchedule,
        updateSchedule,
        toggleScheduleStatus,
        deleteSchedule,
        triggerScheduleNow,
        activeExecutionRun,
        setActiveExecutionRun,
        executeWorkflowOnTicket,
        issueRefund,
        submitApprovalRequest,
        approveRequest,
        rejectRequest,
        resolveTicket,
        resetAll,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
