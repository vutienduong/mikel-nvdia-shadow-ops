import React from 'react';
import { useApp } from '../../context/AppContext';
import { CreditCard, DollarSign, Clock, RefreshCw, CheckCircle, ShieldAlert } from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const { payments, customers, issueRefund, showToast } = useApp();

  return (
    <div className="flex-1 bg-zinc-950 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              Billing & Payments Ledger
            </h2>
            <p className="text-xs text-zinc-400">
              Transaction records simulated across Stripe/payment gateways for duplicate detection and refunds.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
            {payments.length} Transactions
          </span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Charged Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Gateway Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {payments.map((p) => {
                const customer = customers.find((c) => c.id === p.customerId);
                return (
                  <tr key={p.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-zinc-300 font-medium">{p.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{customer?.name || p.customerId}</div>
                      <div className="text-[11px] text-zinc-500 font-mono">{customer?.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      ${p.amount}.00 {p.currency}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">{p.description}</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">{p.chargedAt}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                          p.status === 'refunded'
                            ? 'bg-purple-950/60 text-purple-300 border border-purple-800'
                            : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {p.status}
                        {p.refundId && ` (${p.refundId})`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {p.status === 'captured' ? (
                        <button
                          onClick={async () => {
                            const refId = await issueRefund(p.id);
                            showToast(`Refund ${refId} issued manually for $${p.amount}`);
                          }}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium border border-zinc-700 transition-colors cursor-pointer"
                        >
                          Issue Refund
                        </button>
                      ) : (
                        <span className="text-[11px] text-zinc-600 font-mono">Refunded</span>
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
