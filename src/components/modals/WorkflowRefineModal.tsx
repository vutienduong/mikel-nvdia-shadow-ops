import React from "react";
import { useApp } from "../../context/AppContext";
import {
  GitBranch,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  X,
  Plus,
} from "lucide-react";

interface Props {
  proposal: any;
  onClose: () => void;
}

export const WorkflowRefineModal: React.FC<Props> = ({ proposal, onClose }) => {
  const { applyRefinement, workflows } = useApp();
  const currentWorkflow = workflows.find((w) => w.id === proposal.workflowId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-amber-600/50 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-600/20">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300 font-semibold">
                  New Decision Rule Discovered
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  {proposal.provenance?.mode === "fixture"
                    ? "Demo fixture"
                    : `Confidence: ${Math.round(proposal.confidence * 100)}%`}
                </span>
              </div>
              <h3 className="text-base font-semibold text-white tracking-tight mt-0.5">
                Suggested Workflow Refinement
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

        <p className="px-6 py-2 text-xs text-amber-200 bg-amber-950/20">
          {proposal.provenance?.mode === "fixture"
            ? "Offline demo comparison fixture — no AI rule inference."
            : `Nemotron via Nebius: ${proposal.provenance?.model || "unknown"}`}
        </p>
        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="bg-amber-950/20 border border-amber-800/50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Inferred Conditional Rule
            </div>
            <p className="text-sm font-semibold text-white">
              "{proposal.ruleDescription || proposal.condition?.description}"
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-300/90 pt-1">
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-amber-800/40">
                IF {proposal.condition?.field} {proposal.condition?.operator}{" "}
                {proposal.condition?.value}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
              <span className="px-2 py-0.5 rounded bg-zinc-900 border border-amber-800/40">
                THEN {proposal.insertedStep?.skill}
              </span>
            </div>
          </div>

          {/* Reasoning Diff */}
          <div className="space-y-2 text-xs">
            <h5 className="font-medium text-zinc-300">
              Cross-Demonstration Reasoning:
            </h5>
            <p className="text-zinc-400 leading-relaxed bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-800 text-xs">
              {proposal.reasoning}
            </p>
          </div>

          {/* Target Workflow Update preview */}
          <div className="bg-zinc-950 rounded-lg p-3.5 border border-zinc-800 text-xs flex items-center justify-between">
            <div>
              <span className="text-zinc-400 block text-[11px]">
                Workflow Target:
              </span>
              <span className="font-semibold text-white">
                {currentWorkflow?.name || "Duplicate Payment Resolution"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-zinc-400 block text-[11px]">
                Target Version:
              </span>
              <span className="font-mono text-indigo-400 font-semibold">
                v{currentWorkflow?.version || 1} &rarr; v
                {(currentWorkflow?.version || 1) + 1}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            Never silently mutates workflows without human approval.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Reject
            </button>

            <button
              onClick={applyRefinement}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-amber-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Rule (v{(currentWorkflow?.version || 1) + 1})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
