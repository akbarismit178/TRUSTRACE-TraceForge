import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  LayoutDashboard, 
  MessageSquare, 
  CheckCircle2, 
  GitCommit, 
  ShieldAlert, 
  Zap, 
  FileText, 
  AlertTriangle, 
  FileSearch, 
  Sliders, 
  Key, 
  Users, 
  FileCheck, 
  Award, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Lock,
  X,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { employeeLogin, logoutEmployee } from '../../services/employeeApi';

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<Props> = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const { currentUser, conflicts, securityEvents, setAuthenticatedUser } = useAppStore();
  const isLive = import.meta.env.VITE_API_MODE === 'live';

  const [showAdminGateModal, setShowAdminGateModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminMasterPassword, setAdminMasterPassword] = useState('');
  const [adminGateError, setAdminGateError] = useState('');
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const openAdminGate = () => {
    setAdminGateError('');
    setAdminEmail('');
    setAdminMasterPassword('');
    setShowAdminGateModal(true);
  };

  const handleAdminSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setAdminGateError('');
    if (!isLive) {
      if (['admin', 'SuperAdminMaster2026!', 'password123'].includes(adminMasterPassword.trim())) {
        useAppStore.getState().setCurrentUserByRole('CEO/Admin');
        setShowAdminGateModal(false);
        setAdminMasterPassword('');
        navigate('/admin/users');
      } else {
        setAdminGateError('Incorrect demo master password.');
      }
      return;
    }

    setAdminSubmitting(true);
    try {
      const { user } = await employeeLogin(adminEmail, adminMasterPassword);
      if (user.role !== 'Management Staff') {
        await logoutEmployee();
        throw new Error('This account is not the configured administrator.');
      }
      setAuthenticatedUser(user);
      setShowAdminGateModal(false);
      setAdminMasterPassword('');
      navigate('/admin/users');
    } catch (error) {
      setAdminGateError(error instanceof Error ? error.message : 'Admin login failed.');
    } finally {
      setAdminSubmitting(false);
    }
  };

  const unresolvedConflictsCount = conflicts.filter(c => c.status === 'Unresolved').length;
  const criticalEventsCount = securityEvents.filter(e => e.severity === 'Critical' || e.severity === 'High').length;

  interface NavItemDef {
    label: string;
    path: string;
    icon: any;
    badge?: number | string;
    badgeColor?: string;
  }

  const publicNavItems: NavItemDef[] = [
    { label: 'Company Overview', path: '/', icon: LayoutDashboard },
    { label: 'Public Documents', path: '/documents', icon: FileText },
  ];

  const employeeNavItems: NavItemDef[] = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'AI Chat', path: '/chat', icon: MessageSquare },
    { label: 'Security Center', path: '/security', icon: ShieldAlert, badge: criticalEventsCount > 0 ? criticalEventsCount : undefined, badgeColor: 'bg-rose-500' },
    { label: 'Attack Simulator', path: '/simulator', icon: Zap },
    { label: 'Document Mgmt', path: '/documents', icon: FileText },
    { label: 'Conflict Detection', path: '/conflicts', icon: AlertTriangle, badge: unresolvedConflictsCount > 0 ? unresolvedConflictsCount : undefined, badgeColor: 'bg-amber-500' },
    { label: 'Policy Studio', path: '/policies', icon: Sliders },
    { label: 'Access Requests', path: '/requests', icon: Key },
    { label: 'Compliance', path: '/compliance', icon: FileCheck },
    { label: 'Quality Lab', path: '/quality', icon: Award },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const isAdminRole = currentUser?.role === 'Management Staff' || 
                      currentUser?.role === 'System Administrator' || 
                      currentUser?.role === 'CEO' || 
                      currentUser?.role === 'CEO/Admin';

  if (isAdminRole) {
    employeeNavItems.splice(8, 0, { label: 'User Admin Panel', path: '/admin/users', icon: Users, badge: 'ADMIN', badgeColor: 'bg-rose-600' });
  }

  const navItems = currentUser ? employeeNavItems : publicNavItems;

  return (
    <>
      <aside className={`fixed left-0 top-0 bottom-0 z-30 bg-darkSurface border-r border-darkBorder flex flex-col transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-darkBorder flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 rounded-xl bg-brand-600/20 text-brand-400 border border-brand-500/30 flex-shrink-0">
            <Shield className="w-5 h-5 text-brand-500" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-wider text-white font-mono flex items-center gap-1.5">
                TRUSTRACE
              </span>
              <span className="text-[10px] text-brand-400 font-semibold uppercase tracking-widest">Ask. Trace. Verify.</span>
            </div>
          )}
        </div>

        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-darkBorder text-gray-400 hover:text-white transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role Clearance Pill */}
      {!collapsed && (
        <div className="mx-3 my-3 p-2.5 rounded-xl bg-darkCard border border-darkBorder text-xs">
          <span className="text-[10px] text-gray-400 font-semibold block uppercase">Current Active Scope</span>
          {currentUser ? (
            <>
              <div className="font-bold text-gray-200 mt-0.5 truncate">{currentUser.name}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] font-mono text-brand-400 font-semibold">{currentUser.role}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  currentUser.clearanceLevel === 'Restricted' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {currentUser.clearanceLevel}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="font-bold text-emerald-400 mt-0.5 truncate">Public Visitor Mode</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] font-mono text-gray-400">Public Docs Only</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300">
                  PUBLIC
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative
                ${isActive 
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/40 font-semibold shadow-glow-sm' 
                  : 'text-gray-400 hover:bg-darkCard hover:text-gray-200'}
              `}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0 group-hover:text-brand-400 transition-colors" />
              {!collapsed && <span className="truncate flex-1">{item.label}</span>}
              {!collapsed && item.badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono text-white ${item.badgeColor || 'bg-brand-500'}`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Separate admin entry point, available even to public visitors. */}
      <div className="p-3 border-t border-darkBorder bg-darkBg/60 text-[11px]">
        <button
          type="button"
          onClick={openAdminGate}
          className={`w-full flex items-center gap-2 rounded-lg px-2 py-2 text-brand-300 hover:bg-darkCard hover:text-white font-semibold ${collapsed ? 'justify-center' : ''}`}
          title="Admin Login"
          aria-label="Admin Login"
        >
          <Lock className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Admin Login</span>}
        </button>
      </div>
    </aside>

    {/* Admin sign-in stays separate from the employee portal. */}
    {showAdminGateModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
        <div className="w-full max-w-md rounded-3xl bg-darkSurface border border-darkBorder shadow-2xl p-6 space-y-5 glass-card">
          <div className="flex items-center justify-between pb-3 border-b border-darkBorder">
            <div className="flex items-center gap-2 text-rose-400">
              <KeyRound className="w-5 h-5" />
              <h3 className="text-sm font-bold font-mono tracking-wider text-white">
                {isLive ? 'ADMIN SIGN IN' : 'SUPER ADMIN MASTER GATEWAY'}
              </h3>
            </div>
            <button 
              onClick={() => setShowAdminGateModal(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            {isLive
              ? 'Enter your configured admin email and admin password to manage employee invitations.'
              : 'Enter the demo master password to open the demo admin panel.'}
          </p>

          {adminGateError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
              ⚠️ {adminGateError}
            </div>
          )}

          <form onSubmit={handleAdminSignIn} className="space-y-4 font-mono text-xs">
            {isLive && (
              <div>
                <label htmlFor="admin-email" className="block text-gray-300 mb-1.5 font-semibold">Admin email</label>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="Email configured as ADMIN_EMAIL"
                  className="w-full px-4 py-3 rounded-xl bg-darkBg border border-darkBorder text-gray-100 focus:outline-none focus:border-brand-500"
                  autoFocus
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-gray-300 mb-1.5 font-semibold">
                {isLive ? 'Admin password' : 'Demo master password'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  autoComplete="current-password"
                  value={adminMasterPassword}
                  onChange={(e) => setAdminMasterPassword(e.target.value)}
                  placeholder={isLive ? 'Enter the password you set in PowerShell' : 'Enter demo master password'}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-darkBg border border-darkBorder text-gray-100 focus:outline-none focus:border-brand-500"
                  autoFocus
                  required
                />
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdminGateModal(false)}
                className="px-4 py-2.5 rounded-xl bg-darkBorder text-gray-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adminSubmitting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{adminSubmitting ? 'Signing in...' : 'Unlock Admin Control Panel'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
};
