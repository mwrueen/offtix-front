import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCookie } from '../utils/cookies';
import SidebarHeader from './SidebarHeader';
import { useSocket } from '../context/SocketContext';
import { useChat } from '../context/ChatContext';
import { usePermissions, PERMISSIONS } from '../context/PermissionsContext';
import GlobalChat from './chat/GlobalChat';
import { myTasksAPI } from '../services/api';

const Layout = ({ children }) => {
  const { state, dispatch } = useAuth();
  const { state: companyState, selectCompany } = useCompany();
  const { unreadCount, unreadCountsByCompany, clearUnreadCount, fetchUnreadCount } = useSocket();
  const { hasPermission, companyData } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { unreadCounts, unreadCountsByCompany: chatUnreadByCompany, fetchUnreadCounts } = useChat();
  const [pendingTasksByCompany, setPendingTasksByCompany] = useState({});

  const selectedCompanyId = companyState.selectedCompany?.id || 'personal';
  const selectedCompanyHeaderId = selectedCompanyId === 'personal' ? null : selectedCompanyId;

  const canManageSettings = hasPermission(PERMISSIONS.MANAGE_COMPANY_SETTINGS);
  const canViewDesignations = hasPermission(PERMISSIONS.VIEW_DESIGNATIONS);
  const canViewEmployees = hasPermission(PERMISSIONS.VIEW_EMPLOYEE_LIST);
  const canManageRecruitment = hasPermission(PERMISSIONS.MANAGE_RECRUITMENT);

  useEffect(() => {
    const mu = (e) => {
      if (isCompanyDropdownOpen && !e.target.closest('.workspace-modal') && !e.target.closest('.sidebar-header')) setIsCompanyDropdownOpen(false);
      if (isNotifDropdownOpen && !e.target.closest('.notif-dropdown-container')) setIsNotifDropdownOpen(false);
    };
    document.addEventListener('mousedown', mu);
    return () => document.removeEventListener('mousedown', mu);
  }, [isCompanyDropdownOpen, isNotifDropdownOpen]);

  const fetchRecentNotifications = async () => {
    setNotifLoading(true);
    try {
      const token = getCookie('authToken');
      const headers = { Authorization: `Bearer ${token}` };
      if (selectedCompanyHeaderId) headers['X-Company-Id'] = selectedCompanyHeaderId;
      const [nr, ir] = await Promise.all([
        fetch('/api/notifications', { headers }),
        fetch('/api/invitations/my-invitations', { headers })
      ]);
      let combined = [];
      if (nr.ok) combined = ((await nr.json()).notifications || []).slice(0, 8);
      if (ir.ok) {
        const invs = (await ir.json());
        const ins = (Array.isArray(invs) ? invs : []).map(i => ({ _id: `inv_${i._id}`, type: 'invitation', title: `Invitation: ${i.company?.name}`, message: `Invited as ${i.designation} by ${i.invitedBy?.name}`, isRead: false, createdAt: i.createdAt, _invitationId: i._id }));
        combined = [...ins, ...combined].slice(0, 8);
      }
      setRecentNotifications(combined);
    } catch (err) { console.error('Notification_Error', err); }
    finally { setNotifLoading(false); }
  };

  const toggleNotifDropdown = () => {
    const nextState = !isNotifDropdownOpen;
    setIsNotifDropdownOpen(nextState);
    if (nextState) fetchRecentNotifications();
  };

  const markNotifAsRead = async (id) => {
    try {
      const token = getCookie('authToken');
      const headers = { Authorization: `Bearer ${token}` };
      if (selectedCompanyHeaderId) headers['X-Company-Id'] = selectedCompanyHeaderId;
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT', headers });
      setRecentNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      fetchUnreadCount(selectedCompanyId);
    } catch { }
  };

  useEffect(() => { if (location.pathname === '/notifications') clearUnreadCount(); }, [location.pathname, clearUnreadCount]);
  useEffect(() => { fetchUnreadCount(selectedCompanyId); }, [fetchUnreadCount, selectedCompanyId]);

  // Memoized company IDs to avoid re-triggering effects on every layout render
  const companyIds = React.useMemo(() => {
    const companies = Array.isArray(companyState.companies) ? companyState.companies : [];
    if (!companies.length) return ['personal'];
    return [...new Set(['personal', ...companies.map(c => c.id).filter(Boolean)])];
  }, [companyState.companies]);

  // Preload counts for all companies so the dropdown can show badges
  useEffect(() => {
    if (!companyIds.length || !isCompanyDropdownOpen) return;
    companyIds.forEach((id) => {
      fetchUnreadCount(id);
      fetchUnreadCounts(id);
    });
  }, [companyIds, fetchUnreadCount, fetchUnreadCounts, isCompanyDropdownOpen]);

  // Preload pending my-tasks counts per company for the dropdown
  useEffect(() => {
    if (!companyIds.length || !isCompanyDropdownOpen) return;

    let cancelled = false;
    const run = async () => {
      const results = await Promise.allSettled(
        companyIds.map(async (id) => {
          const res = await myTasksAPI.getAll(id);
          const tasks = res.data || [];
          const pendingCount = tasks.filter(t => {
            const s = t.workflowType === 'sequential'
              ? (t.userAssignee?.status || 'pending')
              : (t.userStep?.status || 'pending');
            return s !== 'completed';
          }).length;
          return [id, pendingCount];
        })
      );

      if (cancelled) return;
      const next = {};
      results.forEach(r => {
        if (r.status === 'fulfilled') {
          const [id, count] = r.value;
          next[id] = count;
        }
      });
      setPendingTasksByCompany(next);
    };

    run();
    return () => { cancelled = true; };
  }, [companyIds, isCompanyDropdownOpen]);

  const handleLogout = () => { dispatch({ type: 'LOGOUT' }); navigate('/'); };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', category: 'Main' },
    { path: '/projects', label: 'Projects', icon: '📁', category: 'Main' },
    ...(state.user?.role !== 'superadmin' ? [
      { path: '/my-tasks', label: 'My Tasks', icon: '✅', category: 'Main' },
      { path: '/team-activity', label: 'Team Activity', icon: '📡', category: 'Main' }
    ] : []),
    ...(companyState.selectedCompany?.id !== 'personal' ? [
      { path: '/overview', label: 'Overview', icon: '🌍', category: 'Management' },
      ...(canViewEmployees ? [
        { path: '/employees', label: 'Employees', icon: '👥', category: 'Management' },
        { path: '/organogram', label: 'Organogram', icon: '📐', category: 'Management' }
      ] : []),
      ...(canManageRecruitment ? [{ path: '/recruitment', label: 'Recruitment', icon: '🎯', category: 'Management' }] : []),
      ...(canViewDesignations ? [{ path: '/manage-roles', label: 'Roles & Access', icon: '🛡️', category: 'Management' }] : []),
      { path: '/leaves', label: 'Leaves', icon: '🗓️', category: 'Management' },
      { path: '/holidays', label: 'Holidays', icon: '🎁', category: 'Management' }
    ] : []),
    ...(state.user?.role === 'admin' || state.user?.role === 'superadmin' ? [
      { path: '/users', label: 'Users', icon: '🆔', category: 'Administration' },
      { path: '/companies', label: 'Companies', icon: '🏭', category: 'Administration' }
    ] : []),
    ...(canManageSettings && companyState.selectedCompany?.id !== 'personal' ? [
      { path: '/company-settings', label: 'Settings', icon: '⚙️', category: 'System' }
    ] : [])
  ];

  const handleCompanySelect = async (c) => {
    if (c === 'Create Company') {
      navigate('/create-company');
      setIsCompanyDropdownOpen(false);
      return;
    }

    const nextCompany = c === 'Personal' ? { id: 'personal', name: 'Personal' } : c;
    selectCompany(nextCompany);

    const nextId = nextCompany?.id || 'personal';
    await Promise.allSettled([
      fetchUnreadCount(nextId),
      fetchUnreadCounts(nextId),
    ]);

    setIsCompanyDropdownOpen(false);
    navigate('/dashboard', { replace: true });
  };

  const getCompanyNotifCount = (companyId) => unreadCountsByCompany?.[companyId] || 0;
  const getCompanyMsgCount = (companyId) => chatUnreadByCompany?.[companyId]?.total || 0;
  const getCompanyPendingTasks = (companyId) => pendingTasksByCompany?.[companyId] || 0;

  const getPageTitle = () => {
    const titles = {
      '/dashboard': 'Dashboard',
      '/projects': 'Projects',
      '/overview': 'Overview',
      '/users': 'User Management',
      '/employees': 'Employees',
      '/leaves': 'Leaves',
      '/holidays': 'Holidays',
      '/profile': 'Profile Settings'
    };
    if (location.pathname.startsWith('/employees/')) return 'Employee Details';
    return titles[location.pathname] || 'Offtix';
  };

  const timeAgo = (d) => { if (!d) return ''; const df = Date.now() - new Date(d).getTime(); const m = Math.floor(df / 60000); if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`; };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} h-screen bg-white text-slate-700 flex flex-col fixed left-0 top-0 transition-all duration-300 ease-in-out shadow-lg z-[1000] border-r border-slate-200`}>
        <SidebarHeader
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          selectedCompany={companyState.selectedCompany}
          companyData={companyData}
          onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
          isDropdownOpen={isCompanyDropdownOpen}
        />

        {/* Workspace Dropdown */}
        {isCompanyDropdownOpen && (
          <div className={`workspace-modal absolute ${sidebarCollapsed ? 'top-16 left-20 w-80' : 'top-20 left-4 right-4'} bg-white border border-slate-200 rounded-xl shadow-2xl z-[1001] max-h-[400px] overflow-y-auto scrollbar-none animate-in fade-in slide-in-from-top-2`}>
            <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Workspaces</div>
            <div className="p-2 space-y-1">
              {companyState.companies.map((c) => (
                <div key={c.id} onClick={() => handleCompanySelect(c)} className={`flex items-center gap-3 p-3 cursor-pointer rounded-lg transition-colors ${companyState.selectedCompany?.id === c.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}>
                  <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0 text-sm">{c.logo ? <img src={c.logo} alt="" className="w-full h-full object-cover rounded-md" /> : c.name.charAt(0)}</div>
                  <span className="flex-1 truncate text-sm">{c.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {getCompanyPendingTasks(c.id) > 0 && (
                      <span className="min-w-5 h-5 px-1.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                        {getCompanyPendingTasks(c.id) > 99 ? '99+' : getCompanyPendingTasks(c.id)}
                      </span>
                    )}
                    {getCompanyMsgCount(c.id) > 0 && (
                      <span className="min-w-5 h-5 px-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                        {getCompanyMsgCount(c.id) > 99 ? '99+' : getCompanyMsgCount(c.id)}
                      </span>
                    )}
                    {getCompanyNotifCount(c.id) > 0 && (
                      <span className="min-w-5 h-5 px-1.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                        {getCompanyNotifCount(c.id) > 99 ? '99+' : getCompanyNotifCount(c.id)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div onClick={() => handleCompanySelect('Personal')} className={`flex items-center gap-3 p-3 cursor-pointer rounded-lg transition-colors ${companyState.selectedCompany?.id === 'personal' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}>
                <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-sm">👤</div>
                <span className="flex-1 text-sm font-medium">Personal Account</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {getCompanyPendingTasks('personal') > 0 && (
                    <span className="min-w-5 h-5 px-1.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                      {getCompanyPendingTasks('personal') > 99 ? '99+' : getCompanyPendingTasks('personal')}
                    </span>
                  )}
                  {getCompanyMsgCount('personal') > 0 && (
                    <span className="min-w-5 h-5 px-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                      {getCompanyMsgCount('personal') > 99 ? '99+' : getCompanyMsgCount('personal')}
                    </span>
                  )}
                  {getCompanyNotifCount('personal') > 0 && (
                    <span className="min-w-5 h-5 px-1.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                      {getCompanyNotifCount('personal') > 99 ? '99+' : getCompanyNotifCount('personal')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-slate-100">
              <button onClick={() => handleCompanySelect('Create Company')} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"> + Add Company </button>
            </div>
          </div>
        )}

        <nav className={`flex-1 overflow-y-auto scrollbar-none py-6 space-y-1 ${sidebarCollapsed ? 'px-2' : 'px-4'}`}>
          {menuItems.map((item, idx) => {
            const active = location.pathname === item.path || (item.path === '/employees' && location.pathname.startsWith('/employees/'));
            const showCat = !sidebarCollapsed && (idx === 0 || menuItems[idx - 1].category !== item.category);
            return (
              <React.Fragment key={item.path}>
                {showCat && <div className="px-3 mt-6 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</div>}
                <div onClick={() => navigate(item.path)} className={`group flex items-center gap-4 cursor-pointer rounded-lg transition-all ${sidebarCollapsed ? 'p-3 justify-center' : 'p-3 px-4'} ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>
                  <span className="text-xl">{item.icon}</span>
                  {!sidebarCollapsed && <span className="flex-1 text-sm font-medium">{item.label}</span>}
                </div>
              </React.Fragment>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          {!sidebarCollapsed ? (
            <div className="space-y-4">
              <div onClick={() => navigate('/profile')} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">{state.user?.name?.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800 truncate">{state.user?.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">{state.user?.role}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="w-full py-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg text-xs font-bold transition-colors"> Logout </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div onClick={() => navigate('/profile')} className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg cursor-pointer">{state.user?.name?.charAt(0)}</div>
              <button onClick={handleLogout} className="text-xl text-slate-400 hover:text-rose-500 transition-colors">🔒</button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex flex-col flex-1 ${sidebarCollapsed ? 'ml-20' : 'ml-72'} transition-all duration-300 ease-in-out h-screen overflow-hidden`}>
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-800"> {getPageTitle()} </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Chat Icon */}
            <div onClick={() => setIsChatOpen(!isChatOpen)} className="relative w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer hover:bg-slate-50 transition-colors border border-slate-100 text-xl shadow-sm">
              💬
              {unreadCounts.total > 0 && <div className="absolute -top-1 -right-1 bg-rose-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{unreadCounts.total > 99 ? '99' : unreadCounts.total}</div>}
            </div>

            {/* Notification Icon */}
            <div className="notif-dropdown-container relative">
              <div onClick={toggleNotifDropdown} className={`w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer transition-colors border shadow-sm text-xl ${isNotifDropdownOpen ? 'bg-slate-100 border-slate-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                🔔
                {unreadCount > 0 && <div className="absolute -top-1 -right-1 bg-amber-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">{unreadCount}</div>}
              </div>
              {isNotifDropdownOpen && (
                <div className="absolute top-full mt-2 right-0 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-[1000] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="font-bold text-slate-800">Notifications</h4>
                    <button onClick={() => { setIsNotifDropdownOpen(false); navigate('/notifications'); }} className="text-[10px] font-bold text-indigo-600 hover:underline">View All</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
                    {notifLoading ? (
                      <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading updates...</div>
                    ) : recentNotifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">No new notifications.</div>
                    ) : recentNotifications.map((n) => (
                      <div key={n._id} onClick={() => { if (!n.isRead && !n._id.startsWith('inv_')) markNotifAsRead(n._id); setIsNotifDropdownOpen(false); const tid = n.metadata?.taskId || n.relatedId; navigate(tid ? `/my-tasks/${tid}` : '/notifications'); }} className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${!n.isRead && 'bg-indigo-50/30'}`}>
                        <p className="text-sm font-bold text-slate-800 truncate">{n.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-2">{timeAgo(n.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Time Display */}
            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs font-semibold shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Content Portal */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </main>

      {isChatOpen && <GlobalChat onClose={() => setIsChatOpen(false)} />}

      <style dangerouslySetInnerHTML={{
        __html: `
        .scrollbar-none::-webkit-scrollbar { display: none; }
      ` }} />
    </div>
  );
};

export default Layout;