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
  const { state: companyState } = useCompany();
  const selectedCompany = companyState.selectedCompany;
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
    } catch (error) { console.error('Error fetching records', error); }
    finally { setLoading(false); }
  };

  const fetchLeaveBalance = async () => {
    try {
      if (!authState.user?._id) return;
      const year = new Date().getFullYear();
      const response = await leaveAPI.getBalance(selectedCompany.id, authState.user._id, year);
      setLeaveBalance(response.data.balance);
    } catch (error) { console.error('Error fetching balance', error); }
  };

  const handleRequestLeave = async (e) => {
    e.preventDefault();
    try {
      await leaveAPI.request(selectedCompany.id, formData);
      setShowRequestModal(false);
      setFormData({ leaveType: 'casual', startDate: '', endDate: '', halfDay: false, halfDayPeriod: 'morning', reason: '', notes: '' });
      fetchLeaves();
      fetchLeaveBalance();
      toast?.showToast?.('Leave request submitted successfully.', 'success');
    } catch (error) { toast?.showToast?.(error.response?.data?.error || 'Failed to submit request.', 'error'); }
  };

  const handleApproveReject = async (leaveId, status, rejectionReason = null) => {
    try {
      await leaveAPI.updateStatus(selectedCompany.id, leaveId, status, rejectionReason);
      fetchLeaves();
      toast?.showToast?.(`Request ${status} successfully.`, 'success');
    } catch (error) { toast?.showToast?.(error.response?.data?.error || 'Action failed.', 'error'); }
  };

  const handleCancelLeave = (leaveId) => setDeleteModal({ isOpen: true, id: leaveId });

  const confirmCancelLeave = async () => {
    try {
      await leaveAPI.cancel(selectedCompany.id, deleteModal.id);
      fetchLeaves();
      fetchLeaveBalance();
      setDeleteModal({ isOpen: false, id: null });
      toast?.showToast?.('Leave request cancelled.', 'warning');
    } catch (error) { toast?.showToast?.(error.response?.data?.error || 'Cancellation failed.', 'error'); }
  };

  const getLeaveTypeLabel = (type) => {
    const labels = { sick: 'Sick Leave', casual: 'Casual Leave', annual: 'Annual Leave', maternity: 'Maternity', paternity: 'Paternity', unpaid: 'Unpaid Leave', other: 'Other' };
    return labels[type] || type.replace('_', ' ');
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const renderLeaveBalance = () => {
    if (!leaveBalance) return null;
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm mb-12 animate-in fade-in duration-500 font-sans">
        <div className="flex items-center gap-6 mb-10 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl shadow-sm border border-indigo-100/50">📊</div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 leading-tight">Leave Balance Overview</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Current entitlement and remaining units for this year.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {Object.entries(leaveBalance).map(([type, data]) => (
            <div key={type} className="p-8 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:bg-white hover:shadow-md hover:border-indigo-100 group">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4"> {getLeaveTypeLabel(type)} </div>
              <div className="flex items-end gap-3 mb-6">
                <span className="text-4xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors"> {data.remaining === Infinity ? 'Unlimited' : data.remaining} </span>
                <span className="text-[11px] font-bold text-slate-400 mb-1.5 uppercase"> / {data.total === Infinity ? '∞' : data.total} Days </span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: data.total === Infinity ? '5%' : `${(data.remaining / data.total) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLeaveCard = (leave, index) => {
    const canApprove = activeTab === 'pending-approvals';
    const canCancel = leave.employee?._id === authState.user?._id && ['pending', 'approved'].includes(leave.status);
    const cfg = {
      pending: { bg: 'bg-amber-100 text-amber-700', label: 'Pending Approval', icon: '⏳' },
      approved: { bg: 'bg-emerald-100 text-emerald-700', label: 'Approved', icon: '✓' },
      rejected: { bg: 'bg-rose-100 text-rose-700', label: 'Rejected', icon: '✕' },
      cancelled: { bg: 'bg-slate-100 text-slate-500', label: 'Cancelled', icon: '🗑' }
    }[leave.status.toLowerCase()] || { bg: 'bg-slate-100 text-slate-500', label: 'Unknown', icon: '❓' };

    return (
      <div key={leave._id} className="group bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col lg:flex-row shadow-slate-200/50 animate-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 50}ms` }}>
        <div className="flex flex-col items-center shrink-0 w-48 text-center space-y-4">
          <div className="w-24 h-24 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-4xl font-bold shadow-md">
            {leave.employee?.name?.charAt(0).toUpperCase()}
          </div>
          <div className={`px-4 py-1.5 rounded-full ${cfg.bg} text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border border-current/10`}>
            <span>{cfg.icon}</span>
            {cfg.label}
          </div>
        </div>

        <div className="flex-1 min-w-0 text-center lg:text-left space-y-6 pt-6 lg:pt-0 lg:ml-8 lg:border-l lg:pl-10 lg:border-slate-100">
          <div>
            <h3 className="text-2xl font-bold text-slate-950 truncate group-hover:text-indigo-600 transition-colors uppercase italic tracking-tight leading-none">{leave.employee?.name}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{leave.employee?.email}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Leave Type</div>
              <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>{getLeaveTypeLabel(leave.leaveType)}</span>
                {leave.halfDay && <span className="text-[9px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-bold">({leave.halfDayPeriod})</span>}
              </div>
            </div>
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Schedule</div>
              <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>{formatDate(leave.startDate)}</span>
                <span className="text-slate-300">→</span>
                <span className="text-indigo-600">{formatDate(leave.endDate)}</span>
              </div>
            </div>
            <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Total Units</div>
              <div className="text-2xl font-black text-indigo-600 leading-none">
                {leave.totalDays} <span className="text-[11px] font-bold">Days</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl font-sans italic text-slate-600 text-sm leading-relaxed">
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 opacity-60">Justification:</span>
            "{leave.reason}"
          </div>

          {leave.rejectionReason && (
            <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-bold flex items-center gap-4">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-[9px] uppercase tracking-widest mb-1 opacity-60">Rejection Reason:</p>
                <span className="italic">"{leave.rejectionReason}"</span>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 flex flex-col gap-3 w-full lg:w-48 lg:ml-10 justify-center">
          {canApprove && (
            <div className="space-y-3">
              <button onClick={() => handleApproveReject(leave._id, 'approved')} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-slate-900 transition-all active:scale-95">Approve</button>
              <button onClick={() => { const r = prompt('Reason for rejection:'); if (r) handleApproveReject(leave._id, 'rejected', r); }} className="w-full py-3 bg-white text-rose-600 border border-rose-100 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-50 transition-all font-sans italic">Reject</button>
            </div>
          )}
          {canCancel && <button onClick={() => handleCancelLeave(leave._id)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-600 transition-all font-sans">Cancel Request</button>}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60 italic">ID: {leave._id?.slice(-8).toUpperCase()}</div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <Layout>
      <div className="p-40 text-center animate-pulse space-y-8">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-sm" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Loading leaves...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-12 animate-in fade-in duration-700 pb-40">
        <PageHeader
          title="Leave Management"
          subtitle="Review, approve, and manage employee leave requests and balance."
          icon="🗓️"
          stats={[
            { label: 'Pending Requests', value: leaves.filter(l => l.status === 'pending').length },
            { label: 'Total Logs', value: leaves.length }
          ]}
          actions={
            <button onClick={() => setShowRequestModal(true)} className="px-10 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-slate-950 transition-all active:scale-95 flex items-center gap-2">
              <span>+</span> Request Leave
            </button>
          }
        />

        {activeTab === 'my-leaves' && renderLeaveBalance()}

        <div className="flex flex-wrap gap-4 p-2 bg-white rounded-2xl border border-slate-200 w-fit shadow-sm font-sans mb-12">
          {[{ id: 'my-leaves', label: 'My Records' }, { id: 'all-leaves', label: 'Company Registry' }, { id: 'pending-approvals', label: 'Pending Review' }].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-8 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}>
              {tab.label}
              {tab.id === 'pending-approvals' && leaves.filter(l => l.status === 'pending').length > 0 && activeTab !== tab.id && <span className="ml-3 w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse" />}
            </button>
          ))}
        </div>

        <div className="space-y-10">
          {leaves.length === 0 ? (
            <div className="bg-white p-40 rounded-3xl text-center border-4 border-dashed border-slate-100 animate-in zoom-in-95 group">
              <div className="text-8xl mb-8 opacity-20 group-hover:scale-110 transition-transform">📭</div>
              <h3 className="text-3xl font-bold text-slate-300 uppercase tracking-widest">No Leave Records</h3>
              <p className="text-sm font-bold text-slate-400 uppercase mt-4 italic max-w-xl mx-auto opacity-60">There are no leave requests found in this registry.</p>
              <button onClick={() => setShowRequestModal(true)} className="mt-8 px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-950 transition-all font-sans">Request Leave Now</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-10"> {leaves.map((l, i) => renderLeaveCard(l, i))} </div>
          )}
        </div>

        {showRequestModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[2500] p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-white/20 overflow-hidden relative animate-in zoom-in-95 duration-500 max-h-[90vh] flex flex-col font-sans">
              <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-2xl font-bold uppercase tracking-tight italic">Submit Leave Request</h3>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Fill in the details for approval.</p>
                </div>
                <button onClick={() => setShowRequestModal(false)} className="w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-rose-600 transition-all text-2xl font-bold">×</button>
              </div>
              <div className="p-8 lg:p-10 overflow-y-auto scrollbar-none flex-1 font-sans">
                <form onSubmit={handleRequestLeave} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Leave Category</label>
                      <select value={formData.leaveType} onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })} required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-950 focus:border-indigo-600 transition-all outline-none">
                        <option value="casual">Casual Leave</option><option value="sick">Sick Leave</option><option value="annual">Annual Leave</option><option value="maternity">Maternity</option><option value="paternity">Paternity</option><option value="unpaid">Unpaid Leave</option><option value="other">Other</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-4">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Shift Configuration</label>
                      <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-white hover:border-indigo-400 transition-all shadow-inner" onClick={() => setFormData({ ...formData, halfDay: !formData.halfDay })}>
                        <div className={`w-12 h-6 rounded-full p-1 transition-all flex shadow-inner ${formData.halfDay ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all ${formData.halfDay ? 'translate-x-6' : ''}`} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-950 uppercase tracking-widest">Half Day Request</span>
                      </div>
                      {formData.halfDay && <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                        <select value={formData.halfDayPeriod} onChange={e => setFormData({ ...formData, halfDayPeriod: e.target.value })} className="w-full px-6 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700 outline-none">
                          <option value="morning">Morning Shift</option><option value="afternoon">Afternoon Shift</option>
                        </select>
                      </div>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                      <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                      <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Justification</label>
                    <textarea value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} required placeholder="State the reason for your leave request..." className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400 transition-all min-h-[160px] resize-none pb-12" />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-slate-100 flex-shrink-0">
                    <button type="button" onClick={() => setShowRequestModal(false)} className="px-10 py-4 font-bold text-[11px] uppercase tracking-widest text-slate-400 hover:text-slate-950 transition-all italic">Cancel Request</button>
                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-4">
                      Submit Assignment Link
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        <DeleteConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null })} onConfirm={confirmCancelLeave} title="Cancel Leave Request" message="Are you sure you want to cancel this leave request? This action will remove the record from the pending queue." itemName="this leave request" confirmButtonText="Confirm Cancellation" />
      </div>
    </Layout>
  );
};

export default LeaveManagement;
