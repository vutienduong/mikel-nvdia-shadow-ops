import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckSquare, AlertTriangle, Check, X, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

export const ApprovalsView: React.FC = () => {
  const {
    approvals,
    approveRequest,
    rejectRequest,
    setSelectedTicketId,
    setWorkspaceSubTab,
  } = useApp();

  return (
    <div className="flex-1 bg-zinc-950 p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-400" />
              Operations Manager Approvals
            </h2>
            <p className="text-xs text-zinc-400">
              High-value refunds (&gt; $500) and risk exceptions suspended for human authorization.
            </p>
          </div>
          <span className="text-xs font-mono text-amber-300 bg-amber-950/60 border border-amber-800 px-2.5 py-1 rounded">
            {approvals.filter((a) => a.status === 'pending').length} Pending Requests
          </span>
        </div>

        {approvals.length === 0 ? (
          <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl p-12 text-center">
            <ShieldCheck className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <h4 className="text-sm font-medium text-zinc-300 mb-1">Queue Clear</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              No pending approval requests. Demonstrating high-value tickets (like #1043 Alex Morgan for $1,100) will dispatch approval items here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map((app) => (
              <div
                key={app.id}
                className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {app.id}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                        app.status === 'pending'
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                          : app.status === 'approved'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                          : 'bg-red-950/60 text-red-300 border border-red-800'
                      }`}
                    >
                      {app.status}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">{app.createdAt}</span>
                  </div>

                  <h4 className="text-sm font-semibold text-white">
                    Refund Authorization Request: ${app.amount}.00 USD
                  </h4>

                  <p className="text-xs text-zinc-400">
                    Customer: <strong className="text-zinc-200">{app.customerName}</strong> • Reason: {app.reason}
                  </p>

                  {app.approvedBy && (
                    <p className="text-[11px] text-emerald-400 font-mono">
                      Authorized by {app.approvedBy} at {app.approvedAt}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedTicketId(app.ticketId);
                      setWorkspaceSubTab('inbox');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>View Ticket #{app.ticketId}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  {app.status === 'pending' && (
                    <>
                      <button
                        onClick={() => approveRequest(app.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve Refund
                      </button>

                      <button
                        onClick={() => rejectRequest(app.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 text-red-200 text-xs font-medium border border-red-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
