import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const { state, dispatch } = useAuth();
  const { state: companyState, selectCompany, createCompany } = useCompany();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', iconSvg: '📊' },
    { path: '/projects', label: 'Projects', icon: '📁', iconSvg: '📁' },
    { path: '/overview', label: 'Overview', icon: '🧭', iconSvg: '🧭' },
    ...(state.user?.role === 'admin' || state.user?.role === 'superadmin' ? [
      { path: '/users', label: 'Users', icon: '👥', iconSvg: '👥' }
    ] : [])
  ];

  const handleCompanySelect = async (company) => {
    if (company === 'Personal') {
      selectCompany({ id: 'personal', name: 'Personal' });
    } else if (company === 'Create Company') {
      setShowCreateCompanyModal(true);
    } else {
      selectCompany(company);
    }
    setIsCompanyDropdownOpen(false);
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return;

    try {
      await createCompany({ name: newCompanyName.trim() });
      setNewCompanyName('');
      setShowCreateCompanyModal(false);
    } catch (error) {
      console.error('Failed to create company:', error);
      // You can add toast notification here
    }
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
      '/profile': 'My Profile'
    };
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
        background: '#ffffff',
        color: '#1e293b',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        transition: 'width 0.3s ease',
        boxShadow: '2px 0 10px rgba(0, 0, 0, 0.08), 4px 0 20px rgba(0, 0, 0, 0.04), 8px 0 40px rgba(0, 0, 0, 0.02)',
        zIndex: 1000,
        borderRight: '1px solid #e2e8f0'
      }}>
        {/* Logo & Toggle */}
        <div style={{
          padding: sidebarCollapsed ? '20px 15px' : '24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between'
        }}>
          {!sidebarCollapsed && (
            <div>
              <h2 style={{
                margin: 0,
                background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: '24px',
                fontWeight: '700',
                letterSpacing: '-0.5px'
              }}>Tabredon</h2>
              <p style={{
                margin: '4px 0 8px 0',
                fontSize: '12px',
                color: 'rgba(0, 17, 110, 1)',
                fontWeight: '500'
              }}>Project Management Suite</p>

              {/* Company Selector Dropdown */}
              <div className="company-dropdown" style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #f1f5f9, #e2e8f0)';
                    e.target.style.borderColor = '#cbd5e1';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #f8fafc, #f1f5f9)';
                    e.target.style.borderColor = '#e2e8f0';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🏢</span>
                    <span style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '140px'
                    }}>
                      {companyState.selectedCompany?.name || 'Select Company'}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    color: '#64748b',
                    transform: isCompanyDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}>
                    ▼
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isCompanyDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
                    zIndex: 1001,
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {/* Company List */}
                    {companyState.companies.map((company) => (
                      <div
                        key={company.id}
                        onClick={() => handleCompanySelect(company)}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: '#1e293b',
                          borderBottom: '1px solid #f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>🏢</span>
                        <span>{company.name}</span>
                        {companyState.selectedCompany?.id === company.id && (
                          <span style={{ marginLeft: 'auto', color: '#3b82f6', fontSize: '12px' }}>✓</span>
                        )}
                      </div>
                    ))}

                    {/* Separator */}
                    <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />

                    {/* Personal Option */}
                    <div
                      onClick={() => handleCompanySelect('Personal')}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>👤</span>
                      <span>Personal</span>
                      {companyState.selectedCompany?.id === 'personal' && (
                        <span style={{ marginLeft: 'auto', color: '#3b82f6', fontSize: '12px' }}>✓</span>
                      )}
                    </div>

                    {/* Create Company Option */}
                    <div
                      onClick={() => handleCompanySelect('Create Company')}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#3b82f6',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                        borderTop: '1px solid #f1f5f9'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#f0f9ff';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>➕</span>
                      <span>Create Company</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{
          flex: 1,
          padding: sidebarCollapsed ? '20px 8px' : '24px 16px',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  padding: sidebarCollapsed ? '10px 8px' : '10px 16px',
                  margin: '2px 0',
                  cursor: 'pointer',
                  background: isActive ? '#f1f5f9' : 'transparent',
                  borderRadius: '12px',
                  border: isActive ? '1px solid #e2e8f0' : '1px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: sidebarCollapsed ? '0' : '16px',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                }}
              >
                <span style={{
                  fontSize: '20px',
                  filter: isActive ? 'brightness(1.2)' : 'brightness(0.8)'
                }}>{item.icon}</span>
                {!sidebarCollapsed && (
                  <span style={{
                    fontWeight: isActive ? '700' : '500',
                    fontSize: '15px',
                    color: isActive ? '#1e293b' : '#64748b'
                  }}>
                    {item.label}
                  </span>
                )}

              </div>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div style={{
          padding: sidebarCollapsed ? '16px 8px' : '20px 16px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc'
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
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: location.pathname === '/profile'
                    ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                    : 'transparent',
                  border: location.pathname === '/profile'
                    ? 'none'
                    : '1px solid transparent',
                  boxShadow: location.pathname === '/profile'
                    ? '0 2px 8px rgba(59, 130, 246, 0.25)'
                    : 'none',
                  transition: 'all 0.2s',
                  marginBottom: '16px'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  {state.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: '600',
                    fontSize: '14px',
                    color: location.pathname === '/profile' ? 'white' : '#1e293b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {state.user?.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: location.pathname === '/profile' ? 'rgba(255, 255, 255, 0.8)' : '#64748b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {state.user?.email}
                  </div>
                </div>
              </div>

              {/* <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{
                  background: state.user?.role === 'superadmin' 
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                    : state.user?.role === 'admin' 
                    ? 'linear-gradient(135deg, #06b6d4, #0891b2)' 
                    : 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {state.user?.role}
                </span>
              </div> */}

              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                }}
              >
                🚪 Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div
                onClick={() => navigate('/profile')}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {state.user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  transition: 'all 0.2s'
                }}
              >
                🚪
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

      {/* Create Company Modal */}
      {showCreateCompanyModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxWidth: '90vw',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: '#1e293b'
            }}>
              Create New Company
            </h3>

            <input
              type="text"
              placeholder="Enter company name"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateCompany();
                }
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '20px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
              }}
              autoFocus
            />

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowCreateCompanyModal(false);
                  setNewCompanyName('');
                }}
                style={{
                  padding: '10px 20px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#64748b',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f8fafc';
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleCreateCompany}
                disabled={!newCompanyName.trim()}
                style={{
                  padding: '10px 20px',
                  background: newCompanyName.trim()
                    ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                    : '#e2e8f0',
                  color: newCompanyName.trim() ? 'white' : '#94a3b8',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: newCompanyName.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  boxShadow: newCompanyName.trim()
                    ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                    : 'none'
                }}
                onMouseEnter={(e) => {
                  if (newCompanyName.trim()) {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (newCompanyName.trim()) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                  }
                }}
              >
                Create Company
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;