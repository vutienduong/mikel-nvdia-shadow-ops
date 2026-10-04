import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Inbox,
  Users,
  CreditCard,
  BookOpen,
  CheckSquare,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Tag,
  DollarSign,
  Activity,
} from 'lucide-react';

export const InboxSidebar: React.FC = () => {
  const {
    tickets,
    selectedTicketId,
    setSelectedTicketId,
    workspaceSubTab,
    setWorkspaceSubTab,
    approvals,
    activities,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all');

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'pending').length;

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === 'all') return true;
    if (filterStatus === 'open') return t.status === 'open' || t.status === 'pending_approval';
    if (filterStatus === 'resolved') return t.status === 'resolved';
    return true;
  });

  return (
    <aside className="w-80 lg:w-88 flex-shrink-0 bg-zinc-950 border-r border-zinc-800 flex flex-col h-full overflow-hidden">
      {/* Workspace Subtabs: Inbox / Customers / Payments / Policies / Approvals / Activity */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/40">
        <div className="grid grid-cols-6 gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-[11px] font-medium text-zinc-400">
          <button
            onClick={() => setWorkspaceSubTab('inbox')}
            className={`py-1.5 rounded flex items-center justify-center transition-colors cursor-pointer ${
              workspaceSubTab === 'inbox'
                ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                : 'hover:text-zinc-200'
            }`}
            title="Support Tickets"
          >
            <Inbox className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setWorkspaceSubTab('customers')}
            className={`py-1.5 rounded flex items-center justify-center transition-colors cursor-pointer ${
              workspaceSubTab === 'customers'
                ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                : 'hover:text-zinc-200'
            }`}
            title="Customers CRM"
          >
            <Users className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setWorkspaceSubTab('payments')}
            className={`py-1.5 rounded flex items-center justify-center transition-colors cursor-pointer ${
              workspaceSubTab === 'payments'
                ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                : 'hover:text-zinc-200'
            }`}
            title="Billing & Payments"
          >
            <CreditCard className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setWorkspaceSubTab('policies')}
            className={`py-1.5 rounded flex items-center justify-center transition-colors cursor-pointer ${
              workspaceSubTab === 'policies'
                ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                : 'hover:text-zinc-200'
            }`}
            title="Operations Policies"
          >
            <BookOpen className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setWorkspaceSubTab('approvals')}
            className={`py-1.5 rounded flex items-center justify-center relative transition-colors cursor-pointer ${
              workspaceSubTab === 'approvals'
                ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                : 'hover:text-zinc-200'
            }`}
            title="Manager Approvals"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            {pendingApprovalsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

          <button
            onClick={() => setWorkspaceSubTab('activity')}
            className={`py-1.5 rounded flex items-center justify-center relative transition-colors cursor-pointer ${
              workspaceSubTab === 'activity'
                ? 'bg-zinc-800 text-indigo-400 font-semibold shadow-xs'
                : 'hover:text-zinc-200'
            }`}
            title="Activity Log"
          >
            <Activity className="w-3.5 h-3.5" />
            {activities.length > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-500" />
            )}
          </button>
        </div>
      </div>

      {/* Ticket List Header with Search & Filter */}
      <div className="p-3 border-b border-zinc-800/80 space-y-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search tickets, customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-zinc-700"
          />
        </div>

        <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-400">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            All ({tickets.length})
          </button>
          <button
            onClick={() => setFilterStatus('open')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              filterStatus === 'open'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Open ({tickets.filter((t) => t.status !== 'resolved').length})
          </button>
          <button
            onClick={() => setFilterStatus('resolved')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              filterStatus === 'resolved'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Resolved ({tickets.filter((t) => t.status === 'resolved').length})
          </button>
        </div>
      </div>

      {/* Tickets Scrollable List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
        {filteredTickets.map((t) => {
          const isSelected = t.id === selectedTicketId && workspaceSubTab === 'inbox';
          return (
            <div
              key={t.id}
              onClick={() => {
                setSelectedTicketId(t.id);
                setWorkspaceSubTab('inbox');
              }}
              className={`p-3.5 text-left cursor-pointer transition-colors relative ${
                isSelected
                  ? 'bg-zinc-900/90 border-l-2 border-indigo-500'
                  : 'hover:bg-zinc-900/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[11px] text-zinc-400 font-medium">#{t.id}</span>
                <span className="text-[10px] text-zinc-500">{t.createdAt}</span>
              </div>

              <h4 className="text-xs font-semibold text-zinc-200 line-clamp-1 mb-1">
                {t.customerName}
              </h4>

              <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-2">
                {t.subject}
              </p>

              <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                <div className="flex items-center gap-1.5">
                  {t.amount && (
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      ${t.amount}
                    </span>
                  )}
                  {t.tags[0] && (
                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500 border border-zinc-800">
                      {t.tags[0]}
                    </span>
                  )}
                </div>

                {t.status === 'resolved' ? (
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    Resolved
                  </span>
                ) : t.status === 'pending_approval' ? (
                  <span className="text-amber-400 flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    Approval
                  </span>
                ) : (
                  <span className="text-zinc-400">Open</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
