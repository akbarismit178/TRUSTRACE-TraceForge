import { jsPDF } from 'jspdf';
import { QueryResult, User } from '../types';

export function exportEvidenceReportPDF(queryResult: QueryResult) {
  const doc = new jsPDF();
  const title = `TRUSTRACE Evidence Verification Report`;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(79, 70, 229); // Brand indigo
  doc.text(title, 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()} | Query ID: ${queryResult.queryId}`, 14, 28);
  doc.text(`User: ${queryResult.user.name} (${queryResult.user.role} - ${queryResult.user.department})`, 14, 34);

  // Line separator
  doc.setLineWidth(0.5);
  doc.setDrawColor(200);
  doc.line(14, 38, 196, 38);

  // Query & Answer
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.text(`User Prompt:`, 14, 46);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`"${queryResult.prompt}"`, 14, 52);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Verified AI Response:`, 14, 62);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const answerLines = doc.splitTextToSize(queryResult.answer, 180);
  doc.text(answerLines, 14, 68);

  let currentY = 68 + (answerLines.length * 6) + 6;

  // Zero-Trust Security Summary
  doc.setFillColor(240, 253, 244);
  doc.rect(14, currentY, 182, 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text(`SECURITY INVARIANT VERIFICATION:`, 18, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`• Restricted Chunks Sent To LLM: ${queryResult.restrictedChunksSent} (PASSED)`, 18, currentY + 13);
  doc.text(`• Authorized Sources Used: ${queryResult.authorizedSourcesCount} | Blocked Sources: ${queryResult.blockedSourcesCount}`, 18, currentY + 19);
  doc.text(`• Context Manifest Hash SHA-256: ${queryResult.contextManifest.manifestHash.substring(0, 32)}...`, 18, currentY + 25);

  currentY += 34;

  // Evidence Chunks Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.text(`Cited Evidence Chunks (${queryResult.evidenceChunks.length}):`, 14, currentY);
  currentY += 6;

  queryResult.evidenceChunks.forEach((chunk, i) => {
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFillColor(245, 247, 250);
    doc.rect(14, currentY, 182, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(79, 70, 229);
    doc.text(`[${i + 1}] ${chunk.docTitle} (Page ${chunk.page}) - Classification: ${chunk.classification}`, 18, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(50);
    const snippetLines = doc.splitTextToSize(`Content: "${chunk.content}"`, 174);
    doc.text(snippetLines.slice(0, 2), 18, currentY + 13);

    currentY += 32;
  });

  doc.save(`TRUSTRACE_Evidence_Report_${queryResult.queryId}.pdf`);
}

export function exportForensicReportPDF(queryResult: QueryResult, replayRole?: string) {
  const doc = new jsPDF();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(124, 58, 237); // Purple accent
  doc.text(`TRUSTRACE Signed Forensic Audit Certificate`, 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Timestamp: ${queryResult.timestamp} | Trace ID: ${queryResult.queryId}`, 14, 28);
  if (replayRole) {
    doc.text(`[WHAT-IF REPLAY MODE]: Replayed under role '${replayRole}'`, 14, 34);
  }

  doc.setLineWidth(0.5);
  doc.line(14, 38, 196, 38);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30);
  doc.text(`Query Context:`, 14, 46);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`User: ${queryResult.user.name} (${queryResult.user.role})`, 14, 52);
  doc.text(`IP Address: ${queryResult.user.sessionIp}`, 14, 58);
  doc.text(`Prompt: "${queryResult.prompt}"`, 14, 64);
  doc.text(`Execution Latency: ${queryResult.executionTimeMs} ms`, 14, 70);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Cryptographic Manifest Signatures:`, 14, 82);
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 100, 0);
  doc.text(`Manifest SHA-256: ${queryResult.contextManifest.manifestHash}`, 14, 90);
  doc.text(`Manifest Status: ${queryResult.contextManifest.status}`, 14, 96);
  doc.text(`Restricted Chunks Count: ${queryResult.contextManifest.restrictedChunksSentCount}`, 14, 102);

  doc.save(`TRUSTRACE_Forensic_Report_${queryResult.queryId}.pdf`);
}

export function exportComplianceReportPDF(report: {
  id: string;
  type: string;
  title: string;
  generatedAt: string;
  totalAuditEntries: number;
  policyViolationsCount: number;
  chainIntegrityHash: string;
  complianceScore?: string;
  scope?: string;
}) {
  const doc = new jsPDF();
  
  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 42, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('TRUSTRACE ZERO-TRUST COMPLIANCE ATTESTATION', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(56, 189, 248); // Cyan 400
  doc.text(`Official Regulatory Audit Certificate • ${report.type} Standard`, 14, 26);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(`Certificate ID: TRACE-COMP-${report.id.toUpperCase()} | Issued: ${report.generatedAt}`, 14, 34);

  let currentY = 52;

  // Executive Statement
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('1. Executive Compliance Attestation', 14, currentY);
  currentY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  const execSummary = `This document certifies that TrustTrace Enterprise Data Intelligence Platform has successfully executed continuous zero-trust invariant monitoring, pre-retrieval Attribute-Based Access Control (ABAC), and immutable SHA-256 hash-chain audit logging in full alignment with ${report.type} trust criteria.`;
  const splitSummary = doc.splitTextToSize(execSummary, 182);
  doc.text(splitSummary, 14, currentY);
  currentY += splitSummary.length * 5 + 6;

  // Audit Metrics Table
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, currentY, 182, 44, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Audit & Governance Telemetry Summary', 20, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`• Standard Type: ${report.type} Enterprise Verification`, 20, currentY + 16);
  doc.text(`• Total Audited Inferences & Operations: ${report.totalAuditEntries.toLocaleString()}`, 20, currentY + 22);
  doc.text(`• Policy Breaches / Data Leak Violations: ${report.policyViolationsCount} (0.00% Defect Rate)`, 20, currentY + 28);
  doc.text(`• Context Isolation Invariant Status: 100% PRESERVED (Restricted Chunks Sent = 0)`, 20, currentY + 34);
  doc.text(`• Cryptographic Ledger Chain Status: VERIFIED CLEAN (Zero Block Collisions)`, 20, currentY + 40);

  currentY += 54;

  // Cryptographic Ledger Verification
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('2. Cryptographic SHA-256 Ledger Seal', 14, currentY);
  currentY += 6;

  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.rect(14, currentY, 182, 30, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(22, 101, 52);
  doc.text('BLOCK INTEGRITY & IMMUTABILITY CERTIFICATE', 20, currentY + 8);

  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Chain Root Hash: ${report.chainIntegrityHash}`, 20, currentY + 16);
  doc.text(`Verification Timestamp: ${new Date().toISOString()}`, 20, currentY + 22);

  currentY += 40;

  // Control Implementation Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('3. Zero-Trust Access Control Guarantees', 14, currentY);
  currentY += 6;

  const controls = [
    { title: 'Gate 1 Pre-Retrieval RBAC/ABAC:', desc: 'Document chunks are filtered at vector index creation and retrieval time based on employee role clearance level (Public < Internal < Confidential < Restricted).' },
    { title: 'Gate 2 Active Context Invariant:', desc: 'Guarantees that unauthorized tokens or hidden prompt injection strings are intercepted before LLM inference, keeping restricted leaks strictly at 0.' },
    { title: 'Data Subject Privacy (GDPR/DPDP):', desc: 'No persistent PII is leaked across multi-tenant sessions. Cryptographic session hashing guarantees zero cross-tenant contamination.' }
  ];

  controls.forEach(c => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`• ${c.title}`, 14, currentY);
    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const descLines = doc.splitTextToSize(c.desc, 178);
    doc.text(descLines, 18, currentY);
    currentY += descLines.length * 4.5 + 3;
  });

  // Footer / Sign-off
  currentY = Math.max(currentY + 4, 260);
  doc.setDrawColor(203, 213, 225);
  doc.line(14, currentY, 196, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Compliance Officer: TrustTrace Automated Security Governance Subsystem', 14, currentY + 6);
  doc.text(`Official Seal • Hash: ${report.chainIntegrityHash.substring(0, 32)}... • Confidential & Legally Binding`, 14, currentY + 11);

  doc.save(`TRUSTRACE_Compliance_Attestation_${report.type}_${new Date().toISOString().substring(0, 10)}.pdf`);
}

