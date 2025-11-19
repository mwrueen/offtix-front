import React, { useState } from 'react';
import ProjectForm from './ProjectForm';
import DeleteConfirmModal from './common/DeleteConfirmModal';

const ProjectList = ({ projects, onUpdate, onDelete }) => {
  const [editingProject, setEditingProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const handleEdit = (project) => {
    setEditingProject(project);
  };

  const handleUpdate = async (projectData) => {
    await onUpdate(editingProject._id, projectData);
    setEditingProject(null);
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
  };

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
  };

  const handleConfirmDelete = async () => {
    if (projectToDelete) {
      await onDelete(projectToDelete._id);
      setProjectToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setProjectToDelete(null);
  };

  const getStatusConfig = (status) => {
    const configs = {
      planning: { bg: '#fef3c7', text: '#92400e', border: '#fde68a', icon: '📋', label: 'Planning' },
      active: { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0', icon: '🚀', label: 'Active' },
      completed: { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe', icon: '✅', label: 'Completed' },
      'on-hold': { bg: '#fee2e2', text: '#991b1b', border: '#fecaca', icon: '⏸️', label: 'On Hold' }
    };
    return configs[status] || { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb', icon: '❓', label: 'Unknown' };
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      low: { bg: '#d1fae5', text: '#065f46', icon: '🟢' },
      medium: { bg: '#fef3c7', text: '#92400e', icon: '🟡' },
      high: { bg: '#fed7aa', text: '#9a3412', icon: '🟠' },
      urgent: { bg: '#fee2e2', text: '#991b1b', icon: '🔴' }
    };
    return configs[priority] || { bg: '#f3f4f6', text: '#374151', icon: '⚪' };
  };

  const getProjectLogo = (projectName) => {
    // Generate a simple logo based on project name
    const firstLetter = projectName?.charAt(0)?.toUpperCase() || 'P';
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
    ];
    const colorIndex = projectName?.length % colors.length || 0;
    return { letter: firstLetter, color: colors[colorIndex] };
  };

  return (
    <div>
      {editingProject && (
        <div style={{ marginBottom: '30px' }}>
          <ProjectForm
            onSubmit={handleUpdate}
            initialData={editingProject}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '24px'
      }}>
        {projects.map((project) => {
          const statusConfig = getStatusConfig(project.status);
          const priorityConfig = getPriorityConfig(project.priority);
          const logo = getProjectLogo(project.title);

          return (
            <div
              key={project._id}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                border: '2px solid #f1f5f9',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
                height: 'fit-content'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.12)';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.borderColor = '#f1f5f9';
              }}
            >
              {/* Card Header with Status */}
              <div style={{
                padding: '24px 24px 20px 24px',
                borderBottom: '2px solid #f8fafc'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${logo.color} 0%, ${logo.color}dd 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: 'white',
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${logo.color}40`
                  }}>
                    {logo.letter}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      margin: '0 0 6px 0',
                      color: '#0f172a',
                      fontSize: '17px',
                      fontWeight: '700',
                      lineHeight: '1.4',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {project.title}
                    </h3>
                    <p style={{
                      margin: 0,
                      color: '#64748b',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {project.description || 'No description provided'}
                    </p>
                  </div>
                </div>

                {/* Status and Priority Badges */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    backgroundColor: statusConfig.bg,
                    color: statusConfig.text,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: `1px solid ${statusConfig.border}`
                  }}>
                    {statusConfig.icon} {statusConfig.label}
                  </span>
                  <span style={{
                    backgroundColor: priorityConfig.bg,
                    color: priorityConfig.text,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {priorityConfig.icon} {project.priority?.charAt(0).toUpperCase() + project.priority?.slice(1) || 'Medium'}
                  </span>
                  {project.endDate && (
                    <span style={{
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                padding: '20px 24px 24px 24px',
                display: 'flex',
                gap: '10px'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/projects/${project._id}`;
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  View Details
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(project);
                  }}
                  style={{
                    padding: '12px 14px',
                    backgroundColor: '#f8fafc',
                    color: '#475569',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#e0f2fe';
                    e.target.style.borderColor = '#0ea5e9';
                    e.target.style.color = '#0c4a6e';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f8fafc';
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.color = '#475569';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(project);
                  }}
                  style={{
                    padding: '12px 14px',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    border: '2px solid #fecaca',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#fee2e2';
                    e.target.style.borderColor = '#f87171';
                    e.target.style.color = '#b91c1c';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#fef2f2';
                    e.target.style.borderColor = '#fecaca';
                    e.target.style.color = '#dc2626';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <DeleteConfirmModal
        isOpen={!!projectToDelete}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message="This action cannot be undone. All project data will be permanently removed."
        itemName={projectToDelete?.title}
        itemDescription={`Status: ${projectToDelete?.status || 'Unknown'}`}
        confirmButtonText="Delete Project"
        icon="🗑️"
      />
    </div>
  );
};

export default ProjectList;