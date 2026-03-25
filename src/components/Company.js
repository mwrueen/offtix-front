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
    } catch (error) { console.error('Sector_Fetch_Failure', error); setCompany(null); }
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
      <div className="flex flex-col items-center justify-center p-60 animate-pulse space-y-16">
        <div className="w-40 h-40 border-[16px] border-slate-50 border-t-indigo-600 rounded-[4rem] animate-spin shadow-24"></div>
        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.8em] italic underline underline-offset-[16px] decoration-indigo-200">Synchronizing_Sector_Flux_Matrix...</p>
      </div>
    </Layout>
  );

  if (!company) return (
    <Layout>
      <div className="max-w-6xl mx-auto my-40 bg-white rounded-[7rem] p-32 shadow-24 border-8 border-slate-50 text-center relative overflow-hidden group animate-in zoom-in-95 duration-1200 italic">
        <div className="absolute top-0 right-0 p-32 text-[260px] font-black italic opacity-[0.03] grayscale pointer-events-none select-none text-slate-900">LOCKED</div>
        <div className="relative z-10 space-y-16">
          <div className="text-[200px] group-hover:scale-125 group-hover:rotate-12 transition-all duration-2000 inline-block grayscale group-hover:grayscale-0 drop-shadow-2xl select-none">
            {selectedCompany?.id === 'personal' ? '👤' : '🏢'}
          </div>
          <div className="space-y-8">
            <h2 className="text-7xl font-black text-slate-950 uppercase tracking-tighter italic mb-8 drop-shadow-sm group-hover:text-indigo-600 transition-all">
              {selectedCompany?.id === 'personal' ? 'PRIVATE_WORKSPACE_LOCKED' : 'ENTITY_SECTOR_OFFLINE'}
            </h2>
            <p className="text-xl font-black text-slate-400 italic max-w-3xl mx-auto leading-relaxed opacity-60 underline underline-offset-[20px] decoration-slate-100 uppercase tracking-tight">
              {selectedCompany?.id === 'personal'
                ? 'Current authorization is restricted to personal data streams only. Initialize an organizational node to access enterprise-level surveillance overview.'
                : 'The requested sector is currently unreachable or non-existent in the registry. You may not have the required neural clearance to synchronize with this data node.'}
            </p>
          </div>
          {selectedCompany?.id === 'personal' && (
            <button
              onClick={() => navigate('/create-company')}
              className="mt-12 px-24 py-10 bg-slate-950 text-white rounded-[4rem] font-black text-[13px] uppercase tracking-[0.8em] transition-all shadow-24 hover:bg-indigo-600 hover:scale-110 active:scale-95 border-8 border-white group/btn relative overflow-hidden"
            >
              <span className="relative z-10">+ INITIALIZE_NEW_CLUSTER_PROTOCOL</span>
              <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
            </button>
          )}
        </div>
        <div className="absolute -bottom-48 -left-48 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[180px] group-hover:scale-150 transition-transform duration-2000 pointer-events-none"></div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-[1700px] mx-auto px-10 py-20 space-y-24 animate-in fade-in duration-1200 italic pb-60">
        <PageHeader
          title={company.name.toUpperCase()}
          subtitle={company.description || 'MISSION_STATEMENT_AWAITING_NEURAL_ENCRYPTION'}
          icon={<div className="w-24 h-24 bg-slate-950 text-white rounded-[3rem] flex items-center justify-center font-black text-6xl italic border-8 border-white shadow-24 group-hover:rotate-12 transition-transform duration-1000 shadow-indigo-950/20">{company.name?.charAt(0)}</div>}
          stats={[
            { label: 'INDUSTRY_CODE_X', value: company.industry?.toUpperCase() || 'CORE_REG' },
            { label: 'NODE_COUNT_SIG', value: company.members?.length || '0' },
            { label: 'ORIGIN_CYCLE', value: company.foundedYear || 'ALPHA' }
          ]}
          actions={
            <div className="flex flex-wrap gap-8">
              {userPermissions.addEmployee && (
                <button
                  onClick={() => navigate('/add-employee')}
                  className="px-16 py-7 bg-slate-950 text-white rounded-[3rem] font-black text-[12px] uppercase tracking-[0.6em] shadow-24 hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all italic border-4 border-white/5 relative overflow-hidden group/btn"
                >
                  <span className="relative z-10 flex items-center gap-6"> <span className="text-2xl group-hover/btn:rotate-90 transition-transform">➕</span> INTEGRATE_NODE_UPLINK </span>
                  <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover/btn:animate-[shimmer_3s_infinite]" />
                </button>
              )}
              {userPermissions.manageCompanySettings && (
                <button
                  onClick={() => navigate('/edit-company-info')}
                  className="px-12 py-7 bg-white border-4 border-slate-50 text-slate-400 rounded-[3rem] font-black text-[11px] uppercase tracking-[0.5em] transition-all hover:text-indigo-600 hover:border-indigo-100 hover:shadow-24 active:scale-95 italic group/reconfig"
                >
                  <span className="group-hover/reconfig:rotate-180 transition-transform duration-1000 inline-block mr-4">✏️</span> RECONFIG_SECTOR_STRATA
                </button>
              )}
            </div>
          }
        />

        {/* Intelligence Grid Delta */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-14">
          {[
            { label: 'TOTAL_PERSONNEL_NODES', value: company.members?.length || 0, icon: '👥', color: 'indigo' },
            { label: 'PROTOCOL_DEFINITIONS_SIG', value: company.designations?.length || 0, icon: '🎯', color: 'emerald' },
            { label: 'TEMPORAL_ORIGIN_CYCLE', value: company.foundedYear || 'N/A', icon: '🗓', color: 'amber' },
            { label: 'ENTITY_MAGNITUDE_RANK', value: company.companySize || 'N/P', icon: '🏢', color: 'rose' }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-14 rounded-[5rem] border-4 border-slate-50 shadow-sm hover:shadow-24 transition-all duration-1000 group/card relative overflow-hidden hover:-translate-y-4 animate-in zoom-in-95" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="absolute top-0 right-0 p-12 text-[120px] opacity-[0.03] grayscale group-hover/card:scale-125 group-hover/card:rotate-12 transition-all duration-1000 select-none grayscale group-hover/card:grayscale-0">{stat.icon}</div>
              <div className="relative z-10 flex flex-col justify-between h-full space-y-10">
                <div className={`text-6xl font-black text-slate-950 italic tracking-tighter leading-none group-hover/card:text-${stat.color}-600 transition-colors`}>{stat.value}</div>
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em] italic flex items-center gap-6 underline underline-offset-[12px] decoration-slate-50 group-hover/card:decoration-indigo-100 transition-all">
                  <div className={`w-4 h-4 rounded-full bg-${stat.color}-500 shadow-[0_0_20px_rgba(0,0,0,0.1)] group-hover/card:scale-150 transition-all group-hover/card:animate-ping`} />
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Operational Hubs Gamma */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Comms Network Node */}
          <section className="bg-white p-20 rounded-[6rem] border-8 border-slate-50 shadow-24 group overflow-hidden relative animate-in slide-in-from-left-12 duration-1200">
            <div className="absolute top-0 right-0 p-24 text-[240px] font-black italic opacity-[0.02] grayscale pointer-events-none select-none text-slate-900 leading-none">@</div>
            <h3 className="text-4xl font-black text-slate-950 uppercase italic tracking-tighter mb-20 flex items-center gap-8 relative z-10 leading-none">
              <span className="w-6 h-6 rounded-[1.5rem] bg-indigo-600 shadow-[0_0_25px_rgba(79,70,229,0.5)] animate-pulse" />
              COMMUNICATIONS_MATRIX_SYNC
            </h3>
            <div className="space-y-10 relative z-10">
              {[
                { label: 'ENCRYPTED_EMAIL_PROTOCOL', value: company.email, icon: '✉️' },
                { label: 'SECURE_VOICE_LINK_ID', value: company.phone, icon: '📞' },
                { label: 'WEB_INTERFACE_LINK_CORE', value: company.website, icon: '🌐', isLink: true }
              ].map((item, i) => item.value && (
                <div key={i} className="flex items-center gap-12 p-10 rounded-[4rem] bg-slate-50/50 border-4 border-slate-50 hover:bg-white hover:border-indigo-100 hover:shadow-24 transition-all duration-1000 group/item relative overflow-hidden animate-in slide-in-from-left-8" style={{ animationDelay: `${i * 150}ms` }}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/80 rounded-bl-full translate-x-12 -translate-y-12 group-hover/item:translate-x-0 group-hover/item:translate-y-0 transition-transform duration-1000 shadow-sm" />
                  <div className="w-24 h-24 rounded-[2.5rem] bg-white border-4 border-slate-100 flex items-center justify-center text-4xl shadow-24 group-hover/item:scale-110 group-hover/item:rotate-12 transition-all duration-700 shrink-0 italic relative z-10">
                    {item.icon}
                  </div>
                  <div className="relative z-10 flex-1 min-w-0">
                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] mb-3 italic underline underline-offset-8 decoration-slate-100">{item.label}</div>
                    {item.isLink ? (
                      <a href={item.value} target="_blank" rel="noreferrer" className="text-2xl font-black text-indigo-600 hover:text-slate-950 hover:decoration-indigo-400 transition-colors uppercase tracking-tighter italic decoration-indigo-200 underline underline-offset-[12px] truncate block">{item.value}</a>
                    ) : (
                      <div className="text-2xl font-black text-slate-950 uppercase tracking-tighter italic truncate">{item.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/[0.03] rounded-full blur-[160px] pointer-events-none group-hover:scale-150 transition-transform duration-2000" />
          </section>

          {/* Geospatial Sector Node */}
          <section className="bg-slate-950 p-20 rounded-[6rem] shadow-24 border-8 border-slate-900 group relative overflow-hidden animate-in slide-in-from-right-12 duration-1200">
            <div className="absolute top-0 right-0 p-32 text-[260px] font-black italic opacity-[0.03] grayscale pointer-events-none select-none text-white leading-none">LOC</div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#4f46e5_0%,transparent_70%)] opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-1000" />
            <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-20 flex items-center gap-8 relative z-10 leading-none">
              <span className="w-6 h-6 rounded-[1.5rem] bg-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.8)] animate-pulse" />
              GEOSPATIAL_SECTOR_COORDINATES
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
              {[
                { label: 'PRIMARY_TERMINAL_BASE', value: company.address, full: true },
                { label: 'METRO_CORE_ZONE', value: company.city },
                { label: 'SECTOR_STATE_REGION', value: company.state },
                { label: 'NATION_IDENT_SIG', value: company.country },
                { label: 'ZIP_INDEX_HASH', value: company.zipCode }
              ].map((loc, i) => loc.value && (
                <div key={i} className={`p-10 bg-white/5 rounded-[2.5rem] border-4 border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-700 italic group/loc hover:-translate-y-2 animate-in slide-in-from-right-8 ${loc.full ? 'md:col-span-2' : ''}`} style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="text-[11px] font-black text-white/20 uppercase tracking-[0.6em] mb-3 italic underline underline-offset-8 decoration-white/5 group-hover/loc:decoration-emerald-400/20">{loc.label}</div>
                  <div className="text-xl font-black text-white uppercase italic tracking-tighter leading-relaxed group-hover/loc:text-emerald-400 transition-colors truncate">{loc.value}</div>
                </div>
              ))}
            </div>
            <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[180px] group-hover:scale-125 transition-transform duration-2000 pointer-events-none" />
          </section>
        </div>

        {/* Neural Registry Stream Delta */}
        <section className="bg-white p-20 rounded-[7rem] border-8 border-slate-50 shadow-24 relative group/registry animate-in slide-in-from-bottom-20 duration-1200">
          <div className="absolute top-0 right-0 p-32 text-[260px] font-black italic opacity-[0.02] grayscale pointer-events-none select-none text-slate-900 leading-none">PERSONNEL</div>
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-12 px-8 relative z-10">
            <div className="space-y-6">
              <h3 className="text-5xl font-black text-slate-950 uppercase italic tracking-tighter leading-none"> PERSONNEL_REGISTRY_STREAM </h3>
              <p className="text-[12px] font-black text-indigo-600 uppercase tracking-[0.8em] italic animate-pulse flex items-center gap-6 underline underline-offset-[16px] decoration-indigo-50">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg" /> ACTIVE_SYNCHRONIZATION: {company.members?.length || 0} NODES_VERIFIED
              </p>
            </div>
            {userPermissions.viewDesignations && (
              <button onClick={() => navigate('/manage-roles')} className="bg-slate-950 text-white px-20 py-8 rounded-[3.5rem] font-black text-[12px] uppercase tracking-[0.6em] hover:bg-indigo-600 hover:scale-110 active:scale-95 transition-all shadow-24 italic border-8 border-white group/btn relative overflow-hidden shadow-indigo-950/20 shrink-0">
                <span className="relative z-10 flex items-center gap-8"> AUTHORIZE_ROLE_PROTOCOLS <span className="text-2xl group-hover/btn:translate-x-6 transition-transform duration-700">➜</span> </span>
                <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover/btn:animate-[shimmer_3s_infinite]" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-12 relative z-10">
            {company.members?.map((member, index) => (
              <div key={member._id} onClick={() => navigate(`/employees/${member.user?._id || member.user}`)} className="group/node p-12 rounded-[4.5rem] border-4 border-slate-50 bg-slate-50/50 hover:bg-white hover:border-indigo-100 hover:shadow-24 transition-all duration-1000 cursor-pointer overflow-hidden relative italic animate-in zoom-in-95 hover:-translate-y-4" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="flex flex-col items-center gap-10 mb-12 relative z-10 text-center pt-4">
                  <div className="w-28 h-28 rounded-[3.5rem] bg-slate-950 text-white border-8 border-white shadow-24 flex items-center justify-center font-black text-4xl italic group-hover/node:bg-indigo-600 transition-all duration-1000 group-hover/node:rotate-12 group-hover/node:scale-110 relative overflow-hidden">
                    {member.user?.name?.charAt(0)}
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/node:opacity-100 transition-opacity" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-2xl font-black text-slate-950 uppercase italic tracking-tighter truncate leading-none mb-4 group-hover/node:text-indigo-600 transition-colors drop-shadow-sm">{member.user?.name}</h4>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic truncate opacity-50 underline underline-offset-8 decoration-slate-100">{member.user?.email}</p>
                    {member.user?._id === company.owner?._id && <span className="mt-6 inline-block px-6 py-2 bg-amber-400 text-amber-950 text-[10px] font-black uppercase rounded-2xl shadow-24 italic border-2 border-white animate-bounce-slow">COMMANDER_ALPHA</span>}
                  </div>
                </div>

                <div className="flex items-center gap-8 p-10 bg-white rounded-[3rem] border-4 border-slate-50 group-hover/node:border-indigo-100 group-hover/node:shadow-inner transition-all duration-1000 relative z-10 shadow-sm border-l-[16px] border-l-slate-200 group-hover:border-l-indigo-600">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-3xl grayscale group-hover/node:grayscale-0 group-hover/node:scale-125 group-hover/node:rotate-12 transition-all duration-700">🛡️</div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none mb-2">AUTH_RANK</span>
                    <span className="text-[12px] font-black uppercase tracking-[0.4em] text-indigo-600 italic group-hover/node:text-slate-950 transition-colors">{member.designation?.toUpperCase() || 'UNLINKED_PROTOCOL'}</span>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover/node:scale-150 transition-transform duration-2000 opacity-0 group-hover/node:opacity-100" />
              </div>
            ))}
          </div>
          <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-indigo-500/[0.03] rounded-full blur-[180px] group-hover/registry:scale-125 transition-transform duration-2000 pointer-events-none" />
        </section>

        {/* Global Config Terminal Epsilon */}
        {userPermissions.manageCompanySettings && (
          <div className="animate-in slide-in-from-bottom-24 duration-1200 delay-300">
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
      toast.showToast('PROTOCOL_SYNCHRONIZATION_LOCKED', 'success');
      if (onRefresh) onRefresh();
    } catch (e) { toast.showToast('SYNC_FAILED_LINK_UNSTABLE', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-slate-950 p-20 rounded-[7rem] shadow-24 border-8 border-slate-900 relative overflow-hidden group italic">
      <div className="absolute top-0 right-0 p-32 text-[260px] font-black italic opacity-[0.03] grayscale pointer-events-none select-none text-white leading-none">CONFIG</div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-emerald-500/5 pointer-events-none group-hover:opacity-20 transition-opacity duration-1000" />
      <div className="relative z-10 space-y-24">
        <div className="flex flex-col md:flex-row items-center gap-14 text-center md:text-left">
          <div className="w-32 h-32 rounded-[3.5rem] bg-indigo-600 border-8 border-white/10 flex items-center justify-center text-7xl shadow-24 animate-pulse italic group-hover:rotate-12 transition-transform duration-1000 shadow-indigo-500/50 relative overflow-hidden">
            ⚙️
            <div className="absolute inset-0 bg-white/10 -translate-x-full animate-[shimmer_3s_infinite]" />
          </div>
          <div className="space-y-4">
            <h3 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-4"> SECTOR_CONFIGURATION_TERMINAL </h3>
            <p className="text-[14px] font-black text-indigo-400 uppercase tracking-[0.8em] italic opacity-60 underline underline-offset-[20px] decoration-white/5"> Core_System_Administrative_Directives // Security_Bypass: NEGATIVE </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-20">
          <div className="p-16 bg-white/5 rounded-[5rem] border-4 border-white/5 backdrop-blur-3xl group/sub hover:bg-white/10 hover:border-indigo-400/30 transition-all duration-1000 relative overflow-hidden italic">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[80px]" />
            <h4 className="text-[13px] font-black text-indigo-400 uppercase tracking-[0.8em] mb-16 flex items-center gap-10">
              <span className="w-20 h-1 bg-indigo-500 shadow-[0_0_20px_indigo] group-hover/sub:w-32 transition-all duration-1000" /> 01_FINANCIAL_NODE_CORE
            </h4>
            <div className="space-y-10 group/select">
              <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.6em] ml-10 italic underline underline-offset-8 decoration-white/5">PRIMARY_MARKET_CURRENCY_IDENT</label>
              <div className="relative">
                <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full bg-black/60 text-white px-12 py-10 rounded-[4rem] border-4 border-white/5 font-black text-xl md:text-2xl outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer uppercase italic shadow-inner">
                  {currencies.map(c => <option key={c.code} value={c.code} className="bg-slate-900">{c.symbol} {c.code} // PROTOCOL_{c.code}</option>)}
                </select>
                <div className="absolute right-12 top-1/2 -translate-y-1/2 text-4xl text-white/20 pointer-events-none group-hover/select:opacity-100 transition-all group-hover/select:translate-y-[-40%]">▼</div>
              </div>
            </div>
          </div>

          <div className="p-16 bg-white/5 rounded-[5rem] border-4 border-white/5 backdrop-blur-3xl group/sub hover:bg-white/10 hover:border-emerald-400/30 transition-all duration-1000 relative overflow-hidden italic">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[80px]" />
            <h4 className="text-[13px] font-black text-emerald-400 uppercase tracking-[0.8em] mb-16 flex items-center gap-10">
              <span className="w-20 h-1 bg-emerald-500 shadow-[0_0_20px_emerald] group-hover/sub:w-32 transition-all duration-1000" /> 02_TEMPORAL_REGISTRY_SYNC
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8 group/select">
                <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.6em] ml-10 italic underline underline-offset-8 decoration-white/5">DURATION_METRIC_UNIT</label>
                <div className="relative">
                  <select value={settings.timeTracking.defaultDurationUnit} onChange={e => updateCT('defaultDurationUnit', e.target.value)} className="w-full bg-black/60 text-white px-12 py-8 rounded-[3rem] border-4 border-white/5 font-black text-[12px] uppercase outline-none focus:border-emerald-500 transition-all cursor-pointer italic appearance-none shadow-inner">
                    <option value="minutes" className="bg-slate-900">MINUTES_LOG</option>
                    <option value="hours" className="bg-slate-900">HOURS_INDEX</option>
                    <option value="days" className="bg-slate-900">DAYS_CYCLE</option>
                  </select>
                  <div className="absolute right-10 top-1/2 -translate-y-1/2 text-3xl text-white/20 pointer-events-none group-hover/select:opacity-100 transition-all">▼</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8 pt-12">
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-white/20 uppercase tracking-widest text-center block">H/CYCLE</label>
                  <input type="number" value={settings.timeTracking.hoursPerDay} onChange={e => updateCT('hoursPerDay', parseInt(e.target.value))} className="w-full bg-black/60 text-emerald-400 p-8 rounded-[2.5rem] border-4 border-white/5 font-black text-center text-4xl outline-none focus:border-emerald-400 focus:bg-black transition-all shadow-inner italic" />
                </div>
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-white/20 uppercase tracking-widest text-center block">D/PULSE</label>
                  <input type="number" value={settings.timeTracking.daysPerWeek} onChange={e => updateCT('daysPerWeek', parseInt(e.target.value))} className="w-full bg-black/60 text-emerald-400 p-8 rounded-[2.5rem] border-4 border-white/5 font-black text-center text-4xl outline-none focus:border-emerald-400 focus:bg-black transition-all shadow-inner italic" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center md:justify-end pt-16 border-t-8 border-white/5">
          <button onClick={handleSave} disabled={saving} className={`px-24 py-10 rounded-[4rem] font-black text-[14px] uppercase tracking-[0.8em] transition-all shadow-24 border-8 border-white/10 relative overflow-hidden group/save ${saving ? 'bg-slate-900 text-slate-700 animate-pulse' : 'bg-indigo-600 text-white hover:bg-white hover:text-indigo-600 hover:scale-110 active:scale-95 shadow-indigo-600/30'}`}>
            <span className="relative z-10">{saving ? 'SYNCHRONIZING_CORE...' : 'AUTHORIZE_GLOBAL_PROTOCOL_SYNC'}</span>
            <div className="absolute top-0 left-0 w-full h-full bg-white/20 -translate-x-full group-hover/save:animate-[shimmer_3s_infinite]" />
          </button>
        </div>
      </div>
      <div className="absolute -bottom-64 -right-64 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[200px] pointer-events-none" />
    </div>
  );
};

export default Company;