import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  WorkflowRun,
  WorkflowRunStep,
} from '../../types';
import {
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldAlert,
  FastForward,
  ChevronDown,
  Layers,
} from 'lucide-react';

interface Props {
  run: WorkflowRun;
  onClose: () => void;
}

export const ExecutionModal: React.FC<Props> = ({ run, onClose }) => {
  const { setActiveTab } = useApp();

  const isCompleted = run.status === 'completed';
  const isFailed = run.status === 'failed';
  const isRunning = run.status === 'running';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                isCompleted
                  ? 'bg-emerald-600 shadow-emerald-600/20'
                  : isFailed
                  ? 'bg-red-600 shadow-red-600/20'
                  : 'bg-indigo-600 shadow-indigo-600/20'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : isFailed ? (
                <ShieldAlert className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white fill-current animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400">Run #{run.id}</span>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                    isCompleted
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                      : isFailed
                      ? 'bg-red-950/80 text-red-300 border border-red-800'
                      : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800 animate-pulse'
                  }`}
                >
                  {run.status}
                </span>
                <span className="text-xs font-mono text-zinc-500">v{run.workflowVersion}</span>
              </div>
              <h3 className="text-base font-semibold text-white tracking-tight mt-0.5">
                {run.workflowName}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Context Info */}
        <div className="px-6 py-2.5 bg-zinc-950/50 border-b border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Ticket: <strong className="text-zinc-200 font-mono">#{run.ticketId}</strong></span>
            <span>•</span>
            <span>Target: <strong className="text-zinc-200">{run.customerName}</strong></span>
          </div>
          <span className="font-mono text-[11px] text-zinc-500">Started: {run.startedAt}</span>
        </div>

        {/* Live Step Progression */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="space-y-2">
            {run.steps.map((st, idx) => {
              const isStepDone = st.status === 'completed';
              const isStepSkipped = st.status === 'skipped';
              const isStepFailed = st.status === 'failed';
              const isStepRunning = st.status === 'running';

              return (
                <div
                  key={st.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isStepDone
                      ? 'bg-zinc-950/90 border-emerald-950/60'
                      : isStepSkipped
                      ? 'bg-zinc-950/40 border-zinc-800/60 opacity-60'
                      : isStepFailed
                      ? 'bg-red-950/30 border-red-900/60'
                      : isStepRunning
                      ? 'bg-indigo-950/20 border-indigo-500/50'
                      : 'bg-zinc-950/20 border-zinc-800/40 text-zinc-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {isStepDone ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : isStepSkipped ? (
                        <FastForward className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      ) : isStepFailed ? (
                        <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
                      ) : isStepRunning ? (
                        <span className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin flex-shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-medium ${
                              isStepDone
                                ? 'text-white'
                                : isStepRunning
                                ? 'text-indigo-200'
                                : isStepSkipped
                                ? 'text-zinc-400 line-through'
                                : isStepFailed
                                ? 'text-red-300'
                                : 'text-zinc-400'
                            }`}
                          >
                            {st.name}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">({st.skillId})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      {st.latencyMs > 0 && (
                        <span className="text-zinc-400">{st.latencyMs}ms</span>
                      )}
                      {isStepSkipped && (
                        <span className="text-amber-400 text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-950/60 border border-amber-800/60">
                          Condition skipped (amount &le; $500)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Step output snippet */}
                  {st.output && (
                    <div className="mt-2 pt-2 border-t border-zinc-800/60 font-mono text-[11px] text-zinc-400">
                      {st.skillId === 'detect_duplicate_payment' && st.output.isDuplicate && (
                        <span className="text-emerald-400 font-medium">
                          &check; Duplicate confirmed: {st.output.duplicatePaymentId} (${st.output.amount})
                        </span>
                      )}
                      {st.skillId === 'refund_payment' && st.output.refundId && (
                        <span className="text-emerald-400 font-medium">
                          &check; Gateway refund succeeded: {st.output.refundId}
                        </span>
                      )}
                      {st.skillId === 'send_customer_reply' && (
                        <span className="text-zinc-300">
                          &check; Resolution notification delivered to {st.output.recipient}
                        </span>
                      )}
                      {st.skillId === 'close_ticket' && (
                        <span className="text-emerald-400 font-medium">
                          &check; Ticket marked resolved in system
                        </span>
                      )}
                      {st.error && (
                        <span className="text-red-400 font-medium">
                          &excl; Guardrail Halt: {st.error}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Outcome Summary */}
          {run.outcomeSummary && (
            <div
              className={`p-4 rounded-xl border ${
                isCompleted
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                  : 'bg-red-950/20 border-red-800/40 text-red-300'
              } text-xs space-y-1`}
            >
              <div className="font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                {isCompleted ? <CheckCircle className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                Execution Outcome:
              </div>
              <p className="leading-relaxed text-zinc-200">{run.outcomeSummary}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500 font-mono">
            {isRunning ? 'Execution in progress...' : `Finished at ${run.completedAt || 'now'}`}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                setActiveTab('runs');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              View in Run History
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
