import React, { useState } from 'react';
import { projectAPI } from '../../services/api';

const ProjectHeader = ({ project, onNavigateToTasks, isProjectOwner, onRefresh }) => {
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
    if (!isProjectOwner) return;

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
      alert('Failed to update project status');
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
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      borderRadius: '16px',
      marginBottom: '24px',
      boxShadow: '0 10px 40px rgba(59, 130, 246, 0.2)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        transform: 'translate(30%, -30%)'
      }}></div>

      {/* Header Content */}
      <div style={{ padding: '32px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1 style={{ margin: '0 0 12px 0', fontSize: '32px', fontWeight: '700', color: '#ffffff' }}>
              {project.title}
            </h1>
            <p style={{ margin: '0 0 16px 0', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.6', fontSize: '15px' }}>
              {project.description}
            </p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => isProjectOwner && setShowStatusModal(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  backgroundColor: statusConfig.bg,
                  color: statusConfig.text,
                  border: `2px solid ${statusConfig.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: isProjectOwner ? 'pointer' : 'default',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (isProjectOwner) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title={isProjectOwner ? 'Click to change status' : ''}
              >
                <span>{statusConfig.icon}</span>
                {statusConfig.label || project.status.replace('_', ' ')}
                {isProjectOwner && <span style={{ marginLeft: '4px', fontSize: '10px' }}>▼</span>}
              </button>
              <span style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '600',
                textTransform: 'capitalize',
                backgroundColor: priorityConfig.bg,
                color: priorityConfig.text,
                border: `2px solid ${priorityConfig.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>{priorityConfig.icon}</span>
                {project.priority} Priority
              </span>
              {project.company && (
                <span style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  {project.company.name}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onNavigateToTasks}
            style={{
              padding: '14px 28px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              color: '#ffffff',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            Manage Tasks
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: '600' }}>
              Overall Progress
            </span>
            <span style={{ fontSize: '14px', color: '#ffffff', fontWeight: '700' }}>
              {progress}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '14px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '7px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
              transition: 'width 0.3s ease',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
            }}></div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px', fontWeight: '500' }}>
              OWNER
            </div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>
              {project.owner?.name || 'Unknown'}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px', fontWeight: '500' }}>
              TEAM SIZE
            </div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>
              {teamSize} {teamSize === 1 ? 'Member' : 'Members'}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px', fontWeight: '500' }}>
              START DATE
            </div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>
              {new Date(project.startDate).toLocaleDateString()}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px', fontWeight: '500' }}>
              DUE DATE
            </div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>
              {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px', fontWeight: '500' }}>
              MILESTONES
            </div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>
              {project.milestones?.length || 0}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px', fontWeight: '500' }}>
              BUDGET
            </div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff' }}>
              {project.budget?.amount ? `${project.budget.currency} ${project.budget.amount.toLocaleString()}` : 'Not set'}
            </div>
          </div>
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