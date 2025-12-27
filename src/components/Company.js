import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import { useNavigate } from 'react-router-dom';
import { getCookie } from '../utils/cookies';
import Layout from './Layout';
import { companyAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const Company = () => {
  const { state } = useAuth();
  const { selectedCompany } = useCompanyFilter();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showSalaryUpdate, setShowSalaryUpdate] = useState(null);
  const [showRoleUpdate, setShowRoleUpdate] = useState(null);
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showCreateDesignation, setShowCreateDesignation] = useState(false);
  const [showDesignations, setShowDesignations] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (selectedCompany) {
      fetchCompany();
    }
  }, [selectedCompany]);

  const fetchCompany = async () => {
    if (!selectedCompany) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = getCookie('authToken');

      // Handle Personal mode
      if (selectedCompany.id === 'personal') {
        setCompany(null);
        setLoading(false);
        return;
      }

      // Fetch specific company data
      const response = await fetch(`/api/companies/${selectedCompany.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('=== FETCHED COMPANY DATA ===');
        console.log('Full company data:', data);
        console.log('Industry:', data.industry);
        console.log('Website:', data.website);
        console.log('Email:', data.email);
        console.log('Phone:', data.phone);
        console.log('Address:', data.address);
        console.log('City:', data.city);
        console.log('State:', data.state);
        console.log('Country:', data.country);
        console.log('Zip Code:', data.zipCode);
        console.log('Founded Year:', data.foundedYear);
        console.log('Company Size:', data.companySize);
        console.log('============================');
        setCompany(data);
      } else {
        const errorData = await response.text();
        console.log('Company not found or error:', response.status, errorData);
        setCompany(null);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  // Comprehensive company creator check with debugging
  const isCompanyCreator = company && state.user && (
    company.owner?._id === state.user.id ||
    company.owner?.toString() === state.user.id?.toString() ||
    company.owner === state.user.id ||
    String(company.owner?._id) === String(state.user.id)
  );

  // Handle opening edit profile modal
  const handleEditProfile = () => {
    setEditProfileData({
      name: company?.name || '',
      description: company?.description || '',
      industry: company?.industry || '',
      website: company?.website || '',
      email: company?.email || '',
      phone: company?.phone || '',
      address: company?.address || '',
      city: company?.city || '',
      state: company?.state || '',
      country: company?.country || '',
      zipCode: company?.zipCode || '',
      foundedYear: company?.foundedYear || '',
      companySize: company?.companySize || ''
    });
    setShowEditProfile(true);
  };

  // Handle saving profile
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const token = getCookie('authToken');
      const response = await fetch(`/api/companies/${selectedCompany.id}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editProfileData)
      });

      if (response.ok) {
        toast?.showToast?.('Company profile updated successfully', 'success');
        setShowEditProfile(false);
        fetchCompany();
      } else {
        const data = await response.json();
        toast?.showToast?.(data.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast?.showToast?.('Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Debug logging
  console.log('=== COMPANY CREATOR DEBUG ===');
  console.log('Company:', company);
  console.log('Company owner:', company?.owner);
  console.log('Company owner ID:', company?.owner?._id);
  console.log('Current user:', state.user);
  console.log('Current user ID:', state.user?.id);
  console.log('Is company creator:', isCompanyCreator);
  console.log('Auth state:', state);
  console.log('============================');

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
      </Layout>
    );
  }

  if (!company) {
    return (
      <Layout>


        <div style={{
          backgroundColor: 'white',
          padding: '50px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>
            {selectedCompany?.id === 'personal' ? '👤' : '🏢'}
          </div>
          <h2 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>
            {selectedCompany?.id === 'personal' ? 'Personal Mode' : 'No Company Data'}
          </h2>
          <p style={{ margin: '0 0 30px 0', color: '#64748b' }}>
            {selectedCompany?.id === 'personal'
              ? 'You are in personal mode. Switch to a company to view company overview.'
              : 'No company data available or you may not have access to this company.'}
          </p>
          {selectedCompany?.id === 'personal' && (
            <button
              onClick={() => setShowCreateCompany(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Create Company
            </button>
          )}
        </div>

        {showCreateCompany && (
          <CreateCompanyModal
            onClose={() => setShowCreateCompany(false)}
            onSuccess={() => {
              setShowCreateCompany(false);
              fetchCompany();
            }}
          />
        )}
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Page Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px',
        borderRadius: '16px',
        marginBottom: '30px',
        boxShadow: '0 10px 40px rgba(102, 126, 234, 0.2)',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: '700',
                border: '2px solid rgba(255, 255, 255, 0.3)'
              }}>
                {company.name?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <div>
                <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700' }}>
                  {company.name}
                </h1>
                {company.description && (
                  <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>
                    {company.description}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Info Tags */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
              {company.industry && (
                <span style={{
                  padding: '6px 14px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '500',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  {company.industry}
                </span>
              )}
              {company.companySize && (
                <span style={{
                  padding: '6px 14px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '500',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  {company.companySize}
                </span>
              )}
              {company.foundedYear && (
                <span style={{
                  padding: '6px 14px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '500',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  Founded {company.foundedYear}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
            <button
              onClick={() => navigate('/add-employee')}
              style={{
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#667eea',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
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
              + Add Employee
            </button>
            <button
              onClick={() => navigate('/create-role')}
              style={{
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              + Create Role
            </button>
            <button
              onClick={() => navigate('/manage-roles')}
              style={{
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              Manage Roles
            </button>
            <button
              onClick={handleEditProfile}
              style={{
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              ✏️ Edit Info
            </button>
          </div>
        </div>
      </div>

      {/* Company Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Employees
            </span>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
            {company.members?.length || 0}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Total team members
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Roles
            </span>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <polyline points="17 11 19 13 23 9"></polyline>
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
            {company.designations?.length || 0}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Active designations
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Founded
            </span>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
            {company.foundedYear || 'N/A'}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Year established
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Size
            </span>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
            {company.companySize || 'Not specified'}
          </div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Company size
          </div>
        </div>
      </div>

      {/* Company Information Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px',
        marginBottom: '30px'
      }}>
        {/* Contact Information */}
        <div style={{
          background: 'white',
          padding: '28px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '18px',
            fontWeight: '700',
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            Contact Information
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {company.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Email</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{company.email}</div>
                </div>
              </div>
            )}
            {company.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Phone</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{company.phone}</div>
                </div>
              </div>
            )}
            {company.website && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Website</div>
                  <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', fontWeight: '500', color: '#3b82f6', textDecoration: 'none' }}>
                    {company.website}
                  </a>
                </div>
              </div>
            )}
            {!company.email && !company.phone && !company.website && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '14px' }}>
                No contact information available
              </div>
            )}
          </div>
        </div>

        {/* Location Information */}
        <div style={{
          background: 'white',
          padding: '28px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '18px',
            fontWeight: '700',
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            Location
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {company.address && (
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Address</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{company.address}</div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {company.city && (
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>City</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{company.city}</div>
                </div>
              )}
              {company.state && (
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>State</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{company.state}</div>
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {company.country && (
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Country</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{company.country}</div>
                </div>
              )}
              {company.zipCode && (
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Zip Code</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{company.zipCode}</div>
                </div>
              )}
            </div>
            {!company.address && !company.city && !company.state && !company.country && !company.zipCode && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '14px' }}>
                No location information available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Members Section */}
      <div style={{
        background: 'white',
        padding: '28px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '700',
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Team Members ({company.members?.length || 0})
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {company.members?.map((member) => (
            <div key={member._id} style={{
              padding: '20px',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              background: '#fafafa',
              transition: 'all 0.2s',
              cursor: 'default'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'white',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}>
                  {member.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: '600',
                    fontSize: '16px',
                    color: '#1e293b',
                    marginBottom: '4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {member.user?.name}
                    {member.user?._id === company.owner?._id && (
                      <span style={{
                        marginLeft: '8px',
                        padding: '2px 8px',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Owner
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#64748b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {member.user?.email}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span style={{
                    padding: '4px 12px',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {member.designation}
                  </span>
                </div>
                {member.currentSalary > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
                      ${member.currentSalary.toLocaleString()}
                    </span>
                  </div>
                )}
                {member.joinedAt && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Joined {new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>

              {isCompanyCreator && member.user?._id !== state.user?.id && (
                <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                  <button
                    onClick={() => setShowRoleUpdate(member)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.2)';
                    }}
                  >
                    Change Role
                  </button>
                  <button
                    onClick={() => setShowSalaryUpdate(member)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.2)';
                    }}
                  >
                    Update Salary
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {(!company.members || company.members.length === 0) && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#94a3b8'
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>No team members yet</div>
            <div style={{ fontSize: '14px' }}>Add employees to start building your team</div>
          </div>
        )}
      </div>

      {/* Company Settings Section */}
      {isCompanyCreator && (
        <CompanySettingsSection company={company} onRefresh={fetchCompany} />
      )}

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <AddEmployeeModal
          company={company}
          onClose={() => setShowAddEmployee(false)}
          onSuccess={() => {
            setShowAddEmployee(false);
            fetchCompany();
          }}
        />
      )}

      {/* Update Salary Modal */}
      {showSalaryUpdate && (
        <UpdateSalaryModal
          member={showSalaryUpdate}
          company={company}
          onClose={() => setShowSalaryUpdate(null)}
          onSuccess={() => {
            setShowSalaryUpdate(null);
            fetchCompany();
          }}
        />
      )}

      {/* Update Role Modal */}
      {showRoleUpdate && (
        <UpdateRoleModal
          member={showRoleUpdate}
          company={company}
          onClose={() => setShowRoleUpdate(null)}
          onSuccess={() => {
            setShowRoleUpdate(null);
            fetchCompany();
          }}
        />
      )}

      {/* Create Designation Modal */}
      {showCreateDesignation && (
        <CreateDesignationModal
          company={company}
          onClose={() => setShowCreateDesignation(false)}
          onSuccess={() => {
            setShowCreateDesignation(false);
            fetchCompany();
          }}
        />
      )}

      {/* Manage Designations Modal */}
      {showDesignations && (
        <ManageDesignationsModal
          company={company}
          onClose={() => setShowDesignations(false)}
          onSuccess={() => {
            setShowDesignations(false);
            fetchCompany();
          }}
        />
      )}

      {/* Edit Company Profile Modal */}
      {showEditProfile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={() => setShowEditProfile(false)}>
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '16px',
            width: '700px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1e293b' }}>
                Edit Company Information
              </h3>
              <button
                onClick={() => setShowEditProfile(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ×
              </button>
            </div>

            {/* Basic Info */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                Basic Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>Company Name</label>
                  <input
                    type="text"
                    value={editProfileData.name || ''}
                    onChange={(e) => setEditProfileData({ ...editProfileData, name: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>Industry</label>
                  <input
                    type="text"
                    value={editProfileData.industry || ''}
                    onChange={(e) => setEditProfileData({ ...editProfileData, industry: e.target.value })}
                    placeholder="e.g., Technology, Finance"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>Description</label>
                  <textarea
                    value={editProfileData.description || ''}
                    onChange={(e) => setEditProfileData({ ...editProfileData, description: e.target.value })}
                    placeholder="Brief description of your company"
                    rows={2}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>Founded Year</label>
                  <input
                    type="number"
                    value={editProfileData.foundedYear || ''}
                    onChange={(e) => setEditProfileData({ ...editProfileData, foundedYear: e.target.value ? parseInt(e.target.value) : '' })}
                    placeholder="e.g., 2020"
                    min="1800"
                    max={new Date().getFullYear()}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>Company Size</label>
                  <select
                    value={editProfileData.companySize || ''}
                    onChange={(e) => setEditProfileData({ ...editProfileData, companySize: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                  >
                    <option value="">Select size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                Contact Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>Email</label>
                  <input
                    type="email"
                    value={editProfileData.email || ''}
                    onChange={(e) => setEditProfileData({ ...editProfileData, email: e.target.value })}
                    placeholder="company@example.com"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>Phone</label>
                  <input
                    type="tel"
                    value={editProfileData.phone || ''}
                    onChange={(e) => setEditProfileData({ ...editProfileData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>Website</label>
                  <input
                    type="url"
                    value={editProfileData.website || ''}
                    onChange={(e) => setEditProfileData({ ...editProfileData, website: e.target.value })}
                    placeholder="https://www.example.com"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
              </div>
            </div>

            {/* Location Info */}
            <div style={{ marginBottom: '32px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                Location
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>Address</label>
                  <input
                    type="text"
                    value={editProfileData.address || ''}
                    onChange={(e) => setEditProfileData({ ...editProfileData, address: e.target.value })}
                    placeholder="123 Main Street, Suite 100"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>City</label>
                  <input
                    type="text"
                    value={editProfileData.city || ''}
                    onChange={(e) => setEditProfileData({ ...editProfileData, city: e.target.value })}
                    placeholder="San Francisco"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>State/Province</label>
                  <input
                    type="text"
                    value={editProfileData.state || ''}
                    onChange={(e) => setEditProfileData({ ...editProfileData, state: e.target.value })}
                    placeholder="California"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>Country</label>
                  <input
                    type="text"
                    value={editProfileData.country || ''}
                    onChange={(e) => setEditProfileData({ ...editProfileData, country: e.target.value })}
                    placeholder="United States"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>Zip Code</label>
                  <input
                    type="text"
                    value={editProfileData.zipCode || ''}
                    onChange={(e) => setEditProfileData({ ...editProfileData, zipCode: e.target.value })}
                    placeholder="94102"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEditProfile(false)}
                style={{
                  padding: '12px 24px',
                  background: 'white',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                style={{
                  padding: '12px 24px',
                  background: savingProfile ? '#94a3b8' : 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: savingProfile ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const AddEmployeeModal = ({ company, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('Employee');
  const [salary, setSalary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/companies/${company._id}/add-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getCookie('authToken')}`
        },
        body: JSON.stringify({
          email,
          designation,
          salary: salary ? parseInt(salary) : 0
        })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      alert('Error adding employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        width: '400px',
        maxWidth: '90vw'
      }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Add Employee</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px'
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Designation
            </label>
            <select
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px'
              }}
            >
              {company.designations?.map((des) => (
                <option key={des._id} value={des.name}>{des.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Salary (Optional)
            </label>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 20px',
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Adding...' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UpdateSalaryModal = ({ member, company, onClose, onSuccess }) => {
  const [salary, setSalary] = useState(member.currentSalary || '');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/companies/${company._id}/update-salary`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getCookie('authToken')}`
        },
        body: JSON.stringify({
          memberId: member._id,
          newSalary: parseInt(salary),
          reason
        })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      alert('Error updating salary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        width: '400px',
        maxWidth: '90vw'
      }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Update Salary - {member.user?.name}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              New Salary
            </label>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px'
              }}
            />
          </div>
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Annual increment, Promotion"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 20px',
                backgroundColor: loading ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Updating...' : 'Update Salary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UpdateRoleModal = ({ member, company, onClose, onSuccess }) => {
  const [designation, setDesignation] = useState(member.designation || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/companies/${company._id}/update-designation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getCookie('authToken')}`
        },
        body: JSON.stringify({
          memberId: member._id,
          designation
        })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      alert('Error updating role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        width: '400px',
        maxWidth: '90vw'
      }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Update Role - {member.user?.name}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Designation
            </label>
            <select
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px'
              }}
            >
              {company.designations?.map((des) => (
                <option key={des._id} value={des.name}>{des.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 20px',
                backgroundColor: loading ? '#9ca3af' : '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Updating...' : 'Update Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateDesignationModal = ({ company, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState({
    addEmployee: false,
    viewEmployeeList: true,
    editEmployee: false,
    createDesignation: false,
    viewDesignations: true,
    editDesignation: false,
    deleteDesignation: false,
    createProject: false,
    assignEmployeeToProject: false,
    removeEmployeeFromProject: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/companies/${company._id}/designations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getCookie('authToken')}`
        },
        body: JSON.stringify({ name, description, permissions })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      alert('Error creating designation');
    } finally {
      setLoading(false);
    }
  };

  const permissionLabels = {
    addEmployee: 'Add Employee',
    viewEmployeeList: 'View Employee List',
    editEmployee: 'Edit Employee',
    createDesignation: 'Create Designation',
    viewDesignations: 'View Designations',
    editDesignation: 'Edit Designation',
    deleteDesignation: 'Delete Designation',
    createProject: 'Create Project',
    assignEmployeeToProject: 'Assign Employee to Project',
    removeEmployeeFromProject: 'Remove Employee from Project'
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        width: '500px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Create Designation</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Designation Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px'
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                resize: 'vertical'
              }}
            />
          </div>
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>
              Permissions
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {Object.entries(permissionLabels).map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={permissions[key]}
                    onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 20px',
                backgroundColor: loading ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating...' : 'Create Designation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ManageDesignationsModal = ({ company, onClose, onSuccess }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Manage Designations</h3>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {company.designations?.map((designation) => (
            <div key={designation._id} style={{
              padding: '16px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>{designation.name}</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{designation.description}</p>
              </div>

              <div>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Permissions:</h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {Object.entries(designation.permissions || {}).map(([key, value]) => (
                    value && (
                      <span key={key} style={{
                        padding: '2px 8px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    )
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CreateCompanyModal = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = getCookie('authToken');
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      alert('Error creating company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        width: '400px',
        maxWidth: '90vw'
      }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Create Company</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Company Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px'
              }}
            />
          </div>
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                resize: 'vertical'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 20px',
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating...' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Company Settings Section Component
const CompanySettingsSection = ({ company, onRefresh }) => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    timeTracking: {
      defaultDurationUnit: 'hours',
      hoursPerDay: 8,
      daysPerWeek: 5,
      workingHoursStart: '09:00',
      workingHoursEnd: '17:00'
    },
    workingDays: [1, 2, 3, 4, 5],
    weekends: [0, 6],
    holidays: []
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (company?.settings) {
      setSettings({
        timeTracking: company.settings.timeTracking || {
          defaultDurationUnit: 'hours',
          hoursPerDay: 8,
          daysPerWeek: 5,
          workingHoursStart: '09:00',
          workingHoursEnd: '17:00'
        },
        workingDays: company.settings.workingDays || [1, 2, 3, 4, 5],
        weekends: company.settings.weekends || [0, 6],
        holidays: company.settings.holidays || []
      });
    }
  }, [company]);

  const handleTimeTrackingChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      timeTracking: {
        ...prev.timeTracking,
        [field]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await companyAPI.updateSettings(company._id, settings);
      showToast('Settings saved successfully', 'success');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      background: 'white',
      padding: '28px',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      marginTop: '30px'
    }}>
      <h3 style={{
        margin: '0 0 24px 0',
        fontSize: '20px',
        fontWeight: '700',
        color: '#1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2"></path>
        </svg>
        Company Settings
      </h3>

      {/* Time Tracking Settings */}
      <div style={{
        padding: '20px',
        background: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px'
      }}>
        <h4 style={{
          margin: '0 0 16px 0',
          fontSize: '16px',
          fontWeight: '600',
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          ⏱️ Time Tracking
        </h4>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '16px'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
              DEFAULT DURATION UNIT
            </label>
            <select
              value={settings.timeTracking.defaultDurationUnit}
              onChange={(e) => handleTimeTrackingChange('defaultDurationUnit', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
              HOURS PER DAY
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={settings.timeTracking.hoursPerDay}
              onChange={(e) => handleTimeTrackingChange('hoursPerDay', parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
              DAYS PER WEEK
            </label>
            <input
              type="number"
              min="1"
              max="7"
              value={settings.timeTracking.daysPerWeek}
              onChange={(e) => handleTimeTrackingChange('daysPerWeek', parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            />
          </div>
        </div>

        {/* Working Hours Section */}
        <div style={{
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid #dfe1e6',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
              WORKING HOURS START
            </label>
            <input
              type="time"
              value={settings.timeTracking.workingHoursStart}
              onChange={(e) => handleTimeTrackingChange('workingHoursStart', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            />
            <div style={{ fontSize: '11px', color: '#5e6c84', marginTop: '4px' }}>
              Daily work start time (e.g., 09:00)
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '8px' }}>
              WORKING HOURS END
            </label>
            <input
              type="time"
              value={settings.timeTracking.workingHoursEnd}
              onChange={(e) => handleTimeTrackingChange('workingHoursEnd', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            />
            <div style={{ fontSize: '11px', color: '#5e6c84', marginTop: '4px' }}>
              Daily work end time (e.g., 17:00)
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: '#f4f5f7',
            borderRadius: '3px',
            border: '1px solid #dfe1e6'
          }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84', marginBottom: '4px' }}>
                TOTAL HOURS
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0052cc' }}>
                {(() => {
                  const start = settings.timeTracking.workingHoursStart.split(':');
                  const end = settings.timeTracking.workingHoursEnd.split(':');
                  const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
                  const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
                  const totalMinutes = endMinutes - startMinutes;
                  const hours = Math.floor(totalMinutes / 60);
                  const minutes = totalMinutes % 60;
                  return `${hours}h ${minutes}m`;
                })()}
              </div>
              <div style={{ fontSize: '11px', color: '#5e6c84', marginTop: '2px' }}>
                per working day
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          style={{
            padding: '12px 24px',
            background: saving ? '#9ca3af' : 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!saving) {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default Company;