import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import { useToast } from '../context/ToastContext';
import { getCookie } from '../utils/cookies';
import Layout from './Layout';

const ManageRoles = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { selectedCompany } = useCompanyFilter();
  const toast = useToast();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    if (selectedCompany && selectedCompany.id !== 'personal') {
      fetchCompany();
    }
  }, [selectedCompany]);

  const fetchCompany = async () => {
    try {
      const token = getCookie('authToken');
      const response = await fetch(`/api/companies/${selectedCompany.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCompany(data);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      toast?.showToast?.('Failed to load company data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (designationName) => {
    try {
      const token = getCookie('authToken');
      const response = await fetch(`/api/companies/${selectedCompany.id}/designations/${designationName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast?.showToast?.('Role deleted successfully', 'success');
        fetchCompany();
        setShowDeleteConfirm(null);
      } else {
        const errorData = await response.json();
        toast?.showToast?.(errorData.message || 'Failed to delete role', 'error');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      toast?.showToast?.('Failed to delete role. Please try again.', 'error');
    }
  };

  const getPermissionCount = (permissions) => {
    if (!permissions) return 0;
    return Object.values(permissions).filter(Boolean).length;
  };

  if (!selectedCompany || selectedCompany.id === 'personal') {
    return (
      <Layout>
        <div style={{
          background: 'white',
          padding: '50px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ color: '#1e293b', marginBottom: '16px' }}>No Company Selected</h2>
          <p style={{ color: '#64748b', marginBottom: '24px' }}>
            Please select a company to manage roles
          </p>
          <button
            onClick={() => navigate('/overview')}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Go to Overview
          </button>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '18px', color: '#64748b' }}>Loading roles...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          padding: '40px',
          borderRadius: '16px',
          marginBottom: '30px',
          boxShadow: '0 10px 40px rgba(139, 92, 246, 0.2)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(255, 255, 255, 0.3)'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <polyline points="17 11 19 13 23 9"></polyline>
                </svg>
              </div>
              <div>
                <h1 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '700' }}>
                  Manage Roles
                </h1>
                <p style={{ margin: 0, fontSize: '15px', opacity: 0.9 }}>
                  {company?.designations?.length || 0} roles in {selectedCompany.name}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/create-role')}
              style={{
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#8b5cf6',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create New Role
            </button>
          </div>
        </div>

        {/* Roles Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {company?.designations?.map((designation, index) => (
            <div
              key={index}
              style={{
                background: 'white',
                padding: '28px',
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              onClick={() => setSelectedRole(selectedRole === designation ? null : designation)}
            >
              {/* Role Header */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#1e293b'
                  }}>
                    {designation.name}
                  </h3>
                  <span style={{
                    padding: '4px 12px',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {getPermissionCount(designation.permissions)} permissions
                  </span>
                </div>
                {designation.description && (
                  <p style={{
                    margin: '8px 0 0 0',
                    fontSize: '14px',
                    color: '#64748b',
                    lineHeight: '1.5'
                  }}>
                    {designation.description}
                  </p>
                )}
              </div>

              {/* Permissions Preview */}
              {selectedRole === designation && designation.permissions && (
                <div style={{
                  marginTop: '20px',
                  paddingTop: '20px',
                  borderTop: '1px solid #e2e8f0'
                }}>
                  <h4 style={{
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#475569',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Permissions
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(designation.permissions).map(([key, value]) => (
                      value && (
                        <div
                          key={key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '13px',
                            color: '#10b981'
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </div>
                      )
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid #e2e8f0'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(designation.name);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '13px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      Delete Role
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {(!company?.designations || company.designations.length === 0) && (
          <div style={{
            background: 'white',
            padding: '60px',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 20px' }}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <polyline points="17 11 19 13 23 9"></polyline>
            </svg>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
              No Roles Yet
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: '#64748b' }}>
              Create your first role to start organizing your team
            </p>
            <button
              onClick={() => navigate('/create-role')}
              style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '15px',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}
            >
              Create First Role
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
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
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => setShowDeleteConfirm(null)}>
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '16px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '700', color: '#1e293b', textAlign: 'center' }}>
              Delete Role?
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: '#64748b', textAlign: 'center', lineHeight: '1.6' }}>
              Are you sure you want to delete the role "<strong>{showDeleteConfirm}</strong>"? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'white',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '15px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRole(showDeleteConfirm)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '15px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
              >
                Delete Role
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ManageRoles;

