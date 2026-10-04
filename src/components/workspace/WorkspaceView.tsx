import React from 'react';
import { useApp } from '../../context/AppContext';
import { InboxSidebar } from './InboxSidebar';
import { TicketWorkspace } from './TicketWorkspace';
import { CustomersView } from './CustomersView';
import { PaymentsView } from './PaymentsView';
import { PoliciesView } from './PoliciesView';
import { ApprovalsView } from './ApprovalsView';
import { ActivityLogPanel } from './ActivityLogPanel';
import { ShadowBrainPanel } from './ShadowBrainPanel';
import {
  Activity,
  ChevronUp,
  ChevronDown,
  Clock,
  CheckCircle2,
  Play,
  BrainCircuit,
  Terminal,
} from 'lucide-react';

export const WorkspaceView: React.FC = () => {
  const {
    workspaceSubTab,
    setWorkspaceSubTab,
    isActivityDrawerOpen,
    setIsActivityDrawerOpen,
    activities,
  } = useApp();

  const latestActivity = activities[0];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 3-Column Operations Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Tickets & CRM Navigation */}
        <InboxSidebar />

        {/* Center Column: Interactive Sub-view */}
        <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950 relative">
          <div className="flex-1 overflow-hidden flex flex-col">
            {workspaceSubTab === 'inbox' && <TicketWorkspace />}
            {workspaceSubTab === 'customers' && <CustomersView />}
            {workspaceSubTab === 'payments' && <PaymentsView />}
            {workspaceSubTab === 'policies' && <PoliciesView />}
            {workspaceSubTab === 'approvals' && <ApprovalsView />}
            {workspaceSubTab === 'activity' && <ActivityLogPanel compact={false} />}
          </div>

          {/* Collapsible Bottom Activity Drawer (when active inside ticket/customers/etc) */}
          {workspaceSubTab !== 'activity' && isActivityDrawerOpen && (
            <div className="h-64 border-t border-zinc-800 bg-zinc-950 flex flex-col z-20 shadow-2xl animate-in slide-in-from-bottom-2 duration-200">
              <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-medium text-zinc-200">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Activity Log Stream</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                    {activities.length} entries
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWorkspaceSubTab('activity')}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    Open Full View &rarr;
                  </button>
                  <button
                    onClick={() => setIsActivityDrawerOpen(false)}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                    title="Close drawer"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <ActivityLogPanel compact={true} />
              </div>
            </div>
          )}
        </main>

        {/* Right Column: Shadow Brain live observation & reasoning */}
        <ShadowBrainPanel />
      </div>

      {/* Bottom Global Activity Status Bar */}
      <footer className="h-8 bg-zinc-950 border-t border-zinc-800 px-4 flex items-center justify-between text-[11px] text-zinc-400 font-mono select-none z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>ShadowOps Node Online</span>
          </div>

          <span className="text-zinc-700">|</span>

          {latestActivity ? (
            <div className="hidden md:flex items-center gap-2 text-zinc-400">
              <span className="text-zinc-500">Latest Activity:</span>
              <span className="text-zinc-200 truncate max-w-sm font-sans">{latestActivity.title}</span>
              <span className="text-zinc-500 font-mono text-[10px]">({latestActivity.timeFormatted})</span>
            </div>
          ) : (
            <span className="text-zinc-500">No activity yet</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (workspaceSubTab === 'activity') {
                setWorkspaceSubTab('inbox');
              } else {
                setIsActivityDrawerOpen(!isActivityDrawerOpen);
              }
            }}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors cursor-pointer ${
              isActivityDrawerOpen || workspaceSubTab === 'activity'
                ? 'bg-zinc-800 text-white font-medium'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Activity className="w-3 h-3 text-indigo-400" />
            <span>Activity Log ({activities.length})</span>
            {isActivityDrawerOpen ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronUp className="w-3 h-3" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};
