import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ConflictItem } from '../types';
import { 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  GitCompare, 
  ShieldCheck, 
  UserCheck,
  Check,
  X
} from 'lucide-react';

export const Conflicts: React.FC = () => {
  const { conflicts, resolveConflict, currentUser } = useAppStore();
  const [selectedConflict, setSelectedConflict] = useState<ConflictItem | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [recommendedDoc, setRecommendedDoc] = useState('');

  // Dynamic Metrics
  const totalConflicts = conflicts.length;
  const pendingCount = conflicts.filter(c => c.status === 'Unresolved').length;
  const resolvedCount = conflicts.filter(c => c.status === 'Resolved').length;
  const maxVariance = conflicts.length > 0 ? Math.max(...conflicts.map(c => c.differencePct)) : 0;

  const handleResolve = (conflictId: string) => {
    if (!recommendedDoc) return;
    resolveConflict(conflictId, resolutionNotes || 'Resolved by Data Steward after auditing billing deferrals.', recommendedDoc);
    setSelectedConflict(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-darkBorder pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-mono flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            Cross-Document Data Conflict Detection
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Detects version discrepancies, conflicting metric values, and provides authoritative resolution workflows.
          </p>
        </div>
      </div>

      {/* Real Live Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card">
          <div className="text-xs text-gray-400 mb-1 font-mono">Total Discrepancies</div>
          <div className="text-2xl font-extrabold text-white font-mono">{totalConflicts}</div>
          <div className="text-[11px] text-brand-400 mt-1 font-mono">Across Catalog Documents</div>
        </div>

        <div className="p-4 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card">
          <div className="text-xs text-gray-400 mb-1 font-mono">Pending Resolution</div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">{pendingCount}</div>
          <div className="text-[11px] text-amber-300 mt-1 font-mono">Requires Data Steward Action</div>
        </div>

        <div className="p-4 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card">
          <div className="text-xs text-gray-400 mb-1 font-mono">Resolved & Sealed</div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">{resolvedCount}</div>
          <div className="text-[11px] text-emerald-400 mt-1 font-mono">Authoritative Source Set</div>
        </div>

        <div className="p-4 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card">
          <div className="text-xs text-gray-400 mb-1 font-mono">Max Value Variance</div>
          <div className="text-2xl font-extrabold text-rose-400 font-mono">{maxVariance}%</div>
          <div className="text-[11px] text-rose-300 mt-1 font-mono">Delta Between Revisions</div>
        </div>
      </div>

      {/* Conflict List */}
      <div className="space-y-4">
        {conflicts.map((conflict) => (
          <div
            key={conflict.id}
            className={`p-6 rounded-2xl border transition-all space-y-4 glass-card ${
              conflict.status === 'Resolved' 
                ? 'bg-darkCard/60 border-emerald-500/40' 
                : 'bg-darkCard/90 border-amber-500/40 shadow-glow-sm'
            }`}
          >
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-darkBorder">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                  conflict.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {conflict.status.toUpperCase()}
                </span>
                <h3 className="text-base font-bold text-gray-100 font-mono">
                  Metric Conflict: {conflict.metric} ({conflict.period})
                </h3>
              </div>

              <span className="text-xs font-mono text-rose-400 font-bold bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30">
                Variance: {conflict.differencePct}%
              </span>
            </div>

            {/* Side by Side Source Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Source A */}
              <div className="p-4 rounded-xl bg-darkBg border border-darkBorder space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                  <span className="flex items-center gap-1.5 text-brand-400 font-bold">
                    <FileText className="w-4 h-4" />
                    Source Document A
                  </span>
                  <span>Page {conflict.sourceAPage}</span>
                </div>
                <div className="text-xs text-gray-200 font-semibold">{conflict.sourceADocTitle}</div>
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-sm font-extrabold">
                  Reported Value: {conflict.valueA}
                </div>
              </div>

              {/* Source B */}
              <div className="p-4 rounded-xl bg-darkBg border border-darkBorder space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                  <span className="flex items-center gap-1.5 text-purple-400 font-bold">
                    <FileText className="w-4 h-4" />
                    Source Document B (Revision)
                  </span>
                  <span>Page {conflict.sourceBPage}</span>
                </div>
                <div className="text-xs text-gray-200 font-semibold">{conflict.sourceBDocTitle}</div>
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-sm font-extrabold">
                  Reported Value: {conflict.valueB}
                </div>
              </div>
            </div>

            {/* Cause & Recommendation */}
            <div className="p-4 rounded-xl bg-darkSurface border border-darkBorder text-xs space-y-1.5">
              <span className="text-gray-400 font-bold block font-mono">Likely Root Cause:</span>
              <p className="text-gray-300 font-sans leading-relaxed">{conflict.likelyCause}</p>
              {conflict.resolutionNotes && (
                <div className="pt-2 border-t border-darkBorder text-emerald-400 font-mono">
                  <strong>Resolution Note:</strong> {conflict.resolutionNotes}
                </div>
              )}
            </div>

            {/* Action Bar */}
            {conflict.status !== 'Resolved' && (
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setSelectedConflict(conflict);
                    setRecommendedDoc(conflict.sourceBDocId);
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-glow-sm font-mono font-bold"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Resolve / Set Authoritative Source
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Meaning & Conflict Architecture Explanations Section */}
      <div className="p-6 rounded-2xl bg-darkCard/90 border border-darkBorder glass-card space-y-5">
        <div className="border-b border-darkBorder pb-3">
          <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Conflict Detection Mechanics & Resolution Rationale
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            How TrustTrace prevents hallucinated or contradictory AI responses when enterprise documents report conflicting numbers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-darkBg/80 border border-darkBorder space-y-2">
            <div className="flex items-center gap-2 font-mono font-bold text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Cross-Document Metric Divergence</span>
            </div>
            <p className="text-gray-300 leading-relaxed font-sans">
              <strong>Metric Meaning:</strong> Triggered when two uploaded PDFs or reports contain overlapping entities (e.g. "Q2 2026 Revenue") but declare different numerical quantities ($4.2M vs $3.8M).
            </p>
            <p className="text-gray-400 leading-relaxed font-sans">
              <strong>Engine Action:</strong> Automatically flags the variance and flags citations until a Data Steward confirms the authoritative version.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-darkBg/80 border border-darkBorder space-y-2">
            <div className="flex items-center gap-2 font-mono font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Authoritative Source Binding</span>
            </div>
            <p className="text-gray-300 leading-relaxed font-sans">
              <strong>Metric Meaning:</strong> When an admin or steward resolves a conflict, the chosen document is marked with 1.0 confidence weight in the vector index, while the outdated revision is demoted to archived status.
            </p>
            <p className="text-gray-400 leading-relaxed font-sans">
              <strong>AI RAG Result:</strong> The assistant will only cite the verified authoritative revision in user answers.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-darkBg/80 border border-darkBorder space-y-2">
            <div className="flex items-center gap-2 font-mono font-bold text-rose-400">
              <GitCompare className="w-4 h-4" />
              <span>Variance % Delta Calculation</span>
            </div>
            <p className="text-gray-300 leading-relaxed font-sans">
              <strong>Formula:</strong> <code className="text-brand-300 font-mono">|ValueA - ValueB| / ValueA * 100</code>. Discrepancies above 5% trigger priority review workflows to safeguard compliance filings.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-darkBg/80 border border-darkBorder space-y-2">
            <div className="flex items-center gap-2 font-mono font-bold text-purple-400">
              <FileText className="w-4 h-4" />
              <span>Audit Trail Resolution Sealing</span>
            </div>
            <p className="text-gray-300 leading-relaxed font-sans">
              <strong>Meaning:</strong> Every conflict resolution records the resolver's user ID, timestamp, and explanation into the append-only SHA-256 ledger for full auditing transparency.
            </p>
          </div>
        </div>
      </div>

      {/* Resolution Modal */}
      {selectedConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl bg-darkSurface border border-darkBorder shadow-2xl p-6 space-y-4 font-sans glass-card">
            <div className="flex items-center justify-between pb-3 border-b border-darkBorder">
              <h3 className="text-sm font-bold text-gray-100 font-mono flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-brand-400" />
                Resolve Conflict: {selectedConflict.metric}
              </h3>
              <button onClick={() => setSelectedConflict(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1 font-mono">Select Recommended Authoritative Source:</label>
                <select
                  value={recommendedDoc}
                  onChange={(e) => setRecommendedDoc(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-darkBg border border-darkBorder text-gray-200 font-mono"
                >
                  <option value={selectedConflict.sourceBDocId}>
                    {selectedConflict.sourceBDocTitle} ({selectedConflict.valueB}) - RECOMMENDED AUDITED
                  </option>
                  <option value={selectedConflict.sourceADocId}>
                    {selectedConflict.sourceADocTitle} ({selectedConflict.valueA})
                  </option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 block mb-1 font-mono">Resolution Justification Notes:</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Explain why this source is designated authoritative..."
                  className="w-full p-2.5 rounded-xl bg-darkBg border border-darkBorder text-gray-200 font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-darkBorder">
              <button
                onClick={() => handleResolve(selectedConflict.id)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
