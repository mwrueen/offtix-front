import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { myTasksAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Layout from './Layout';
import PageHeader from './PageHeader';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const MyTasksList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [actionModal, setActionModal] = useState(null); // 'complete' or 'sendBack'
  const [activeTask, setActiveTask] = useState(null);
  const [formData, setFormData] = useState({ note: '', message: '', link: '' });
  const [selectedFiles, setSelectedFiles] = useState([]);
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

  const handleCompleteClick = (e, task) => {
    e.stopPropagation();
    if (task.workflowType === 'sequential') {
      setActiveTask(task);
      setActionModal('complete');
    } else {
      navigate(`/my-tasks/${task._id}`);
    }
  };

  const handleSendBackClick = (e, task) => {
    e.stopPropagation();
    if (task.workflowType === 'sequential') {
      setActiveTask(task);
      setActionModal('sendBack');
    } else {
      navigate(`/my-tasks/${task._id}`);
    }
  };

  const handleModalSubmit = async () => {
    if (!activeTask) return;
    const taskId = activeTask._id;
    setActionLoading(prev => ({ ...prev, [taskId]: actionModal === 'complete' ? 'completing' : 'sendingBack' }));
    try {
      if (actionModal === 'complete') {
        await myTasksAPI.completeSequential(taskId, formData.note, formData.message, formData.link, selectedFiles);
        toast?.showToast?.('Task completed successfully', 'success');
      } else {
        await myTasksAPI.sendBackSequential(taskId, formData.note, formData.message, formData.link, selectedFiles);
        toast?.showToast?.('Task sent back successfully', 'success');
      }
      setActionModal(null);
      setActiveTask(null);
      setFormData({ note: '', message: '', link: '' });
      setSelectedFiles([]);
      fetchTasks();
    } catch (err) {
      toast?.showToast?.(err.response?.data?.error || 'Failed to process action', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [taskId]: null }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
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
    const canStartTask = task.canStart !== false; // Default to true if not specified

    if (taskStatus === 'pending' || taskStatus === 'active') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); handleStart(task._id, task.workflowType); }}
            disabled={isLoading || !canStartTask}
            style={{
              padding: '8px 20px',
              backgroundColor: canStartTask ? '#10b981' : '#94a3b8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (isLoading || !canStartTask) ? 'not-allowed' : 'pointer',
              opacity: (isLoading || !canStartTask) ? 0.6 : 1,
              transition: 'all 0.2s',
              minWidth: '100px'
            }}
            onMouseEnter={(e) => canStartTask && !isLoading && (e.target.style.backgroundColor = '#059669')}
            onMouseLeave={(e) => canStartTask && !isLoading && (e.target.style.backgroundColor = '#10b981')}
            title={!canStartTask ? 'Complete or pause your current task first' : ''}
          >
            {isLoading === 'starting' ? 'Starting...' : '▶️ Start'}
          </button>
          {!canStartTask && (
            <span style={{
              fontSize: '11px',
              color: '#ef4444',
              fontWeight: '500',
              textAlign: 'right',
              maxWidth: '150px'
            }}>
              Complete current task first
            </span>
          )}
        </div>
      );
    }

    if (taskStatus === 'in_progress') {
      return (
        <div style={{ display: 'flex', gap: '8px' }}>
          {task.workflowType === 'sequential' && (
            <button
              onClick={(e) => { e.stopPropagation(); handlePause(task._id); }}
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
            onClick={(e) => handleCompleteClick(e, task)}
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
          {task.workflowType === 'sequential' && (
            <button
              onClick={(e) => handleSendBackClick(e, task)}
              disabled={isLoading}
              style={{
                padding: '8px 20px',
                backgroundColor: '#ef4444',
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
              onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = '#dc2626')}
              onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = '#ef4444')}
            >
              {isLoading === 'sendingBack' ? 'Sending Back...' : '↩️ Send Back'}
            </button>
          )}
        </div>
      );
    }

    if (taskStatus === 'paused') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); handleStart(task._id, task.workflowType); }}
            disabled={isLoading || !canStartTask}
            style={{
              padding: '8px 20px',
              backgroundColor: canStartTask ? '#10b981' : '#94a3b8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (isLoading || !canStartTask) ? 'not-allowed' : 'pointer',
              opacity: (isLoading || !canStartTask) ? 0.6 : 1,
              transition: 'all 0.2s',
              minWidth: '100px'
            }}
            onMouseEnter={(e) => canStartTask && !isLoading && (e.target.style.backgroundColor = '#059669')}
            onMouseLeave={(e) => canStartTask && !isLoading && (e.target.style.backgroundColor = '#10b981')}
            title={!canStartTask ? 'Complete or pause your current task first' : ''}
          >
            {isLoading === 'starting' ? 'Resuming...' : '▶️ Resume'}
          </button>
          {!canStartTask && (
            <span style={{
              fontSize: '11px',
              color: '#ef4444',
              fontWeight: '500',
              textAlign: 'right',
              maxWidth: '150px'
            }}>
              Complete current task first
            </span>
          )}
        </div>
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
      <PageHeader
        title="My Tasks"
        subtitle={`${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} assigned to you`}
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path>
            <rect x="9" y="3" width="6" height="4" rx="1"></rect>
          </svg>
        }
        stats={[
          { label: 'Pending', value: tasks.filter(t => getTaskStatus(t) === 'pending' || getTaskStatus(t) === 'active').length },
          { label: 'In Progress', value: tasks.filter(t => getTaskStatus(t) === 'in_progress').length }
        ]}
      />

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

      {actionModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: '#0f172a'
              }}>
                {actionModal === 'complete' ? 'Complete Task' : 'Send Back to Previous'}
              </h2>
              <button
                onClick={() => {
                  setActionModal(null);
                  setActiveTask(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#334155'
                }}>
                  Note <span style={{ color: '#94a3b8', fontWeight: 'normal', fontSize: '13px' }}>(Editor)</span>
                </label>
                <div style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}>
                  <ReactQuill
                    value={formData.note}
                    onChange={(value) => setFormData({ ...formData, note: value })}
                    style={{ height: '150px', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}
                    theme="snow"
                  />
                </div>
                {/* Spacer for ReactQuill's absolute positioning / height footprint */}
                <div style={{ height: '45px' }}></div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#334155'
                }}>
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    minHeight: '100px',
                    fontSize: '14px',
                    color: '#0f172a',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  placeholder="Enter a professional message..."
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#334155'
                }}>
                  Link
                </label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  placeholder="https://..."
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#334155'
                }}>
                  Attachments
                </label>
                <div style={{
                  border: '1px dashed #cbd5e1',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    style={{
                      width: '100%',
                      fontSize: '14px',
                      color: '#64748b',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '20px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              backgroundColor: '#f8fafc'
            }}>
              <button
                onClick={() => {
                  setActionModal(null);
                  setActiveTask(null);
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  color: '#475569',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#475569'; }}
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                disabled={activeTask && actionLoading[activeTask._id]}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: actionModal === 'complete' ? '#10b981' : '#ef4444',
                  color: 'white',
                  cursor: (activeTask && actionLoading[activeTask._id]) ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'background-color 0.2s',
                  opacity: (activeTask && actionLoading[activeTask._id]) ? 0.7 : 1,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                onMouseEnter={(e) => { if (!(activeTask && actionLoading[activeTask._id])) e.currentTarget.style.backgroundColor = actionModal === 'complete' ? '#059669' : '#dc2626'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = actionModal === 'complete' ? '#10b981' : '#ef4444'; }}
              >
                {(activeTask && actionLoading[activeTask._id]) ? 'Processing...' : (actionModal === 'complete' ? '✓ Complete Task' : 'Send Back')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MyTasksList;
