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

  // Check if user can create projects using unified permissions
  const canCreateProjects = () => {
    if (isSuperAdmin) return true;
    if (selectedCompany?.id === 'personal') return true;

    // Check company-level role permission
    return hasPermission(PERMISSIONS.CREATE_PROJECT);
  };

  useEffect(() => {
    if (selectedCompany) {
      fetchProjects();
    }
  }, [fetchProjects, selectedCompany]);

  const handleCreateProject = async (projectData) => {
    try {
      await createProject(projectData);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleUpdateProject = async (id, projectData) => {
    try {
      await updateProject(id, projectData);
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const handleDeleteProject = (id) => {
    const project = projects.find(p => p._id === id);
    setDeleteModal({
      isOpen: true,
      projectId: id,
      projectName: project?.title || 'this project'
    });
  };

  const confirmDeleteProject = async () => {
    try {
      await deleteProject(deleteModal.projectId);
      setDeleteModal({ isOpen: false, projectId: null, projectName: '' });
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  if (loading) return <Layout><div style={{ textAlign: 'center', padding: '50px' }}>Loading projects...</div></Layout>;
  if (error) return <Layout><div style={{ color: '#ef4444', textAlign: 'center', padding: '50px' }}>Error: {error}</div></Layout>;


  return (
    <Layout>
      <PageHeader
        title="My Projects"
        subtitle="Manage and track your project progress"
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
        }
        stats={[
          { label: 'Total Projects', value: projects.length },
          { label: 'Active', value: projects.filter(p => p.status === 'active').length }
        ]}
        actions={
          canCreateProjects() && (
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                padding: '14px 28px',
                background: showForm ? 'rgba(255, 255, 255, 0.2)' : 'white',
                color: showForm ? 'white' : '#3b82f6',
                border: showForm ? '2px solid rgba(255, 255, 255, 0.3)' : 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.2s',
                boxShadow: showForm ? 'none' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                backdropFilter: showForm ? 'blur(10px)' : 'none'
              }}
            >
              {showForm ? 'Cancel' : 'New Project'}
            </button>
          )
        }
      />

      {showForm && (
        <div style={{ marginBottom: '32px' }}>
          <ProjectForm
            onSubmit={handleCreateProject}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {projects.length === 0 && !showForm ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 40px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '2px dashed #e5e7eb'
        }}>
          {/* SVG Empty State Icon */}
          <div style={{ marginBottom: '24px' }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h3 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '20px', fontWeight: '600' }}>
            No projects yet
          </h3>
          <p style={{ margin: '0 0 28px 0', color: '#64748b', fontSize: '15px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
            Create your first project to start organizing your work and tracking progress
          </p>
          {canCreateProjects() && (
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '15px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create Your First Project
            </button>
          )}
        </div>
      ) : !showForm && (
        <ProjectList
          projects={projects}
          onUpdate={handleUpdateProject}
          onDelete={handleDeleteProject}
        />
      )}

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, projectId: null, projectName: '' })}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone and all associated data will be permanently removed."
        itemName={deleteModal.projectName}
      />
    </Layout>
  );
};

export default Projects;