import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { WorkflowRun } from '../../types';
import {
  History,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  FastForward,
  Check,
  Search,
  Filter,
  X,
  ArrowUpDown,
  Calendar,
} from 'lucide-react';

export const RunsView: React.FC = () => {
  const { runs, setActiveTab, setSelectedTicketId } = useApp();
  const [selectedRunId, setSelectedRunId] = useState<string>('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed' | 'running'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'fastest' | 'steps'>('newest');

  // Filtered & sorted runs
  const filteredRuns = useMemo(() => {
    return runs
      .filter((r) => {
        // Status filter
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;

        // Date filter
        if (dateFilter !== 'all') {
          const runDateStr = r.startedAt.toLowerCase();
          if (dateFilter === 'today' && !runDateStr.includes('today') && !runDateStr.includes('2026-10-15') && !runDateStr.includes(':')) {
            return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchId = r.id.toLowerCase().includes(q);
          const matchName = r.workflowName.toLowerCase().includes(q);
          const matchCust = r.customerName.toLowerCase().includes(q);
          const matchTicket = r.ticketId.toLowerCase().includes(q);
          const matchOutcome = r.outcomeSummary?.toLowerCase().includes(q) || false;
          if (!matchId && !matchName && !matchCust && !matchTicket && !matchOutcome) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime() || b.id.localeCompare(a.id);
        }
        if (sortBy === 'oldest') {
          return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime() || a.id.localeCompare(b.id);
        }
        if (sortBy === 'fastest') {
          return (a.durationMs || 1420) - (b.durationMs || 1420);
        }
        if (sortBy === 'steps') {
          return b.steps.length - a.steps.length;
        }
        return 0;
      });
  }, [runs, statusFilter, dateFilter, searchQuery, sortBy]);

  const selectedRun =
    filteredRuns.find((r) => r.id === selectedRunId) ||
    filteredRuns[0] ||
    runs[0] ||
    null;

  const isFilterActive =
    searchQuery.trim() !== '' || statusFilter !== 'all' || dateFilter !== 'all' || sortBy !== 'newest';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter('all');
    setSortBy('newest');
  };

  return (
    <div className="flex-1 bg-zinc-950 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <History className="w-6 h-6 text-indigo-400" />
              Autonomous Run History & Audit Logs
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              End-to-end trace logs for every autonomous workflow executed by ShadowOps.
            </p>
          </div>

          <span className="font-mono text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
            {runs.length} Total Run{runs.length !== 1 ? 's' : ''} Logged
          </span>
        </div>

        {/* Global Search and Filter Bar */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-60">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search runs by ID, workflow, customer, or ticket (#RUN_201, Maria Chen)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-9 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-zinc-700 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
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
                <span className="text-[10px] text-zinc-500 px-1 font-mono uppercase">Status:</span>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-zinc-800 text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    statusFilter === 'completed'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setStatusFilter('failed')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    statusFilter === 'failed'
                      ? 'bg-red-950 text-red-300 border border-red-800/80 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Halted / Guardrail
                </button>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1.5 rounded-lg border border-zinc-800 text-zinc-400">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="bg-transparent text-xs text-zinc-200 focus:outline-hidden cursor-pointer"
                >
                  <option value="all" className="bg-zinc-900 text-zinc-200">
                    Date: All Time
                  </option>
                  <option value="today" className="bg-zinc-900 text-zinc-200">
                    Date: Today
                  </option>
                  <option value="7d" className="bg-zinc-900 text-zinc-200">
                    Date: Past 7 Days
                  </option>
                  <option value="30d" className="bg-zinc-900 text-zinc-200">
                    Date: Past 30 Days
                  </option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1.5 rounded-lg border border-zinc-800 text-zinc-400">
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs text-zinc-200 focus:outline-hidden cursor-pointer"
                >
                  <option value="newest" className="bg-zinc-900 text-zinc-200">
                    Sort: Newest
                  </option>
                  <option value="oldest" className="bg-zinc-900 text-zinc-200">
                    Sort: Oldest
                  </option>
                  <option value="fastest" className="bg-zinc-900 text-zinc-200">
                    Sort: Fastest Latency
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
              Showing <strong className="text-zinc-200">{filteredRuns.length}</strong> of{' '}
              {runs.length} execution runs
              {searchQuery && ` matching "${searchQuery}"`}
            </span>
            <span className="text-zinc-500">Filterable by name, execution status, and timestamp</span>
          </div>
        </div>

        {runs.length === 0 ? (
          <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-12 text-center space-y-3">
            <History className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-semibold text-zinc-300">No Autonomous Runs Yet</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
              Once you induce a workflow from demonstration, you can run it autonomously on any matching ticket (like #1044 Daniel Lee).
            </p>
            <button
              onClick={() => setActiveTab('workspace')}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Go to Workspace
            </button>
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-10 text-center space-y-3">
            <Search className="w-8 h-8 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-300">No execution runs match your search or filters</h3>
            <p className="text-xs text-zinc-500">
              Try adjusting your query or resetting filters to view all historical runs.
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
            {/* Left Column: Runs List */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                Execution Runs ({filteredRuns.length})
              </span>

              {filteredRuns.map((r) => {
                const isSelected = selectedRun?.id === r.id;
                const completedStepsCount = r.steps.filter((s) => s.status === 'completed').length;

                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRunId(r.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-zinc-900 border-indigo-500/80 shadow-md shadow-indigo-950/40'
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono text-zinc-300 font-semibold">
                        #{r.id}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                          r.status === 'completed'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            : r.status === 'failed'
                            ? 'bg-red-950/80 text-red-300 border border-red-800'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-white mb-0.5">{r.workflowName}</h4>
                    <p className="text-[11px] text-zinc-400 mb-2">
                      Target: {r.customerName} (#{r.ticketId})
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-800/60">
                      <span>{completedStepsCount}/{r.steps.length} Steps</span>
                      <span>•</span>
                      <span>{r.durationMs || 1420}ms</span>
                      <span>•</span>
                      <span>{r.startedAt}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right 2 Columns: Selected Run Trace Inspection */}
            {selectedRun && (
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-white">Execution Trace: #{selectedRun.id}</h2>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          v{selectedRun.workflowVersion}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Workflow: <strong className="text-zinc-200">{selectedRun.workflowName}</strong> • Ticket: #{selectedRun.ticketId} ({selectedRun.customerName})
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedTicketId(selectedRun.ticketId);
                        setActiveTab('workspace');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Outcome Alert */}
                  {selectedRun.outcomeSummary && (
                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{selectedRun.outcomeSummary}</span>
                    </div>
                  )}

                  {/* Step Execution Sequence */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                      Skill Execution DAG Trace
                    </span>

                    <div className="space-y-2">
                      {selectedRun.steps.map((st, idx) => (
                        <div
                          key={st.id}
                          className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/90 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              {st.status === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                              ) : st.status === 'skipped' ? (
                                <FastForward className="w-4 h-4 text-amber-400 flex-shrink-0" />
                              ) : (
                                <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
                              )}
                              <span className="font-semibold text-white">{st.name}</span>
                              <span className="font-mono text-[10px] text-zinc-500">
                                ({st.skillId})
                              </span>
                            </div>

                            <span className="font-mono text-[11px] text-zinc-400">
                              {st.latencyMs > 0 ? `${st.latencyMs}ms` : 'skipped'}
                            </span>
                          </div>

                          {st.output && (
                            <div className="bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800/60 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                              <pre>{JSON.stringify(st.output, null, 2)}</pre>
                            </div>
                          )}

                          {st.error && (
                            <div className="text-red-400 text-xs font-mono font-medium">
                              Error: {st.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
