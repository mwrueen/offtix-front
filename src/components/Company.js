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

  useEffect(() => { if (selectedCompany) fetchCompany(); }, [selectedCompany]);

  const fetchCompany = async () => {
    if (!selectedCompany) { setLoading(false); return; }
    setLoading(true);
    try {
      const token = getCookie('authToken');
      if (selectedCompany.id === 'personal') { setCompany(null); setLoading(false); return; }
      const response = await fetch(`/api/companies/${selectedCompany.id}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) setCompany(await response.json());
      else setCompany(null);
    } catch (error) { console.error('Error fetching company details', error); setCompany(null); }
    finally { setLoading(false); }
  };

  const isCompanyCreator = company && state.user && (
    company.owner?._id === state.user.id || company.owner?.toString() === state.user.id?.toString() ||
    company.owner === state.user.id || String(company.owner?._id) === String(state.user.id)
  );

  const getUserPermissions = () => {
    const defaultPerms = { addEmployee: false, viewEmployeeList: true, editEmployee: false, createDesignation: false, viewDesignations: true, editDesignation: false, deleteDesignation: false, createProject: false, assignEmployeeToProject: false, removeEmployeeFromProject: false, manageCompanySettings: false };
    if (!company || !state.user) return defaultPerms;
    if (state.user.role === 'superadmin' || isCompanyCreator) return Object.keys(defaultPerms).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    const userId = state.user._id || state.user.id;
    const memberInfo = company.members?.find(m => (m.user?._id || m.user)?.toString() === userId?.toString());
    if (!memberInfo) return defaultPerms;
    const designation = company.designations?.find(d => d.name === memberInfo.designation);
    return designation?.permissions || defaultPerms;
  };

  const userPermissions = getUserPermissions();

  if (loading) return (
    <Layout>
      <div className="flex flex-col items-center justify-center p-60 animate-in fade-in space-y-8">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-sm" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Synchronizing company data...</p>
      </div>
    </Layout>
  );

  if (!company) return (
    <Layout>
      <div className="max-w-4xl mx-auto my-40 bg-white rounded-3xl p-24 shadow-xl border border-slate-200 text-center relative overflow-hidden group animate-in zoom-in-95 duration-700">
        <div className="relative z-10 space-y-8">
          <div className="text-8xl group-hover:scale-110 transition-transform duration-700">
            {selectedCompany?.id === 'personal' ? '👤' : '🏢'}
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-slate-950 uppercase tracking-tight mb-4 group-hover:text-indigo-600 transition-colors italic">
              {selectedCompany?.id === 'personal' ? 'Private Workspace' : 'Company Data Unavailable'}
            </h2>
            <p className="text-slate-500 text-sm max-w-2xl mx-auto leading-relaxed italic uppercase font-bold tracking-tight opacity-70">
              {selectedCompany?.id === 'personal'
                ? 'Current authorization is restricted to personal tasks. Please select or create an organization to access corporate management tools.'
                : 'The requested company profile is currently unreachable. You may not have the required permissions to synchronize with this organization.'}
            </p>
          </div>
          {selectedCompany?.id === 'personal' && (
            <button
              onClick={() => navigate('/create-company')}
              className="mt-12 px-12 py-4 bg-slate-950 text-white rounded-xl font-bold text-xs uppercase tracking-[0.4em] transition-all shadow-lg hover:bg-indigo-600 hover:scale-105 active:scale-95 italic border border-white/10 group/btn relative overflow-hidden"
            >
              <span className="relative z-10 font-black">+ Initialize New Company</span>
              <div className="absolute top-0 left-0 w-full h-full bg-white/5 -translate-x-full group-hover/btn:animate-[shimmer_3s_infinite]" />
            </button>
          )}
        </div>
        <div className="absolute -bottom-48 -left-48 w-[800px] h-[800px] bg-indigo-50/50 rounded-full blur-[180px] group-hover:scale-110 transition-transform duration-1000 pointer-events-none"></div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-16 animate-in fade-in duration-1000 pb-40">
        <PageHeader
          title={company.name}
          subtitle={company.description || 'Global corporate profile and operations management.'}
          icon={company.name?.charAt(0)}
          stats={[
            { label: 'Industry', value: company.industry || 'General' },
            { label: 'Total Employees', value: company.members?.length || '0' },
            { label: 'Founded', value: company.foundedYear || 'NA' }
          ]}
          actions={
            <div className="flex flex-wrap gap-4">
              {userPermissions.addEmployee && (
                <button
                  onClick={() => navigate('/add-employee')}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-slate-950 hover:scale-105 active:scale-95 transition-all italic border border-indigo-400 group/btn relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-3"> Add Employee <span className="text-sm group-hover/btn:translate-x-1 transition-transform">→</span> </span>
                  <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover/btn:animate-[shimmer_3s_infinite]" />
                </button>
              )}
              {userPermissions.manageCompanySettings && (
                <button
                  onClick={() => navigate('/edit-company-info')}
                  className="px-8 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:text-indigo-600 hover:border-indigo-100 hover:shadow-md active:scale-95 italic group/reconfig"
                >
                  Edit Profile
                </button>
              )}
            </div>
          }
        />

        {/* Dashboard Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: 'TOTAL_PERSONNEL', value: company.members?.length || 0, icon: '👥', color: 'indigo' },
            { label: 'ROLE_DEFINITIONS', value: company.designations?.length || 0, icon: '🎯', color: 'emerald' },
            { label: 'FOUNDED_YEAR', value: company.foundedYear || 'N/A', icon: '🗓', color: 'amber' },
            { label: 'COMPANY_SIZE', value: company.companySize || 'N/A', icon: '🏢', color: 'rose' }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 group/card relative overflow-hidden hover:-translate-y-2 animate-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="absolute top-0 right-0 p-8 text-7xl opacity-5 group-hover/card:scale-110 group-hover/card:rotate-12 transition-all duration-700 pointer-events-none select-none">{stat.icon}</div>
              <div className="relative z-10 space-y-4">
                <div className={`text-4xl font-bold text-slate-900 group-hover/card:text-indigo-600 transition-colors`}>{stat.value}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.4em] italic flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full bg-${stat.color}-500 shadow-sm transition-all group-hover/card:animate-pulse`} />
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Operational Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Contact Information Card */}
          <section className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm group overflow-hidden relative transition-all hover:shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight mb-12 flex items-center gap-4 relative z-10">
              <span className="w-1.5 h-6 rounded-full bg-indigo-600 shadow-lg" />
              Communication Management
            </h3>
            <div className="space-y-6 relative z-10">
              {[
                { label: 'Official Email', value: company.email, icon: '✉️' },
                { label: 'Contact Number', value: company.phone, icon: '📞' },
                { label: 'Corporate Website', value: company.website, icon: '🌐', isLink: true }
              ].map((item, i) => item.value && (
                <div key={i} className="flex items-center gap-8 p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-100 transition-all duration-500 group/item animate-in slide-in-from-left-4" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-3xl shadow-sm group-hover/item:scale-105 group-hover/item:rotate-3 transition-all duration-500 shrink-0 italic">
                    {item.icon}
                  </div>
                  <div className="relative z-10 flex-1 min-w-0">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 italic">{item.label}</div>
                    {item.isLink ? (
                      <a href={item.value} target="_blank" rel="noreferrer" className="text-xl font-bold text-indigo-600 hover:text-slate-950 transition-colors uppercase tracking-tight italic truncate block">{item.value}</a>
                    ) : (
                      <div className="text-xl font-bold text-slate-900 uppercase tracking-tight italic truncate">{item.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Location Information Card */}
          <section className="bg-slate-950 p-12 rounded-3xl shadow-xl border border-slate-900 group relative overflow-hidden transition-all">
            <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-12 flex items-center gap-4 relative z-10 italic">
              <span className="w-1.5 h-6 rounded-full bg-emerald-400 shadow-lg" />
              Geographic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 font-sans">
              {[
                { label: 'Headquarters Address', value: company.address, full: true },
                { label: 'Metro Zone', value: company.city },
                { label: 'State/Region', value: company.state },
                { label: 'National Identifier', value: company.country },
                { label: 'Zip Code', value: company.zipCode }
              ].map((loc, i) => loc.value && (
                <div key={i} className={`p-6 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-500 italic group/loc ${loc.full ? 'md:col-span-2' : ''}`} style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2 italic">{loc.label}</div>
                  <div className="text-lg font-bold text-white uppercase italic tracking-tight leading-relaxed group-hover/loc:text-emerald-400 transition-colors truncate">{loc.value}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Personnel Registry Section */}
        <section className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm relative group/registry animate-in slide-in-from-bottom-4 transition-all hover:shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8 px-4 relative z-10">
            <div className="space-y-4">
              <h3 className="text-3xl font-bold text-slate-950 uppercase tracking-tight italic leading-none"> Employee Registry </h3>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest italic animate-pulse flex items-center gap-4 underline underline-offset-[12px] decoration-indigo-50">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                {company.members?.length || 0} Synchronized personnel records
              </p>
            </div>
            {userPermissions.viewDesignations && (
              <button onClick={() => navigate('/manage-roles')} className="bg-slate-950 text-white px-10 py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all shadow-md italic border border-white/5 group/btn relative overflow-hidden">
                Manage Roles & Permissions
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 relative z-10">
            {company.members?.map((member, index) => (
              <div key={member._id} onClick={() => navigate(`/employees/${member.user?._id || member.user}`)} className="group/node p-8 rounded-3xl border border-slate-50 bg-slate-50/50 hover:bg-white hover:border-indigo-100 hover:shadow-xl transition-all duration-500 cursor-pointer overflow-hidden relative animate-in zoom-in-95 hover:-translate-y-1" style={{ animationDelay: `${index * 30}ms` }}>
                <div className="flex items-center gap-6 mb-8 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-slate-950 text-white border-4 border-white shadow-md flex items-center justify-center font-bold text-xl italic group-hover/node:bg-indigo-600 transition-all duration-700">
                    {member.user?.name?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-lg font-bold text-slate-950 uppercase italic tracking-tight truncate leading-none mb-2 group-hover/node:text-indigo-600 transition-colors">{member.user?.name}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic truncate opacity-70 underline underline-offset-4 decoration-slate-100">{member.user?.email}</p>
                    {member.user?._id === company.owner?._id && <span className="mt-4 inline-block px-3 py-1 bg-amber-400 text-amber-950 text-[8px] font-black uppercase rounded-lg shadow-sm italic border border-white">Owner</span>}
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 group-hover/node:border-indigo-100 transition-all duration-700 relative z-10 shadow-sm border-l-8 border-l-slate-200 group-hover:border-l-indigo-600 italic">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic leading-none mb-1">Authorization</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 italic group-hover/node:text-slate-950 transition-colors truncate">{member.designation || 'General Staff'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* User Configuration Panel */}
        {userPermissions.manageCompanySettings && (
          <div className="animate-in slide-in-from-bottom-8 duration-700">
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
  const [settings, setSettings] = useState(company.settings || { timeTracking: { defaultDurationUnit: 'hours', hoursPerDay: 8, daysPerWeek: 5, workingHoursStart: '09:00', workingHoursEnd: '17:00' } });

  const currencies = [{ code: 'USD', symbol: '$' }, { code: 'EUR', symbol: '€' }, { code: 'GBP', symbol: '£' }, { code: 'BDT', symbol: '৳' }, { code: 'INR', symbol: '₹' }];

  const updateCT = (f, v) => setSettings(p => ({ ...p, timeTracking: { ...p.timeTracking, [f]: v } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await companyAPI.updateSettings(company._id || company.id, settings);
      await companyAPI.updateProfile(company._id || company.id, { currency });
      toast.showToast('Project settings updated successfully.', 'success');
      if (onRefresh) onRefresh();
    } catch (e) { toast.showToast('Failed to update system settings.', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-slate-950 p-12 rounded-[3.5rem] shadow-2xl border border-slate-900 relative overflow-hidden group font-sans">
      <div className="relative z-10 space-y-16">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="w-20 h-20 rounded-3xl bg-indigo-600 border border-white/10 flex items-center justify-center text-4xl shadow-xl italic relative overflow-hidden group-hover:rotate-12 transition-transform duration-700">
            ⚙️
            <div className="absolute inset-0 bg-white/5 -translate-x-full animate-[shimmer_3s_infinite]" />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-white uppercase italic tracking-tight leading-none mb-3"> Organization Configuration </h3>
            <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.6em] italic opacity-60 underline underline-offset-8 decoration-white/5"> System Management & Global Directives </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="p-10 bg-white/5 rounded-[2.5rem] border border-white/5 group/sub hover:bg-white/10 transition-all duration-700 italic">
            <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.4em] mb-12 flex items-center gap-6">
              <span className="w-12 h-0.5 bg-indigo-500 shadow-lg group-hover/sub:w-16 transition-all" /> 01 Financial Node
            </h4>
            <div className="space-y-6">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] ml-6 italic">Primary Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full bg-slate-900 text-white px-8 py-4 rounded-xl border border-white/10 font-bold text-lg outline-none focus:border-indigo-500 transition-all cursor-pointer uppercase italic">
                {currencies.map(c => <option key={c.code} value={c.code} className="bg-slate-900">{c.symbol} {c.code} – {c.code} Protocol</option>)}
              </select>
            </div>
          </div>

          <div className="p-10 bg-white/5 rounded-[2.5rem] border border-white/5 group/sub hover:bg-white/10 transition-all duration-700 italic">
            <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-[0.4em] mb-12 flex items-center gap-6">
              <span className="w-12 h-0.5 bg-emerald-500 shadow-lg group-hover/sub:w-16 transition-all" /> 02 Time & Scheduling
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] ml-6 italic">Tracking Unit</label>
                <select value={settings.timeTracking.defaultDurationUnit} onChange={e => updateCT('defaultDurationUnit', e.target.value)} className="w-full bg-slate-900 text-white px-6 py-3 rounded-lg border border-white/10 font-bold text-xs uppercase outline-none focus:border-emerald-500 transition-all cursor-pointer italic">
                  <option value="minutes">Minutes Log</option>
                  <option value="hours">Hours Index</option>
                  <option value="days">Days Cycle</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[8px] font-bold text-white/20 uppercase tracking-widest text-center block">H/Day</label>
                  <input type="number" value={settings.timeTracking.hoursPerDay} onChange={e => updateCT('hoursPerDay', parseInt(e.target.value))} className="w-full bg-slate-900 text-emerald-400 p-4 rounded-xl border border-white/10 font-bold text-center text-3xl outline-none focus:border-emerald-400 focus:bg-black transition-all italic" />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-bold text-white/20 uppercase tracking-widest text-center block">D/Week</label>
                  <input type="number" value={settings.timeTracking.daysPerWeek} onChange={e => updateCT('daysPerWeek', parseInt(e.target.value))} className="w-full bg-slate-900 text-emerald-400 p-4 rounded-xl border border-white/10 font-bold text-center text-3xl outline-none focus:border-emerald-400 focus:bg-black transition-all italic" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-8 border-t border-white/5">
          <button onClick={handleSave} disabled={saving} className={`px-12 py-4 rounded-xl font-bold text-xs uppercase tracking-[0.4em] transition-all shadow-xl border border-white/10 relative overflow-hidden group/save ${saving ? 'bg-slate-900 text-slate-700' : 'bg-indigo-600 text-white hover:bg-white hover:text-indigo-600 hover:scale-105 active:scale-95'}`}>
            <span className="relative z-10">{saving ? 'Synchronizing...' : 'Save Configuration'}</span>
            <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover/save:animate-[shimmer_3s_infinite]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Company;