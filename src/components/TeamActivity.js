import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Layout from './Layout';
import apiService from '../services/apiService';

const TeamActivity = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchTeamActivity();
  }, []);

  const fetchTeamActivity = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/team-activity');
      setTeamMembers(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch team activity');
      toast?.showToast?.('Failed to load team activity', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      in_progress: {
        label: 'Working',
        color: '#10b981',
        bgColor: '#d1fae5',
        icon: '🟢'
      },
      paused: {
        label: 'Paused',
        color: '#f59e0b',
        bgColor: '#fef3c7',
        icon: '⏸️'
      },
      idle: {
        label: 'Idle',
        color: '#94a3b8',
        bgColor: '#f1f5f9',
        icon: '⚪'
      }
    };

    const config = statusConfig[status] || statusConfig.idle;

    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: config.bgColor,
        color: config.color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span>{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      superadmin: { label: 'Super Admin', color: '#dc2626', bgColor: '#fee2e2' },
      admin: { label: 'Admin', color: '#ea580c', bgColor: '#ffedd5' },
      user: { label: 'User', color: '#3b82f6', bgColor: '#dbeafe' }
    };

    const config = roleConfig[role] || roleConfig.user;

    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '600',
        backgroundColor: config.bgColor,
        color: config.color,
        textTransform: 'uppercase'
      }}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading team activity...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div style={{ color: '#ef4444', textAlign: 'center', padding: '50px' }}>
          Error: {error}
        </div>
      </Layout>
    );
  }

  const workingMembers = teamMembers.filter(m => m.status === 'in_progress');
  const pausedMembers = teamMembers.filter(m => m.status === 'paused');
  const idleMembers = teamMembers.filter(m => m.status === 'idle');

  return (
    <Layout>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
        borderRadius: '12px',
        padding: '24px 32px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: 'white',
          margin: '0 0 4px 0'
        }}>
          Team Activity
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.9)',
          margin: 0
        }}>
          Monitor your team members' current task status
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '2px solid #d1fae5'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981', marginBottom: '4px' }}>
            {workingMembers.length}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
            Currently Working
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '2px solid #fef3c7'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b', marginBottom: '4px' }}>
            {pausedMembers.length}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
            Paused
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '2px solid #f1f5f9'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
            {idleMembers.length}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
            Idle
          </div>
        </div>
      </div>

      {/* Team Members List */}
      {teamMembers.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '60px 32px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1e293b',
            margin: '0 0 8px 0'
          }}>
            No team members found
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            margin: 0
          }}>
            You don't have any team members to monitor yet.
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          {teamMembers.map((member, index) => (
            <div
              key={member.user._id}
              style={{
                padding: '20px 24px',
                borderBottom: index < teamMembers.length - 1 ? '1px solid #e5e7eb' : 'none',
                transition: 'background-color 0.2s',
                backgroundColor: member.status === 'in_progress' ? '#f0fdf4' : 'white'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '20px'
              }}>
                {/* Left: User Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#e0e7ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#4f46e5',
                      flexShrink: 0
                    }}>
                      {member.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#1e293b',
                        marginBottom: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {member.user.name}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#64748b',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {member.user.email}
                      </div>
                    </div>
                  </div>

                  {/* Current/Last Task */}
                  {member.currentTask && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        color: '#64748b',
                        marginBottom: '4px',
                        fontWeight: '500'
                      }}>
                        Currently Working On:
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#1e293b',
                          marginBottom: '4px',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        onClick={() => navigate(`/my-tasks/${member.currentTask._id}`)}
                        onMouseEnter={(e) => e.target.style.color = '#3b82f6'}
                        onMouseLeave={(e) => e.target.style.color = '#1e293b'}
                      >
                        {member.currentTask.title}
                      </div>
                      {member.currentTask.project && (
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          📁 {member.currentTask.project.title}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
                        Started {formatDate(member.currentTask.startedAt)}
                      </div>
                    </div>
                  )}

                  {member.lastTask && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        color: '#64748b',
                        marginBottom: '4px',
                        fontWeight: '500'
                      }}>
                        {member.status === 'paused' ? 'Paused Task:' : 'Last Completed:'}
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#475569',
                          marginBottom: '4px',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        onClick={() => navigate(`/my-tasks/${member.lastTask._id}`)}
                        onMouseEnter={(e) => e.target.style.color = '#3b82f6'}
                        onMouseLeave={(e) => e.target.style.color = '#475569'}
                      >
                        {member.lastTask.title}
                      </div>
                      {member.lastTask.project && (
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          📁 {member.lastTask.project.title}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        {member.status === 'paused' 
                          ? `Paused ${formatDate(member.lastTask.pausedAt)}`
                          : `Completed ${formatDate(member.lastTask.completedAt)}`
                        }
                      </div>
                    </div>
                  )}

                  {!member.currentTask && !member.lastTask && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#94a3b8',
                      fontStyle: 'italic'
                    }}>
                      No task activity yet
                    </div>
                  )}
                </div>

                {/* Right: Status & Role */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '8px',
                  minWidth: '100px'
                }}>
                  {getStatusBadge(member.status)}
                  {getRoleBadge(member.user.role)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default TeamActivity;
