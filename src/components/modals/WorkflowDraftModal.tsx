import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  BrainCircuit,
  CheckCircle,
  Code,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
  Workflow,
  Zap,
} from "lucide-react";
import { WorkflowDefinition } from "../../types";

import { WorkflowEditor } from "./WorkflowEditor";

interface Props {
  workflow: WorkflowDefinition;
  onClose: () => void;
}

export const WorkflowDraftModal: React.FC<Props> = ({ workflow, onClose }) => {
  const { saveDraftWorkflow, setDraftWorkflow } = useApp();
  const [editing, setEditing] = useState(false);
  const [viewMode, setViewMode] = useState<"visual" | "json">("visual");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-medium">
                  Workflow Induced
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  {workflow.provenance?.mode === "fixture"
                    ? "Demo fixture"
                    : `Confidence: ${Math.round(workflow.confidence * 100)}%`}
                </span>
              </div>
              <h3 className="text-base font-semibold text-white tracking-tight mt-0.5">
                {workflow.name} (v{workflow.version})
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
          {workflow.provenance?.mode === "fixture"
            ? "Offline demo fixture — this workflow was not inferred by AI."
            : `Nemotron via Nebius: ${workflow.provenance?.model || "unknown"}`}
        </p>
        {/* View Switcher Tabs */}
        <div className="px-6 py-2.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("visual")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                viewMode === "visual"
                  ? "bg-zinc-800 text-white font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Execution DAG Plan
            </button>
            <button
              onClick={() => setViewMode("json")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                viewMode === "json"
                  ? "bg-zinc-800 text-white font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Workflow Intermediate Representation (IR)
            </button>
          </div>

          <span className="text-[11px] font-mono text-zinc-400">
            {workflow.steps.length} Steps Synthesized
          </span>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
            {workflow.description}
          </p>

          {viewMode === "visual" ? (
            <div className="space-y-2">
              <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                Synthesized Skill Sequence:
              </div>

              {workflow.steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/90 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-400 flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">
                          {step.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/60">
                          {step.skill}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {step.args && Object.keys(step.args).length > 0 && (
                    <div className="hidden sm:flex flex-col items-end text-[10px] font-mono text-zinc-500">
                      <span>Args: {Object.keys(step.args).join(", ")}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-zinc-950 rounded-lg p-4 border border-zinc-800 font-mono text-xs text-indigo-300 overflow-x-auto max-h-96">
              <pre>{JSON.stringify(workflow, null, 2)}</pre>
            </div>
          )}
        </div>

        {editing && (
          <WorkflowEditor
            workflow={workflow}
            onSave={setDraftWorkflow}
            onClose={() => setEditing(false)}
          />
        )}
        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500 font-mono">
            Trigger: {workflow.trigger.type} ({workflow.trigger.intent})
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-2 text-indigo-300"
            >
              Edit draft
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Discard
            </button>

            <button
              onClick={() => saveDraftWorkflow(workflow)}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Save as Active Skill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
