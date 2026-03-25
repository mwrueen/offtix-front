import React, { useState } from 'react';
import ProjectForm from './ProjectForm';
import DeleteConfirmModal from './common/DeleteConfirmModal';
import { usePermissions, PERMISSIONS } from '../context/PermissionsContext';
import { useAuth } from '../context/AuthContext';

const ProjectList = ({ projects, onUpdate, onDelete }) => {
  const { hasPermission, isSuperAdmin } = usePermissions();
  const { state: authState } = useAuth();
  const [editingProject, setEditingProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const canEditProject = (project) => {
    if (isSuperAdmin) return true;
    if (project.owner === authState.user.id || project.owner?._id === authState.user.id) return true;
    return hasPermission(PERMISSIONS.EDIT_PROJECT);
  };

  const canDeleteProject = (project) => {
    if (isSuperAdmin) return true;
    if (project.owner === authState.user.id || project.owner?._id === authState.user.id) return true;
    return hasPermission(PERMISSIONS.DELETE_PROJECT);
  };

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
      'not_started': { bg: '#f3f4f6', text: '#374151', border: '#d1d5db', icon: '⏳', label: 'Not Started' },
      'running': { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0', icon: '🚀', label: 'Running' },
      'paused': { bg: '#fef3c7', text: '#92400e', border: '#fde68a', icon: '⏸️', label: 'Paused' },
      'cancelled': { bg: '#fee2e2', text: '#991b1b', border: '#fecaca', icon: '❌', label: 'Cancelled' },
      'closed': { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe', icon: '✅', label: 'Closed' },
      // Legacy statuses (for backward compatibility)
      'planning': { bg: '#f3f4f6', text: '#374151', border: '#d1d5db', icon: '⏳', label: 'Not Started' },
      'active': { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0', icon: '🚀', label: 'Running' },
      'completed': { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe', icon: '✅', label: 'Closed' },
      'on-hold': { bg: '#fef3c7', text: '#92400e', border: '#fde68a', icon: '⏸️', label: 'Paused' }
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
        <div className="mb-8">
          <ProjectForm
            onSubmit={handleUpdate}
            initialData={editingProject}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-6">
        {projects.map((project) => {
          const statusConfig = getStatusConfig(project.status);
          const priorityConfig = getPriorityConfig(project.priority);
          const logo = getProjectLogo(project.title);

          return (
            <div
              key={project._id}
              className="bg-white rounded-2xl shadow-lg border-2 border-slate-100 transition-all duration-300 cursor-pointer overflow-hidden relative h-fit hover:-translate-y-1 hover:shadow-xl hover:border-slate-300"
            >
              {/* Card Header with Status */}
              <div className="p-6 pb-5 border-b-2 border-slate-50">
                <div className="flex items-start gap-3.5 mb-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${logo.color} 0%, ${logo.color}dd 100%)`,
                      boxShadow: `0 4px 12px ${logo.color}40`
                    }}
                  >
                    {logo.letter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="m-0 mb-1.5 text-slate-900 text-[17px] font-bold leading-snug overflow-hidden text-ellipsis line-clamp-2">
                      {project.title}
                    </h3>
                    <p className="m-0 text-slate-500 text-xs leading-relaxed overflow-hidden text-ellipsis line-clamp-2">
                      {project.description || 'No description provided'}
                    </p>
                  </div>
                </div>

                {/* Status and Priority Badges */}
                <div className="flex gap-2 flex-wrap">
                  <span 
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                    style={{
                      backgroundColor: statusConfig.bg,
                      color: statusConfig.text,
                      border: `1px solid ${statusConfig.border}`
                    }}
                  >
                    {statusConfig.icon} {statusConfig.label}
                  </span>
                  <span 
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                    style={{
                      backgroundColor: priorityConfig.bg,
                      color: priorityConfig.text
                    }}
                  >
                    {priorityConfig.icon} {project.priority?.charAt(0).toUpperCase() + project.priority?.slice(1) || 'Medium'}
                  </span>
                  {project.endDate && (
                    <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5">
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
              <div className="p-5 px-6 pb-6 flex gap-2.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/projects/${project._id}`;
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0 rounded-xl cursor-pointer text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/40"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  View Details
                </button>
                {canEditProject(project) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(project);
                    }}
                    className="px-3.5 py-3 bg-slate-50 text-slate-600 border-2 border-slate-200 rounded-xl cursor-pointer text-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-900"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                )}
                {canDeleteProject(project) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(project);
                    }}
                    className="px-3.5 py-3 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl cursor-pointer text-sm font-semibold flex items-center justify-center transition-all duration-200 hover:bg-red-100 hover:border-red-400 hover:text-red-700"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                )}
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