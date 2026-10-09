import React, { useState } from 'react';
import { ContextManifest } from '../../types';
import { Hash, Copy, Check, ShieldCheck, AlertOctagon } from 'lucide-react';

interface Props {
  manifest: ContextManifest;
}

export const ContextManifestViewer: React.FC<Props> = ({ manifest }) => {
  const [copied, setCopied] = useState(false);

  const copyHash = () => {
    navigator.clipboard.writeText(manifest.manifestHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPassed = manifest.restrictedChunksSentCount === 0;

  return (
    <div className="rounded-xl border border-darkBorder bg-darkSurface/90 p-4 font-mono text-xs space-y-3 glass-card">
      <div className="flex items-center justify-between pb-2 border-b border-darkBorder">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-brand-500" />
          <span className="font-bold text-gray-200">Context Manifest (Gate 2 Verified)</span>
        </div>
        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase flex items-center gap-1 ${
          isPassed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
        }`}>
          {isPassed ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertOctagon className="w-3.5 h-3.5" />}
          {manifest.status}
        </span>
      </div>

      <div className="space-y-1.5 text-gray-300">
        <div className="flex justify-between">
          <span className="text-gray-400">Query ID:</span>
          <span className="text-brand-400 font-semibold">{manifest.queryId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">User Role Scope:</span>
          <span className="text-amber-400">{manifest.userRole}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Authorized Chunk IDs ({manifest.chunkIds.length}):</span>
          <span className="text-gray-200 font-semibold">
            {manifest.chunkIds.length > 0 ? manifest.chunkIds.join(', ') : 'None (Blocked)'}
          </span>
        </div>
        <div className="flex justify-between items-center pt-1">
          <span className="text-gray-400">Restricted Leaks:</span>
          <span className={`font-bold px-2 py-0.5 rounded ${isPassed ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/20'}`}>
            {manifest.restrictedChunksSentCount}
          </span>
        </div>
      </div>

      {/* SHA-256 Hash Box */}
      <div className="p-2.5 rounded-lg bg-darkBg border border-darkBorder flex items-center justify-between gap-2">
        <div className="truncate">
          <span className="text-gray-500 text-[10px] block">MANIFEST SHA-256 HASH</span>
          <span className="text-gray-300 font-mono text-[11px] truncate block">{manifest.manifestHash}</span>
        </div>
        <button
          onClick={copyHash}
          className="p-1.5 hover:bg-darkBorder rounded text-gray-400 hover:text-white transition-colors"
          title="Copy Manifest Hash"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
