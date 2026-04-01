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
    } catch (error) {
      console.error('Error fetching leave records', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      if (!authState.user?._id) return;
      const year = new Date().getFullYear();
      const response = await leaveAPI.getBalance(selectedCompany.id, authState.user._id, year);
      setLeaveBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching balance', error);
    }
  };

  const handleRequestLeave = async (e) => {
    e.preventDefault();
    try {
      await leaveAPI.request(selectedCompany.id, formData);
      setShowRequestModal(false);
      setFormData({ leaveType: 'casual', startDate: '', endDate: '', halfDay: false, halfDayPeriod: 'morning', reason: '', notes: '' });
      fetchLeaves();
      fetchLeaveBalance();
      toast.showToast('Leave request submitted successfully.', 'success');
    } catch (error) {
      toast.showToast(error.response?.data?.error || 'Failed to submit request.', 'error');
    }
  };

  const handleApproveReject = async (leaveId, status, rejectionReason = null) => {
    try {
      await leaveAPI.updateStatus(selectedCompany.id, leaveId, status, rejectionReason);
      fetchLeaves();
      toast.showToast(`Request ${status} successfully.`, 'success');
    } catch (error) {
      toast.showToast(error.response?.data?.error || 'Action failed.', 'error');
    }
  };

  const handleCancelLeave = (leaveId) => setDeleteModal({ isOpen: true, id: leaveId });

  const confirmCancelLeave = async () => {
    try {
      await leaveAPI.cancel(selectedCompany.id, deleteModal.id);
      fetchLeaves();
      fetchLeaveBalance();
      setDeleteModal({ isOpen: false, id: null });
      toast.showToast('Leave request cancelled.', 'warning');
    } catch (error) {
      toast.showToast(error.response?.data?.error || 'Cancellation failed.', 'error');
    }
  };

  const getLeaveTypeLabel = (type) => {
    const labels = { sick: 'Sick Leave', casual: 'Casual Leave', annual: 'Annual Leave', maternity: 'Maternity', paternity: 'Paternity', unpaid: 'Unpaid Leave', other: 'Other' };
    return labels[type] || type.replace('_', ' ');
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const renderLeaveBalance = () => {
    if (!leaveBalance) return null;
    return (
      <div className="bg-white p-8 lg:p-10 rounded-2xl border border-slate-200 shadow-sm mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl shadow-sm border border-indigo-100/50">📊</div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Leave Balance</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Your available time-off entitlement for this year.</p>
            </div>
          </div>
          <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fiscal Year: {new Date().getFullYear()}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {Object.entries(leaveBalance).map(([type, data]) => (
            <div key={type} className="p-6 bg-slate-50 border border-slate-100 rounded-xl transition-all hover:bg-white hover:shadow-md hover:border-indigo-100 group">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{getLeaveTypeLabel(type)}</div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {data.remaining === Infinity ? '∞' : data.remaining}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/ {data.total === Infinity ? 'Unlimited' : `${data.total} Days`}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-indigo-600 rounded-full transition-all duration-700`}
                  style={{ width: data.total === Infinity ? '10%' : `${Math.max(5, (data.remaining / data.total) * 100)}%` }}
                />
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
      pending: { bg: 'bg-amber-50 text-amber-700 border-amber-100', label: 'Processing', icon: '⏳' },
      approved: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Confirmed', icon: '✓' },
      rejected: { bg: 'bg-rose-50 text-rose-700 border-rose-100', label: 'Declined', icon: '✕' },
      cancelled: { bg: 'bg-slate-50 text-slate-500 border-slate-100', label: 'Voided', icon: '🗑' }
    }[leave.status.toLowerCase()] || { bg: 'bg-slate-50 text-slate-500 border-slate-100', label: 'Unknown', icon: '❓' };

    const isMyRecord = leave.employee?._id === authState.user?._id;

    return (
      <div
        key={leave._id}
        className={`group bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col lg:flex-row`}
      >
        <div className="flex flex-col items-center shrink-0 w-full lg:w-40 text-center space-y-4 mb-6 lg:mb-0">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 overflow-hidden shadow-lg border-4 border-slate-100 relative group-hover:scale-105 transition-transform duration-500">
            {leave.employee?.avatar ? (
              <img src={leave.employee.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white uppercase tracking-tighter">
                {leave.employee?.name?.charAt(0)}
              </div>
            )}
            {isMyRecord && <div className="absolute top-0 right-0 w-3 h-3 bg-indigo-500 border-2 border-white rounded-full" title="You" />}
          </div>
          <div className={`px-4 py-1.5 rounded-full ${cfg.bg} text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border shadow-sm`}>
            <span>{cfg.icon}</span>
            {cfg.label}
          </div>
        </div>

        <div className="flex-1 min-w-0 text-center lg:text-left lg:ml-8 lg:border-l lg:pl-10 lg:border-slate-100 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-950 truncate group-hover:text-indigo-600 transition-colors uppercase italic tracking-tight leading-tight">{leave.employee?.name}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{leave.employee?.email}</p>
            </div>
            <div className="px-5 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
              <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Duration</div>
              <div className="text-xl font-black text-indigo-600 leading-none">
                {leave.totalDays} <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Days</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-xl border border-slate-100">🏷️</div>
              <div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Category</div>
                <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  {getLeaveTypeLabel(leave.leaveType)}
                  {leave.halfDay && <span className="text-[9px] ml-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">Half-Day ({leave.halfDayPeriod})</span>}
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-xl border border-slate-100">📅</div>
              <div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Timeframe</div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>{formatDate(leave.startDate)}</span>
                  <span className="text-slate-300">→</span>
                  <span className="text-indigo-600">{formatDate(leave.endDate)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-slate-600 text-sm leading-relaxed relative overflow-hidden group/memo">
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 opacity-60">Submission Note:</span>
            <span className="relative z-10 italic">"{leave.reason}"</span>
            <div className="absolute top-0 right-0 w-12 h-12 flex items-center justify-center opacity-5 grayscale scale-150 rotate-12">📝</div>
          </div>

          {leave.rejectionReason && (
            <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-bold flex items-center gap-4 animate-in slide-in-from-left-2 transition-all">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-[9px] capitalize tracking-widest mb-1 opacity-60 font-black">Management Feedback:</p>
                <span className="italic">"{leave.rejectionReason}"</span>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 flex flex-col gap-3 w-full lg:w-48 lg:ml-10 justify-center mt-8 lg:mt-0">
          {canApprove && (
            <div className="space-y-3">
              <button
                onClick={() => handleApproveReject(leave._id, 'approved')}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-slate-950 hover:shadow-xl transition-all active:scale-95"
              >
                Approve Request
              </button>
              <button
                onClick={() => { const r = prompt('Provide feedback for rejection:'); if (r !== null) handleApproveReject(leave._id, 'rejected', r); }}
                className="w-full py-3.5 bg-white text-rose-600 border border-rose-100 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:shadow-md transition-all active:scale-95"
              >
                Decline Request
              </button>
            </div>
          )}
          {canCancel && (
            <button
              onClick={() => handleCancelLeave(leave._id)}
              className="w-full py-3.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              Withdraw Request
            </button>
          )}
          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-center text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">REF: {leave._id?.slice(-12).toUpperCase()}</div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-40 space-y-6">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-sm" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Synchronizing leave data...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-12 pb-40">
        <PageHeader
          title="Leave Management"
          subtitle="Oversee organizational leave policies, review pending requests, and monitor team availability."
          icon="🗓️"
          stats={[
            { label: 'Pending Review', value: leaves.filter(l => l.status === 'pending').length },
            { label: 'Total Records', value: leaves.length }
          ]}
          actions={
            <button
              onClick={() => setShowRequestModal(true)}
              className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-slate-950 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-3"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
              Request Time Off
            </button>
          }
        />

        {activeTab === 'my-leaves' && renderLeaveBalance()}

        <div className="flex flex-wrap gap-1 p-1 bg-white rounded-xl border border-slate-200 w-fit shadow-sm mb-8">
          {[
            { id: 'my-leaves', label: 'My Requests' },
            { id: 'all-leaves', label: 'Organization-wide' },
            { id: 'pending-approvals', label: 'Awaiting Action' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              {tab.label}
              {tab.id === 'pending-approvals' && leaves.filter(l => l.status === 'pending').length > 0 && activeTab !== tab.id && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border-2 border-white items-center justify-center text-[7px] text-white leading-none font-black">{leaves.filter(l => l.status === 'pending').length}</span>
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-8 lg:space-y-10">
          {leaves.length === 0 ? (
            <div className="bg-white p-24 rounded-2xl text-center border border-dashed border-slate-200">
              <div className="text-6xl mb-6 opacity-10">🗓️</div>
              <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">No Leave Records</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 max-w-sm mx-auto opacity-60">There are no leave requests matching the current filter parameters.</p>
              <button onClick={() => setShowRequestModal(true)} className="mt-8 px-10 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md">Create New Request</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {leaves.map((l, i) => renderLeaveCard(l, i))}
            </div>
          )}
        </div>

        {showRequestModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[2500] p-6" onClick={() => setShowRequestModal(false)}>
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-slate-200 overflow-hidden relative max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="px-10 py-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Time Off Request</h3>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1 opacity-80">Define parameters for leave approval.</p>
                </div>
                <button onClick={() => setShowRequestModal(false)} className="w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-rose-600 transition-all text-2xl font-bold flex items-center justify-center">×</button>
              </div>
              <div className="p-10 lg:p-12 overflow-y-auto scrollbar-none flex-1">
                <form onSubmit={handleRequestLeave} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Leave Category</label>
                      <select
                        value={formData.leaveType}
                        onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                        required
                        className="w-full px-6 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-950 focus:border-indigo-600 focus:bg-white transition-all outline-none shadow-sm"
                      >
                        <option value="casual">Casual Leave</option>
                        <option value="sick">Sick Leave</option>
                        <option value="annual">Annual Leave</option>
                        <option value="maternity">Maternity</option>
                        <option value="paternity">Paternity</option>
                        <option value="unpaid">Unpaid Leave</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Schedule Adjustment</label>
                      <div
                        className={`flex items-center gap-4 p-4.5 rounded-2xl cursor-pointer transition-all border ${formData.halfDay ? 'bg-indigo-50 border-indigo-200 shadow-md ring-4 ring-indigo-50' : 'bg-slate-50 border-slate-200 shadow-sm hover:border-indigo-300'}`}
                        onClick={() => setFormData({ ...formData, halfDay: !formData.halfDay })}
                      >
                        <div className={`w-12 h-6 rounded-full p-1 transition-all flex shadow-inner ${formData.halfDay ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-all shadow-md ${formData.halfDay ? 'translate-x-6' : ''}`} />
                        </div>
                        <span className={`text-[11px] font-bold uppercase tracking-widest ${formData.halfDay ? 'text-indigo-700' : 'text-slate-500'}`}>Half-Day Basis</span>
                      </div>
                      {formData.halfDay && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                          <select
                            value={formData.halfDayPeriod}
                            onChange={e => setFormData({ ...formData, halfDayPeriod: e.target.value })}
                            className="w-full px-6 py-3.5 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700 outline-none shadow-sm cursor-pointer"
                          >
                            <option value="morning">Morning Period (AM)</option>
                            <option value="afternoon">Afternoon Period (PM)</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Commencement Date</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                        required
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-sm"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Conclusion Date</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                        required
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Primary Reason</label>
                    <textarea
                      value={formData.reason}
                      onChange={e => setFormData({ ...formData, reason: e.target.value })}
                      required
                      placeholder="Enter the reason for your time-off request..."
                      className="w-full px-8 py-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-medium outline-none focus:bg-white focus:border-indigo-400 transition-all min-h-[140px] shadow-sm resize-none"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-5 pt-8 border-t border-slate-100 flex-shrink-0">
                    <button type="button" onClick={() => setShowRequestModal(false)} className="px-10 py-5 font-bold text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all">Discard Request</button>
                    <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-bold text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-slate-950 transition-all flex items-center justify-center gap-4 active:scale-[0.98]">
                      Submit Selection
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        <DeleteConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, id: null })}
          onConfirm={confirmCancelLeave}
          title="Withdraw Request"
          message="Are you sure you want to withdraw this leave request? This record will be removed from the approval queue."
          itemName="this leave request"
          confirmButtonText="Confirm Withdrawal"
        />
      </div>
    </Layout>
  );
};

export default LeaveManagement;

