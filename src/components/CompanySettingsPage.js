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
    // On hard reload, selectedCompany is restored async in CompanyContext.
    // Avoid redirecting until company state finished loading.
    if (companyState.loading) return;
    fetchCompanyData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyState.selectedCompany, companyState.loading]);

  const fetchCompanyData = async () => {
    if (companyState.loading) return;
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
      const userId = authState.user?._id || authState.user?.id;
      const ownerId = companyData.owner?._id || companyData.owner;
      const isOwner = ownerId?.toString() === userId?.toString();
      const isSuperAdmin = authState.user?.role === 'superadmin';

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
        <div className="flex flex-col items-center justify-center py-40 space-y-6">
          <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-sm" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Loading company settings...</p>
        </div>
      </Layout>
    );
  }

  if (!hasPermission || !company) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-8 pb-20">


        {/* Settings Component */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px]">
          <CompanySettings
            company={company}
            isOwner={(company.owner?._id || company.owner)?.toString() === (authState.user?._id || authState.user?.id)?.toString()}
            onRefresh={fetchCompanyData}
          />
        </div>
      </div>
    </Layout>
  );
};

export default CompanySettingsPage;


