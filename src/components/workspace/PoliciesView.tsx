import React from 'react';
import { useApp } from '../../context/AppContext';
import { BookOpen, ShieldCheck, Scale, FileText, CheckCircle } from 'lucide-react';

export const PoliciesView: React.FC = () => {
  const { policies } = useApp();

  return (
    <div className="flex-1 bg-zinc-950 p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Operational Policies & Risk Thresholds
          </h2>
          <p className="text-xs text-zinc-400">
            Corporate knowledge guidelines referenced by ShadowOps during semantic action induction and rule discovery.
          </p>
        </div>

        <div className="space-y-4">
          {policies.map((pol) => (
            <div
              key={pol.id}
              className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{pol.title}</h3>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      ID: {pol.id} • Category: {pol.category} • Version: {pol.version}
                    </p>
                  </div>
                </div>

                {pol.thresholdAmount && (
                  <div className="bg-amber-950/40 border border-amber-800/60 px-3 py-1 rounded-md text-right">
                    <span className="text-[10px] text-zinc-400 block font-mono">Approval Threshold</span>
                    <span className="text-xs font-semibold text-amber-400 font-mono">
                      &gt; ${pol.thresholdAmount}.00 USD
                    </span>
                  </div>
                )}
              </div>

              <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap bg-zinc-950/80 p-4 rounded-lg border border-zinc-800/80 leading-relaxed">
                {pol.content}
              </pre>

              <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500 font-mono">
                <span>Last reviewed: {pol.lastUpdated}</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle className="w-3 h-3" />
                  Enforced in Active Registry
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
