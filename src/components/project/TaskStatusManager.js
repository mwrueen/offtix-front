import React, { useState } from 'react';
import { taskStatusAPI } from '../../services/api';

const TaskStatusManager = ({ projectId, taskStatuses, onStatusesUpdate, selectedStatus, onStatusChange, isProjectOwner = false, ...props }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [newStatus, setNewStatus] = useState({ name: '', color: '#6b7280' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStatus) {
        await taskStatusAPI.update(projectId, editingStatus._id, newStatus);
      } else {
        await taskStatusAPI.create(projectId, newStatus);
      }
      await onStatusesUpdate();
      setNewStatus({ name: '', color: '#6b7280' });
      setShowForm(false);
      setEditingStatus(null);
    } catch (error) {
      console.error('Error saving status:', error);
    }
  };

  const handleEdit = (status) => {
    setNewStatus({ name: status.name, color: status.color });
    setEditingStatus(status);
    setShowForm(true);
  };

  const handleDelete = async (statusId) => {
    if (window.confirm('Are you sure you want to delete this status?')) {
      try {
        await taskStatusAPI.delete(projectId, statusId);
        await onStatusesUpdate();
      } catch (error) {
        console.error('Error deleting status:', error);
        alert(error.response?.data?.error || 'Failed to delete status');
      }
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingStatus(null);
    setNewStatus({ name: '', color: '#6b7280' });
  };

  const colors = [
    '#6b7280', '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'
  ];

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Status</span>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '4px 8px',
            backgroundColor: 'transparent',
            color: '#3b82f6',
            border: '1px solid #3b82f6',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {showForm ? 'Cancel' : '+ Add Status'}
        </button>
      </div>

      {showForm && (
        <div style={{
          padding: '12px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          marginBottom: '12px'
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="Status name"
                  value={newStatus.name}
                  onChange={(e) => setNewStatus({...newStatus, name: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '3px',
                    fontSize: '13px'
                  }}
                />
              </div>
              <div>
                <select
                  value={newStatus.color}
                  onChange={(e) => setNewStatus({...newStatus, color: e.target.value})}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '3px',
                    fontSize: '13px',
                    backgroundColor: newStatus.color,
                    color: 'white'
                  }}
                >
                  {colors.map(color => (
                    <option key={color} value={color} style={{ backgroundColor: color }}>
                      ●
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                {editingStatus ? 'Update' : 'Add'}
              </button>
              {editingStatus && (
                <button
                  type="button"
                  onClick={cancelForm}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'transparent',
                    color: '#64748b',
                    border: '1px solid #d1d5db',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <select
        value={selectedStatus || ''}
        onChange={(e) => onStatusChange && onStatusChange(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '2px solid #ddd',
          borderRadius: '3px',
          fontSize: '14px',
          backgroundColor: 'white'
        }}
      >
        <option value="">None</option>
        {taskStatuses.map(status => (
          <option key={status._id} value={status._id}>
            {status.name}
          </option>
        ))}
      </select>

      {isProjectOwner && taskStatuses.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>
            Manage Statuses
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {taskStatuses.map(status => (
              <div key={status._id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                backgroundColor: '#f8fafc',
                borderRadius: '3px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: status.color,
                    borderRadius: '2px'
                  }}></div>
                  <span style={{ fontSize: '13px', color: '#1e293b' }}>{status.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => handleEdit(status)}
                    style={{
                      padding: '2px 6px',
                      backgroundColor: 'transparent',
                      color: '#64748b',
                      border: '1px solid #d1d5db',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(status._id)}
                    style={{
                      padding: '2px 6px',
                      backgroundColor: 'transparent',
                      color: '#ef4444',
                      border: '1px solid #d1d5db',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskStatusManager;