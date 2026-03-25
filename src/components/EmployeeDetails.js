import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeAPI } from '../services/api';
import { useCompany } from '../context/CompanyContext';
import { getCookie } from '../utils/cookies';
import Layout from './Layout';
import DeleteConfirmModal from './common/DeleteConfirmModal';
import { useToast } from '../context/ToastContext';
import { getCurrencySymbol } from '../utils/currency';

const fmtDate = (d, opts = { year: 'numeric', month: 'short', day: 'numeric' }) => d ? new Date(d).toLocaleDateString('en-US', opts).toUpperCase() : '—';

const CVSection = ({ title, icon, children }) => (
  <div className="mb-20 animate-in fade-in slide-in-from-left-12 duration-1200 italic group/sec">
    <div className="flex items-center gap-8 mb-12 pb-6 border-b-4 border-slate-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 group-hover/sec:bg-indigo-50 transition-colors rounded-bl-[5rem]" />
      <span className="text-5xl grayscale group-hover/sec:grayscale-0 group-hover/sec:rotate-12 transition-all duration-700 relative z-10">{icon}</span>
      <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.6em] relative z-10 underline underline-offset-[12px] decoration-slate-100 group-hover/sec:decoration-indigo-100 transition-all"> {title} </h3>
    </div>
    <div className="relative pl-6"> {children} </div>
  </div>
);

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useCompany();
  const toast = useToast();
  const selectedCompany = state.selectedCompany;
  const cvRef = useRef(null);

  const [employee, setEmployee] = useState(null);
  const [company, setCompany] = useState(null);
  const [designations, setDesignations] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showDesignationModal, setShowDesignationModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const [newSalary, setNewSalary] = useState('');
  const [salaryReason, setSalaryReason] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [selectedManager, setSelectedManager] = useState('');

  const currSym = getCurrencySymbol(company?.currency);

  useEffect(() => {
    if (selectedCompany && selectedCompany.id !== 'personal') fetchEmployeeDetails();
    else navigate('/overview');
  }, [selectedCompany, id]);

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      const res = await employeeAPI.getById(selectedCompany.id, id);
      setEmployee(res.data.employee);
      setCompany(res.data.company);
      setDesignations(res.data.designations || []);
      setNewDesignation(res.data.employee.designation);
      setSelectedManager(res.data.employee.reportsTo || '');

      const token = getCookie('authToken');
      const orgRes = await fetch(`/api/companies/${selectedCompany.id}/organogram`, { headers: { Authorization: `Bearer ${token}` } });
      if (orgRes.ok) {
        const orgData = await orgRes.json();
        setAllEmployees(orgData.employees || []);
      }
    } catch { navigate('/employees'); }
    finally { setLoading(false); }
  };

  const handleUpdateSalary = async () => {
    try {
      await employeeAPI.updateSalary(selectedCompany.id, id, parseFloat(newSalary), salaryReason);
      setShowSalaryModal(false); setNewSalary(''); setSalaryReason(''); fetchEmployeeDetails();
      toast.showToast('SALARY_REGISTRY_LOCKED_SYNCED', 'success');
    } catch { toast.showToast('SYNC_FAILED_LINK_UNSTABLE', 'error'); }
  };

  const handleUpdateDesignation = async () => {
    try {
      await employeeAPI.updateDesignation(selectedCompany.id, id, newDesignation);
      setShowDesignationModal(false); fetchEmployeeDetails();
      toast.showToast('PROTOCOL_RE-ID_LOCKED_VERIFIED', 'success');
    } catch { toast.showToast('RE-ID_FAILED_AUTH_NEG', 'error'); }
  };

  const handleUpdateManager = async () => {
    try {
      const token = getCookie('authToken');
      const res = await fetch(`/api/companies/${selectedCompany.id}/reporting-manager`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: employee.memberId, reportsTo: selectedManager || null }),
      });
      if (res.ok) { setShowManagerModal(false); fetchEmployeeDetails(); toast.showToast('CHAIN_OF_COMMAND_SYNCHRONIZED', 'success'); }
      else { const d = await res.json(); toast.showToast(d.message || 'UPDATE_FAILED', 'error'); }
    } catch { toast.showToast('COMMS_FAILURE_UPLINK_DOWN', 'error'); }
  };

  const handleRemoveEmployee = async () => {
    try { await employeeAPI.remove(selectedCompany.id, id); navigate('/employees'); toast.showToast('ENTITY_DECOMMISSIONED_PURGED', 'warning'); }
    catch { toast.showToast('PURGE_PROTOCOL_FAILED', 'error'); }
  };

  const handleExportPDF = async () => {
    if (!cvRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cvRef.current, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false });
      const imgData = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`<html><head><title>${employee.name} // CV_NODE_EXPORT</title><style>@media print { @page { margin: 0; size: A4; } }</style></head><body style="margin:0;padding:0;"><img src="${imgData}" style="width:100%;display:block;page-break-inside:avoid;" /><script>window.onload = function() { window.print(); window.close(); };</script></body></html>`);
      printWindow.document.close();
    } catch (e) { console.error('Export_Failure', e); toast.showToast('EXPORT_PROTOCOL_ERROR_DECRYPT', 'error'); }
    finally { setExporting(false); }
  };

  if (loading) return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-10 py-40 text-center animate-pulse space-y-20">
        <div className="w-40 h-40 border-[12px] border-slate-50 border-t-indigo-600 rounded-[4rem] animate-spin mx-auto shadow-24" />
        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.8em] italic underline underline-offset-[16px] decoration-indigo-200">DECRYPTING_ENTITY_DETAILED_LOGS_AND_SERVICE_HISTORY...</p>
      </div>
    </Layout>
  );

  const profile = employee.profile || {};
  const managerName = allEmployees.find(e => e.id === employee.reportsTo)?.name;
  const joinedYears = employee.joinedAt ? Math.floor((Date.now() - new Date(employee.joinedAt)) / (1000 * 60 * 60 * 24 * 365)) : 0;

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto px-10 py-20 space-y-20 animate-in fade-in slide-in-from-bottom-24 duration-1200 italic pb-60">
        {/* Tactical Command Bar */}
        <div className="flex flex-wrap justify-between items-center no-print gap-12 bg-white/50 backdrop-blur-3xl p-8 rounded-[4rem] border-4 border-slate-50 shadow-24 relative overflow-hidden group/bar">
          <div className="absolute top-0 right-0 w-32 h-full bg-slate-50/50 -skew-x-12 translate-x-16 group-hover/bar:translate-x-0 transition-transform duration-1000" />
          <button onClick={() => navigate('/employees')} className="group flex items-center gap-6 px-12 py-6 bg-slate-950 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-24 hover:bg-slate-800 transition-all active:scale-95 italic overflow-hidden relative z-10 border-4 border-white/5">
            <span className="relative z-10 flex items-center gap-6"> <span className="text-2xl group-hover:-translate-x-4 transition-transform duration-1000">←</span> BACK_TO_PRIMARY_FRAME </span>
            <div className="absolute top-0 left-0 w-full h-full bg-white/5 -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
          </button>

          <div className="flex flex-wrap items-center gap-8 relative z-10">
            {!employee.isOwner && (
              <div className="flex gap-6 p-3 bg-slate-50 rounded-[3rem] border-4 border-white shadow-inner">
                <button onClick={() => setShowDesignationModal(true)} className="px-10 py-5 bg-white border-4 border-slate-100 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-sm hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95 italic hover:shadow-24">ROLE_RE-ID</button>
                <button onClick={() => setShowSalaryModal(true)} className="px-10 py-5 bg-white border-4 border-slate-100 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-sm hover:text-emerald-600 hover:border-emerald-100 transition-all active:scale-95 italic hover:shadow-24">PAY_VECTOR</button>
                <button onClick={() => setShowManagerModal(true)} className="px-10 py-5 bg-white border-4 border-slate-100 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-sm hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95 italic hover:shadow-24">COMMAND_CO</button>
              </div>
            )}
            <button onClick={handleExportPDF} disabled={exporting} className={`px-16 py-7 rounded-[3rem] font-black text-[11px] uppercase tracking-[0.5em] shadow-24 transition-all active:scale-95 italic group overflow-hidden relative border-4 border-white/10 ${exporting ? 'bg-slate-200 text-slate-500' : 'bg-slate-950 text-white hover:bg-black hover:scale-105'}`}>
              <span className="relative z-10 flex items-center gap-6"> <span className="text-3xl opacity-40 group-hover:rotate-12 transition-all">⬇️</span> {exporting ? 'EXTRACTING...' : 'EXPORT_CV_PROTOCOL'} </span>
              {exporting && <div className="absolute bottom-0 left-0 h-2 bg-indigo-500 animate-[progress_2s_infinite]" />}
            </button>
            {!employee.isOwner && (
              <button onClick={() => setShowRemoveModal(true)} className="px-12 py-7 bg-rose-600 text-white rounded-[3rem] font-black text-[11px] uppercase tracking-[0.5em] shadow-24 hover:bg-rose-950 transition-all group relative overflow-hidden italic border-4 border-white/10">
                <span className="relative z-10">TERMINATE_ENTITY_LINK</span>
                <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
              </button>
            )}
          </div>
        </div>

        {/* CV High-Performance Document */}
        <div ref={cvRef} className="bg-white rounded-[8rem] shadow-24 border-8 border-slate-50 overflow-hidden relative group/cv animate-in zoom-in-95 duration-1000">
          <div className="absolute top-0 right-0 p-40 text-[260px] font-black italic opacity-5 grayscale pointer-events-none select-none">NODE</div>
          <div className={`p-24 pb-48 text-white relative overflow-hidden flex items-end gap-20 border-b-[24px] border-b-indigo-600/10 ${profile.coverPhoto ? 'bg-black' : 'bg-slate-950 border-white/5'}`}>
            {profile.coverPhoto && <img src={profile.coverPhoto} className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale group-hover/cv:grayscale-0 transition-all duration-2000" />}
            <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-indigo-500/10 rounded-full blur-[220px] -translate-y-1/2 translate-x-1/2 group-hover/cv:translate-x-1/4 transition-transform duration-2000 animate-pulse"></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-end gap-20 w-full">
              <div className="w-80 h-80 rounded-[5rem] border-[12px] border-white shadow-24 overflow-hidden bg-slate-900 flex items-center justify-center shrink-0 group-hover/cv:rotate-12 group-hover/cv:scale-110 transition-all duration-1000 relative">
                {profile.profilePicture ? <img src={profile.profilePicture} className="w-full h-full object-cover" /> : <span className="text-[120px] font-black italic shadow-24">{employee.name.charAt(0).toUpperCase()}</span>}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/cv:opacity-100 transition-opacity" />
              </div>

              <div className="flex-1 min-w-0 pb-10">
                <h1 className="text-8xl font-black uppercase italic tracking-tighter mb-8 drop-shadow-2xl group-hover/cv:text-indigo-400 transition-colors duration-1000 leading-none">{employee.name}</h1>
                <div className="flex flex-wrap items-center gap-10 mb-16">
                  <span className="px-10 py-4 bg-indigo-600 text-white rounded-[2rem] text-[12px] font-black uppercase tracking-[0.5em] shadow-24 italic border-t-4 border-white/20 hover:scale-110 hover:bg-white hover:text-indigo-600 transition-all cursor-context-menu">{employee.designation?.toUpperCase()}</span>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-white italic tracking-tighter">{profile.title?.toUpperCase() || 'ACTIVE_SECTOR_UNIT'}</span>
                    <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.6em] italic mt-2 opacity-60 underline underline-offset-8 decoration-white/10">AUTH_LEVEL_01 // SEC_01_PROTO_LINK</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-8">
                  {[{ icon: '✉️', val: employee.email, label: 'COMMS_REF' }, { icon: '📞', val: profile.phone, label: 'DIRECT_LINK_ID' }, { icon: '📍', val: profile.location, label: 'GEO_STATION_SYNC' }].map((c, i) => c.val && (
                    <div key={i} className="flex flex-col gap-3 p-6 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border-2 border-white/10 group/tag hover:bg-white/10 hover:border-indigo-400 transition-all duration-700">
                      <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic opacity-40 group-hover/tag:opacity-100">{c.label}</div>
                      <div className="flex items-center gap-6 text-[12px] font-black uppercase tracking-widest text-white italic">
                        <span className="text-3xl grayscale group-hover/tag:grayscale-0 transition-all duration-700">{c.icon}</span> {c.val.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden xl:flex flex-col items-end pb-12">
                <div className="text-[12px] font-black text-indigo-400/30 uppercase tracking-[1em] mb-6 italic border-b-2 border-indigo-400/10 pb-4">TENURE_CYCLES_LOG</div>
                <div className="text-8xl font-black text-indigo-400 italic tracking-tighter group-hover:scale-110 transition-transform duration-1000 select-none shadow-sm">{joinedYears} <span className="text-3xl uppercase tracking-[0.3em] ml-4 opacity-40 italic">Units</span></div>
                <div className="text-[10px] font-black text-white/20 uppercase italic tracking-[0.5em] mt-6 bg-white/5 px-6 py-2 rounded-2xl">{fmtDate(employee.joinedAt)} » PRESENT_CONTINUUM</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen">
            <div className="lg:col-span-8 p-20 space-y-28 border-r-8 border-slate-50 border-dashed relative">
              <div className="absolute inset-y-0 right-0 w-2 h-full bg-slate-50/50 -translate-x-1" />
              {profile.summary && (
                <CVSection title="MISSION_CRITICAL_OBJECTIVES" icon="📑">
                  <div className="relative group/summary">
                    <div className="absolute -left-16 top-0 h-full w-3 bg-indigo-600 rounded-full animate-pulse group-hover/summary:w-4 transition-all" />
                    <p className="text-2xl font-black text-slate-500 leading-relaxed italic border-l-[16px] border-slate-50 pl-16 py-14 bg-slate-50/50 rounded-[4rem] shadow-inner uppercase tracking-tight group-hover/summary:bg-white group-hover/summary:shadow-24 transition-all duration-1000"> "{profile.summary}" </p>
                  </div>
                </CVSection>
              )}

              {profile.experience?.length > 0 && (
                <CVSection title="SERVICE_HISTORY_PROTOCOL" icon="⚔️">
                  <div className="space-y-20 pl-12 border-l-[16px] border-slate-50 relative group/timeline">
                    {profile.experience.map((exp, i) => (
                      <div key={i} className="relative group/exp animate-in slide-in-from-bottom-12 duration-1000" style={{ animationDelay: `${i * 200}ms` }}>
                        <div className="absolute -left-[54px] top-8 w-10 h-10 bg-white border-[12px] border-indigo-600 rounded-full shadow-24 group-hover/exp:scale-150 transition-all duration-1000 group-hover/exp:rotate-180" />
                        <div className="pl-20 space-y-8">
                          <div className="flex flex-wrap justify-between items-start gap-8">
                            <h4 className="text-5xl font-black text-slate-950 uppercase italic tracking-tighter group-hover/exp:text-indigo-600 transition-colors leading-none">{exp.title}</h4>
                            <span className="px-8 py-3 bg-slate-950 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest italic shadow-24 border-t-4 border-white/10">{fmtDate(exp.startDate, { year: 'numeric' })} <span className="opacity-40 px-2">—</span> {exp.current ? 'PRESENT' : fmtDate(exp.endDate, { year: 'numeric' })}</span>
                          </div>
                          <div className="text-[14px] font-black text-indigo-600 uppercase tracking-[0.6em] italic flex items-center gap-8 opacity-60 group-hover/exp:opacity-100 transition-all">
                            <span className="bg-indigo-50 px-6 py-2 rounded-2xl">{exp.company?.toUpperCase()}</span> <span className="w-20 h-1 bg-indigo-100" /> <span className="opacity-40">{exp.location?.toUpperCase() || 'GLOBAL_SECTOR_ID'}</span>
                          </div>
                          <p className="text-lg font-black text-slate-400 leading-relaxed max-w-3xl italic opacity-60 group-hover/exp:opacity-100 transition-opacity uppercase tracking-tight underline underline-offset-8 decoration-slate-50">{exp.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CVSection>
              )}

              <CVSection title="INTERNAL_OPERATIONAL_METRICS" icon="📊">
                <div className="grid grid-cols-2 gap-12 bg-slate-50 p-20 rounded-[6rem] border-8 border-white shadow-inner relative group/metrics overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />
                  {[{ label: 'ENTITY_IDENTIFIER_HASH', val: employee.memberId }, { label: 'OPERATIONAL_SECTOR_LOC', val: profile.department || 'CORE_REGISTRY' }, { label: 'COMMAND_FLOW_AUTHORITY', val: managerName || 'DIRECT_OVERSEER_ALPHA' }, { label: 'RESOURCE_CREDIT_RATE', val: `${currSym}${employee.currentSalary?.toLocaleString()}`, color: 'emerald-600' }].map((item, i) => (
                    <div key={i} className="space-y-4 relative z-10 hover:translate-x-8 transition-transform duration-1000 group/metric border-l-4 border-transparent hover:border-indigo-400 pl-6">
                      <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em] italic border-b-2 border-slate-200 pb-3 group-hover/metric:text-indigo-600 group-hover/metric:border-indigo-100 transition-all">{item.label}</div>
                      <div className={`text-2xl font-black uppercase italic tracking-tighter leading-none ${item.color ? `text-${item.color}` : 'text-slate-950'}`}>{item.val || 'NEGATIVE_VAL'}</div>
                    </div>
                  ))}
                </div>
              </CVSection>

              {!employee.isOwner && employee.salaryHistory?.length > 0 && (
                <CVSection title="FINANCIAL_VECTOR_TELEMETRY" icon="📉">
                  <div className="space-y-8">
                    {employee.salaryHistory.slice().reverse().slice(0, 5).map((h, i) => (
                      <div key={i} className="flex justify-between items-center p-12 bg-white border-4 border-slate-50 rounded-[4.5rem] hover:shadow-24 hover:border-indigo-100 hover:-translate-y-4 transition-all duration-1000 group/history relative overflow-hidden animate-in slide-in-from-right-8" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full" />
                        <div className="flex items-center gap-12">
                          <div className="w-24 h-24 rounded-[3.5rem] bg-emerald-50 text-emerald-600 flex items-center justify-center text-5xl border-4 border-emerald-100 italic shadow-24 group-hover/history:rotate-12 group-hover/history:scale-110 transition-all duration-1000">💰</div>
                          <div>
                            <div className="text-4xl font-black text-slate-950 italic tracking-tighter leading-none mb-4 group-hover/history:text-emerald-600 transition-colors">{currSym}{h.amount?.toLocaleString()}</div>
                            <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] italic underline underline-offset-8 decoration-slate-50">{h.reason?.toUpperCase() || 'SYSTEM_SYNC_ADJUSTMENT_LOG'}</div>
                          </div>
                        </div>
                        <div className="text-[12px] font-black text-indigo-400 uppercase italic tracking-[0.3em] bg-slate-50 px-8 py-3 rounded-[1.5rem] border-2 border-white shadow-inner">{fmtDate(h.effectiveDate)}</div>
                      </div>
                    ))}
                  </div>
                </CVSection>
              )}
            </div>

            <div className="lg:col-span-4 bg-slate-50/20 p-24 space-y-32 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:60px_60px] opacity-40 pointer-events-none" />
              <div className="absolute -bottom-64 -left-64 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[180px] pointer-events-none" />

              {profile.skills?.length > 0 && (
                <CVSection title="CORE_NODE_CAPABILITIES" icon="⚡">
                  <div className="flex flex-wrap gap-6">
                    {profile.skills.map((skill, i) => (
                      <span key={i} className="px-10 py-5 bg-slate-950 text-white rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.4em] italic shadow-24 hover:bg-indigo-600 hover:scale-125 hover:-rotate-6 transition-all cursor-context-menu border-b-8 border-white/10 group/skill relative">
                        <span className="relative z-10">{skill.toUpperCase()}</span>
                        <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
                      </span>
                    ))}
                  </div>
                </CVSection>
              )}

              {profile.languages?.length > 0 && (
                <CVSection title="COMMUNICATION_PROTOCOLS" icon="🗣️">
                  <div className="space-y-8">
                    {profile.languages.map((lang, i) => (
                      <div key={i} className="p-10 bg-white rounded-[4rem] border-4 border-slate-50 hover:shadow-24 hover:border-indigo-100 transition-all duration-1000 group/lang relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full translate-x-16 group-hover/lang:translate-x-0 transition-transform duration-1000" />
                        <div className="flex justify-between items-center mb-6">
                          <span className="text-2xl font-black text-slate-950 uppercase italic tracking-tighter group-hover/lang:text-indigo-600 transition-colors">{typeof lang === 'string' ? lang.toUpperCase() : lang.name?.toUpperCase()}</span>
                          <span className="px-6 py-2 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase italic shadow-24 border-t-2 border-white/20">{lang.level?.toUpperCase() || 'MASTERED'}</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner border-2 border-white">
                          <div className="h-full bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,1)] animate-[progress_3s_ease-out]" style={{ width: '92%' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CVSection>
              )}

              {profile.interests?.length > 0 && (
                <CVSection title="NEURAL_COGNITIVE_BIAS" icon="🎨">
                  <div className="flex flex-wrap gap-6">
                    {profile.interests.map((hobby, i) => (
                      <div key={i} className="px-10 py-5 bg-white backdrop-blur-3xl border-4 border-slate-50 rounded-[3rem] text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] italic hover:text-indigo-600 hover:border-indigo-100 hover:shadow-24 transition-all duration-1000 cursor-default hover:-translate-y-2">#{hobby?.toUpperCase()}</div>
                    ))}
                  </div>
                </CVSection>
              )}

              <div className="pt-60 text-center opacity-10 filter grayscale group-hover/cv:opacity-40 transition-all duration-2000 pointer-events-none select-none relative z-10">
                <div className="text-[220px] mb-12 leading-none italic animate-pulse drop-shadow-2xl">🛡️</div>
                <div className="text-[16px] font-black uppercase tracking-[1.5em] text-slate-950 italic border-t-4 border-slate-950 inline-block pt-10">OFFTIX_SECURE_ID</div>
                <div className="text-[10px] font-black uppercase text-slate-500 mt-10 tracking-[1em] italic opacity-40">VERIFIED_SECTOR_SYNC // CYCLE_2026_DELTA_7</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Terminal Modals */}
        {showSalaryModal && (
          <Modal title="FINANCIAL_VECTOR_ADJUSTMENT" onClose={() => setShowSalaryModal(false)}>
            <div className="space-y-12 animate-in fade-in zoom-in-95 duration-1000">
              <div className="space-y-6">
                <label className="text-[12px] font-black uppercase tracking-[0.8em] text-slate-400 ml-10 italic">NEW_PAYMENT_VECTOR_BASE_CALIBRATION</label>
                <div className="relative group/input">
                  <span className="absolute left-14 top-1/2 -translate-y-1/2 text-7xl font-black italic text-indigo-400 opacity-20 group-hover/input:opacity-100 transition-opacity duration-1000">{currSym}</span>
                  <input type="number" value={newSalary} onChange={e => setNewSalary(e.target.value)} className="w-full pl-36 pr-16 py-14 bg-slate-50 border-[6px] border-slate-50 rounded-[5rem] font-black text-8xl italic outline-none focus:bg-white focus:border-indigo-400 focus:shadow-24 transition-all shadow-inner tracking-tighter" placeholder="00.00" />
                </div>
              </div>
              <div className="space-y-6">
                <label className="text-[12px] font-black uppercase tracking-[0.8em] text-slate-400 ml-10 italic">RATIONALE_PROTOCOL_JUSTIFICATION_LOGS</label>
                <input type="text" value={salaryReason} onChange={e => setSalaryReason(e.target.value)} className="w-full bg-slate-50 border-[6px] border-slate-50 p-12 rounded-[4rem] font-black text-sm uppercase italic tracking-[0.5em] outline-none focus:bg-white focus:border-indigo-400 focus:shadow-24 transition-all shadow-inner" placeholder="INPUT_ADJUSTMENT_JUSTIFICATION_METADATA..." />
              </div>
              <div className="flex flex-col sm:flex-row justify-end pt-12 gap-10 border-t-4 border-slate-50">
                <button onClick={() => setShowSalaryModal(false)} className="flex-1 py-10 text-[12px] font-black uppercase tracking-[0.8em] text-slate-400 hover:text-rose-600 transition-all italic underline underline-offset-[16px] decoration-slate-100">ABORT_PROTOCOL</button>
                <button onClick={handleUpdateSalary} className="flex-[2] py-10 bg-slate-950 text-white rounded-[4rem] font-black text-[12px] uppercase tracking-[0.6em] shadow-24 hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all italic group relative overflow-hidden border-4 border-white/5">
                  <span className="relative z-10">LOCK_FINANCIAL_VECTOR_INTO_REGISTRY</span>
                  <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
                </button>
              </div>
            </div>
          </Modal>
        )}

        {showDesignationModal && (
          <Modal title="SECTOR_IDENTITY_RE-ID_PROTOCOL" onClose={() => setShowDesignationModal(false)}>
            <div className="space-y-16 animate-in fade-in zoom-in-95 duration-1000">
              <div className="space-y-6">
                <label className="text-[12px] font-black uppercase tracking-[0.8em] text-slate-400 ml-10 italic">TARGET_DESIGNATION_RANK_CALIBRATION</label>
                <div className="relative group/input">
                  <select value={newDesignation} onChange={e => setNewDesignation(e.target.value)} className="w-full pl-16 pr-24 py-12 bg-slate-50 border-[6px] border-slate-50 rounded-[5rem] font-black text-xl md:text-3xl uppercase italic tracking-[0.4em] outline-none focus:bg-white focus:border-indigo-400 focus:shadow-24 transition-all cursor-pointer appearance-none shadow-inner">
                    {designations.map(d => <option key={d._id} value={d.name} className="bg-white text-slate-950 italic">{d.name.toUpperCase()}</option>)}
                  </select>
                  <div className="absolute right-16 top-1/2 -translate-y-1/2 text-4xl pointer-events-none opacity-20 group-hover/input:opacity-100 transition-opacity">▼</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-10 pt-12 border-t-4 border-slate-50">
                <button onClick={() => setShowDesignationModal(false)} className="flex-1 py-10 text-[12px] font-black uppercase tracking-[0.8em] text-slate-400 hover:text-rose-600 transition-all italic underline underline-offset-[16px] decoration-slate-100">ABORT_RE-ID</button>
                <button onClick={handleUpdateDesignation} className="flex-[2] py-10 bg-slate-950 text-white rounded-[4rem] font-black text-[12px] uppercase tracking-[0.6em] shadow-24 hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all italic group relative overflow-hidden border-4 border-white/5">
                  <span className="relative z-10">AUTHORIZE_SECTOR_RE-ID_SEQUENCE</span>
                  <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
                </button>
              </div>
            </div>
          </Modal>
        )}

        {showManagerModal && (
          <Modal title="COMMAND_UPLINK_HIERARCHY_SYNC" onClose={() => setShowManagerModal(false)}>
            <div className="space-y-16 animate-in fade-in zoom-in-95 duration-1000">
              <div className="space-y-6">
                <label className="text-[12px] font-black uppercase tracking-[0.8em] text-slate-400 ml-10 italic">PRIMARY_COMMANDER_NODE_IDENT_SELECT</label>
                <div className="relative group/input">
                  <select value={selectedManager} onChange={e => setSelectedManager(e.target.value)} className="w-full pl-16 pr-24 py-12 bg-slate-50 border-[6px] border-slate-50 rounded-[5rem] font-black text-[14px] md:text-[16px] uppercase italic tracking-[0.4em] outline-none focus:bg-white focus:border-emerald-400 focus:shadow-24 transition-all cursor-pointer appearance-none shadow-inner">
                    <option value="" className="bg-slate-950 text-white italic">TOP_LEVEL_SITUATIONAL_COMMAND_CENTER</option>
                    {allEmployees.filter(e => e.id !== id).map(emp => (<option key={emp.id} value={emp.id} className="bg-white text-slate-950 italic">{emp.name.toUpperCase()} :: STRATA: {emp.designation.toUpperCase()}</option>))}
                  </select>
                  <div className="absolute right-16 top-1/2 -translate-y-1/2 text-4xl pointer-events-none opacity-20 group-hover/input:opacity-100 transition-opacity">▼</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-10 pt-12 border-t-4 border-slate-50">
                <button onClick={() => setShowManagerModal(false)} className="flex-1 py-10 text-[12px] font-black uppercase tracking-[0.8em] text-slate-400 hover:text-rose-600 transition-all italic underline underline-offset-[16px] decoration-slate-100">ABORT_SYNC</button>
                <button onClick={handleUpdateManager} className="flex-[2] py-10 bg-slate-950 text-white rounded-[4rem] font-black text-[12px] uppercase tracking-[0.6em] shadow-24 hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all italic group relative overflow-hidden border-4 border-white/5">
                  <span className="relative z-10">LOCK_CHAIN_OF_COMMAND_UPLINK</span>
                  <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
                </button>
              </div>
            </div>
          </Modal>
        )}

        <DeleteConfirmModal isOpen={showRemoveModal} onClose={() => setShowRemoveModal(false)} onConfirm={handleRemoveEmployee} title="TACTICAL_ENTITY_LINK_TERMINATION" message={`Proceeding with this protocol will permanently excise ${employee?.name?.toUpperCase()} from the central organizational registry. This action is irreversible and will propagate across all sector structural layers. confirm authorization status.`} itemName={employee?.name?.toUpperCase()} />
        <style dangerouslySetInnerHTML={{
          __html: `
        @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
      ` }} />
      </div>
    </Layout>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center p-12 backdrop-blur-3xl bg-slate-950/70 animate-in fade-in duration-1000 italic">
    <div className="bg-white rounded-[7rem] w-full max-w-5xl p-20 shadow-24 border-8 border-slate-950 animate-in zoom-in-95 slide-in-from-top-32 duration-1200 relative overflow-hidden shadow-[0_0_150px_rgba(0,0,0,0.5)]">
      <div className="absolute top-0 right-0 p-32 text-[240px] font-black italic opacity-5 grayscale pointer-events-none select-none">MOD_V6</div>
      <div className="flex justify-between items-center mb-20 relative z-10">
        <div className="space-y-4">
          <h3 className="text-5xl font-black text-slate-950 uppercase italic tracking-tighter leading-none"> {title} </h3>
          <p className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.8em] italic opacity-40 underline underline-offset-8 decoration-slate-100">System_Protocol_Adjustment_Link_Interface</p>
        </div>
        <button onClick={onClose} className="w-24 h-24 flex items-center justify-center bg-slate-50 border-8 border-white rounded-[3rem] text-6xl text-slate-400 hover:text-slate-950 hover:bg-white hover:shadow-24 hover:rotate-90 hover:scale-110 transition-all duration-1000 shadow-inner italic">×</button>
      </div>
      <div className="relative z-10"> {children} </div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[160px] pointer-events-none" />
    </div>
  </div>
);

export default EmployeeDetails;
