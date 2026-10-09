import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmployees, provisionEmployee, deleteEmployee } from '../services/employeeApi';
import { useAppStore } from '../store/useAppStore';
import { 
  Users, 
  Shield, 
  Lock, 
  CheckCircle2, 
  UserPlus, 
  Mail, 
  Key, 
  Sparkles, 
  X, 
  Send, 
  Copy, 
  Check, 
  Search, 
  Eye, 
  EyeOff, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Building2, 
  ShieldAlert,
  UserCheck,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { ClassificationBadge } from '../components/common/ClassificationBadge';
import { ENTERPRISE_ROLES } from '../config/enterpriseRoles';
import { UserRole, User, ClassificationLevel } from '../types';

export const UserAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { users: demoUsers, currentUser, registerUser, removeUser, updateUser } = useAppStore();
  const isLive = import.meta.env.VITE_API_MODE === 'live';
  const [liveUsers, setLiveUsers] = useState<User[]>([]);
  const [loadError, setLoadError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [sending, setSending] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const users = isLive 
    ? [...liveUsers, ...demoUsers.filter(d => !liveUsers.some(l => l.email.toLowerCase() === d.email.toLowerCase() || l.name.toLowerCase() === d.name.toLowerCase()))]
    : demoUsers;

  const fetchLiveUsers = async () => {
    if (!isLive) return;
    try {
      const result = await getEmployees();
      setLiveUsers(result.users);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load employees.');
    }
  };

  useEffect(() => {
    fetchLiveUsers();
  }, [isLive]);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedClearance, setSelectedClearance] = useState('ALL');

  // Password Visibility Toggle Map
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Add Employee Form State
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('EmpPass2026!'); // Demo mode only
  const [empRole, setEmpRole] = useState<UserRole>('Senior Financial Analyst');
  const [errorMsg, setErrorMsg] = useState('');

  // Edit Employee Form State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Finance Manager');
  const [editDept, setEditDept] = useState('Finance');
  const [editClearance, setEditClearance] = useState<ClassificationLevel>('Confidential');
  const [editErrorMsg, setEditErrorMsg] = useState('');

  // Credentials Dispatch Notice State
  const [dispatchedDetails, setDispatchedDetails] = useState<{
    name: string;
    email: string;
    password?: string;
    role: string;
    emailSent: boolean;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedRoleDef = ENTERPRISE_ROLES.find(r => r.role === empRole) || ENTERPRISE_ROLES[0];

  // Dynamic Real Metrics Calculations
  const totalEmployees = users.length;
  // Calculate active users: users active recently or currently logged in
  const activeSessionsCount = users.filter(u => 
    u.lastActive?.toLowerCase().includes('active') || 
    u.lastActive?.toLowerCase().includes('just') ||
    u.lastActive?.toLowerCase().includes('now') ||
    u.email.toLowerCase() === currentUser?.email.toLowerCase()
  ).length || (users.length > 0 ? 1 : 0);
  const restrictedUsersCount = users.filter(u => u.clearanceLevel === 'Restricted').length;
  const uniqueDepartmentsCount = new Set(users.map(u => u.department)).size;

  // Filtered Users List
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = selectedDept === 'ALL' || u.department === selectedDept;
    const matchesClearance = selectedClearance === 'ALL' || u.clearanceLevel === selectedClearance;

    return matchesSearch && matchesDept && matchesClearance;
  });

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Add Employee Handler
  const handleProvisionEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setDispatchedDetails(null);
    if (!empName.trim() || !empEmail.trim()) {
      setErrorMsg('Please enter employee name and email address.');
      return;
    }
    setSending(true);
    try {
      if (isLive) {
        const { user, emailSent, temporaryPassword } = await provisionEmployee({
          name: empName.trim(), email: empEmail.trim(), role: empRole,
          department: selectedRoleDef.department, clearanceLevel: selectedRoleDef.clearanceLevel,
        });
        setLiveUsers(previous => [...previous, user]);
        setDispatchedDetails({ name: user.name, email: user.email, role: user.role, emailSent, password: temporaryPassword });
      } else {
        const res = registerUser({
          name: empName, email: empEmail, password: empPassword, role: empRole,
          department: selectedRoleDef.department, clearanceLevel: selectedRoleDef.clearanceLevel,
        });
        if (!res.success) throw new Error(res.message);
        setDispatchedDetails({
          name: empName.trim(), email: empEmail.trim(), password: empPassword.trim(),
          role: empRole, emailSent: false,
        });
      }
      setEmpName('');
      setEmpEmail('');
      setEmpPassword('EmpPass2026!');
      setShowAddModal(false);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Could not provision employee.');
    } finally {
      setSending(false);
    }
  };

  // Delete Employee Handler
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    setErrorMsg('');
    try {
      if (isLive) {
        await deleteEmployee(userToDelete.id);
        setLiveUsers(prev => prev.filter(u => u.id !== userToDelete.id));
        setActionSuccess(`Employee '${userToDelete.name}' (${userToDelete.email}) was permanently deleted.`);
      } else {
        removeUser(userToDelete.id);
        setActionSuccess(`Employee '${userToDelete.name}' removed from store.`);
      }
      setUserToDelete(null);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete employee.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Edit Employee Open Handler
  const openEditModal = (u: User) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPassword(u.password || 'password123');
    setEditRole(u.role);
    setEditDept(u.department);
    setEditClearance(u.clearanceLevel);
    setEditErrorMsg('');
  };

  // Edit Employee Submit Handler
  const handleUpdateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditErrorMsg('');

    if (!editName.trim() || !editEmail.trim()) {
      setEditErrorMsg('Name and Email are required.');
      return;
    }

    const res = updateUser(editingUser.id, {
      name: editName.trim(),
      email: editEmail.trim(),
      password: editPassword.trim(),
      role: editRole,
      department: editDept,
      clearanceLevel: editClearance,
    });

    if (res.success) {
      setEditingUser(null);
    } else {
      setEditErrorMsg(res.message);
    }
  };

  // Quick Password Reset Handler
  const handleQuickResetPassword = (u: User) => {
    const newPass = `${u.name.split(' ')[0]}Pass2026!`;
    updateUser(u.id, { password: newPass });
    alert(`Password for '${u.name}' reset to: ${newPass}`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-darkBorder pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-xs font-bold mb-2">
            <Lock className="w-3.5 h-3.5" />
            MANAGEMENT STAFF MASTER ADMIN CONTROL
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight font-mono flex items-center gap-3">
            <Users className="w-6 h-6 text-brand-400" />
            Enterprise User Identity & Clearance Control Panel
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Logged in as Admin <strong className="text-brand-300 font-mono">{currentUser?.name || 'Mohan Patel'}</strong> ({currentUser?.role || 'Management Staff'}) • {isLive ? 'Provision employees and email first-login credentials.' : 'Manage demo employee credentials, roles, and clearances.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/documents')}
            className="px-4 py-2.5 rounded-xl bg-darkCard border border-darkBorder hover:border-brand-500 text-brand-300 font-mono text-xs font-bold flex items-center gap-2 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Manage All Documents & ACLs</span>
          </button>
          <button
            onClick={() => {
              setShowAddModal(true);
              setErrorMsg('');
            }}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-brand-600/30"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Provision New Employee</span>
          </button>
        </div>
      </div>

      {/* Real Enterprise Live Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-darkCard/80 border border-darkBorder glass-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-gray-400 uppercase font-bold">Total Registered Users</div>
            <div className="text-2xl font-extrabold text-white font-mono mt-0.5">{totalEmployees}</div>
            <div className="text-[10px] text-brand-400 font-mono">{isLive ? 'Email invitations accepted by SMTP' : 'Browser-only demo users'}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-darkCard/80 border border-darkBorder glass-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-gray-400 uppercase font-bold">{isLive ? 'Provisioned Accounts' : 'Demo Active Sessions'}</div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-0.5">{isLive ? users.length : activeSessionsCount}</div>
            <div className="text-[10px] text-emerald-300 font-mono">{isLive ? 'Stored on server' : 'Demo activity estimate'}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-darkCard/80 border border-darkBorder glass-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-gray-400 uppercase font-bold">Restricted Clearance</div>
            <div className="text-2xl font-extrabold text-rose-400 font-mono mt-0.5">{restrictedUsersCount}</div>
            <div className="text-[10px] text-rose-300 font-mono">Top-Level Security Clearance</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-darkCard/80 border border-darkBorder glass-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-gray-400 uppercase font-bold">Departments Managed</div>
            <div className="text-2xl font-extrabold text-purple-300 font-mono mt-0.5">{uniqueDepartmentsCount}</div>
            <div className="text-[10px] text-purple-400 font-mono">Finance, IT, Exec, Sec, Compliance</div>
          </div>
        </div>
      </div>

      {/* Dispatched Credentials Alert */}
      {dispatchedDetails && (
        <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono space-y-3 shadow-2xl glass-card animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{dispatchedDetails.emailSent ? 'Invitation accepted by email server — check Inbox/Spam' : 'Demo account created locally (no email sent)'}</span>
            </div>
            <button onClick={() => setDispatchedDetails(null)} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-darkBg border border-darkBorder space-y-2 text-gray-200">
            <div><span className="text-gray-400">Employee Name:</span> <strong className="text-white">{dispatchedDetails.name}</strong></div>
            <div><span className="text-gray-400">Username / Email:</span> <strong className="text-brand-300">{dispatchedDetails.email}</strong></div>
            {dispatchedDetails.password && <div><span className="text-gray-400">Demo password:</span> <strong className="text-amber-400 font-mono">{dispatchedDetails.password}</strong></div>}
            <div><span className="text-gray-400">Assigned Role:</span> <strong className="text-purple-300">{dispatchedDetails.role}</strong></div>
          </div>

          <div className="flex justify-between items-center text-[11px] text-gray-400">
            <span>{dispatchedDetails.emailSent ? 'Temporary password sent by email; employee must change it on first login.' : 'Demo only — account exists in this browser.'}</span>
            {dispatchedDetails.password && <button
              onClick={() => copyToClipboard(`Username: ${dispatchedDetails.email}\nPassword: ${dispatchedDetails.password}`, 'dispatch')}
              className="px-3 py-1.5 rounded-lg bg-darkSurface border border-darkBorder hover:border-brand-500/40 text-brand-300 flex items-center gap-1.5 font-bold"
            >
              {copiedId === 'dispatch' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'dispatch' ? 'Copied!' : 'Copy Credentials'}</span>
            </button>}
          </div>
        </div>
      )}

      {loadError && <p role="alert" className="text-rose-300 text-sm">{loadError}</p>}
      {/* Users Control Table Container */}
      <div className="p-6 rounded-2xl bg-darkCard/80 border border-darkBorder glass-card space-y-4">
        {/* Search & Filters Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user, email, username or role..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-darkBg border border-darkBorder text-gray-100 text-xs focus:outline-none focus:border-brand-500 font-mono"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs font-mono">
            {/* Dept Filter */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Dept:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-darkBg border border-darkBorder text-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-500"
              >
                <option value="ALL">All Departments</option>
                <option value="Finance">Finance</option>
                <option value="Executive">Executive</option>
                <option value="IT & Administration">IT & Administration</option>
                <option value="Security">Security</option>
                <option value="Compliance">Compliance</option>
              </select>
            </div>

            {/* Clearance Filter */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Clearance:</span>
              <select
                value={selectedClearance}
                onChange={(e) => setSelectedClearance(e.target.value)}
                className="bg-darkBg border border-darkBorder text-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-500"
              >
                <option value="ALL">All Clearances</option>
                <option value="Public">Public</option>
                <option value="Confidential">Confidential</option>
                <option value="Restricted">Restricted</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Accounts Table */}
        <div className="overflow-x-auto rounded-xl border border-darkBorder">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-darkSurface text-gray-400 font-mono text-[11px] uppercase border-b border-darkBorder">
              <tr>
                <th className="p-3.5">Employee / User</th>
                <th className="p-3.5">Username / Email</th>
                <th className="p-3.5">{isLive ? 'Credentials' : 'Password (Demo Admin View)'}</th>
                <th className="p-3.5">Assigned Role & Dept</th>
                <th className="p-3.5">Clearance Level</th>
                <th className="p-3.5">Session Status</th>
                <th className="p-3.5 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkBorder text-gray-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 font-mono">
                    No employee accounts match the search/filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser?.email.toLowerCase() === u.email.toLowerCase();
                  const showPass = showPasswordMap[u.id || u.email] || false;
                  const displayPassword = u.password || 'password123';

                  return (
                    <tr key={u.id || u.email} className={`hover:bg-darkBorder/50 transition-colors ${isCurrent ? 'bg-brand-600/10' : ''}`}>
                      {/* Name & Avatar */}
                      <td className="p-3.5 flex items-center gap-3 font-semibold text-gray-100">
                        <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-xl object-cover ring-2 ring-brand-500/30" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span>{u.name}</span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded bg-brand-500 text-white text-[9px] font-mono font-bold">
                                YOU (LOGGED IN)
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">{u.department}</div>
                        </div>
                      </td>

                      {/* Username / Email */}
                      <td className="p-3.5 font-mono text-brand-300 font-semibold">
                        <div className="flex items-center gap-2">
                          <span>{u.email}</span>
                          <button
                            onClick={() => copyToClipboard(u.email, `email-${u.id}`)}
                            title="Copy Username/Email"
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                          >
                            {copiedId === `email-${u.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Server passwords are hashes; never show or copy them. */}
                      <td className="p-3.5 font-mono">
                        {isLive ? <span className="text-gray-400">Private · temporary password emailed</span> : <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded bg-darkBg border border-darkBorder font-mono ${showPass ? 'text-amber-300 font-bold' : 'text-gray-400'}`}>
                            {showPass ? displayPassword : '••••••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(u.id)}
                            title={showPass ? 'Hide Password' : 'Show Password'}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                          >
                            {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-amber-400" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(displayPassword, `pass-${u.id}`)}
                            title="Copy Password"
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                          >
                            {copiedId === `pass-${u.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>}
                      </td>

                      {/* Role & Department */}
                      <td className="p-3.5 font-mono">
                        <div className="font-bold text-gray-200">{u.role}</div>
                        <div className="text-[10px] text-gray-400">{u.department}</div>
                      </td>

                      {/* Clearance Level */}
                      <td className="p-3.5">
                        <ClassificationBadge classification={u.clearanceLevel} size="sm" />
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          {isLive ? 'PROVISIONED' : 'ACTIVE SESSION'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right font-mono">
                        <div className="flex items-center justify-end gap-2">
                          {!isLive && (
                            <>
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-1.5 rounded-lg bg-darkSurface hover:bg-darkBorder border border-darkBorder text-brand-300 hover:text-white transition-colors"
                                title="Edit Employee Details (Role, Password, Clearance)"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleQuickResetPassword(u)}
                                className="p-1.5 rounded-lg bg-darkSurface hover:bg-darkBorder border border-darkBorder text-amber-300 hover:text-amber-200 transition-colors"
                                title="Reset Password"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {!isCurrent && (
                            <button
                              onClick={() => setUserToDelete(u)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:text-rose-200 transition-all flex items-center gap-1.5 text-[11px] font-bold shadow-sm"
                              title="Permanently Delete Employee Account"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Success Notification */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-darkSurface border border-rose-500/40 shadow-2xl p-6 space-y-4 font-sans glass-card">
            <div className="flex items-center gap-3 text-rose-400 border-b border-darkBorder pb-3">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold font-mono text-white">
                  Permanently Delete Employee?
                </h3>
                <p className="text-[11px] text-gray-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-darkBg border border-darkBorder space-y-2 text-xs font-mono">
              <div className="text-gray-300">
                <strong className="text-white">{userToDelete.name}</strong>
              </div>
              <div className="text-gray-400">Email: {userToDelete.email}</div>
              <div className="text-gray-400">Role: {userToDelete.role}</div>
              <div className="text-gray-400">Department: {userToDelete.department}</div>
            </div>

            <p className="text-xs text-rose-300/90 leading-relaxed font-sans">
              Deleting this employee will permanently revoke their access, delete their authentication credentials, and purge active sessions across the enterprise.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-darkCard border border-darkBorder hover:bg-darkBorder text-gray-300 text-xs font-mono font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Confirm Permanent Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provision New Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-darkSurface border border-darkBorder shadow-2xl p-6 space-y-5 font-sans glass-card">
            <div className="flex items-center justify-between pb-3 border-b border-darkBorder">
              <div className="flex items-center gap-2 text-brand-400">
                <UserPlus className="w-5 h-5" />
                <h3 className="text-base font-bold font-mono text-white">
                  Provision New Enterprise Employee
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg bg-darkBorder text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleProvisionEmployee} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-gray-300 mb-1 font-semibold">
                  Employee Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="e.g. Vikram Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-darkBg border border-darkBorder text-gray-100 focus:outline-none focus:border-brand-500 font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1 font-semibold">
                  Username / Email <span className="text-rose-400">*</span>
                </label>
                <input
                  type={isLive ? 'email' : 'text'}
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  placeholder={isLive ? 'employee@gmail.com' : 'e.g. vikram.sharma@acme-corp.com or vikramadmin'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-darkBg border border-darkBorder text-gray-100 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              {!isLive && <div>
                <label className="block text-gray-300 mb-1 font-semibold">
                  Assigned Password <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={empPassword}
                  onChange={(e) => setEmpPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-darkBg border border-darkBorder text-gray-100 focus:outline-none focus:border-brand-500 font-mono text-amber-300 font-bold"
                  required
                />
              </div>}
              {isLive && <p className="text-gray-400">A unique temporary password will be sent to this address via email. It must be changed at first login.</p>}

              <div>
                <label className="block text-gray-300 mb-1 font-semibold">
                  Assign Enterprise Role Clearance <span className="text-rose-400">*</span>
                </label>
                <select
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-darkBg border border-darkBorder text-brand-300 font-bold focus:outline-none focus:border-brand-500"
                >
                  {ENTERPRISE_ROLES.filter(r => !isLive || !['Management Staff', 'System Administrator', 'CEO/Admin'].includes(r.role)).map(r => (
                    <option key={r.role} value={r.role} className="bg-darkSurface text-gray-200">
                      {r.title} ({r.role}) - Clearance: {r.clearanceLevel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-darkBg border border-darkBorder flex items-center justify-between text-gray-400 text-[11px]">
                <span>Department: <strong className="text-white">{selectedRoleDef.department}</strong></span>
                <span>Clearance: <strong className="text-amber-400">{selectedRoleDef.clearanceLevel}</strong></span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
                >
                  <Send className="w-4 h-4" />
                  <span>{sending ? 'Sending invitation...' : isLive ? 'Create Account & Email Credentials' : 'Create Demo Account (No Email)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-darkSurface border border-darkBorder shadow-2xl p-6 space-y-5 font-sans glass-card">
            <div className="flex items-center justify-between pb-3 border-b border-darkBorder">
              <div className="flex items-center gap-2 text-brand-400">
                <Edit3 className="w-5 h-5" />
                <h3 className="text-base font-bold font-mono text-white">
                  Edit Employee Account: {editingUser.name}
                </h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-1 rounded-lg bg-darkBorder text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                ⚠️ {editErrorMsg}
              </div>
            )}

            <form onSubmit={handleUpdateEmployee} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-gray-300 mb-1 font-semibold">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-darkBg border border-darkBorder text-gray-100 focus:outline-none focus:border-brand-500 font-sans"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1 font-semibold">Email / Username</label>
                <input
                  type="text"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-darkBg border border-darkBorder text-gray-100 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1 font-semibold">Password</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-darkBg border border-darkBorder text-amber-300 font-bold focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => {
                      const r = e.target.value as UserRole;
                      setEditRole(r);
                      const def = ENTERPRISE_ROLES.find(item => item.role === r);
                      if (def) {
                        setEditDept(def.department);
                        setEditClearance(def.clearanceLevel);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-darkBg border border-darkBorder text-brand-300 font-bold focus:outline-none focus:border-brand-500"
                  >
                    {ENTERPRISE_ROLES.map(r => (
                      <option key={r.role} value={r.role} className="bg-darkSurface text-gray-200">
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Clearance Level</label>
                  <select
                    value={editClearance}
                    onChange={(e) => setEditClearance(e.target.value as ClassificationLevel)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-darkBg border border-darkBorder text-amber-300 font-bold focus:outline-none focus:border-brand-500"
                  >
                    <option value="Public">Public</option>
                    <option value="Confidential">Confidential</option>
                    <option value="Restricted">Restricted</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 rounded-xl bg-darkBorder hover:bg-darkBorder/70 text-gray-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
