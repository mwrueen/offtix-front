import React, { useState } from 'react';
import { phaseAPI } from '../../services/api';

const PhasesTab = ({ projectId, phases, setPhases, users, isProjectOwner, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);
  const [viewingPhase, setViewingPhase] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
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

  // Filter phases
  const filteredPhases = phases.filter(phase => {
    const matchesSearch = phase.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (phase.description && phase.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || phase.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ padding: '24px', backgroundColor: '#fafbfc', minHeight: '100vh' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        padding: '0 4px'
      }}>
        <div>
          <h1 style={{
            margin: '0 0 4px 0',
            fontSize: '28px',
            fontWeight: '700',
            color: '#172b4d',
            letterSpacing: '-0.5px'
          }}>
            Project Phases
          </h1>
          <p style={{
            margin: 0,
            fontSize: '16px',
            color: '#5e6c84',
            fontWeight: '400'
          }}>
            {filteredPhases.length} of {phases.length} phase{phases.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isProjectOwner && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '12px 24px',
              backgroundColor: showForm ? '#f4f5f7' : '#0052cc',
              color: showForm ? '#5e6c84' : 'white',
              border: showForm ? '1px solid #dfe1e6' : 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: showForm ? 'none' : '0 2px 4px rgba(0, 82, 204, 0.2)'
            }}
          >
            {showForm ? '✕ Cancel' : '+ Add Phase'}
          </button>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e1e5e9',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '50px' }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#5e6c84',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Search phases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0052cc'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#5e6c84',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
        </div>
      </div>

      {showForm && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #e1e5e9',
          borderRadius: '16px',
          padding: '40px',
          marginBottom: '32px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
            paddingBottom: '24px',
            borderBottom: '2px solid #f4f5f7'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              backgroundColor: '#e6f7ff',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              boxShadow: '0 2px 8px rgba(0, 82, 204, 0.1)'
            }}>
              📁
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#172b4d', letterSpacing: '-0.5px' }}>
                {editingPhase ? 'Edit Phase' : 'Create New Phase'}
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#5e6c84', lineHeight: '1.5' }}>
                {editingPhase ? 'Update phase details and timeline' : 'Define project phase and milestones'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '40px' }}>
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#172b4d',
                    letterSpacing: '0.2px'
                  }}>
                    Phase Name <span style={{ color: '#cf1322' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="e.g., Discovery, Development, Testing"
                    style={{
                      boxSizing: 'border-box',
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '10px',
                      fontSize: '15px',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      backgroundColor: '#fafbfc'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0052cc';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0, 82, 204, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e1e5e9';
                      e.target.style.backgroundColor = '#fafbfc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#172b4d',
                    letterSpacing: '0.2px'
                  }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="4"
                    placeholder="Describe the phase objectives and deliverables"
                    style={{
                      boxSizing: 'border-box',
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '10px',
                      fontSize: '15px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      backgroundColor: '#fafbfc',
                      lineHeight: '1.6'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0052cc';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0, 82, 204, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e1e5e9';
                      e.target.style.backgroundColor = '#fafbfc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#172b4d',
                    letterSpacing: '0.2px'
                  }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    style={{
                      boxSizing: 'border-box',
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '10px',
                      fontSize: '15px',
                      backgroundColor: '#fafbfc',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0052cc';
                      e.target.style.backgroundColor = '#ffffff';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e1e5e9';
                      e.target.style.backgroundColor = '#fafbfc';
                    }}
                  >
                    <option value="planning">📋 Planning</option>
                    <option value="active">🏃 Active</option>
                    <option value="completed">✅ Completed</option>
                    <option value="on-hold">⏸️ On Hold</option>
                  </select>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#172b4d',
                    letterSpacing: '0.2px'
                  }}>
                    Start Date <span style={{ color: '#cf1322' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required
                    style={{
                      boxSizing: 'border-box',
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '10px',
                      fontSize: '15px',
                      outline: 'none',
                      backgroundColor: '#fafbfc',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0052cc';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0, 82, 204, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e1e5e9';
                      e.target.style.backgroundColor = '#fafbfc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#172b4d',
                    letterSpacing: '0.2px'
                  }}>
                    End Date <span style={{ color: '#cf1322' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    required
                    style={{
                      boxSizing: 'border-box',
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '10px',
                      fontSize: '15px',
                      outline: 'none',
                      backgroundColor: '#fafbfc',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0052cc';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0, 82, 204, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e1e5e9';
                      e.target.style.backgroundColor = '#fafbfc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#172b4d',
                    letterSpacing: '0.2px'
                  }}>
                    Budget
                  </label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    placeholder="10000"
                    min="0"
                    step="100"
                    style={{
                      boxSizing: 'border-box',
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '10px',
                      fontSize: '15px',
                      outline: 'none',
                      backgroundColor: '#fafbfc',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0052cc';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0, 82, 204, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e1e5e9';
                      e.target.style.backgroundColor = '#fafbfc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '16px',
              marginTop: '40px',
              paddingTop: '32px',
              borderTop: '2px solid #f4f5f7'
            }}>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '14px 32px',
                  backgroundColor: '#ffffff',
                  color: '#5e6c84',
                  border: '2px solid #dfe1e6',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '700',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.3px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f4f5f7';
                  e.target.style.borderColor = '#c1c7d0';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#ffffff';
                  e.target.style.borderColor = '#dfe1e6';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '14px 32px',
                  backgroundColor: '#0052cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '700',
                  boxShadow: '0 4px 12px rgba(0, 82, 204, 0.3)',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.3px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#0747a6';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(0, 82, 204, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#0052cc';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 82, 204, 0.3)';
                }}
              >
                {editingPhase ? '✓ Update Phase' : '+ Create Phase'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Phases List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {filteredPhases.length === 0 && phases.length > 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '64px 24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e1e5e9'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#172b4d' }}>
              No Phases Found
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#5e6c84' }}>
              Try adjusting your search or filter criteria.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f4f5f7',
                color: '#5e6c84',
                border: '1px solid #dfe1e6',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : phases.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '64px 24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e1e5e9'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#172b4d' }}>
              No Phases Yet
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#5e6c84' }}>
              Create phases to organize your project timeline and track progress.
            </p>
            {isProjectOwner && (
              <button
                onClick={() => setShowForm(true)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#0052cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: '0 2px 4px rgba(0, 82, 204, 0.2)'
                }}
              >
                Create First Phase
              </button>
            )}
          </div>
        ) : (
          filteredPhases.map(phase => {
            const statusColor = getStatusColor(phase.status);
            const progress = calculateProgress(phase);

            return (
              <div
                key={phase._id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e1e5e9',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      margin: '0 0 8px 0',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#172b4d',
                      lineHeight: '1.3'
                    }}>
                      {phase.name}
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{
                        ...statusColor,
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        border: `1px solid ${statusColor.border}`
                      }}>
                        {phase.status}
                      </span>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: progress === 100 ? '#f6ffed' : '#f4f5f7',
                        color: progress === 100 ? '#389e0d' : '#5e6c84',
                        border: `1px solid ${progress === 100 ? '#b7eb8f' : '#dfe1e6'}`
                      }}>
                        {progress}% Complete
                      </span>
                      {phase.milestones && phase.milestones.length > 0 && (
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: '#e6f7ff',
                          color: '#0052cc',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          🎯 {phase.milestones.length} milestone{phase.milestones.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                    <button
                      onClick={() => setViewingPhase(phase)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#e6f7ff',
                        color: '#0052cc',
                        border: '1px solid #91d5ff',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#0052cc';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#e6f7ff';
                        e.target.style.color = '#0052cc';
                      }}
                    >
                      View
                    </button>
                    {isProjectOwner && (
                      <>
                        <button
                          onClick={() => handleEdit(phase)}
                          style={{
                            padding: '8px 12px',
                        backgroundColor: '#f4f5f7',
                        color: '#5e6c84',
                        border: '1px solid #dfe1e6',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#e1e5e9';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#f4f5f7';
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(phase._id)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#fff1f0',
                        color: '#cf1322',
                        border: '1px solid #ffa39e',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#cf1322';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#fff1f0';
                        e.target.style.color = '#cf1322';
                      }}
                    >
                      Delete
                    </button>
                      </>
                    )}
                  </div>
                </div>

                {phase.description && (
                  <p style={{
                    margin: '0 0 16px 0',
                    color: '#5e6c84',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    {phase.description}
                  </p>
                )}

                {/* Progress Bar */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{
                    width: '100%',
                    height: '10px',
                    backgroundColor: '#f4f5f7',
                    borderRadius: '5px',
                    overflow: 'hidden',
                    border: '1px solid #e1e5e9'
                  }}>
                    <div style={{
                      width: `${progress}%`,
                      height: '100%',
                      backgroundColor: progress === 100 ? '#52c41a' : '#0052cc',
                      transition: 'width 0.3s ease',
                      boxShadow: progress > 0 ? 'inset 0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '6px 12px',
                    backgroundColor: '#f4f5f7',
                    color: '#5e6c84',
                    borderRadius: '16px',
                    fontWeight: '600'
                  }}>
                    📅 {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                  </span>
                  {phase.budget && (
                    <span style={{
                      padding: '6px 12px',
                      backgroundColor: '#fff4e6',
                      color: '#d46b08',
                      borderRadius: '16px',
                      fontWeight: '600'
                    }}>
                      💰 ${phase.budget.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Details Modal */}
      {viewingPhase && (
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
          zIndex: 1000,
          padding: '24px'
        }}
        onClick={() => setViewingPhase(null)}
        >
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '32px',
              borderBottom: '1px solid #e1e5e9',
              position: 'sticky',
              top: 0,
              backgroundColor: '#ffffff',
              zIndex: 1
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '700', color: '#172b4d' }}>
                    {viewingPhase.name}
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{
                      ...getStatusColor(viewingPhase.status),
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      border: `1px solid ${getStatusColor(viewingPhase.status).border}`
                    }}>
                      {viewingPhase.status}
                    </span>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: calculateProgress(viewingPhase) === 100 ? '#f6ffed' : '#f4f5f7',
                      color: calculateProgress(viewingPhase) === 100 ? '#389e0d' : '#5e6c84',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      border: `1px solid ${calculateProgress(viewingPhase) === 100 ? '#b7eb8f' : '#dfe1e6'}`
                    }}>
                      {calculateProgress(viewingPhase)}% Complete
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewingPhase(null)}
                  style={{
                    padding: '8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '24px',
                    color: '#5e6c84',
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ padding: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#5e6c84', textTransform: 'uppercase' }}>
                    Start Date
                  </h3>
                  <p style={{ margin: 0, fontSize: '16px', color: '#172b4d', fontWeight: '600' }}>
                    {new Date(viewingPhase.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#5e6c84', textTransform: 'uppercase' }}>
                    End Date
                  </h3>
                  <p style={{ margin: 0, fontSize: '16px', color: '#172b4d', fontWeight: '600' }}>
                    {new Date(viewingPhase.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {viewingPhase.description && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#5e6c84', textTransform: 'uppercase' }}>
                    Description
                  </h3>
                  <p style={{ margin: 0, fontSize: '16px', color: '#172b4d', lineHeight: '1.6' }}>
                    {viewingPhase.description}
                  </p>
                </div>
              )}

              {viewingPhase.budget && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#5e6c84', textTransform: 'uppercase' }}>
                    Budget
                  </h3>
                  <p style={{ margin: 0, fontSize: '24px', color: '#172b4d', fontWeight: '700' }}>
                    ${viewingPhase.budget.toLocaleString()} <span style={{ fontSize: '16px', fontWeight: '400', color: '#5e6c84' }}>USD</span>
                  </p>
                </div>
              )}

              {viewingPhase.milestones && viewingPhase.milestones.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: '#5e6c84', textTransform: 'uppercase' }}>
                    Milestones ({viewingPhase.milestones.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {viewingPhase.milestones.map((milestone, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '16px',
                          backgroundColor: milestone.completed ? '#f6ffed' : '#f4f5f7',
                          borderRadius: '8px',
                          border: `1px solid ${milestone.completed ? '#b7eb8f' : '#e1e5e9'}`,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px'
                        }}
                      >
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: milestone.completed ? '#52c41a' : '#ffffff',
                          border: `2px solid ${milestone.completed ? '#52c41a' : '#d9d9d9'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}>
                          {milestone.completed && (
                            <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            margin: '0 0 4px 0',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#172b4d',
                            textDecoration: milestone.completed ? 'line-through' : 'none'
                          }}>
                            {milestone.name}
                          </h4>
                          {milestone.dueDate && (
                            <p style={{ margin: 0, fontSize: '12px', color: '#5e6c84' }}>
                              Due: {new Date(milestone.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e1e5e9', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                {isProjectOwner && (
                  <>
                    <button
                      onClick={() => {
                        handleEdit(viewingPhase);
                        setViewingPhase(null);
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#0052cc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      Edit Phase
                    </button>
                    <button
                      onClick={() => {
                        setViewingPhase(null);
                        handleDelete(viewingPhase._id);
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#fff1f0',
                        color: '#cf1322',
                        border: '1px solid #ffa39e',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhasesTab;