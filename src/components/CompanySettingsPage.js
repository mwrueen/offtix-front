import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { useToast } from '../context/ToastContext';
import Layout from './Layout';
import CompanySettings from './company/CompanySettings';
import { companyAPI } from '../services/api';

const CompanySettingsPage = () => {
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const { state: companyState } = useCompany();
  const toast = useToast();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    fetchCompanyData();
  }, [companyState.selectedCompany]);

  const fetchCompanyData = async () => {
    if (!companyState.selectedCompany || companyState.selectedCompany.id === 'personal') {
      toast.error('Please select a company to manage settings');
      navigate('/overview');
      return;
    }

    setLoading(true);
    try {
      const response = await companyAPI.getById(companyState.selectedCompany.id);
      const companyData = response.data;
      setCompany(companyData);

      // Check if user has permission to manage company settings
      const userId = authState.user?._id;
      const ownerId = companyData.owner?._id || companyData.owner;
      const isOwner = ownerId?.toString() === userId?.toString();
      const isSuperAdmin = authState.user?.role === 'superadmin';

      console.log('CompanySettingsPage permission check:', {
        userId,
        ownerId,
        isOwner,
        isSuperAdmin,
        companyName: companyData.name
      });

      // Find user's designation and check permissions
      let canManageSettings = false;
      if (isOwner || isSuperAdmin) {
        canManageSettings = true;
      } else {
        const memberInfo = companyData.members?.find(m => {
          const memberId = m.user?._id || m.user;
          return memberId?.toString() === userId?.toString();
        });
        if (memberInfo) {
          const designation = companyData.designations?.find(d => d.name === memberInfo.designation);
          if (designation?.permissions?.manageCompanySettings) {
            canManageSettings = true;
          }
        }
      }

      console.log('Can manage settings:', canManageSettings);
      setHasPermission(canManageSettings);

      if (!canManageSettings) {
        toast.error('You do not have permission to manage company settings');
        navigate('/overview');
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast.error('Failed to load company data');
      navigate('/overview');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          fontSize: '16px',
          color: '#64748b'
        }}>
          Loading company settings...
        </div>
      </Layout>
    );
  }

  if (!hasPermission || !company) {
    return null;
  }

  return (
    <Layout>
      <div style={{
        padding: '32px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '32px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '32px',
          color: 'white',
          boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '12px'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6m5.66-13.66l-4.24 4.24m0 6l-4.24 4.24M23 12h-6m-6 0H1m18.66 5.66l-4.24-4.24m0-6l-4.24-4.24"></path>
            </svg>
            <h1 style={{
              margin: 0,
              fontSize: '32px',
              fontWeight: '700',
              letterSpacing: '-0.5px'
            }}>
              Company Settings
            </h1>
          </div>
          <p style={{
            margin: 0,
            fontSize: '16px',
            opacity: 0.95,
            fontWeight: '400'
          }}>
            Manage company-wide settings for {company.name}
          </p>
        </div>

        {/* Settings Component */}
        <CompanySettings
          company={company}
          isOwner={company.owner?._id === authState.user?._id}
          onRefresh={fetchCompanyData}
        />
      </div>
    </Layout>
  );
};

export default CompanySettingsPage;

