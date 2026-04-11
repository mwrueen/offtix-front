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
          <div className="bg-white p-10 rounded-[2rem] shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl">✏️</div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Modify Project Parameters</h3>
              </div>
              <button onClick={() => setEditingProject(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">✕</button>
            </div>
            <ProjectForm onSubmit={async (d) => { await onUpdate(editingProject._id, d); setEditingProject(null); }} initialData={editingProject} onCancel={() => setEditingProject(null)} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project) => {
          const status = getStatusConfig(project.status);
          const pColor = getPriorityColor(project.priority);
          return (
            <div
              key={project._id}
              onClick={() => navigate(`/projects/${project._id}`)}
              className="group bg-white rounded-3xl border border-slate-200 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col relative"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-5 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 text-indigo-600 flex items-center justify-center font-bold text-2xl shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                      {project.title?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 truncate tracking-tight group-hover:text-indigo-600 transition-colors"> {project.title} </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5"> #{project._id.slice(-6).toUpperCase()} </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 border ${status.bg} ${status.text} ${status.border}`}>
                    {status.ping && <span className="flex relative w-1.5 h-1.5"><span className={`absolute inline-flex w-full h-full rounded-full ${status.text.replace('text-', 'bg-')} opacity-40 animate-ping`}></span><span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${status.text.replace('text-', 'bg-')}`}></span></span>}
                    {status.label}
                  </span>
                  <span className={`px-3 py-1.5 bg-white border border-${pColor}-100 text-${pColor}-600 rounded-xl text-[10px] font-bold tracking-widest uppercase flex items-center gap-2`}>
                    <div className={`w-1.5 h-1.5 rounded-full bg-${pColor}-500`} />
                    {project.priority || 'Normal'}
                  </span>
                </div>
              </div>

              <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 mt-auto">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">U{i}</div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">+2</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEditProject(project) && (
                      <button onClick={(e) => { e.stopPropagation(); setEditingProject(project); }} className="p-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm">✏️</button>
                    )}
                    {canDeleteProject(project) && (
                      <button onClick={(e) => { e.stopPropagation(); setProjectToDelete(project); }} className="p-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:border-rose-400 hover:text-rose-600 transition-all shadow-sm">🗑️</button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-500 pt-4 border-t border-slate-100/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Target Delivery</p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{project.endDate ? new Date(project.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible'}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project._id}`); }} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                    Hub Details
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
        title="Dismantle Project"
        message={`Are you sure you want to delete "${projectToDelete?.title}"? This will permanently remove all associated tasks and organizational data.`}
        itemName={projectToDelete?.title}
        confirmButtonText="Dismantle Project"
      />
    </div>
  );
};

export default ProjectList;