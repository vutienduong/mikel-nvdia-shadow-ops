import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { WorkspaceView } from './components/workspace/WorkspaceView';
import { SkillsView } from './components/skills/SkillsView';
import { RunsView } from './components/runs/RunsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SchedulesView } from './components/schedules/SchedulesView';
import { WorkflowDraftModal } from './components/modals/WorkflowDraftModal';
import { WorkflowRefineModal } from './components/modals/WorkflowRefineModal';
import { ExecutionModal } from './components/modals/ExecutionModal';
import { Bell, Info } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    activeTab,
    draftWorkflow,
    setDraftWorkflow,
    refinementProposal,
    setRefinementProposal,
    activeExecutionRun,
    setActiveExecutionRun,
    toastMessage,
  } = useApp();

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 antialiased overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Top Global Navigation Bar */}
      <Navbar />

      {/* Main Screen Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'workspace' && <WorkspaceView />}
        {activeTab === 'skills' && <SkillsView />}
        {activeTab === 'runs' && <RunsView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'schedules' && <SchedulesView />}
      </div>

      {/* Case A: Workflow Draft / Induction Modal */}
      {draftWorkflow && (
        <WorkflowDraftModal
          workflow={draftWorkflow}
          onClose={() => setDraftWorkflow(null)}
        />
      )}

      {/* Case B: Cross-Demonstration Comparison & Rule Discovery Modal */}
      {refinementProposal && (
        <WorkflowRefineModal
          proposal={refinementProposal}
          onClose={() => setRefinementProposal(null)}
        />
      )}

      {/* Case C: Autonomous Execution Live Step Runner */}
      {activeExecutionRun && (
        <ExecutionModal
          run={activeExecutionRun}
          onClose={() => setActiveExecutionRun(null)}
        />
      )}

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-zinc-900 border border-zinc-700 text-zinc-200 px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
