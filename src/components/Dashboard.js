import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import { useNavigate } from 'react-router-dom';
import { projectAPI, taskAPI } from '../services/api';
import apiService from '../services/apiService';
import Layout from './Layout';

const Dashboard = () => {
  const { state } = useAuth();
  const { selectedCompany, companyFilter } = useCompanyFilter();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    activeProjects: 0,
    completedTasks: 0,
    totalTasks: 0,
    pendingTasks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedCompany) {
      fetchDashboardData();
    }
  }, [selectedCompany]);

  const fetchDashboardData = async () => {
    if (!state.token) return;

    setLoading(true);
    try {
      // Use the new API service with company filtering
      const projectsData = await apiService.getProjects(
        state.token,
        companyFilter.companyId
      );
      setProjects(projectsData);

      let totalTasks = 0;
      let completedTasks = 0;
      let pendingTasks = 0;

      // Fetch tasks for each project with company filtering
      for (const project of projectsData) {
        try {
          const tasks = await apiService.getTasks(
            state.token,
            companyFilter.companyId,
            { projectId: project._id }
          );
          totalTasks += tasks.length;
          completedTasks += tasks.filter(task =>
            task.status?.name?.toLowerCase().includes('done') ||
            task.status?.name?.toLowerCase().includes('complete')
          ).length;
          pendingTasks += tasks.filter(task =>
            !task.status?.name?.toLowerCase().includes('done') &&
            !task.status?.name?.toLowerCase().includes('complete')
          ).length;
        } catch (error) {
          console.log(`No tasks for project ${project.name}`);
        }
      }

      setStats({
        activeProjects: projectsData.filter(p => p.status === 'active').length,
        completedTasks,
        totalTasks,
        pendingTasks
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    { title: 'Active Projects', value: stats.activeProjects, icon: '📊', color: '#3b82f6' },
    { title: 'Completed Tasks', value: stats.completedTasks, icon: '✅', color: '#10b981' },
    { title: 'Total Tasks', value: stats.totalTasks, icon: '📋', color: '#8b5cf6' },
    { title: 'Pending Tasks', value: stats.pendingTasks, icon: '⏳', color: '#f59e0b' },
  ];

  const recentProjects = projects.slice(0, 5).map(project => ({
    ...project,
    progress: Math.floor(Math.random() * 100)
  }));

  return (
    <Layout>
      {/* Welcome Section */}
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '28px' }}>
          Welcome back, {state.user?.name}! 👋
        </h2>
        <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '16px' }}>
          Here's what's happening with your projects today.
        </p>

      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {loading ? (
          Array(4).fill(0).map((_, index) => (
            <div key={index} style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                backgroundColor: '#f1f5f9',
                borderRadius: '10px'
              }}></div>
              <div>
                <div style={{ width: '40px', height: '20px', backgroundColor: '#f1f5f9', borderRadius: '4px', marginBottom: '8px' }}></div>
                <div style={{ width: '80px', height: '14px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}></div>
              </div>
            </div>
          ))
        ) : (
          statsData.map((stat, index) => (
            <div key={index} style={{
              backgroundColor: 'white',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                backgroundColor: `${stat.color}15`,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>
                  {stat.title}
                </div>
              </div>
            </div>
          )))}
      </div>

      {/* Admin Stats */}
      {(state.user?.role === 'admin' || state.user?.role === 'superadmin') && (
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>User Management</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            <div style={{
              padding: '15px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>12</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Total Users</div>
            </div>
            <div style={{
              padding: '15px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>8</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Active Users</div>
            </div>
            <div style={{
              padding: '15px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8b5cf6' }}>3</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Admins</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '30px'
      }}>
        {/* Recent Projects */}
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#1e293b' }}>Recent Projects</h3>
            <button
              onClick={() => navigate('/projects')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              View All
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {loading ? (
              Array(3).fill(0).map((_, index) => (
                <div key={index} style={{
                  padding: '15px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ width: '120px', height: '16px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}></div>
                    <div style={{ width: '60px', height: '20px', backgroundColor: '#f1f5f9', borderRadius: '12px' }}></div>
                  </div>
                  <div style={{ width: '100%', backgroundColor: '#f1f5f9', borderRadius: '4px', height: '6px' }}></div>
                </div>
              ))
            ) : recentProjects.length > 0 ? (
              recentProjects.map((project, index) => (
                <div key={project._id || index} style={{
                  padding: '15px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }} onClick={() => navigate(`/projects/${project._id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: '500', color: '#1e293b' }}>{project.title}</span>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: project.status === 'active' ? '#10b98115' :
                        project.status === 'completed' ? '#3b82f615' : '#f59e0b15',
                      color: project.status === 'active' ? '#10b981' :
                        project.status === 'completed' ? '#3b82f6' : '#f59e0b'
                    }}>
                      {project.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                    {project.description}
                  </div>
                  <div style={{ width: '100%', backgroundColor: '#f1f5f9', borderRadius: '4px', height: '6px' }}>
                    <div style={{
                      width: `${project.progress}%`,
                      backgroundColor: '#3b82f6',
                      height: '100%',
                      borderRadius: '4px'
                    }}></div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
                <p>No projects yet. Create your first project to get started!</p>
                <button
                  onClick={() => navigate('/projects')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  Create Project
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / User Management */}
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>
            {(state.user?.role === 'admin' || state.user?.role === 'superadmin') ? 'Admin Actions' : 'Quick Actions'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => navigate('/projects')}
              style={{
                padding: '12px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: '500'
              }}
            >
              📁 Create New Project
            </button>
            {(state.user?.role === 'admin' || state.user?.role === 'superadmin') && (
              <button
                onClick={() => navigate('/users')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: '500'
                }}
              >
                👥 Manage Users
              </button>
            )}
            <button style={{
              padding: '12px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              fontWeight: '500'
            }}>
              ✅ Add Task
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;