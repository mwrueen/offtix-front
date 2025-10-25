import React, { useEffect, useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { useAuth } from '../context/AuthContext';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import ProjectForm from './ProjectForm';
import ProjectList from './ProjectList';
import Layout from './Layout';

const Projects = () => {
  const { projects, loading, error, fetchProjects, createProject, updateProject, deleteProject } = useProjects();
  const { state } = useAuth();
  const { selectedCompany } = useCompanyFilter();
  const [showForm, setShowForm] = useState(false);
  
  // Check if user can create projects
  const canCreateProjects = () => {
    // Superadmin can always create projects
    if (state.user?.role === 'superadmin') return true;
    
    // In personal mode, any user can create personal projects
    if (selectedCompany?.id === 'personal') return true;
    
    // In company mode, check company permissions from backend
    if (selectedCompany && selectedCompany.id !== 'personal') {
      // Use the canCreateProjects permission from the backend
      return selectedCompany.canCreateProjects || false;
    }
    
    return false;
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

  const handleDeleteProject = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(id);
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  if (loading) return <Layout><div style={{ textAlign: 'center', padding: '50px' }}>Loading projects...</div></Layout>;
  if (error) return <Layout><div style={{ color: '#ef4444', textAlign: 'center', padding: '50px' }}>Error: {error}</div></Layout>;

  return (
    <Layout>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', color: '#1e293b', fontSize: '24px' }}>My Projects</h2>
          <p style={{ margin: '0 0 8px 0', color: '#64748b' }}>Manage and track your project progress</p>
         
        </div>
        {canCreateProjects() && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {showForm ? '✕ Cancel' : '+ New Project'}
          </button>
        )}

      </div>

      {showForm && (
        <div style={{ marginBottom: '30px' }}>
          <ProjectForm
            onSubmit={handleCreateProject}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {projects.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 40px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📁</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>No projects yet</h3>
          <p style={{ margin: '0 0 20px 0', color: '#64748b' }}>Create your first project to get started!</p>
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Create Project
          </button>
        </div>
      ) : (
        <ProjectList
          projects={projects}
          onUpdate={handleUpdateProject}
          onDelete={handleDeleteProject}
        />
      )}
    </Layout>
  );
};

export default Projects;