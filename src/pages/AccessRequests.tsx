import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Key, Plus, CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';
import { ClassificationBadge } from '../components/common/ClassificationBadge';

export const AccessRequests: React.FC = () => {
  const { accessRequests, createAccessRequest, updateAccessRequestStatus, currentUser, documents } = useAppStore();
  const activeUser = currentUser || { id: 'guest', name: 'Guest User', role: 'Public Guest' };
  const [selectedDocId, setSelectedDocId] = useState(documents[4]?.id || '');
  const [reason, setReason] = useState('');
  const [durationHours, setDurationHours] = useState(24);

  const handleCreateRequest = () => {
    const doc = documents.find(d => d.id === selectedDocId);
    if (!doc || !reason) return;

    createAccessRequest({
      userId: activeUser.id,
      userName: activeUser.name,
      userRole: activeUser.role as any,
      docId: doc.id,
      docTitle: doc.title,
      classification: doc.classification,
      durationHours,
      reason,
      expiresAt: new Date(Date.now() + durationHours * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19),
    });

    setReason('');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-darkBorder pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-mono flex items-center gap-3">
            <Key className="w-6 h-6 text-brand-400" />
            Time-Bound Access Requests
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Request and approve temporary, time-bounded permission grants with justification audit logs
          </p>
        </div>
      </div>

      {/* New Request Form */}
      <div className="p-6 rounded-2xl bg-darkCard/90 border border-darkBorder glass-card space-y-4">
        <h3 className="text-sm font-bold text-gray-100 font-mono">Create Time-Bound Access Request</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <label className="text-gray-400 block mb-1">Target Document:</label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-darkBg border border-darkBorder text-gray-200"
            >
              {documents.map(d => (
                <option key={d.id} value={d.id}>{d.title} ({d.classification})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-gray-400 block mb-1">Grant Duration (Hours):</label>
            <input
              type="number"
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-darkBg border border-darkBorder text-gray-200"
            />
          </div>

          <div>
            <label className="text-gray-400 block mb-1">Audit Reason / Justification:</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Audit reconciliation..."
              className="w-full p-2.5 rounded-xl bg-darkBg border border-darkBorder text-gray-200 font-sans"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleCreateRequest}
            disabled={!reason}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-glow-sm"
          >
            <Plus className="w-4 h-4" />
            Submit Request
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="p-6 rounded-2xl bg-darkCard/80 border border-darkBorder glass-card space-y-4">
        <h3 className="text-sm font-bold text-gray-100 font-mono">Access Requests Log ({accessRequests.length})</h3>

        <div className="space-y-3">
          {accessRequests.map((req) => (
            <div key={req.id} className="p-4 rounded-xl bg-darkBg border border-darkBorder flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    req.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300' : (req.status === 'Rejected' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300')
                  }`}>
                    {req.status}
                  </span>
                  <span className="font-bold text-gray-200">{req.userName} ({req.userRole})</span>
                </div>
                <div className="text-gray-300 font-semibold">{req.docTitle}</div>
                <div className="text-gray-400 font-sans text-[11px]">Reason: "{req.reason}"</div>
                <div className="text-gray-500 text-[10px]">Requested: {req.requestedAt} • Expires: {req.expiresAt}</div>
              </div>

              {req.status === 'Pending' && currentUser && (currentUser.role === 'CEO/Admin' || currentUser.role === 'Finance Manager') && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateAccessRequestStatus(req.id, 'Approved', currentUser.name)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateAccessRequestStatus(req.id, 'Rejected', currentUser.name)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
