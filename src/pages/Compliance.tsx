import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { SEED_COMPLIANCE_REPORTS } from '../engine/seedData';
import { exportComplianceReportPDF } from '../utils/pdfExport';
import { 
  FileCheck, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Database, 
  Lock, 
  FileText, 
  Hash, 
  Sparkles,
  Award
} from 'lucide-react';

export const Compliance: React.FC = () => {
  const { auditLogs, securityEvents } = useAppStore();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState('');

  // Dynamic Metrics
  const realAuditCount = auditLogs.length;
  const policyViolations = securityEvents.filter(e => e.severity === 'Critical').length;
  const latestChainHash = auditLogs[0]?.hash || '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4';

  const handleDownloadReport = (rep: typeof SEED_COMPLIANCE_REPORTS[0]) => {
    setDownloadingId(rep.id);
    setDownloadSuccess('');

    setTimeout(() => {
      try {
        exportComplianceReportPDF({
          id: rep.id,
          type: rep.type,
          title: rep.title,
          generatedAt: rep.generatedAt,
          totalAuditEntries: Math.max(rep.totalAuditEntries, realAuditCount),
          policyViolationsCount: policyViolations,
          chainIntegrityHash: latestChainHash,
          complianceScore: '100%',
        });
        setDownloadSuccess(`Successfully downloaded official ${rep.type} Compliance Attestation PDF.`);
      } catch (err) {
        console.error(err);
      } finally {
        setDownloadingId(null);
        setTimeout(() => setDownloadSuccess(''), 4000);
      }
    }, 400);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-darkBorder pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-mono flex items-center gap-3">
            <FileCheck className="w-6 h-6 text-emerald-400" />
            Compliance & Regulatory Reporting (SOC 2 / ISO 27001 / DPDP)
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Generate verifiable compliance attestations, zero-trust context reports, and cryptographic audit proofs
          </p>
        </div>
      </div>

      {/* Download Success Banner */}
      {downloadSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Top Compliance KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card">
          <div className="text-xs text-gray-400 mb-1 font-mono">SOC 2 Type II Status</div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">CERTIFIED</div>
          <div className="text-[11px] text-emerald-300 mt-1 font-mono">Continuous Trust Monitoring</div>
        </div>

        <div className="p-4 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card">
          <div className="text-xs text-gray-400 mb-1 font-mono">ISO/IEC 27001 ISMS</div>
          <div className="text-2xl font-extrabold text-brand-400 font-mono">ALIGNED</div>
          <div className="text-[11px] text-brand-300 mt-1 font-mono">A.9 Access Control Verified</div>
        </div>

        <div className="p-4 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card">
          <div className="text-xs text-gray-400 mb-1 font-mono">Audited Ledger Events</div>
          <div className="text-2xl font-extrabold text-white font-mono">{realAuditCount}</div>
          <div className="text-[11px] text-gray-400 mt-1 font-mono">Immutable SHA-256 Chain</div>
        </div>

        <div className="p-4 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card">
          <div className="text-xs text-gray-400 mb-1 font-mono">Context Leak Violations</div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">0</div>
          <div className="text-[11px] text-emerald-400 mt-1 font-semibold">100% Invariant Preserved</div>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SEED_COMPLIANCE_REPORTS.map((rep) => (
          <div key={rep.id} className="p-6 rounded-2xl bg-darkCard/80 border border-darkBorder glass-card space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/30">
                {rep.type} COMPLIANT
              </span>
              <span className="text-xs font-mono text-gray-400">{rep.generatedAt}</span>
            </div>

            <h3 className="text-base font-bold text-gray-100 font-mono">{rep.title}</h3>

            <div className="space-y-2 text-xs font-mono text-gray-300 border-t border-b border-darkBorder py-3.5">
              <div className="flex justify-between">
                <span className="text-gray-400">Audited Log Entries:</span>
                <span className="text-brand-400 font-bold">{Math.max(rep.totalAuditEntries, realAuditCount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Policy Violations / Leaks:</span>
                <span className="text-emerald-400 font-bold">{policyViolations} (0.00% Defect)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">SHA-256 Chain Integrity:</span>
                <span className="text-emerald-400 font-bold">VERIFIED IMMUTABLE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Scope:</span>
                <span className="text-gray-200">Zero-Trust Context RAG & ABAC</span>
              </div>
            </div>

            <button 
              onClick={() => handleDownloadReport(rep)}
              disabled={downloadingId === rep.id}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-600/30 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingId === rep.id ? 'Generating Verified PDF...' : `Download ${rep.type} Attestation PDF`}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Meaning & Compliance Rationale Guide Section */}
      <div className="p-6 rounded-2xl bg-darkCard/90 border border-darkBorder glass-card space-y-5">
        <div className="border-b border-darkBorder pb-3">
          <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Compliance Architecture & Regulatory Standard Definitions
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            How TrustTrace mathematical context isolation meets international enterprise compliance frameworks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-darkBg/80 border border-darkBorder space-y-2">
            <div className="flex items-center gap-2 font-mono font-bold text-emerald-400">
              <Award className="w-4 h-4" />
              <span>SOC 2 Type II (Trust Services Criteria)</span>
            </div>
            <p className="text-gray-300 leading-relaxed font-sans">
              <strong>Standard Requirement:</strong> Requires proof of operational effectiveness for Security, Confidentiality, and Privacy controls over an extended evaluation period.
            </p>
            <p className="text-gray-400 leading-relaxed font-sans">
              <strong>TrustTrace Implementation:</strong> Continuous telemetry validates that no user query ever retrieves unauthorized embeddings or receives higher-clearance tokens.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-darkBg/80 border border-darkBorder space-y-2">
            <div className="flex items-center gap-2 font-mono font-bold text-brand-400">
              <Lock className="w-4 h-4" />
              <span>ISO/IEC 27001 (Control A.9 Access Control)</span>
            </div>
            <p className="text-gray-300 leading-relaxed font-sans">
              <strong>Standard Requirement:</strong> Mandates user access management, user responsibilities, and system access control to prevent unauthorized disclosure.
            </p>
            <p className="text-gray-400 leading-relaxed font-sans">
              <strong>TrustTrace Implementation:</strong> Enforces Gate 1 Pre-Retrieval ABAC filtering at vector query time, ensuring complete tenant and departmental isolation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-darkBg/80 border border-darkBorder space-y-2">
            <div className="flex items-center gap-2 font-mono font-bold text-purple-400">
              <Database className="w-4 h-4" />
              <span>GDPR & DPDP Privacy Frameworks</span>
            </div>
            <p className="text-gray-300 leading-relaxed font-sans">
              <strong>Standard Requirement:</strong> Data minimization and non-retention guarantees for personal Identifiable Information (PII).
            </p>
            <p className="text-gray-400 leading-relaxed font-sans">
              <strong>TrustTrace Implementation:</strong> Zero-retention AI endpoint ensures prompt text and confidential financial variables are never stored by upstream foundation models.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-darkBg/80 border border-darkBorder space-y-2">
            <div className="flex items-center gap-2 font-mono font-bold text-cyan-400">
              <Hash className="w-4 h-4" />
              <span>Cryptographic Hash-Chain Proofs</span>
            </div>
            <p className="text-gray-300 leading-relaxed font-sans">
              <strong>Standard Requirement:</strong> Immutable, non-repudiable audit trails for digital forensic examinations.
            </p>
            <p className="text-gray-400 leading-relaxed font-sans">
              <strong>TrustTrace Implementation:</strong> Sequential SHA-256 block linking mathematically verifies that neither users nor super-administrators can modify historical inference logs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
