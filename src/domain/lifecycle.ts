import { validateWorkflow } from "./contracts";
import type { WorkflowDefinition, WorkflowRun } from "../types";
export function archiveVersion(
  workflow: WorkflowDefinition,
): WorkflowDefinition {
  return { ...structuredClone(workflow), status: "archived" };
}
export function editWorkflow(current: WorkflowDefinition, edited: unknown) {
  const proposed = edited as WorkflowDefinition;
  const next = validateWorkflow({
    ...proposed,
    steps: proposed.steps.map((step) =>
      step.condition
        ? {
            ...step,
            condition: {
              ...step.condition,
              description: `Manager approval when ${step.condition.field} ${step.condition.operator} ${step.condition.value}`,
            },
          }
        : step,
    ),
    decisionRules: proposed.steps
      .filter((step) => step.condition)
      .map((step) => ({
        id: `RULE_${step.id}`,
        description: `Manager approval when ${step.condition!.field} ${step.condition!.operator} ${step.condition!.value}`,
        conditionStr: `${step.condition!.field} ${step.condition!.operator} ${step.condition!.value}`,
        confidence: current.confidence,
        discoveredAt: new Date().toISOString(),
      })),
    id: current.id,
    slug: current.slug,
    version: current.version + 1,
    status: "active",
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
    provenance: current.provenance,
    sourceDemonstrationIds: current.sourceDemonstrationIds,
    humanEditedAt: new Date().toISOString(),
  });
  return { archived: archiveVersion(current), current: structuredClone(next) };
}
export function filterRuns(
  runs: WorkflowRun[],
  filter: {
    status?: WorkflowRun["status"] | "all";
    from?: string;
    to?: string;
  },
) {
  const from = filter.from ? Date.parse(filter.from) : -Infinity,
    to = filter.to ? Date.parse(filter.to) : Infinity;
  return runs.filter(
    (r) =>
      (!filter.status ||
        filter.status === "all" ||
        r.status === filter.status) &&
      Date.parse(r.startedAt) >= from &&
      Date.parse(r.startedAt) <= to,
  );
}
export function summarizeRuns(runs: WorkflowRun[]) {
  const completed = runs.filter((r) => r.status === "completed").length,
    failed = runs.filter((r) => r.status === "failed").length;
  const durations = runs
    .filter(
      (r) =>
        ["completed", "failed"].includes(r.status) &&
        Number.isFinite(r.durationMs) &&
        r.durationMs! >= 0,
    )
    .map((r) => r.durationMs!);
  return {
    total: runs.length,
    completed,
    failed,
    waitingApproval: runs.filter((r) => r.status === "waiting_approval").length,
    successRate: completed + failed ? completed / (completed + failed) : null,
    averageDurationMs: durations.length
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : null,
  };
}
export function containsRefundAmount(text: string, amount: number): boolean {
  const number = "(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?";
  const pattern = new RegExp(
    `(?:\\$\\s*|\\bUSD\\s+)(${number})(?!\\d|,\\d)|(?<![\\d,])(${number})\\s+USD\\b`,
    "gi",
  );
  return [...text.matchAll(pattern)].some((match) => {
    const value = Number((match[1] || match[2]).replaceAll(",", ""));
    return Number.isFinite(value) && Math.abs(value - amount) < 0.000001;
  });
}
