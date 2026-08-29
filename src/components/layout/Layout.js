import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getCookie } from '../../utils/cookies';
import SidebarHeader from './SidebarHeader';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';
import { usePermissions, PERMISSIONS } from '../../context/PermissionsContext';
import { myTasksAPI, getAssetUrl, currencyAPI } from '../../services/api';
import { setCurrencies } from '../../utils/currency';
import { getIcon } from '../layout/icons';
import { invitationIdsCoveredByNotifications } from '../../utils/invitationNotificationDedupe';
import { getTypeLabel, timeAgo } from '../../utils/notifications';

const Layout = ({ children, wide }) => {
  const { state, dispatch } = useAuth();
  const { state: companyState, selectCompany } = useCompany();
  const { totalUnreadCount, clearUnreadCount, fetchUnreadCount } = useSocket();
  const { hasPermission, companyData, designationName } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const { unreadCounts, unreadCountsByCompany: chatUnreadByCompany, fetchUnreadCounts, toggleGlobalChat } = useChat();
  const [pendingTasksByCompany, setPendingTasksByCompany] = useState({});

  const selectedCompanyId = companyState.selectedCompany?.id || 'personal';
  const selectedCompanyHeaderId = selectedCompanyId === 'personal' ? null : selectedCompanyId;

  const canManageSettings = hasPermission(PERMISSIONS.MANAGE_COMPANY_SETTINGS);
  const canViewDesignations = hasPermission(PERMISSIONS.VIEW_DESIGNATIONS);
  const canViewEmployees = hasPermission(PERMISSIONS.VIEW_EMPLOYEE_LIST);
  const canManageRecruitment = hasPermission(PERMISSIONS.MANAGE_RECRUITMENT);

  const closeMobileSidebar = React.useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarCollapsed(true);
    }
  }, []);

  useEffect(() => {
    closeMobileSidebar();
  }, [location.pathname, closeMobileSidebar]);

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
      // Remove company-specific filtering to match global Notifications page
      const [nr, ir] = await Promise.all([
        fetch('/api/notifications', { headers }),
        fetch('/api/invitations/my-invitations', { headers })
      ]);
      let combined = [];
      let dbNotifs = [];
      if (nr.ok) dbNotifs = (await nr.json()).notifications || [];
      const covered = invitationIdsCoveredByNotifications(dbNotifs);
      if (ir.ok) {
        const invs = await ir.json();
        const ins = (Array.isArray(invs) ? invs : [])
          .filter((i) => !covered.has(String(i._id)))
          .map((i) => ({
            _id: `inv_${i._id}`,
            type: 'invitation',
            title: `Invitation: ${i.company?.name}`,
            message: `Invited as ${i.designation} by ${i.invitedBy?.name}`,
            isRead: false,
            createdAt: i.createdAt,
            _invitationId: i._id
          }));
        combined = [...ins, ...dbNotifs].slice(0, 10); // Show more in dropdown
      } else {
        combined = dbNotifs.slice(0, 10);
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

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await currencyAPI.getAll();
        if (res.data && res.data.length > 0) setCurrencies(res.data);
      } catch (err) {
        console.error('Failed to fetch currencies', err);
      }
    };
    fetchCurrencies();
  }, []);

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

  const handleLogout = () => { closeMobileSidebar(); dispatch({ type: 'LOGOUT' }); navigate('/'); };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard', category: 'Main' },
    { path: '/projects', label: 'Projects', icon: 'projects', category: 'Main' },
    ...(state.user?.role !== 'superadmin' ? [
      { path: '/my-tasks', label: 'My Tasks', icon: 'tasks', category: 'Main' },
      { path: '/team-activity', label: 'Team Activity', icon: 'team', category: 'Main' }
    ] : []),
    ...(companyState.selectedCompany?.id !== 'personal' ? [
      { path: '/overview', label: 'Overview', icon: 'overview', category: 'Management' },
      ...(canViewEmployees ? [
        { path: '/employees', label: 'Employees', icon: 'employees', category: 'Management' },
        { path: '/organogram', label: 'Organogram', icon: 'organogram', category: 'Management' }
      ] : []),
      ...(canManageRecruitment ? [{ path: '/recruitment', label: 'Recruitment', icon: 'careers', category: 'Management' }] : []),
      ...(canViewDesignations ? [{ path: '/manage-roles', label: 'Roles & Access', icon: 'roles', category: 'Management' }] : []),
      { path: '/leaves', label: 'Leaves', icon: 'leaves', category: 'Management' },
      { path: '/holidays', label: 'Holidays', icon: 'holidays', category: 'Management' }
    ] : []),
    ...(state.user?.role === 'admin' || state.user?.role === 'superadmin' ? [
      { path: '/users', label: 'Users', icon: 'users', category: 'Administration' },
      { path: '/companies', label: 'Companies', icon: 'companies', category: 'Administration' }
    ] : []),
    ...(state.user?.role === 'superadmin' ? [
      { path: '/currencies', label: 'Currencies', icon: 'currencies', category: 'Administration' },
      { path: '/admin/subscribers', label: 'Subscribers List', icon: 'team', category: 'Administration' },
      { path: '/admin/subscription-settings', label: 'Subscription Settings', icon: 'settings', category: 'Administration' }
    ] : []),


    ...(canManageSettings && companyState.selectedCompany?.id !== 'personal' ? [
      { path: '/company-settings', label: 'Settings', icon: 'settings', category: 'System' }
    ] : [])
  ];

  const handleCompanySelect = async (c) => {
    closeMobileSidebar();
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
      '/profile': 'Profile Settings',
      '/admin/subscribers': 'Subscribers Directory',
      '/admin/subscription': 'Subscription Settings',
      '/admin/subscription-settings': 'Subscription Settings'
    };


    if (location.pathname.startsWith('/employees/')) return 'Employee Details';
    return titles[location.pathname] || 'Offtix';
  };

  const getLogoUrl = getAssetUrl;

  const ChatHeaderIcon = getIcon('chat');
  const BellHeaderIcon = getIcon('bell');

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden relative">
      {/* Mobile Backdrop */}
      {!sidebarCollapsed && (
        <div
          onClick={() => setSidebarCollapsed(true)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[999] lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen bg-white text-slate-700 flex flex-col transition-all duration-300 ease-in-out shadow-[0_0_20px_rgba(0,0,0,0.03)] z-[1000] border-r border-slate-200/60 ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-72'}`}>
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
          <div className={`workspace-modal absolute ${sidebarCollapsed ? 'top-16 left-20 w-72' : 'top-20 left-3 right-3'} bg-white border border-slate-200/90 rounded-2xl shadow-2xl shadow-slate-900/10 z-[1001] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-slate-900/5`}>
            
            {/* Header */}
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Workspaces</span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">
                {(companyState.companies?.length || 0) + 1}
              </span>
            </div>

            {/* List */}
            <div className="p-1.5 space-y-1 max-h-[280px] overflow-y-auto scrollbar-thin">
              {/* Personal Workspace */}
              <div
                onClick={() => handleCompanySelect('Personal')}
                className={`group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 border ${
                  (companyState.selectedCompany?.id || companyState.selectedCompany?._id) === 'personal'
                    ? 'bg-indigo-50/90 border-indigo-200/80 text-indigo-900 font-bold shadow-xs'
                    : 'border-transparent hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-xs font-black text-white shadow-xs group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                  P
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate leading-tight">Personal Workspace</p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight mt-0.5">Private Projects</p>
                </div>
                {(companyState.selectedCompany?.id || companyState.selectedCompany?._id) === 'personal' && (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Organization Workspaces */}
              {companyState.companies.map((c) => {
                const isSelected = (companyState.selectedCompany?.id || companyState.selectedCompany?._id) === (c.id || c._id);
                return (
                  <div
                    key={c.id || c._id}
                    onClick={() => handleCompanySelect(c)}
                    className={`group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 border ${
                      isSelected
                        ? 'bg-indigo-50/90 border-indigo-200/80 text-indigo-900 font-bold shadow-xs'
                        : 'border-transparent hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 border border-slate-100 flex items-center justify-center text-xs font-bold text-white shadow-xs group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                      {c.logo ? (
                        <img src={getLogoUrl(c.logo)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        c.name?.charAt(0)?.toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate leading-tight">{c.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight mt-0.5">Organization</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add New Organization CTA */}
            <div className="p-2.5 bg-slate-50/80 border-t border-slate-100">
              <button
                onClick={() => handleCompanySelect('Create Company')}
                className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add New Organization</span>
              </button>
            </div>

          </div>
        )}


        <nav className={`flex-1 overflow-y-auto scrollbar-none pt-2 pb-6 space-y-1 ${sidebarCollapsed ? 'px-3' : 'px-4'}`}>
          {menuItems.map((item, idx) => {
            const active = location.pathname === item.path || (item.path === '/employees' && location.pathname.startsWith('/employees/')) || (item.path === '/projects' && location.pathname.startsWith('/projects/')) || (item.path === '/my-tasks' && location.pathname.startsWith('/my-tasks/'));
            const showCat = !sidebarCollapsed && (idx === 0 || menuItems[idx - 1].category !== item.category);
            const Icon = getIcon(item.icon);
            return (
              <React.Fragment key={item.path}>
                {showCat && <div className={`px-4 ${idx === 0 ? 'mt-0' : 'mt-8'} mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-[2px]`}>{item.category}</div>}
                <Link
                  to={item.path}
                  onClick={closeMobileSidebar}
                  className={`group flex items-center gap-4 cursor-pointer rounded-xl transition-all duration-200 relative ${sidebarCollapsed ? 'p-3 justify-center mb-1' : 'p-3 px-4 mb-0.5'} 
                    ${active
                      ? 'bg-slate-100 text-slate-900 shadow-none'
                      : 'text-slate-500 hover:bg-slate-50/80 hover:text-indigo-600'}`}
                >
                  <div className={`transition-transform duration-200 ${active ? 'scale-105 text-indigo-600' : 'group-hover:scale-105 text-slate-400 group-hover:text-indigo-600'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {!sidebarCollapsed && <span className={`flex-1 text-[13px] tracking-tight ${active ? 'text-slate-900 font-black' : 'text-slate-600 font-medium group-hover:text-indigo-600'}`}>{item.label}</span>}
                  {!sidebarCollapsed && active && <div className="w-1.5 h-6 rounded-l-full bg-indigo-600 absolute right-0" />}
                </Link>
              </React.Fragment>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-5 mt-auto bg-slate-50/50 border-t border-slate-100 shadow-[0_-5px_15px_rgba(0,0,0,0.01)]">
          {!sidebarCollapsed ? (
            <div className="space-y-4">
              <div
                onClick={() => { closeMobileSidebar(); navigate('/profile'); }}
                className="group flex items-center gap-3.5 p-2 rounded-xl cursor-pointer hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-md group-hover:scale-105 transition-transform overflow-hidden">
                  {(state.user?.profilePicture || state.user?.profile?.profilePicture) ? (
                    <img src={getLogoUrl(state.user.profilePicture || state.user.profile?.profilePicture)} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : state.user?.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 truncate leading-tight group-hover:text-indigo-600 transition-colors">{state.user?.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                      (state.user?.role === 'superadmin' || state.user?.subscription?.plan === 'premium' || companyState?.selectedCompany?.subscription?.plan === 'premium')
                        ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-extrabold shadow-xs'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {(state.user?.role === 'superadmin' || state.user?.subscription?.plan === 'premium' || companyState?.selectedCompany?.subscription?.plan === 'premium') ? '⚡ Premium' : 'Free'}
                    </span>

                  </div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">
                    {designationName || (companyState.selectedCompany?.id === 'personal' ? (state.user?.role || 'Team Member') : (state.user?.role || 'Team Member'))}
                  </p>
                </div>

              </div>
              <button onClick={handleLogout} className="w-full py-3 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl text-xs font-bold transition-all border border-slate-200/60 shadow-sm flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Sign Out of Account
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div onClick={() => { closeMobileSidebar(); navigate('/profile'); }} className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-lg cursor-pointer hover:scale-110 transition-transform shadow-md overflow-hidden">
                {(state.user?.profilePicture || state.user?.profile?.profilePicture) ? (
                  <img src={getLogoUrl(state.user.profilePicture || state.user.profile?.profilePicture)} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : state.user?.name?.charAt(0)}
              </div>
              <button onClick={handleLogout} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm group">
                <span className="group-hover:scale-110 transition-transform">🔒</span>
              </button>
            </div>
          )}
        </div>
      </aside>


      {/* Main Content Area */}
      <main className={`flex flex-col flex-1 ${sidebarCollapsed ? 'ml-0 lg:ml-20' : 'ml-0 lg:ml-72'} transition-all duration-300 ease-in-out h-screen overflow-hidden`}>
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg lg:text-xl font-bold text-slate-800 truncate"> {getPageTitle()} </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Jobs Public Careers Link */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 shadow-xs mr-2 group"
            >
              <span className="text-sm">🌐</span>
              <span className="hidden sm:inline">Jobs</span>
            </a>


            {/* Chat Icon */}
            <div onClick={() => toggleGlobalChat()} className="relative w-10 h-10 flex items-center justify-center rounded-xl cursor-pointer hover:bg-slate-50 transition-all border border-slate-200 text-slate-500 hover:text-indigo-600 shadow-sm active:scale-95 group">
              <ChatHeaderIcon className="w-5 h-5 transition-colors" />
              {unreadCounts.total > 0 && (
                <div className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white font-bold text-[9px] min-w-[20px] h-5 rounded-full flex items-center justify-center border-2 border-white px-1 shadow-sm">
                  {unreadCounts.total > 99 ? '99+' : unreadCounts.total}
                </div>
              )}
            </div>

            {/* Notification Icon */}
            <div className="notif-dropdown-container relative">
              <div onClick={toggleNotifDropdown} className={`w-10 h-10 flex items-center justify-center rounded-xl cursor-pointer transition-all border shadow-sm active:scale-95 group ${isNotifDropdownOpen ? 'bg-slate-100 border-slate-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600'}`}>
                <BellHeaderIcon className="w-5 h-5 transition-colors" />
                {totalUnreadCount > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-bold text-[9px] min-w-[20px] h-5 rounded-full flex items-center justify-center border-2 border-white px-1 shadow-sm">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </div>
                )}
              </div>
              {isNotifDropdownOpen && (
                <div className="absolute top-full mt-2 right-0 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-[1000] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Recent Activity</h4>
                    <button onClick={() => { setIsNotifDropdownOpen(false); navigate('/notifications'); }} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors">View All</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
                    {notifLoading ? (
                      <div className="p-10 text-center text-slate-400 text-xs font-bold animate-pulse uppercase tracking-widest">Synchronizing...</div>
                    ) : recentNotifications.length === 0 ? (
                      <div className="p-10 text-center">
                        <p className="text-sm font-bold text-slate-300">No new alerts</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">Everything caught up</p>
                      </div>
                    ) : recentNotifications.map((n) => {
                      const label = getTypeLabel(n.type);
                      return (
                        <div key={n._id} onClick={() => {
                          setIsNotifDropdownOpen(false);
                          const syntheticInvite = String(n._id).startsWith('inv_');
                          const invId = n._invitationId || (n.type === 'invitation' && n.relatedId && (n.relatedModel === 'Invitation' || !n.relatedModel) ? String(n.relatedId) : null);
                          if (invId && (syntheticInvite || n.type === 'invitation')) {
                            if (!n.isRead && !syntheticInvite) markNotifAsRead(n._id);
                            navigate(`/invitations/${invId}`);
                            return;
                          }
                          if (!n.isRead && !syntheticInvite) markNotifAsRead(n._id);
                          if (n.type === 'job_offer' && n.relatedId) {
                            navigate(`/recruitment/offer/${n.relatedId}`);
                            return;
                          }
                          const tid = n.metadata?.taskId || n.relatedId;
                          navigate(tid && (n.relatedModel === 'Task' || n.type?.startsWith('task_')) ? `/my-tasks/${tid}` : '/notifications');
                        }} className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors relative ${!n.isRead && 'bg-indigo-50/40'}`}>
                          {!n.isRead && (
                             <span className="absolute left-2 top-5 w-1.5 h-1.5 bg-indigo-600 rounded-full shadow-sm shadow-indigo-200" />
                          )}
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200/50">{label}</span>
                            <span className="text-[10px] font-bold text-slate-400">{timeAgo(n.createdAt)}</span>
                          </div>
                          <p className={`text-[13px] font-bold truncate ${!n.isRead ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</p>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{n.message}</p>
                        </div>
                      );
                    })}
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
        <main className="flex-1 overflow-y-auto py-6 px-6 lg:px-10">
          <div className={wide ? 'w-full max-w-none' : 'max-w-7xl mx-auto'}>
            {children}
          </div>
        </main>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        .scrollbar-none::-webkit-scrollbar { display: none; }
      ` }} />
    </div>
  );
};

export default Layout;
