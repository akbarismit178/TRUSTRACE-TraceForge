import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  Key, 
  Mail, 
  ShieldAlert, 
  Eye, 
  EyeOff,
  Building2,
  ArrowLeft
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { changeEmployeePassword, employeeLogin, logoutEmployee } from '../services/employeeApi';
import type { User } from '../types';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, setAuthenticatedUser } = useAppStore();
  const isLive = import.meta.env.VITE_API_MODE === 'live';
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInError, setSignInError] = useState('');
  const [signInSuccess, setSignInSuccess] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');
    setSignInSuccess('');
    setSubmitting(true);
    try {
      if (isLive) {
        const { user, mustChangePassword } = await employeeLogin(signInEmail, signInPassword);
        if (user.role === 'Management Staff') {
          await logoutEmployee();
          throw new Error('Admin account: use Admin Login at the bottom-left of the Company Overview page.');
        }
        if (mustChangePassword) {
          setPendingUser(user);
          setSignInPassword('');
          setSignInSuccess('Set a new password to activate your account.');
        } else {
          setAuthenticatedUser(user);
          navigate('/');
        }
      } else {
        const res = login(signInEmail, signInPassword);
        if (!res.success) throw new Error(res.message);
        navigate('/');
      }
    } catch (error) {
      setSignInError(error instanceof Error ? error.message : 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;
    setSignInError('');
    setSubmitting(true);
    try {
      await changeEmployeePassword(newPassword);
      setAuthenticatedUser(pendingUser);
      setPendingUser(null);
      setNewPassword('');
      navigate('/');
    } catch (error) {
      setSignInError(error instanceof Error ? error.message : 'Could not change password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-gray-100 flex flex-col justify-center items-center p-4 md:p-8 relative overflow-hidden cyber-grid-bg font-sans">
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Bar */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="px-3.5 py-1.5 rounded-xl bg-darkCard border border-darkBorder text-gray-300 hover:text-white text-xs font-mono flex items-center gap-2 transition-all hover:border-brand-500/40"
        >
          <ArrowLeft className="w-4 h-4 text-brand-400" />
          <span>Back to Company Overview</span>
        </button>

        <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Employee Portal Security Active
        </div>
      </div>

      {/* Header */}
      <div className="text-center max-w-xl mb-8 z-10 space-y-3 pt-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-darkSurface border border-darkBorder text-brand-400 text-xs font-mono font-bold shadow-md">
          <Building2 className="w-4 h-4 text-brand-500" />
          EMPLOYEE ACCESS PORTAL
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-white font-mono">
          TRUSTRACE
        </h1>
        <p className="text-base text-brand-400 font-semibold tracking-wider font-mono">
          Enterprise Employee Sign In
        </p>

        <p className="text-xs text-gray-400 leading-relaxed max-w-md mx-auto">
          Enter the Username (Email) & Password sent to your inbox by HR/Admin upon employment selection.
        </p>
      </div>

      {/* Main Sign In Card */}
      <div className="w-full max-w-md p-8 rounded-3xl bg-darkCard/90 border border-darkBorder backdrop-blur-2xl shadow-2xl z-10 glass-card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <Lock className="w-5 h-5 text-brand-400" />
            Employee Sign In
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20 font-bold">
            PROVISIONED ACCESS
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-6">Enter your assigned enterprise credentials to log in.</p>

        {signInError && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-mono">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{signInError}</span>
          </div>
        )}

        {signInSuccess && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{signInSuccess}</span>
          </div>
        )}

        {pendingUser ? (
          <form onSubmit={handleChangePassword} className="space-y-4 font-mono text-xs">
            <label className="block text-gray-300 font-semibold" htmlFor="new-password">Choose a new password (at least 12 characters)</label>
            <input
              id="new-password" type="password" minLength={12} required autoComplete="new-password"
              value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-darkBg border border-darkBorder text-gray-100"
            />
            <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold disabled:opacity-50">
              {submitting ? 'Saving...' : 'Set Password & Sign In'}
            </button>
          </form>
        ) : <form onSubmit={handleSignIn} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-gray-300 mb-1.5 font-semibold">
              Employee Email / Username
            </label>
            <div className="relative">
              <input
                type="email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                placeholder="Enter email received from Admin (e.g. rahul.s@acme-corp.com)"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-darkBg border border-darkBorder text-gray-100 focus:outline-none focus:border-brand-500 transition-colors"
                required
              />
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-1.5 font-semibold">
              Password
            </label>
            <div className="relative">
              <input
                type={showSignInPassword ? 'text' : 'password'}
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                placeholder="Enter assigned password"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-darkBg border border-darkBorder text-gray-100 focus:outline-none focus:border-brand-500 transition-colors"
                required
              />
              <Key className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowSignInPassword(!showSignInPassword)}
                className="absolute right-3.5 top-3.5 text-gray-500 hover:text-gray-300"
              >
                {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-brand-600 disabled:opacity-50 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-600/30 mt-6 group font-mono"
          >
            <span>{submitting ? 'Signing in...' : 'Sign In & Unlock Scope'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>}

        <div className="mt-6 pt-4 border-t border-darkBorder text-center space-y-3">
          <p className="text-[11px] text-gray-400">
            Note: Employee self-registration is disabled. New employees are provisioned by Company Admin upon hiring selection.
          </p>

          {/* Demo credentials must never be offered for server authentication. */}
          {!isLive && <button
            type="button"
            onClick={() => {
              setSignInEmail('admin@acme-corp.com');
              setSignInPassword('admin');
            }}
            className="text-[10px] font-mono text-brand-400 hover:text-brand-300 underline font-semibold cursor-pointer"
          >
            ⚡ Auto-fill Super Admin Credentials (admin / admin)
          </button>}
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-gray-500 font-mono">
        Acme Corp Zero-Trust Access Gateway • Authenticated User Token Enforced
      </div>
    </div>
  );
};
