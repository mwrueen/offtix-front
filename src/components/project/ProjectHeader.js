import React, { useState } from 'react';
import { projectAPI } from '../../services/api';
import { useCompany } from '../../context/CompanyContext';
import { useToast } from '../../context/ToastContext';
import { usePermissions, PERMISSIONS } from '../../context/PermissionsContext';
import { getCurrencySymbol } from '../../utils/currency';

const ProjectHeader = ({ project, onNavigateToTasks, isProjectOwner, onRefresh }) => {
  const { state: companyState } = useCompany();
  const toast = useToast();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const companyCurrency = companyState?.selectedCompany?.currency || 'USD';

  const canEditStatus = isProjectOwner || isSuperAdmin || hasPermission(PERMISSIONS.EDIT_PROJECT);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [scheduledStartDate, setScheduledStartDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusConfig = (status) => {
    const configs = {
      'not_started': { bg: '#f3f4f6', text: '#374151', border: '#d1d5db', icon: '⏳', label: 'Not Started' },
      'running': { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd', icon: '🚀', label: 'Running' },
      'paused': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d', icon: '⏸️', label: 'Paused' },
      'cancelled': { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', icon: '❌', label: 'Cancelled' },
      'closed': { bg: '#dcfce7', text: '#166534', border: '#86efac', icon: '✅', label: 'Closed' },
      // Legacy statuses (for backward compatibility)
      'planning': { bg: '#f3f4f6', text: '#374151', border: '#d1d5db', icon: '⏳', label: 'Not Started' },
      'active': { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd', icon: '🚀', label: 'Running' },
      'completed': { bg: '#dcfce7', text: '#166534', border: '#86efac', icon: '✅', label: 'Closed' },
      'on-hold': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d', icon: '⏸️', label: 'Paused' }
    };
    return configs[status] || configs.not_started;
  };

  const handleStatusChange = async (newStatus) => {
    if (!canEditStatus) return;

    setIsUpdating(true);
    try {
      await projectAPI.updateStatus(project._id, newStatus, scheduledStartDate || null);
      if (onRefresh) {
        await onRefresh();
      }
      setShowStatusModal(false);
      setScheduledStartDate('');
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error('Failed to update project status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      'low': { bg: '#dcfce7', text: '#166534', border: '#86efac', icon: '🟢' },
      'medium': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d', icon: '🟡' },
      'high': { bg: '#fed7aa', text: '#9a3412', border: '#fdba74', icon: '🟠' },
      'urgent': { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', icon: '🔴' }
    };
    return configs[priority] || configs.medium;
  };

  const statusConfig = getStatusConfig(project.status);
  const priorityConfig = getPriorityConfig(project.priority);
  const progress = project.progress?.percentage || 0;
  const teamSize = (project.members?.length || 0) + 1; // +1 for owner

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      borderRadius: '24px',
      marginBottom: '32px',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)',
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {/* Background Decorative Elements */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        left: '-10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(30px)'
      }}></div>

      <div style={{ padding: '40px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <h1 style={{ margin: 0, fontSize: '36px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em' }}>
                {project.title}
              </h1>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => canEditStatus && setShowStatusModal(true)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700',
                    backgroundColor: statusConfig.bg,
                    color: statusConfig.text,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: canEditStatus ? 'pointer' : 'default',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    if (canEditStatus) e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{statusConfig.icon}</span>
                  {statusConfig.label}
                  {canEditStatus && <span style={{ fontSize: '10px', opacity: 0.7 }}>▼</span>}
                </button>
                <div style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  backgroundColor: priorityConfig.bg,
                  color: priorityConfig.text,
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>{priorityConfig.icon}</span>
                  {project.priority?.toUpperCase()}
                </div>
              </div>
            </div>
            <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.625', fontSize: '16px', maxWidth: '800px' }}>
              {project.description}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Circular Progress Indicator */}
            <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="90" height="90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="url(#progressGradient)" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>{progress}%</div>
                <div style={{ fontSize: '9px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Done</div>
              </div>
            </div>

            <button
              onClick={onNavigateToTasks}
              style={{
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 15px 30px rgba(59, 130, 246, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.4)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"></path>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
              Manage Project Tasks
            </button>
          </div>
        </div>

        {/* Dynamic Horizontal Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '2px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {[
            { label: 'OWNER', value: project.owner?.name || 'Unknown', icon: '👤' },
            { label: 'TEAM SIZE', value: `${teamSize} Members`, icon: '👥' },
            { label: 'TIMELINE', value: project.endDate ? `${new Date(project.startDate).toLocaleDateString()} - ${new Date(project.endDate).toLocaleDateString()}` : `Started ${new Date(project.startDate).toLocaleDateString()}`, icon: '📅' },
            { label: 'BUDGET', value: project.budget?.amount ? `${getCurrencySymbol(companyCurrency)} ${project.budget.amount.toLocaleString()}` : 'Not set', icon: '💰' },
            { label: 'MILESTONES', value: `${project.milestones?.length || 0} Total`, icon: '🎯' }
          ].map((stat, idx) => (
            <div key={idx} style={{
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>{stat.icon}</span>
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: '700', letterSpacing: '0.05em' }}>{stat.label}</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowStatusModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
              📊 Change Project Status
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280' }}>
              Current status: <strong>{statusConfig.label}</strong>
            </p>

            {/* Status Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {/* Not Started */}
              <button
                onClick={() => handleStatusChange('not_started')}
                disabled={isUpdating || project.status === 'not_started'}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: project.status === 'not_started' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                  backgroundColor: project.status === 'not_started' ? '#eff6ff' : 'white',
                  cursor: project.status === 'not_started' ? 'default' : 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '24px' }}>⏳</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937' }}>Not Started</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Project is created but not yet started</div>
                </div>
              </button>

              {/* Running */}
              <button
                onClick={() => handleStatusChange('running')}
                disabled={isUpdating || project.status === 'running'}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: project.status === 'running' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                  backgroundColor: project.status === 'running' ? '#eff6ff' : 'white',
                  cursor: project.status === 'running' ? 'default' : 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '24px' }}>🚀</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937' }}>Running</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {project.status === 'paused'
                      ? 'Resume project and extend task due dates'
                      : 'Project is actively being worked on'}
                  </div>
                </div>
              </button>

              {/* Paused */}
              <button
                onClick={() => handleStatusChange('paused')}
                disabled={isUpdating || project.status === 'paused' || project.status === 'not_started'}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: project.status === 'paused' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                  backgroundColor: project.status === 'paused' ? '#eff6ff' : 'white',
                  cursor: (project.status === 'paused' || project.status === 'not_started') ? 'default' : 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  opacity: project.status === 'not_started' ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '24px' }}>⏸️</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937' }}>Paused</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Temporarily pause the project</div>
                </div>
              </button>

              {/* Cancelled */}
              <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={isUpdating || project.status === 'cancelled'}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: project.status === 'cancelled' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                  backgroundColor: project.status === 'cancelled' ? '#eff6ff' : 'white',
                  cursor: project.status === 'cancelled' ? 'default' : 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '24px' }}>❌</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937' }}>Cancelled</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Project has been cancelled</div>
                </div>
              </button>

              {/* Closed */}
              <button
                onClick={() => handleStatusChange('closed')}
                disabled={isUpdating || project.status === 'closed'}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: project.status === 'closed' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                  backgroundColor: project.status === 'closed' ? '#eff6ff' : 'white',
                  cursor: project.status === 'closed' ? 'default' : 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '24px' }}>✅</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937' }}>Closed</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Project has been completed</div>
                </div>
              </button>
            </div>

            {/* Schedule Start Date (only for Not Started projects) */}
            {project.status === 'not_started' && (
              <div style={{
                padding: '16px',
                backgroundColor: '#f3f4f6',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  📅 Schedule Start Date
                </label>
                <input
                  type="date"
                  value={scheduledStartDate}
                  onChange={(e) => setScheduledStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                {scheduledStartDate && (
                  <button
                    onClick={() => handleStatusChange('not_started')}
                    disabled={isUpdating}
                    style={{
                      marginTop: '12px',
                      padding: '10px 16px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    {isUpdating ? 'Scheduling...' : 'Schedule Start'}
                  </button>
                )}
                {project.scheduledStartDate && (
                  <p style={{ margin: '12px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                    Currently scheduled: {new Date(project.scheduledStartDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Pause info */}
            {project.status === 'paused' && project.pausedAt && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#fef3c7',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#92400e'
              }}>
                ⏸️ Paused since: {new Date(project.pausedAt).toLocaleString()}
                <br />
                <small>When resumed, all remaining task due dates will be extended automatically.</small>
              </div>
            )}

            <button
              onClick={() => setShowStatusModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#f3f4f6',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#4b5563'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectHeader;