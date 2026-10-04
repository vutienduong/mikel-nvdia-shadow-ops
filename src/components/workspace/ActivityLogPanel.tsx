import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ActivityCategory, ActivityItem } from '../../types';
import {
  Activity,
  Play,
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Search,
  Filter,
  Trash2,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  Sparkles,
  Layers,
  Terminal,
} from 'lucide-react';

interface Props {
  compact?: boolean;
}

export const ActivityLogPanel: React.FC<Props> = ({ compact = false }) => {
  const {
    activities,
    clearActivities,
    setSelectedTicketId,
    setWorkspaceSubTab,
    setActiveTab,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredActivities = activities.filter((act) => {
    if (selectedCategory !== 'all' && act.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = act.title.toLowerCase().includes(q);
      const matchDesc = act.description.toLowerCase().includes(q);
      const matchTicket = act.ticketId?.toLowerCase().includes(q);
      const matchCustomer = act.customerName?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchTicket || matchCustomer;
    }
    return true;
  });

  const getCategoryIcon = (category: ActivityCategory) => {
    switch (category) {
      case 'execution':
        return <Play className="w-3.5 h-3.5 text-indigo-400 fill-current" />;
      case 'demonstration':
        return <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />;
      case 'task':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'governance':
        return <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getStatusBadge = (status: ActivityItem['status']) => {
    switch (status) {
      case 'success':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800">
            Success
          </span>
        );
      case 'warning':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800">
            Notice
          </span>
        );
      case 'failed':
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-950/60 text-red-300 border border-red-800">
            Halted
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            Info
          </span>
        );
    }
  };

  return (
    <div className={`flex flex-col h-full bg-zinc-950 text-zinc-100 ${compact ? 'p-3' : 'p-6'} overflow-y-auto`}>
      <div className={`${compact ? 'max-w-full' : 'max-w-6xl mx-auto w-full'} space-y-5`}>
        {/* Header (hidden or condensed if compact) */}
        {!compact ? (
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                Workspace Activity Log
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Chronological audit stream of performed tasks, recorded demonstrations, and triggered autonomous executions.
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                {activities.length} Recorded Events
              </span>

              {activities.length > 0 && (
                <button
                  onClick={clearActivities}
                  className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Clear activity log history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              Recent Chronological Stream
            </span>
            <span className="text-[10px] font-mono text-zinc-500">{activities.length} total</span>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 text-[11px] font-medium text-zinc-400">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              All ({activities.length})
            </button>

            <button
              onClick={() => setSelectedCategory('execution')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'execution'
                  ? 'bg-indigo-950 text-indigo-200 border border-indigo-800 font-semibold'
                  : 'hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Play className="w-3 h-3 text-indigo-400 fill-current" />
              Autonomous Runs ({activities.filter((a) => a.category === 'execution').length})
            </button>

            <button
              onClick={() => setSelectedCategory('demonstration')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'demonstration'
                  ? 'bg-amber-950 text-amber-200 border border-amber-800 font-semibold'
                  : 'hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <BrainCircuit className="w-3 h-3 text-amber-400" />
              Demonstrations ({activities.filter((a) => a.category === 'demonstration').length})
            </button>

            <button
              onClick={() => setSelectedCategory('task')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'task'
                  ? 'bg-emerald-950 text-emerald-200 border border-emerald-800 font-semibold'
                  : 'hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Tasks ({activities.filter((a) => a.category === 'task').length})
            </button>

            <button
              onClick={() => setSelectedCategory('governance')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'governance'
                  ? 'bg-purple-950 text-purple-200 border border-purple-800 font-semibold'
                  : 'hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              Governance ({activities.filter((a) => a.category === 'governance').length})
            </button>
          </div>

          <div className="relative min-w-48 sm:min-w-60">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-zinc-700"
            />
          </div>
        </div>

        {/* Activity Timeline List */}
        {filteredActivities.length === 0 ? (
          <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl p-10 text-center space-y-2">
            <Activity className="w-7 h-7 text-zinc-600 mx-auto" />
            <p className="text-xs font-medium text-zinc-400">No matching activities recorded</p>
            <p className="text-[11px] text-zinc-500">
              Actions performed in the workspace, Teach Mode demonstrations, and autonomous runs will append to this chronological log.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredActivities.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/90 hover:border-zinc-700/80 transition-all text-xs space-y-2 group"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-zinc-950 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                      {getCategoryIcon(act.category)}
                    </div>
                    <span className="font-semibold text-white tracking-tight">{act.title}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                      {act.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(act.status)}
                    <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {act.timeFormatted}
                    </span>
                  </div>
                </div>

                <p className="text-zinc-300 leading-relaxed pl-8 text-xs">{act.description}</p>

                {/* Footer contextual pills & actions */}
                <div className="pl-8 pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/50">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-zinc-400">
                    {act.ticketId && (
                      <button
                        onClick={() => {
                          setSelectedTicketId(act.ticketId!);
                          setWorkspaceSubTab('inbox');
                        }}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 hover:border-indigo-500/60 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        title="Jump to Ticket Console"
                      >
                        <span>#{act.ticketId}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-zinc-500" />
                      </button>
                    )}

                    {act.customerName && (
                      <span className="text-zinc-400">
                        Target: <strong className="text-zinc-200">{act.customerName}</strong>
                      </span>
                    )}

                    {act.runId && (
                      <button
                        onClick={() => setActiveTab('runs')}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-950/70 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900 transition-colors cursor-pointer"
                        title="Inspect in Runs View"
                      >
                        <span>{act.runId}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-indigo-400" />
                      </button>
                    )}

                    {act.metadata && Object.keys(act.metadata).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(act.metadata).map(([k, v]) => (
                          <span
                            key={k}
                            className="bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 text-[10px] text-zinc-400"
                          >
                            {k}: <span className="text-zinc-200">{String(v)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-zinc-600 group-hover:text-zinc-500 transition-colors">
                    ID: {act.id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
