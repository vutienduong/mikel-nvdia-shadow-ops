import React from "react";
import { useApp } from "../../context/AppContext";
import {
  BrainCircuit,
  Zap,
  CheckCircle,
  Play,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  GitBranch,
  Layers,
  FileCheck2,
  Activity,
} from "lucide-react";

export const ShadowBrainPanel: React.FC = () => {
  const {
    isTeaching,
    observationEvents,
    stopTeachingAndLearn,
    cancelTeaching,
    isInferring,
    workflows,
    selectedTicketId,
    tickets,
    executeWorkflowOnTicket,
    activities,
    setWorkspaceSubTab,
    matchingWorkflow,
    matchingError,
    isMatching,
    learningError,
    aiMode,
    aiConfigured,
  } = useApp();

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);
  const activeWorkflow =
    workflows.find((w) => w.id === matchingWorkflow?.workflowId) ||
    workflows.find(
      (w) => w.status === "active" && w.slug === "duplicate_payment_resolution",
    );

  const matchesWorkflow =
    matchingWorkflow?.workflowId === activeWorkflow?.id &&
    !!matchingWorkflow?.workflowId &&
    matchingWorkflow.confidence >= 0.7 &&
    selectedTicket?.status === "open";

  return (
    <aside className="w-80 lg:w-96 flex-shrink-0 bg-zinc-900/70 border-l border-zinc-800 flex flex-col h-full overflow-hidden">
      {/* Dedicated Header for Shadow Brain */}
      <div className="p-3.5 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
            <BrainCircuit className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-zinc-100 tracking-wide uppercase">
                Shadow Brain
              </span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                v2 Engine
              </span>
            </div>
          </div>
        </div>

        {isTeaching ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-950/60 border border-red-800 text-red-300 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Learning Active
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            Monitoring
          </div>
        )}
      </div>

      {/* Main Brain Reasoning Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-3 text-xs text-amber-200">
          {aiMode === "offline_demo"
            ? "Offline demo: workflows, rules, matches and replies are fixtures. No AI inference is performed."
            : aiConfigured
              ? "NVIDIA Nemotron via Nebius — live inference"
              : "Nemotron is not configured. Set server credentials or select Offline demo in the top bar."}
        </div>
        {learningError && (
          <p role="alert" className="text-xs text-red-300">
            {learningError}
          </p>
        )}
        {isInferring && (
          <p role="status" className="text-xs text-indigo-300">
            Learning workflow…
          </p>
        )}
        {isMatching && (
          <p role="status" className="text-xs text-indigo-300">
            Matching ticket…
          </p>
        )}
        {matchingError && (
          <p role="alert" className="text-xs text-red-300">
            {matchingError}
          </p>
        )}

        {/* State 1: TEACHING MODE IS ACTIVE */}
        {isTeaching && (
          <div className="space-y-4">
            <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-zinc-200">
                  Demonstration Trace
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {observationEvents.length} semantic action
                  {observationEvents.length !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                ShadowOps abstracts human UI interactions into typed semantic
                skills and parameters.
              </p>
            </div>

            {/* Stream of Recorded Events */}
            <div className="space-y-2">
              {observationEvents.length === 0 ? (
                <div className="border border-dashed border-zinc-800 rounded-lg p-6 text-center">
                  <Sparkles className="w-5 h-5 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-zinc-400">
                    Awaiting demonstration actions
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Click actions in the center workspace (Inspect Customer,
                    Verify Duplicate, Refund, Reply) to demonstrate the process.
                  </p>
                </div>
              ) : (
                observationEvents.map((evt, idx) => (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded-md bg-zinc-950/80 border border-zinc-800/90 text-left transition-all hover:border-zinc-700"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="font-mono text-xs font-medium text-indigo-300">
                          {evt.action}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        #{idx + 1}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 font-medium">
                      {evt.label}
                    </p>

                    {evt.context && Object.keys(evt.context).length > 0 && (
                      <div className="mt-1.5 pt-1.5 border-t border-zinc-800/60 flex flex-wrap gap-1">
                        {Object.entries(evt.context).map(([k, v]) => (
                          <span
                            key={k}
                            className="inline-block text-[10px] font-mono bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800"
                          >
                            {k}:{" "}
                            <span className="text-zinc-200">{String(v)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Stop & Learn CTA */}
            <div className="pt-2 border-t border-zinc-800 space-y-2">
              <button
                onClick={stopTeachingAndLearn}
                disabled={observationEvents.length === 0 || isInferring}
                className="w-full py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                {isInferring ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Inferring Workflow Model...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-3.5 h-3.5" />
                    <span>Stop & Learn Workflow</span>
                  </>
                )}
              </button>

              <button
                onClick={cancelTeaching}
                className="w-full py-1.5 px-3 rounded text-zinc-400 hover:text-zinc-200 text-xs font-normal transition-colors cursor-pointer text-center"
              >
                Cancel Session
              </button>
            </div>
          </div>
        )}

        {/* State 2: NOT TEACHING — SHOW MATCHED SKILL & AUTONOMOUS RUNNER */}
        {!isTeaching && (
          <div className="space-y-4">
            {/* If ticket matches a learned workflow */}
            {matchesWorkflow && activeWorkflow && (
              <div className="bg-gradient-to-br from-indigo-950/70 via-zinc-900 to-zinc-950 border border-indigo-500/40 rounded-xl p-4 shadow-lg shadow-indigo-950/30">
                <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Suggested AI Skill
                </div>

                <h4 className="text-sm font-semibold text-white mb-1">
                  {activeWorkflow.name}
                </h4>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900/50 border border-indigo-700/60 text-indigo-200">
                    Version v{activeWorkflow.version}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {matchingWorkflow?.provenance?.mode === "fixture"
                      ? "Offline match fixture"
                      : `Confidence ${Math.round((matchingWorkflow?.confidence || 0) * 100)}%`}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                  {matchingWorkflow?.reasoning}
                </p>

                <div className="bg-zinc-950/80 rounded-lg p-2.5 border border-zinc-800/80 mb-4 space-y-1.5">
                  <div className="text-[11px] font-medium text-zinc-400 flex items-center justify-between">
                    <span>Workflow Plan</span>
                    <span className="font-mono text-zinc-500">
                      {activeWorkflow.steps.length} steps
                    </span>
                  </div>
                  <div className="space-y-1">
                    {activeWorkflow.steps.map((st, idx) => (
                      <div
                        key={st.id}
                        className="flex items-center gap-1.5 text-[11px] text-zinc-300"
                      >
                        <span className="font-mono text-[10px] text-zinc-500 w-3">
                          {idx + 1}.
                        </span>
                        <span className="truncate">{st.name}</span>
                        {st.condition && (
                          <span className="ml-auto text-[9px] font-mono text-amber-400 bg-amber-950/60 px-1 py-0.2 rounded border border-amber-800/60">
                            {st.condition.field} {st.condition.operator}{" "}
                            {String(st.condition.value)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  disabled={!matchesWorkflow}
                  onClick={() =>
                    executeWorkflowOnTicket(
                      activeWorkflow.id,
                      selectedTicket.id,
                    )
                  }
                  className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run with ShadowOps</span>
                </button>
              </div>
            )}

            {/* If no skill is learned yet */}
            {workflows.length === 0 && (
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 text-left">
                <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold mb-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  No Learned Skills Yet
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                  ShadowOps learns by observing human demonstrations instead of
                  requiring hardcoded RPA or manual workflow builders.
                </p>
                <div className="p-3 bg-zinc-900/90 rounded-lg border border-zinc-800 text-[11px] text-zinc-300 space-y-1.5">
                  <p className="font-medium text-indigo-300">
                    Quick start demonstration:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-zinc-400">
                    <li>
                      Click{" "}
                      <strong className="text-zinc-200">○ Teach Mode</strong> in
                      the top header.
                    </li>
                    <li>Handle ticket #1042 using the workspace actions.</li>
                    <li>
                      Click{" "}
                      <strong className="text-zinc-200">Stop & Learn</strong> to
                      induce the workflow.
                    </li>
                  </ol>
                </div>
              </div>
            )}

            {/* Active Learned Skills Summary */}
            {workflows.length > 0 && (
              <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
                    Active Skill Catalog
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {workflows.length} active
                  </span>
                </div>

                <div className="space-y-2">
                  {workflows.map((wf) => (
                    <div
                      key={wf.id}
                      className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-white">
                          {wf.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-indigo-300 border border-zinc-700">
                          v{wf.version}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 mb-2">
                        {wf.description}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                        <span>{wf.steps.length} steps</span>
                        <span>•</span>
                        <span>
                          {wf.demonstrationsCount} demo
                          {wf.demonstrationsCount > 1 ? "s" : ""}
                        </span>
                        {wf.decisionRules.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 flex items-center gap-0.5">
                              <GitBranch className="w-2.5 h-2.5" />
                              {wf.decisionRules.length} rule
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decision Rules Log */}
            {activeWorkflow && activeWorkflow.decisionRules.length > 0 && (
              <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3.5 space-y-2">
                <span className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                  Learned Decision Rules
                </span>
                <div className="space-y-1.5">
                  {activeWorkflow.decisionRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-2 rounded bg-amber-950/20 border border-amber-800/40 text-left"
                    >
                      <div className="flex items-center justify-between text-[11px] text-amber-300 font-medium mb-0.5">
                        <span className="font-mono text-[10px]">
                          {rule.conditionStr}
                        </span>
                        <span className="font-mono text-[10px] text-amber-400">
                          {Math.round(rule.confidence * 100)}% conf
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-300">
                        {rule.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Audit Trail Link */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between text-[11px] font-mono text-zinc-500">
        <span>Chronological log:</span>
        <button
          onClick={() => setWorkspaceSubTab("activity")}
          className="text-indigo-400 hover:text-indigo-300 font-sans font-medium flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Activity Log ({activities.length})</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </aside>
  );
};
