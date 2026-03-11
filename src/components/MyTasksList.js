import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { myTasksAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Layout from './Layout';

const MyTasksList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
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

  const handleStart = async (taskId, workflowType) => {
    setActionLoading(prev => ({ ...prev, [taskId]: 'starting' }));
    try {
      if (workflowType === 'sequential') {
        await myTasksAPI.startSequential(taskId);
      } else {
        await myTasksAPI.start(taskId);
      }
      toast?.showToast?.('Task started successfully', 'success');
      fetchTasks();
    } catch (err) {
      toast?.showToast?.(err.response?.data?.error || 'Failed to start task', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [taskId]: null }));
    }
  };

  const handlePause = async (taskId) => {
    setActionLoading(prev => ({ ...prev, [taskId]: 'pausing' }));
    try {
      await myTasksAPI.pauseSequential(taskId);
      toast?.showToast?.('Task paused', 'success');
      fetchTasks();
    } catch (err) {
      toast?.showToast?.(err.response?.data?.error || 'Failed to pause task', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [taskId]: null }));
    }
  };

  const handleComplete = async (taskId, workflowType) => {
    setActionLoading(prev => ({ ...prev, [taskId]: 'completing' }));
    try {
      if (workflowType === 'sequential') {
        await myTasksAPI.completeSequential(taskId);
      } else {
        // For role-based workflow, navigate to details page for completion
        navigate(`/my-tasks/${taskId}`);
        return;
      }
      toast?.showToast?.('Task completed successfully', 'success');
      fetchTasks();
    } catch (err) {
      toast?.showToast?.(err.response?.data?.error || 'Failed to complete task', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [taskId]: null }));
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      pending: '#94a3b8',
      active: '#10b981',
      in_progress: '#3b82f6',
      paused: '#f59e0b',
      completed: '#10b981',
      skipped: '#f59e0b',
      needs_changes: '#ef4444',
      blocked: '#64748b',
      assigned: '#6b7280'
    };
    return statusMap[status] || '#94a3b8';
  };

  const getStatusLabel = (status) => {
    const labelMap = {
      pending: 'Pending',
      active: 'Active',
      in_progress: 'In Progress',
      paused: 'Paused',
      completed: 'Completed',
      skipped: 'Skipped',
      needs_changes: 'Needs Changes',
      blocked: 'Blocked',
      assigned: 'Assigned'
    };
    return labelMap[status] || status;
  };

  const canShowActions = (task) => {
    if (task.workflowType === 'sequential') {
      return task.userAssignee && task.userAssignee.isCurrent;
    } else if (task.workflowType === 'role') {
      return task.userStep && task.userStep.isCurrent;
    }
    return false;
  };

  const getTaskStatus = (task) => {
    if (task.workflowType === 'sequential') {
      return task.userAssignee?.status || 'pending';
    } else if (task.workflowType === 'role') {
      return task.userStep?.status || 'pending';
    }
    return task.userStep?.status || 'assigned';
  };

  const renderActionButtons = (task) => {
    if (!canShowActions(task)) {
      return null;
    }

    const taskStatus = getTaskStatus(task);
    const isLoading = actionLoading[task._id];

    if (taskStatus === 'pending' || taskStatus === 'active') {
      return (
        <button
          onClick={() => handleStart(task._id, task.workflowType)}
          disabled={isLoading}
          style={{
            padding: '8px 20px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            transition: 'all 0.2s',
            minWidth: '100px'
          }}
          onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = '#059669')}
          onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = '#10b981')}
        >
          {isLoading === 'starting' ? 'Starting...' : '▶️ Start'}
        </button>
      );
    }

    if (taskStatus === 'in_progress') {
      return (
        <div style={{ display: 'flex', gap: '8px' }}>
          {task.workflowType === 'sequential' && (
            <button
              onClick={() => handlePause(task._id)}
              disabled={isLoading}
              style={{
                padding: '8px 20px',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
                transition: 'all 0.2s',
                minWidth: '100px'
              }}
              onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = '#d97706')}
              onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = '#f59e0b')}
            >
              {isLoading === 'pausing' ? 'Pausing...' : '⏸️ Pause'}
            </button>
          )}
          <button
            onClick={() => handleComplete(task._id, task.workflowType)}
            disabled={isLoading}
            style={{
              padding: '8px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.2s',
              minWidth: '100px'
            }}
            onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = '#2563eb')}
            onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = '#3b82f6')}
          >
            {isLoading === 'completing' ? 'Completing...' : '✅ Complete'}
          </button>
        </div>
      );
    }

    if (taskStatus === 'paused') {
      return (
        <button
          onClick={() => handleStart(task._id, task.workflowType)}
          disabled={isLoading}
          style={{
            padding: '8px 20px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            transition: 'all 0.2s',
            minWidth: '100px'
          }}
          onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = '#059669')}
          onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = '#10b981')}
        >
          {isLoading === 'starting' ? 'Resuming...' : '▶️ Resume'}
        </button>
      );
    }

    return null;
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
        borderRadius: '12px',
        padding: '24px 32px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: 'white',
          margin: '0 0 4px 0'
        }}>
          My Tasks
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.9)',
          margin: 0
        }}>
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} assigned to you
        </p>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '60px 32px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h3 style={{
            fontSize: '18px',
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
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          {tasks.map((task, index) => (
            <div
              key={task._id}
              style={{
                padding: '20px 24px',
                borderBottom: index < tasks.length - 1 ? '1px solid #e5e7eb' : 'none',
                transition: 'background-color 0.2s',
                cursor: 'pointer'
              }}
              onClick={() => navigate(`/my-tasks/${task._id}`)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px'
              }}>
                {/* Left: Task Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: '0 0 8px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {task.title}
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    {task.project && (
                      <span style={{
                        fontSize: '13px',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        📁 {task.project.title}
                      </span>
                    )}
                    {task.priority && (
                      <span style={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: task.priority === 'urgent' ? '#fee2e2' : 
                                       task.priority === 'high' ? '#fef3c7' :
                                       task.priority === 'medium' ? '#dbeafe' : '#f0fdf4',
                        color: task.priority === 'urgent' ? '#dc2626' :
                               task.priority === 'high' ? '#d97706' :
                               task.priority === 'medium' ? '#2563eb' : '#16a34a',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {task.priority}
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle: Status */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {task.status && (
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      backgroundColor: task.status.color ? `${task.status.color}20` : '#f1f5f9',
                      color: task.status.color || '#64748b',
                      whiteSpace: 'nowrap'
                    }}>
                      {task.status.name}
                    </span>
                  )}
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    backgroundColor: `${getStatusColor(getTaskStatus(task))}20`,
                    color: getStatusColor(getTaskStatus(task)),
                    whiteSpace: 'nowrap'
                  }}>
                    {getStatusLabel(getTaskStatus(task))}
                  </span>
                </div>

                {/* Right: Action Buttons */}
                <div 
                  style={{ minWidth: '120px', display: 'flex', justifyContent: 'flex-end' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {renderActionButtons(task)}
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
