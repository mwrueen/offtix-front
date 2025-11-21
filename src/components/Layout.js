import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCookie } from '../utils/cookies';
import { companyAPI } from '../services/api';

const Layout = ({ children }) => {
  const { state, dispatch } = useAuth();
  const { state: companyState, selectCompany } = useCompany();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [companyData, setCompanyData] = useState(null);
  const [canManageSettings, setCanManageSettings] = useState(false);

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = getCookie('authToken');
        const response = await fetch('/api/invitations/my-invitations', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.length);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch company data and check permissions
  useEffect(() => {
    const fetchCompanyPermissions = async () => {
      if (!companyState.selectedCompany || companyState.selectedCompany.id === 'personal') {
        setCanManageSettings(false);
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

        let hasPermission = false;
        if (isOwner || isSuperAdmin) {
          hasPermission = true;
        } else {
          const memberInfo = company.members?.find(m => {
            const memberId = m.user?._id || m.user;
            return memberId?.toString() === userId?.toString();
          });
          if (memberInfo) {
            const designation = company.designations?.find(d => d.name === memberInfo.designation);
            if (designation?.permissions?.manageCompanySettings) {
              hasPermission = true;
            }
          }
        }

        console.log('Has permission to manage settings:', hasPermission);
        setCanManageSettings(hasPermission);
      } catch (error) {
        console.error('Error fetching company permissions:', error);
        setCanManageSettings(false);
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

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon, category: 'main' },
    { path: '/projects', label: 'Projects', icon: ProjectsIcon, category: 'main' },
    { path: '/overview', label: 'Overview', icon: OverviewIcon, category: 'main' },
    ...(companyState.selectedCompany?.id !== 'personal' ? [
      { path: '/employees', label: 'Employees', icon: EmployeesIcon, category: 'company' },
      { path: '/leaves', label: 'Leaves', icon: LeavesIcon, category: 'company' },
      { path: '/holidays', label: 'Holidays', icon: HolidaysIcon, category: 'company' }
    ] : []),
    ...(state.user?.role === 'admin' || state.user?.role === 'superadmin' ? [
      { path: '/users', label: 'Users', icon: UsersIcon, category: 'admin' }
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
      '/profile': 'My Profile'
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
        <div style={{
          padding: sidebarCollapsed ? '20px 12px' : '24px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: sidebarCollapsed ? 'center' : 'flex-start',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)',
          position: 'relative'
        }}>
          {sidebarCollapsed ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: '700',
                color: 'white',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
              }}>
                T
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, marginRight: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                }}>
                  T
                </div>
                <div>
                  <h2 style={{
                    margin: 0,
                    color: '#ffffff',
                    fontSize: '20px',
                    fontWeight: '700',
                    letterSpacing: '-0.3px'
                  }}>Tabredon</h2>
                  <p style={{
                    margin: 0,
                    fontSize: '11px',
                    color: '#94a3b8',
                    fontWeight: '500'
                  }}>Project Management</p>
                </div>
              </div>

              {/* Company Selector Dropdown */}
              <div className="company-dropdown" style={{ position: 'relative' }}>
                <div style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  marginBottom: '8px',
                  paddingLeft: '2px'
                }}>
                  Workspace
                </div>
                <button
                  onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: isCompanyDropdownOpen
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.1))'
                      : 'rgba(255, 255, 255, 0.06)',
                    border: `1px solid ${isCompanyDropdownOpen ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isCompanyDropdownOpen
                      ? '0 4px 12px rgba(59, 130, 246, 0.15)'
                      : '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCompanyDropdownOpen) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCompanyDropdownOpen) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: companyState.selectedCompany?.id === 'personal'
                        ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                        : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                    }}>
                      {companyState.selectedCompany?.id === 'personal' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      ) : (
                        <CompanyIcon size={16} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#ffffff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: '2px'
                      }}>
                        {companyState.selectedCompany?.name || 'Select Workspace'}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#94a3b8',
                        fontWeight: '500'
                      }}>
                        {companyState.selectedCompany?.id === 'personal'
                          ? 'Personal workspace'
                          : companyState.companies.length > 0
                            ? `${companyState.companies.length} workspace${companyState.companies.length !== 1 ? 's' : ''}`
                            : 'No workspace'}
                      </div>
                    </div>
                  </div>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform: isCompanyDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      opacity: 0.7,
                      flexShrink: 0
                    }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isCompanyDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '10px',
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
                        padding: '12px 14px 8px',
                        fontSize: '10px',
                        fontWeight: '600',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                      }}>
                        Your Workspaces
                      </div>
                    )}

                    {/* Company List */}
                    <div style={{ padding: '6px' }}>
                      {companyState.companies.map((company) => (
                        <div
                          key={company.id}
                          onClick={() => handleCompanySelect(company)}
                          style={{
                            padding: '10px 12px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: '#f1f5f9',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            marginBottom: '2px',
                            background: companyState.selectedCompany?.id === company.id
                              ? 'rgba(59, 130, 246, 0.15)'
                              : 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = companyState.selectedCompany?.id === company.id
                              ? 'rgba(59, 130, 246, 0.2)'
                              : 'rgba(255, 255, 255, 0.08)';
                            e.currentTarget.style.transform = 'translateX(2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = companyState.selectedCompany?.id === company.id
                              ? 'rgba(59, 130, 246, 0.15)'
                              : 'transparent';
                            e.currentTarget.style.transform = 'translateX(0)';
                          }}
                        >
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
                          }}>
                            <CompanyIcon size={14} />
                          </div>
                          <span style={{ flex: 1, fontWeight: '500' }}>{company.name}</span>
                          {companyState.selectedCompany?.id === company.id && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                          padding: '10px 12px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: '#f1f5f9',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          background: companyState.selectedCompany?.id === 'personal'
                            ? 'rgba(139, 92, 246, 0.15)'
                            : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = companyState.selectedCompany?.id === 'personal'
                            ? 'rgba(139, 92, 246, 0.2)'
                            : 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.transform = 'translateX(2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = companyState.selectedCompany?.id === 'personal'
                            ? 'rgba(139, 92, 246, 0.15)'
                            : 'transparent';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 2px 6px rgba(139, 92, 246, 0.3)'
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </div>
                        <span style={{ flex: 1, fontWeight: '500' }}>Personal</span>
                        {companyState.selectedCompany?.id === 'personal' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Separator */}
                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '6px 14px' }} />

                    {/* Create Company Option */}
                    <div style={{ padding: '8px' }}>
                      <div
                        onClick={() => handleCompanySelect('Create Company')}
                        style={{
                          padding: '12px 14px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                          color: 'white',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb, #1d4ed8)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              </div>
            </div>
          )}
          
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                padding: '8px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.color = '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                e.target.style.color = '#94a3b8';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
          )}
          
          {/* Collapsed Toggle Button */}
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                position: 'absolute',
                top: '50%',
                right: '-16px',
                transform: 'translateY(-50%)',
                background: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                padding: '6px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                zIndex: 1000
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                e.target.style.color = '#3b82f6';
                e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#1e293b';
                e.target.style.color = '#94a3b8';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(180deg)' }}>
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
          )}
        </div>

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
              {/* Notification Bell */}
              <div
                onClick={() => navigate('/notifications')}
                style={{
                  position: 'relative',
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'white',
                  border: '1px solid #e2e8f0',
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
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
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