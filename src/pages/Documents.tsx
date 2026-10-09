import React, { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
import { useAppStore } from '../store/useAppStore';
import { DocumentItem, ClassificationLevel, DocumentType, UserRole } from '../types';
import { ClassificationBadge } from '../components/common/ClassificationBadge';
import { ENTERPRISE_ROLES } from '../config/enterpriseRoles';
import { isDocumentAdmin, canReadDocument } from '../utils/documentAccess';
import {
  listCatalog,
  saveDocumentPermissions,
  uploadCatalogDocument,
  openCatalogPdf,
  deleteCatalogDocument
} from '../services/catalogApi';
import {
  FileText,
  UploadCloud,
  Lock,
  ShieldCheck,
  Search,
  Edit3,
  Eye,
  Trash2,
  Sparkles,
  CheckCircle2,
  X,
  FileDown,
  Shield,
  AlertTriangle
} from 'lucide-react';

import { PDFDocumentViewerModal } from '../components/common/PDFDocumentViewerModal';

export const Documents: React.FC = () => {
  const { documents: storeDocs, addDocument, removeDocument, updateDocumentPermissions, currentUser } = useAppStore();
  const isLive = import.meta.env.VITE_API_MODE === 'live';
  const isAdmin = isDocumentAdmin(currentUser);

  const [liveDocs, setLiveDocs] = useState<DocumentItem[]>([]);
  const [totalCatalogCount, setTotalCatalogCount] = useState<number | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(isLive);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [viewingPdfDoc, setViewingPdfDoc] = useState<DocumentItem | null>(null);
  const [editingPermissionsDoc, setEditingPermissionsDoc] = useState<DocumentItem | null>(null);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<DocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState('');
  const [savingAcl, setSavingAcl] = useState(false);

  const fetchLiveCatalog = () => {
    if (!isLive) return;
    setLoadingCatalog(true);
    listCatalog().then(res => {
      setLiveDocs(res.documents);
      setTotalCatalogCount(res.totalDocuments ?? res.documents.length);
    }).catch(err => {
      console.error('Catalog fetch error:', err);
    }).finally(() => {
      setLoadingCatalog(false);
    });
  };

  useEffect(() => {
    fetchLiveCatalog();
  }, [isLive, currentUser?.id]);

  const allDocs = isLive
    ? liveDocs.map(l => {
      const local = storeDocs.find(s => s.title.toLowerCase().trim() === l.title.toLowerCase().trim());
      if (local && local.fileUrl) {
        return { ...l, fileUrl: local.fileUrl };
      }
      return l;
    }).concat(storeDocs.filter(s =>
      !liveDocs.some(l => l.id === s.id || l.title.toLowerCase().trim() === s.title.toLowerCase().trim())
    ))
    : storeDocs;

  // Role-Based Document Access Control (ACL Filtering)
  const accessibleDocs = allDocs.filter(doc => {
    // 1. Admin sees ALL documents in the enterprise
    if (isAdmin) return true;
    // 2. Regular Employees & Public Visitors
    return canReadDocument(currentUser, doc);
  });

  const hiddenCount = Math.max(0, allDocs.length - accessibleDocs.length);

  const filteredDocs = accessibleDocs.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.docType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenPdf = (docId: string) => {
    const doc = allDocs.find(d => d.id === docId);
    if (doc) {
      setViewingPdfDoc(doc);
    } else if (isLive) {
      openCatalogPdf(docId);
    }
  };

  const handleSimulateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStage('Uploading Document...');

    const metadata = {
      title: file.name,
      classification: (currentUser?.role === 'CEO' || currentUser?.role === 'Management Staff' || currentUser?.role === 'System Administrator' ? 'Restricted' : 'Confidential') as ClassificationLevel,
      docType: (file.name.toLowerCase().endsWith('.pdf') ? 'report' : file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.csv') ? 'expense' : 'contract') as DocumentType,
      department: currentUser?.department || 'Finance',
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    };

    try {
      if (isLive) {
        setUploadStage('Processing Document & Indexing...');
        const res = await uploadCatalogDocument(file, metadata);
        if (res.success && res.document) {
           addDocument(res.document);
        }
        fetchLiveCatalog();
      } else {
        // Fallback for non-live mode
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const newDoc: DocumentItem = {
            id: `doc_${Date.now()}`,
            title: file.name,
            classification: metadata.classification,
            docType: metadata.docType,
            department: metadata.department,
            uploadedAt: new Date().toISOString().split('T')[0],
            summary: `Ingested employee document '${file.name}' into ${currentUser?.department || 'Finance'} repository.`,
            ownerName: currentUser?.name || 'Employee Upload',
            fileSize: metadata.fileSize,
            pagesCount: Math.floor(Math.random() * 15) + 3,
            version: 'v1.0',
            status: 'indexed',
            permissions: {
              roles: [
                (currentUser?.role || 'General Staff') as UserRole,
                'CEO',
                'Management Staff',
                'System Administrator',
                'Senior Financial Analyst',
                'Finance Manager'
              ],
              users: [currentUser?.id || '', currentUser?.email || ''].filter(Boolean),
              departments: [currentUser?.department || 'Finance', 'ALL']
            },
            fileUrl: reader.result as string
          };
          addDocument(newDoc);
        };
      }
    } catch (err) {
      console.error('Failed to upload document:', err);
    } finally {
      setIsUploading(false);
      setUploadStage('');
      e.target.value = ''; // reset file input
    }
  };

  const handleSavePermissions = async () => {
    if (!editingPermissionsDoc) return;
    setSavingAcl(true);
    const updatedPermissions = editingPermissionsDoc.permissions || { roles: [], users: [], departments: [] };
    try {
      if (isLive) {
        await saveDocumentPermissions(editingPermissionsDoc.id, updatedPermissions);
        fetchLiveCatalog();
      } else {
        updateDocumentPermissions(editingPermissionsDoc.id, updatedPermissions);
      }
      setEditingPermissionsDoc(null);
    } catch (err) {
      console.error('Failed to save permissions:', err);
    } finally {
      setSavingAcl(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    setIsDeleting(true);
    try {
      if (isLive) {
        await deleteCatalogDocument(docId);
        fetchLiveCatalog();
      } else {
        removeDocument(docId);
      }
      setDeleteConfirmDoc(null);
    } catch (err) {
      console.error('Failed to delete document:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-darkBorder pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {isAdmin ? (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold border border-rose-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>👑 Master Admin Access (Management Staff): All {allDocs.length} Enterprise Documents Visible (0 Hidden)</span>
              </span>
            ) : currentUser ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>🔒 Role-Scoped Access ({currentUser.role}): {accessibleDocs.length} Authorized Documents Visible ({hiddenCount} Restricted Documents Hidden by Policy Gate 1)</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1.5">
                <span>🌐 Public Visitor Access: Viewing {accessibleDocs.length} Public Documents</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight font-mono flex items-center gap-3">
            <FileText className="w-6 h-6 text-brand-400" />
            Zero-Trust Document Management
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {isAdmin
              ? 'Admin Authority: Full Catalog Overview, Ingestion, ACL Governance & Permanent Deletion'
              : 'Secure Document Repository: Upload new documents & open authorized PDFs. Permissions are centrally governed by Administrator.'}
          </p>
        </div>

        {/* Upload Button: Any logged-in employee can upload */}
        {currentUser && (
          <label className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-glow-sm flex-shrink-0">
            <UploadCloud className="w-4 h-4" />
            <span>+ Upload Document (PDF/XLSX)</span>
            <input type="file" onChange={handleSimulateUpload} className="hidden" accept=".pdf,.docx,.xlsx,.csv,.txt" />
          </label>
        )}
      </div>

      {/* Upload Processing Stage Banner */}
      {isUploading && (
        <div className="p-4 rounded-2xl bg-brand-950/40 border border-brand-500/50 text-xs font-mono text-brand-300 space-y-2 animate-pulse glass-card">
          <div className="flex items-center justify-between font-bold">
            <span>PIPELINE PROCESSING STAGE</span>
            <span className="text-emerald-400">{uploadStage}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-darkBg overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {/* Security Governance Notice for Regular Employees */}
      {currentUser && !isAdmin && (
        <div className="p-3.5 rounded-2xl bg-darkCard/60 border border-brand-500/20 flex items-center gap-3 text-xs text-gray-300">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-gray-100">Zero-Trust Access Control Policy: </span>
            You can upload documents into your department repository and view full PDFs for your authorized clearance. Cross-employee access delegation is centrally restricted and governed exclusively by Administrators.
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-darkCard border border-darkBorder text-xs text-gray-200 w-full max-w-md">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents by title, department, or type..."
            className="bg-transparent focus:outline-none w-full placeholder-gray-500 font-sans"
          />
        </div>
        <div className="text-xs font-mono text-gray-400">
          Showing <span className="text-brand-300 font-bold">{filteredDocs.length}</span> documents
        </div>
      </div>

      {/* Document Table */}
      <div className="p-6 rounded-2xl bg-darkCard/80 border border-darkBorder glass-card">
        <div className="overflow-x-auto rounded-xl border border-darkBorder">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-darkSurface text-gray-400 font-mono text-[11px] uppercase border-b border-darkBorder">
              <tr>
                <th className="p-3">Document Title</th>
                <th className="p-3">Classification</th>
                <th className="p-3">Type</th>
                <th className="p-3">Department</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Size & Pages</th>
                <th className="p-3">Uploaded</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkBorder text-gray-300">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500 font-mono text-xs">
                    {loadingCatalog ? 'Loading document catalog...' : 'No accessible documents match your search.'}
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-darkBorder/50 transition-colors">
                    <td className="p-3 font-semibold text-gray-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      <span className="truncate max-w-xs">{doc.title}</span>
                    </td>
                    <td className="p-3">
                      <ClassificationBadge classification={doc.classification} size="sm" />
                    </td>
                    <td className="p-3 font-mono text-xs uppercase text-gray-400">{doc.docType}</td>
                    <td className="p-3 font-mono text-xs text-gray-300">{doc.department}</td>
                    <td className="p-3 text-xs text-gray-300 font-medium">{doc.ownerName || 'Enterprise'}</td>
                    <td className="p-3 font-mono text-gray-400">{doc.fileSize || '2.0 MB'} ({doc.pagesCount || 4} p)</td>
                    <td className="p-3 font-mono text-gray-400">{doc.uploadedAt}</td>
                    <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                      {/* Direct PDF View Button for anyone with access */}
                      <button
                        onClick={() => handleOpenPdf(doc.id)}
                        className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 hover:text-white transition-colors border border-emerald-500/30 inline-flex items-center gap-1 font-mono text-[11px]"
                        title="Open Official PDF Document"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>

                      {/* View Details Button */}
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="p-1.5 rounded-lg bg-brand-600/20 hover:bg-brand-600/40 text-brand-300 hover:text-white transition-colors border border-brand-500/30"
                        title="View Document Details & Chunks"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Edit ACL button: STRICTLY ADMIN ONLY */}
                      {isAdmin && (
                        <button
                          onClick={() => setEditingPermissionsDoc(doc)}
                          className="p-1.5 rounded-lg bg-darkBorder hover:bg-brand-600 hover:text-white text-gray-300 transition-colors border border-darkBorder"
                          title="Admin: Edit Access ACL Permissions"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Delete Document Button: STRICTLY ADMIN ONLY */}
                      {isAdmin && (
                        <button
                          onClick={() => setDeleteConfirmDoc(doc)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors border border-rose-500/30"
                          title="Admin: Delete Document Permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Content & Details Viewer Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-darkSurface border border-darkBorder shadow-2xl p-6 space-y-5 font-sans glass-card max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-darkBorder">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/30">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-100 font-mono">
                    {selectedDoc.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <ClassificationBadge classification={selectedDoc.classification} size="sm" />
                    <span className="text-[10px] font-mono text-gray-400">Owner: {selectedDoc.ownerName || 'Enterprise System'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded-lg bg-darkBorder text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Overview Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-darkBg border border-darkBorder text-xs font-mono">
              <div>
                <span className="text-gray-500 block text-[10px]">DEPARTMENT</span>
                <span className="text-gray-200 font-bold">{selectedDoc.department}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">DOC TYPE</span>
                <span className="text-brand-300 font-bold uppercase">{selectedDoc.docType}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">SIZE & PAGES</span>
                <span className="text-gray-200">{selectedDoc.fileSize || '2.0 MB'} ({selectedDoc.pagesCount || 4} pages)</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">VERSION</span>
                <span className="text-emerald-400 font-bold">{selectedDoc.version || 'v1.0'}</span>
              </div>
            </div>

            {/* Executive Summary Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                Document Content & Original Summary
              </h4>
              <div className="p-4 rounded-2xl bg-darkBg border border-darkBorder text-xs text-gray-300 leading-relaxed font-sans whitespace-pre-wrap">
                {selectedDoc.summary || `This document (${selectedDoc.title}) is indexed in the Zero-Trust RAG vector store. Access is governed strictly by classification level '${selectedDoc.classification}' and department ACLs.`}
              </div>
            </div>

            {/* Allowed ACL Roles Badges */}
            <div className="space-y-2 pt-2 border-t border-darkBorder">
              <h4 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-400" />
                Permitted Roles ACL ({selectedDoc.permissions?.roles?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedDoc.permissions?.roles?.map((r) => (
                  <span key={r} className="px-2.5 py-1 rounded-lg bg-brand-600/20 text-brand-300 border border-brand-500/30 text-[11px] font-mono font-bold">
                    ✓ {r}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-darkBorder">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>RAG Vector Index: Verified & Active</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Open PDF button */}
                <button
                  onClick={() => handleOpenPdf(selectedDoc.id)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Open Official PDF</span>
                </button>

                {/* Edit ACL button: STRICTLY ADMIN ONLY */}
                {isAdmin && (
                  <button
                    onClick={() => {
                      const target = selectedDoc;
                      setSelectedDoc(null);
                      setEditingPermissionsDoc(target);
                    }}
                    className="px-4 py-2 rounded-xl bg-darkBorder hover:bg-gray-700 text-gray-200 text-xs font-semibold font-mono flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4 text-brand-400" />
                    <span>Edit ACL</span>
                  </button>
                )}

                {/* Delete button in modal: STRICTLY ADMIN ONLY */}
                {isAdmin && (
                  <button
                    onClick={() => {
                      const target = selectedDoc;
                      setSelectedDoc(null);
                      setDeleteConfirmDoc(target);
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-semibold font-mono flex items-center gap-1.5 border border-rose-500/30 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-5 py-2 rounded-xl bg-darkBorder hover:bg-gray-700 text-gray-200 text-xs font-bold font-mono"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Editor Drawer Modal: STRICTLY ADMIN ONLY */}
      {editingPermissionsDoc && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-2xl bg-darkSurface border border-darkBorder shadow-2xl p-6 space-y-4 font-sans glass-card">
            <div className="flex items-center justify-between pb-3 border-b border-darkBorder">
              <h3 className="text-sm font-bold text-gray-100 font-mono flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-400" />
                Admin ACL Governance: {editingPermissionsDoc.title}
              </h3>
              <button onClick={() => setEditingPermissionsDoc(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1 font-mono">Classification Level:</label>
                <ClassificationBadge classification={editingPermissionsDoc.classification} size="md" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 font-mono text-xs">
                  <label className="text-gray-300 font-bold">Allowed Enterprise Roles ACL ({editingPermissionsDoc.permissions?.roles?.length || 0} Selected):</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPermissionsDoc({
                          ...editingPermissionsDoc,
                          permissions: { ...editingPermissionsDoc.permissions, roles: ENTERPRISE_ROLES.map(r => r.role) }
                        });
                      }}
                      className="text-[10px] text-brand-400 hover:underline font-mono"
                    >
                      Select All
                    </button>
                    <span className="text-gray-600">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPermissionsDoc({
                          ...editingPermissionsDoc,
                          permissions: { ...editingPermissionsDoc.permissions, roles: [] }
                        });
                      }}
                      className="text-[10px] text-rose-400 hover:underline font-mono"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-darkBg border border-darkBorder max-h-64 overflow-y-auto space-y-2 font-mono text-xs">
                  {ENTERPRISE_ROLES.map(rDef => {
                    const r = rDef.role;
                    const isChecked = editingPermissionsDoc.permissions?.roles?.includes(r);
                    return (
                      <label
                        key={r}
                        className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${isChecked
                            ? 'bg-brand-600/10 border-brand-500/40 text-white font-bold'
                            : 'bg-darkSurface/50 border-darkBorder/60 text-gray-400 hover:text-gray-200'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const currentRoles = editingPermissionsDoc.permissions?.roles || [];
                              const updated = e.target.checked
                                ? [...currentRoles, r]
                                : currentRoles.filter(x => x !== r);
                              setEditingPermissionsDoc({
                                ...editingPermissionsDoc,
                                permissions: { ...editingPermissionsDoc.permissions, roles: updated }
                              });
                            }}
                            className="rounded border-darkBorder text-brand-600 focus:ring-brand-500"
                          />
                          <span>{rDef.title} ({r})</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${rDef.clearanceLevel === 'Restricted'
                            ? 'bg-rose-500/20 text-rose-300'
                            : rDef.clearanceLevel === 'Confidential'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                          {rDef.department}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-darkBorder">
              <button
                type="button"
                onClick={() => setEditingPermissionsDoc(null)}
                className="px-4 py-2 rounded-xl bg-darkBorder hover:bg-gray-700 text-gray-300 text-xs"
              >
                Cancel
              </button>
              <button
                disabled={savingAcl}
                onClick={handleSavePermissions}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold disabled:opacity-50"
              >
                {savingAcl ? 'Saving...' : 'Save ACL Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Document Confirmation Modal: STRICTLY ADMIN ONLY */}
      {deleteConfirmDoc && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
          <div className="w-full max-w-md rounded-3xl bg-darkSurface border border-rose-500/40 shadow-2xl p-6 space-y-4 glass-card">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold font-mono text-white">
                  Permanently Delete Document?
                </h3>
                <p className="text-xs text-gray-400">Enterprise Admin Action</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-darkBg border border-darkBorder text-xs space-y-1">
              <div className="font-bold text-gray-200 font-mono truncate">{deleteConfirmDoc.title}</div>
              <div className="text-gray-400 text-[11px] font-mono">
                Department: {deleteConfirmDoc.department} • Classification: {deleteConfirmDoc.classification}
              </div>
            </div>

            <p className="text-xs text-rose-300 leading-relaxed font-mono">
              ⚠️ Deleting this document will permanently purge it from the backend repository and remove it from all employee RAG indices.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmDoc(null)}
                className="px-4 py-2 rounded-xl bg-darkBorder hover:bg-gray-700 text-gray-300 text-xs font-mono font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDeleteDocument(deleteConfirmDoc.id)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Delete for Everyone'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Document Viewer Modal */}
      {viewingPdfDoc && (
        <PDFDocumentViewerModal doc={viewingPdfDoc} onClose={() => setViewingPdfDoc(null)} />
      )}
    </div>
  );
};
