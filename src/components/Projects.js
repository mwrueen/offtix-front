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
      {/* Professional Header with Gradient */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '32px',
        boxShadow: '0 10px 40px rgba(59, 130, 246, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          transform: 'translate(30%, -30%)'
        }}></div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              {/* SVG Folder Icon */}
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              <h2 style={{ margin: 0, color: 'white', fontSize: '28px', fontWeight: '700' }}>
                My Projects
              </h2>
            </div>
            <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.9)', fontSize: '15px' }}>
              Manage and track your project progress
            </p>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '24px', marginTop: '20px' }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                padding: '12px 20px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'white' }}>
                  {projects.length}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', marginTop: '2px' }}>
                  Total Projects
                </div>
              </div>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                padding: '12px 20px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'white' }}>
                  {projects.filter(p => p.status === 'active').length}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', marginTop: '2px' }}>
                  Active
                </div>
              </div>
            </div>
          </div>

          {canCreateProjects() && (
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
                boxShadow: showForm ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.15)',
                backdropFilter: showForm ? 'blur(10px)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!showForm) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!showForm) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }
              }}
            >
              {showForm ? (
                <>
                  {/* SVG X Icon */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Cancel
                </>
              ) : (
                <>
                  {/* SVG Plus Icon */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  New Project
                </>
              )}
            </button>
          )}
        </div>
      </div>

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
    </Layout>
  );
};

export default Projects;