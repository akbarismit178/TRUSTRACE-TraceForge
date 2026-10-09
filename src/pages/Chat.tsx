import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { QueryResult, ChunkItem } from '../types';
import { SEED_USERS } from '../engine/seedData';
import { TrustScoreWidget } from '../components/common/TrustScoreWidget';
import { SecurityStrip } from '../components/common/SecurityStrip';
import { ClassificationBadge } from '../components/common/ClassificationBadge';
import { EvidenceModal } from '../components/common/EvidenceModal';
import { exportEvidenceReportPDF } from '../utils/pdfExport';
import { 
  Send, 
  Bot, 
  User as UserIcon, 
  ShieldCheck, 
  FileText, 
  Sparkles, 
  Check, 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  Download, 
  Eye, 
  GitCommit, 
  AlertTriangle,
  History,
  Trash2,
  Lock
} from 'lucide-react';

export const Chat: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, queryHistory, executeQuery, setActiveQueryId, clearUserQueryHistory } = useAppStore();
  const activeUser = currentUser || SEED_USERS[0];
  
  // Filter history strictly for the currently logged in user
  const userHistory = queryHistory.filter(q => q.user?.id === activeUser.id);

  const [prompt, setPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeEvidenceChunk, setActiveEvidenceChunk] = useState<ChunkItem | null>(null);
  const [copiedQueryId, setCopiedQueryId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [userHistory, isStreaming]);

  const suggestedQuestions = [
    { text: 'What was Q2 revenue?', tag: 'Finance Report' },
    { text: 'Show expense report summary.', tag: 'Expenses' },
    { text: 'What is invoice #102 total amount?', tag: 'Invoices' },
    { text: 'What is the CEO salary?', tag: 'Restricted Access Test' },
  ];

  const handleSendPrompt = async (textToSend?: string) => {
    const text = textToSend || prompt;
    if (!text.trim() || isStreaming) return;

    setPrompt('');
    setIsStreaming(true);

    // Execute zero-trust query pipeline
    const result = await executeQuery(text);

    setIsStreaming(false);
    setActiveQueryId(result.queryId);
  };

  const handleCopyAnswer = (text: string, qId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQueryId(qId);
    setTimeout(() => setCopiedQueryId(null), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6 animate-fade-in pb-4">
      {/* History Sidebar */}
      <div className="hidden lg:flex flex-col w-72 bg-darkSurface/80 border border-darkBorder rounded-2xl p-4 glass-card">
        <div className="flex items-center justify-between pb-3 border-b border-darkBorder mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-brand-400" />
            <span className="font-bold text-xs text-gray-200 uppercase font-mono">Trace Memory</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-gray-400 font-bold">{userHistory.length} Saved</span>
            {userHistory.length > 0 && (
              <button
                onClick={clearUserQueryHistory}
                title="Clear my chat history"
                className="p-1 rounded text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {userHistory.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-500 font-mono">
              No recent queries for {activeUser.name.split(' ')[0]}
            </div>
          ) : (
            userHistory.map((q) => (
              <button
                key={q.queryId}
                onClick={() => setActiveQueryId(q.queryId)}
                className="w-full text-left p-2.5 rounded-xl bg-darkCard hover:bg-darkBorder border border-darkBorder transition-all text-xs space-y-1 group"
              >
                <div className="font-semibold text-gray-200 truncate group-hover:text-brand-300">
                  {q.prompt}
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                  <span>{new Date(q.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className={q.isBlocked ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    Score: {q.trustScore.totalScore}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col bg-darkSurface/80 border border-darkBorder rounded-2xl glass-card overflow-hidden">
        {/* Chat Stream Header */}
        <div className="px-6 py-3 border-b border-darkBorder bg-darkCard/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-600/20 text-brand-400 border border-brand-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-100 font-mono flex items-center gap-2">
                TRUSTRACE Zero-Trust Assistant
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Gate 1 & Gate 2 Active
                </span>
              </h2>
              <p className="text-xs text-gray-400">Isolated RAG Session for <strong className="text-white">{activeUser.name}</strong></p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
            <span>Role: <strong className="text-brand-300">{activeUser.role}</strong></span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {userHistory.length === 0 && !isStreaming ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-xl mx-auto space-y-6">
              <div className="p-4 rounded-3xl bg-brand-600/10 border border-brand-500/30 text-brand-400">
                <Sparkles className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-mono">Ask Anything. Trace Every Claim.</h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Logged in as <strong className="text-gray-200">{activeUser.name}</strong> ({activeUser.role}). Your prompts pass through Gate 1 Pre-Retrieval ACLs and Gate 2 Manifest Verification.
                </p>
              </div>

              {/* Suggested Questions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {suggestedQuestions.map((sq, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendPrompt(sq.text)}
                    className="p-3 rounded-xl bg-darkCard border border-darkBorder hover:border-brand-500/50 hover:bg-darkBorder/60 text-left transition-all text-xs group"
                  >
                    <div className="flex items-center justify-between text-[10px] text-brand-400 font-mono mb-1 font-semibold">
                      <span>{sq.tag}</span>
                      <Send className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div className="text-gray-200 font-medium group-hover:text-white">{sq.text}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            userHistory.slice().reverse().map((item) => (
              <div key={item.queryId} className="space-y-4">
                {/* User Prompt Bubble */}
                <div className="flex justify-end">
                  <div className="flex items-start gap-3 max-w-2xl">
                    <div className="p-3.5 rounded-2xl bg-brand-600 text-white text-xs font-medium shadow-glow-sm">
                      {item.prompt}
                    </div>
                    <img
                      src={item.user.avatar}
                      alt={item.user.name}
                      className="w-8 h-8 rounded-xl object-cover ring-2 ring-brand-500/40"
                    />
                  </div>
                </div>

                {/* AI Response Card */}
                <div className="flex items-start gap-3 max-w-4xl">
                  <div className="p-2.5 rounded-xl bg-darkCard border border-darkBorder text-brand-400 flex-shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="p-5 rounded-2xl bg-darkCard/90 border border-darkBorder text-xs text-gray-100 space-y-4 glass-card">
                      {/* Security Invariant Strip */}
                      <SecurityStrip
                        authorizedCount={item.authorizedSourcesCount}
                        blockedCount={item.blockedSourcesCount}
                        restrictedChunksSent={item.restrictedChunksSent}
                      />

                      {/* Conflict Alert Banner if applicable */}
                      {item.hasConflictWarning && (
                        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">Source Conflict Detected</span>
                            <span>{item.conflictDetails}</span>
                          </div>
                        </div>
                      )}

                      {/* Main Answer Text */}
                      <div className="text-sm leading-relaxed whitespace-pre-line text-gray-200 font-sans">
                        {item.answer}
                      </div>

                      {/* Sources Used Chips */}
                      {item.evidenceChunks.length > 0 && (
                        <div className="pt-3 border-t border-darkBorder space-y-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase font-mono tracking-wider block">
                            Cited Evidence Chunks ({item.evidenceChunks.length})
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {item.evidenceChunks.map((chunk) => (
                              <button
                                key={chunk.id}
                                onClick={() => setActiveEvidenceChunk(chunk)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-darkBg border border-darkBorder hover:border-brand-500/40 text-xs text-gray-300 transition-all font-mono group"
                              >
                                <FileText className="w-3.5 h-3.5 text-brand-400" />
                                <span className="truncate max-w-[180px]">{chunk.docTitle}</span>
                                <span className="text-[10px] text-gray-500">p.{chunk.page}</span>
                                <Eye className="w-3 h-3 text-gray-500 group-hover:text-brand-300" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bottom Action Bar */}
                      <div className="pt-3 border-t border-darkBorder flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <TrustScoreWidget trustScore={item.trustScore} size="sm" />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => navigate(`/prove/${item.queryId}`)}
                            className="px-3 py-1.5 rounded-xl bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/40 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Prove Answer
                          </button>

                          <button
                            onClick={() => navigate(`/trace/${item.queryId}`)}
                            className="px-3 py-1.5 rounded-xl bg-accent-purple/20 hover:bg-accent-purple/30 text-purple-300 border border-purple-500/40 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                          >
                            <GitCommit className="w-3.5 h-3.5" />
                            Trust Trace
                          </button>

                          <button
                            onClick={() => exportEvidenceReportPDF(item)}
                            className="p-1.5 rounded-lg hover:bg-darkBorder text-gray-400 hover:text-white transition-colors"
                            title="Export PDF Report"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleCopyAnswer(item.answer, item.queryId)}
                            className="p-1.5 rounded-lg hover:bg-darkBorder text-gray-400 hover:text-white transition-colors"
                            title="Copy Answer"
                          >
                            {copiedQueryId === item.queryId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Streaming Skeleton */}
          {isStreaming && (
            <div className="flex items-start gap-3 max-w-3xl">
              <div className="p-2.5 rounded-xl bg-darkCard border border-darkBorder text-brand-400 animate-pulse">
                <Bot className="w-5 h-5" />
              </div>
              <div className="p-4 rounded-2xl bg-darkCard/80 border border-darkBorder text-xs text-gray-400 space-y-2 w-full animate-pulse">
                <div className="h-4 bg-darkBorder rounded w-1/3" />
                <div className="h-4 bg-darkBorder rounded w-3/4" />
                <div className="h-4 bg-darkBorder rounded w-1/2" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="p-4 border-t border-darkBorder bg-darkCard/40">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask a question... (e.g. 'What was Q2 revenue?' or test restricted boundaries)"
              className="flex-1 px-4 py-3 rounded-xl bg-darkBg border border-darkBorder text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors font-sans"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isStreaming}
              className="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-glow-sm"
            >
              <span>Ask AI</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Evidence Viewer Modal */}
      {activeEvidenceChunk && (
        <EvidenceModal
          chunk={activeEvidenceChunk}
          onClose={() => setActiveEvidenceChunk(null)}
        />
      )}
    </div>
  );
};
