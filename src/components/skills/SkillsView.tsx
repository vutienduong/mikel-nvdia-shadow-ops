import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { SKILL_REGISTRY } from "../../data/skillRegistry";
import {
  Layers,
  CheckCircle,
  GitBranch,
  Shield,
  Play,
  ArrowRight,
  Code,
  Calendar,
  Sparkles,
  Workflow,
  Zap,
  Search,
  Filter,
  X,
  SlidersHorizontal,
  ArrowUpDown,
} from "lucide-react";

export const SkillsView: React.FC = () => {
  const {
    workflows,
    runs,
    setActiveTab,
    setSelectedTicketId,
    executeWorkflowOnTicket,
  } = useApp();
  const [selectedWfId, setSelectedWfId] = useState<string>("");
  const [showIR, setShowIR] = useState<boolean>(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">(
    "all",
  );
  const [versionFilter, setVersionFilter] = useState<"all" | "v1" | "v2">(
    "all",
  );
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "steps" | "confidence"
  >("newest");

  const atomicSkills = Object.values(SKILL_REGISTRY);

  // Filtered & sorted workflows
  const filteredWorkflows = useMemo(() => {
    return workflows
      .filter((wf) => {
        // Status filter
        if (statusFilter !== "all" && wf.status !== statusFilter) return false;

        // Version filter
        if (versionFilter === "v1" && wf.version !== 1) return false;
        if (versionFilter === "v2" && wf.version < 2) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = wf.name.toLowerCase().includes(q);
          const matchDesc = wf.description.toLowerCase().includes(q);
          const matchSlug = wf.slug.toLowerCase().includes(q);
          const matchSteps = wf.steps.some(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.skill.toLowerCase().includes(q),
          );
          const matchRules = wf.decisionRules.some((r) =>
            r.description.toLowerCase().includes(q),
          );
          if (
            !matchName &&
            !matchDesc &&
            !matchSlug &&
            !matchSteps &&
            !matchRules
          )
            return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return (
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime()
          );
        }
        if (sortBy === "oldest") {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }
        if (sortBy === "steps") {
          return b.steps.length - a.steps.length;
        }
        if (sortBy === "confidence") {
          return b.confidence - a.confidence;
        }
        return 0;
      });
  }, [workflows, statusFilter, versionFilter, searchQuery, sortBy]);

  const currentWf =
    filteredWorkflows.find((w) => w.id === selectedWfId) ||
    filteredWorkflows[0] ||
    workflows[0] ||
    null;

  const isFilterActive =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    versionFilter !== "all" ||
    sortBy !== "newest";

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setVersionFilter("all");
    setSortBy("newest");
  };

  return (
    <div className="flex-1 bg-zinc-950 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-400" />
              Organizational Skills & Workflow Registry
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Reusable operational workflows synthesized from human
              demonstrations through ShadowOps induction.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
              {workflows.length} Learned Workflow
              {workflows.length !== 1 ? "s" : ""}
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-indigo-400">
              {atomicSkills.length} Atomic Skills
            </span>
          </div>
        </div>

        {/* Global Search and Filter Bar */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-60">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search workflows by name, description, skill or rule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-9 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-zinc-700 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Selectors */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 px-1 font-mono uppercase">
                  Status:
                </span>
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    statusFilter === "all"
                      ? "bg-zinc-800 text-white font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    statusFilter === "active"
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Active
                </button>
              </div>

              {/* Version Filter */}
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 px-1 font-mono uppercase">
                  Ver:
                </span>
                <button
                  onClick={() => setVersionFilter("all")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    versionFilter === "all"
                      ? "bg-zinc-800 text-white font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setVersionFilter("v1")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    versionFilter === "v1"
                      ? "bg-zinc-800 text-white font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  v1
                </button>
                <button
                  onClick={() => setVersionFilter("v2")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    versionFilter === "v2"
                      ? "bg-indigo-950 text-indigo-300 border border-indigo-800/80 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  v2+
                </button>
              </div>

              {/* Sort By / Date */}
              <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1.5 rounded-lg border border-zinc-800 text-zinc-400">
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs text-zinc-200 focus:outline-hidden cursor-pointer"
                >
                  <option value="newest" className="bg-zinc-900 text-zinc-200">
                    Sort: Newest Date
                  </option>
                  <option value="oldest" className="bg-zinc-900 text-zinc-200">
                    Sort: Oldest Date
                  </option>
                  <option
                    value="confidence"
                    className="bg-zinc-900 text-zinc-200"
                  >
                    Sort: Highest Confidence
                  </option>
                  <option value="steps" className="bg-zinc-900 text-zinc-200">
                    Sort: Most Steps
                  </option>
                </select>
              </div>

              {/* Reset filter button */}
              {isFilterActive && (
                <button
                  onClick={resetFilters}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Active summary label */}
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1 border-t border-zinc-800/60">
            <span>
              Showing{" "}
              <strong className="text-zinc-200">
                {filteredWorkflows.length}
              </strong>{" "}
              of {workflows.length} workflows
              {searchQuery && ` matching "${searchQuery}"`}
            </span>
            <span className="text-zinc-500">
              Filters dynamically synchronize across versions & dates
            </span>
          </div>
        </div>

        {/* If no workflows learned yet */}
        {workflows.length === 0 ? (
          <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-12 text-center space-y-3">
            <Workflow className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-semibold text-zinc-300">
              No Reusable Skills Induced Yet
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
              ShadowOps does not use manual drag-and-drop builders. Enable{" "}
              <strong className="text-zinc-300">○ Teach Mode</strong> in the
              workspace, handle ticket #1042 manually, and ShadowOps will
              compile the skill for you.
            </p>
            <button
              onClick={() => setActiveTab("workspace")}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Go to Workspace
            </button>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-10 text-center space-y-3">
            <Search className="w-8 h-8 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-300">
              No workflows match your search or filters
            </h3>
            <p className="text-xs text-zinc-500">
              Try adjusting your query or resetting filters to view all learned
              automations.
            </p>
            <button
              onClick={resetFilters}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Workflows List */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                Learned Workflows ({filteredWorkflows.length})
              </span>

              {filteredWorkflows.map((wf) => {
                const isSelected = wf.id === currentWf?.id;
                return (
                  <div
                    key={wf.id}
                    onClick={() => setSelectedWfId(wf.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-zinc-900 border-indigo-500/80 shadow-md shadow-indigo-950/40"
                        : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-indigo-300 border border-zinc-700 font-medium">
                        v{wf.version}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {wf.provenance?.mode === "fixture"
                          ? "Offline fixture"
                          : `${Math.round(wf.confidence * 100)}% conf`}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-white mb-1">
                      {wf.name}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                      {wf.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-2 border-t border-zinc-800/60">
                      <span>{wf.steps.length} Steps</span>
                      <span>•</span>
                      <span>{wf.demonstrationsCount} Demos</span>
                      {wf.decisionRules.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400">
                            {wf.decisionRules.length} Rule
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Center/Right 2 Columns: Selected Workflow DAG & Decision Rules */}
            {currentWf && (
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-white">
                          {currentWf.name}
                        </h2>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-950/70 text-indigo-300 border border-indigo-800">
                          v{currentWf.version} Active
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Trigger:{" "}
                        <code className="text-zinc-300">
                          {currentWf.trigger.type}
                        </code>{" "}
                        with intent{" "}
                        <code className="text-zinc-300">
                          {currentWf.trigger.intent}
                        </code>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowIR(!showIR)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Code className="w-3.5 h-3.5" />
                        {showIR ? "Visual Graph" : "Inspect JSON IR"}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedTicketId("TICK_1044");
                          setActiveTab("workspace");
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        Run Autonomous Test
                      </button>
                    </div>
                  </div>

                  {showIR ? (
                    <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 font-mono text-xs text-indigo-300 overflow-x-auto max-h-[500px]">
                      <pre>{JSON.stringify(currentWf, null, 2)}</pre>
                    </div>
                  ) : (
                    /* Visual Step Sequence & Decision Nodes */
                    <div className="space-y-4">
                      <div className="space-y-2.5">
                        {currentWf.steps.map((st, idx) => (
                          <div key={st.id} className="relative">
                            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/90 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-400 flex items-center justify-center font-semibold">
                                  {idx + 1}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-semibold text-white">
                                      {st.name}
                                    </h4>
                                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                      {st.skill}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-zinc-400 mt-0.5">
                                    {st.description}
                                  </p>
                                </div>
                              </div>

                              {st.condition && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-800 text-amber-300 font-mono text-[10px]">
                                  <GitBranch className="w-3 h-3 text-amber-400" />
                                  <span>
                                    IF {st.condition.field} &gt;{" "}
                                    {st.condition.value}
                                  </span>
                                </div>
                              )}
                            </div>

                            {idx < currentWf.steps.length - 1 && (
                              <div className="w-0.5 h-3 bg-zinc-800 mx-auto my-0.5" />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Discovered Decision Rules Section */}
                      {currentWf.decisionRules.length > 0 && (
                        <div className="pt-4 border-t border-zinc-800 space-y-2">
                          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <GitBranch className="w-3.5 h-3.5" />
                            Discovered Decision Rules
                          </span>
                          <div className="space-y-2">
                            {currentWf.decisionRules.map((rule) => (
                              <div
                                key={rule.id}
                                className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 text-xs"
                              >
                                <div className="flex items-center justify-between mb-1 font-mono text-[11px]">
                                  <span className="text-amber-300 font-semibold">
                                    {rule.conditionStr}
                                  </span>
                                  <span className="text-zinc-500">
                                    {rule.discoveredAt.split("T")[0]}
                                  </span>
                                </div>
                                <p className="text-zinc-300 leading-relaxed">
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
              </div>
            )}
          </div>
        )}

        {/* Bottom Section: Atomic Skills Registry */}
        <div className="space-y-4 pt-4 border-t border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              Underlying Atomic Skill Registry ({atomicSkills.length})
            </h2>
            <p className="text-xs text-zinc-400">
              Granular, typed deterministic tools executed by ShadowOps
              workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {atomicSkills.map((sk) => (
              <div
                key={sk.id}
                className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-2 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-indigo-300">
                    {sk.id}
                  </span>
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-semibold ${
                      sk.riskLevel === "high"
                        ? "bg-red-950 text-red-300 border border-red-800"
                        : sk.riskLevel === "medium"
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {sk.riskLevel} risk
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-white">{sk.name}</h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {sk.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
