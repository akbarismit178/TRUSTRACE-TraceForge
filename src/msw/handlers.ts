import { http, HttpResponse } from 'msw';
import { useAppStore } from '../store/useAppStore';
import { SEED_DOCUMENTS, SEED_USERS } from '../engine/seedData';

export const handlers = [
  // Authentication / Me endpoint
  http.get('/api/v1/auth/me', () => {
    const user = useAppStore.getState().currentUser;
    return HttpResponse.json({ success: true, user });
  }),

  // Chat query endpoint
  http.post('/api/v1/chat/query', async ({ request }) => {
    const body = await request.json() as { prompt: string };
    const result = useAppStore.getState().executeQuery(body.prompt);
    return HttpResponse.json({ success: true, result });
  }),

  // Dashboard summary endpoint
  http.get('/api/v1/dashboard/summary', () => {
    const store = useAppStore.getState();
    return HttpResponse.json({
      success: true,
      data: {
        totalDocuments: store.documents.length,
        totalUsers: SEED_USERS.length,
        questionsAsked: store.queryHistory.length + 142,
        securityEvents: store.securityEvents.length,
        trustScoreAverage: 96.4,
        restrictedChunksSentToLLM: 0,
      }
    });
  }),

  // Security summary endpoint
  http.get('/api/v1/security/summary', () => {
    const store = useAppStore.getState();
    return HttpResponse.json({
      success: true,
      events: store.securityEvents,
      auditLogs: store.auditLogs,
    });
  }),

  // Documents list
  http.get('/api/v1/documents', () => {
    const store = useAppStore.getState();
    return HttpResponse.json({ success: true, documents: store.documents });
  }),

  // Conflicts list
  http.get('/api/v1/conflicts', () => {
    const store = useAppStore.getState();
    return HttpResponse.json({ success: true, conflicts: store.conflicts });
  }),

  // Policies list
  http.get('/api/v1/policies', () => {
    const store = useAppStore.getState();
    return HttpResponse.json({ success: true, policies: store.policies });
  }),
];
