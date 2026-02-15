import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { myTasksAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Layout from './Layout';

const MyTaskDetails = () => {
  const { id: taskId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [taskData, setTaskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [durationInput, setDurationInput] = useState('');
  const [savingDuration, setSavingDuration] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showSendBackModal, setShowSendBackModal] = useState(false);
  const [completeNote, setCompleteNote] = useState('');
  const [completeFiles, setCompleteFiles] = useState([]);
  const [sendBackNote, setSendBackNote] = useState('');
  const [sendBackMessage, setSendBackMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Generate default send-back message helper
  const getDefaultSendBackMessage = (assignee, note) => {
    if (!assignee) return '';
    return `Hi ${assignee.name}, I reviewed the task submission and found a few items that need adjustment: ${note || '[your note]'}. Could you please address these and re-submit? Thanks.`;
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  // Set default send-back message when modal opens
  useEffect(() => {
    if (showSendBackModal && !sendBackMessage && taskData) {
      const previousAssignee = taskData.steps?.previous?.length > 0 
        ? taskData.steps.previous[taskData.steps.previous.length - 1].assignees[0] 
        : null;
      if (previousAssignee) {
        setSendBackMessage(
          `Hi ${previousAssignee.name}, I reviewed the task submission and found a few items that need adjustment: [your note]. Could you please address these and re-submit? Thanks.`
        );
      }
    }
  }, [showSendBackModal, taskData]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await myTasksAPI.getById(taskId);
      setTaskData(response.data);
      setDurationInput(response.data.duration.userDurationMinutes || '');
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch task details');
      toast?.showToast?.('Failed to load task details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDuration = async () => {
    const minutes = parseInt(durationInput);
    if (isNaN(minutes) || minutes < 0) {
      toast?.showToast?.('Please enter a valid duration in minutes', 'error');
      return;
    }

    try {
      setSavingDuration(true);
      const response = await myTasksAPI.setDuration(taskId, minutes);
      setTaskData(prev => ({
        ...prev,
        duration: {
          userDurationMinutes: response.data.userDurationMinutes,
          totalDurationMinutes: response.data.totalDurationMinutes
        }
      }));
      toast?.showToast?.('Duration saved successfully', 'success');
    } catch (err) {
      toast?.showToast?.(err.response?.data?.error || 'Failed to save duration', 'error');
    } finally {
      setSavingDuration(false);
    }
  };

  const handleStart = async () => {
    try {
      setSubmitting(true);
      await myTasksAPI.start(taskId);
      toast?.showToast?.('Task started successfully', 'success');
      fetchTaskDetails();
    } catch (err) {
      toast?.showToast?.(err.response?.data?.error || 'Failed to start task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!completeNote.trim()) {
      toast?.showToast?.('Please enter a completion note', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await myTasksAPI.complete(taskId, completeNote, completeFiles);
      toast?.showToast?.('Task completed successfully', 'success');
      setShowCompleteModal(false);
      setCompleteNote('');
      setCompleteFiles([]);
      fetchTaskDetails();
    } catch (err) {
      toast?.showToast?.(err.response?.data?.error || 'Failed to complete task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendBack = async () => {
    if (!sendBackNote.trim()) {
      toast?.showToast?.('Please enter a note describing the issues', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await myTasksAPI.sendBack(taskId, sendBackNote, sendBackMessage);
      toast?.showToast?.('Task sent back for fix', 'success');
      setShowSendBackModal(false);
      setSendBackNote('');
      setSendBackMessage('');
      fetchTaskDetails();
    } catch (err) {
      toast?.showToast?.(err.response?.data?.error || 'Failed to send back task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
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

  const getActionIcon = (action) => {
    const iconMap = {
      started: '▶️',
      completed: '✅',
      duration_updated: '⏱️',
      send_back: '↩️',
      status_changed: '🔄'
    };
    return iconMap[action] || '📝';
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

  const { task, steps, duration, allowedActions, activity } = taskData;

  // Generate default send-back message
  const previousAssignee = steps.previous.length > 0 
    ? steps.previous[steps.previous.length - 1].assignees[0] 
    : null;

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
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
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
              fontSize: '32px',
              fontWeight: '700',
              color: 'white',
              margin: '0 0 8px 0'
            }}>
              {task.title}
            </h1>
            {task.project && (
              <p style={{
                fontSize: '16px',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: 0
              }}>
                Project: {task.project.title}
              </p>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
        {/* Main Content */}
        <div>
          {/* Description */}
          {task.description && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              border: '2px solid #f1f5f9'
            }}>
              <h3 style={{
                fontSize: '18px',
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

          {/* Assignees */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            border: '2px solid #f1f5f9'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 20px 0'
            }}>
              Workflow Assignees
            </h3>

            {/* Previous Steps */}
            {steps.previous.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '12px'
                }}>
                  Previous Steps
                </div>
                {steps.previous.map((step, idx) => (
                  <div key={step._id} style={{
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        backgroundColor: step.role?.color ? `${step.role.color}15` : '#f1f5f9',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: step.role?.color || '#475569',
                        fontWeight: '500'
                      }}>
                        {step.role?.icon || '👤'} {step.role?.name || 'Unknown Role'}
                      </div>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 10px',
                        backgroundColor: getStatusColor(step.status) + '15',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: getStatusColor(step.status),
                        fontWeight: '600'
                      }}>
                        {getStatusLabel(step.status)}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#64748b',
                      marginBottom: '8px'
                    }}>
                      Assignees: {step.assignees.map(a => a.name).join(', ')}
                    </div>
                    {step.completedAt && (
                      <div style={{
                        fontSize: '12px',
                        color: '#94a3b8'
                      }}>
                        Completed: {formatDate(step.completedAt)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Current Step */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '12px'
              }}>
                Current Step (You)
              </div>
              <div style={{
                padding: '16px',
                backgroundColor: '#eff6ff',
                borderRadius: '12px',
                border: '2px solid #3b82f6'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: steps.current.role?.color ? `${steps.current.role.color}15` : '#f1f5f9',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: steps.current.role?.color || '#475569',
                    fontWeight: '500'
                  }}>
                    {steps.current.role?.icon || '👤'} {steps.current.role?.name || 'Unknown Role'}
                  </div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '4px 10px',
                    backgroundColor: getStatusColor(steps.current.status) + '15',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: getStatusColor(steps.current.status),
                    fontWeight: '600'
                  }}>
                    {getStatusLabel(steps.current.status)}
                  </div>
                </div>
                <div style={{
                  fontSize: '13px',
                  color: '#64748b',
                  marginBottom: '8px'
                }}>
                  Assignees: {steps.current.assignees.map(a => a.name).join(', ')}
                </div>
                {steps.current.startedAt && (
                  <div style={{
                    fontSize: '12px',
                    color: '#94a3b8'
                  }}>
                    Started: {formatDate(steps.current.startedAt)}
                  </div>
                )}
              </div>
            </div>

            {/* Next Steps */}
            {steps.next.length > 0 && (
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '12px'
                }}>
                  Next Steps
                </div>
                {steps.next.map((step, idx) => (
                  <div key={step._id} style={{
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    border: '1px solid #e2e8f0',
                    opacity: step.status === 'blocked' ? 0.6 : 1
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        backgroundColor: step.role?.color ? `${step.role.color}15` : '#f1f5f9',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: step.role?.color || '#475569',
                        fontWeight: '500'
                      }}>
                        {step.role?.icon || '👤'} {step.role?.name || 'Unknown Role'}
                      </div>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 10px',
                        backgroundColor: getStatusColor(step.status) + '15',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: getStatusColor(step.status),
                        fontWeight: '600'
                      }}>
                        {getStatusLabel(step.status)}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#64748b'
                    }}>
                      Assignees: {step.assignees.map(a => a.name).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            border: '2px solid #f1f5f9'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 20px 0'
            }}>
              Activity Timeline
            </h3>
            {activity.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>No activity yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activity.map((item, idx) => (
                  <div key={item._id} style={{
                    display: 'flex',
                    gap: '12px',
                    paddingBottom: '16px',
                    borderBottom: idx < activity.length - 1 ? '1px solid #e2e8f0' : 'none'
                  }}>
                    <div style={{
                      fontSize: '24px',
                      flexShrink: 0
                    }}>
                      {getActionIcon(item.action)}
                    </div>
                    <div style={{ flex: 1 }}>
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
                          whiteSpace: 'pre-wrap'
                        }}>
                          {item.note}
                        </div>
                      )}
                      {item.message && (
                        <div style={{
                          fontSize: '13px',
                          color: '#475569',
                          marginBottom: '8px',
                          padding: '8px 12px',
                          backgroundColor: '#f1f5f9',
                          borderRadius: '6px',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {item.message}
                        </div>
                      )}
                      {item.documents && item.documents.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          {item.documents.map((doc, docIdx) => (
                            <a
                              key={docIdx}
                              href={`http://localhost:5000/${doc.path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                backgroundColor: '#f1f5f9',
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: '#3b82f6',
                                textDecoration: 'none',
                                marginRight: '8px',
                                marginBottom: '4px'
                              }}
                            >
                              📎 {doc.originalName}
                            </a>
                          ))}
                        </div>
                      )}
                      <div style={{
                        fontSize: '12px',
                        color: '#94a3b8',
                        marginTop: '4px'
                      }}>
                        {formatDate(item.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Duration */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            border: '2px solid #f1f5f9'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 16px 0'
            }}>
              Duration
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '14px',
                color: '#64748b',
                marginBottom: '8px'
              }}>
                Your Duration
              </div>
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <input
                  type="number"
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  placeholder="Minutes"
                  min="0"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={handleSetDuration}
                  disabled={savingDuration}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: savingDuration ? 'not-allowed' : 'pointer',
                    opacity: savingDuration ? 0.6 : 1
                  }}
                >
                  {savingDuration ? 'Saving...' : 'Save'}
                </button>
              </div>
              {duration.userDurationMinutes && (
                <div style={{
                  fontSize: '13px',
                  color: '#64748b',
                  marginTop: '8px'
                }}>
                  Current: {formatDuration(duration.userDurationMinutes)}
                </div>
              )}
            </div>
            <div>
              <div style={{
                fontSize: '14px',
                color: '#64748b',
                marginBottom: '8px'
              }}>
                Total Duration
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1e293b'
              }}>
                {formatDuration(duration.totalDurationMinutes)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            border: '2px solid #f1f5f9'
          }}>
            <h3 style={{
              fontSize: '18px',
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
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  ▶️ Start Now
                </button>
              )}
              {allowedActions.canComplete && (
                <button
                  onClick={() => setShowCompleteModal(true)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✅ Complete
                </button>
              )}
              {allowedActions.canSendBack && (
                <button
                  onClick={() => setShowSendBackModal(true)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ↩️ Send Back for Fix
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Complete Modal */}
      {showCompleteModal && (
        <div style={{
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
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 20px 0'
            }}>
              Complete Task
            </h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                Completion Note <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={completeNote}
                onChange={(e) => setCompleteNote(e.target.value)}
                placeholder="Describe what was completed..."
                required
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                Documentation (Optional)
              </label>
              <input
                type="file"
                multiple
                onChange={(e) => setCompleteFiles(Array.from(e.target.files))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCompleteModal(false);
                  setCompleteNote('');
                  setCompleteFiles([]);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                disabled={submitting || !completeNote.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: submitting || !completeNote.trim() ? 'not-allowed' : 'pointer',
                  opacity: submitting || !completeNote.trim() ? 0.6 : 1
                }}
              >
                {submitting ? 'Completing...' : 'Complete Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Back Modal */}
      {showSendBackModal && (
        <div style={{
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
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1e293b',
              margin: '0 0 20px 0'
            }}>
              Send Back for Fix
            </h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                Note (Issues Found) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={sendBackNote}
                onChange={(e) => {
                  setSendBackNote(e.target.value);
                  // Update message with note
                  if (previousAssignee) {
                    setSendBackMessage(
                      `Hi ${previousAssignee.name}, I reviewed the task submission and found a few items that need adjustment: ${e.target.value}. Could you please address these and re-submit? Thanks.`
                    );
                  }
                }}
                placeholder="Describe the issues that need to be fixed..."
                required
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                Professional Message (Editable)
              </label>
              <textarea
                value={sendBackMessage}
                onChange={(e) => setSendBackMessage(e.target.value)}
                placeholder="Message to previous assignee..."
                rows={5}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
              <div style={{
                fontSize: '12px',
                color: '#64748b',
                marginTop: '4px'
              }}>
                This message will be sent to the previous assignee
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowSendBackModal(false);
                  setSendBackNote('');
                  setSendBackMessage('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendBack}
                disabled={submitting || !sendBackNote.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: submitting || !sendBackNote.trim() ? 'not-allowed' : 'pointer',
                  opacity: submitting || !sendBackNote.trim() ? 0.6 : 1
                }}
              >
                {submitting ? 'Sending...' : 'Send Back'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MyTaskDetails;
           