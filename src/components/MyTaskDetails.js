import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { myTasksAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Layout from './Layout';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const MyTaskDetails = () => {
  const { id: taskId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [taskData, setTaskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionModal, setActionModal] = useState(null); // 'complete' or 'sendBack'
  const [formData, setFormData] = useState({ note: '', message: '', link: '' });
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await myTasksAPI.getById(taskId);
      setTaskData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch task details');
      toast?.showToast?.('Failed to load task details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setActionLoading('starting');
    try {
      if (taskData.workflowType === 'sequential') {
        await myTasksAPI.startSequential(taskId);
      } else {
        await myTasksAPI.start(taskId);
      }
      toast?.showToast?.('Task started successfully', 'success');
      fetchTaskDetails();
    } catch (err) {
      toast?.showToast?.(err.response?.data?.error || 'Failed to start task', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePause = async () => {
    setActionLoading('pausing');
    try {
      await myTasksAPI.pauseSequential(taskId);
      toast?.showToast?.('Task paused', 'success');
      fetchTaskDetails();
    } catch (err) {
      toast?.showToast?.(err.response?.data?.error || 'Failed to pause task', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteClick = () => {
    setActionModal('complete');
  };

  const handleSendBackClick = () => {
    setActionModal('sendBack');
  };

  const handleModalSubmit = async () => {
    setActionLoading(actionModal === 'complete' ? 'completing' : 'sendingBack');
    try {
      if (actionModal === 'complete') {
        await myTasksAPI.completeSequential(taskId, formData.note, formData.message, formData.link, selectedFiles);
        toast?.showToast?.('Task completed successfully', 'success');
      } else {
        await myTasksAPI.sendBackSequential(taskId, formData.note, formData.message, formData.link, selectedFiles);
        toast?.showToast?.('Task sent back successfully', 'success');
      }
      setActionModal(null);
      setFormData({ note: '', message: '', link: '' });
      setSelectedFiles([]);
      fetchTaskDetails();
    } catch (err) {
      toast?.showToast?.(err.response?.data?.error || `Failed to process action`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    const statusMap = {
      pending: '#94a3b8',
      active: '#10b981',
      in_progress: '#3b82f6',
      paused: '#f59e0b',
      completed: '#10b981'
    };
    return statusMap[status] || '#94a3b8';
  };

  const getStatusLabel = (status) => {
    const labelMap = {
      pending: 'Pending',
      active: 'Active',
      in_progress: 'In Progress',
      paused: 'Paused',
      completed: 'Completed'
    };
    return labelMap[status] || status;
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading task details...</div>
      </Layout>
    );
  }

  if (error || !taskData) {
    return (
      <Layout>
        <div style={{ color: '#ef4444', textAlign: 'center', padding: '50px' }}>
          {error || 'Task not found'}
        </div>
      </Layout>
    );
  }

  const { task, workflowType, allowedActions } = taskData;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/my-tasks')}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
          >
            ← Back
          </button>
          <div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: 'white',
              margin: '0 0 4px 0'
            }}>
              {task.title}
            </h1>
            {task.project && (
              <p style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: 0
              }}>
                Project: {task.project.title}
              </p>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
        {/* Main Content */}
        <div>
          {/* Description */}
          {task.description && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 12px 0'
              }}>
                Description
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                lineHeight: '1.6',
                margin: 0,
                whiteSpace: 'pre-wrap'
              }}>
                {task.description}
              </p>
            </div>
          )}

          {/* Sequential Assignees */}
          {workflowType === 'sequential' && taskData.sequentialAssignees && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 20px 0'
              }}>
                Sequential Workflow
              </h3>
              {taskData.sequentialAssignees.map((assignee, idx) => (
                <div key={idx} style={{
                  padding: '16px',
                  backgroundColor: assignee.isCurrent ? '#eff6ff' : '#f8fafc',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  border: assignee.isCurrent ? '2px solid #3b82f6' : '1px solid #e2e8f0'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: assignee.isCurrent ? '600' : '500',
                      color: '#1e293b'
                    }}>
                      {idx + 1}. {assignee.user.name}
                      {assignee.isCurrent && (
                        <span style={{
                          marginLeft: '8px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: '#3b82f6',
                          color: 'white'
                        }}>
                          Your Turn
                        </span>
                      )}
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: `${getStatusColor(assignee.status)}20`,
                      color: getStatusColor(assignee.status)
                    }}>
                      {getStatusLabel(assignee.status)}
                    </span>
                  </div>
                  {assignee.startedAt && (
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Started: {formatDate(assignee.startedAt)}
                    </div>
                  )}
                  {assignee.completedAt && (
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Completed: {formatDate(assignee.completedAt)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Activity Timeline */}
          {taskData.activity && taskData.activity.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 20px 0'
              }}>
                Activity Timeline
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {taskData.activity.map((item, idx) => (
                  <div key={item._id} style={{
                    paddingBottom: '16px',
                    borderBottom: idx < taskData.activity.length - 1 ? '1px solid #e2e8f0' : 'none'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '4px'
                    }}>
                      {item.performedBy?.name || 'Unknown'} {item.action.replace('_', ' ')}
                    </div>
                    {item.note && (
                      <div style={{
                        fontSize: '13px',
                        color: '#64748b',
                        marginBottom: '8px',
                        backgroundColor: '#f8fafc',
                        padding: '8px',
                        borderRadius: '6px'
                      }}>
                        <div dangerouslySetInnerHTML={{ __html: item.note }} />
                      </div>
                    )}
                    {item.message && (
                      <div style={{
                        fontSize: '13px',
                        color: '#1e293b',
                        marginBottom: '8px',
                        fontStyle: 'italic',
                        borderLeft: '3px solid #e2e8f0',
                        paddingLeft: '8px'
                      }}>
                        "{item.message}"
                      </div>
                    )}
                    {item.metadata?.link && (
                      <div style={{
                        fontSize: '13px',
                        marginBottom: '8px'
                      }}>
                        🔗 <a href={item.metadata.link} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                          {item.metadata.link}
                        </a>
                      </div>
                    )}
                    {item.documents && item.documents.length > 0 && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        marginBottom: '8px'
                      }}>
                        {item.documents.map((doc, docIdx) => (
                          <div key={docIdx} style={{ fontSize: '13px' }}>
                            📎 <a href={`http://localhost:5000/${doc.path}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                              {doc.originalName || doc.filename}
                            </a>
                            <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>
                              ({Math.round(doc.size / 1024)} KB)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{
                      fontSize: '12px',
                      color: '#94a3b8'
                    }}>
                      {formatDate(item.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          {/* Actions */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e5e7eb',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 16px 0'
            }}>
              Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {allowedActions.canStart && (
                <button
                  onClick={handleStart}
                  disabled={actionLoading}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.6 : 1
                  }}
                >
                  {actionLoading === 'starting' ? 'Starting...' : '▶️ Start'}
                </button>
              )}
              {allowedActions.canPause && (
                <button
                  onClick={handlePause}
                  disabled={actionLoading}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.6 : 1
                  }}
                >
                  {actionLoading === 'pausing' ? 'Pausing...' : '⏸️ Pause'}
                </button>
              )}
              {allowedActions.canComplete && (
                <button
                  onClick={handleCompleteClick}
                  disabled={actionLoading}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.6 : 1
                  }}
                >
                  {actionLoading === 'completing' ? 'Completing...' : '✅ Complete'}
                </button>
              )}
              {allowedActions.canSendBack && (
                <button
                  onClick={handleSendBackClick}
                  disabled={actionLoading}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.6 : 1
                  }}
                >
                  {actionLoading === 'sendingBack' ? 'Sending Back...' : '↩️ Back to Previous'}
                </button>
              )}
            </div>
          </div>

          {/* Task Info */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 16px 0'
            }}>
              Task Info
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {task.status && (
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                    Status
                  </div>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    backgroundColor: task.status.color ? `${task.status.color}20` : '#f1f5f9',
                    color: task.status.color || '#64748b',
                    display: 'inline-block'
                  }}>
                    {task.status.name}
                  </span>
                </div>
              )}
              {task.priority && (
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                    Priority
                  </div>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    backgroundColor: task.priority === 'urgent' ? '#fee2e2' :
                      task.priority === 'high' ? '#fef3c7' :
                        task.priority === 'medium' ? '#dbeafe' : '#f0fdf4',
                    color: task.priority === 'urgent' ? '#dc2626' :
                      task.priority === 'high' ? '#d97706' :
                        task.priority === 'medium' ? '#2563eb' : '#16a34a',
                    display: 'inline-block',
                    textTransform: 'uppercase'
                  }}>
                    {task.priority}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
                onClick={() => setActionModal(null)}
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
                onClick={() => setActionModal(null)}
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
                disabled={actionLoading}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: actionModal === 'complete' ? '#10b981' : '#ef4444',
                  color: 'white',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'background-color 0.2s',
                  opacity: actionLoading ? 0.7 : 1,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                onMouseEnter={(e) => { if (!actionLoading) e.currentTarget.style.backgroundColor = actionModal === 'complete' ? '#059669' : '#dc2626'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = actionModal === 'complete' ? '#10b981' : '#ef4444'; }}
              >
                {actionLoading ? 'Processing...' : (actionModal === 'complete' ? '✓ Complete Task' : 'Send Back')}
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default MyTaskDetails;
