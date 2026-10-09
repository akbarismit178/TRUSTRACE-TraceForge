import { z } from 'zod';

export type UserRole = 
  | 'CEO'
  | 'CEO/Admin'
  | 'Management Staff'
  | 'System Administrator'
  | 'VP of Operations'
  | 'Chief Information Security Officer (CISO)'
  | 'Finance Manager'
  | 'Senior Financial Analyst'
  | 'Finance Intern'
  | 'Security Analyst'
  | 'Compliance Auditor'
  | 'Risk & Governance Specialist'
  | 'Lead Systems Architect'
  | 'DevOps & Infrastructure Engineer'
  | 'Data Steward'
  | 'Legal Counsel'
  | 'HR Operations Manager'
  | 'General Staff';

export type ClassificationLevel = 'Public' | 'Confidential' | 'Restricted';

export type DocumentType = 
  | 'report' 
  | 'invoice' 
  | 'expense' 
  | 'contract' 
  | 'payroll' 
  | 'minutes' 
  | 'brochure' 
  | 'honeytoken';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar: string;
  department: string;
  clearanceLevel: ClassificationLevel;
  activeGrants: string[];
  sessionIp: string;
  lastActive: string;
}

export interface DocumentPermission {
  roles: UserRole[];
  users: string[];
  departments: string[];
  expiryDate?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  department: string;
  classification: ClassificationLevel;
  docType: DocumentType;
  ownerName: string;
  fileSize: string;
  pagesCount: number;
  version: string;
  status: 'indexed' | 'processing' | 'error';
  isHoneytoken?: boolean;
  uploadedAt: string;
  permissions: DocumentPermission;
  summary: string;
  fileContent?: string;
  fileUrl?: string;
  revenueValue?: number; // For conflict tracking
}

export interface ChunkItem {
  id: string;
  docId: string;
  docTitle: string;
  page: number;
  content: string;
  classification: ClassificationLevel;
  department: string;
  docType: DocumentType;
  bbox?: { x: number; y: number; w: number; h: number };
  score: number;
  highlightSnippet?: string;
}

export interface ContextManifest {
  queryId: string;
  timestamp: string;
  userRole: UserRole;
  chunkIds: string[];
  manifestHash: string; // SHA-256
  restrictedChunksSentCount: number; // MUST BE 0 FOR ZERO TRUST
  status: 'verified' | 'CRITICAL_VIOLATION';
}

export interface TrustScoreBreakdown {
  evidenceCoverage: number; // weight 0.30
  retrievalConfidence: number; // weight 0.25
  sourceAuthority: number; // weight 0.20
  consistency: number; // weight 0.15
  policyIntegrity: number; // weight 0.10
  penalties: number;
  totalScore: number;
  band: 'Verified' | 'Moderate' | 'Low';
}

export interface QueryResult {
  queryId: string;
  prompt: string;
  user: User;
  answer: string;
  evidenceChunks: ChunkItem[];
  authorizedSourcesCount: number;
  blockedSourcesCount: number;
  restrictedChunksSent: number; // Invariant check: MUST BE 0
  trustScore: TrustScoreBreakdown;
  contextManifest: ContextManifest;
  executionTimeMs: number;
  timestamp: string;
  isBlocked: boolean;
  blockReason?: string;
  securityEventsTriggered: string[];
  hasConflictWarning?: boolean;
  conflictDetails?: string;
}

export interface AuditLogItem {
  id: string;
  stepIndex: number;
  timestamp: string;
  prevHash: string;
  hash: string; // SHA-256 chain
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  resource: string;
  classification: ClassificationLevel;
  decision: 'Allowed' | 'Denied' | 'Warning' | 'Blocked';
  ipAddress: string;
  details: string;
}

export interface SecurityEventItem {
  id: string;
  timestamp: string;
  type: 'Unauthorized Access' | 'Prompt Injection' | 'Permission Denial' | 'Invariant Violation' | 'Honeytoken Triggered' | 'Aggregation Attack';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  userId: string;
  userName: string;
  role: UserRole;
  queryPrompt: string;
  actionTaken: string;
  detectionLayer: string;
  riskScore: number;
  isSimulated?: boolean;
}

export interface ConflictItem {
  id: string;
  metric: string;
  period: string;
  valueA: string;
  sourceADocId: string;
  sourceADocTitle: string;
  sourceAPage: number;
  valueB: string;
  sourceBDocId: string;
  sourceBDocTitle: string;
  sourceBPage: number;
  differencePct: number;
  severity: 'Medium' | 'High';
  likelyCause: string;
  recommendedSourceDocId: string;
  status: 'Unresolved' | 'Resolved' | 'Assigned';
  assignedTo?: string;
  resolutionNotes?: string;
}

export interface AccessRequestItem {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  docId: string;
  docTitle: string;
  classification: ClassificationLevel;
  durationHours: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedAt: string;
  expiresAt: string;
  approvedBy?: string;
}

export interface AttackScenario {
  id: string;
  name: string;
  category: 'direct_injection' | 'role_spoofing' | 'prompt_extraction' | 'encoded_payload' | 'indirect_injection' | 'multi_turn' | 'aggregation_attack';
  payload: string;
  expectedOutcome: 'Blocked' | 'Denied';
  description: string;
  attackVector: string;
  detectionLayer: string;
}

export interface ComplianceReportItem {
  id: string;
  title: string;
  type: 'SOC2' | 'GDPR' | 'DPDP';
  generatedAt: string;
  status: 'Compliant' | 'Review Required';
  totalAuditEntries: number;
  policyViolationsCount: number;
  hashIntegrityVerified: boolean;
}

export interface PolicyRule {
  id: string;
  name: string;
  targetRole: UserRole | 'ALL';
  targetDocType: DocumentType | 'ALL';
  maxClassification: ClassificationLevel;
  allowedDepartments: string[];
  action: 'ALLOW' | 'DENY';
  condition: string;
  isActive: boolean;
}

export interface TraceStep {
  step: number;
  title: string;
  status: 'completed' | 'blocked' | 'bypassed';
  durationMs: number;
  details: string;
  layer: string;
  metrics?: Record<string, string | number>;
}
