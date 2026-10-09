import type { DocumentItem, User } from '../types';
import { evaluateChunkAccess } from '../engine/policyEngine';

export function isDocumentAdmin(user: User | null): boolean {
  return user !== null && ['Management Staff', 'System Administrator', 'CEO/Admin'].includes(user.role);
}

/** Use the same access decision for document list, count, and preview. Never list canaries. */
export function canReadDocument(user: User | null, doc: DocumentItem): boolean {
  if (doc.isHoneytoken || doc.docType === 'honeytoken') return false;
  if (doc.classification === 'Public') return true;
  if (!user) return false;
  if (isDocumentAdmin(user)) return true;
  return evaluateChunkAccess(user, doc).allowed;
}
