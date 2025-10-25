import React, { useState } from 'react';
import { phaseAPI } from '../../services/api';

const PhasesTab = ({ projectId, phases, setPhases, users, isProjectOwner, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning',
    startDate: '',
    endDate: '',
    budget: '',
    milestones: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined
      };

      if (editingPhase) {
        await phaseAPI.update(projectId, editingPhase._id, data);
      } else {
        await phaseAPI.create(projectId, data);
      }
      
      await onRefresh();
      resetForm();
    } catch (error) {
      console.error('Error saving phase:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'planning',
      startDate: '',
      endDate: '',
      budget: '',
      milestones: []
    });
    setShowForm(false);
    setEditingPhase(null);
  };

  const handleEdit = (phase) => {
    setFormData({
      name: phase.name,
      description: phase.description || '',
      status: phase.status,
      startDate: new Date(phase.startDate).toISOString().split('T')[0],
      endDate: new Date(phase.endDate).toISOString().split('T')[0],
      budget: phase.budget || '',
      milestones: phase.milestones || []
    });
    setEditingPhase(phase);
    setShowForm(true);
  };

  const handleDelete = async (phaseId) => {
    if (window.confirm('Are you sure you want to delete this phase?')) {
      try {
        await phaseAPI.delete(projectId, phaseId);
        await onRefresh();
      } catch (error) {
        console.error('Error deleting phase:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'planning': { bg: '#fff4e6', text: '#d46b08', border: '#ffcc95' },
      'active': { bg: '#e6f7ff', text: '#0052cc', border: '#91d5ff' },
      'completed': { bg: '#f6ffed', text: '#389e0d', border: '#b7eb8f' },
      'on-hold': { bg: '#fff1f0', text: '#cf1322', border: '#ffa39e' }
    };
    return colors[status] || colors.planning;
  };

  const calculateProgress = (phase) => {
    if (!phase.milestones || phase.milestones.length === 0) return 0;
    const completed = phase.milestones.filter(m => m.completed).length;
    return Math.round((completed / phase.milestones.length) * 100);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#172b4d' }}>
          Project Phases ({phases.length})
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
          {showForm ? 'Cancel' : 'Add Phase'}
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
            {editingPhase ? 'Edit Phase' : 'New Phase'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                    Phase Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                    <option value="on-hold">On Hold</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
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
                
                <div style={{ marginBottom: '16px' }}>
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
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                    Budget
                  </label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
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
                {editingPhase ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Phases List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {phases.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            color: '#5e6c84',
            backgroundColor: '#ffffff',
            border: '1px solid #dfe1e6',
            borderRadius: '3px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#172b4d' }}>No phases yet</h4>
            <p style={{ margin: 0, fontSize: '14px' }}>Create phases to organize your project timeline.</p>
          </div>
        ) : (
          phases.map(phase => {
            const statusColor = getStatusColor(phase.status);
            const progress = calculateProgress(phase);
            
            return (
              <div key={phase._id} style={{
                backgroundColor: '#ffffff',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#172b4d' }}>
                      {phase.name}
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
                        {phase.status}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '11px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: '#f4f5f7',
                        color: '#5e6c84',
                        border: '1px solid #dfe1e6'
                      }}>
                        {progress}% Complete
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(phase)}
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
                      onClick={() => handleDelete(phase._id)}
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
                
                {phase.description && (
                  <p style={{ margin: '0 0 12px 0', color: '#5e6c84', fontSize: '14px', lineHeight: '1.5' }}>
                    {phase.description}
                  </p>
                )}
                
                {/* Progress Bar */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#f4f5f7',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${progress}%`,
                      height: '100%',
                      backgroundColor: progress === 100 ? '#36b37e' : '#0052cc',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#5e6c84' }}>
                  <span>📅 {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}</span>
                  {phase.budget && (
                    <span>💰 ${phase.budget.toLocaleString()}</span>
                  )}
                  {phase.milestones && phase.milestones.length > 0 && (
                    <span>🎯 {phase.milestones.length} milestones</span>
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

export default PhasesTab;