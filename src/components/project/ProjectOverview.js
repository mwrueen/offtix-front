import React, { useState } from 'react';
import { projectAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ProjectOverview = ({ project, users, isProjectOwner }) => {
  const { showToast } = useToast();
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', dueDate: '' });
  const [riskForm, setRiskForm] = useState({ title: '', description: '', severity: 'medium', probability: 'medium', mitigation: '' });
  const [dependencyForm, setDependencyForm] = useState({ title: '', description: '', type: 'internal', dueDate: '' });
  const [tagInput, setTagInput] = useState('');
  const milestones = project.milestones || [];
  const risks = project.risks || [];
  const dependencies = project.dependencies || [];
  const tags = project.tags || [];
  const budget = project.budget || { amount: 0, currency: 'USD' };
  const actualCost = project.actualCost || { amount: 0, currency: 'USD' };

  const getMilestoneStatusColor = (status) => {
    const colors = {
      'pending': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
      'in-progress': { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
      'completed': { bg: '#dcfce7', text: '#166534', border: '#86efac' },
      'delayed': { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' }
    };
    return colors[status] || colors.pending;
  };

  const getRiskSeverityColor = (severity) => {
    const colors = {
      'low': { bg: '#dcfce7', text: '#166534', border: '#86efac' },
      'medium': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
      'high': { bg: '#fed7aa', text: '#9a3412', border: '#fdba74' },
      'critical': { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' }
    };
    return colors[severity] || colors.medium;
  };

  const getDependencyStatusColor = (status) => {
    const colors = {
      'pending': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
      'in-progress': { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
      'resolved': { bg: '#dcfce7', text: '#166534', border: '#86efac' },
      'blocked': { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' }
    };
    return colors[status] || colors.pending;
  };

  const budgetUtilization = budget.amount > 0 ? Math.round((actualCost.amount / budget.amount) * 100) : 0;

  // Handler functions
  const handleAddMilestone = async () => {
    if (!milestoneForm.title.trim()) {
      showToast('Please enter a milestone title', 'error');
      return;
    }

    setLoading(true);
    try {
      await projectAPI.addMilestone(project._id, milestoneForm);
      showToast('Milestone added successfully', 'success');
      setShowMilestoneModal(false);
      setMilestoneForm({ title: '', description: '', dueDate: '' });
      window.location.reload(); // Refresh to show new data
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to add milestone', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm('Are you sure you want to delete this milestone?')) return;

    setLoading(true);
    try {
      await projectAPI.deleteMilestone(project._id, milestoneId);
      showToast('Milestone deleted successfully', 'success');
      window.location.reload();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to delete milestone', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRisk = async () => {
    if (!riskForm.title.trim()) {
      showToast('Please enter a risk title', 'error');
      return;
    }

    setLoading(true);
    try {
      await projectAPI.addRisk(project._id, riskForm);
      showToast('Risk added successfully', 'success');
      setShowRiskModal(false);
      setRiskForm({ title: '', description: '', severity: 'medium', probability: 'medium', mitigation: '' });
      window.location.reload();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to add risk', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRisk = async (riskId) => {
    if (!window.confirm('Are you sure you want to delete this risk?')) return;

    setLoading(true);
    try {
      await projectAPI.deleteRisk(project._id, riskId);
      showToast('Risk deleted successfully', 'success');
      window.location.reload();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to delete risk', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDependency = async () => {
    if (!dependencyForm.title.trim()) {
      showToast('Please enter a dependency title', 'error');
      return;
    }

    setLoading(true);
    try {
      await projectAPI.addDependency(project._id, dependencyForm);
      showToast('Dependency added successfully', 'success');
      setShowDependencyModal(false);
      setDependencyForm({ title: '', description: '', type: 'internal', dueDate: '' });
      window.location.reload();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to add dependency', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDependency = async (dependencyId) => {
    if (!window.confirm('Are you sure you want to delete this dependency?')) return;

    setLoading(true);
    try {
      await projectAPI.deleteDependency(project._id, dependencyId);
      showToast('Dependency deleted successfully', 'success');
      window.location.reload();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to delete dependency', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!tagInput.trim()) {
      showToast('Please enter a tag', 'error');
      return;
    }

    setLoading(true);
    try {
      await projectAPI.addTags(project._id, [tagInput.trim()]);
      showToast('Tag added successfully', 'success');
      setShowTagModal(false);
      setTagInput('');
      window.location.reload();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to add tag', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tag) => {
    if (!window.confirm(`Are you sure you want to remove the tag "${tag}"?`)) return;

    setLoading(true);
    try {
      await projectAPI.removeTag(project._id, tag);
      showToast('Tag removed successfully', 'success');
      window.location.reload();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to remove tag', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Tags Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
            Tags
          </h3>
          <button
            onClick={() => setShowTagModal(true)}
            style={{
              padding: '6px 12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Tag
          </button>
        </div>
        {tags.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {tags.map((tag, index) => (
              <span
                key={index}
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                #{tag}
                {isProjectOwner && (
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#64748b'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No tags yet. Click "Add Tag" to create one.</p>
        )}
      </div>

      {/* Budget Tracking */}
      {budget.amount > 0 && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #e5e7eb',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            Budget Tracking
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Budget Utilization</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: budgetUtilization > 100 ? '#ef4444' : '#1e293b' }}>
                {budgetUtilization}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '12px',
              backgroundColor: '#e5e7eb',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(100, budgetUtilization)}%`,
                height: '100%',
                background: budgetUtilization > 100
                  ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                  : budgetUtilization > 80
                  ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Total Budget</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                {budget.currency} {budget.amount.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Actual Cost</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: budgetUtilization > 100 ? '#ef4444' : '#1e293b' }}>
                {actualCost.currency} {actualCost.amount.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Remaining</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: (budget.amount - actualCost.amount) < 0 ? '#ef4444' : '#10b981' }}>
                {budget.currency} {(budget.amount - actualCost.amount).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Milestones */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #e5e7eb',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Milestones ({milestones.length})
          </h3>
          <button
            onClick={() => setShowMilestoneModal(true)}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Milestone
          </button>
        </div>
        
        {milestones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <p style={{ margin: 0, fontSize: '14px' }}>No milestones defined yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {milestones.map((milestone, index) => {
              const statusColor = getMilestoneStatusColor(milestone.status);
              return (
                <div
                  key={index}
                  style={{
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#1e293b', flex: 1 }}>
                      {milestone.title}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: statusColor.bg,
                        color: statusColor.text,
                        border: `1px solid ${statusColor.border}`,
                        textTransform: 'capitalize',
                        whiteSpace: 'nowrap'
                      }}>
                        {milestone.status.replace('-', ' ')}
                      </span>
                      {isProjectOwner && (
                        <button
                          onClick={() => handleDeleteMilestone(milestone._id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#ef4444'
                          }}
                          title="Delete milestone"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {milestone.description && (
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b' }}>
                      {milestone.description}
                    </p>
                  )}
                  {milestone.dueDate && (
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      <strong>Due:</strong> {new Date(milestone.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Risks */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #e5e7eb',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          Risks ({risks.length})
        </h3>
        
        {risks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <p style={{ margin: 0, fontSize: '14px' }}>No risks identified</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {risks.map((risk, index) => {
              const severityColor = getRiskSeverityColor(risk.severity);
              return (
                <div
                  key={index}
                  style={{
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                      {risk.title}
                    </h4>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: severityColor.bg,
                      color: severityColor.text,
                      border: `1px solid ${severityColor.border}`,
                      textTransform: 'capitalize',
                      whiteSpace: 'nowrap'
                    }}>
                      {risk.severity}
                    </span>
                  </div>
                  {risk.description && (
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b' }}>
                      {risk.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#64748b' }}>
                    <div><strong>Probability:</strong> {risk.probability}</div>
                    <div><strong>Status:</strong> {risk.status}</div>
                  </div>
                  {risk.mitigation && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#ffffff', borderRadius: '6px', fontSize: '12px', color: '#64748b' }}>
                      <strong>Mitigation:</strong> {risk.mitigation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dependencies */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #e5e7eb',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          Dependencies ({dependencies.length})
        </h3>
        
        {dependencies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}>
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            <p style={{ margin: 0, fontSize: '14px' }}>No dependencies tracked</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {dependencies.map((dependency, index) => {
              const statusColor = getDependencyStatusColor(dependency.status);
              return (
                <div
                  key={index}
                  style={{
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                      {dependency.title}
                    </h4>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: statusColor.bg,
                      color: statusColor.text,
                      border: `1px solid ${statusColor.border}`,
                      textTransform: 'capitalize',
                      whiteSpace: 'nowrap'
                    }}>
                      {dependency.status.replace('-', ' ')}
                    </span>
                  </div>
                  {dependency.description && (
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#64748b' }}>
                      {dependency.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#64748b' }}>
                    <div><strong>Type:</strong> {dependency.type}</div>
                    {dependency.dueDate && (
                      <div><strong>Due:</strong> {new Date(dependency.dueDate).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Milestone Modal */}
      {showMilestoneModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
              Add Milestone
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#475569' }}>
                Title *
              </label>
              <input
                type="text"
                value={milestoneForm.title}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter milestone title"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#475569' }}>
                Description
              </label>
              <textarea
                value={milestoneForm.description}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  minHeight: '80px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
                placeholder="Enter milestone description"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#475569' }}>
                Due Date
              </label>
              <input
                type="date"
                value={milestoneForm.dueDate}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowMilestoneModal(false);
                  setMilestoneForm({ title: '', description: '', dueDate: '' });
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddMilestone}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Adding...' : 'Add Milestone'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {showTagModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
              Add Tag
            </h2>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#475569' }}>
                Tag Name *
              </label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter tag name"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowTagModal(false);
                  setTagInput('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddTag}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Adding...' : 'Add Tag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectOverview;

