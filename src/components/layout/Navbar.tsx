import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  BrainCircuit,
  Radio,
  RotateCcw,
  Sparkles,
  Layers,
  History,
  LayoutDashboard,
  CheckCircle2,
  BarChart3,
  CalendarClock,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isTeaching,
    startTeaching,
    cancelTeaching,
    workflows,
    runs,
    schedules,
    resetAll,
    observationEvents,
  } = useApp();

  const activeSkillsCount = workflows.filter((w) => w.status === 'active').length;
  const activeSchedulesCount = schedules.filter((s) => s.status === 'active').length;
  const latestWf = workflows[0];

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => setActiveTab('workspace')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base tracking-tight text-white">ShadowOps</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-normal">Turn human work into reusable AI skills</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 border-l border-zinc-800 pl-6">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'workspace'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Workspace
            </button>

            <button
              onClick={() => setActiveTab('skills')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'skills'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Skills
              {activeSkillsCount > 0 && (
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] px-1.5 py-0.2 rounded-full">
                  {activeSkillsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('runs')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'runs'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Runs
              {runs.length > 0 && (
                <span className="bg-zinc-800 text-zinc-400 text-[10px] px-1.5 py-0.2 rounded-full">
                  {runs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </button>

            <button
              onClick={() => setActiveTab('schedules')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'schedules'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              Schedules
              {activeSchedulesCount > 0 && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {activeSchedulesCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Right Side: Global Teach Mode & System Controls */}
        <div className="flex items-center gap-3">
          {/* Active Skill Indicator */}
          {latestWf && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-[11px]">{latestWf.name} (v{latestWf.version})</span>
            </div>
          )}

          {/* Teach Mode Global Switch */}
          <div className="flex items-center">
            {isTeaching ? (
              <div className="flex items-center gap-2 bg-red-950/70 border border-red-800/80 px-3 py-1.5 rounded-lg shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="text-xs font-semibold text-red-200 tracking-wide uppercase">Teaching</span>
                <span className="text-[11px] font-mono bg-red-900/60 text-red-300 px-1.5 py-0.5 rounded border border-red-800/50">
                  {observationEvents.length} events
                </span>
                <button
                  onClick={cancelTeaching}
                  title="Cancel teaching session"
                  className="ml-1 text-xs text-red-400 hover:text-red-200 underline font-normal cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={startTeaching}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-indigo-500/60 text-zinc-200 hover:text-white text-xs font-medium transition-all shadow-sm group cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                <span>○ Teach Mode</span>
              </button>
            )}
          </div>

          {/* Reset Environment */}
          <button
            onClick={resetAll}
            title="Reset environment to initial state"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 text-xs transition-colors border border-transparent hover:border-zinc-700 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
