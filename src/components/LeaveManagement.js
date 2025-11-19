import React, { useState, useEffect } from 'react';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { leaveAPI } from '../services/api';
import Layout from './Layout';

const LeaveManagement = () => {
  const { state: authState } = useAuth();
  const { state } = useCompany();
  const selectedCompany = state.selectedCompany;
  const toast = useToast();
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-leaves'); // 'my-leaves', 'all-leaves', 'pending-approvals'
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
      
      if (activeTab === 'my-leaves') {
        params.employeeId = authState.user._id;
      } else if (activeTab === 'pending-approvals') {
        params.status = 'pending';
      }

      const response = await leaveAPI.getAll(selectedCompany.id, params);
      setLeaves(response.data.leaves || []);
    } catch (error) {
      console.error('Error fetching leaves:', error);
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
      console.error('Error fetching leave balance:', error);
    }
  };

  const handleRequestLeave = async (e) => {
    e.preventDefault();
    try {
      await leaveAPI.request(selectedCompany.id, formData);
      setShowRequestModal(false);
      setFormData({
        leaveType: 'casual',
        startDate: '',
        endDate: '',
        halfDay: false,
        halfDayPeriod: 'morning',
        reason: '',
        notes: ''
      });
      fetchLeaves();
      fetchLeaveBalance();
      toast.success('Leave request submitted successfully!');
    } catch (error) {
      console.error('Error requesting leave:', error);
      const errorMessage = error.response?.data?.error || 'Failed to request leave';
      toast.error(errorMessage);
    }
  };

  const handleApproveReject = async (leaveId, status, rejectionReason = null) => {
    try {
      await leaveAPI.updateStatus(selectedCompany.id, leaveId, status, rejectionReason);
      fetchLeaves();
      toast.success(`Leave ${status} successfully!`);
    } catch (error) {
      console.error('Error updating leave status:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update leave status';
      toast.error(errorMessage);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (window.confirm('Are you sure you want to cancel this leave request?')) {
      try {
        await leaveAPI.cancel(selectedCompany.id, leaveId);
        fetchLeaves();
        fetchLeaveBalance();
        toast.success('Leave cancelled successfully!');
      } catch (error) {
        console.error('Error cancelling leave:', error);
        const errorMessage = error.response?.data?.error || 'Failed to cancel leave';
        toast.error(errorMessage);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444',
      cancelled: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getLeaveTypeLabel = (type) => {
    const labels = {
      sick: 'Sick Leave',
      casual: 'Casual Leave',
      annual: 'Annual Leave',
      maternity: 'Maternity Leave',
      paternity: 'Paternity Leave',
      unpaid: 'Unpaid Leave',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderLeaveBalance = () => {
    if (!leaveBalance) return null;

    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
          Leave Balance ({new Date().getFullYear()})
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {Object.entries(leaveBalance).map(([type, data]) => (
            <div
              key={type}
              style={{
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>
                {getLeaveTypeLabel(type)}
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
                {data.remaining === Infinity ? '∞' : data.remaining}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                of {data.total === Infinity ? '∞' : data.total} days
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLeaveCard = (leave) => {
    const canApprove = activeTab === 'pending-approvals';
    const canCancel = leave.employee._id === authState.user._id && ['pending', 'approved'].includes(leave.status);

    return (
      <div
        key={leave._id}
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderLeft: `4px solid ${getStatusColor(leave.status)}`
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
              {leave.employee.name}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              {leave.employee.email}
            </div>
          </div>
          <div
            style={{
              padding: '6px 12px',
              background: getStatusColor(leave.status),
              color: 'white',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}
          >
            {leave.status}
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
            {getLeaveTypeLabel(leave.leaveType)}
            {leave.halfDay && ' (Half Day - ' + leave.halfDayPeriod + ')'}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
            📅 {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            ⏱️ {leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
            Reason:
          </div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            {leave.reason}
          </div>
        </div>

        {leave.rejectionReason && (
          <div style={{ marginBottom: '16px', padding: '12px', background: '#fee2e2', borderRadius: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#dc2626', marginBottom: '4px' }}>
              Rejection Reason:
            </div>
            <div style={{ fontSize: '14px', color: '#991b1b' }}>
              {leave.rejectionReason}
            </div>
          </div>
        )}

        {(canApprove || canCancel) && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            {canApprove && (
              <>
                <button
                  onClick={() => handleApproveReject(leave._id, 'approved')}
                  style={{
                    padding: '8px 16px',
                    background: '#10b981',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'white'
                  }}
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Enter rejection reason:');
                    if (reason) handleApproveReject(leave._id, 'rejected', reason);
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'white'
                  }}
                >
                  ✗ Reject
                </button>
              </>
            )}
            {canCancel && (
              <button
                onClick={() => handleCancelLeave(leave._id)}
                style={{
                  padding: '8px 16px',
                  background: '#6b7280',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white'
                }}
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#64748b' }}>Loading leaves...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '28px',
          fontWeight: '700',
          color: '#1e293b'
        }}>
          Leave Management
        </h2>
        <button
          onClick={() => setShowRequestModal(true)}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            color: 'white',
            boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)'
          }}
        >
          + Request Leave
        </button>
      </div>

      {/* Leave Balance */}
      {activeTab === 'my-leaves' && renderLeaveBalance()}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '2px solid #e2e8f0'
      }}>
        {[
          { id: 'my-leaves', label: 'My Leaves' },
          { id: 'all-leaves', label: 'All Leaves' },
          { id: 'pending-approvals', label: 'Pending Approvals' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: activeTab === tab.id ? '#3b82f6' : '#64748b',
              marginBottom: '-2px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaves List */}
      <div style={{
        display: 'grid',
        gap: '16px'
      }}>
        {leaves.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '16px', color: '#64748b' }}>
              No leaves found
            </div>
          </div>
        ) : (
          leaves.map(renderLeaveCard)
        )}
      </div>

      {/* Request Leave Modal */}
      {showRequestModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            width: '90%',
            maxWidth: '600px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
              Request Leave
            </h3>
            <form onSubmit={handleRequestLeave}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>
                  Leave Type
                </label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="annual">Annual Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.halfDay}
                    onChange={(e) => setFormData({ ...formData, halfDay: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: '600', color: '#475569' }}>Half Day</span>
                </label>
              </div>

              {formData.halfDay && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>
                    Half Day Period
                  </label>
                  <select
                    value={formData.halfDayPeriod}
                    onChange={(e) => setFormData({ ...formData, halfDayPeriod: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>
                  Reason *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                  placeholder="Please provide a reason for your leave..."
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569' }}>
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional information..."
                  rows="2"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestModal(false);
                    setFormData({
                      leaveType: 'casual',
                      startDate: '',
                      endDate: '',
                      halfDay: false,
                      halfDayPeriod: 'morning',
                      reason: '',
                      notes: ''
                    });
                  }}
                  style={{
                    padding: '12px 24px',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#475569'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'white'
                  }}
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
};

export default LeaveManagement;

