import React, { useState, useEffect } from 'react';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { leaveAPI } from '../services/api';
import Layout from './Layout';
import PageHeader from './PageHeader';
import DeleteConfirmModal from './common/DeleteConfirmModal';

const LeaveManagement = () => {
  const { state: authState } = useAuth();
  const { state } = useCompany();
  const selectedCompany = state.selectedCompany;
  const toast = useToast();
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-leaves');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    halfDay: false,
    halfDayPeriod: 'morning',
    reason: '',
    notes: ''
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  useEffect(() => {
    if (selectedCompany && selectedCompany.id !== 'personal') {
      fetchLeaves();
      fetchLeaveBalance();
    }
  }, [selectedCompany, activeTab]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeTab === 'my-leaves') params.employeeId = authState.user._id;
      else if (activeTab === 'pending-approvals') params.status = 'pending';
      const response = await leaveAPI.getAll(selectedCompany.id, params);
      setLeaves(response.data.leaves || []);
    } catch (error) { console.error('TEMPORAL_LOG_SYNC_FAILURE_SIG', error); }
    finally { setLoading(false); }
  };

  const fetchLeaveBalance = async () => {
    try {
      if (!authState.user?._id) return;
      const year = new Date().getFullYear();
      const response = await leaveAPI.getBalance(selectedCompany.id, authState.user._id, year);
      setLeaveBalance(response.data.balance);
    } catch (error) { console.error('RESOURCE_MATRIX_QUERY_ERROR_SIG', error); }
  };

  const handleRequestLeave = async (e) => {
    e.preventDefault();
    try {
      await leaveAPI.request(selectedCompany.id, formData);
      setShowRequestModal(false);
      setFormData({ leaveType: 'casual', startDate: '', endDate: '', halfDay: false, halfDayPeriod: 'morning', reason: '', notes: '' });
      fetchLeaves();
      fetchLeaveBalance();
      toast?.showToast?.('TEMPORAL_DOWNTIME_LOG_TRANSMITTED_SUCCESSFULLY', 'success');
    } catch (error) { toast?.showToast?.(error.response?.data?.error || 'REGISTRY_REJECTION_PROTOCOL_403', 'error'); }
  };

  const handleApproveReject = async (leaveId, status, rejectionReason = null) => {
    try {
      await leaveAPI.updateStatus(selectedCompany.id, leaveId, status, rejectionReason);
      fetchLeaves();
      toast?.showToast?.(`DIRECTIVE_ACCESS_${status.toUpperCase()}_VERIFIED_AND_LOCKED`, 'success');
    } catch (error) { toast?.showToast?.(error.response?.data?.error || 'AUTHORIZATION_FAILURE_VERIFICATION_SIG', 'error'); }
  };

  const handleCancelLeave = (leaveId) => setDeleteModal({ isOpen: true, id: leaveId });

  const confirmCancelLeave = async () => {
    try {
      await leaveAPI.cancel(selectedCompany.id, deleteModal.id);
      fetchLeaves();
      fetchLeaveBalance();
      setDeleteModal({ isOpen: false, id: null });
      toast?.showToast?.('DIRECTIVE_PURGED_FROM_CENTRAL_REGISTRY', 'warning');
    } catch (error) { toast?.showToast?.(error.response?.data?.error || 'PURGE_PROTOCOL_FAILURE_SIG', 'error'); }
  };

  const getLeaveTypeLabel = (type) => {
    const labels = { sick: 'SICK_LEAVE_PROTOCOL', casual: 'CASUAL_DOWNTIME', annual: 'ANNUAL_REFRESH_CYCLE', maternity: 'MATERNITY_LEAVE_SIG', paternity: 'PATERNITY_LEAVE_SIG', unpaid: 'UNPAID_STANDBY_MODE', other: 'SPECIAL_DIRECTIVE_X' };
    return labels[type] || type.toUpperCase().replace('_', ' ');
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();

  const renderLeaveBalance = () => {
    if (!leaveBalance) return null;
    return (
      <div className="bg-slate-950 p-20 rounded-[6rem] text-white shadow-24 mb-24 relative overflow-hidden group border-8 border-slate-900 animate-in fade-in duration-1200 italic">
        <div className="absolute top-0 right-0 p-32 text-[260px] font-black italic opacity-[0.03] grayscale pointer-events-none select-none text-white leading-none">MATRIX</div>
        <div className="flex flex-col md:flex-row items-center gap-12 mb-20 relative z-10 border-b-8 border-white/5 pb-16">
          <div className="w-24 h-24 rounded-[3.5rem] bg-indigo-600 border-8 border-white/10 flex items-center justify-center text-5xl shadow-24 group-hover:rotate-12 group-hover:scale-110 transition-all duration-1000 italic shrink-0 animate-pulse">📊</div>
          <div className="text-center md:text-left">
            <h3 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none mb-4 drop-shadow-sm">AVAILABILITY_RESOURCE_MATRIX</h3>
            <p className="text-[12px] font-black text-indigo-400 uppercase italic tracking-[0.6em] underline underline-offset-8 decoration-white/5"> TEMPORAL_REMAINING_RESOURCE_POTENTIAL_SURVEILLANCE </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
          {Object.entries(leaveBalance).map(([type, data]) => (
            <div key={type} className="p-12 bg-white/5 border-4 border-white/10 rounded-[4.5rem] group/item hover:bg-white/10 hover:border-indigo-500/30 transition-all duration-1000 hover:scale-110 active:scale-95 cursor-default relative overflow-hidden italic shadow-inner">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full translate-x-12 -translate-y-12 group-hover/item:translate-x-0 group-hover/item:translate-y-0 transition-all duration-1000" />
              <div className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-8 italic opacity-60 group-hover/item:opacity-100 transition-opacity"> {getLeaveTypeLabel(type)} </div>
              <div className="flex items-end gap-6 mb-10">
                <span className="text-7xl font-black tracking-tighter leading-none text-white group-hover/item:text-indigo-400 transition-all group-hover/item:scale-110 origin-left"> {data.remaining === Infinity ? '∞' : data.remaining} </span>
                <span className="text-[12px] font-black text-slate-500 uppercase tracking-tighter mb-4 italic opacity-40"> / {data.total === Infinity ? '∞' : data.total} UNITS </span>
              </div>
              <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden shadow-inner p-1 border-2 border-white/5">
                <div className="h-full bg-indigo-500 rounded-full shadow-[0_0_25px_rgba(79,70,229,0.8)] transition-all duration-[2.5s] ease-out-expo relative overflow-hidden" style={{ width: data.total === Infinity ? '2%' : `${(data.remaining / data.total) * 100}%` }}>
                  <div className="absolute inset-x-0 bottom-0 h-full bg-white/10 animate-[shimmer_2s_infinite]" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute top-0 left-0 w-[100%] h-[100%] bg-indigo-600/[0.03] rounded-full blur-[180px] -translate-y-1/2 -translate-x-1/2 pointer-events-none group-hover:scale-125 transition-transform duration-[4s]" />
      </div>
    );
  };

  const renderLeaveCard = (leave, index) => {
    const canApprove = activeTab === 'pending-approvals';
    const canCancel = leave.employee?._id === authState.user?._id && ['pending', 'approved'].includes(leave.status);
    const cfg = {
      pending: { bg: 'bg-amber-500', label: 'STANDBY_APPROVAL_SIG', icon: '⏳' },
      approved: { bg: 'bg-emerald-600', label: 'VERIFIED_DOWNTIME_LOG', icon: '✓' },
      rejected: { bg: 'bg-rose-600', label: 'AUTHORIZATION_DENIED', icon: '✕' },
      cancelled: { bg: 'bg-slate-900', label: 'DIRECTIVE_EXPUNGED', icon: '🗑' }
    }[leave.status.toLowerCase()] || { bg: 'bg-slate-400', label: 'STATUS_UNKNOWN', icon: '❓' };

    return (
      <div key={leave._id} className="group bg-white p-14 rounded-[6rem] border-8 border-slate-50 shadow-sm hover:shadow-24 transition-all duration-1200 relative overflow-hidden flex flex-col lg:flex-row items-center gap-16 italic hover:-translate-y-8 lg:hover:-translate-y-16 animate-in slide-in-from-bottom-24" style={{ animationDelay: `${index * 80}ms` }}>
        <div className="absolute top-0 left-0 w-4 h-full bg-slate-100 group-hover:bg-indigo-600 transition-all duration-1000 shadow-[2px_0_10px_rgba(0,0,0,0.02)]" />
        <div className="absolute top-0 right-0 p-20 text-[260px] font-black italic opacity-[0.015] grayscale pointer-events-none select-none text-slate-950 leading-none group-hover:scale-125 transition-transform duration-[3s]">LOG</div>

        <div className="flex flex-col items-center shrink-0 w-56 text-center space-y-6">
          <div className="w-40 h-40 rounded-[4.5rem] bg-slate-950 border-[12px] border-white shadow-24 flex items-center justify-center text-white text-7xl font-black group-hover:rotate-12 group-hover:scale-110 transition-all duration-1000 italic relative overflow-hidden group/avatar">
            <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10" />
            {leave.employee?.name?.charAt(0).toUpperCase()}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group/avatar:opacity-100 transition-all">
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">RANK_ID</span>
            </div>
          </div>
          <div className={`px-10 py-3.5 rounded-[2rem] ${cfg.bg} text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-24 group-hover:scale-110 scale-95 transition-all flex items-center gap-4 border-4 border-white`}>
            <span className="text-2xl grayscale group-hover:grayscale-0 transition-transform duration-700">{cfg.icon}</span>
            {cfg.label}
          </div>
        </div>

        <div className="flex-1 min-w-0 text-center lg:text-left space-y-10">
          <div className="space-y-4">
            <h3 className="text-4xl lg:text-5xl font-black text-slate-950 uppercase tracking-tighter truncate leading-none drop-shadow-sm group-hover:text-indigo-600 transition-colors">{leave.employee?.name}</h3>
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest italic opacity-40 truncate underline underline-offset-8 decoration-slate-100"> REF_ID: {leave.employee?._id?.slice(-16).toUpperCase()} // {leave.employee?.email?.toUpperCase()} </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="p-10 bg-slate-50 border-8 border-white rounded-[3.5rem] hover:bg-white hover:border-indigo-100 hover:shadow-24 transition-all duration-1000 group/box relative overflow-hidden hover:-translate-y-4">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50/50 rounded-bl-full group-hover:w-20 group-hover:h-20 transition-all" />
              <div className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] italic mb-4 underline underline-offset-4 decoration-slate-100">PROTOCOL_MODE_SIG</div>
              <div className="text-lg font-black text-slate-950 uppercase flex flex-col items-center lg:items-start gap-2">
                <div className="flex items-center gap-4">
                  <span className="text-3xl opacity-20 grayscale-0 group-hover:opacity-100 transition-all duration-700 select-none group-hover:rotate-12">📋</span>
                  <span className="tracking-tighter">{getLeaveTypeLabel(leave.leaveType)}</span>
                </div>
                {leave.halfDay && <span className="px-6 py-1 bg-white border-2 border-indigo-50 text-indigo-600 text-[10px] rounded-full font-black tracking-widest italic group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">[{leave.halfDayPeriod.toUpperCase()}_CYCLE_ONLY]</span>}
              </div>
            </div>
            <div className="p-10 bg-slate-50 border-8 border-white rounded-[3.5rem] hover:bg-white hover:border-indigo-100 hover:shadow-24 transition-all duration-1000 group/box relative overflow-hidden hover:-translate-y-4">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50/50 rounded-bl-full group-hover:w-20 group-hover:h-20 transition-all" />
              <div className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] italic mb-4 underline underline-offset-4 decoration-slate-100">TEMPORAL_WINDOW_SIG</div>
              <div className="text-lg font-black text-slate-950 uppercase flex items-center justify-center lg:justify-start gap-4">
                <span className="text-3xl opacity-20 group-hover:opacity-100 transition-all duration-700 select-none group-hover:rotate-12">📅</span>
                <span className="tracking-tighter">{formatDate(leave.startDate)}</span>
                <span className="text-slate-300 px-2 group-hover:text-indigo-600 group-hover:translate-x-4 transition-all duration-700 group-hover:scale-150">➜</span>
                <span className="tracking-tighter text-indigo-600">{formatDate(leave.endDate).split(',')[0]}</span>
              </div>
            </div>
            <div className="p-10 bg-white border-8 border-indigo-50 rounded-[3.5rem] hover:bg-indigo-600 hover:border-white hover:shadow-24 transition-all duration-1000 group/box relative overflow-hidden group-hover:text-white hover:-translate-y-4">
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-bl-full group-hover:w-24 group-hover:h-24 transition-all" />
              <div className="text-[11px] font-black text-indigo-400 group-hover:text-white/50 uppercase tracking-[0.4em] italic mb-4 underline underline-offset-4 decoration-indigo-50">ALLOCATED_UNITS_SIG</div>
              <div className="text-3xl font-black text-indigo-600 group-hover:text-white uppercase flex items-center justify-center lg:justify-start gap-6 leading-none">
                <span className="text-5xl animate-pulse select-none filter drop-shadow-lg drop-shadow-indigo-500/30 group-hover:filter-none">⚡</span>
                <span className="tracking-tighter">{leave.totalDays} <span className="text-[12px] opacity-40 ml-2 group-hover:text-white/40">RESOURCE_DAYS</span></span>
              </div>
            </div>
          </div>

          <div className="mt-10 p-12 bg-slate-50 border-8 border-white rounded-[4rem] italic text-slate-400 text-lg leading-loose relative group-hover:bg-white group-hover:border-indigo-50 group-hover:text-slate-950 group-hover:shadow-24 transition-all duration-1200 border-l-[20px] border-l-slate-200 group-hover:border-l-indigo-600 shadow-inner group/reason overflow-hidden">
            <div className="absolute top-0 right-0 p-12 text-7xl font-black italic opacity-[0.03] select-none pointer-events-none group-hover/reason:opacity-10 transition-opacity">LOG_DATA</div>
            <span className="block text-[11px] font-black text-slate-300 uppercase tracking-[0.5em] mb-6 italic border-b-4 border-slate-50 group-hover:border-slate-50 pb-4 underline underline-offset-8 decoration-white group-hover:text-indigo-400">JUSTIFICATION_MISSION_RATIONALE_LOGGING_...</span>
            <span className="tracking-tighter font-black">"{leave.reason.toUpperCase()}"</span>
          </div>

          {leave.rejectionReason && (
            <div className="mt-8 p-10 bg-rose-50 border-8 border-white rounded-[3.5rem] text-rose-600 text-base font-black uppercase tracking-tight italic flex items-center gap-8 animate-in shake duration-1000 shadow-inner">
              <span className="text-6xl animate-bounce filter drop-shadow-xl select-none">⚠️</span>
              <div className="space-y-2">
                <p className="opacity-40 text-[10px] tracking-[0.6em] mb-3 underline underline-offset-4 decoration-rose-100">AUTHORIZATION_OVERRIDE_RATIONALE_SIG</p>
                <span className="text-xl tracking-tighter drop-shadow-sm">"{leave.rejectionReason.toUpperCase()}"</span>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 flex flex-col gap-6 w-full lg:w-72 opacity-0 group-hover:opacity-100 transition-all duration-1200 translate-x-40 group-hover:translate-x-0 relative z-10 space-y-4">
          {canApprove && (
            <div className="space-y-6">
              <button onClick={() => handleApproveReject(leave._id, 'approved')} className="w-full h-20 bg-slate-950 text-white rounded-[3rem] font-black text-[12px] uppercase tracking-[0.6em] shadow-24 hover:bg-emerald-600 hover:scale-110 active:scale-95 transition-all italic border-8 border-white group/auth relative overflow-hidden">
                <span className="relative z-10 flex items-center justify-center gap-4"> AUTHORIZE_SIG <span className="text-3xl group-hover/auth:translate-x-4 transition-transform duration-700">✓</span> </span>
                <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover/auth:animate-[shimmer_2s_infinite]" />
              </button>
              <button onClick={() => { const r = prompt('IDENTIFY_OVERRIDE_RATIONALE_FOR_DENIAL:'); if (r) handleApproveReject(leave._id, 'rejected', r); }} className="w-full h-20 bg-white text-rose-600 border-8 border-rose-50 rounded-[3rem] font-black text-[12px] uppercase tracking-[0.6em] hover:bg-rose-50 hover:border-rose-100 hover:scale-110 active:scale-95 transition-all italic group/deny relative overflow-hidden shadow-sm">
                <span className="relative z-10 flex items-center justify-center gap-4"> DENY_ACCESS <span className="text-3xl group-hover/deny:rotate-45 transition-transform duration-700">✕</span> </span>
              </button>
            </div>
          )}
          {canCancel && <button onClick={() => handleCancelLeave(leave._id)} className="w-full h-24 bg-slate-950 text-white rounded-[3.5rem] font-black text-[13px] uppercase tracking-[0.5em] shadow-24 hover:bg-rose-600 hover:scale-110 active:scale-95 transition-all italic border-8 border-white group/abort relative overflow-hidden">
            <span className="relative z-10 flex items-center justify-center gap-6"> ABORT_DOWNTIME_DIRECTIVE <span className="text-4xl group-hover/abort:rotate-90 transition-transform duration-700">🗑</span></span>
            <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
          </button>}
          <div className="p-4 bg-slate-50 border-4 border-white rounded-[2rem] text-center shadow-inner group/id-box hover:bg-white hover:border-indigo-100 transition-all transition-all duration-1000">
            <span className="text-[10px] font-black text-slate-300 group-hover:text-indigo-400 transition-colors uppercase tracking-[0.8em] italic">LOG_IDX: {leave._id?.slice(-8).toUpperCase()}</span>
          </div>
        </div>

        <div className="absolute -bottom-64 -right-64 w-[800px] h-[800px] bg-indigo-500/[0.04] rounded-full blur-[200px] group-hover:opacity-100 opacity-0 transition-opacity duration-3000 pointer-events-none group-hover:scale-125 transition-transform duration-[4s]" />
      </div>
    );
  };

  if (loading) return (
    <Layout>
      <div className="max-w-[1700px] mx-auto px-10 py-60 text-center animate-pulse space-y-16 italic">
        <div className="w-48 h-48 border-[20px] border-slate-50 border-t-indigo-600 rounded-[5rem] animate-spin mx-auto shadow-24" />
        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[1em] italic underline underline-offset-[24px] decoration-indigo-200">SYNCHRONIZING_TEMPORAL_DOWNTIME_REGISTRY_STREAMS_...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-[1700px] mx-auto px-8 py-20 animate-in fade-in duration-1500 italic pb-60">
        <PageHeader
          title="TEMPORAL_AVAILABILITY_MATRIX"
          subtitle="Strategic personnel downtime orchestration and mission-critical sustainability registry."
          icon={<div className="w-24 h-24 bg-slate-950 text-white rounded-[3.5rem] flex items-center justify-center text-5xl shadow-24 border-8 border-white shadow-indigo-950/20 group-hover:rotate-12 transition-transform duration-1000 italic shrink-0">🗓️</div>}
          stats={[{ label: 'PENDING_PROPOSALS_PULSE', value: leaves.filter(l => l.status === 'pending').length }, { label: 'ACTIVE_SECTOR_GRID', value: selectedCompany?.name?.toUpperCase() }]}
          actions={
            <button onClick={() => setShowRequestModal(true)} className="px-16 py-8 bg-slate-950 text-white rounded-[3.5rem] font-black text-[13px] uppercase tracking-[0.6em] shadow-24 hover:bg-indigo-600 hover:scale-110 active:scale-95 transition-all group overflow-hidden relative italic border-8 border-white shadow-indigo-950/20 shrink-0">
              <span className="relative z-10 flex items-center gap-8 underline decoration-white/20 underline-offset-[12px]">
                <span className="text-4xl group-hover:rotate-90 transition-transform duration-700">＋</span>
                INITIALIZE_LEAVE_PROTOCOL_SIG
              </span>
              <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
            </button>
          }
        />

        {activeTab === 'my-leaves' && renderLeaveBalance()}

        <div className="flex flex-wrap gap-8 py-6 px-8 mb-24 bg-white/70 backdrop-blur-3xl rounded-[4.5rem] border-8 border-slate-50 w-fit shadow-24 italic ring-4 ring-slate-100 group/nav-bar relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 via-transparent to-indigo-50/50 opacity-0 group-hover/nav-bar:opacity-100 transition-opacity duration-1000 pointer-events-none" />
          {[{ id: 'my-leaves', label: 'MY_PERSONAL_LOGS', icon: '👤' }, { id: 'all-leaves', label: 'GLOBAL_SECTOR_REGISTRY', icon: '🌍' }, { id: 'pending-approvals', label: 'AUTHORIZATION_STANDBY', icon: '⚖️' }].map((tab, idx) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-6 px-12 py-6 rounded-[3rem] text-[11px] font-black uppercase tracking-[0.4em] transition-all duration-700 relative overflow-hidden group/tab scale-95 hover:scale-100 ${activeTab === tab.id ? 'bg-slate-950 text-white shadow-24 scale-105 border-4 border-white' : 'text-slate-400 hover:text-slate-950 hover:bg-white hover:shadow-lg'}`}>
              <span className={`text-3xl grayscale transition-all duration-1000 ${activeTab === tab.id ? 'grayscale-0 rotate-12' : 'group-hover/tab:grayscale-0 group-hover/tab:rotate-12'}`}>{tab.icon}</span>
              <div className="flex flex-col items-start translate-y-1">
                <span className={`text-[8px] opacity-40 leading-none mb-1 transition-all ${activeTab === tab.id ? 'text-indigo-400 opacity-100 animate-pulse' : ''}`}>NODE_ST_0{idx + 1}</span>
                <span className="relative z-10 leading-none">{tab.label}</span>
              </div>
              {tab.id === 'pending-approvals' && leaves.filter(l => l.status === 'pending').length > 0 && activeTab !== tab.id && <span className="absolute top-1/2 right-4 -translate-y-1/2 w-4 h-4 rounded-full bg-rose-500 animate-ping shadow-[0_0_15px_rose]" />}
              {activeTab === tab.id && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-2 bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.8)] animate-in slide-in-from-bottom-4 duration-700" />}
            </button>
          ))}
        </div>

        <div className="space-y-16 pb-60">
          {leaves.length === 0 ? (
            <div className="bg-white p-60 rounded-[8rem] text-center border-[12px] border-dashed border-slate-50 shadow-24 animate-in zoom-in-95 duration-2000 italic flex flex-col items-center group/null relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 text-[280px] font-black italic opacity-[0.03] grayscale pointer-events-none select-none text-slate-950 leading-none">EMPTY</div>
              <div className="text-[240px] mb-20 grayscale opacity-10 group-hover/null:scale-125 group-hover/null:rotate-[15deg] group-hover/null:grayscale-0 transition-all duration-[3s] inline-block drop-shadow-2xl select-none">📭</div>
              <h3 className="text-8xl font-black text-slate-100 uppercase tracking-[1em] group-hover/null:text-slate-950 transition-colors leading-none tracking-tighter drop-shadow-sm">SECTOR_STATION_ACTIVE</h3>
              <p className="text-xl font-black text-slate-400 uppercase tracking-[0.8em] mt-16 italic max-w-5xl opacity-40 underline underline-offset-[24px] decoration-slate-100 text-center leading-relaxed">No pending downtime logs detected in current temporal sector registry. All personnel units are operational and synchronized with the core command signal grid.</p>
              <button onClick={() => setShowRequestModal(true)} className="mt-20 px-24 py-8 bg-indigo-600 text-white rounded-[3.5rem] font-black text-[13px] uppercase tracking-[0.6em] shadow-24 hover:bg-slate-950 hover:scale-110 active:scale-95 transition-all italic border-8 border-white group relative overflow-hidden">
                <span className="relative z-10 flex items-center gap-8"> FORGE_INITIAL_TEMPORAL_REQUEST_SIG <span className="text-4xl group-hover:translate-x-6 transition-transform duration-1000">➜</span> </span>
                <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
              </button>
              <div className="absolute -bottom-64 -left-64 w-[1200px] h-[1200px] bg-indigo-500/[0.04] rounded-full blur-[240px] pointer-events-none group-hover/null:scale-150 transition-transform duration-[4s]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-14 animate-in fade-in slide-in-from-bottom-24 duration-1500"> {leaves.map((l, i) => renderLeaveCard(l, i))} </div>
          )}
        </div>

        {/* Modal Interaction Surface Gamma */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-3xl flex items-center justify-center z-[2500] p-12 lg:p-24 animate-in fade-in duration-700 italic">
            <div className="bg-white rounded-[7rem] w-full max-w-[1200px] shadow-24 border-8 border-white/20 overflow-hidden relative animate-in zoom-in-95 slide-in-from-top-48 duration-1000 max-h-[96vh] flex flex-col">
              <div className="absolute top-0 right-0 p-32 text-[320px] font-black italic opacity-[0.015] grayscale pointer-events-none select-none text-slate-950 leading-none">REQUEST</div>
              <div className="px-20 py-16 bg-slate-950 text-white relative overflow-hidden shrink-0 border-b-8 border-white/10">
                <div className="relative z-10 flex justify-between items-center">
                  <div className="space-y-4">
                    <h3 className="text-6xl font-black uppercase italic tracking-tighter leading-none mb-2 drop-shadow-2xl">INITIATE_DOWNTIME</h3>
                    <p className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.8em] italic underline underline-offset-12 decoration-white/5 opacity-80"> PERSONNEL_TEMPORAL_REQUEST_PROTOCOL_775_SIG </p>
                  </div>
                  <button onClick={() => setShowRequestModal(false)} className="w-24 h-24 rounded-[3.5rem] bg-white/5 border-8 border-white/10 flex items-center justify-center text-white hover:bg-rose-600 hover:border-white hover:text-white hover:scale-125 hover:rotate-90 transition-all text-5xl shadow-24 italic font-black shrink-0 relative z-20">✕</button>
                </div>
                <div className="absolute top-0 right-0 w-[50%] h-full bg-indigo-500/10 rounded-full blur-[180px] pointer-events-none animate-pulse" />
              </div>
              <div className="p-16 lg:p-24 overflow-y-auto scrollbar-none flex-1 space-y-20 bg-white relative z-10">
                <form onSubmit={handleRequestLeave} className="space-y-20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
                    <div className="space-y-8 bg-slate-50/50 p-12 rounded-[4rem] border-4 border-slate-50 shadow-inner group/field hover:bg-white hover:border-indigo-100 hover:shadow-24 transition-all duration-1000">
                      <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.6em] italic ml-10 underline underline-offset-8 decoration-slate-100 mb-6 block">DIRECTIVE_STRAT_TYPE</label>
                      <select value={formData.leaveType} onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })} required className="w-full px-12 py-8 bg-white border-8 border-white rounded-[3.5rem] text-xl font-black text-slate-950 focus:border-indigo-600 transition-all uppercase outline-none italic tracking-widest shadow-sm appearance-none cursor-pointer">
                        <option value="casual">CASUAL_DOWNTIME_LOG</option><option value="sick">SICK_MEDICAL_PROTOCOL</option><option value="annual">ANNUAL_REFRESH_CYCLE</option><option value="maternity">MATERNITY_SECTOR_EXIT</option><option value="paternity">PATERNITY_SECTOR_EXIT</option><option value="unpaid">UNPAID_STANDBY_MODE</option><option value="other">SPECIAL_MISSION_DIRECTIVE</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center gap-10 p-12 bg-slate-50/50 border-4 border-slate-50 rounded-[4rem] group/half cursor-pointer hover:bg-white hover:border-indigo-100 hover:shadow-24 transition-all duration-1000 shadow-inner" onClick={() => setFormData({ ...formData, halfDay: !formData.halfDay })}>
                        <div className={`w-28 h-12 rounded-[2rem] p-2 transition-all duration-1000 flex border-4 border-white shadow-24 ${formData.halfDay ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                          <div className={`w-6 h-6 bg-white rounded-full transition-all duration-1000 shadow-lg ${formData.halfDay ? 'translate-x-[4.2rem] scale-125 rotate-[360deg]' : ''}`} />
                        </div>
                        <div className="space-y-2">
                          <div className="text-[12px] font-black text-slate-950 uppercase tracking-[0.6em] italic underline underline-offset-4 decoration-slate-100">PARTIAL_SHIFT_LINK</div>
                          <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic opacity-40"> ENABLE_HALF_TEMPORAL_CYCLE_ONLY </div>
                        </div>
                      </div>
                      {formData.halfDay && <div className="animate-in slide-in-from-right-16 duration-700 p-12 bg-indigo-600 rounded-[4rem] space-y-8 italic shadow-24 border-8 border-white group/segment transition-all scale-105 origin-top">
                        <label className="text-[11px] font-black text-white/50 uppercase tracking-[0.6em] italic ml-10 underline underline-offset-8 decoration-white/10 mb-4 block">SHIFT_SEGMENT_DEFINITION_DELTA</label>
                        <select value={formData.halfDayPeriod} onChange={e => setFormData({ ...formData, halfDayPeriod: e.target.value })} className="w-full px-12 py-6 bg-white border-0 rounded-[3rem] text-xl font-black text-indigo-950 uppercase italic outline-none shadow-24 tracking-tighter cursor-pointer hover:scale-105 transition-transform appearance-none text-center">
                          <option value="morning">MORNING_ACCESS_CYCLE_SIG</option><option value="afternoon">AFTERNOON_ACCESS_CYCLE_SIG</option>
                        </select>
                      </div>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    <div className="space-y-8 bg-slate-50/50 p-12 rounded-[4rem] border-4 border-slate-50 shadow-inner group/field hover:bg-white hover:border-indigo-100 hover:shadow-24 transition-all duration-1000">
                      <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] italic ml-10 underline underline-offset-8 decoration-slate-100 mb-6 block">TEMPORAL_ORIGIN_SYNC</label>
                      <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} required className="w-full px-12 py-7 bg-white border-8 border-white rounded-[3rem] text-3xl font-black text-indigo-600 outline-none focus:border-indigo-600 transition-all italic text-center tracking-tighter shadow-sm" />
                    </div>
                    <div className="space-y-8 bg-slate-50/50 p-12 rounded-[4rem] border-4 border-slate-50 shadow-inner group/field hover:bg-white hover:border-indigo-100 hover:shadow-24 transition-all duration-1000">
                      <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] italic ml-10 underline underline-offset-8 decoration-slate-100 mb-6 block">TEMPORAL_TERMINUS_SYNC</label>
                      <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} required className="w-full px-12 py-7 bg-white border-8 border-white rounded-[3rem] text-3xl font-black text-indigo-600 outline-none focus:border-indigo-600 transition-all italic text-center tracking-tighter shadow-sm" />
                    </div>
                  </div>
                  <div className="space-y-8 bg-slate-50/50 p-16 rounded-[6rem] border-4 border-slate-50 shadow-inner group/field hover:bg-white hover:border-indigo-100 hover:shadow-24 transition-all duration-[1.5s]">
                    <label className="text-[13px] font-black text-slate-400 uppercase tracking-[0.6em] italic ml-16 underline underline-offset-[16px] decoration-slate-100 mb-12 block"> MISSION_RATIONALE_JUSTIFICATION_LOGS_FINAL </label>
                    <textarea value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} required placeholder="INPUT_DETAILED_TACTICAL_JUSTIFICATION_FOR_SYSTEM_DOWNTIME_PROTOCOL_REGISTRY_ARCHIVE_..." className="w-full px-16 py-12 bg-white border-8 border-white rounded-[5rem] text-2xl font-black text-slate-950 outline-none focus:border-indigo-600 transition-all italic leading-relaxed min-h-[300px] shadow-sm tracking-tighter scrollbar-none pb-20" />
                  </div>
                  <div className="flex flex-col md:flex-row gap-16 pt-16 border-t-8 border-slate-50 pb-20">
                    <button type="button" onClick={() => setShowRequestModal(false)} className="flex-1 py-10 text-[14px] font-black uppercase tracking-[0.8em] text-slate-300 hover:text-rose-600 transition-all italic text-center underline underline-offset-[24px] decoration-slate-50 hover:decoration-rose-100">X_ABORT_MODAL_COMMAND</button>
                    <button type="submit" className="flex-[2] h-28 bg-slate-950 text-white rounded-[4rem] font-black text-[16px] uppercase tracking-[0.8em] shadow-24 hover:bg-indigo-600 hover:scale-[1.05] active:scale-95 transition-all group relative overflow-hidden italic border-8 border-white min-w-[500px] shadow-indigo-950/20">
                      <span className="relative z-10 flex items-center justify-center gap-10">
                        <span className="text-5xl group-hover:rotate-12 transition-transform duration-700">📜</span>
                        PUSH_REQUEST_TO_ENTROPY_SECTOR
                        <span className="text-4xl group-hover:translate-x-6 transition-transform duration-1000">➜</span>
                      </span>
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
                    </button>
                  </div>
                </form>
              </div>
              <div className="absolute -bottom-64 -right-64 w-[800px] h-[800px] bg-indigo-500/[0.05] rounded-full blur-[180px] pointer-events-none -z-0 group-hover:scale-125 transition-transform duration-[3s]" />
            </div>
          </div>
        )}
        <DeleteConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null })} onConfirm={confirmCancelLeave} title="ABORT_LEAVE_DIRECTIVE_SEQ" message="Confirm authorization to permanently excise this downtime log from the central organic registry. Protocol status: IRREVERSIBLE_PURGE_AUTHORIZED." itemName="THIS_TEMPORAL_RESOURCE_LOG_SIG" confirmButtonText="AUTHORIZE_ABORT_SEQUENCE" />
      </div>
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent opacity-20 pointer-events-none blur-sm" />
    </Layout>
  );
};

export default LeaveManagement;
