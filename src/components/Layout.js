import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCookie } from '../utils/cookies';
import { companyAPI } from '../services/api';
import SidebarHeader from './SidebarHeader';
import { useSocket } from '../context/SocketContext';

const Layout = ({ children }) => {
  const { state, dispatch } = useAuth();
  const { state: companyState, selectCompany } = useCompany();
  const { unreadCount, clearUnreadCount, fetchUnreadCount } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const [canManageSettings, setCanManageSettings] = useState(false);
  const [canViewDesignations, setCanViewDesignations] = useState(false);
  const [canViewEmployees, setCanViewEmployees] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isCompanyDropdownOpen && !event.target.closest('.workspace-modal') && !event.target.closest('.sidebar-header')) {
        setIsCompanyDropdownOpen(false);
      }
      if (isNotifDropdownOpen && !event.target.closest('.notif-dropdown-container')) {
        setIsNotifDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCompanyDropdownOpen, isNotifDropdownOpen]);

  // Fetch recent notifications for dropdown
  const fetchRecentNotifications = async () => {
    setNotifLoading(true);
    try {
      const token = getCookie('authToken');
      const [notifRes, invRes] = await Promise.all([
        fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/invitations/my-invitations', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      let combined = [];
      if (notifRes.ok) {
        const data = await notifRes.json();
        combined = (data.notifications || []).slice(0, 8);
      }
      if (invRes.ok) {
        const invData = await invRes.json();
        const invNotifs = (Array.isArray(invData) ? invData : []).map(inv => ({
          _id: `inv_${inv._id}`,
          type: 'invitation',
          title: `Invitation: ${inv.company?.name}`,
          message: `Invited as ${inv.designation} by ${inv.invitedBy?.name}`,
          isRead: false,
          createdAt: inv.createdAt,
          _invitationId: inv._id
        }));
        combined = [...invNotifs, ...combined].slice(0, 8);
      }
      setRecentNotifications(combined);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setNotifLoading(false);
    }
  };

  const toggleNotifDropdown = () => {
    const next = !isNotifDropdownOpen;
    setIsNotifDropdownOpen(next);
    if (next) fetchRecentNotifications();
  };

  const markNotifAsRead = async (id) => {
    try {
      const token = getCookie('authToken');
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      setRecentNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      fetchUnreadCount();
    } catch { }
  };

  const notifTypeConfig = {
    task_ready: { icon: '✅', color: '#10b981' },
    task_send_back: { icon: '↩️', color: '#f59e0b' },
    task_role_handoff: { icon: '🔄', color: '#3b82f6' },
    task_role_assignment: { icon: '🎯', color: '#8b5cf6' },
    task_role_completed: { icon: '🏁', color: '#10b981' },
    project_assignment: { icon: '📁', color: '#06b6d4' },
    salary_update: { icon: '💰', color: '#22c55e' },
    invitation: { icon: '✉️', color: '#3b82f6' },
    general: { icon: '🔔', color: '#64748b' },
  };

  const getNotifConfig = (type) => notifTypeConfig[type] || notifTypeConfig.general;

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Sync notification count when visiting /notifications
  useEffect(() => {
    if (location.pathname === '/notifications') {
      clearUnreadCount();
    }
  }, [location.pathname, clearUnreadCount]);

  // Re-fetch count on mount so it is accurate after page refresh
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Fetch company data and check permissions
  useEffect(() => {
    const fetchCompanyPermissions = async () => {
      if (!companyState.selectedCompany || companyState.selectedCompany.id === 'personal') {
        setCanManageSettings(false);
        setCanViewDesignations(false);
        setCanViewEmployees(false);
        setCompanyData(null);
        return;
      }

      try {
        const response = await companyAPI.getById(companyState.selectedCompany.id);
        const company = response.data;
        setCompanyData(company);

        // Check if user has permission to manage company settings
        const userId = state.user?._id;
        const ownerId = company.owner?._id || company.owner;
        const isOwner = ownerId?.toString() === userId?.toString();
        const isSuperAdmin = state.user?.role === 'superadmin';

        console.log('Permission check:', {
          userId,
          ownerId,
          isOwner,
          isSuperAdmin,
          companyName: company.name
        });

        // Get user's designation and permissions
        let userPermissions = null;
        if (isOwner || isSuperAdmin) {
          // Owner and superadmin have all permissions
          userPermissions = {
            manageCompanySettings: true,
            viewDesignations: true,
            viewEmployeeList: true
          };
        } else {
          const memberInfo = company.members?.find(m => {
            const memberId = m.user?._id || m.user;
            return memberId?.toString() === userId?.toString();
          });
          if (memberInfo) {
            const designation = company.designations?.find(d => d.name === memberInfo.designation);
            if (designation?.permissions) {
              userPermissions = designation.permissions;
            }
          }
        }

        // Set permission states
        if (userPermissions) {
          setCanManageSettings(userPermissions.manageCompanySettings || false);
          setCanViewDesignations(userPermissions.viewDesignations || false);
          setCanViewEmployees(userPermissions.viewEmployeeList || false);
        } else {
          // Default permissions for non-members
          setCanManageSettings(false);
          setCanViewDesignations(true); // Default: can view designations
          setCanViewEmployees(true); // Default: can view employees
        }

        console.log('User permissions:', userPermissions);
      } catch (error) {
        console.error('Error fetching company permissions:', error);
        setCanManageSettings(false);
        setCanViewDesignations(false);
        setCanViewEmployees(false);
        setCompanyData(null);
      }
    };

    fetchCompanyPermissions();
  }, [companyState.selectedCompany, state.user]);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/');
  };

  // SVG Icon Components
  const DashboardIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  );

  const ProjectsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
  );

  const OverviewIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  );

  const UsersIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );

  const CompanyIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1"></rect>
      <rect x="14" y="3" width="7" height="5" rx="1"></rect>
      <rect x="14" y="12" width="7" height="9" rx="1"></rect>
      <rect x="3" y="16" width="7" height="5" rx="1"></rect>
    </svg>
  );

  const SettingsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M12 1v6m0 6v6m5.66-13.66l-4.24 4.24m0 6l-4.24 4.24M23 12h-6m-6 0H1m18.66 5.66l-4.24-4.24m0-6l-4.24-4.24"></path>
    </svg>
  );

  const EmployeesIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="8.5" cy="7" r="4"></circle>
      <line x1="20" y1="8" x2="20" y2="14"></line>
      <line x1="23" y1="11" x2="17" y2="11"></line>
    </svg>
  );

  const HolidaysIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );

  const LeavesIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
      <path d="M22 11h-4"></path>
    </svg>
  );

  const WorkforceIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      <rect x="18" y="8" width="4" height="4" rx="1"></rect>
    </svg>
  );

  const OrganogramIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="4" rx="1"></rect>
      <rect x="3" y="10" width="6" height="4" rx="1"></rect>
      <rect x="15" y="10" width="6" height="4" rx="1"></rect>
      <rect x="3" y="18" width="6" height="4" rx="1"></rect>
      <rect x="15" y="18" width="6" height="4" rx="1"></rect>
      <line x1="12" y1="6" x2="12" y2="10"></line>
      <line x1="6" y1="10" x2="6" y2="10"></line>
      <line x1="18" y1="10" x2="18" y2="10"></line>
      <line x1="6" y1="14" x2="6" y2="18"></line>
      <line x1="18" y1="14" x2="18" y2="18"></line>
      <path d="M6 10h12"></path>
    </svg>
  );

  const ManageRolesIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
      <path d="M2 17l10 5 10-5"></path>
      <path d="M2 12l10 5 10-5"></path>
    </svg>
  );

  const MyTasksIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path>
      <rect x="9" y="3" width="6" height="4" rx="1"></rect>
      <path d="M9 12l2 2 4-4"></path>
    </svg>
  );

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon, category: 'main' },
    { path: '/projects', label: 'Projects', icon: ProjectsIcon, category: 'main' },
    ...(state.user?.role !== 'superadmin' ? [
      { path: '/my-tasks', label: 'My Tasks', icon: MyTasksIcon, category: 'main' }
    ] : []),
    ...(companyState.selectedCompany?.id !== 'personal' ? [
      { path: '/overview', label: 'Overview', icon: OverviewIcon, category: 'main' }
    ] : []),
    ...(companyState.selectedCompany?.id !== 'personal' && canViewEmployees ? [
      { path: '/employees', label: 'Employees', icon: EmployeesIcon, category: 'company' },
      { path: '/organogram', label: 'Org Chart', icon: OrganogramIcon, category: 'company' }
    ] : []),
    ...(companyState.selectedCompany?.id !== 'personal' && canViewDesignations ? [
      { path: '/manage-roles', label: 'Manage Roles', icon: ManageRolesIcon, category: 'company' }
    ] : []),
    ...(companyState.selectedCompany?.id !== 'personal' ? [
      { path: '/leaves', label: 'Leaves', icon: LeavesIcon, category: 'company' },
      { path: '/holidays', label: 'Holidays', icon: HolidaysIcon, category: 'company' }
    ] : []),
    ...(canManageSettings && companyState.selectedCompany?.id !== 'personal' ? [
      { path: '/workforce', label: 'Workforce', icon: WorkforceIcon, category: 'company' }
    ] : []),
    ...(state.user?.role === 'admin' || state.user?.role === 'superadmin' ? [
      { path: '/users', label: 'Users', icon: UsersIcon, category: 'admin' },
      { path: '/companies', label: 'Companies', icon: CompanyIcon, category: 'admin' }
    ] : []),
    ...(canManageSettings && companyState.selectedCompany?.id !== 'personal' ? [
      { path: '/company-settings', label: 'Settings', icon: SettingsIcon, category: 'company' }
    ] : [])
  ];

  const handleCompanySelect = async (company) => {
    if (company === 'Personal') {
      selectCompany({ id: 'personal', name: 'Personal' });
    } else if (company === 'Create Company') {
      navigate('/create-company');
    } else {
      selectCompany(company);
    }
    setIsCompanyDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isCompanyDropdownOpen && !event.target.closest('.company-dropdown')) {
        setIsCompanyDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCompanyDropdownOpen]);

  const getPageTitle = () => {
    const titles = {
      '/dashboard': 'Dashboard',
      '/projects': 'Projects',
      '/overview': 'Overview',
      '/users': 'Users',
      '/employees': 'Employees',
      '/leaves': 'Leave Management',
      '/holidays': 'Holidays',
      '/profile': 'My Profile',
      '/workforce': 'Workforce'
    };

    // Handle dynamic routes
    if (location.pathname.startsWith('/employees/')) {
      return 'Employee Details';
    }

    return titles[location.pathname] || 'Tabredon';
  };

  const sidebarWidth = sidebarCollapsed ? '80px' : '280px';

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarWidth,
        height: '100vh',
        background: '#0f172a',
        color: '#f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        transition: 'width 0.3s ease',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.12)',
        zIndex: 1000
      }}>
        {/* Logo & Toggle */}
        <SidebarHeader
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          selectedCompany={companyState.selectedCompany}
          companyData={companyData}
          onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
          isDropdownOpen={isCompanyDropdownOpen}
        />

        {/* Workspace Switcher Modal */}
        {isCompanyDropdownOpen && (
          <div
            className="workspace-modal"
            style={{
              position: 'absolute',
              top: sidebarCollapsed ? '80px' : '120px',
              left: sidebarCollapsed ? '80px' : '20px',
              right: sidebarCollapsed ? 'auto' : '20px',
              width: sidebarCollapsed ? '320px' : 'auto',
              background: 'linear-gradient(to bottom, #1e293b, #1a2332)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              zIndex: 1001,
              maxHeight: '400px',
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
              animation: 'slideDown 0.2s ease-out'
            }}>
            {/* Header */}
            {companyState.companies.length > 0 && (
              <div style={{
                padding: '14px 16px 10px',
                fontSize: '10px',
                fontWeight: '700',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                YOUR WORKSPACES
              </div>
            )}

            {/* Company List */}
            <div style={{ padding: '6px' }}>
              {companyState.companies.map((company) => (
                <div
                  key={company.id}
                  onClick={() => handleCompanySelect(company)}
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#f1f5f9',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    marginBottom: '4px',
                    background: companyState.selectedCompany?.id === company.id
                      ? 'rgba(59, 130, 246, 0.18)'
                      : 'transparent',
                    border: companyState.selectedCompany?.id === company.id
                      ? '1px solid rgba(59, 130, 246, 0.3)'
                      : '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = companyState.selectedCompany?.id === company.id
                      ? 'rgba(59, 130, 246, 0.25)'
                      : 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'translateX(3px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = companyState.selectedCompany?.id === company.id
                      ? 'rgba(59, 130, 246, 0.18)'
                      : 'transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)',
                    overflow: 'hidden'
                  }}>
                    {company.logo ? (
                      <img
                        src={company.logo}
                        alt={company.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: 'white'
                      }}>
                        {company.name?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                    )}
                  </div>
                  <span style={{
                    flex: 1,
                    fontWeight: '600',
                    letterSpacing: '-0.2px'
                  }}>
                    {company.name}
                  </span>
                  {companyState.selectedCompany?.id === company.id && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
              ))}
            </div>

            {/* Separator */}
            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '6px 14px' }} />

            {/* Personal Option */}
            <div style={{ padding: '6px' }}>
              <div
                onClick={() => handleCompanySelect('Personal')}
                style={{
                  padding: '12px 14px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#f1f5f9',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: companyState.selectedCompany?.id === 'personal'
                    ? 'rgba(139, 92, 246, 0.18)'
                    : 'transparent',
                  border: companyState.selectedCompany?.id === 'personal'
                    ? '1px solid rgba(139, 92, 246, 0.3)'
                    : '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = companyState.selectedCompany?.id === 'personal'
                    ? 'rgba(139, 92, 246, 0.25)'
                    : 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateX(3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = companyState.selectedCompany?.id === 'personal'
                    ? 'rgba(139, 92, 246, 0.18)'
                    : 'transparent';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(139, 92, 246, 0.3)'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <span style={{
                  flex: 1,
                  fontWeight: '600',
                  letterSpacing: '-0.2px'
                }}>
                  Personal
                </span>
                {companyState.selectedCompany?.id === 'personal' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </div>
            </div>

            {/* Separator */}
            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '6px 14px' }} />

            {/* Create Company Option */}
            <div style={{ padding: '6px' }}>
              <div
                onClick={() => handleCompanySelect('Create Company')}
                style={{
                  padding: '14px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  letterSpacing: '-0.2px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb, #1d4ed8)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.35)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Create New Workspace</span>
              </div>
            </div>
          </div>
        )}

        {/* Add CSS animation */}
        <style>{`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>



        {/* Navigation */}
        <nav style={{
          flex: 1,
          padding: sidebarCollapsed ? '16px 12px' : '20px 16px',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent'
        }}>
          {/* Main Navigation Label */}
          {!sidebarCollapsed && (
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '12px',
              paddingLeft: '12px'
            }}>
              Main Menu
            </div>
          )}

          {menuItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path === '/employees' && location.pathname.startsWith('/employees/'));
            const IconComponent = item.icon;

            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  padding: sidebarCollapsed ? '12px' : '12px 16px',
                  margin: '4px 0',
                  cursor: 'pointer',
                  background: isActive
                    ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                    : 'transparent',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: sidebarCollapsed ? '0' : '12px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#f1f5f9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  opacity: isActive ? 1 : 0.8
                }}>
                  <IconComponent />
                </div>
                {!sidebarCollapsed && (
                  <span style={{
                    fontWeight: isActive ? '600' : '500',
                    fontSize: '14px',
                    flex: 1
                  }}>
                    {item.label}
                  </span>
                )}
                {!sidebarCollapsed && isActive && (
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    boxShadow: '0 0 8px rgba(255, 255, 255, 0.5)'
                  }} />
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div style={{
          padding: sidebarCollapsed ? '16px 12px' : '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          {!sidebarCollapsed ? (
            <div>
              <div
                onClick={() => navigate('/profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: location.pathname === '/profile'
                    ? 'rgba(59, 130, 246, 0.15)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${location.pathname === '/profile' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
                  transition: 'all 0.2s',
                  marginBottom: '12px'
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== '/profile') {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== '/profile') {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}>
                  {state.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#f1f5f9',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {state.user?.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {state.user?.email}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.15)';
                  e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.target.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div
                onClick={() => navigate('/profile')}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }}
              >
                {state.user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: '44px',
                  height: '44px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        marginLeft: sidebarWidth,
        transition: 'margin-left 0.3s ease'
      }}>
        {/* Header */}
        <header style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          padding: '24px 32px',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                margin: 0,
                color: '#1e293b',
                fontSize: '28px',
                fontWeight: '700',
                letterSpacing: '-0.5px'
              }}>
                {getPageTitle()}
              </h1>
              <p style={{
                margin: '4px 0 0 0',
                color: '#64748b',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Welcome back, {state.user?.name}
              </p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              {/* Notification Bell + Dropdown */}
              <div
                className="notif-dropdown-container"
                style={{ position: 'relative' }}
              >
                {/* Bell Button */}
                <div
                  onClick={toggleNotifDropdown}
                  style={{
                    position: 'relative',
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: isNotifDropdownOpen ? '#eff6ff' : 'white',
                    border: `1px solid ${isNotifDropdownOpen ? '#93c5fd' : '#e2e8f0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isNotifDropdownOpen ? '#3b82f6' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      minWidth: '20px',
                      height: '20px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 6px',
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                      border: '2px solid white'
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </div>

                {/* Dropdown Panel */}
                {isNotifDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 12px)',
                    right: 0,
                    width: '380px',
                    maxHeight: '520px',
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
                    border: '1px solid #e2e8f0',
                    zIndex: 999,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'notifSlideDown 0.2s ease-out'
                  }}>
                    <style>{`
                      @keyframes notifSlideDown {
                        from { opacity: 0; transform: translateY(-8px); }
                        to   { opacity: 1; transform: translateY(0); }
                      }
                    `}</style>

                    {/* Dropdown Header */}
                    <div style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)'
                    }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Notifications</div>
                        {unreadCount > 0 && (
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {unreadCount} unread
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => { setIsNotifDropdownOpen(false); navigate('/notifications'); }}
                        style={{
                          background: 'none', border: 'none', color: '#3b82f6',
                          cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                          padding: '6px 12px', borderRadius: '8px', transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        View All →
                      </button>
                    </div>

                    {/* Notification List */}
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                      {notifLoading ? (
                        <div style={{ padding: '32px', textAlign: 'center' }}>
                          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                          <div style={{ fontSize: '13px', color: '#64748b' }}>Loading...</div>
                        </div>
                      ) : recentNotifications.length === 0 ? (
                        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>All caught up!</div>
                          <div style={{ fontSize: '13px', color: '#64748b' }}>No notifications right now.</div>
                        </div>
                      ) : (
                        recentNotifications.map((notif) => {
                          const cfg = getNotifConfig(notif.type);
                          const isTask = notif.relatedModel === 'Task' || notif.type?.startsWith('task_');
                          return (
                            <div
                              key={notif._id}
                              onClick={() => {
                                if (!notif.isRead && !notif._id.startsWith('inv_')) markNotifAsRead(notif._id);
                                setIsNotifDropdownOpen(false);
                                if (isTask) {
                                  const taskId = notif.metadata?.taskId || notif.relatedId;
                                  if (taskId) navigate(`/my-tasks/${taskId}`);
                                  else navigate('/notifications');
                                } else {
                                  navigate('/notifications');
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',
                                padding: '14px 20px',
                                borderBottom: '1px solid #f8fafc',
                                cursor: 'pointer',
                                background: notif.isRead ? 'white' : `${cfg.color}08`,
                                transition: 'background 0.15s',
                                position: 'relative'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                              onMouseLeave={e => e.currentTarget.style.background = notif.isRead ? 'white' : `${cfg.color}08`}
                            >
                              {/* unread dot */}
                              {!notif.isRead && (
                                <div style={{
                                  position: 'absolute', top: '16px', right: '16px',
                                  width: '7px', height: '7px', borderRadius: '50%',
                                  background: cfg.color
                                }} />
                              )}
                              {/* icon */}
                              <div style={{
                                width: '38px', height: '38px', borderRadius: '10px',
                                background: `${cfg.color}15`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '18px', flexShrink: 0
                              }}>
                                {cfg.icon}
                              </div>
                              {/* text */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                  fontSize: '13px',
                                  fontWeight: notif.isRead ? '500' : '700',
                                  color: '#0f172a',
                                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                  marginBottom: '3px'
                                }}>
                                  {notif.title}
                                </div>
                                <div style={{
                                  fontSize: '12px', color: '#64748b', lineHeight: '1.4',
                                  overflow: 'hidden', display: '-webkit-box',
                                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                                }}>
                                  {notif.message}
                                </div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                  {timeAgo(notif.createdAt)}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    <div style={{
                      padding: '12px 20px',
                      borderTop: '1px solid #f1f5f9',
                      textAlign: 'center'
                    }}>
                      <button
                        onClick={() => { setIsNotifDropdownOpen(false); navigate('/notifications'); }}
                        style={{
                          width: '100%', padding: '10px',
                          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                          color: 'white', border: 'none', borderRadius: '10px',
                          fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                          transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(59,130,246,0.3)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb, #1d4ed8)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)'}
                      >
                        View All Notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#475569'
              }}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{
          flex: 1,
          padding: '32px',
          overflow: 'auto',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          minHeight: 'calc(100vh - 120px)'
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            width: '100%'
          }}>
            {children}
          </div>
        </main>
      </div>

    </div>
  );
};

export default Layout;