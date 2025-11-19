import React, { useState } from 'react';
import { projectAPI } from '../../services/api';

const RisksTab = ({ projectId, project, isProjectOwner, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingRisk, setEditingRisk] = useState(null);
  const [viewingRisk, setViewingRisk] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterProbability, setFilterProbability] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium',
    probability: 'medium',
    mitigation: '',
    status: 'identified'
  });

  const risks = project?.risks || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRisk) {
        await projectAPI.updateRisk(projectId, editingRisk._id, formData);
      } else {
        await projectAPI.addRisk(projectId, formData);
      }
      
      await onRefresh();
      resetForm();
    } catch (error) {
      console.error('Error saving risk:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      severity: 'medium',
      probability: 'medium',
      mitigation: '',
      status: 'identified'
    });
    setShowForm(false);
    setEditingRisk(null);
  };

  const handleEdit = (risk) => {
    setFormData({
      title: risk.title || '',
      description: risk.description || '',
      severity: risk.severity || 'medium',
      probability: risk.probability || 'medium',
      mitigation: risk.mitigation || '',
      status: risk.status || 'identified'
    });
    setEditingRisk(risk);
    setShowForm(true);
    setViewingRisk(null);
  };

  const handleDelete = async (riskId) => {
    if (!window.confirm('Are you sure you want to delete this risk?')) return;
    
    try {
      await projectAPI.deleteRisk(projectId, riskId);
      await onRefresh();
    } catch (error) {
      console.error('Error deleting risk:', error);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: { bg: '#e7f5ff', text: '#0c5ba0', border: '#74c0fc' },
      medium: { bg: '#fff3e0', text: '#e65100', border: '#ffb74d' },
      high: { bg: '#ffe0e0', text: '#c62828', border: '#ef5350' },
      critical: { bg: '#fce4ec', text: '#880e4f', border: '#f06292' }
    };
    return colors[severity] || colors.medium;
  };

  const getProbabilityColor = (probability) => {
    const colors = {
      low: { bg: '#e8f5e9', text: '#2e7d32', border: '#81c784' },
      medium: { bg: '#fff3e0', text: '#e65100', border: '#ffb74d' },
      high: { bg: '#ffe0e0', text: '#c62828', border: '#ef5350' }
    };
    return colors[probability] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      identified: { bg: '#fff3e0', text: '#e65100', border: '#ffb74d' },
      monitoring: { bg: '#e0f2f1', text: '#00695c', border: '#4db6ac' },
      mitigated: { bg: '#e8f5e9', text: '#2e7d32', border: '#81c784' },
      occurred: { bg: '#ffe0e0', text: '#c62828', border: '#ef5350' }
    };
    return colors[status] || colors.identified;
  };

  const filteredRisks = risks.filter(risk => {
    const matchesSearch = risk.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         risk.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || risk.severity === filterSeverity;
    const matchesProbability = filterProbability === 'all' || risk.probability === filterProbability;
    const matchesStatus = filterStatus === 'all' || risk.status === filterStatus;
    
    return matchesSearch && matchesSeverity && matchesProbability && matchesStatus;
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
            Risks
          </h1>
          <p style={{
            margin: 0,
            fontSize: '16px',
            color: '#5e6c84',
            fontWeight: '400'
          }}>
            {filteredRisks.length} of {risks.length} risk{risks.length !== 1 ? 's' : ''}
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
            Add Risk
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
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '50px' }}>
          <div>
            <input
              type="text"
              placeholder="🔍 Search risks..."
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
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
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
              <option value="all">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <select
              value={filterProbability}
              onChange={(e) => setFilterProbability(e.target.value)}
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
              <option value="all">All Probabilities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
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
              <option value="identified">Identified</option>
              <option value="monitoring">Monitoring</option>
              <option value="mitigated">Mitigated</option>
              <option value="occurred">Occurred</option>
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
              backgroundColor: '#ffe0e0',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              boxShadow: '0 2px 8px rgba(198, 40, 40, 0.1)'
            }}>
              ⚠️
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#172b4d', letterSpacing: '-0.5px' }}>
                {editingRisk ? 'Edit Risk' : 'Create New Risk'}
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#5e6c84', lineHeight: '1.5' }}>
                {editingRisk ? 'Update risk details and mitigation strategy' : 'Identify and document project risk'}
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
                    Risk Title <span style={{ color: '#cf1322' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    placeholder="e.g., Budget overrun, Resource unavailability"
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
                    placeholder="Describe the risk and its potential impact"
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
                    Mitigation Strategy
                  </label>
                  <textarea
                    value={formData.mitigation}
                    onChange={(e) => setFormData({...formData, mitigation: e.target.value})}
                    rows="3"
                    placeholder="How will this risk be mitigated or managed?"
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
                    Severity
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({...formData, severity: e.target.value})}
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
                    Probability
                  </label>
                  <select
                    value={formData.probability}
                    onChange={(e) => setFormData({...formData, probability: e.target.value})}
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
                    <option value="high">🔴 High</option>
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
                    <option value="identified">🔍 Identified</option>
                    <option value="monitoring">👁️ Monitoring</option>
                    <option value="mitigated">✅ Mitigated</option>
                    <option value="occurred">🚨 Occurred</option>
                  </select>
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
                {editingRisk ? '✓ Update Risk' : '+ Create Risk'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Risks List */}
      {filteredRisks.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px dashed #dfe1e6',
          borderRadius: '16px',
          padding: '80px 40px',
          textAlign: 'center',
          color: '#5e6c84'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>⚠️</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#172b4d' }}>
            {searchTerm || filterSeverity !== 'all' || filterProbability !== 'all' || filterStatus !== 'all'
              ? 'No risks match your filters'
              : 'No risks identified yet'}
          </h3>
          <p style={{ margin: 0, fontSize: '14px' }}>
            {searchTerm || filterSeverity !== 'all' || filterProbability !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Click "Add Risk" to identify and track project risks'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredRisks.map((risk) => {
            const severityColor = getSeverityColor(risk.severity);
            const probabilityColor = getProbabilityColor(risk.probability);
            const statusColor = getStatusColor(risk.status);

            return (
              <div
                key={risk._id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #e1e5e9',
                  borderRadius: '12px',
                  padding: '24px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}
                onClick={() => setViewingRisk(risk)}
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
                      {risk.title}
                    </h3>
                    {risk.description && (
                      <p style={{ margin: 0, fontSize: '14px', color: '#5e6c84', lineHeight: '1.6' }}>
                        {risk.description.length > 150 ? `${risk.description.substring(0, 150)}...` : risk.description}
                      </p>
                    )}
                  </div>

                  {isProjectOwner && (
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(risk)}
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
                        onClick={() => handleDelete(risk._id)}
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

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '6px 14px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '700',
                    backgroundColor: severityColor.bg,
                    color: severityColor.text,
                    border: `1.5px solid ${severityColor.border}`,
                    textTransform: 'capitalize'
                  }}>
                    Severity: {risk.severity}
                  </span>
                  <span style={{
                    padding: '6px 14px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '700',
                    backgroundColor: probabilityColor.bg,
                    color: probabilityColor.text,
                    border: `1.5px solid ${probabilityColor.border}`,
                    textTransform: 'capitalize'
                  }}>
                    Probability: {risk.probability}
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
                    {risk.status}
                  </span>
                </div>

                {risk.mitigation && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px 16px',
                    backgroundColor: '#f4f5f7',
                    borderRadius: '8px',
                    borderLeft: '4px solid #0052cc'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#172b4d', marginBottom: '4px' }}>
                      Mitigation Strategy:
                    </div>
                    <div style={{ fontSize: '13px', color: '#5e6c84', lineHeight: '1.5' }}>
                      {risk.mitigation.length > 100 ? `${risk.mitigation.substring(0, 100)}...` : risk.mitigation}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* View Modal */}
      {viewingRisk && (
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
          onClick={() => setViewingRisk(null)}
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
                    {viewingRisk.title}
                  </h2>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                    <span style={{
                      padding: '6px 14px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '700',
                      backgroundColor: getSeverityColor(viewingRisk.severity).bg,
                      color: getSeverityColor(viewingRisk.severity).text,
                      border: `1.5px solid ${getSeverityColor(viewingRisk.severity).border}`,
                      textTransform: 'capitalize'
                    }}>
                      Severity: {viewingRisk.severity}
                    </span>
                    <span style={{
                      padding: '6px 14px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '700',
                      backgroundColor: getProbabilityColor(viewingRisk.probability).bg,
                      color: getProbabilityColor(viewingRisk.probability).text,
                      border: `1.5px solid ${getProbabilityColor(viewingRisk.probability).border}`,
                      textTransform: 'capitalize'
                    }}>
                      Probability: {viewingRisk.probability}
                    </span>
                    <span style={{
                      padding: '6px 14px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '700',
                      backgroundColor: getStatusColor(viewingRisk.status).bg,
                      color: getStatusColor(viewingRisk.status).text,
                      border: `1.5px solid ${getStatusColor(viewingRisk.status).border}`,
                      textTransform: 'capitalize'
                    }}>
                      {viewingRisk.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewingRisk(null)}
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
              {viewingRisk.description && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#172b4d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Description
                  </h4>
                  <p style={{ margin: 0, fontSize: '15px', color: '#5e6c84', lineHeight: '1.6' }}>
                    {viewingRisk.description}
                  </p>
                </div>
              )}

              {viewingRisk.mitigation && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#172b4d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Mitigation Strategy
                  </h4>
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#f4f5f7',
                    borderRadius: '8px',
                    borderLeft: '4px solid #0052cc'
                  }}>
                    <p style={{ margin: 0, fontSize: '15px', color: '#5e6c84', lineHeight: '1.6' }}>
                      {viewingRisk.mitigation}
                    </p>
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
                    handleEdit(viewingRisk);
                    setViewingRisk(null);
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
                  Edit Risk
                </button>
                <button
                  onClick={() => {
                    setViewingRisk(null);
                    handleDelete(viewingRisk._id);
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
                  Delete Risk
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RisksTab;

