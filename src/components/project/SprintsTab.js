import React, { useState } from 'react';
import { sprintAPI } from '../../services/api';

const SprintsTab = ({ projectId, sprints, setSprints, phases, users, isProjectOwner, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phase: '',
    status: 'planning',
    startDate: '',
    endDate: '',
    goal: '',
    capacity: '',
    velocity: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        phase: formData.phase || undefined,
        capacity: formData.capacity ? parseFloat(formData.capacity) : undefined,
        velocity: formData.velocity ? parseFloat(formData.velocity) : undefined
      };

      if (editingSprint) {
        await sprintAPI.update(projectId, editingSprint._id, data);
      } else {
        await sprintAPI.create(projectId, data);
      }
      
      await onRefresh();
      resetForm();
    } catch (error) {
      console.error('Error saving sprint:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      phase: '',
      status: 'planning',
      startDate: '',
      endDate: '',
      goal: '',
      capacity: '',
      velocity: ''
    });
    setShowForm(false);
    setEditingSprint(null);
  };

  const handleEdit = (sprint) => {
    setFormData({
      name: sprint.name,
      description: sprint.description || '',
      phase: sprint.phase?._id || '',
      status: sprint.status,
      startDate: new Date(sprint.startDate).toISOString().split('T')[0],
      endDate: new Date(sprint.endDate).toISOString().split('T')[0],
      goal: sprint.goal || '',
      capacity: sprint.capacity || '',
      velocity: sprint.velocity || ''
    });
    setEditingSprint(sprint);
    setShowForm(true);
  };

  const handleDelete = async (sprintId) => {
    if (window.confirm('Are you sure you want to delete this sprint?')) {
      try {
        await sprintAPI.delete(projectId, sprintId);
        await onRefresh();
      } catch (error) {
        console.error('Error deleting sprint:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'planning': { bg: '#fff4e6', text: '#d46b08', border: '#ffcc95' },
      'active': { bg: '#e6f7ff', text: '#0052cc', border: '#91d5ff' },
      'completed': { bg: '#f6ffed', text: '#389e0d', border: '#b7eb8f' },
      'cancelled': { bg: '#fff1f0', text: '#cf1322', border: '#ffa39e' }
    };
    return colors[status] || colors.planning;
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#172b4d' }}>
          Sprints ({sprints.length})
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
          {showForm ? 'Cancel' : 'Add Sprint'}
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
            {editingSprint ? 'Edit Sprint' : 'New Sprint'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                    Sprint Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="e.g., Sprint 1, Alpha Release Sprint"
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
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
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
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                    Sprint Goal
                  </label>
                  <textarea
                    value={formData.goal}
                    onChange={(e) => setFormData({...formData, goal: e.target.value})}
                    rows="2"
                    placeholder="What is the main objective of this sprint?"
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
                    Phase
                  </label>
                  <select
                    value={formData.phase}
                    onChange={(e) => setFormData({...formData, phase: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">No Phase</option>
                    {phases.map(phase => (
                      <option key={phase._id} value={phase._id}>{phase.name}</option>
                    ))}
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
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
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
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
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
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                      Capacity (hours)
                    </label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #dfe1e6',
                        borderRadius: '3px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                      Velocity (points)
                    </label>
                    <input
                      type="number"
                      value={formData.velocity}
                      onChange={(e) => setFormData({...formData, velocity: e.target.value})}
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
                {editingSprint ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sprints List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sprints.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            color: '#5e6c84',
            backgroundColor: '#ffffff',
            border: '1px solid #dfe1e6',
            borderRadius: '3px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏃‍♂️</div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#172b4d' }}>No sprints yet</h4>
            <p style={{ margin: 0, fontSize: '14px' }}>Create sprints to organize your development cycles.</p>
          </div>
        ) : (
          sprints.map(sprint => {
            const statusColor = getStatusColor(sprint.status);
            const duration = calculateDuration(sprint.startDate, sprint.endDate);
            
            return (
              <div key={sprint._id} style={{
                backgroundColor: '#ffffff',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#172b4d' }}>
                      {sprint.name}
                      <span style={{ fontSize: '12px', color: '#5e6c84', fontWeight: '400', marginLeft: '8px' }}>
                        (Sprint #{sprint.sprintNumber})
                      </span>
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
                        {sprint.status}
                      </span>
                      {sprint.phase && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '11px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: '#f4f5f7',
                          color: '#5e6c84',
                          border: '1px solid #dfe1e6'
                        }}>
                          {sprint.phase.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(sprint)}
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
                      onClick={() => handleDelete(sprint._id)}
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
                
                {sprint.description && (
                  <p style={{ margin: '0 0 12px 0', color: '#5e6c84', fontSize: '14px', lineHeight: '1.5' }}>
                    {sprint.description}
                  </p>
                )}
                
                {sprint.goal && (
                  <div style={{ marginBottom: '12px' }}>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#5e6c84', textTransform: 'uppercase' }}>
                      Sprint Goal
                    </h5>
                    <p style={{ margin: 0, color: '#172b4d', fontSize: '14px', lineHeight: '1.5' }}>
                      {sprint.goal}
                    </p>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#5e6c84', flexWrap: 'wrap' }}>
                  <span>📅 {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}</span>
                  <span>⏱️ {duration} days</span>
                  {sprint.capacity && (
                    <span>💪 {sprint.capacity}h capacity</span>
                  )}
                  {sprint.velocity && (
                    <span>🚀 {sprint.velocity} points</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SprintsTab;