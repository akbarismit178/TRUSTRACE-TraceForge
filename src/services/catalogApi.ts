import type { DocumentItem } from '../types';

const base = import.meta.env.DEV ? '/api/v1' : (import.meta.env.VITE_API_URL || '/api/v1');

export type CatalogResult = { documents: DocumentItem[]; totalDocuments?: number };

async function json<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
  } catch {
    throw new Error('Cannot reach document service. Check that FastAPI is running on port 8000.');
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof body.detail === 'string' ? body.detail : `Document request failed (${response.status}).`);
  return body as T;
}

export function listCatalog(): Promise<CatalogResult> {
  return json<CatalogResult>('/catalog/documents');
}

export function saveDocumentPermissions(id: string, permissions: DocumentItem['permissions']): Promise<{ document: DocumentItem }> {
  return json<{ document: DocumentItem }>(`/catalog/documents/${encodeURIComponent(id)}/permissions`, {
    method: 'PATCH', body: JSON.stringify({ permissions }),
  });
}

export function openCatalogPdf(id: string): void {
  window.open(`${base}/catalog/documents/${encodeURIComponent(id)}/pdf`, '_blank', 'noopener,noreferrer');
}

export function uploadCatalogDocument(file: File, metadata: any): Promise<{ success: boolean; document: DocumentItem }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify(metadata));
  
  return fetch(`${base}/catalog/documents/upload`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  }).then(async res => {
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(typeof body.detail === 'string' ? body.detail : `Upload failed (${res.status})`);
    return body;
  });
}

export function deleteCatalogDocument(id: string): Promise<{ success: boolean; message: string }> {
  return json<{ success: boolean; message: string }>(`/catalog/documents/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}


