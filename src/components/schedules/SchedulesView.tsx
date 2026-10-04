import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SkillSchedule } from '../../types';
import {
  CalendarClock,
  Clock,
  Play,
  Pause,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  Layers,
  Search,
  Filter,
  X,
  ArrowRight,
  Globe,
  SlidersHorizontal,
  Info,
  ChevronRight,
  Check,
} from 'lucide-react';

// Preset cron helpers
const CRON_PRESETS = [
  { label: 'Every 15 minutes', cron: '*/15 * * * *', readable: 'Every 15 minutes (High-frequency)' },
  { label: 'Every hour', cron: '0 * * * *', readable: 'Every hour at minute 0' },
  { label: 'Every 2 hours', cron: '0 */2 * * *', readable: 'Every 2 hours' },
  { label: 'Daily at 08:00 AM', cron: '0 8 * * *', readable: 'Daily at 08:00 AM' },
  { label: 'Nightly at Midnight', cron: '0 0 * * *', readable: 'Daily at 00:00 (Midnight)' },
  { label: 'Weekly on Monday', cron: '0 9 * * 1', readable: 'Every Monday at 09:00 AM' },
];

export const SchedulesView: React.FC = () => {
  const {
    schedules,
    workflows,
    addSchedule,
    toggleScheduleStatus,
    deleteSchedule,
    triggerScheduleNow,
    setActiveTab,
    setSelectedTicketId,
  } = useApp();

  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'matching_tickets' | 'pending_inbox' | 'reconciliation_scan'>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isTriggeringId, setIsTriggeringId] = useState<string | null>(null);

  // New Schedule Form state
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(workflows[0]?.id || 'duplicate_payment_resolution');
  const [cronExpression, setCronExpression] = useState<string>('0 */2 * * *');
  const [humanReadable, setHumanReadable] = useState<string>('Every 2 hours');
  const [targetScope, setTargetScope] = useState<'matching_tickets' | 'pending_inbox' | 'reconciliation_scan'>('matching_tickets');
  const [timezone, setTimezone] = useState<string>('UTC');
  const [description, setDescription] = useState<string>('Autonomous queue scanner for duplicate payment inquiries and refund resolution.');

  // Parse preset selection
  const handleSelectPreset = (preset: typeof CRON_PRESETS[0]) => {
    setCronExpression(preset.cron);
    setHumanReadable(preset.readable);
  };

  // Submit new schedule
  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const wf = workflows.find((w) => w.id === selectedWorkflowId || w.slug === selectedWorkflowId) || workflows[0];
    if (!wf) return;

    addSchedule({
      workflowId: wf.slug || wf.id,
      workflowName: wf.name,
      cronExpression,
      humanReadable,
      description: description || `Automated recurring execution of ${wf.name}`,
      timezone,
      status: 'active',
      targetScope,
      nextRunAt: 'Scheduled next interval',
    });

    setIsModalOpen(false);
  };

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (scopeFilter !== 'all' && s.targetScope !== scopeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = s.id.toLowerCase().includes(q);
        const matchName = s.workflowName.toLowerCase().includes(q);
        const matchCron = s.cronExpression.toLowerCase().includes(q);
        const matchDesc = s.description.toLowerCase().includes(q);
        const matchReadable = s.humanReadable.toLowerCase().includes(q);
        if (!matchId && !matchName && !matchCron && !matchDesc && !matchReadable) return false;
      }
      return true;
    });
  }, [schedules, statusFilter, scopeFilter, searchQuery]);

  const activeSchedulesCount = schedules.filter((s) => s.status === 'active').length;
  const totalExecutionsCount = schedules.reduce((acc, s) => acc + s.executionCount, 0);

  const handleManualTrigger = async (id: string) => {
    setIsTriggeringId(id);
    try {
      await triggerScheduleNow(id);
    } finally {
      setTimeout(() => setIsTriggeringId(null), 800);
    }
  };

  const isFilterActive = searchQuery.trim() !== '' || statusFilter !== 'all' || scopeFilter !== 'all';

  return (
    <div className="flex-1 bg-zinc-950 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-7">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800 text-indigo-300 font-semibold tracking-wide">
                Autonomous Dispatch
              </span>
              <span className="text-xs text-zinc-500 font-mono">Unattended Cron Daemon</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 mt-1">
              <CalendarClock className="w-6 h-6 text-indigo-400" />
              Automated Skill Schedules & Cron Triggers
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Configure recurring cron intervals for learned skills to run autonomously with zero human intervention.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Define New Schedule</span>
            </button>
          </div>
        </div>

        {/* 3 Telemetry Scorecards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4.5 space-y-1">
            <span className="text-xs font-medium text-zinc-400">Total Configured Triggers</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">{schedules.length}</span>
              <span className="text-xs text-zinc-500 font-mono">cron jobs</span>
            </div>
            <p className="text-[11px] text-zinc-500">Autonomous triggers registered on worker node</p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4.5 space-y-1">
            <span className="text-xs font-medium text-zinc-400">Active Recurring Daemons</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-400">{activeSchedulesCount}</span>
              <span className="text-xs text-zinc-500 font-mono">active / {schedules.length}</span>
            </div>
            <p className="text-[11px] text-zinc-500">Executing automatically on set cron schedules</p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4.5 space-y-1">
            <span className="text-xs font-medium text-zinc-400">Unattended Executions</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-indigo-300">{totalExecutionsCount}</span>
              <span className="text-xs text-emerald-400 font-mono">100% success</span>
            </div>
            <p className="text-[11px] text-zinc-500">Total automated resolutions triggered by cron</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 space-y-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-60">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search schedules by workflow, cron string, or scope..."
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

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Status */}
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
                  onClick={() => setStatusFilter('active')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    statusFilter === 'active'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setStatusFilter('paused')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                    statusFilter === 'paused'
                      ? 'bg-zinc-800 text-zinc-200 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Paused
                </button>
              </div>

              {/* Target Scope */}
              <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1.5 rounded-lg border border-zinc-800 text-zinc-400">
                <Filter className="w-3.5 h-3.5 text-zinc-500" />
                <select
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value as any)}
                  className="bg-transparent text-xs text-zinc-200 focus:outline-hidden cursor-pointer"
                >
                  <option value="all" className="bg-zinc-900 text-zinc-200">
                    Scope: All Scopes
                  </option>
                  <option value="matching_tickets" className="bg-zinc-900 text-zinc-200">
                    Scope: Matching Tickets
                  </option>
                  <option value="pending_inbox" className="bg-zinc-900 text-zinc-200">
                    Scope: Pending Inbox
                  </option>
                  <option value="reconciliation_scan" className="bg-zinc-900 text-zinc-200">
                    Scope: Reconciliation Scan
                  </option>
                </select>
              </div>

              {isFilterActive && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setScopeFilter('all');
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1 border-t border-zinc-800/60">
            <span>
              Showing <strong className="text-zinc-200">{filteredSchedules.length}</strong> of{' '}
              {schedules.length} triggers
            </span>
            <span className="text-zinc-500">Autonomous cron daemon active</span>
          </div>
        </div>

        {/* Schedules Cards List */}
        {filteredSchedules.length === 0 ? (
          <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-12 text-center space-y-3">
            <CalendarClock className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-300">No matching schedules found</h3>
            <p className="text-xs text-zinc-500">
              Create a new automated cron trigger or reset your filters.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
            >
              Define Schedule
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSchedules.map((item) => {
              const isActive = item.status === 'active';
              const isTriggering = isTriggeringId === item.id;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-5 space-y-4 transition-all ${
                    isActive
                      ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 shadow-sm'
                      : 'bg-zinc-900/30 border-zinc-800/60 opacity-80'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-indigo-300 border border-zinc-700">
                          {item.id}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold flex items-center gap-1 ${
                            isActive
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                            }`}
                          />
                          {item.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{item.workflowName}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleScheduleStatus(item.id)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                            : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800'
                        }`}
                        title={isActive ? 'Pause schedule' : 'Resume schedule'}
                      >
                        {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => deleteSchedule(item.id)}
                        className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-red-950/80 hover:text-red-300 hover:border-red-800 border border-zinc-700 text-zinc-400 transition-colors cursor-pointer"
                        title="Delete schedule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">{item.description}</p>

                  {/* Cron Specs Box */}
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <code className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-indigo-300 font-bold text-[11px]">
                          {item.cronExpression}
                        </code>
                      </div>
                      <span className="text-[11px] text-zinc-400">{item.humanReadable}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-zinc-800/60 text-zinc-500">
                      <span>Timezone: {item.timezone}</span>
                      <span>Target: {item.targetScope.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {/* Execution Metrics & Next Run */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/60">
                    <div className="space-y-0.5 font-mono text-[11px]">
                      <div className="text-zinc-400">
                        Next: <strong className="text-zinc-200">{item.nextRunAt}</strong>
                      </div>
                      <div className="text-zinc-500 text-[10px]">
                        Last run: {item.lastRunAt || 'Pending first cycle'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleManualTrigger(item.id)}
                      disabled={isTriggering}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-indigo-600 hover:text-white text-zinc-200 text-xs font-medium border border-zinc-700 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Zap className={`w-3.5 h-3.5 text-amber-400 ${isTriggering ? 'animate-bounce' : ''}`} />
                      <span>{isTriggering ? 'Running...' : 'Trigger Now'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cron Syntax Guidance Card */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            <Info className="w-4 h-4 text-indigo-400" />
            <span>How ShadowOps Cron Scheduling Works</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Cron expressions use the standard 5-part POSIX format (<code className="text-indigo-300 font-mono">minute hour day-of-month month day-of-week</code>).
            When a schedule fires, ShadowOps spins up an isolated execution context, verifies all learned governance rules and policy constraints, and executes the skill pipeline unattended. If a transaction requires manager approval (e.g., &gt; $500), it safely halts and queues the request in your <strong>Approvals</strong> board.
          </p>
        </div>
      </div>

      {/* Create New Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Define Automated Skill Schedule</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-4 text-xs">
              {/* Target Workflow */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300 block">Target Skill / Workflow</label>
                <select
                  value={selectedWorkflowId}
                  onChange={(e) => setSelectedWorkflowId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  {workflows.map((wf) => (
                    <option key={wf.id} value={wf.slug || wf.id} className="bg-zinc-900 text-zinc-200">
                      {wf.name} (v{wf.version} • {wf.steps.length} steps)
                    </option>
                  ))}
                </select>
              </div>

              {/* Preset Frequency Quick Buttons */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300 block">Common Frequency Presets</label>
                <div className="grid grid-cols-2 gap-2">
                  {CRON_PRESETS.map((p) => {
                    const isSelected = cronExpression === p.cron;
                    return (
                      <button
                        key={p.cron}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <div className="font-semibold text-[11px]">{p.label}</div>
                        <div className="font-mono text-[10px] text-zinc-500">{p.cron}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Cron String & Description */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-300 block">Cron Expression</label>
                  <input
                    type="text"
                    value={cronExpression}
                    onChange={(e) => setCronExpression(e.target.value)}
                    required
                    placeholder="0 */2 * * *"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-mono text-zinc-200 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-300 block">Human Label</label>
                  <input
                    type="text"
                    value={humanReadable}
                    onChange={(e) => setHumanReadable(e.target.value)}
                    required
                    placeholder="e.g. Every 2 hours"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Scope & Timezone */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-300 block">Execution Target Scope</label>
                  <select
                    value={targetScope}
                    onChange={(e) => setTargetScope(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="matching_tickets" className="bg-zinc-900 text-zinc-200">
                      Matching Open Tickets
                    </option>
                    <option value="pending_inbox" className="bg-zinc-900 text-zinc-200">
                      Pending Support Inbox
                    </option>
                    <option value="reconciliation_scan" className="bg-zinc-900 text-zinc-200">
                      Reconciliation Scan
                    </option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-300 block">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="UTC" className="bg-zinc-900 text-zinc-200">UTC (Universal)</option>
                    <option value="America/New_York" className="bg-zinc-900 text-zinc-200">America/New_York (EST)</option>
                    <option value="Europe/London" className="bg-zinc-900 text-zinc-200">Europe/London (GMT)</option>
                    <option value="Asia/Ho_Chi_Minh" className="bg-zinc-900 text-zinc-200">Asia/Ho_Chi_Minh (ICT)</option>
                    <option value="Asia/Tokyo" className="bg-zinc-900 text-zinc-200">Asia/Tokyo (JST)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300 block">Description & Intent</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain why this automated run schedule is active..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-md"
                >
                  Save & Activate Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
