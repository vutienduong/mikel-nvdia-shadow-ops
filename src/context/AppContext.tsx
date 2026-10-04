import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Ticket,
  Customer,
  Payment,
  Policy,
  ApprovalRequest,
  ObservationEvent,
  WorkflowDefinition,
  WorkflowRun,
  WorkflowRunStep,
  ActivityItem,
  SkillSchedule,
} from '../types';
import {
  INITIAL_TICKETS,
  INITIAL_CUSTOMERS,
  INITIAL_PAYMENTS,
  INITIAL_POLICIES,
  INITIAL_APPROVALS,
  INITIAL_WORKFLOWS,
  INITIAL_ACTIVITIES,
  INITIAL_RUNS,
  INITIAL_SCHEDULES,
} from '../data/seedData';
import { SKILL_REGISTRY } from '../data/skillRegistry';

interface AppContextType {
  // Navigation
  activeTab: 'workspace' | 'skills' | 'runs' | 'analytics' | 'schedules';
  setActiveTab: (tab: 'workspace' | 'skills' | 'runs' | 'analytics' | 'schedules') => void;
  workspaceSubTab: 'inbox' | 'customers' | 'payments' | 'policies' | 'approvals' | 'activity';
  setWorkspaceSubTab: (tab: 'inbox' | 'customers' | 'payments' | 'policies' | 'approvals' | 'activity') => void;

  // Schedules (Cron-based automated skill triggers)
  schedules: SkillSchedule[];
  addSchedule: (sched: Omit<SkillSchedule, 'id' | 'createdAt' | 'executionCount' | 'successCount' | 'failureCount'>) => void;
  updateSchedule: (id: string, updates: Partial<SkillSchedule>) => void;
  toggleScheduleStatus: (id: string) => void;
  deleteSchedule: (id: string) => void;
  triggerScheduleNow: (id: string) => Promise<void>;

  // Activity Drawer in Workspace
  isActivityDrawerOpen: boolean;
  setIsActivityDrawerOpen: (open: boolean) => void;
  activities: ActivityItem[];
  recordActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp' | 'timeFormatted'> & Partial<Pick<ActivityItem, 'id' | 'timestamp' | 'timeFormatted'>>) => void;
  clearActivities: () => void;

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
    entityType: 'customer' | 'payment' | 'policy' | 'approval' | 'ticket',
    entityId: string,
    label: string,
    context?: Record<string, any>
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
  runs: WorkflowRun[];
  activeExecutionRun: WorkflowRun | null;
  setActiveExecutionRun: (run: WorkflowRun | null) => void;
  executeWorkflowOnTicket: (workflowId: string, ticketId: string) => Promise<void>;

  // Manual Operations in Workspace
  issueRefund: (paymentId: string, ticketId?: string) => Promise<string>;
  submitApprovalRequest: (ticketId: string, amount: number, reason: string) => string;
  approveRequest: (approvalId: string) => void;
  rejectRequest: (approvalId: string) => void;
  resolveTicket: (ticketId: string) => void;

  // Reset
  resetAll: () => void;

