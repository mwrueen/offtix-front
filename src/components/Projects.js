import React, { useEffect, useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import { usePermissions, PERMISSIONS } from '../context/PermissionsContext';
import ProjectForm from './ProjectForm';
import ProjectList from './ProjectList';
import Layout from './Layout';
import PageHeader from './PageHeader';
import DeleteConfirmModal from './common/DeleteConfirmModal';

const Projects = () => {
  const { projects, loading, error, fetchProjects, createProject, updateProject, deleteProject } = useProjects();
  const { selectedCompany, state: companyState } = useCompanyFilter();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const [showForm, setShowForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, projectId: null, projectName: '' });

  const canCreateProjects = () => isSuperAdmin || selectedCompany?.id === 'personal' || hasPermission(PERMISSIONS.CREATE_PROJECT);

  useEffect(() => {
    if (selectedCompany && !companyState.loading) {
      fetchProjects();
    }
  }, [fetchProjects, selectedCompany, companyState.loading]);

  const handleCreateProject = async (pd) => { try { await createProject(pd); setShowForm(false); } catch (e) { console.error('Create project error', e); } };
  const handleUpdateProject = async (id, pd) => { try { await updateProject(id, pd); } catch (e) { console.error('Update project error', e); } };
  const handleDeleteProject = (id) => { const p = projects.find(p => p._id === id); setDeleteModal({ isOpen: true, projectId: id, projectName: p?.title || 'this project' }); };
  const confirmDeleteProject = async () => { try { await deleteProject(deleteModal.projectId); setDeleteModal({ isOpen: false, projectId: null, projectName: '' }); } catch (e) { console.error('Delete project error', e); } };

  if (loading || companyState.loading) return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading projects...</p>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="max-w-xl mx-auto my-20 bg-rose-50 border border-rose-100 rounded-2xl p-12 text-center space-y-6 animate-in fade-in zoom-in-95">
        <div className="text-5xl text-rose-500 opacity-50">⚠️</div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-rose-900 leading-tight tracking-tight">Failed to Load Projects</h3>
          <p className="text-sm text-rose-600 opacity-80 font-medium">{error}</p>
        </div>
        <button onClick={() => fetchProjects()} className="px-8 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-all shadow-md">
          Try Again
        </button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-6 pb-12 animate-in fade-in duration-500">
        <PageHeader
          title="Projects"
          subtitle="Overview of all active and planned projects across your organization."
          icon="📁"
          stats={[
            { label: 'Total', value: projects.length },
            { label: 'Active', value: projects.filter(p => !['closed', 'cancelled'].includes(p.status)).length }
          ]}
          actions={canCreateProjects() && (
            <button
              onClick={() => setShowForm(!showForm)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2 border ${showForm ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50' : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'}`}
            >
              <span>{showForm ? '✕' : '+'}</span>
              <span>{showForm ? 'Cancel' : 'New Project'}</span>
            </button>
          )}
        />

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 animate-in slide-in-from-top-4 duration-300 w-full mx-auto overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl">📁</div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Project Details</h3>
                <p className="text-xs text-slate-500 font-medium tracking-tight">Set up your project workspace and objectives</p>
              </div>
            </div>
            <div className="p-8">
              <ProjectForm onSubmit={handleCreateProject} onCancel={() => setShowForm(false)} />
            </div>
          </div>
        )}

        {projects.length === 0 && !showForm ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No projects yet</h3>
            <p className="text-slate-600 text-sm">
              Create your first project to start tracking tasks and managing team project delivery.
            </p>
          </div>
        ) : !showForm && (
          <div className="animate-in fade-in duration-700">
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