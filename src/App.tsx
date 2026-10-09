import React, { useEffect, useState } from 'react';
import { employeeMe } from './services/employeeApi';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Chat } from './pages/Chat';
import { ProveAnswer } from './pages/ProveAnswer';
import { TrustTrace } from './pages/TrustTrace';
import { SecurityCenter } from './pages/SecurityCenter';
import { AttackSimulator } from './pages/AttackSimulator';
import { Documents } from './pages/Documents';
import { Conflicts } from './pages/Conflicts';
import { Forensics } from './pages/Forensics';
import { PolicyStudio } from './pages/PolicyStudio';
import { AccessRequests } from './pages/AccessRequests';
import { UserAdmin } from './pages/UserAdmin';
import { Compliance } from './pages/Compliance';
import { QualityLab } from './pages/QualityLab';
import { Settings } from './pages/Settings';

import { useAppStore } from './store/useAppStore';

export const App: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { isAuthenticated, currentUser, logout, setAuthenticatedUser, theme } = useAppStore();
  const [sessionChecked, setSessionChecked] = useState(import.meta.env.VITE_API_MODE !== 'live' || !isAuthenticated);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (import.meta.env.VITE_API_MODE !== 'live' || !isAuthenticated) return;
    let cancelled = false;
    employeeMe().then(({ user, mustChangePassword }) => {
      if (cancelled) return;
      if (mustChangePassword) logout();
      else setAuthenticatedUser(user);
    }).catch(() => {
      if (!cancelled) logout();
    }).finally(() => {
      if (!cancelled) setSessionChecked(true);
    });
    return () => { cancelled = true; };
  }, []);

  if (!sessionChecked) return <div className="min-h-screen bg-darkBg text-gray-200 p-8">Checking session...</div>;

  const isLoginPage = location.pathname === '/login';
  const publicPaths = ['/', '/documents', '/login'];
  const isPublicRoute = publicPaths.includes(location.pathname);

  if (!isAuthenticated && !isPublicRoute) {
    return <Navigate to="/login" replace />;
  }

  if (isAuthenticated && isLoginPage) {
    return <Navigate to="/" replace />;
  }

  if (location.pathname === '/admin/users' && import.meta.env.VITE_API_MODE === 'live' &&
      !['Management Staff', 'System Administrator', 'CEO/Admin'].includes(currentUser?.role || '')) {
    return <Navigate to="/" replace />;
  }

  if (isLoginPage) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-darkBg text-gray-100 flex">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Container */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Navbar */}
        <Navbar sidebarCollapsed={sidebarCollapsed} />

        {/* Content Area */}
        <main className="flex-1 pt-20 px-6 pb-6 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/prove/:queryId" element={<ProveAnswer />} />
            <Route path="/prove" element={<ProveAnswer />} />
            <Route path="/trace/:queryId" element={<TrustTrace />} />
            <Route path="/trace" element={<TrustTrace />} />
            <Route path="/security" element={<SecurityCenter />} />
            <Route path="/simulator" element={<AttackSimulator />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/conflicts" element={<Conflicts />} />
            <Route path="/forensics/:queryId" element={<Forensics />} />
            <Route path="/forensics" element={<Forensics />} />
            <Route path="/policies" element={<PolicyStudio />} />
            <Route path="/requests" element={<AccessRequests />} />
            <Route path="/admin/users" element={<UserAdmin />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/quality" element={<QualityLab />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};