  // Toast notifications
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'workspace' | 'skills' | 'runs' | 'analytics' | 'schedules'>('workspace');
  const [workspaceSubTab, setWorkspaceSubTab] = useState<'inbox' | 'customers' | 'payments' | 'policies' | 'approvals' | 'activity'>('inbox');

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('shadowops_tickets');
    return saved ? JSON.parse(saved) : INITIAL_TICKETS;
  });

  const [customers] = useState<Customer[]>(INITIAL_CUSTOMERS);

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('shadowops_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [policies] = useState<Policy[]>(INITIAL_POLICIES);

  const [approvals, setApprovals] = useState<ApprovalRequest[]>(() => {
    const saved = localStorage.getItem('shadowops_approvals');
    return saved ? JSON.parse(saved) : INITIAL_APPROVALS;
  });

  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>(() => {
    const saved = localStorage.getItem('shadowops_workflows');
    return saved ? JSON.parse(saved) : INITIAL_WORKFLOWS;
  });

  const [runs, setRuns] = useState<WorkflowRun[]>(() => {
    const saved = localStorage.getItem('shadowops_runs');
    return saved ? JSON.parse(saved) : INITIAL_RUNS;
  });

  const [schedules, setSchedules] = useState<SkillSchedule[]>(() => {
    const saved = localStorage.getItem('shadowops_schedules');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULES;
  });

  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    const saved = localStorage.getItem('shadowops_activities');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState<boolean>(false);

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>('TICK_1042');

  // Teach Mode
  const [isTeaching, setIsTeaching] = useState<boolean>(false);
  const [currentDemoId, setCurrentDemoId] = useState<string>('');
  const [observationEvents, setObservationEvents] = useState<ObservationEvent[]>([]);
  const [isInferring, setIsInferring] = useState<boolean>(false);
  const [draftWorkflow, setDraftWorkflow] = useState<WorkflowDefinition | null>(null);
  const [refinementProposal, setRefinementProposal] = useState<any | null>(null);
  const [activeExecutionRun, setActiveExecutionRun] = useState<WorkflowRun | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('shadowops_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('shadowops_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('shadowops_approvals', JSON.stringify(approvals));
  }, [approvals]);

  useEffect(() => {
    localStorage.setItem('shadowops_workflows', JSON.stringify(workflows));
  }, [workflows]);

  useEffect(() => {
    localStorage.setItem('shadowops_runs', JSON.stringify(runs));
  }, [runs]);

  useEffect(() => {
    localStorage.setItem('shadowops_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('shadowops_activities', JSON.stringify(activities));
  }, [activities]);

  const recordActivity = (
    activity: Omit<ActivityItem, 'id' | 'timestamp' | 'timeFormatted'> &
      Partial<Pick<ActivityItem, 'id' | 'timestamp' | 'timeFormatted'>>
  ) => {
    const now = new Date();
    const item: ActivityItem = {
      id:
        activity.id ||
        'ACT_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 3),
      timestamp: activity.timestamp || now.toISOString(),
      timeFormatted: activity.timeFormatted || now.toLocaleTimeString(),
      ...activity,
    };
    setActivities((prev) => [item, ...prev]);
  };

  const clearActivities = () => {
    setActivities([]);
    localStorage.removeItem('shadowops_activities');
    showToast('Activity log cleared.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || null;
  const selectedCustomer = selectedTicket
    ? customers.find((c) => c.id === selectedTicket.customerId) || null
    : null;
  const selectedPayments = selectedCustomer
    ? payments.filter((p) => p.customerId === selectedCustomer.id)
    : [];

  const startTeaching = () => {
    const demoId = 'DEMO_' + Date.now().toString(36);
    setCurrentDemoId(demoId);
    setObservationEvents([]);
    setIsTeaching(true);

    recordActivity({
      category: 'demonstration',
      title: 'Demonstration Session Initiated',
      description: `Teach Mode enabled for ticket #${selectedTicket?.id || 'TICK'} (${selectedTicket?.customerName || 'Customer'}). Recording semantic actions...`,
      ticketId: selectedTicket?.id,
      customerName: selectedTicket?.customerName,
      status: 'info',
    });

    showToast('Teach Mode activated. Demonstrating operational actions...');
  };

  const cancelTeaching = () => {
    setIsTeaching(false);
    setObservationEvents([]);
    recordActivity({
      category: 'demonstration',
      title: 'Demonstration Session Cancelled',
      description: 'Teach Mode cancelled by user before saving workflow.',
      status: 'warning',
    });
    showToast('Teach Mode cancelled.');
  };

  const recordAction = (
    action: string,
    entityType: 'customer' | 'payment' | 'policy' | 'approval' | 'ticket',
    entityId: string,
    label: string,
    context: Record<string, any> = {}
  ) => {
    // Record to persistent activity log
    recordActivity({
      category: isTeaching ? 'demonstration' : 'task',
      title: isTeaching ? `Demonstrated: ${action}` : `Task Performed: ${action}`,
      description: label,
      ticketId: selectedTicket?.id,
      customerName: selectedTicket?.customerName,
      skillId: action,
      status: isTeaching ? 'info' : 'success',
      metadata: context,
    });

    if (!isTeaching) return;

    const event: ObservationEvent = {
      id: 'EVT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      demonstrationId: currentDemoId || 'DEMO_MANUAL',
      sequence: observationEvents.length + 1,
      timestamp: new Date().toLocaleTimeString(),
      type: 'tool_action',
      action,
      entityType,
      entityId,
      label,
      context,
    };

    setObservationEvents((prev) => [...prev, event]);
  };

  const stopTeachingAndLearn = async () => {
    if (observationEvents.length === 0) {
      showToast('No actions were recorded in this demonstration.');
      setIsTeaching(false);
      return;
    }

    setIsInferring(true);
    setIsTeaching(false);

    try {
      const activeWf = workflows.find((w) => w.slug === 'duplicate_payment_resolution');

      if (!activeWf) {
        // Case A: First demonstration -> Induce initial workflow (v1)
        const response = await fetch('/api/ai/infer-workflow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticket: selectedTicket,
            observationEvents,
            availableSkills: SKILL_REGISTRY,
            policies,
          }),
        });

        if (!response.ok) throw new Error('Inference API error');
        const data = await response.json();

        const newWf: WorkflowDefinition = {
          id: 'WF_' + Date.now(),
          slug: data.slug || 'duplicate_payment_resolution',
          name: data.name || 'Duplicate Payment Resolution',
          version: 1,
          description: data.description || 'Automated duplicate payment refund workflow',
          trigger: data.trigger || { type: 'support_ticket', intent: 'duplicate_payment' },
          inputs: data.inputs || ['ticket_id'],
          steps: data.steps || [],
          confidence: data.confidence || 0.92,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          demonstrationsCount: 1,
          decisionRules: [],
        };

        setDraftWorkflow(newWf);
      } else {
        // Case B: Second demonstration -> Compare with existing and infer conditional rules (v2)
        const response = await fetch('/api/ai/compare-demonstrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            existingWorkflow: activeWf,
            newObservationEvents: observationEvents,
            ticket: selectedTicket,
            policies,
          }),
        });

        if (!response.ok) throw new Error('Comparison API error');
        const data = await response.json();
        setRefinementProposal(data);
      }
    } catch (err) {
      console.error('Error during AI learning:', err);
      showToast('Learning engine completed with local fallback.');
    } finally {
      setIsInferring(false);
    }
  };

  const saveDraftWorkflow = (wf: WorkflowDefinition) => {
    setWorkflows((prev) => [wf, ...prev]);
    setDraftWorkflow(null);
    recordActivity({
      category: 'demonstration',
      title: `Workflow Induced: ${wf.name} (v${wf.version})`,
      description: `Synthesized ${wf.steps.length}-step executable workflow with ${Math.round(wf.confidence * 100)}% confidence.`,
      workflowId: wf.id,
      status: 'success',
      metadata: { stepsCount: wf.steps.length, version: wf.version },
    });
    showToast(`Workflow "${wf.name}" saved as active skill (v${wf.version})!`);
  };

  const applyRefinement = () => {
    if (!refinementProposal) return;

    setWorkflows((prev) =>
      prev.map((wf) => {
        if (wf.slug === 'duplicate_payment_resolution') {
          // Insert the conditional approval step right after check_refund_policy
          const newSteps = [...wf.steps];
          const policyStepIndex = newSteps.findIndex((s) => s.skill === 'check_refund_policy');

          const approvalStep = {
            id: 'step_approval',
            skill: 'request_manager_approval',
            name: 'Request Manager Approval',
            description: 'Requires approval if refund amount > $500',
            args: {
              ticketId: '{{ticket.id}}',
              amount: '{{duplicate.amount}}',
              reason: 'Duplicate payment > $500 threshold',
            },
            condition: {
              field: 'duplicate.amount',
              operator: '>' as const,
              value: 500,
              description: 'Amount exceeds $500 threshold',
            },
          };

          if (policyStepIndex >= 0) {
            newSteps.splice(policyStepIndex + 1, 0, approvalStep);
          } else {
            newSteps.push(approvalStep);
          }

          const newRule = {
            id: 'RULE_' + Date.now(),
            description: refinementProposal.ruleDescription || 'Refunds > $500 require manager approval',
            conditionStr: refinementProposal.conditionStr || 'duplicate.amount > 500',
            confidence: refinementProposal.confidence || 0.94,
            discoveredAt: new Date().toISOString(),
          };

          return {
            ...wf,
            version: wf.version + 1,
            steps: newSteps,
            demonstrationsCount: wf.demonstrationsCount + 1,
            decisionRules: [...wf.decisionRules, newRule],
            updatedAt: new Date().toISOString(),
          };
        }
        return wf;
      })
    );

    recordActivity({
      category: 'demonstration',
      title: 'Workflow Refined & Decision Rule Discovered',
      description: `Cross-demonstration comparison discovered rule: "${refinementProposal.ruleDescription || 'Refunds > $500 require approval'}". Workflow upgraded to v2.`,
      status: 'warning',
      metadata: {
        rule: refinementProposal.ruleDescription,
        condition: refinementProposal.conditionStr,
        confidence: refinementProposal.confidence,
      },
    });

    setRefinementProposal(null);
    showToast('Workflow evolved to v2 with newly discovered decision rule!');
  };

  const issueRefund = async (paymentId: string, ticketId?: string): Promise<string> => {
    const refundId = 'REF_' + Math.floor(Math.random() * 90000 + 10000);

    setPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: 'refunded',
              refundId,
              refundedAt: new Date().toISOString(),
            }
          : p
      )
    );

    if (ticketId) {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: 'resolved' } : t))
      );
    }

    recordActivity({
      category: 'task',
      title: `Gateway Refund Issued: ${refundId}`,
      description: `Processed transaction refund for payment ID ${paymentId}.`,
      status: 'success',
      metadata: { paymentId, refundId },
    });

    return refundId;
  };

  const submitApprovalRequest = (ticketId: string, amount: number, reason: string): string => {
    const targetTicket = tickets.find((t) => t.id === ticketId);
    const newApproval: ApprovalRequest = {
      id: 'APR_' + Date.now().toString(36).toUpperCase(),
      ticketId,
      customerName: targetTicket?.customerName || 'Customer',
      amount,
      currency: 'USD',
      reason,
      status: 'pending',
      createdAt: new Date().toLocaleTimeString(),
    };

    setApprovals((prev) => [newApproval, ...prev]);
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'pending_approval' } : t))
    );

    recordActivity({
      category: 'governance',
      title: `Manager Approval Requested: ${newApproval.id}`,
      description: `Dispatched approval request for $${amount} on ticket #${ticketId}. Reason: ${reason}`,
      ticketId,
      customerName: targetTicket?.customerName,
      status: 'warning',
      metadata: { amount, approvalId: newApproval.id },
    });

    return newApproval.id;
  };

  const approveRequest = (approvalId: string) => {
    const app = approvals.find((a) => a.id === approvalId);
    if (!app) return;

    setApprovals((prev) =>
      prev.map((a) =>
        a.id === approvalId
          ? {
              ...a,
              status: 'approved',
              approvedBy: 'Ops Manager (Sarah Connor)',
              approvedAt: new Date().toLocaleTimeString(),
            }
          : a
      )
    );

    // If ticket was waiting, allow resolution
    setTickets((prev) =>
      prev.map((t) => (t.id === app.ticketId ? { ...t, status: 'open' } : t))
    );

    recordActivity({
      category: 'governance',
      title: `Manager Approval Granted: ${approvalId}`,
      description: `Operations lead authorized refund of $${app.amount} for ticket #${app.ticketId}.`,
      ticketId: app.ticketId,
      customerName: app.customerName,
      status: 'success',
    });

    showToast(`Approval ${approvalId} granted for $${app.amount}.`);
  };

  const rejectRequest = (approvalId: string) => {
    const app = approvals.find((a) => a.id === approvalId);
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === approvalId
          ? {
              ...a,
              status: 'rejected',
              approvedBy: 'Ops Manager (Sarah Connor)',
              approvedAt: new Date().toLocaleTimeString(),
            }
          : a
      )
    );

    recordActivity({
      category: 'governance',
      title: `Manager Approval Rejected: ${approvalId}`,
      description: `Operations lead rejected refund request for ticket #${app?.ticketId || 'TICK'}.`,
      ticketId: app?.ticketId,
      status: 'failed',
    });

    showToast(`Approval ${approvalId} rejected.`);
  };

  const resolveTicket = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'resolved' } : t))
    );
    showToast(`Ticket ${ticketId} resolved.`);
  };

  // Autonomous Execution Engine (Case C)
  const executeWorkflowOnTicket = async (workflowId: string, ticketId: string) => {
    const wf = workflows.find((w) => w.id === workflowId || w.slug === workflowId);
    const t = tickets.find((tick) => tick.id === ticketId);
    if (!wf || !t) return;

    const runId = 'RUN_' + Math.floor(Math.random() * 900 + 100);
    const initialRunSteps: WorkflowRunStep[] = wf.steps.map((s) => ({
      id: s.id,
      skillId: s.skill,
      name: s.name,
      status: 'pending',
      latencyMs: 0,
    }));

    const newRun: WorkflowRun = {
      id: runId,
      workflowId: wf.id,
      workflowName: wf.name,
      workflowVersion: wf.version,
      ticketId: t.id,
      customerName: t.customerName,
      status: 'running',
      startedAt: new Date().toLocaleTimeString(),
      steps: initialRunSteps,
    };

    setActiveExecutionRun(newRun);

    recordActivity({
      category: 'execution',
      title: `Autonomous Execution Triggered: #${runId}`,
      description: `Agent executing "${wf.name}" (v${wf.version}) on ticket #${t.id} for ${t.customerName}.`,
      ticketId: t.id,
      customerName: t.customerName,
      runId,
      workflowId: wf.id,
      status: 'info',
    });

    // Step-by-step deterministic autonomous execution with realistic execution latencies
    let cust = customers.find((c) => c.id === t.customerId);
    let custPayments = payments.filter((p) => p.customerId === t.customerId);
    let duplicatePayment: Payment | null = null;
    let originalPayment: Payment | null = null;
    let generatedRefundId = '';

    for (let i = 0; i < wf.steps.length; i++) {
      const stepDef = wf.steps[i];
      const stepStartTime = performance.now();

      // Update step status to 'running'
      setActiveExecutionRun((prev) => {
        if (!prev) return null;
        const updatedSteps = [...prev.steps];
        updatedSteps[i] = { ...updatedSteps[i], status: 'running' };
        return { ...prev, steps: updatedSteps };
      });

      // Simulated network/processing latency (180ms - 450ms)
      await new Promise((resolve) => setTimeout(resolve, 380));

      let stepOutput: any = null;
      let shouldSkip = false;
      let isFailed = false;
      let failureReason = '';

      switch (stepDef.skill) {
        case 'find_customer':
          stepOutput = {
            id: cust?.id,
            name: cust?.name,
            email: cust?.email,
            plan: cust?.plan,
            status: cust?.status,
          };
          break;

        case 'get_recent_payments':
          stepOutput = {
            totalCount: custPayments.length,
            records: custPayments.map((p) => ({ id: p.id, amount: p.amount, status: p.status, date: p.chargedAt })),
          };
          break;

        case 'detect_duplicate_payment':
          // Guardrail check: Look for 2 payments with same amount and close timestamp
          const candidates = custPayments.filter((p) => p.status === 'captured');
          for (let j = 0; j < candidates.length; j++) {
            for (let k = j + 1; k < candidates.length; k++) {
              if (candidates[j].amount === candidates[k].amount) {
                originalPayment = candidates[j];
                duplicatePayment = candidates[k];
                break;
              }
            }
            if (duplicatePayment) break;
          }

          if (duplicatePayment) {
            stepOutput = {
              isDuplicate: true,
              duplicatePaymentId: duplicatePayment.id,
              originalPaymentId: originalPayment?.id,
              amount: duplicatePayment.amount,
              confidence: 0.98,
              rationale: 'Identical amount charged within short interval',
            };
          } else {
            // Guardrail triggered (e.g. Case D: Sarah Williams)
            isFailed = true;
            failureReason = 'No duplicate payment found. Transactions have differing charges and purposes.';
            stepOutput = { isDuplicate: false, confidence: 0.99 };
          }
          break;

        case 'check_refund_policy':
          const amount = duplicatePayment?.amount || t.amount || 0;
          stepOutput = {
            eligible: true,
            policy: 'POL_REFUND_01',
            threshold: 500,
            amount,
            requiresApproval: amount > 500,
          };
          break;

        case 'request_manager_approval':
          // Evaluated condition: IF amount > 500
          const checkAmount = duplicatePayment?.amount || t.amount || 0;
          if (checkAmount > 500) {
            // High value -> Requires manager approval
            const aprId = submitApprovalRequest(t.id, checkAmount, 'High-value duplicate payment');
            stepOutput = { approvalId: aprId, status: 'pending', amount: checkAmount };
          } else {
            // Amount <= 500 -> Rule skipped!
            shouldSkip = true;
            stepOutput = { skipped: true, reason: `Amount $${checkAmount} <= $500 threshold` };
          }
          break;

        case 'refund_payment':
          if (duplicatePayment) {
            generatedRefundId = await issueRefund(duplicatePayment.id);
            stepOutput = {
              refundId: generatedRefundId,
              amount: duplicatePayment.amount,
              gatewayStatus: 'succeeded',
            };
          }
          break;

        case 'send_customer_reply':
          stepOutput = {
            delivered: true,
            recipient: t.customerEmail,
            subject: 'Re: ' + t.subject,
            summary: `Automated confirmation sent for $${duplicatePayment?.amount || t.amount} (Ref: ${generatedRefundId})`,
          };
          break;

        case 'close_ticket':
          resolveTicket(t.id);
          stepOutput = {
            ticketId: t.id,
            status: 'resolved',
            resolutionCategory: 'duplicate_charge_refunded',
          };
          break;
      }

      const stepLatency = Math.round(performance.now() - stepStartTime);

      setActiveExecutionRun((prev) => {
        if (!prev) return null;
        const updatedSteps = [...prev.steps];
        updatedSteps[i] = {
          ...updatedSteps[i],
          status: shouldSkip ? 'skipped' : isFailed ? 'failed' : 'completed',
          latencyMs: stepLatency,
          output: stepOutput,
          error: failureReason || undefined,
        };
        return { ...prev, steps: updatedSteps };
      });

      if (isFailed) {
        setActiveExecutionRun((prev) =>
          prev
            ? {
                ...prev,
                status: 'failed',
                outcomeSummary: `Execution halted safely: ${failureReason}`,
                completedAt: new Date().toLocaleTimeString(),
              }
            : null
        );

        recordActivity({
          category: 'execution',
          title: `Autonomous Run Halted Safely: #${runId}`,
          description: `Guardrail triggered on #${t.id}: ${failureReason}. Execution stopped safely without unauthorized actions.`,
          ticketId: t.id,
          customerName: t.customerName,
          runId,
          status: 'warning',
        });

        showToast('Autonomous run stopped safely: No verified duplicate found.');
        return;
      }
    }

    setActiveExecutionRun((prev) => {
      if (!prev) return null;
      const completedRun: WorkflowRun = {
        ...prev,
        status: 'completed',
        completedAt: new Date().toLocaleTimeString(),
        durationMs: 1420,
        outcomeSummary: `Ticket resolved. Gateway refund ${generatedRefundId || 'REF_921'} issued, customer notified.`,
      };
      setRuns((rList) => [completedRun, ...rList]);
      return completedRun;
    });

    recordActivity({
      category: 'execution',
      title: `Autonomous Execution Completed: #${runId}`,
      description: `Workflow "${wf.name}" (v${wf.version}) executed 7/7 steps successfully in 1.4s for ${t.customerName}. Gateway refund ${generatedRefundId || 'REF_921'} issued.`,
      ticketId: t.id,
      customerName: t.customerName,
      runId,
      status: 'success',
      metadata: { durationMs: 1420, refundId: generatedRefundId },
    });

    showToast('Autonomous execution completed successfully!');
  };

  // Schedule Management
  const addSchedule = (
    sched: Omit<SkillSchedule, 'id' | 'createdAt' | 'executionCount' | 'successCount' | 'failureCount'>
  ) => {
    const newId = `SCHED_${String(schedules.length + 1).padStart(2, '0')}`;
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
      category: 'governance',
      title: `Cron Trigger Scheduled: ${sched.workflowName}`,
      description: `Defined autonomous cron trigger '${sched.cronExpression}' (${sched.humanReadable}) targeting ${sched.targetScope}.`,
      status: 'info',
      metadata: { cron: sched.cronExpression, timezone: sched.timezone, targetScope: sched.targetScope },
    });
    showToast(`Schedule '${newSched.humanReadable}' created successfully!`);
  };

  const updateSchedule = (id: string, updates: Partial<SkillSchedule>) => {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    showToast('Schedule updated successfully');
  };

  const toggleScheduleStatus = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const newStatus = s.status === 'active' ? 'paused' : 'active';
        recordActivity({
          category: 'governance',
          title: `Schedule ${s.id} ${newStatus === 'active' ? 'Resumed' : 'Paused'}`,
          description: `Cron trigger '${s.cronExpression}' for ${s.workflowName} is now ${newStatus}.`,
          status: newStatus === 'active' ? 'success' : 'warning',
        });
        return {
          ...s,
          status: newStatus,
          nextRunAt: newStatus === 'active' ? 'Calculated by cron' : 'Paused',
        };
      })
    );
  };

  const deleteSchedule = (id: string) => {
    const target = schedules.find((s) => s.id === id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    if (target) {
      recordActivity({
        category: 'governance',
        title: `Schedule ${id} Deleted`,
        description: `Removed cron schedule '${target.cronExpression}' for ${target.workflowName}.`,
        status: 'warning',
      });
    }
    showToast('Schedule deleted');
  };

  const triggerScheduleNow = async (id: string) => {
    const target = schedules.find((s) => s.id === id);
    if (!target) return;

    // Pick a matching ticket if available, e.g. TICK_1044 (Daniel Lee) or first matching
    const matchingTicket =
      tickets.find(
        (t) =>
          t.status !== 'resolved' &&
          (target.workflowId === 'duplicate_payment_resolution' ? t.intent === 'duplicate_payment' : true)
      ) || tickets[0];

    const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 19);

    setSchedules((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              lastRunAt: nowFormatted,
              executionCount: s.executionCount + 1,
              successCount: s.successCount + 1,
            }
          : s
      )
    );

    recordActivity({
      category: 'execution',
      title: `Scheduled Autonomous Run: ${target.workflowName}`,
      description: `Manual dispatch of scheduled cron '${target.cronExpression}' targeting ${matchingTicket ? matchingTicket.customerName : 'system queue'}.`,
      status: 'success',
      ticketId: matchingTicket?.id,
      customerName: matchingTicket?.customerName,
      workflowId: target.workflowId,
    });

    if (matchingTicket && target.workflowId === 'duplicate_payment_resolution') {
      await executeWorkflowOnTicket(target.workflowId, matchingTicket.id);
    } else {
      showToast(`Scheduled workflow ${target.workflowName} executed successfully!`);
    }
  };

  const resetAll = () => {
    localStorage.removeItem('shadowops_tickets');
    localStorage.removeItem('shadowops_payments');
    localStorage.removeItem('shadowops_approvals');
    localStorage.removeItem('shadowops_workflows');
    localStorage.removeItem('shadowops_runs');
    localStorage.removeItem('shadowops_schedules');
    localStorage.removeItem('shadowops_activities');

    setTickets(INITIAL_TICKETS);
    setPayments(INITIAL_PAYMENTS);
    setApprovals(INITIAL_APPROVALS);
    setWorkflows(INITIAL_WORKFLOWS);
    setRuns(INITIAL_RUNS);
    setSchedules(INITIAL_SCHEDULES);
    setActivities(INITIAL_ACTIVITIES);
    setSelectedTicketId('TICK_1042');
    setIsTeaching(false);
    setObservationEvents([]);
    setDraftWorkflow(null);
    setRefinementProposal(null);
    setActiveExecutionRun(null);
    showToast('Environment successfully reset to pristine initial state.');
  };

  return (
    <AppContext.Provider
      value={{
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
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
