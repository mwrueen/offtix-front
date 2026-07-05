import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCompanyFilter } from '../../hooks/useCompanyFilter';
import { useNavigate } from 'react-router-dom';
import { getCookie } from '../../utils/cookies';
import Layout from '../layout/Layout';
import PageHeader from '../layout/PageHeader';
import { companyAPI, getAssetUrl, currencyAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { currencies } from '../../utils/currency';

const Company = () => {
  const { state } = useAuth();
  const { selectedCompany } = useCompanyFilter();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedCompany) fetchCompany();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany]);

  const fetchCompany = async () => {
    if (!selectedCompany) { setLoading(false); return; }
    setLoading(true);
    try {
      const token = getCookie('authToken');
      if (selectedCompany.id === 'personal') {
        setCompany(null);
        setLoading(false);
        return;
      }
      const response = await fetch(`/api/companies/${selectedCompany.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setCompany(await response.json());
      } else {
        setCompany(null);
      }
    } catch (error) {
      console.error('Error fetching company details', error);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  const isCompanyCreator = company && state.user && (
    company.owner?._id === state.user.id ||
    company.owner?.toString() === state.user.id?.toString() ||
    company.owner === state.user.id ||
    String(company.owner?._id) === String(state.user.id)
  );

  const getUserPermissions = () => {
    const defaultPerms = {
      addEmployee: false,
      viewEmployeeList: true,
      editEmployee: false,
      createDesignation: false,
      viewDesignations: true,
      editDesignation: false,
      deleteDesignation: false,
      createProject: false,
      assignEmployeeToProject: false,
      removeEmployeeFromProject: false,
      manageCompanySettings: false
    };
    if (!company || !state.user) return defaultPerms;
    if (state.user.role === 'superadmin' || isCompanyCreator) {
      return Object.keys(defaultPerms).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    }
    const userId = state.user._id || state.user.id;
    const memberInfo = company.members?.find(m => (m.user?._id || m.user)?.toString() === userId?.toString());
    if (!memberInfo) return defaultPerms;
    const designation = company.designations?.find(d => d.name === memberInfo.designation);
    return designation?.permissions || defaultPerms;
  };

  const userPermissions = getUserPermissions();

  const getLogoUrl = getAssetUrl;

  if (loading) return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-40 animate-in fade-in space-y-4">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-sm" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading details...</p>
      </div>
    </Layout>
  );

  if (!company) return (
    <Layout>
      <div className="max-w-2xl mx-auto my-32 bg-white rounded-3xl p-16 shadow-sm border border-slate-200 text-center animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-8">
          {selectedCompany?.id === 'personal' ? '👤' : '🏢'}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          {selectedCompany?.id === 'personal' ? 'Personal Workspace' : 'Company not found'}
        </h2>
        <p className="text-slate-500 mb-10 text-sm leading-relaxed max-w-md mx-auto">
          {selectedCompany?.id === 'personal'
            ? 'Access to company features is restricted to organization workspaces. Switch to a company to continue.'
            : 'We could not find the requested company profile. Please ensure you have the necessary access.'}
        </p>
        {selectedCompany?.id === 'personal' && (
          <button
            onClick={() => navigate('/create-company')}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            Create Company
          </button>
        )}
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-8 pb-32">
        <PageHeader
          title={company.name}
          subtitle={company.description || 'View and manage company details and settings.'}
          icon={company.logo ? (
            <img src={getLogoUrl(company.logo)} alt="" className="w-full h-full object-cover" />
          ) : company.name?.charAt(0)}
          stats={[
            { label: 'Industry', value: company.industry || 'General' },
            { label: 'Size', value: company.companySize || 'N/A' },
            { label: 'Founded', value: company.foundedYear || 'N/A' }
          ]}
          actions={
            <div className="flex items-center gap-3">
              {userPermissions.manageCompanySettings && (
                <button
                  onClick={() => navigate('/edit-company-info')}
                  className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                  Edit Profile
                </button>
              )}
              {userPermissions.addEmployee && (
                <button
                  onClick={() => navigate('/add-employee')}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  Add Employee
                </button>
              )}
            </div>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Employees', value: company.members?.length || 0, icon: '👥' },
            { label: 'Available Roles', value: company.designations?.length || 0, icon: '🎯' },
            { label: 'Established', value: company.foundedYear || 'N/A', icon: '🗓' },
            { label: 'Headquarters', value: company.city || 'N/A', icon: '🏢' }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex justify-between items-start mb-2">
                <div className="text-2xl">{stat.icon}</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-600 rounded-full" />
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Email Address', value: company.email, icon: '📧' },
                { label: 'Phone Number', value: company.phone, icon: '📞' },
                { label: 'Website', value: company.website, icon: '🌐', isLink: true }
              ].map((item, i) => item.value && (
                <div key={i} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    {item.label}
                  </div>
                  {item.isLink ? (
                    <a href={item.value} target="_blank" rel="noreferrer" className="text-sm font-bold text-indigo-600 hover:underline truncate block">{item.value}</a>
                  ) : (
                    <div className="text-sm font-bold text-slate-900 truncate">{item.value}</div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
              Location Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'City', value: company.city },
                { label: 'State/Region', value: company.state },
                { label: 'Country', value: company.country },
                { label: 'Zip Code', value: company.zipCode }
              ].map((loc, i) => loc.value && (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">{loc.label}</span>
                  <span className="text-xs font-bold text-slate-900">{loc.value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Team Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Team Members</h3>
              <p className="text-xs text-slate-500 font-medium">Meet the people behind the organization.</p>
            </div>
            {userPermissions.viewDesignations && (
              <button
                onClick={() => navigate('/manage-roles')}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm active:scale-95"
              >
                Manage Roles
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {company.members?.map((member, index) => (
              <div
                key={member._id}
                onClick={() => navigate(`/profile/view/${member.user?._id || member.user}`)}
                className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer animate-in fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all overflow-hidden shrink-0">
                    {member.user?.profilePicture || member.user?.profile?.profilePicture || member.user?.avatar ? (
                      <img 
                        src={getLogoUrl(member.user.profilePicture || member.user.profile?.profilePicture || member.user?.avatar)} 
                        alt="" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      member.user?.name?.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{member.user?.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{member.designation || 'Member'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Settings Section */}
        {userPermissions.manageCompanySettings && (
          <div className="pt-8">
            <CompanySettings company={company} onRefresh={fetchCompany} />
          </div>
        )}
      </div>
    </Layout>
  );
};

const CompanySettings = ({ company, onRefresh }) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState(company.currency || 'USD');
  const [currenciesList, setCurrenciesList] = useState(currencies);

  useEffect(() => {
    const fetchDynamicCurrencies = async () => {
      try {
        const res = await currencyAPI.getAll();
        if (res.data && res.data.length > 0) {
          setCurrenciesList(res.data);
        }
      } catch (e) {
        console.error('Failed to load currencies', e);
      }
    };
    fetchDynamicCurrencies();
  }, []);

  const [settings, setSettings] = useState(company.settings || {
    timeTracking: {
      defaultDurationUnit: 'hours',
      hoursPerDay: 8,
      daysPerWeek: 5,
      workingHoursStart: '09:00',
      workingHoursEnd: '17:00'
    }
  });

  const updateCT = (f, v) => setSettings(p => ({ ...p, timeTracking: { ...p.timeTracking, [f]: v } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await companyAPI.updateSettings(company._id || company.id, settings);
      await companyAPI.updateProfile(company._id || company.id, { currency });
      toast.showToast('Settings saved successfully', 'success');
      if (onRefresh) onRefresh();
    } catch (e) {
      toast.showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-8 lg:p-10 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
      <div className="space-y-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl">
            ⚙️
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">System Settings</h3>
            <p className="text-xs text-slate-500 font-medium tracking-tight">Manage company settings and preferences.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
              Currency & Region
            </h4>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Company Currency</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 px-5 py-3 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-indigo-500 transition-all cursor-pointer"
              >
                {currenciesList.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
              Work & Time
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Time Unit</label>
                <select
                  value={settings.timeTracking.defaultDurationUnit}
                  onChange={e => updateCT('defaultDurationUnit', e.target.value)}
                  className="w-full bg-slate-50 text-slate-900 px-5 py-3 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center block">Hrs/Day</label>
                  <input type="number" value={settings.timeTracking.hoursPerDay} onChange={e => updateCT('hoursPerDay', parseInt(e.target.value))} className="w-full bg-slate-50 text-slate-900 p-3 rounded-xl border border-slate-200 font-bold text-center text-lg outline-none focus:border-indigo-500" />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center block">Days/Wk</label>
                  <input type="number" value={settings.timeTracking.daysPerWeek} onChange={e => updateCT('daysPerWeek', parseInt(e.target.value))} className="w-full bg-slate-50 text-slate-900 p-3 rounded-xl border border-slate-200 font-bold text-center text-lg outline-none focus:border-indigo-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${saving ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-slate-900 active:scale-95 shadow-md shadow-indigo-100'}`}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Company;
