import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { UserRole, QueryResult } from '../types';
import { processZeroTrustQuery } from '../engine/policyEngine';
import { exportForensicReportPDF } from '../utils/pdfExport';
import { SEED_USERS } from '../engine/seedData';
import { 
  FileSearch, 
  RotateCcw, 
  Download, 
  Clock, 
  UserCheck, 
  ShieldCheck, 
  Play, 
  ArrowLeft,
  Sliders,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const Forensics: React.FC = () => {
  const { queryId } = useParams();
  const navigate = useNavigate();
  const { queryHistory, documents } = useAppStore();

  const originalQuery = queryHistory.find(q => q.queryId === queryId) || queryHistory[0];

  const [replayRole, setReplayRole] = useState<UserRole>('Finance Intern');
  const [replayResult, setReplayResult] = useState<QueryResult | null>(null);

  if (!originalQuery) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-gray-400 text-sm">No query found for forensics analysis: {queryId}</p>
        <button onClick={() => navigate('/chat')} className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs">
          Return to Chat
        </button>
      </div>
    );
  }

  const handleExecuteReplay = () => {
    const replayUser = SEED_USERS.find(u => u.role === replayRole) || SEED_USERS[0];
    const result = processZeroTrustQuery(originalQuery.prompt, replayUser, documents);
    setReplayResult(result);
  };

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
              <FileSearch className="w-6 h-6 text-purple-400" />
              AI Forensics & What-If Replay Studio
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Replay historical RAG queries under alternate user roles to audit differential permissions.
            </p>
          </div>
        </div>

        <button
          onClick={() => exportForensicReportPDF(replayResult || originalQuery, replayResult ? replayRole : undefined)}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-glow-sm"
        >
          <Download className="w-4 h-4" />
          Export Signed Forensic Report
        </button>
      </div>

      {/* What-If Replay Controls */}
      <div className="p-6 rounded-2xl bg-darkCard/90 border border-darkBorder glass-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-100 font-mono flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-400" />
            "What-If" Role Simulation Engine
          </h3>
          <span className="text-xs font-mono text-purple-400">Admin Investigation Mode</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <span className="text-gray-400 block mb-1">Target Prompt:</span>
            <div className="p-2.5 rounded-xl bg-darkBg border border-darkBorder text-gray-200 font-sans truncate">
              "{originalQuery.prompt}"
            </div>
          </div>

          <div>
            <span className="text-gray-400 block mb-1">Original User Role:</span>
            <div className="p-2.5 rounded-xl bg-darkBg border border-darkBorder text-brand-400 font-bold">
              {originalQuery.user.role} ({originalQuery.user.clearanceLevel})
            </div>
          </div>

          <div>
            <span className="text-gray-400 block mb-1">Replay Under Alternate Role:</span>
            <select
              value={replayRole}
              onChange={(e) => setReplayRole(e.target.value as UserRole)}
              className="w-full p-2.5 rounded-xl bg-darkBg border border-darkBorder text-gray-200 focus:outline-none"
            >
              <option value="Finance Intern">Finance Intern (Confidential)</option>
              <option value="Finance Manager">Finance Manager (Confidential)</option>
              <option value="CEO/Admin">CEO/Admin (Restricted)</option>
              <option value="Security Analyst">Security Analyst (Restricted)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleExecuteReplay}
            className="px-5 py-2.5 rounded-xl bg-accent-purple hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-glow-sm"
          >
            <Play className="w-4 h-4 fill-white" />
            Re-run Query Under {replayRole} Scope
          </button>
        </div>
      </div>

      {/* Comparison View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original Query Result */}
        <div className="p-5 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-darkBorder">
            <span className="text-xs font-bold text-brand-400 font-mono uppercase">Original Execution Log</span>
            <span className="text-xs font-mono text-gray-400">{originalQuery.user.role}</span>
          </div>

          <div className="p-3 rounded-xl bg-darkBg text-xs text-gray-300 font-sans leading-relaxed whitespace-pre-line">
            {originalQuery.answer}
          </div>

          <div className="text-xs font-mono space-y-1 text-gray-400 pt-2 border-t border-darkBorder">
            <div>Authorized Sources: <strong className="text-emerald-400">{originalQuery.authorizedSourcesCount}</strong></div>
            <div>Blocked Sources: <strong className="text-amber-400">{originalQuery.blockedSourcesCount}</strong></div>
            <div>Trust Score: <strong className="text-emerald-400">{originalQuery.trustScore.totalScore}/100</strong></div>
          </div>
        </div>

        {/* Replay Result */}
        <div className="p-5 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-darkBorder">
            <span className="text-xs font-bold text-purple-400 font-mono uppercase">Replay Execution ({replayRole})</span>
            <span className="text-xs font-mono text-purple-300">Simulated Scope</span>
          </div>

          {replayResult ? (
            <>
              <div className="p-3 rounded-xl bg-darkBg text-xs text-gray-300 font-sans leading-relaxed whitespace-pre-line border border-purple-500/30">
                {replayResult.answer}
              </div>

              <div className="text-xs font-mono space-y-1 text-gray-400 pt-2 border-t border-darkBorder">
                <div>Authorized Sources: <strong className="text-emerald-400">{replayResult.authorizedSourcesCount}</strong></div>
                <div>Blocked Sources: <strong className="text-amber-400">{replayResult.blockedSourcesCount}</strong></div>
                <div>Trust Score: <strong className="text-emerald-400">{replayResult.trustScore.totalScore}/100</strong></div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-gray-500 font-mono">
              Click 'Re-run Query' to simulate access outcome under {replayRole}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
