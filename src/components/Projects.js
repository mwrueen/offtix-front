import React, { useEffect, useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useAuth } from '../context/AuthContext';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import { usePermissions, PERMISSIONS } from '../context/PermissionsContext';
import ProjectForm from './ProjectForm';
import ProjectList from './ProjectList';
import Layout from './Layout';
import PageHeader from './PageHeader';
import DeleteConfirmModal from './common/DeleteConfirmModal';

const Projects = () => {
  const { projects, loading, error, fetchProjects, createProject, updateProject, deleteProject } = useProjects();
  const { state } = useAuth();
  const { selectedCompany } = useCompanyFilter();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const [showForm, setShowForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, projectId: null, projectName: '' });

  const canCreateProjects = () => isSuperAdmin || selectedCompany?.id === 'personal' || hasPermission(PERMISSIONS.CREATE_PROJECT);

  useEffect(() => { if (selectedCompany) fetchProjects(); }, [fetchProjects, selectedCompany]);

  const handleCreateProject = async (pd) => { try { await createProject(pd); setShowForm(false); } catch (e) { console.error('Create project error', e); } };
  const handleUpdateProject = async (id, pd) => { try { await updateProject(id, pd); } catch (e) { console.error('Update project error', e); } };
  const handleDeleteProject = (id) => { const p = projects.find(p => p._id === id); setDeleteModal({ isOpen: true, projectId: id, projectName: p?.title || 'this project' }); };
  const confirmDeleteProject = async () => { try { await deleteProject(deleteModal.projectId); setDeleteModal({ isOpen: false, projectId: null, projectName: '' }); } catch (e) { console.error('Delete project error', e); } };

  if (loading) return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading projects...</p>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="max-w-xl mx-auto my-20 bg-rose-50 border border-rose-200 rounded-2xl p-12 text-center space-y-6">
        <div className="text-6xl text-rose-500 opacity-50">⚠️</div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-rose-900 leading-tight">Failed to Load Projects</h3>
          <p className="text-sm text-rose-600 opacity-80">{error}</p>
        </div>
        <button onClick={() => fetchProjects()} className="px-8 py-3 bg-rose-600 text-white rounded-lg font-bold text-sm hover:bg-rose-700 transition-colors shadow-sm">
          Try Again
        </button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        <PageHeader
          title="Project Management"
          subtitle="Manage your projects, track progress, and organize team tasks in one place."
          icon={<div className="w-12 h-12 bg-white text-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-slate-100">📁</div>}
          stats={[
            { label: 'Total Projects', value: projects.length },
            { label: 'Active Projects', value: projects.filter(p => !['closed', 'cancelled'].includes(p.status)).length }
          ]}
          actions={canCreateProjects() && (
            <button
              onClick={() => setShowForm(!showForm)}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-sm flex items-center gap-2 border ${showForm ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50' : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'}`}
            >
              <span>{showForm ? '✕' : '+'}</span>
              <span>{showForm ? 'Cancel' : 'New Project'}</span>
            </button>
          )}
        />

        {showForm && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-in slide-in-from-top-4 duration-300 max-w-4xl">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-600 rounded-full" />
              Project Details
            </h3>
            <ProjectForm onSubmit={handleCreateProject} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {projects.length === 0 && !showForm ? (
          <div className="bg-white p-16 rounded-3xl border-2 border-dashed border-slate-100 text-center shadow-sm">
            <div className="space-y-6">
              <div className="text-8xl grayscale opacity-10 select-none">📁</div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-slate-800 tracking-tight">No Projects Yet</h3>
                <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                  You haven't created any projects in this workspace yet. Start by creating your first project to organize your work.
                </p>
              </div>
              {canCreateProjects() && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-md mt-4"
                >
                  Create Your First Project
                </button>
              )}
            </div>
          </div>
        ) : !showForm && (
          <div className="animate-in fade-in duration-500">
            <ProjectList projects={projects} onUpdate={handleUpdateProject} onDelete={handleDeleteProject} />
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, projectId: null, projectName: '' })}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to permanently delete "${deleteModal.projectName}"? This action cannot be undone and will delete all associated data.`}
        itemName={deleteModal.projectName}
        confirmButtonText="Yes, Delete Project"
      />
    </Layout>
  );
};

export default Projects;