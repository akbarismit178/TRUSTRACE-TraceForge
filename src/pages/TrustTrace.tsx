import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ContextManifestViewer } from '../components/common/ContextManifestViewer';
import { SecurityStrip } from '../components/common/SecurityStrip';
import { 
  ArrowLeft, 
  GitCommit, 
  UserCheck, 
  ShieldCheck, 
  FileSearch, 
  Lock, 
  Hash, 
  Cpu, 
  CheckCircle2, 
  AlertOctagon,
  Download
} from 'lucide-react';
import { exportForensicReportPDF } from '../utils/pdfExport';

export const TrustTrace: React.FC = () => {
  const { queryId } = useParams();
  const navigate = useNavigate();
  const { queryHistory } = useAppStore();

  const queryResult = queryHistory.find(q => q.queryId === queryId) || queryHistory[0];

  if (!queryResult) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-gray-400 text-sm">No trace found for query ID: {queryId}</p>
        <button onClick={() => navigate('/chat')} className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs">
          Return to Chat
        </button>
      </div>
    );
  }

  const pipelineSteps = [
    {
      step: 1,
      title: 'Question Received',
      icon: Cpu,
      status: 'Completed',
      desc: `Prompt: "${queryResult.prompt}"`,
      detail: `Input sanitized for direct delimiters. No SQL/prompt breakout detected.`,
      color: 'text-brand-400 border-brand-500/40 bg-brand-500/10',
    },
    {
      step: 2,
      title: 'User Authenticated & Scope Validated',
      icon: UserCheck,
      status: 'Completed',
      desc: `User: ${queryResult.user.name} (${queryResult.user.role})`,
      detail: `Clearance: ${queryResult.user.clearanceLevel} | Department: ${queryResult.user.department} | IP: ${queryResult.user.sessionIp}`,
      color: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
    },
    {
      step: 3,
      title: 'Gate 1: Pre-Retrieval Permission Filter',
      icon: ShieldCheck,
      status: 'Enforced',
      desc: `Filter applied INSIDE vector query WHERE clause`,
      detail: `Rule: clearance >= classification AND (dept == user.dept OR grant active) AND doctype allowed.`,
      color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
    },
    {
      step: 4,
      title: 'Documents Searched & Filtered',
      icon: FileSearch,
      status: 'Completed',
      desc: `Authorized: ${queryResult.authorizedSourcesCount} docs | Blocked: ${queryResult.blockedSourcesCount} docs`,
      detail: queryResult.user.role === 'CEO/Admin' 
        ? `Full administrative visibility into all matched sources.`
        : `${queryResult.blockedSourcesCount} restricted documents blocked; titles & snippets redacted from user view.`,
      color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    },
    {
      step: 5,
      title: 'Gate 2: Context Manifest Assembly',
      icon: Hash,
      status: 'Verified',
      desc: `Manifest SHA-256 Hash Generated`,
      detail: `Cryptographic manifest signed with ${queryResult.evidenceChunks.length} chunk IDs.`,
      color: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
    },
    {
      step: 6,
      title: 'Gate 3: Output Guard & LLM Inference',
      icon: CheckCircle2,
      status: 'Completed',
      desc: `Execution Latency: ${queryResult.executionTimeMs} ms`,
      detail: `Output scanned for PII/Secret leaks. All claims validated against cited chunks.`,
      color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    }
  ];

  const isInvariantPassed = queryResult.restrictedChunksSent === 0;

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
              Trust Trace Pipeline: {queryResult.queryId}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              End-to-End Zero-Trust RAG Execution Telemetry
            </p>
          </div>
        </div>

        <button
          onClick={() => exportForensicReportPDF(queryResult)}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-glow-sm"
        >
          <Download className="w-4 h-4" />
          Export Forensic Certificate
        </button>
      </div>

      {/* CORE INVARIANT CARD (HIGH IMPACT VISUAL) */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6 transition-all ${
        isInvariantPassed 
          ? 'bg-emerald-950/20 border-emerald-500/50 shadow-success-glow' 
          : 'bg-rose-950/40 border-rose-500/80 animate-pulse glow-border-danger'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl ${isInvariantPassed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-600 text-white animate-bounce'}`}>
            {isInvariantPassed ? <ShieldCheck className="w-8 h-8" /> : <AlertOctagon className="w-8 h-8" />}
          </div>
          <div>
            <div className="text-xs font-bold font-mono uppercase tracking-wider text-gray-400">
              Zero-Trust Core Invariant Status
            </div>
            <div className="text-xl md:text-2xl font-extrabold text-white mt-1">
              Restricted Chunks Sent To LLM: {' '}
              <span className={`font-mono ${isInvariantPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                {queryResult.restrictedChunksSent}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {isInvariantPassed 
                ? 'Zero restricted context leaked to the LLM endpoint during this inference run.' 
                : 'CRITICAL SECURITY VIOLATION: Restricted data attempted breakout!'}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end font-mono text-xs text-gray-300">
          <span className="text-gray-400">Execution Latency:</span>
          <span className="text-brand-400 font-bold text-base">{queryResult.executionTimeMs} ms</span>
        </div>
      </div>

      {/* Vertical Animated Pipeline Stepper */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-gray-100 font-mono uppercase tracking-wider flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-brand-400" />
            Execution Telemetry Stepper
          </h3>

          <div className="relative border-l-2 border-darkBorder ml-4 pl-6 space-y-6">
            {pipelineSteps.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="relative group">
                  {/* Step Dot */}
                  <div className={`absolute -left-[35px] top-0 p-1.5 rounded-full border bg-darkBg ${s.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Step Content */}
                  <div className="p-4 rounded-xl bg-darkCard/80 border border-darkBorder glass-card hover:border-brand-500/30 transition-all space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-100 font-mono">
                        Step {s.step}: {s.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-darkBg text-emerald-400 border border-darkBorder">
                        {s.status}
                      </span>
                    </div>

                    <div className="text-xs text-gray-300 font-medium">{s.desc}</div>
                    <div className="text-[11px] text-gray-400 font-mono">{s.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Context Manifest Viewer */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-100 font-mono uppercase tracking-wider">
            Context Manifest (Gate 2)
          </h3>
          <ContextManifestViewer manifest={queryResult.contextManifest} />

          {/* Blocked Source Redaction Notice */}
          <div className="p-4 rounded-xl bg-darkCard border border-darkBorder text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400 font-mono">
              <Lock className="w-4 h-4" />
              Role-Aware Redaction Policy
            </div>
            <p className="text-gray-300 leading-relaxed">
              Users without CEO/Admin rights see only counts for blocked sources ({queryResult.blockedSourcesCount} blocked). 
              Document titles, file paths, and snippet previews are completely masked to prevent existence-probing attacks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
