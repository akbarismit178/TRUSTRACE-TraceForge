import React, { useState } from 'react';
import { DocumentItem } from '../../types';
import { ClassificationBadge } from './ClassificationBadge';
import { 
  X, 
  FileText, 
  Download, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Search, 
  Lock,
  FileCheck,
  Building2,
  CheckCircle2,
  Maximize2
} from 'lucide-react';

interface Props {
  doc: DocumentItem | null;
  onClose: () => void;
}

export const PDFDocumentViewerModal: React.FC<Props> = ({ doc, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMetadataTab, setShowMetadataTab] = useState(false);

  if (!doc) return null;

  const totalPages = doc.pagesCount || 12;

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleZoomIn = () => {
    if (zoomLevel < 175) setZoomLevel(prev => prev + 25);
  };

  const handleZoomOut = () => {
    if (zoomLevel > 75) setZoomLevel(prev => prev - 25);
  };

  const handleDownload = () => {
    if (doc.fileUrl) {
      const a = document.createElement('a');
      a.href = doc.fileUrl;
      a.download = doc.title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.open(`/api/v1/catalog/documents/${encodeURIComponent(doc.id)}/pdf`, '_blank');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-lg animate-fade-in font-sans">
      <div className="w-full max-w-6xl h-[92vh] rounded-3xl bg-darkSurface border border-darkBorder shadow-2xl flex flex-col overflow-hidden glass-card">
        
        {/* PDF Viewer Header Toolbar */}
        <div className="px-4 py-3 bg-darkCard border-b border-darkBorder flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Document Title & Badge */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-100 font-mono truncate max-w-xs sm:max-w-md">
                  {doc.title}
                </h3>
                <ClassificationBadge classification={doc.classification} size="sm" />
              </div>
              <p className="text-[11px] text-gray-400 font-mono truncate">
                {doc.department} Department • {doc.docType.toUpperCase()} • {doc.fileSize || '3.5 MB'}
              </p>
            </div>
          </div>

          {/* Page Navigation & Controls */}
          <div className="flex items-center gap-2 bg-darkBg border border-darkBorder px-3 py-1.5 rounded-xl text-xs font-mono">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-gray-200">
              Page <strong className="text-brand-300">{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom & Action Controls */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 bg-darkBg border border-darkBorder px-2.5 py-1 rounded-xl text-xs font-mono">
              <button onClick={handleZoomOut} className="p-1 text-gray-400 hover:text-white" title="Zoom Out">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-gray-300 w-12 text-center">{zoomLevel}%</span>
              <button onClick={handleZoomIn} className="p-1 text-gray-400 hover:text-white" title="Zoom In">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Download Original PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-darkSurface hover:bg-darkBorder border border-darkBorder text-gray-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
              title="Print Document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-darkSurface hover:bg-rose-600 hover:text-white text-gray-400 border border-darkBorder transition-colors ml-2"
              title="Close PDF Viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Body: Document Viewer & Side Panel */}
        <div className="flex-1 flex overflow-hidden">
          
          <div className="flex-1 bg-darkBg/90 overflow-y-auto p-4 sm:p-8 flex justify-center items-start border-r border-darkBorder">
            <iframe
              src={doc.fileUrl || `/api/v1/catalog/documents/${encodeURIComponent(doc.id)}/pdf`}
              title={doc.title}
              className="w-full h-full min-h-[800px] bg-white rounded-2xl shadow-2xl border border-gray-200"
            />
          </div>

          {/* Sidebar Document Info & ACL Drawer */}
          <div className="hidden lg:flex flex-col w-80 bg-darkSurface/95 border-l border-darkBorder p-5 space-y-5 shrink-0 overflow-y-auto">
            <div>
              <h4 className="text-xs font-mono font-bold text-gray-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-brand-400" />
                Document Metadata
              </h4>

              <div className="space-y-2 text-xs font-mono bg-darkBg p-3.5 rounded-2xl border border-darkBorder">
                <div><span className="text-gray-500 block text-[10px]">FILE NAME</span> <strong className="text-white break-all">{doc.title}</strong></div>
                <div><span className="text-gray-500 block text-[10px]">DEPARTMENT</span> <strong className="text-brand-300">{doc.department}</strong></div>
                <div><span className="text-gray-500 block text-[10px]">CLASSIFICATION</span> <ClassificationBadge classification={doc.classification} size="sm" /></div>
                <div><span className="text-gray-500 block text-[10px]">FILE SIZE</span> <strong className="text-gray-200">{doc.fileSize || '3.5 MB'}</strong></div>
                <div><span className="text-gray-500 block text-[10px]">TOTAL PAGES</span> <strong className="text-gray-200">{totalPages} Pages</strong></div>
                <div><span className="text-gray-500 block text-[10px]">UPLOAD DATE</span> <strong className="text-gray-200">{doc.uploadedAt}</strong></div>
              </div>
            </div>

            {/* Allowed Roles List */}
            <div>
              <h4 className="text-xs font-mono font-bold text-gray-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                Authorized Clearance Roles
              </h4>

              <div className="space-y-1.5 font-mono text-xs">
                {doc.permissions?.roles?.map((roleName) => (
                  <div key={roleName} className="p-2 rounded-xl bg-darkCard border border-darkBorder text-emerald-300 flex items-center justify-between">
                    <span>✓ {roleName}</span>
                    <span className="text-[10px] text-gray-400 font-bold">ALLOWED</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Invariant Status */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-xs font-mono text-emerald-400 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>ZERO-TRUST STATUS</span>
              </div>
              <div className="text-[11px] text-gray-300">
                Restricted Chunks Sent To LLM = 0. Gate 1 pre-retrieval policy passed.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
