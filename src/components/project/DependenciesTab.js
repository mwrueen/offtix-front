import React, { useState } from 'react';
import { projectAPI } from '../../services/api';

const DependenciesTab = ({ projectId, project, isProjectOwner, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingDependency, setEditingDependency] = useState(null);
  const [viewingDependency, setViewingDependency] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'internal',
    status: 'pending',
    dueDate: ''
  });

  const dependencies = project?.dependencies || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDependency) {
        await projectAPI.updateDependency(projectId, editingDependency._id, formData);
      } else {
        await projectAPI.addDependency(projectId, formData);
      }
      
      await onRefresh();
      resetForm();
    } catch (error) {
      console.error('Error saving dependency:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'internal',
      status: 'pending',
      dueDate: ''
    });
    setShowForm(false);
    setEditingDependency(null);
  };

  const handleEdit = (dependency) => {
    setFormData({
      title: dependency.title || '',
      description: dependency.description || '',
      type: dependency.type || 'internal',
      status: dependency.status || 'pending',
      dueDate: dependency.dueDate ? dependency.dueDate.split('T')[0] : ''
    });
    setEditingDependency(dependency);
    setShowForm(true);
    setViewingDependency(null);
  };

  const handleDelete = async (dependencyId) => {
    if (!window.confirm('Are you sure you want to delete this dependency?')) return;
    
    try {
      await projectAPI.deleteDependency(projectId, dependencyId);
      await onRefresh();
    } catch (error) {
      console.error('Error deleting dependency:', error);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      internal: { bg: '#e3f2fd', text: '#1565c0', border: '#64b5f6' },
      external: { bg: '#f3e5f5', text: '#6a1b9a', border: '#ba68c8' },
      technical: { bg: '#e0f2f1', text: '#00695c', border: '#4db6ac' },
      resource: { bg: '#fff3e0', text: '#e65100', border: '#ffb74d' },
      business: { bg: '#fef3e2', text: '#8b5a00', border: '#f5c563' }
    };
    return colors[type] || colors.internal;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: '#fff3e0', text: '#e65100', border: '#ffb74d' },
      'in-progress': { bg: '#e3f2fd', text: '#1565c0', border: '#64b5f6' },
      blocked: { bg: '#ffe0e0', text: '#c62828', border: '#ef5350' },
      resolved: { bg: '#e8f5e9', text: '#2e7d32', border: '#81c784' }
    };
    return colors[status] || colors.pending;
  };

  const filteredDependencies = dependencies.filter(dep => {
    const matchesSearch = dep.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dep.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || dep.type === filterType;
    const matchesStatus = filterStatus === 'all' || dep.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
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
            Dependencies
          </h1>
          <p style={{
            margin: 0,
            fontSize: '16px',
            color: '#5e6c84',
            fontWeight: '400'
          }}>
            {filteredDependencies.length} of {dependencies.length} dependenc{dependencies.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        {isProjectOwner && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            style={{
              padding: '14px 28px',
              backgroundColor: '#0052cc',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 82, 204, 0.3)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
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
            <span style={{ fontSize: '18px' }}>+</span>
            Add Dependency
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #e1e5e9',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '50px' }}>
          <div>
            <input
              type="text"
              placeholder="🔍 Search dependencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e1e5e9',
                borderRadius: '10px',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0052cc'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>
          
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e1e5e9',
                borderRadius: '10px',
                fontSize: '14px',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="all">All Types</option>
              <option value="internal">Internal</option>
              <option value="external">External</option>
              <option value="technical">Technical</option>
              <option value="resource">Resource</option>
              <option value="business">Business</option>
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e1e5e9',
                borderRadius: '10px',
                fontSize: '14px',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Form */}
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
              backgroundColor: '#e3f2fd',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              boxShadow: '0 2px 8px rgba(21, 101, 192, 0.1)'
            }}>
              🔗
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#172b4d', letterSpacing: '-0.5px' }}>
                {editingDependency ? 'Edit Dependency' : 'Create New Dependency'}
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#5e6c84', lineHeight: '1.5' }}>
                {editingDependency ? 'Update dependency details and status' : 'Track project dependencies and blockers'}
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
                    Dependency Title <span style={{ color: '#cf1322' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    placeholder="e.g., API integration, Third-party service"
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
                    rows="5"
                    placeholder="Describe the dependency and its impact on the project"
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
                    <option value="internal">🏢 Internal</option>
                    <option value="external">🌐 External</option>
                    <option value="technical">⚙️ Technical</option>
                    <option value="resource">📦 Resource</option>
                    <option value="business">💼 Business</option>
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
                    <option value="pending">⏳ Pending</option>
                    <option value="in-progress">🔄 In Progress</option>
                    <option value="blocked">🚫 Blocked</option>
                    <option value="resolved">✅ Resolved</option>
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
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
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
                {editingDependency ? '✓ Update Dependency' : '+ Create Dependency'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dependencies List */}
      {filteredDependencies.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px dashed #dfe1e6',
          borderRadius: '16px',
          padding: '80px 40px',
          textAlign: 'center',
          color: '#5e6c84'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>🔗</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#172b4d' }}>
            {searchTerm || filterType !== 'all' || filterStatus !== 'all'
              ? 'No dependencies match your filters'
              : 'No dependencies tracked yet'}
          </h3>
          <p style={{ margin: 0, fontSize: '14px' }}>
            {searchTerm || filterType !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Click "Add Dependency" to track project dependencies'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredDependencies.map((dependency) => {
            const typeColor = getTypeColor(dependency.type);
            const statusColor = getStatusColor(dependency.status);

            return (
              <div
                key={dependency._id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #e1e5e9',
                  borderRadius: '12px',
                  padding: '24px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}
                onClick={() => setViewingDependency(dependency)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0052cc';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 82, 204, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e1e5e9';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#172b4d' }}>
                      {dependency.title}
                    </h3>
                    {dependency.description && (
                      <p style={{ margin: 0, fontSize: '14px', color: '#5e6c84', lineHeight: '1.6' }}>
                        {dependency.description.length > 150 ? `${dependency.description.substring(0, 150)}...` : dependency.description}
                      </p>
                    )}
                  </div>

                  {isProjectOwner && (
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(dependency)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#f4f5f7',
                          color: '#172b4d',
                          border: '1px solid #dfe1e6',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#0052cc';
                          e.target.style.color = '#ffffff';
                          e.target.style.borderColor = '#0052cc';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#f4f5f7';
                          e.target.style.color = '#172b4d';
                          e.target.style.borderColor = '#dfe1e6';
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(dependency._id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#ffffff',
                          color: '#cf1322',
                          border: '1px solid #ffccc7',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#cf1322';
                          e.target.style.color = '#ffffff';
                          e.target.style.borderColor = '#cf1322';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#ffffff';
                          e.target.style.color = '#cf1322';
                          e.target.style.borderColor = '#ffccc7';
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{
                    padding: '6px 14px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '700',
                    backgroundColor: typeColor.bg,
                    color: typeColor.text,
                    border: `1.5px solid ${typeColor.border}`,
                    textTransform: 'capitalize'
                  }}>
                    {dependency.type}
                  </span>
                  <span style={{
                    padding: '6px 14px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '700',
                    backgroundColor: statusColor.bg,
                    color: statusColor.text,
                    border: `1.5px solid ${statusColor.border}`,
                    textTransform: 'capitalize'
                  }}>
                    {dependency.status}
                  </span>
                  {dependency.dueDate && (
                    <span style={{
                      padding: '6px 14px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: '#f4f5f7',
                      color: '#5e6c84',
                      border: '1.5px solid #dfe1e6'
                    }}>
                      📅 Due: {new Date(dependency.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Modal */}
      {viewingDependency && (
        <div
          style={{
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
            padding: '20px'
          }}
          onClick={() => setViewingDependency(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '32px',
              borderBottom: '2px solid #f4f5f7'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#172b4d' }}>
                    {viewingDependency.title}
                  </h2>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                    <span style={{
                      padding: '6px 14px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '700',
                      backgroundColor: getTypeColor(viewingDependency.type).bg,
                      color: getTypeColor(viewingDependency.type).text,
                      border: `1.5px solid ${getTypeColor(viewingDependency.type).border}`,
                      textTransform: 'capitalize'
                    }}>
                      Type: {viewingDependency.type}
                    </span>
                    <span style={{
                      padding: '6px 14px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '700',
                      backgroundColor: getStatusColor(viewingDependency.status).bg,
                      color: getStatusColor(viewingDependency.status).text,
                      border: `1.5px solid ${getStatusColor(viewingDependency.status).border}`,
                      textTransform: 'capitalize'
                    }}>
                      {viewingDependency.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewingDependency(null)}
                  style={{
                    padding: '8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#5e6c84',
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ padding: '32px' }}>
              {viewingDependency.description && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#172b4d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Description
                  </h4>
                  <p style={{ margin: 0, fontSize: '15px', color: '#5e6c84', lineHeight: '1.6' }}>
                    {viewingDependency.description}
                  </p>
                </div>
              )}

              {viewingDependency.dueDate && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#172b4d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Due Date
                  </h4>
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#f4f5f7',
                    borderRadius: '8px',
                    display: 'inline-block'
                  }}>
                    <span style={{ fontSize: '15px', color: '#172b4d', fontWeight: '600' }}>
                      📅 {new Date(viewingDependency.dueDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {isProjectOwner && (
              <div style={{
                padding: '24px 32px',
                borderTop: '2px solid #f4f5f7',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  onClick={() => {
                    handleEdit(viewingDependency);
                    setViewingDependency(null);
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#0052cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#0747a6'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#0052cc'}
                >
                  Edit Dependency
                </button>
                <button
                  onClick={() => {
                    setViewingDependency(null);
                    handleDelete(viewingDependency._id);
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#ffffff',
                    color: '#cf1322',
                    border: '2px solid #ffccc7',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#cf1322';
                    e.target.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.color = '#cf1322';
                  }}
                >
                  Delete Dependency
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DependenciesTab;

