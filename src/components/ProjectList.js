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
      'running': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: '🚀', label: 'Active', ping: true },
      'paused': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: '⏸️', label: 'On Hold', ping: false },
      'cancelled': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', icon: '✕', label: 'Cancelled', ping: false },
      'closed': { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', icon: '✓', label: 'Closed', ping: false },
      'active': { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', icon: '⚡', label: 'Processing', ping: true },
      'completed': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: '✓', label: 'Completed', ping: false }
    };
    return configs[status] || { bg: 'bg-slate-50', text: 'text-slate-400', border: 'border-slate-100', icon: '⏳', label: 'Planned', ping: false };
  };

  const getPriorityColor = (p) => {
    const map = { urgent: 'rose', high: 'amber', medium: 'indigo', low: 'emerald' };
    return map[p?.toLowerCase()] || 'slate';
  };

  return (
    <div className="space-y-12">
      {editingProject && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[1.5rem] shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-lg">✏️</div>
                <h3 className="text-lg font-bold text-slate-900">Edit Project</h3>
              </div>
              <button onClick={() => setEditingProject(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">✕</button>
            </div>
            <div className="p-8">
              <ProjectForm onSubmit={async (d) => { await onUpdate(editingProject._id, d); setEditingProject(null); }} initialData={editingProject} onCancel={() => setEditingProject(null)} />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const status = getStatusConfig(project.status);
          const pColor = getPriorityColor(project.priority);
          return (
            <div
              key={project._id}
              onClick={() => navigate(`/projects/${project._id}`)}
              className="group bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 text-indigo-600 flex items-center justify-center font-bold text-xl shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                      {project.title?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-bold text-slate-900 truncate tracking-tight group-hover:text-indigo-600 transition-colors"> {project.title} </h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5"> #{project._id.slice(-4).toUpperCase()} </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-tight uppercase flex items-center gap-1.5 border ${status.bg} ${status.text} ${status.border}`}>
                    {status.ping && <span className="flex relative w-1 h-1"><span className={`absolute inline-flex w-full h-full rounded-full ${status.text.replace('text-', 'bg-')} opacity-40 animate-ping`}></span><span className={`relative inline-flex rounded-full h-1 w-1 ${status.text.replace('text-', 'bg-')}`}></span></span>}
                    {status.label}
                  </span>
                  <span className={`px-2.5 py-1 bg-white border border-${pColor}-100 text-${pColor}-600 rounded-lg text-[10px] font-bold tracking-tight uppercase flex items-center gap-1.5`}>
                    <div className={`w-1 h-1 rounded-full bg-${pColor}-500`} />
                    {project.priority || 'Normal'}
                  </span>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 mt-auto">
                <div className="flex justify-between items-center h-8">
                  <div className="flex -space-x-2">
                    {[1, 2].map(i => (
                      <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500 shadow-sm">U{i}</div>
                    ))}
                    <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">+1</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {canEditProject(project) && (
                      <button onClick={(e) => { e.stopPropagation(); setEditingProject(project); }} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                    )}
                    {canDeleteProject(project) && (
                      <button onClick={(e) => { e.stopPropagation(); setProjectToDelete(project); }} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Deadline</p>
                    <p className="text-[11px] font-bold text-slate-600 truncate">{project.endDate ? new Date(project.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project._id}`); }} className="text-xs font-black text-indigo-600 hover:text-indigo-700 transition-colors">
                    View Project
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
        message={`Are you sure you want to delete "${projectToDelete?.title}"? All associated tasks and project data will be permanently removed.`}
        confirmButtonText="Delete Project"
      />
    </div>
  );
};

export default ProjectList;