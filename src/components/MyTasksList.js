import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { myTasksAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Layout from './Layout';

const MyTasksList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await myTasksAPI.getAll();
      setTasks(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tasks');
      toast?.showToast?.('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      pending: '#94a3b8',
      active: '#3b82f6',
      in_progress: '#3b82f6',
      completed: '#10b981',
      skipped: '#f59e0b',
      needs_changes: '#ef4444',
      blocked: '#64748b'
    };
    return statusMap[status] || '#94a3b8';
  };

  const getStatusLabel = (status) => {
    const labelMap = {
      pending: 'Pending',
      active: 'Active',
      in_progress: 'In Progress',
      completed: 'Completed',
      skipped: 'Skipped',
      needs_changes: 'Needs Changes',
      blocked: 'Blocked'
    };
    return labelMap[status] || status;
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading tasks...</div>
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

  return (
    <Layout>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '32px',
        boxShadow: '0 10px 40px rgba(59, 130, 246, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          transform: 'translate(30%, -30%)'
        }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: 'white',
            margin: '0 0 8px 0'
          }}>
            My Tasks
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.9)',
            margin: 0
          }}>
            Tasks assigned to you in workflow
          </p>
        </div>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '60px 32px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          border: '2px solid #f1f5f9'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>📋</div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1e293b',
            margin: '0 0 8px 0'
          }}>
            No tasks assigned
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            margin: 0
          }}>
            You don't have any tasks assigned to you yet.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '24px'
        }}>
          {tasks.map((task) => (
            <div
              key={task._id}
              onClick={() => navigate(`/my-tasks/${task._id}`)}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                border: '2px solid #f1f5f9',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
                height: 'fit-content'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.12)';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.borderColor = '#f1f5f9';
              }}
            >
              {/* Card Header */}
              <div style={{
                padding: '24px 24px 20px 24px',
                borderBottom: '1px solid #f1f5f9'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: 0,
                    flex: 1,
                    lineHeight: '1.4'
                  }}>
                    {task.title}
                  </h3>
                </div>
                {task.description && (
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    margin: '0 0 12px 0',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {task.description}
                  </p>
                )}
                {task.project && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#475569',
                    fontWeight: '500'
                  }}>
                    📁 {task.project.title}
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div style={{ padding: '20px 24px' }}>
                {/* Step Info */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '8px'
                  }}>
                    Your Step
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      backgroundColor: task.userStep.role?.color ? `${task.userStep.role.color}15` : '#f1f5f9',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: task.userStep.role?.color || '#475569',
                      fontWeight: '500'
                    }}>
                      {task.userStep.role?.icon || '👤'} {task.userStep.role?.name || 'Unknown Role'}
                    </div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 10px',
                      backgroundColor: getStatusColor(task.userStep.status) + '15',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: getStatusColor(task.userStep.status),
                      fontWeight: '600'
                    }}>
                      {getStatusLabel(task.userStep.status)}
                    </div>
                  </div>
                  {task.canStart && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      backgroundColor: '#10b98115',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#10b981',
                      fontWeight: '500'
                    }}>
                      ✓ Ready to start
                    </div>
                  )}
                </div>

                {/* Step Position Indicator */}
                <div style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {task.userStep.isPrevious && '← Previous'}
                  {task.userStep.isCurrent && '● Current'}
                  {task.userStep.isNext && 'Next →'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default MyTasksList;

