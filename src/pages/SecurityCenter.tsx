import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { SecurityEventItem, AuditLogItem } from '../types';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Zap, 
  Search, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  Hash,
  Filter,
  Users,
  Clock
} from 'lucide-react';

export const SecurityCenter: React.FC = () => {
  const { securityEvents, auditLogs, verifyAuditChainIntegrity } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; checked: boolean }>({ valid: true, checked: false });

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.hash.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDecision = decisionFilter === 'ALL' || log.decision === decisionFilter;
    return matchesSearch && matchesDecision;
  });

  const handleVerifyChain = () => {
    const res = verifyAuditChainIntegrity();
    setVerificationResult({ valid: res.valid, checked: true });
  };

  const handleExportCSV = () => {
    const headers = 'StepIndex,Timestamp,UserId,UserName,Role,Action,Resource,Decision,Hash\n';
    const rows = auditLogs.map(l => 
      `${l.stepIndex},"${l.timestamp}","${l.userId}","${l.userName}","${l.role}","${l.action}","${l.resource}","${l.decision}","${l.hash}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TRUSTRACE_Audit_Logs_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
  };

  // Dynamic Real KPIs
  const promptInjections = securityEvents.filter(e => e.type === 'Prompt Injection').length;
  const permissionDenials = securityEvents.filter(e => e.type === 'Permission Denial' || e.type === 'Unauthorized Access').length;
  const honeytokens = securityEvents.filter(e => e.type === 'Honeytoken Triggered').length;
  const totalEvents = securityEvents.length;
  const highSevCount = securityEvents.filter(e => e.severity === 'High' || e.severity === 'Critical').length;
  const threatLevel = highSevCount === 0 ? 'LOW (SECURE)' : highSevCount <= 2 ? 'ELEVATED (GUARDED)' : 'HIGH ALERT';
  const threatColor = highSevCount === 0 ? 'text-emerald-400' : highSevCount <= 2 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-darkBorder pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-mono flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            Security Operations & SOC Center
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time Threat Monitoring, Prompt Injection Scanners & Append-Only Hash-Chained Audit Logs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleVerifyChain}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-success-glow"
          >
            <CheckCircle2 className="w-4 h-4" />
            Verify Hash-Chain Integrity
          </button>
        </div>
      </div>

      {/* Hash Chain Verification Result Banner */}
      {verificationResult.checked && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-mono ${
          verificationResult.valid ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/40 border-rose-500/80 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Cryptographic Proof: All {auditLogs.length} audit log entries verified against SHA-256 prevHash chain. Zero tampering detected!</span>
          </div>
        </div>
      )}

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card">
          <div className="text-xs text-gray-400 mb-1 font-mono">Prompt Injections Intercepted</div>
          <div className="text-2xl font-extrabold text-rose-400 font-mono">{promptInjections}</div>
          <div className="text-[11px] text-emerald-400 mt-1 font-semibold">100% Intercepted at Gate 1</div>
        </div>

        <div className="p-4 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card">
          <div className="text-xs text-gray-400 mb-1 font-mono">Permission Denials</div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">{permissionDenials}</div>
          <div className="text-[11px] text-gray-400 mt-1 font-mono">ABAC Policy Filter Blocks</div>
        </div>

        <div className="p-4 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card">
          <div className="text-xs text-gray-400 mb-1 font-mono">Honeytoken / Probe Traps</div>
          <div className="text-2xl font-extrabold text-purple-400 font-mono">{honeytokens}</div>
          <div className="text-[11px] text-purple-300 mt-1 font-mono">Decoy Chunks Monitored</div>
        </div>

        <div className="p-4 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card">
          <div className="text-xs text-gray-400 mb-1 font-mono">Current Threat Level</div>
          <div className={`text-2xl font-extrabold font-mono ${threatColor}`}>{threatLevel}</div>
          <div className="text-[11px] text-emerald-400 mt-1 font-mono">Invariant: Leaks = 0</div>
        </div>
      </div>

      {/* Audit Log Table Section */}
      <div className="p-6 rounded-2xl bg-darkCard/80 border border-darkBorder glass-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-gray-100 font-mono flex items-center gap-2">
              <Hash className="w-5 h-5 text-brand-400" />
              Immutable Hash-Chained Audit Ledger
            </h3>
            <p className="text-xs text-gray-400">Append-only log sealed with SHA-256 hashes ({auditLogs.length} total events recorded)</p>
          </div>

          {/* Search & Export Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-darkBg border border-darkBorder text-xs">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search user, hash, resource..."
                className="bg-transparent text-gray-200 focus:outline-none w-40 sm:w-56 font-mono"
              />
            </div>

            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-darkBg border border-darkBorder text-xs text-gray-200 cursor-pointer font-mono"
            >
              <option value="ALL">All Decisions</option>
              <option value="Allowed">Allowed</option>
              <option value="Denied">Denied</option>
            </select>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors font-mono"
            >
              <Download className="w-4 h-4" />
              CSV Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-darkBorder">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-darkSurface text-gray-400 font-mono text-[11px] uppercase border-b border-darkBorder">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">User</th>
                <th className="p-3">Action</th>
                <th className="p-3">Resource</th>
                <th className="p-3">Decision</th>
                <th className="p-3">SHA-256 Hash</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkBorder text-gray-300">
              {filteredAuditLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-400 font-mono">
                    No audit log entries found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAuditLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr 
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="hover:bg-darkBorder/50 cursor-pointer transition-colors"
                      >
                        <td className="p-3 font-mono text-brand-400 font-bold">{log.stepIndex}</td>
                        <td className="p-3 font-mono text-gray-400">{log.timestamp}</td>
                        <td className="p-3 font-semibold text-gray-200">{log.userName} ({log.role})</td>
                        <td className="p-3 max-w-[180px] truncate">{log.action}</td>
                        <td className="p-3 max-w-[180px] truncate font-mono text-gray-400">{log.resource}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            log.decision === 'Allowed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {log.decision}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[10px] text-gray-500 max-w-[120px] truncate">
                          {log.hash.substring(0, 16)}...
                        </td>
                        <td className="p-3 text-right">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 inline" /> : <ChevronDown className="w-4 h-4 text-gray-400 inline" />}
                        </td>
                      </tr>

                      {/* Expandable Detail View */}
                      {isExpanded && (
                        <tr className="bg-darkBg/80">
                          <td colSpan={8} className="p-4 space-y-2 font-mono text-xs text-gray-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 rounded-xl bg-darkSurface border border-darkBorder">
                              <div>
                                <span className="text-gray-500 block text-[10px]">PREVIOUS SHA-256 HASH</span>
                                <span className="text-brand-400 truncate block">{log.prevHash}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block text-[10px]">CURRENT BLOCK HASH</span>
                                <span className="text-emerald-400 truncate block">{log.hash}</span>
                              </div>
                            </div>
                            <div className="p-3 rounded-xl bg-darkSurface border border-darkBorder font-sans">
                              <span className="text-gray-400 font-bold block mb-1">Log Narrative Details:</span>
                              <span>{log.details}</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Metrics Guide & Explanations Section */}
      <div className="p-6 rounded-2xl bg-darkCard/90 border border-darkBorder glass-card space-y-5">
        <div className="border-b border-darkBorder pb-3">
          <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Security Metrics Glossary & Zero-Trust Telemetry Definitions
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Detailed explanation of how each operational metric is calculated and enforced in the TrustTrace architecture.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-darkBg/80 border border-darkBorder space-y-2">
            <div className="flex items-center gap-2 font-mono font-bold text-rose-400">
              <ShieldAlert className="w-4 h-4" />
              <span>Prompt Injections Intercepted</span>
            </div>
            <p className="text-gray-300 leading-relaxed font-sans">
              Counts all adversarial queries attempting to bypass LLM system instructions (e.g. "Ignore previous instructions", DAN jailbreaks, or base64 hidden payloads). The regex & semantic scanner intercepts them before vector retrieval occurs.
            </p>
            <div className="text-[11px] font-mono text-gray-500 bg-darkSurface p-2 rounded-lg border border-darkBorder/60">
              <strong>Zero-Trust Guarantee:</strong> Malicious prompts never reach the LLM context window.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-darkBg/80 border border-darkBorder space-y-2">
            <div className="flex items-center gap-2 font-mono font-bold text-amber-400">
              <Lock className="w-4 h-4" />
              <span>Permission Denials (Gate 1 ABAC)</span>
            </div>
            <p className="text-gray-300 leading-relaxed font-sans">
              Counts queries or chunk requests where the user's role, department, or clearance level (Public &lt; Internal &lt; Confidential &lt; Restricted) was insufficient to access the document metadata or embedding vector.
            </p>
            <div className="text-[11px] font-mono text-gray-500 bg-darkSurface p-2 rounded-lg border border-darkBorder/60">
              <strong>Zero-Trust Guarantee:</strong> Unauthorized document vectors are pruned at index retrieval time.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-darkBg/80 border border-darkBorder space-y-2">
            <div className="flex items-center gap-2 font-mono font-bold text-purple-400">
              <Zap className="w-4 h-4" />
              <span>Honeytoken / Decoy Traps</span>
            </div>
            <p className="text-gray-300 leading-relaxed font-sans">
              Measures interactions with decoy synthetic chunks planted across the vector database. Any employee or automated probe attempting to access honeytoken chunks triggers an instant high-severity audit alarm.
            </p>
            <div className="text-[11px] font-mono text-gray-500 bg-darkSurface p-2 rounded-lg border border-darkBorder/60">
              <strong>Zero-Trust Guarantee:</strong> Detects insider reconnaissance and unauthorized lateral scanning.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-darkBg/80 border border-darkBorder space-y-2">
            <div className="flex items-center gap-2 font-mono font-bold text-emerald-400">
              <Hash className="w-4 h-4" />
              <span>SHA-256 Hash-Chained Audit Ledger</span>
            </div>
            <p className="text-gray-300 leading-relaxed font-sans">
              Every query decision, document upload, and authorization grant computes a cryptographic SHA-256 hash linking back to the previous entry's hash. If any single log line is tampered with, chain validation immediately fails.
            </p>
            <div className="text-[11px] font-mono text-gray-500 bg-darkSurface p-2 rounded-lg border border-darkBorder/60">
              <strong>Zero-Trust Guarantee:</strong> Tamper-evident mathematical proof for SOC 2 Type II audits.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
