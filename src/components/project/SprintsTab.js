import React, { useState } from 'react';
import { sprintAPI } from '../../services/api';

const SprintsTab = ({ projectId, sprints, setSprints, phases, users, isProjectOwner, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [viewingSprint, setViewingSprint] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPhase, setFilterPhase] = useState('all');
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

  // Filter sprints
  const filteredSprints = sprints.filter(sprint => {
    const matchesSearch = sprint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (sprint.description && sprint.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (sprint.goal && sprint.goal.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || sprint.status === filterStatus;
    const matchesPhase = filterPhase === 'all' || sprint.phase?._id === filterPhase;
    return matchesSearch && matchesStatus && matchesPhase;
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
            Sprints
          </h1>
          <p style={{
            margin: 0,
            fontSize: '16px',
            color: '#5e6c84',
            fontWeight: '400'
          }}>
            {filteredSprints.length} of {sprints.length} sprint{sprints.length !== 1 ? 's' : ''}
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
            {showForm ? '✕ Cancel' : '+ Add Sprint'}
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
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '50px' }}>
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
              placeholder="Search sprints..."
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
              <option value="cancelled">Cancelled</option>
            </select>
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
              Phase
            </label>
            <select
              value={filterPhase}
              onChange={(e) => setFilterPhase(e.target.value)}
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
              <option value="all">All Phases</option>
              {phases.map(phase => (
                <option key={phase._id} value={phase._id}>{phase.name}</option>
              ))}
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
              🏃
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#172b4d', letterSpacing: '-0.5px' }}>
                {editingSprint ? 'Edit Sprint' : 'Create New Sprint'}
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#5e6c84', lineHeight: '1.5' }}>
                {editingSprint ? 'Update sprint details and timeline' : 'Define sprint goals and timeline'}
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
                    Sprint Name <span style={{ color: '#cf1322' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="e.g., Sprint 1, Alpha Release Sprint"
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
                    rows="3"
                    placeholder="Brief description of the sprint"
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

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#172b4d',
                    letterSpacing: '0.2px'
                  }}>
                    Sprint Goal
                  </label>
                  <textarea
                    value={formData.goal}
                    onChange={(e) => setFormData({...formData, goal: e.target.value})}
                    rows="2"
                    placeholder="What is the main objective of this sprint?"
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
                    Phase
                  </label>
                  <select
                    value={formData.phase}
                    onChange={(e) => setFormData({...formData, phase: e.target.value})}
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
                    <option value="">📂 No Phase</option>
                    {phases.map(phase => (
                      <option key={phase._id} value={phase._id}>📂 {phase.name}</option>
                    ))}
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
                    <option value="cancelled">❌ Cancelled</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
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
                        padding: '14px 12px',
                        border: '2px solid #e1e5e9',
                        borderRadius: '10px',
                        fontSize: '14px',
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

                  <div>
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
                        padding: '14px 12px',
                        border: '2px solid #e1e5e9',
                        borderRadius: '10px',
                        fontSize: '14px',
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '10px',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#172b4d',
                      letterSpacing: '0.2px'
                    }}>
                      Capacity (hours)
                    </label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                      placeholder="80"
                      min="0"
                      step="1"
                      style={{
                        boxSizing: 'border-box',
                        width: '100%',
                        padding: '14px 12px',
                        border: '2px solid #e1e5e9',
                        borderRadius: '10px',
                        fontSize: '14px',
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

                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '10px',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#172b4d',
                      letterSpacing: '0.2px'
                    }}>
                      Velocity (points)
                    </label>
                    <input
                      type="number"
                      value={formData.velocity}
                      onChange={(e) => setFormData({...formData, velocity: e.target.value})}
                      placeholder="20"
                      min="0"
                      step="1"
                      style={{
                        boxSizing: 'border-box',
                        width: '100%',
                        padding: '14px 12px',
                        border: '2px solid #e1e5e9',
                        borderRadius: '10px',
                        fontSize: '14px',
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
                {editingSprint ? '✓ Update Sprint' : '+ Create Sprint'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sprints List - Only show when form is not visible */}
      {!showForm && (
        <div style={{ display: 'grid', gap: '16px' }}>
        {filteredSprints.length === 0 && sprints.length > 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '64px 24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e1e5e9'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#172b4d' }}>
              No Sprints Found
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#5e6c84' }}>
              Try adjusting your search or filter criteria.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterPhase('all');
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
        ) : sprints.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '64px 24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e1e5e9'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏃</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#172b4d' }}>
              No Sprints Yet
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#5e6c84' }}>
              Create sprints to organize your development cycles and track progress.
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
                Create First Sprint
              </button>
            )}
          </div>
        ) : (
          filteredSprints.map(sprint => {
            const statusColor = getStatusColor(sprint.status);
            const duration = calculateDuration(sprint.startDate, sprint.endDate);

            return (
              <div
                key={sprint._id}
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
                      {sprint.name}
                      <span style={{
                        fontSize: '14px',
                        color: '#5e6c84',
                        fontWeight: '500',
                        marginLeft: '12px'
                      }}>
                        Sprint #{sprint.sprintNumber}
                      </span>
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
                        {sprint.status}
                      </span>
                      {sprint.phase && (
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: '#f4f5f7',
                          color: '#5e6c84',
                          border: '1px solid #dfe1e6'
                        }}>
                          📁 {sprint.phase.name}
                        </span>
                      )}
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: '#e6f7ff',
                        color: '#0052cc',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        📅 {duration} day{duration !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                    <button
                      onClick={() => setViewingSprint(sprint)}
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
                          onClick={() => handleEdit(sprint)}
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
                            e.target.style.backgroundColor = '#0052cc';
                            e.target.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#f4f5f7';
                            e.target.style.color = '#5e6c84';
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(sprint._id)}
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

                {sprint.description && (
                  <p style={{
                    margin: '0 0 16px 0',
                    color: '#5e6c84',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    {sprint.description}
                  </p>
                )}

                {sprint.goal && (
                  <div style={{
                    backgroundColor: '#f4f5f7',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <h5 style={{
                      margin: '0 0 8px 0',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#5e6c84',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Sprint Goal
                    </h5>
                    <p style={{
                      margin: 0,
                      color: '#172b4d',
                      fontSize: '14px',
                      lineHeight: '1.6'
                    }}>
                      {sprint.goal}
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '6px 12px',
                    backgroundColor: '#f4f5f7',
                    color: '#5e6c84',
                    borderRadius: '16px',
                    fontWeight: '600'
                  }}>
                    📅 {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                  </span>
                  {sprint.capacity && (
                    <span style={{
                      padding: '6px 12px',
                      backgroundColor: '#fff4e6',
                      color: '#d46b08',
                      borderRadius: '16px',
                      fontWeight: '600'
                    }}>
                      💪 {sprint.capacity}h capacity
                    </span>
                  )}
                  {sprint.velocity && (
                    <span style={{
                      padding: '6px 12px',
                      backgroundColor: '#f6ffed',
                      color: '#389e0d',
                      borderRadius: '16px',
                      fontWeight: '600'
                    }}>
                      🚀 {sprint.velocity} points
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        </div>
      )}

      {/* Details Modal */}
      {viewingSprint && (
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
        onClick={() => setViewingSprint(null)}
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
                    {viewingSprint.name}
                    <span style={{ fontSize: '16px', color: '#5e6c84', fontWeight: '500', marginLeft: '12px' }}>
                      Sprint #{viewingSprint.sprintNumber}
                    </span>
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{
                      ...getStatusColor(viewingSprint.status),
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      border: `1px solid ${getStatusColor(viewingSprint.status).border}`
                    }}>
                      {viewingSprint.status}
                    </span>
                    {viewingSprint.phase && (
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: '#f4f5f7',
                        color: '#5e6c84',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: '1px solid #dfe1e6'
                      }}>
                        📁 {viewingSprint.phase.name}
                      </span>
                    )}
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: '#e6f7ff',
                      color: '#0052cc',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      📅 {calculateDuration(viewingSprint.startDate, viewingSprint.endDate)} day{calculateDuration(viewingSprint.startDate, viewingSprint.endDate) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewingSprint(null)}
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
                    {new Date(viewingSprint.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#5e6c84', textTransform: 'uppercase' }}>
                    End Date
                  </h3>
                  <p style={{ margin: 0, fontSize: '16px', color: '#172b4d', fontWeight: '600' }}>
                    {new Date(viewingSprint.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {viewingSprint.description && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#5e6c84', textTransform: 'uppercase' }}>
                    Description
                  </h3>
                  <p style={{ margin: 0, fontSize: '16px', color: '#172b4d', lineHeight: '1.6' }}>
                    {viewingSprint.description}
                  </p>
                </div>
              )}

              {viewingSprint.goal && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#5e6c84', textTransform: 'uppercase' }}>
                    Sprint Goal
                  </h3>
                  <div style={{
                    backgroundColor: '#f4f5f7',
                    padding: '20px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    color: '#172b4d',
                    lineHeight: '1.8'
                  }}>
                    {viewingSprint.goal}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {viewingSprint.capacity && (
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#5e6c84', textTransform: 'uppercase' }}>
                      Capacity
                    </h3>
                    <p style={{ margin: 0, fontSize: '24px', color: '#172b4d', fontWeight: '700' }}>
                      {viewingSprint.capacity} <span style={{ fontSize: '16px', fontWeight: '400', color: '#5e6c84' }}>hours</span>
                    </p>
                  </div>
                )}
                {viewingSprint.velocity && (
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#5e6c84', textTransform: 'uppercase' }}>
                      Velocity
                    </h3>
                    <p style={{ margin: 0, fontSize: '24px', color: '#172b4d', fontWeight: '700' }}>
                      {viewingSprint.velocity} <span style={{ fontSize: '16px', fontWeight: '400', color: '#5e6c84' }}>points</span>
                    </p>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e1e5e9', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                {isProjectOwner && (
                  <>
                    <button
                      onClick={() => {
                        handleEdit(viewingSprint);
                        setViewingSprint(null);
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
                      Edit Sprint
                    </button>
                    <button
                      onClick={() => {
                        setViewingSprint(null);
                        handleDelete(viewingSprint._id);
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

export default SprintsTab;