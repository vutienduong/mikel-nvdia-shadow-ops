import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { filterRuns, summarizeRuns } from "../../domain/lifecycle";
import { SKILL_REGISTRY } from "../../data/skillRegistry";
export function AnalyticsView() {
  const { runs } = useApp();
  const [days, setDays] = useState("all");
  const now = new Date();
  const selected = filterRuns(runs, {
    from:
      days === "all"
        ? undefined
        : new Date(now.getTime() - Number(days) * 86400000).toISOString(),
    to: now.toISOString(),
  });
  const summary = summarizeRuns(selected);
  const counts = Object.values(SKILL_REGISTRY).map((skill) => ({
    ...skill,
    count: selected
      .flatMap((r) => r.steps)
      .filter((s) => s.skillId === skill.id && s.status === "completed").length,
  }));
  const metrics = [
    ["Recorded runs", summary.total],
    ["Completed", summary.completed],
    ["Failed / stopped", summary.failed],
    ["Waiting approval", summary.waitingApproval],
    [
      "Completion rate",
      summary.successRate === null
        ? "—"
        : `${(summary.successRate * 100).toFixed(1)}%`,
    ],
    [
      "Average terminal duration",
      summary.averageDurationMs === null
        ? "—"
        : `${(summary.averageDurationMs / 1000).toFixed(2)}s`,
    ],
  ];
  return (
    <main className="flex-1 overflow-auto p-6 bg-zinc-950">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between">
          <div>
            <h1 className="text-xl font-bold">Operational analytics</h1>
            <p className="text-xs text-zinc-400 mt-2">
              Measured from this browser’s run history. Completion rate excludes
              active/pending runs; no estimated labor savings.
            </p>
          </div>
          <select
            aria-label="Analytics period"
            className="bg-zinc-900 border border-zinc-700 rounded p-2"
            value={days}
            onChange={(e) => setDays(e.target.value)}
          >
            <option value="all">All time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {metrics.map(([name, value]) => (
            <div
              key={name}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
            >
              <p className="text-xs text-zinc-400">{name}</p>
              <p className="text-3xl font-mono mt-3">{value}</p>
            </div>
          ))}
        </div>
        {!selected.length && (
          <p className="text-zinc-400">
            No recorded runs in this period. Teach a workflow and execute a
            ticket to collect metrics.
          </p>
        )}
        <section className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
          <h2 className="font-semibold mb-4">Completed skill invocations</h2>
          <div className="space-y-3">
            {counts.map((skill) => (
              <div
                key={skill.id}
                className="flex justify-between border-b border-zinc-800 pb-2 text-sm"
              >
                <span>{skill.name}</span>
                <span className="font-mono text-indigo-300">{skill.count}</span>
              </div>
            ))}
          </div>
        </section>
        <p className="text-xs text-zinc-500">
          Runs can contain live or offline fixture workflows. Payments and
          message delivery remain mock operations in both modes.
        </p>
      </div>
    </main>
  );
}
