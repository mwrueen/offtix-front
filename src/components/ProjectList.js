import React, { useState } from 'react';
import ProjectForm from './ProjectForm';
import { usePermissions, PERMISSIONS } from '../context/PermissionsContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmModal from './common/DeleteConfirmModal';

const ProjectList = ({ projects, onUpdate, onDelete }) => {
  const { hasPermission, isSuperAdmin } = usePermissions();
  const { state: authState } = useAuth();
  const navigate = useNavigate();
  const [editingProject, setEditingProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const canEditProject = (project) => isSuperAdmin || project.owner?._id === authState.user.id || project.owner === authState.user.id || hasPermission(PERMISSIONS.EDIT_PROJECT);
  const canDeleteProject = (project) => isSuperAdmin || project.owner?._id === authState.user.id || project.owner === authState.user.id || hasPermission(PERMISSIONS.DELETE_PROJECT);

  const getStatusConfig = (status) => {
    const configs = {
      'running': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: '🚀', label: 'Active', ping: true },
      'paused': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: '⏸️', label: 'On Hold', ping: false },
      'cancelled': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', icon: '✕', label: 'Cancelled', ping: false },
      'closed': { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: '✓', label: 'Closed', ping: false },
      'active': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', icon: '⚡', label: 'In Progress', ping: true },
      'completed': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: '✓', label: 'Completed', ping: false }
    };
    return configs[status] || { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-100', icon: '⏳', label: 'Planned', ping: false };
  };

  const getPriorityColor = (p) => {
    const map = { urgent: 'rose', high: 'amber', medium: 'indigo', low: 'emerald' };
    return map[p?.toLowerCase()] || 'slate';
  };

  return (
    <div className="space-y-12 pb-20">
      {editingProject && (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 max-w-4xl mx-auto animate-in zoom-in-95 duration-200">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-600 rounded-full" />
            Edit Project
          </h3>
          <ProjectForm onSubmit={async (d) => { await onUpdate(editingProject._id, d); setEditingProject(null); }} initialData={editingProject} onCancel={() => setEditingProject(null)} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, index) => {
          const status = getStatusConfig(project.status);
          const pColor = getPriorityColor(project.priority);
          return (
            <div
              key={project._id}
              onClick={() => navigate(`/projects/${project._id}`)}
              className="group bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col relative"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shrink-0">
                      {project.title?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-800 truncate transition-colors group-hover:text-indigo-600"> {project.title} </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider"> ID: {project._id.slice(-8).toUpperCase()} </p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {canEditProject(project) && (
                      <button onClick={(e) => { e.stopPropagation(); setEditingProject(project); }} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                        ✏️
                      </button>
                    )}
                    {canDeleteProject(project) && (
                      <button onClick={(e) => { e.stopPropagation(); setProjectToDelete(project); }} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors">
                        🗑
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-2 border ${status.bg} ${status.text} ${status.border}`}>
                    <span>{status.icon}</span>
                    <span>{status.label}</span>
                    {status.ping && <span className="flex relative w-1.5 h-1.5"><span className={`absolute inline-flex w-full h-full rounded-full ${status.text.replace('text-', 'bg-')} opacity-50 animate-ping`}></span><span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${status.text.replace('text-', 'bg-')}`}></span></span>}
                  </span>
                  <span className={`px-3 py-1 bg-white border border-${pColor}-100 text-${pColor}-700 rounded-full text-[11px] font-bold flex items-center gap-2`}>
                    <div className={`w-1.5 h-1.5 rounded-full bg-${pColor}-600`} />
                    <span>{project.priority?.toUpperCase() || 'NORMAL'}</span>
                  </span>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 mt-auto">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Progress</span>
                    <span className="text-sm font-bold text-indigo-600">72%</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000 w-[72%]" />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4 text-slate-500">
                  <span className="text-lg">📅</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Due Date</p>
                    <p className="text-xs font-bold text-slate-700 truncate">{project.endDate ? new Date(project.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project._id}`); }} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[11px] font-bold hover:bg-indigo-700 transition-colors shadow-sm ml-auto">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <DeleteConfirmModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={async () => { await onDelete(projectToDelete._id); setProjectToDelete(null); }}
        title="Delete Project"
        message={`Are you sure you want to delete "${projectToDelete?.title}"? This will permanently remove all associated tasks and data.`}
        itemName={projectToDelete?.title}
        confirmButtonText="Yes, Delete"
      />
    </div>
  );
};

export default ProjectList;