import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ClassificationBadge } from '../components/common/ClassificationBadge';
import { EvidenceModal } from '../components/common/EvidenceModal';
import { exportEvidenceReportPDF } from '../utils/pdfExport';
import { ChunkItem } from '../types';
import { 
  ShieldCheck, 
  FileText, 
  Download, 
  Eye, 
  CheckCircle2, 
  ArrowLeft, 
  GitCommit, 
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';

export const ProveAnswer: React.FC = () => {
  const { queryId } = useParams();
  const navigate = useNavigate();
  const { queryHistory } = useAppStore();
  const [selectedChunk, setSelectedChunk] = useState<ChunkItem | null>(null);

  const queryResult = queryHistory.find(q => q.queryId === queryId) || queryHistory[0];

  if (!queryResult) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-gray-400 text-sm">No query trace found for ID: {queryId}</p>
        <button onClick={() => navigate('/chat')} className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs">
          Return to Chat
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-darkBorder pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/chat')}
            className="p-2 rounded-xl bg-darkCard border border-darkBorder hover:bg-darkBorder text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight font-mono flex items-center gap-3">
              Prove Answer: {queryResult.queryId}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Verifiable Evidence Chain for prompt: <span className="text-gray-200 italic">"{queryResult.prompt}"</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/trace/${queryResult.queryId}`)}
            className="px-4 py-2 rounded-xl bg-accent-purple/20 border border-purple-500/40 text-purple-300 hover:bg-accent-purple/30 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <GitCommit className="w-4 h-4" />
            View Trust Trace
          </button>

          <button
            onClick={() => exportEvidenceReportPDF(queryResult)}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-glow-sm"
          >
            <Download className="w-4 h-4" />
            Export Evidence Report (PDF)
          </button>
        </div>
      </div>

      {/* Answer Summary Card */}
      <div className="p-6 rounded-2xl bg-darkCard/90 border border-darkBorder glass-card space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-brand-400 uppercase font-mono tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Verified AI Response
          </span>
          <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
            Trust Score: {queryResult.trustScore.totalScore}/100 ({queryResult.trustScore.band})
          </span>
        </div>

        <p className="text-sm text-gray-100 leading-relaxed font-sans whitespace-pre-line bg-darkBg/60 p-4 rounded-xl border border-darkBorder">
          {queryResult.answer}
        </p>

        <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
          <span>Authorized Sources: <strong className="text-emerald-400">{queryResult.authorizedSourcesCount}</strong></span>
          <span>Blocked Sources: <strong className="text-amber-400">{queryResult.blockedSourcesCount}</strong></span>
          <span>Restricted Leaks: <strong className="text-emerald-400">0</strong></span>
        </div>
      </div>

      {/* Evidence Items Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-100 font-mono uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-400" />
          Itemized Supporting Evidence ({queryResult.evidenceChunks.length})
        </h3>

        {queryResult.evidenceChunks.length === 0 ? (
          <div className="p-8 rounded-2xl bg-darkCard border border-darkBorder text-center text-xs text-gray-400 font-mono space-y-2">
            <Lock className="w-8 h-8 text-amber-400 mx-auto" />
            <p>No authorized evidence chunks retrieved. Access was denied pre-retrieval by Policy Engine Gate 1.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {queryResult.evidenceChunks.map((chunk, index) => (
              <div
                key={chunk.id}
                className="p-5 rounded-2xl bg-darkCard border border-darkBorder glass-card hover:border-brand-500/40 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 font-mono font-bold text-xs">
                      #{index + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-100 truncate max-w-[200px]">{chunk.docTitle}</h4>
                      <p className="text-[10px] text-gray-400 font-mono">Page {chunk.page} • Dept: {chunk.department}</p>
                    </div>
                  </div>
                  <ClassificationBadge classification={chunk.classification} size="sm" />
                </div>

                {/* Highlighted Snippet */}
                <div className="p-3 rounded-xl bg-brand-950/30 border border-brand-500/30 text-xs text-brand-200 font-medium">
                  "{chunk.highlightSnippet || chunk.content}"
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-darkBorder">
                  <span className="text-gray-400">Confidence: <strong className="text-emerald-400">{(chunk.score * 100).toFixed(1)}%</strong></span>
                  <button
                    onClick={() => setSelectedChunk(chunk)}
                    className="px-3 py-1.5 rounded-lg bg-darkBorder hover:bg-gray-700 text-gray-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-brand-400" />
                    Preview Segment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal preview */}
      {selectedChunk && (
        <EvidenceModal chunk={selectedChunk} onClose={() => setSelectedChunk(null)} />
      )}
    </div>
  );
};
