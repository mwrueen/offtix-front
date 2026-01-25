import React, { useState, useRef } from 'react';
import { taskAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const TaskWorkflow = ({ task, projectId, onTaskUpdate }) => {
  const { showToast } = useToast();
  const { state: authState } = useAuth();
  const currentUser = authState.user;
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [handoffData, setHandoffData] = useState({
    comment: '',
    urls: [{ title: '', url: '' }],
    files: []
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!task || !task.useRoleWorkflow || !task.roleAssignments || task.roleAssignments.length === 0) {
    return null;
  }

  const currentRoleIndex = task.currentRoleIndex || -1;
  const isWorkflowStarted = currentRoleIndex >= 0;
  const currentRole = isWorkflowStarted && task.roleAssignments[currentRoleIndex];
  const isCurrentUserAssigned = currentRole && currentRole.assignees?.some(
    assignee => assignee._id === currentUser?._id || assignee === currentUser?._id
  );
  const isWorkflowComplete = task.roleAssignments.every(ra => ra.status === 'completed' || ra.status === 'skipped');

  const handleStartWorkflow = async () => {
    try {
      const response = await taskAPI.startWorkflow(projectId, task._id);
      showToast('Workflow started! First role assignees have been notified.', 'success');
      if (onTaskUpdate) {
        onTaskUpdate(response.data);
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to start workflow', 'error');
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setHandoffData(prev => ({
      ...prev,
      files: [...prev.files, ...files]
    }));
  };

  const removeFile = (index) => {
    setHandoffData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const addUrl = () => {
    setHandoffData(prev => ({
      ...prev,
      urls: [...prev.urls, { title: '', url: '' }]
    }));
  };

  const removeUrl = (index) => {
    setHandoffData(prev => ({
      ...prev,
      urls: prev.urls.filter((_, i) => i !== index)
    }));
  };

  const updateUrl = (index, field, value) => {
    setHandoffData(prev => ({
      ...prev,
      urls: prev.urls.map((url, i) => i === index ? { ...url, [field]: value } : url)
    }));
  };

  const handleCompleteRole = async () => {
    try {
      setUploading(true);
      
      // Prepare form data for file upload
      const formData = new FormData();
      formData.append('comment', handoffData.comment);
      formData.append('urls', JSON.stringify(handoffData.urls.filter(u => u.title && u.url)));
      
      // Append files
      handoffData.files.forEach((file, index) => {
        formData.append(`files`, file);
      });

      // Use fetch for multipart/form-data
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/projects/${projectId}/tasks/${task._id}/workflow/complete-role`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete role');
      }

      const updatedTask = await response.json();
      showToast('Role completed and next role assignees have been notified!', 'success');
      setShowHandoffModal(false);
      setHandoffData({ comment: '', urls: [{ title: '', url: '' }], files: [] });
      
      if (onTaskUpdate) {
        onTaskUpdate(updatedTask);
      }
    } catch (error) {
      showToast(error.message || 'Failed to complete role', 'error');
    } finally {
      setUploading(false);
    }
  };

  const getUserInitials = (user) => {
    if (!user || !user.name) return '?';
    const names = user.name.split(' ');
    return names.length >= 2 
      ? (names[0][0] + names[names.length - 1][0]).toUpperCase() 
      : user.name.substring(0, 2).toUpperCase();
  };

  const getUserColor = (userId) => {
    const colors = ['#0052cc', '#00875a', '#ff8b00', '#6554c0', '#00b8d9', '#ff5630'];
    return colors[userId ? userId.charCodeAt(userId.length - 1) % colors.length : 0];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#0052cc';
      case 'completed': return '#36b37e';
      case 'skipped': return '#ffab00';
      default: return '#dfe1e6';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '▶';
      case 'completed': return '✓';
      case 'skipped': return '⊘';
      default: return '○';
    }
  };

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ 
        fontSize: '12px', 
        fontWeight: '600', 
        color: '#5e6c84', 
        marginBottom: '12px',
        textTransform: 'uppercase'
      }}>
        🔄 Workflow Roles
      </div>

      {!isWorkflowStarted && (
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={handleStartWorkflow}
            style={{
              padding: '10px 16px',
              backgroundColor: '#0052cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Start Workflow
          </button>
          <p style={{ fontSize: '12px', color: '#5e6c84', marginTop: '8px', margin: 0 }}>
            Starting the workflow will notify assignees of the first role.
          </p>
        </div>
      )}

      {isWorkflowComplete && (
        <div style={{
          padding: '12px',
          backgroundColor: '#e3fcef',
          border: '1px solid #36b37e',
          borderRadius: '4px',
          color: '#006644',
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          ✓ All roles completed!
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {task.roleAssignments
          .sort((a, b) => a.order - b.order)
          .map((roleAssignment, index) => {
            const role = roleAssignment.role;
            const status = roleAssignment.status;
            const isCurrent = index === currentRoleIndex;
            const hasHandoff = roleAssignment.handoff;

            return (
              <div
                key={roleAssignment._id || index}
                style={{
                  padding: '12px',
                  border: `2px solid ${isCurrent ? getStatusColor(status) : '#dfe1e6'}`,
                  borderRadius: '4px',
                  backgroundColor: isCurrent ? '#f4f5f7' : 'white',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: role?.color || '#6366f1',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>
                    {role?.icon || '👤'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#172b4d',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(status),
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {getStatusIcon(status)}
                      </span>
                      {role?.name || 'Unknown Role'}
                    </div>
                    {role?.description && (
                      <div style={{ fontSize: '12px', color: '#5e6c84', marginTop: '2px' }}>
                        {role.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Assignees */}
                {roleAssignment.assignees && roleAssignment.assignees.length > 0 && (
                  <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#5e6c84', marginBottom: '4px', fontWeight: '600' }}>
                      Assignees:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {roleAssignment.assignees.map((assignee, idx) => {
                        const user = typeof assignee === 'object' ? assignee : { _id: assignee };
                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              backgroundColor: '#f4f5f7',
                              borderRadius: '3px',
                              fontSize: '12px'
                            }}
                          >
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              backgroundColor: getUserColor(user._id),
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              fontWeight: '600'
                            }}>
                              {getUserInitials(user)}
                            </div>
                            <span>{user.name || 'Unknown'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Handoff Data from Previous Role */}
                {hasHandoff && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#fafbfc',
                    borderRadius: '3px',
                    border: '1px solid #dfe1e6'
                  }}>
                    <div style={{ fontSize: '11px', color: '#5e6c84', marginBottom: '6px', fontWeight: '600' }}>
                      Handoff from previous role:
                    </div>
                    {roleAssignment.handoff.comment && (
                      <div style={{ fontSize: '13px', color: '#172b4d', marginBottom: '8px' }}>
                        {roleAssignment.handoff.comment}
                      </div>
                    )}
                    {roleAssignment.handoff.urls && roleAssignment.handoff.urls.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        {roleAssignment.handoff.urls.map((urlItem, idx) => (
                          <a
                            key={idx}
                            href={urlItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'block',
                              fontSize: '12px',
                              color: '#0052cc',
                              textDecoration: 'none',
                              marginBottom: '4px'
                            }}
                          >
                            🔗 {urlItem.title || urlItem.url}
                          </a>
                        ))}
                      </div>
                    )}
                    {roleAssignment.handoff.files && roleAssignment.handoff.files.length > 0 && (
                      <div>
                        {roleAssignment.handoff.files.map((file, idx) => (
                          <div
                            key={idx}
                            style={{
                              fontSize: '12px',
                              color: '#5e6c84',
                              marginBottom: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            📎 {file.originalName || file.filename}
                            {file.filename && (
                              <a
                                href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/handoff-files/${file.filename}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ marginLeft: '4px', color: '#0052cc' }}
                              >
                                Download
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Button for Current Role */}
                {isCurrent && status === 'active' && isCurrentUserAssigned && (
                  <div style={{ marginTop: '12px' }}>
                    <button
                      onClick={() => setShowHandoffModal(true)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#36b37e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      Complete Role & Handoff
                    </button>
                  </div>
                )}

                {/* Status Info */}
                {status === 'active' && (
                  <div style={{
                    marginTop: '8px',
                    padding: '6px 8px',
                    backgroundColor: '#deebff',
                    borderRadius: '3px',
                    fontSize: '12px',
                    color: '#0052cc'
                  }}>
                    ⏱️ Started: {roleAssignment.startedAt ? new Date(roleAssignment.startedAt).toLocaleString() : 'Just now'}
                  </div>
                )}
                {status === 'completed' && (
                  <div style={{
                    marginTop: '8px',
                    padding: '6px 8px',
                    backgroundColor: '#e3fcef',
                    borderRadius: '3px',
                    fontSize: '12px',
                    color: '#006644'
                  }}>
                    ✓ Completed: {roleAssignment.completedAt ? new Date(roleAssignment.completedAt).toLocaleString() : 'Recently'}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Handoff Modal */}
      {showHandoffModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}
        onClick={() => !uploading && setShowHandoffModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '24px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#172b4d' }}>
              Complete Role & Handoff to Next
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#5e6c84' }}>
                Comment / Notes
              </label>
              <textarea
                value={handoffData.comment}
                onChange={(e) => setHandoffData({ ...handoffData, comment: e.target.value })}
                placeholder="Add comments, notes, or instructions for the next role..."
                rows="4"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #dfe1e6',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#5e6c84' }}>
                Files
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#f4f5f7',
                  border: '1px solid #dfe1e6',
                  borderRadius: '4px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginBottom: '8px'
                }}
              >
                + Add Files
              </button>
              {handoffData.files.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {handoffData.files.map((file, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        backgroundColor: '#f4f5f7',
                        borderRadius: '3px',
                        fontSize: '12px'
                      }}
                    >
                      <span>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#de350b',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: '0 4px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#5e6c84' }}>
                  URLs / Links
                </label>
                <button
                  type="button"
                  onClick={addUrl}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#f4f5f7',
                    border: '1px solid #dfe1e6',
                    borderRadius: '3px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  + Add URL
                </button>
              </div>
              {handoffData.urls.map((urlItem, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="Title"
                    value={urlItem.title}
                    onChange={(e) => updateUrl(index, 'title', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: '1px solid #dfe1e6',
                      borderRadius: '4px',
                      fontSize: '13px'
                    }}
                  />
                  <input
                    type="url"
                    placeholder="URL"
                    value={urlItem.url}
                    onChange={(e) => updateUrl(index, 'url', e.target.value)}
                    style={{
                      flex: 2,
                      padding: '6px 8px',
                      border: '1px solid #dfe1e6',
                      borderRadius: '4px',
                      fontSize: '13px'
                    }}
                  />
                  {handoffData.urls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeUrl(index)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#ffebe6',
                        border: '1px solid #ff8f73',
                        borderRadius: '4px',
                        color: '#de350b',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowHandoffModal(false);
                  setHandoffData({ comment: '', urls: [{ title: '', url: '' }], files: [] });
                }}
                disabled={uploading}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'white',
                  border: '1px solid #dfe1e6',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  color: '#5e6c84'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteRole}
                disabled={uploading}
                style={{
                  padding: '10px 16px',
                  backgroundColor: uploading ? '#c1c7d0' : '#36b37e',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  color: 'white'
                }}
              >
                {uploading ? 'Completing...' : 'Complete & Handoff'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskWorkflow;

