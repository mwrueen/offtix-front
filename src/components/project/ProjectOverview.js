import React, { useState } from 'react';
import { projectAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useCompany } from '../../context/CompanyContext';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

const ProjectOverview = ({ project, users, isProjectOwner }) => {
  const { showToast } = useToast();
  const { state: companyState } = useCompany();
  const companyCurrency = companyState?.selectedCompany?.currency || 'USD';

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null, name: '' });

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

  const handleDeleteMilestone = (milestoneId) => {
    const milestone = milestones.find(m => m._id === milestoneId);
    setDeleteModal({
      isOpen: true,
      type: 'milestone',
      id: milestoneId,
      name: milestone?.title || 'this milestone'
    });
  };

  const confirmDeleteMilestone = async () => {
    setLoading(true);
    try {
      await projectAPI.deleteMilestone(project._id, deleteModal.id);
      showToast('Milestone deleted successfully', 'success');
      setDeleteModal({ isOpen: false, type: null, id: null, name: '' });
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

  const handleDeleteRisk = (riskId) => {
    const risk = risks.find(r => r._id === riskId);
    setDeleteModal({
      isOpen: true,
      type: 'risk',
      id: riskId,
      name: risk?.title || 'this risk'
    });
  };

  const confirmDeleteRisk = async () => {
    setLoading(true);
    try {
      await projectAPI.deleteRisk(project._id, deleteModal.id);
      showToast('Risk deleted successfully', 'success');
      setDeleteModal({ isOpen: false, type: null, id: null, name: '' });
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

  const handleDeleteDependency = (dependencyId) => {
    const dep = dependencies.find(d => d._id === dependencyId);
    setDeleteModal({
      isOpen: true,
      type: 'dependency',
      id: dependencyId,
      name: dep?.title || 'this dependency'
    });
  };

  const confirmDeleteDependency = async () => {
    setLoading(true);
    try {
      await projectAPI.deleteDependency(project._id, deleteModal.id);
      showToast('Dependency deleted successfully', 'success');
      setDeleteModal({ isOpen: false, type: null, id: null, name: '' });
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

  const handleRemoveTag = (tag) => {
    setDeleteModal({
      isOpen: true,
      type: 'tag',
      id: tag,
      name: `tag "${tag}"`
    });
  };

  const confirmRemoveTag = async () => {
    setLoading(true);
    try {
      await projectAPI.removeTag(project._id, deleteModal.id);
      showToast('Tag removed successfully', 'success');
      setDeleteModal({ isOpen: false, type: null, id: null, name: '' });
      window.location.reload();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to remove tag', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Dashboard Top Row: Tags & Budget */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Tags Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🏷️</span> Project Tags
            </h3>
            <button
              onClick={() => setShowTagModal(true)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#2563eb',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#eff6ff'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
          {tags.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {tags.map((tag, index) => (
                <span
                  key={index}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f8fafc',
                    color: '#475569',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '600',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ color: '#94a3b8' }}>#</span>{tag}
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
                        color: '#94a3b8',
                        hover: { color: '#ef4444' }
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '14px' }}>No focus tags defined</p>
            </div>
          )}
        </div>

        {/* Budget Tracking Card */}
        {budget.amount > 0 && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            gridColumn: 'span 2'
          }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>💰</span> Financial Overview
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>Usage of Allocated Budget</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: budgetUtilization > 90 ? '#ef4444' : '#10b981' }}>
                    {budgetUtilization}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '14px', backgroundColor: '#f1f5f9', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{
                    width: `${Math.min(100, budgetUtilization)}%`,
                    height: '100%',
                    background: budgetUtilization > 100 ? '#ef4444' : 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
                    borderRadius: '10px',
                    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}></div>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                  {budgetUtilization > 100
                    ? '⚠️ Warning: Project is over budget!'
                    : `You have ${companyCurrency} ${(budget.amount - actualCost.amount).toLocaleString()} remaining.`}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Budget</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>{companyCurrency} {budget.amount.toLocaleString()}</div>
                </div>
                <div style={{ background: budgetUtilization > 100 ? '#fef2f2' : '#f0fdf4', padding: '16px', borderRadius: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: budgetUtilization > 100 ? '#ef4444' : '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Spent</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: budgetUtilization > 100 ? '#ef4444' : '#10b981' }}>{companyCurrency} {actualCost.amount.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Dashboard Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>

        {/* Milestones Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '32px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ background: '#eff6ff', padding: '8px', borderRadius: '12px' }}>🎯</span>
              Key Milestones
            </h3>
            <button
              onClick={() => setShowMilestoneModal(true)}
              style={{
                padding: '8px 16px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add
            </button>
          </div>

          {milestones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '15px', fontWeight: '500' }}>Define your first milestone to track progress</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
              {/* Timeline Line */}
              <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', backgroundColor: '#f1f5f9' }}></div>

              {milestones.map((milestone, index) => {
                const statusColor = getMilestoneStatusColor(milestone.status);
                const isCompleted = milestone.status === 'completed';
                return (
                  <div key={index} style={{ display: 'flex', gap: '20px', position: 'relative' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: isCompleted ? '#10b981' : '#ffffff',
                      border: `2px solid ${isCompleted ? '#10b981' : '#e2e8f0'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                      boxShadow: '0 0 0 4px #ffffff'
                    }}>
                      {isCompleted && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                    <div style={{
                      flex: 1,
                      padding: '20px',
                      backgroundColor: isCompleted ? '#f0fdf4' : '#f8fafc',
                      borderRadius: '16px',
                      border: `1px solid ${isCompleted ? '#dcfce7' : '#e2e8f0'}`,
                      transition: 'all 0.2s'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: isCompleted ? '#166534' : '#1e293b' }}>{milestone.title}</h4>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: statusColor.bg,
                            color: statusColor.text
                          }}>{milestone.status}</span>
                          {isProjectOwner && (
                            <button onClick={() => handleDeleteMilestone(milestone._id)} style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          )}
                        </div>
                      </div>
                      {milestone.description && <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>{milestone.description}</p>}
                      {milestone.dueDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          {new Date(milestone.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Risks & Dependencies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* Risks Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '28px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: '#fef2f2', padding: '6px', borderRadius: '10px' }}>⚠️</span>
              Identified Risks
            </h3>
            {risks.length === 0 ? (
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', padding: '20px', background: '#f8fafc', borderRadius: '16px', textAlign: 'center' }}>No critical risks reported</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {risks.slice(0, 3).map((risk, idx) => {
                  const sev = getRiskSeverityColor(risk.severity);
                  return (
                    <div key={idx} style={{ padding: '16px', background: '#ffffff', borderRadius: '16px', border: `1px solid ${sev.border}`, borderLeftWidth: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>{risk.title}</span>
                        <span style={{ fontSize: '10px', fontWeight: '800', background: sev.bg, color: sev.text, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>{risk.severity}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{risk.mitigation || 'No mitigation plan yet'}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dependencies Card */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '28px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: '#f0fdfa', padding: '6px', borderRadius: '10px' }}>🔗</span>
              Blocked By
            </h3>
            {dependencies.length === 0 ? (
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', padding: '20px', background: '#f8fafc', borderRadius: '16px', textAlign: 'center' }}>No active dependencies</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {dependencies.slice(0, 3).map((dep, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
                    <div style={{ fontSize: '18px' }}>{dep.type === 'external' ? '🌐' : '🏢'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>{dep.title}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{dep.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: null, id: null, name: '' })}
        onConfirm={() => {
          if (deleteModal.type === 'milestone') confirmDeleteMilestone();
          else if (deleteModal.type === 'risk') confirmDeleteRisk();
          else if (deleteModal.type === 'dependency') confirmDeleteDependency();
          else if (deleteModal.type === 'tag') confirmRemoveTag();
        }}
        title={`Delete ${deleteModal.type?.charAt(0).toUpperCase() + deleteModal.type?.slice(1)}`}
        message={`Are you sure you want to delete this ${deleteModal.type}? This action cannot be undone.`}
        itemName={deleteModal.name}
      />
    </div>
  );
};

export default ProjectOverview;

