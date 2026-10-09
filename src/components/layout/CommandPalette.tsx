import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Terminal, FileText, ShieldAlert, Zap, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  onClose: () => void;
}

export const CommandPalette: React.FC<Props> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const executeQuery = useAppStore(state => state.executeQuery);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const quickPrompts = [
    { label: 'What was Q2 revenue?', prompt: 'What was Q2 revenue?' },
    { label: 'Show expense report summary.', prompt: 'Show expense report summary.' },
    { label: 'What is invoice #102 total amount?', prompt: 'What is invoice #102 total amount?' },
    { label: 'What is the CEO salary?', prompt: 'What is the CEO salary?' },
  ];

  const pages = [
    { name: 'Dashboard', path: '/', icon: FileText },
    { name: 'AI Chat', path: '/chat', icon: Terminal },
    { name: 'Security Center', path: '/security', icon: ShieldAlert },
    { name: 'Attack Simulator', path: '/simulator', icon: Zap },
    { name: 'Document Management', path: '/documents', icon: FileText },
    { name: 'Conflict Detection', path: '/conflicts', icon: ShieldAlert },
  ];

  const handleRunPrompt = async (p: string) => {
    await executeQuery(p);
    navigate('/chat');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-2xl bg-darkSurface border border-darkBorder shadow-2xl overflow-hidden glass-card">
        {/* Search Bar */}
        <div className="p-4 border-b border-darkBorder flex items-center gap-3 bg-darkCard/50">
          <Search className="w-5 h-5 text-brand-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, query, or jump to page..."
            className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none font-sans"
            autoFocus
          />
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="p-4 space-y-4 max-h-96 overflow-y-auto text-xs">
          {/* Suggested Zero-Trust Prompts */}
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2 font-mono">
              Suggested Zero-Trust Queries
            </span>
            <div className="space-y-1">
              {quickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRunPrompt(item.prompt)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-brand-600/20 hover:text-brand-300 text-gray-300 flex items-center gap-2.5 transition-colors font-mono"
                >
                  <Terminal className="w-4 h-4 text-brand-400" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Page Navigation */}
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2 font-mono">
              Jump to Page
            </span>
            <div className="grid grid-cols-2 gap-2">
              {pages.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      navigate(p.path);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-darkCard hover:bg-darkBorder text-gray-300 flex items-center gap-2 transition-colors text-left"
                  >
                    <Icon className="w-4 h-4 text-gray-400" />
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-darkBorder bg-darkBg/60 text-[11px] text-gray-500 flex justify-between font-mono">
          <span>Press ESC to exit</span>
          <span>TRUSTRACE Quick Actions</span>
        </div>
      </div>
    </div>
  );
};
