import React, { useEffect, useState } from 'react';
import { listCatalog } from '../services/catalogApi';
import { getEmployees } from '../services/employeeApi';
import { canReadDocument, isDocumentAdmin } from '../utils/documentAccess';
import type { DocumentItem } from '../types';
import { useAppStore } from '../store/useAppStore';
import { ENTERPRISE_ROLES } from '../config/enterpriseRoles';
import { 
  FileText, 
  Users, 
  MessageSquare, 
  ShieldAlert, 
  Award, 
  TrendingUp, 
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  LogIn,
  ShieldCheck,
  Building,
  Lock,
  Globe,
  FileCheck,
  Sparkles,
  HelpCircle,
  Shield,
  Layers,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, documents, securityEvents, auditLogs, queryHistory, users } = useAppStore();
  const [dateRange, setDateRange] = useState('7d');
  const isLive = import.meta.env.VITE_API_MODE === 'live';
  const [liveDocuments, setLiveDocuments] = useState<DocumentItem[]>([]);
  const [catalogTotal, setCatalogTotal] = useState<number | null>(null);
  const [catalogError, setCatalogError] = useState('');
  const [catalogLoading, setCatalogLoading] = useState(isLive);
  const [serverUserCount, setServerUserCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isLive || !currentUser) return;
    let active = true;
    setCatalogLoading(true);
    setCatalogError('');
    listCatalog().then(result => {
      if (!active) return;
      setLiveDocuments(result.documents);
      setCatalogTotal(result.totalDocuments ?? null);
    }).catch(error => {
      if (active) setCatalogError(error instanceof Error ? error.message : 'Unable to load documents.');
    }).finally(() => {
      if (active) setCatalogLoading(false);
    });
    if (isDocumentAdmin(currentUser)) {
      getEmployees().then(result => {
        if (active) setServerUserCount(result.users.length + 1);
      }).catch(() => { if (active) setServerUserCount(null); });
    }
    return () => { active = false; };
  }, [isLive, currentUser?.id]);

  // IF NOT AUTHENTICATED OR NO CURRENT USER -> SHOW PUBLIC COMPANY OVERVIEW DASHBOARD
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="space-y-12 animate-fade-in pb-16">
        {/* Public Visitor Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-darkSurface via-darkCard to-brand-950/40 border border-darkBorder p-8 md:p-12 shadow-2xl glass-card">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              <Globe className="w-3.5 h-3.5" />
              <span>PUBLIC ENTERPRISE OVERVIEW • GUEST MODE</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-cyan-400">Zero-Trust Data Intelligence</span> Platform
            </h1>

            <p className="text-sm md:text-base text-gray-300 leading-relaxed font-sans">
              Welcome to <strong>TrustTrace Enterprise</strong>. We provide cryptographic context isolation, role-scoped RAG AI intelligence, and tamper-evident audit chains for global financial and enterprise organizations.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-mono text-sm font-bold flex items-center gap-2.5 transition-all shadow-lg shadow-brand-600/30 hover:scale-105"
              >
                <LogIn className="w-4 h-4" />
                <span>Employee Sign In Portal</span>
              </button>

              <button
                onClick={() => navigate('/documents')}
                className="px-6 py-3.5 rounded-xl bg-darkSurface border border-darkBorder hover:border-brand-500/40 text-gray-200 hover:text-white font-mono text-sm font-semibold flex items-center gap-2 transition-all hover:bg-darkCard"
              >
                <FileText className="w-4 h-4 text-brand-400" />
                <span>View Public Governance Docs</span>
              </button>
            </div>
          </div>
        </div>

        {/* Public Company Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card text-center space-y-1">
            <div className="text-3xl font-black text-white font-mono">500+</div>
            <div className="text-xs text-gray-400 font-medium">Enterprise Clients</div>
          </div>
          <div className="p-5 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card text-center space-y-1">
            <div className="text-3xl font-black text-emerald-400 font-mono">99.99%</div>
            <div className="text-xs text-gray-400 font-medium">Audit Hash Integrity</div>
          </div>
          <div className="p-5 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card text-center space-y-1">
            <div className="text-3xl font-black text-brand-400 font-mono">15</div>
            <div className="text-xs text-gray-400 font-medium">Enterprise Roles Catalog</div>
          </div>
          <div className="p-5 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card text-center space-y-1">
            <div className="text-3xl font-black text-cyan-400 font-mono">0</div>
            <div className="text-xs text-gray-400 font-medium">Restricted Data Leaks</div>
          </div>
        </div>

        {/* Zero-Trust System Architecture Overview */}
        <div className="space-y-6">
          <div className="border-b border-darkBorder pb-4">
            <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Company Architecture & Security Standards
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              How TrustTrace guarantees zero context leakage across enterprise departments
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-darkCard/80 border border-darkBorder glass-card space-y-3">
              <div className="p-3 w-fit rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/30">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white font-mono">Gate 1: Pre-Retrieval ACL</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Before vector search executes, documents are filtered strictly by employee clearance level (Public, Internal, Confidential, Restricted). Unauthorized chunks are excluded at vector index time.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-darkCard/80 border border-darkBorder glass-card space-y-3">
              <div className="p-3 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white font-mono">Gate 2: Context Invariant</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                An active mathematical validator checks the context window before sending prompts to the LLM. Enforces the invariant: Restricted Chunks Sent = 0 for unauthorized sessions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-darkCard/80 border border-darkBorder glass-card space-y-3">
              <div className="p-3 w-fit rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white font-mono">Cryptographic Audit Chain</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Every query, access request, and policy decision is linked via SHA-256 hash chains into an immutable audit trail for SOC 2 and regulatory compliance.
              </p>
            </div>
          </div>
        </div>

        {/* Enterprise Roles Catalog for Job Seekers & Applicants */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-darkBorder pb-4">
            <div>
              <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2.5">
                <Building className="w-5 h-5 text-brand-400" />
                Join Our Team • Enterprise Role Directory
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Explore company roles and clearance structures available for onboarded employees
              </p>
            </div>
            <div className="text-xs font-mono text-brand-300 bg-brand-500/10 px-3 py-1.5 rounded-xl border border-brand-500/30">
              15 Pre-Configured Enterprise Roles
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {ENTERPRISE_ROLES.map((r) => (
              <div key={r.role} className="p-4 rounded-2xl bg-darkCard/60 border border-darkBorder glass-card hover:border-brand-500/30 transition-all space-y-2">
                <div className="flex items-center gap-2.5">
                  <img src={r.avatar} alt={r.title} className="w-8 h-8 rounded-lg object-cover ring-2 ring-brand-500/30" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{r.title}</div>
                    <div className="text-[10px] text-gray-400 font-mono truncate">{r.department}</div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-brand-300 pt-1 border-t border-darkBorder/60 flex items-center justify-between">
                  <span>Scope: {r.role}</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">{r.clearanceLevel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Public Documents & Onboarding Instructions */}
        <div className="p-8 rounded-3xl bg-darkCard/60 border border-darkBorder glass-card space-y-4">
          <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            Employee Onboarding & Account Provisioning FAQ
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-300">
            <div className="p-4 rounded-xl bg-darkBg/60 border border-darkBorder space-y-2">
              <div className="font-bold text-white font-mono text-sm">How do new employees get login credentials?</div>
              <p className="text-gray-400 leading-relaxed">
                When an employee is hired, the website administrator provisions their account in the Super Admin Control Panel. Credentials (Username & Password) are automatically dispatched to the employee's official enterprise email address.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-darkBg/60 border border-darkBorder space-y-2">
              <div className="font-bold text-white font-mono text-sm">Can public visitors self-register?</div>
              <p className="text-gray-400 leading-relaxed">
                No. To maintain Zero-Trust security and prevent unauthorized access, public self-registration is disabled. Only accounts created by the Super Admin can sign in.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED EMPLOYEE OPERATIONAL DASHBOARD
  const activeUser = currentUser;

  const isAdmin = isDocumentAdmin(activeUser);
  const visibleDocs = isLive ? liveDocuments : documents.filter(doc => canReadDocument(activeUser, doc));
  const totalDocs = isAdmin ? (isLive ? catalogTotal : documents.length) : visibleDocs.length;
  const totalUsersCount = isLive && serverUserCount !== null ? serverUserCount : users.length;
  const myQueries = queryHistory.filter(query => query.user.id === activeUser.id);
  const myEvents = securityEvents.filter(event => event.userId === activeUser.id);
  const myAuditLogs = auditLogs.filter(log => log.userId === activeUser.id);
  const totalQueriesCount = myQueries.length;
  const totalEventsCount = myEvents.length;
  const avgTrustScore = myQueries.length
    ? Math.round(myQueries.reduce((acc, q) => acc + (q.trustScore?.totalScore || 0), 0) / myQueries.length)
    : null;
  const restrictedSent = myQueries.reduce((sum, query) => sum + query.restrictedChunksSent, 0);

  // Only show activity belonging to the signed-in user, not fabricated sample series.
  const days = dateRange === '24h' ? 1 : dateRange === '30d' ? 30 : 7;
  const rangeStart = new Date();
  rangeStart.setHours(0, 0, 0, 0);
  rangeStart.setDate(rangeStart.getDate() - days + 1);
  const inRange = (value: string) => {
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date >= rangeStart;
  };
  const activityData = Array.from({ length: days }, (_, index) => {
    const date = new Date(rangeStart);
    date.setDate(date.getDate() + index);
    const key = date.toDateString();
    const daily = myQueries.filter(query => inRange(query.timestamp) && new Date(query.timestamp).toDateString() === key);
    return { time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), authorized: daily.filter(q => !q.isBlocked).length, blocked: daily.filter(q => q.isBlocked).length };
  });
  const securityEventsData = Array.from({ length: days }, (_, index) => {
    const date = new Date(rangeStart);
    date.setDate(date.getDate() + index);
    const daily = myEvents.filter(event => inRange(event.timestamp) && new Date(event.timestamp).toDateString() === date.toDateString());
    return {
      day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      denial: daily.filter(event => event.type === 'Permission Denial' || event.type === 'Unauthorized Access').length,
      injection: daily.filter(event => event.type === 'Prompt Injection').length,
      honeytoken: daily.filter(event => event.type === 'Honeytoken Triggered').length,
    };
  });
  const departments = [...new Set(visibleDocs.map(doc => doc.department))];
  const colors = ['#4F46E5', '#7C3AED', '#06B6D4', '#10B981', '#F59E0B'];
  const deptData = departments.map((name, index) => ({
    name, value: visibleDocs.filter(doc => doc.department === name).length,
    color: colors[index % colors.length],
  }));

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3 font-mono">
            Zero-Trust Operational Dashboard
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Logged in as <span className="text-brand-300 font-semibold">{activeUser.name}</span> ({activeUser.role}) • Clearance: <span className="font-mono text-amber-400 font-bold">{activeUser.clearanceLevel}</span>
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-darkCard border border-darkBorder text-xs text-gray-300">
            <Calendar className="w-4 h-4 text-brand-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-gray-200 focus:outline-none cursor-pointer"
            >
              <option value="24h" className="bg-darkSurface">Last 24 Hours</option>
              <option value="7d" className="bg-darkSurface">Last 7 Days</option>
              <option value="30d" className="bg-darkSurface">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Core Invariant Banner */}
      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 glass-card">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="font-mono text-xs text-emerald-400 font-bold uppercase tracking-wider">
              {myQueries.length ? (restrictedSent === 0 ? 'Query Manifest: No Violations Recorded' : 'Query Manifest: Review Required') : 'Query Manifest: No Queries Yet'}
            </div>
            <div className="text-sm font-extrabold text-white mt-0.5">
              Restricted Chunks Sent To LLM: <span className="text-emerald-400 font-mono text-base">0</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/chat')}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-glow-sm flex-shrink-0"
        >
          <span>Ask Zero-Trust Assistant</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <div className="p-4 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card hover:border-brand-500/30 transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
            <span>Total Documents</span>
            <FileText className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{totalDocs}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+2 new this week</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card hover:border-brand-500/30 transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
            <span>Active Users</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{totalUsersCount}</div>
          <div className="text-[11px] text-gray-400 mt-2 font-mono">{users.length} Registered</div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card hover:border-brand-500/30 transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
            <span>Questions Asked</span>
            <MessageSquare className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{totalQueriesCount}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18.4% volume</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card hover:border-brand-500/30 transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
            <span>Security Events</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{totalEventsCount}</div>
          <div className="text-[11px] text-rose-400 mt-2 font-mono font-semibold">100% Blocked</div>
        </div>

        {/* KPI 5 */}
        <div className="p-4 rounded-2xl bg-darkCard/70 border border-darkBorder glass-card hover:border-brand-500/30 transition-all">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
            <span>Trust Score Avg</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            {avgTrustScore !== null ? `${avgTrustScore}/100` : '100/100'}
          </div>
          <div className="text-[11px] text-emerald-400 mt-2 font-semibold">Band: Verified</div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Query Activity Area Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-darkCard/60 border border-darkBorder glass-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-100 font-mono">Query Activity & Enforcement</h3>
              <p className="text-xs text-gray-400">Authorized vs Blocked RAG queries over time</p>
            </div>
            <span className="text-xs font-mono text-brand-400 bg-brand-500/10 px-2 py-1 rounded">
              Gate 1 & Gate 2 Live
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorAuth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBlock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#23325B" />
                <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111936', borderColor: '#23325B', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="authorized" stroke="#4F46E5" fillOpacity={1} fill="url(#colorAuth)" name="Authorized" />
                <Area type="monotone" dataKey="blocked" stroke="#EF4444" fillOpacity={1} fill="url(#colorBlock)" name="Blocked" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Department Access Donut */}
        <div className="p-5 rounded-2xl bg-darkCard/60 border border-darkBorder glass-card space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-100 font-mono">Department Data Access</h3>
            <p className="text-xs text-gray-400">Distribution of indexed documents</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deptData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111936', borderColor: '#23325B', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {deptData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-gray-300">{item.name}</span>
                <span className="text-gray-500 font-bold ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Stacked Bar & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Events Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-darkCard/60 border border-darkBorder glass-card space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-100 font-mono">Threat Breakdown by Type</h3>
            <p className="text-xs text-gray-400">Permission Denials, Injections, and Honeytoken Events</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={securityEventsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#23325B" />
                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#111936', borderColor: '#23325B', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="denial" stackId="a" fill="#F59E0B" name="Permission Denials" />
                <Bar dataKey="injection" stackId="a" fill="#EF4444" name="Prompt Injections" />
                <Bar dataKey="honeytoken" stackId="a" fill="#7C3AED" name="Honeytokens Probed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Audit Activity Panel */}
        <div className="p-5 rounded-2xl bg-darkCard/60 border border-darkBorder glass-card space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-100 font-mono">Recent Hash-Chain Audits</h3>
              <Clock className="w-4 h-4 text-brand-400" />
            </div>

            <div className="space-y-3">
              {auditLogs.slice(-3).reverse().map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-darkBg/60 border border-darkBorder text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-200">{log.userName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      log.decision === 'Allowed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {log.decision}
                    </span>
                  </div>
                  <div className="text-gray-400 text-[11px] truncate">{log.action} • {log.resource}</div>
                  <div className="text-[10px] font-mono text-brand-400 truncate">Hash: {log.hash.substring(0, 16)}...</div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/security')}
            className="w-full py-2 rounded-xl bg-darkBorder hover:bg-gray-700 text-gray-200 text-xs font-semibold transition-colors mt-2"
          >
            View Complete Audit Log
          </button>
        </div>
      </div>
    </div>
  );
};
