import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { X, Bell, AlertTriangle, Info, Check, Trash2 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const NotificationCenter: React.FC<Props> = ({ onClose }) => {
  const { notifications, markNotificationAsRead, clearAllNotifications } = useAppStore();

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 sm:w-96 bg-darkSurface border-l border-darkBorder shadow-2xl flex flex-col animate-slide-left">
      {/* Header */}
      <div className="p-4 border-b border-darkBorder flex items-center justify-between bg-darkCard/50">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-brand-400" />
          <h3 className="font-bold text-sm text-gray-100">Notifications & Security Alerts</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-darkBorder text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-xs">
            No active notifications
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => markNotificationAsRead(n.id)}
              className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                n.unread 
                  ? 'bg-brand-950/20 border-brand-500/40 text-gray-200' 
                  : 'bg-darkCard border-darkBorder text-gray-400 opacity-80'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {n.severity === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-bold text-gray-200 flex items-center justify-between">
                    <span>{n.title}</span>
                    <span className="text-[10px] font-mono text-gray-500">{n.timestamp}</span>
                  </div>
                  <p className="mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-darkBorder bg-darkCard/30 flex justify-between">
          <button
            onClick={clearAllNotifications}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </button>
          <span className="text-[10px] text-gray-500 font-mono">TRUSTRACE SOC Alerting</span>
        </div>
      )}
    </div>
  );
};
