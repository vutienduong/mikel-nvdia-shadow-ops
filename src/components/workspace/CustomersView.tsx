import React from 'react';
import { useApp } from '../../context/AppContext';
import { Users, Mail, DollarSign, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { customers, setSelectedTicketId, setWorkspaceSubTab, tickets } = useApp();

  return (
    <div className="flex-1 bg-zinc-950 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Customer Accounts Directory
            </h2>
            <p className="text-xs text-zinc-400">
              Verified CRM client records cross-referenced during operational ticket workflows.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
            {customers.length} Accounts
          </span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Account ID</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Primary Email</th>
                <th className="py-3 px-4">Subscription Plan</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4">Lifetime Value</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Related Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {customers.map((c) => {
                const relatedTicket = tickets.find((t) => t.customerId === c.id);
                return (
                  <tr key={c.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-zinc-300 font-medium">{c.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{c.name}</td>
                    <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">{c.email}</td>
                    <td className="py-3.5 px-4 text-indigo-300 font-medium">{c.plan}</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">{c.joinedDate}</td>
                    <td className="py-3.5 px-4 font-mono font-medium text-zinc-200">${c.lifetimeValue}.00</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {relatedTicket ? (
                        <button
                          onClick={() => {
                            setSelectedTicketId(relatedTicket.id);
                            setWorkspaceSubTab('inbox');
                          }}
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                        >
                          <span>#{relatedTicket.id}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
