import React from 'react';
import { ChunkItem } from '../../types';
import { ClassificationBadge } from './ClassificationBadge';
import { X, FileText, CheckCircle2, Download, Eye } from 'lucide-react';

interface Props {
  chunk: ChunkItem | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<Props> = ({ chunk, onClose }) => {
  if (!chunk) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl rounded-2xl bg-darkSurface border border-darkBorder shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-darkBorder flex items-center justify-between bg-darkCard/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
                {chunk.docTitle}
                <ClassificationBadge classification={chunk.classification} size="sm" />
              </h3>
              <p className="text-xs text-gray-400">Page {chunk.page} • Type: {chunk.docType.toUpperCase()} • Department: {chunk.department}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-darkBorder text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Metadata Bar */}
          <div className="grid grid-cols-3 gap-4 p-3 rounded-xl bg-darkBg border border-darkBorder text-xs font-mono">
            <div>
              <span className="text-gray-500 block">RETRIEVAL SCORE</span>
              <span className="text-emerald-400 font-bold text-sm">{(chunk.score * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-500 block">CHUNK ID</span>
              <span className="text-brand-400 font-bold">{chunk.id}</span>
            </div>
            <div>
              <span className="text-gray-500 block">DEPARTMENT</span>
              <span className="text-gray-200 font-bold">{chunk.department}</span>
            </div>
          </div>

          {/* Highlighted Snippet Box */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Matched Text Snippet
            </h4>
            <div className="p-4 rounded-xl bg-brand-950/20 border border-brand-500/30 text-sm text-brand-200 font-medium leading-relaxed">
              "{chunk.highlightSnippet || chunk.content}"
            </div>
          </div>

          {/* Full Chunk Text */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Full Extracted Chunk Context
            </h4>
            <div className="p-4 rounded-xl bg-darkCard border border-darkBorder text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-sans">
              {chunk.content}
            </div>
          </div>

          {/* Mock Document Page Preview Box */}
          <div className="p-4 rounded-xl bg-darkBg border border-darkBorder flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-brand-400" />
              <span className="text-xs text-gray-300 font-medium">Document Page {chunk.page} Scan Preview</span>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Download Page Segment
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-darkBorder bg-darkCard/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-darkBorder hover:bg-gray-700 text-gray-200 text-xs font-medium transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
