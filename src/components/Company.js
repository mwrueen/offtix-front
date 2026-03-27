import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import { useNavigate } from 'react-router-dom';
import { getCookie } from '../utils/cookies';
import Layout from './Layout';
import PageHeader from './PageHeader';
import { companyAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const Company = () => {
  const { state } = useAuth();
  const { selectedCompany } = useCompanyFilter();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (selectedCompany) fetchCompany();
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

  if (loading) return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-40 animate-in fade-in space-y-6">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-sm" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading corporate profile...</p>
      </div>
    </Layout>
  );

  if (!company) return (
    <Layout>
      <div className="max-w-2xl mx-auto my-32 bg-white rounded-3xl p-16 shadow-sm border border-slate-200 text-center animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-5xl mx-auto mb-8">
          {selectedCompany?.id === 'personal' ? '👤' : '🏢'}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          {selectedCompany?.id === 'personal' ? 'Personal workspace active' : 'Workspace unavailable'}
        </h2>
        <p className="text-slate-500 mb-10 text-sm leading-relaxed max-w-md mx-auto">
          {selectedCompany?.id === 'personal'
            ? 'Access to organizational management is restricted to company workspaces. Switch to a company or initialize a new one to continue.'
            : 'We could not synchronize with the requested company profile. Ensure you have the necessary permissions or contact your administrator.'}
        </p>
        {selectedCompany?.id === 'personal' && (
          <button
            onClick={() => navigate('/create-company')}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            Create New Company
          </button>
        )}
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-10 pb-32">
        <PageHeader
          title={company.name}
          subtitle={company.description || 'Managing core organizational profile and operational parameters.'}
          icon={company.name?.charAt(0)}
          stats={[
            { label: 'Industry Sector', value: company.industry || 'General' },
            { label: 'Headcount', value: company.members?.length || '0' },
            { label: 'Est. Year', value: company.foundedYear || 'N/A' }
          ]}
          actions={
            <div className="flex items-center gap-3">
              {userPermissions.manageCompanySettings && (
                <button
                  onClick={() => navigate('/edit-company-info')}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                  Edit Profile
                </button>
              )}
              {userPermissions.addEmployee && (
                <button
                  onClick={() => navigate('/add-employee')}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  Add Personnel
                </button>
              )}
            </div>
          }
        />

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Personnel Strength', value: company.members?.length || 0, icon: '👥', sub: 'Active members' },
            { label: 'Role Architecture', value: company.designations?.length || 0, icon: '🎯', sub: 'Defined echelons' },
            { label: 'Operational Since', value: company.foundedYear || 'N/A', icon: '🗓', sub: 'Founding timeline' },
            { label: 'Market Scale', value: company.companySize || 'N/A', icon: '🏢', sub: 'Workforce bracket' }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm group hover:shadow-md transition-all duration-300 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl group-hover:bg-indigo-50 transition-colors">{stat.icon}</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                <div className="text-[10px] text-slate-300 font-medium italic">{stat.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Primary Information Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 bg-white p-8 lg:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-10">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-sm">✉️</div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Communication Portal</h3>
                <p className="text-xs text-slate-400 font-medium">Official corporate contact channels</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Primary Email', value: company.email, icon: '📧' },
                { label: 'Business Phone', value: company.phone, icon: '📞' },
                { label: 'Digital Domain', value: company.website, icon: '🌐', isLink: true }
              ].map((item, i) => item.value && (
                <div key={i} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:scale-[1.02] transition-transform">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-indigo-500" /> {item.label}
                  </div>
                  {item.isLink ? (
                    <a href={item.value} target="_blank" rel="noreferrer" className="text-sm font-bold text-indigo-600 hover:underline truncate block">{item.value}</a>
                  ) : (
                    <div className="text-sm font-bold text-slate-900 truncate">{item.value}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4">
              <div className="flex items-center gap-4 bg-slate-950 p-8 rounded-2xl shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white text-2xl shrink-0 group-hover:scale-110 transition-transform">📍</div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Corporate Headquarters</span>
                  <div className="text-sm font-bold text-white leading-relaxed truncate">
                    {company.address ? `${company.address}, ${company.city}, ${company.country}` : 'Address information pending'}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-slate-50 p-8 rounded-3xl border border-slate-200 space-y-8 h-full">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Regional Logistics
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Metro Node', value: company.city },
                { label: 'Provincial Region', value: company.state },
                { label: 'Sovereign ID', value: company.country },
                { label: 'Zip/Postal System', value: company.zipCode }
              ].map((loc, i) => loc.value && (
                <div key={i} className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{loc.label}</span>
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">{loc.value}</span>
                </div>
              ))}
            </div>
            <div className="p-5 bg-indigo-600 rounded-2xl text-white space-y-3 shadow-md shadow-indigo-100">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Operations Status</p>
              <p className="text-sm font-bold leading-relaxed">Fully synchronized with global regional parameters.</p>
            </div>
          </section>
        </div>

        {/* Personnel Directory Grid */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Directory</h3>
              <p className="text-xs text-slate-500 font-medium">Visual index of specialized personnel and leadership.</p>
            </div>
            {userPermissions.viewDesignations && (
              <button
                onClick={() => navigate('/manage-roles')}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm active:scale-95"
              >
                Configure Hierarchy & Access
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {company.members?.map((member, index) => (
              <div
                key={member._id}
                onClick={() => navigate(`/employees/${member.user?._id || member.user}`)}
                className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300 cursor-pointer animate-in fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg font-bold text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-500">
                    {member.user?.name?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors leading-none mb-1.5">{member.user?.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{member.designation || 'Specialist'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight italic">Personnel Record</span>
                  {member.user?._id === company.owner?._id && (
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-bold uppercase rounded-md border border-indigo-100">Founder</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Administrative System Configuration */}
        {userPermissions.manageCompanySettings && (
          <div className="pt-10">
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
  const [settings, setSettings] = useState(company.settings || {
    timeTracking: {
      defaultDurationUnit: 'hours',
      hoursPerDay: 8,
      daysPerWeek: 5,
      workingHoursStart: '09:00',
      workingHoursEnd: '17:00'
    }
  });

  const currencies = [
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'BDT', symbol: '৳' },
    { code: 'INR', symbol: '₹' }
  ];

  const updateCT = (f, v) => setSettings(p => ({ ...p, timeTracking: { ...p.timeTracking, [f]: v } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await companyAPI.updateSettings(company._id || company.id, settings);
      await companyAPI.updateProfile(company._id || company.id, { currency });
      toast.showToast('System configuration synchronized successfully.', 'success');
      if (onRefresh) onRefresh();
    } catch (e) {
      toast.showToast('Failed to synchronize system parameters.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-950 p-10 lg:p-14 rounded-[2.5rem] shadow-2xl border border-white/5 relative overflow-hidden group">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      <div className="relative z-10 space-y-12">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/5 flex items-center justify-center text-3xl shadow-xl">
            ⚙️
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">System Configuration</h3>
            <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.4em] opacity-80">Global Directives & Environment Settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-white/5 rounded-3xl border border-white/5 space-y-8">
            <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-4">
              <span className="w-8 h-px bg-indigo-500/50" /> Financial Parameters
            </h4>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Base Transaction Currency</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full bg-slate-900 text-white px-5 py-3.5 rounded-xl border border-white/10 font-bold text-sm outline-none focus:border-indigo-500 transition-all cursor-pointer"
              >
                {currencies.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code} — Standard</option>)}
              </select>
            </div>
          </div>

          <div className="p-8 bg-white/5 rounded-3xl border border-white/5 space-y-8">
            <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-4">
              <span className="w-8 h-px bg-emerald-500/50" /> Time Management
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Reporting Unit</label>
                <select
                  value={settings.timeTracking.defaultDurationUnit}
                  onChange={e => updateCT('defaultDurationUnit', e.target.value)}
                  className="w-full bg-slate-900 text-white px-5 py-3 rounded-xl border border-white/10 font-bold text-xs uppercase outline-none focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2 text-center">
                  <label className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Hrs/Day</label>
                  <input type="number" value={settings.timeTracking.hoursPerDay} onChange={e => updateCT('hoursPerDay', parseInt(e.target.value))} className="w-full bg-black/40 text-emerald-400 p-3 rounded-xl border border-white/5 font-bold text-center text-2xl outline-none focus:border-emerald-400 transition-all" />
                </div>
                <div className="flex-1 space-y-2 text-center">
                  <label className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Days/Wk</label>
                  <input type="number" value={settings.timeTracking.daysPerWeek} onChange={e => updateCT('daysPerWeek', parseInt(e.target.value))} className="w-full bg-black/40 text-emerald-400 p-3 rounded-xl border border-white/5 font-bold text-center text-2xl outline-none focus:border-emerald-400 transition-all" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-10 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl ${saving ? 'bg-slate-800 text-slate-500' : 'bg-indigo-600 text-white hover:bg-white hover:text-indigo-600 active:scale-95'}`}
          >
            {saving ? 'Synchronizing...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Company;