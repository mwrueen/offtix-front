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
      planning: { bg: '#fef3c7', text: '#92400e', icon: '📋', label: 'Planning' },
      active: { bg: '#d1fae5', text: '#065f46', icon: '🚀', label: 'Active' },
      completed: { bg: '#dbeafe', text: '#1e40af', icon: '✅', label: 'Completed' },
      'on-hold': { bg: '#fee2e2', text: '#991b1b', icon: '⏸️', label: 'On Hold' }
    };
    return configs[status] || { bg: '#f3f4f6', text: '#374151', icon: '❓', label: 'Unknown' };
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
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {projects.map((project) => {
          const statusConfig = getStatusConfig(project.status);
          const logo = getProjectLogo(project.title);

          return (
            <div
              key={project._id}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
                height: 'fit-content'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              {/* Card Header with Status */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 20px 16px 20px',
                borderBottom: '1px solid #f3f4f6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: logo.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'white',
                    flexShrink: 0
                  }}>
                    {logo.letter}
                  </div>
                  <h3 style={{
                    margin: 0,
                    color: '#111827',
                    fontSize: '16px',
                    fontWeight: '600',
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {project.title}
                  </h3>
                </div>
                <span style={{
                  backgroundColor: statusConfig.bg,
                  color: statusConfig.text,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  textTransform: 'capitalize',
                  flexShrink: 0,
                  marginLeft: '12px'
                }}>
                  {statusConfig.icon} {statusConfig.label}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{
                padding: '16px 20px 20px 20px',
                display: 'flex',
                gap: '8px'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/projects/${project._id}`;
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    backgroundColor: '#f9fafb',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f3f4f6';
                    e.target.style.borderColor = '#9ca3af';
                    e.target.style.color = '#111827';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.color = '#374151';
                  }}
                >
                  👁️ View
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(project);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#3b82f6';
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(project);
                  }}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#f9fafb',
                    color: '#dc2626',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#fef2f2';
                    e.target.style.borderColor = '#fca5a5';
                    e.target.style.color = '#b91c1c';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.color = '#dc2626';
                  }}
                >
                  🗑️
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