import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { logoutEmployee } from '../../services/employeeApi';
import { SEED_USERS } from '../../engine/seedData';
import { UserRole } from '../../types';
import { 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  ShieldCheck, 
  ChevronDown, 
  LogOut, 
  UserCheck, 
  Terminal,
  AlertTriangle,
  Lock,
  LogIn,
  Globe
} from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { CommandPalette } from './CommandPalette';

interface Props {
  sidebarCollapsed: boolean;
}

export const Navbar: React.FC<Props> = ({ sidebarCollapsed }) => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, theme, toggleTheme, notifications, logout } = useAppStore();
  const deliveryMode = import.meta.env.VITE_API_MODE === 'live' ? 'live' : 'mock';
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifCenter, setShowNotifCenter] = useState(false);
  const [showCmdPalette, setShowCmdPalette] = useState(false);

  const unreadCount = notifications.filter(n => n.unread).length;
  const user = currentUser || SEED_USERS[0];

  return (
    <>
      <header className={`fixed top-0 right-0 z-20 h-16 bg-darkSurface/90 backdrop-blur-xl border-b border-darkBorder flex items-center justify-between px-6 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16 left-16' : 'left-64'
      }`}>
        {/* Left: Quick Search / Ctrl+K */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCmdPalette(true)}
            className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-darkCard border border-darkBorder text-gray-400 hover:text-gray-200 text-xs w-64 md:w-80 transition-all hover:border-brand-500/40"
          >
            <Search className="w-4 h-4 text-brand-400" />
            <span className="flex-1 text-left">Search docs, security events, or prompt...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-darkBg text-[10px] font-mono text-gray-400 border border-darkBorder">
              Ctrl+K
            </kbd>
          </button>

          {/* Zero-Trust Invariant Live Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Restricted Chunks Sent: <strong className="text-white">0</strong></span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
              deliveryMode === 'mock'
                ? 'bg-brand-500/10 text-brand-400 border-brand-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
            title="Delivery mode is set by VITE_API_MODE; restart Vite to change it"
          >
            API: {deliveryMode.toUpperCase()}
          </span>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-darkCard border border-darkBorder text-gray-400 hover:text-white transition-colors"
            title="Toggle Dark/Light Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand-400" />}
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotifCenter(!showNotifCenter)}
              className="p-2 rounded-xl bg-darkCard border border-darkBorder text-gray-400 hover:text-white transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Role Picker / Profile Menu or Sign In Button */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-darkCard border border-darkBorder hover:border-brand-500/40 transition-all text-xs"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 rounded-lg object-cover ring-2 ring-brand-500/40"
                />
                <div className="text-left hidden md:block">
                  <div className="font-bold text-gray-200 leading-tight">{user.name}</div>
                  <div className="text-[10px] text-brand-400 font-mono font-medium">{user.role}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {/* User Profile Card Dropdown */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 p-3 rounded-2xl bg-darkCard border border-darkBorder shadow-2xl z-50 animate-fade-in glass-card space-y-3">
                  <div className="p-3 rounded-xl bg-darkSurface border border-darkBorder">
                    <div className="flex items-center gap-3 mb-2">
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-brand-500/40 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-100 truncate">{user.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono truncate">{user.email}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 pt-2 border-t border-darkBorder/60 text-[10px] font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Enterprise Role:</span>
                        <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-bold">{user.role}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Clearance Level:</span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">{user.clearanceLevel}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Department:</span>
                        <span className="text-gray-200">{user.department}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Session IP:</span>
                        <span className="text-gray-300">{user.sessionIp || '192.168.1.108'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sign Out Button */}
                  <button
                    onClick={async () => {
                      if (import.meta.env.VITE_API_MODE === 'live') {
                        try { await logoutEmployee(); } catch { /* Clear the browser state even if offline. */ }
                      }
                      logout();
                      setShowRoleMenu(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold transition-colors shadow-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out Session</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-brand-600/30"
            >
              <LogIn className="w-4 h-4" />
              <span>Employee Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Notification Center Drawer */}
      {showNotifCenter && <NotificationCenter onClose={() => setShowNotifCenter(false)} />}

      {/* Command Palette Modal */}
      {showCmdPalette && <CommandPalette onClose={() => setShowCmdPalette(false)} />}
    </>
  );
};
