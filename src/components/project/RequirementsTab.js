import React, { useState } from 'react';
import { requirementAPI } from '../../services/api';

const RequirementsTab = ({ projectId, requirements, setRequirements, users, isProjectOwner, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(null);
  const [viewingRequirement, setViewingRequirement] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterType, setFilterType] = useState('all');
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

  // Filter requirements based on search and filters
  const filteredRequirements = requirements.filter(req => {
    const matchesSearch = req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || req.priority === filterPriority;
    const matchesType = filterType === 'all' || req.type === filterType;
    return matchesSearch && matchesStatus && matchesPriority && matchesType;
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
            Requirements
          </h1>
          <p style={{
            margin: 0,
            fontSize: '16px',
            color: '#5e6c84',
            fontWeight: '400'
          }}>
            {filteredRequirements.length} of {requirements.length} requirement{requirements.length !== 1 ? 's' : ''}
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
            {showForm ? '✕ Cancel' : '+ Add Requirement'}
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
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '50px' }}>
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
              placeholder="Search requirements..."
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
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
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
              Priority
            </label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
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
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
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
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
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
              <option value="all">All Types</option>
              <option value="functional">Functional</option>
              <option value="non-functional">Non-Functional</option>
              <option value="business">Business</option>
              <option value="technical">Technical</option>
              <option value="user-story">User Story</option>
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
              📋
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#172b4d', letterSpacing: '-0.5px' }}>
                {editingRequirement ? 'Edit Requirement' : 'Create New Requirement'}
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#5e6c84', lineHeight: '1.5' }}>
                {editingRequirement ? 'Update requirement details and specifications' : 'Define project requirements and specifications'}
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
                    Requirement Title <span style={{ color: '#cf1322' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    placeholder="Enter a clear, descriptive title"
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
                    Description <span style={{ color: '#cf1322' }}>*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                    rows="5"
                    placeholder="Provide detailed description of the requirement..."
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
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
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
                    <option value="functional">📦 Functional</option>
                    <option value="non-functional">⚙️ Non-Functional</option>
                    <option value="business">💼 Business</option>
                    <option value="technical">🔧 Technical</option>
                    <option value="user-story">👤 User Story</option>
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
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
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
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🟠 High</option>
                    <option value="critical">🔴 Critical</option>
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
                    <option value="draft">📝 Draft</option>
                    <option value="approved">✅ Approved</option>
                    <option value="in-progress">🔄 In Progress</option>
                    <option value="completed">✔️ Completed</option>
                    <option value="rejected">❌ Rejected</option>
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
                    Assigned To
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
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
                    <option value="">👤 Unassigned</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>👤 {user.name}</option>
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
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({...formData, estimatedHours: e.target.value})}
                    placeholder="0"
                    min="0"
                    step="0.5"
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
                {editingRequirement ? '✓ Update Requirement' : '+ Create Requirement'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div style={{
        display: 'grid',
        gap: '16px'
      }}>
        {filteredRequirements.map((requirement) => (
          <div
            key={requirement._id}
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
                  {requirement.title}
                </h3>
                <p style={{
                  margin: '0 0 16px 0',
                  fontSize: '14px',
                  color: '#5e6c84',
                  lineHeight: '1.5'
                }}>
                  {requirement.description}
                </p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    ...getStatusColor(requirement.status),
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    border: `1px solid ${getStatusColor(requirement.status).border}`
                  }}>
                    {requirement.status.replace('-', ' ')}
                  </span>
                  
                  <span style={{
                    ...getPriorityColor(requirement.priority),
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    border: `1px solid ${getPriorityColor(requirement.priority).border}`
                  }}>
                    {requirement.priority} Priority
                  </span>
                  
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: '#f4f5f7',
                    color: '#5e6c84',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {requirement.type.replace('-', ' ')}
                  </span>
                  
                  {requirement.assignedTo && (
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: '#e6f7ff',
                      color: '#0052cc',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      👤 {requirement.assignedTo.name}
                    </span>
                  )}
                  
                  {requirement.estimatedHours && (
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: '#fff4e6',
                      color: '#d46b08',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      ⏱️ {requirement.estimatedHours}h
                    </span>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                <button
                  onClick={() => setViewingRequirement(requirement)}
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
                      onClick={() => handleEdit(requirement)}
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
                      onClick={() => handleDelete(requirement._id)}
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
          </div>
        ))}

        {filteredRequirements.length === 0 && requirements.length > 0 && (
          <div style={{
            textAlign: 'center',
            padding: '64px 24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e1e5e9'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#172b4d' }}>
              No Requirements Found
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#5e6c84' }}>
              Try adjusting your search or filter criteria.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterPriority('all');
                setFilterType('all');
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
        )}

        {requirements.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '64px 24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e1e5e9'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#172b4d' }}>
              No Requirements Yet
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#5e6c84' }}>
              Start by creating your first requirement to define project specifications.
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
                Create First Requirement
              </button>
            )}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {viewingRequirement && (
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
        onClick={() => setViewingRequirement(null)}
        >
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            maxWidth: '800px',
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
                    {viewingRequirement.title}
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{
                      ...getStatusColor(viewingRequirement.status),
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      border: `1px solid ${getStatusColor(viewingRequirement.status).border}`
                    }}>
                      {viewingRequirement.status.replace('-', ' ')}
                    </span>
                    <span style={{
                      ...getPriorityColor(viewingRequirement.priority),
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      border: `1px solid ${getPriorityColor(viewingRequirement.priority).border}`
                    }}>
                      {viewingRequirement.priority} Priority
                    </span>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: '#f4f5f7',
                      color: '#5e6c84',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {viewingRequirement.type.replace('-', ' ')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewingRequirement(null)}
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
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#5e6c84', textTransform: 'uppercase' }}>
                  Description
                </h3>
                <p style={{ margin: 0, fontSize: '16px', color: '#172b4d', lineHeight: '1.6' }}>
                  {viewingRequirement.description}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {viewingRequirement.assignedTo && (
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#5e6c84', textTransform: 'uppercase' }}>
                      Assigned To
                    </h3>
                    <p style={{ margin: 0, fontSize: '16px', color: '#172b4d' }}>
                      👤 {viewingRequirement.assignedTo.name}
                    </p>
                  </div>
                )}
                {viewingRequirement.estimatedHours && (
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#5e6c84', textTransform: 'uppercase' }}>
                      Estimated Hours
                    </h3>
                    <p style={{ margin: 0, fontSize: '16px', color: '#172b4d' }}>
                      ⏱️ {viewingRequirement.estimatedHours} hours
                    </p>
                  </div>
                )}
              </div>

              {viewingRequirement.acceptanceCriteria && viewingRequirement.acceptanceCriteria.length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#5e6c84', textTransform: 'uppercase' }}>
                    Acceptance Criteria
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#172b4d', fontSize: '16px', lineHeight: '1.8' }}>
                    {viewingRequirement.acceptanceCriteria.map((criteria, index) => (
                      <li key={index}>{criteria}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e1e5e9', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                {isProjectOwner && (
                  <>
                    <button
                      onClick={() => {
                        handleEdit(viewingRequirement);
                        setViewingRequirement(null);
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
                      Edit Requirement
                    </button>
                    <button
                      onClick={() => {
                        setViewingRequirement(null);
                        handleDelete(viewingRequirement._id);
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

export default RequirementsTab;