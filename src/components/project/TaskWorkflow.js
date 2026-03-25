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

  const currentRoleIndex = task.currentRoleIndex ?? -1;
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
    <div className="mt-6">
      <div className="text-xs font-semibold text-secondary-600 mb-3 uppercase">
        🔄 Workflow Roles
      </div>

      {!isWorkflowStarted && (
        <div className="mb-4">
          <button
            onClick={handleStartWorkflow}
            className="w-full px-4 py-2.5 rounded bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            Start Workflow
          </button>
          <p className="text-xs text-secondary-600 mt-2">
            Starting the workflow will notify assignees of the first role.
          </p>
        </div>
      )}

      {isWorkflowComplete && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-700 text-sm mb-4">
          ✓ All roles completed!
        </div>
      )}


      {/* Handoff Modal */}
      {showHandoffModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]"
          onClick={() => !uploading && setShowHandoffModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 w-[90%] max-w-[600px] max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-5 text-lg font-semibold text-secondary-800">
              Complete Role & Handoff to Next
            </h3>

            <div className="mb-4">
              <label className="block mb-1.5 text-[13px] font-semibold text-secondary-600">
                Comment / Notes
              </label>
              <textarea
                value={handoffData.comment}
                onChange={(e) => setHandoffData({ ...handoffData, comment: e.target.value })}
                placeholder="Add comments, notes, or instructions for the next role..."
                rows="4"
                className="w-full p-2 border border-secondary-300 rounded text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1.5 text-[13px] font-semibold text-secondary-600">
                Files
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-secondary-100 border border-secondary-300 rounded text-xs cursor-pointer mb-2 hover:bg-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                + Add Files
              </button>
              {handoffData.files.length > 0 && (
                <div className="flex flex-col gap-1">
                  {handoffData.files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-2 py-1.5 bg-secondary-100 rounded text-xs"
                    >
                      <span>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="bg-transparent border-0 text-red-600 hover:text-red-700 cursor-pointer text-base px-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-semibold text-secondary-600">
                  URLs / Links
                </label>
                <button
                  type="button"
                  onClick={addUrl}
                  className="px-2 py-1 bg-secondary-100 border border-secondary-300 rounded text-xs cursor-pointer hover:bg-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  + Add URL
                </button>
              </div>
              {handoffData.urls.map((urlItem, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Title"
                    value={urlItem.title}
                    onChange={(e) => updateUrl(index, 'title', e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-secondary-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="url"
                    placeholder="URL"
                    value={urlItem.url}
                    onChange={(e) => updateUrl(index, 'url', e.target.value)}
                    className="flex-[2] px-2 py-1.5 border border-secondary-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  {handoffData.urls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeUrl(index)}
                      className="px-3 py-1.5 bg-red-50 border border-red-300 rounded text-red-600 text-sm hover:bg-red-100"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => {
                  setShowHandoffModal(false);
                  setHandoffData({ comment: '', urls: [{ title: '', url: '' }], files: [] });
                }}
                disabled={uploading}
                className="px-4 py-2.5 bg-white border border-secondary-300 rounded text-secondary-600 text-sm hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteRole}
                disabled={uploading}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
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

