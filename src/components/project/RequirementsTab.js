import React, { useState } from 'react';
import { requirementAPI } from '../../services/api';

const RequirementsTab = ({ projectId, requirements, setRequirements, users, isProjectOwner, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'functional',
    priority: 'medium',
    status: 'draft',
    assignedTo: '',
    estimatedHours: '',
    acceptanceCriteria: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        assignedTo: formData.assignedTo || undefined
      };

      if (editingRequirement) {
        await requirementAPI.update(projectId, editingRequirement._id, data);
      } else {
        await requirementAPI.create(projectId, data);
      }
      
      await onRefresh();
      resetForm();
    } catch (error) {
      console.error('Error saving requirement:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'functional',
      priority: 'medium',
      status: 'draft',
      assignedTo: '',
      estimatedHours: '',
      acceptanceCriteria: []
    });
    setShowForm(false);
    setEditingRequirement(null);
  };

  const handleEdit = (requirement) => {
    setFormData({
      title: requirement.title,
      description: requirement.description,
      type: requirement.type,
      priority: requirement.priority,
      status: requirement.status,
      assignedTo: requirement.assignedTo?._id || '',
      estimatedHours: requirement.estimatedHours || '',
      acceptanceCriteria: requirement.acceptanceCriteria || []
    });
    setEditingRequirement(requirement);
    setShowForm(true);
  };

  const handleDelete = async (requirementId) => {
    if (window.confirm('Are you sure you want to delete this requirement?')) {
      try {
        await requirementAPI.delete(projectId, requirementId);
        await onRefresh();
      } catch (error) {
        console.error('Error deleting requirement:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'draft': { bg: '#f4f5f7', text: '#5e6c84', border: '#dfe1e6' },
      'approved': { bg: '#e6f7ff', text: '#0052cc', border: '#91d5ff' },
      'in-progress': { bg: '#fff4e6', text: '#d46b08', border: '#ffcc95' },
      'completed': { bg: '#f6ffed', text: '#389e0d', border: '#b7eb8f' },
      'rejected': { bg: '#fff1f0', text: '#cf1322', border: '#ffa39e' }
    };
    return colors[status] || colors.draft;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': { bg: '#f6ffed', text: '#389e0d', border: '#b7eb8f' },
      'medium': { bg: '#fff4e6', text: '#d46b08', border: '#ffcc95' },
      'high': { bg: '#fff1f0', text: '#cf1322', border: '#ffa39e' },
      'critical': { bg: '#f9f0ff', text: '#722ed1', border: '#d3adf7' }
    };
    return colors[priority] || colors.medium;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#172b4d' }}>
          Requirements ({requirements.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0052cc',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {showForm ? 'Cancel' : 'Add Requirement'}
        </button>
      </div>

      {showForm && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #dfe1e6',
          borderRadius: '3px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#172b4d' }}>
            {editingRequirement ? 'Edit Requirement' : 'New Requirement'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                    rows="4"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
              
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="functional">Functional</option>
                    <option value="non-functional">Non-Functional</option>
                    <option value="business">Business</option>
                    <option value="technical">Technical</option>
                    <option value="user-story">User Story</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="draft">Draft</option>
                    <option value="approved">Approved</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                    Assigned To
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Unassigned</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>{user.name}</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({...formData, estimatedHours: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: '#5e6c84',
                  border: '1px solid #dfe1e6',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#0052cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {editingRequirement ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Requirements List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {requirements.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            color: '#5e6c84',
            backgroundColor: '#ffffff',
            border: '1px solid #dfe1e6',
            borderRadius: '3px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#172b4d' }}>No requirements yet</h4>
            <p style={{ margin: 0, fontSize: '14px' }}>Add your first requirement to get started.</p>
          </div>
        ) : (
          requirements.map(requirement => {
            const statusColor = getStatusColor(requirement.status);
            const priorityColor = getPriorityColor(requirement.priority);
            
            return (
              <div key={requirement._id} style={{
                backgroundColor: '#ffffff',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#172b4d' }}>
                      {requirement.title}
                    </h4>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '11px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: statusColor.bg,
                        color: statusColor.text,
                        border: `1px solid ${statusColor.border}`,
                        textTransform: 'capitalize'
                      }}>
                        {requirement.status}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '11px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: priorityColor.bg,
                        color: priorityColor.text,
                        border: `1px solid ${priorityColor.border}`,
                        textTransform: 'capitalize'
                      }}>
                        {requirement.priority}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '11px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: '#f4f5f7',
                        color: '#5e6c84',
                        border: '1px solid #dfe1e6',
                        textTransform: 'capitalize'
                      }}>
                        {requirement.type}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(requirement)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'transparent',
                        color: '#5e6c84',
                        border: '1px solid #dfe1e6',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(requirement._id)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'transparent',
                        color: '#de350b',
                        border: '1px solid #dfe1e6',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <p style={{ margin: '0 0 12px 0', color: '#5e6c84', fontSize: '14px', lineHeight: '1.5' }}>
                  {requirement.description}
                </p>
                
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#5e6c84' }}>
                  {requirement.assignedTo && (
                    <span>👤 {requirement.assignedTo.name}</span>
                  )}
                  {requirement.estimatedHours && (
                    <span>⏱️ {requirement.estimatedHours}h</span>
                  )}
                  <span>📅 {new Date(requirement.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RequirementsTab;