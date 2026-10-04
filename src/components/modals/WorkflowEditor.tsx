import React, { useState } from "react";
import type { WorkflowDefinition } from "../../types";
import { validateWorkflow } from "../../domain/contracts";
export function WorkflowEditor({
  workflow,
  onSave,
  onClose,
}: {
  workflow: WorkflowDefinition;
  onSave: (edited: WorkflowDefinition) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(() => structuredClone(workflow));
  const [error, setError] = useState("");
  const [args, setArgs] = useState(() =>
    workflow.steps.map((s) => JSON.stringify(s.args, null, 2)),
  );
  const input =
    "w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-sm";
  function save() {
    try {
      const edited = validateWorkflow({
        ...draft,
        steps: draft.steps.map((s, i) => ({ ...s, args: JSON.parse(args[i]) })),
      });
      onSave(edited);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid definition");
    }
  }
  return (
    <div
      role="dialog"
      aria-label="Workflow editor"
      className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-zinc-700">
          <h2 className="text-lg font-semibold">Review and edit workflow</h2>
          <p className="text-xs text-zinc-400">
            Published edits create a new version. Refund policy remains enforced
            independently.
          </p>
        </div>
        <div className="p-5 overflow-auto space-y-4">
          <label className="block">
            Name
            <input
              aria-label="Workflow name"
              className={input}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label className="block">
            Description
            <textarea
              className={input}
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
            />
          </label>
          {draft.steps.map((step, i) => (
            <fieldset
              key={step.id}
              className="border border-zinc-700 rounded-lg p-3 space-y-2"
            >
              <legend className="text-xs text-indigo-300">
                {i + 1}. {step.skill}
              </legend>
              <input
                aria-label={`Step ${i + 1} name`}
                className={input}
                value={step.name}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    steps: draft.steps.map((s, j) =>
                      j === i ? { ...s, name: e.target.value } : s,
                    ),
                  })
                }
              />
              <label className="block text-xs text-zinc-400">
                Arguments (JSON references)
                <textarea
                  aria-label={`Step ${i + 1} arguments`}
                  rows={3}
                  className={input + " font-mono"}
                  value={args[i]}
                  onChange={(e) =>
                    setArgs(args.map((a, j) => (i === j ? e.target.value : a)))
                  }
                />
              </label>
              {step.condition && (
                <label className="block text-xs">
                  Approval threshold ({step.condition.field}{" "}
                  {step.condition.operator})
                  <input
                    type="number"
                    aria-label="Approval threshold"
                    className={input}
                    value={step.condition.value}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        steps: draft.steps.map((s, j) =>
                          j === i
                            ? {
                                ...s,
                                condition: {
                                  ...s.condition!,
                                  value: Number(e.target.value),
                                  description: `Manager approval when ${s.condition!.field} ${s.condition!.operator} ${Number(e.target.value)}`,
                                },
                              }
                            : s,
                        ),
                      })
                    }
                  />
                </label>
              )}
            </fieldset>
          ))}
          {error && (
            <p role="alert" className="text-red-300 text-sm">
              {error}
            </p>
          )}
        </div>
        <div className="p-4 border-t border-zinc-700 flex justify-end gap-3">
          <button onClick={onClose}>Cancel</button>
          <button className="bg-indigo-600 rounded-lg px-4 py-2" onClick={save}>
            Validate and save
          </button>
        </div>
      </div>
    </div>
  );
}
