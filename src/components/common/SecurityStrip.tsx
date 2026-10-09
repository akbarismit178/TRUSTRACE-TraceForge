import React from 'react';
import { ShieldCheck, ShieldAlert, Lock, AlertOctagon } from 'lucide-react';

interface Props {
  authorizedCount: number;
  blockedCount: number;
  restrictedChunksSent: number;
}

export const SecurityStrip: React.FC<Props> = ({ authorizedCount, blockedCount, restrictedChunksSent }) => {
  const isInvariantPassed = restrictedChunksSent === 0;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 px-3.5 py-2 rounded-lg text-xs font-mono border ${
      isInvariantPassed 
        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
        : 'bg-rose-950/40 border-rose-500/60 text-rose-300 animate-pulse glow-border-danger'
    }`}>
      <div className="flex items-center gap-4 flex-wrap">
        <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          Authorized: {authorizedCount}
        </span>
        <span className="text-gray-600">|</span>
        <span className="flex items-center gap-1.5 font-semibold text-amber-400">
          <Lock className="w-4 h-4" />
          Blocked: {blockedCount} {blockedCount > 0 && <span className="text-[10px] text-amber-400/70">(Details Redacted)</span>}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className={`px-2.5 py-0.5 rounded font-bold flex items-center gap-1.5 ${
          isInvariantPassed 
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
            : 'bg-rose-600 text-white font-extrabold animate-bounce'
        }`}>
          {isInvariantPassed ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertOctagon className="w-3.5 h-3.5" />}
          Restricted Chunks Sent To LLM: {restrictedChunksSent}
        </span>
      </div>
    </div>
  );
};
