import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, requirementAPI, meetingNoteAPI, sprintAPI, phaseAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import Layout from './Layout';
import Breadcrumb from './project/Breadcrumb';
import ProjectHeader from './project/ProjectHeader';
import ProjectOverview from './project/ProjectOverview';
import RequirementsTab from './project/RequirementsTab';
import MeetingNotesTab from './project/MeetingNotesTab';
import SprintsTab from './project/SprintsTab';
import PhasesTab from './project/PhasesTab';
import RisksTab from './project/RisksTab';
import DependenciesTab from './project/DependenciesTab';
import ProjectHistoryTab from './project/ProjectHistoryTab';
import TeamTab from './project/TeamTab';
import AnalyticsTab from './project/AnalyticsTab';
import FilesTab from './project/FilesTab';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const companyFilter = useCompanyFilter();
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [meetingNotes, setMeetingNotes] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [phases, setPhases] = useState([]);

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      console.log('ProjectDetails Debug - Company Filter:', {
        companyId: companyFilter.companyId,
        isPersonal: companyFilter.isPersonal,
        companyFilter: companyFilter
      });

      // First get the project to determine its company
      const projectRes = await projectAPI.getById(id);
      
      console.log('ProjectDetails Debug - Project Info:', {
        projectId: projectRes.data._id,
        projectTitle: projectRes.data.title,
        projectCompany: projectRes.data.company,
        projectOwner: projectRes.data.owner
      });

      // Determine which company ID to use for filtering users
      let usersRes;
      
      if (projectRes.data.company) {
        // Project has a company - get employees from that specific company
        const projectCompanyId = projectRes.data.company._id || projectRes.data.company;
        console.log('Getting employees from project company:', projectCompanyId);
        usersRes = await userAPI.getCompanyEmployees(projectCompanyId);
      } else if (companyFilter.companyId && companyFilter.companyId !== 'personal') {
        // Project has no company but user has selected a company - get employees from selected company
        console.log('Getting employees from selected company:', companyFilter.companyId);
        usersRes = await userAPI.getCompanyEmployees(companyFilter.companyId);
      } else {
        // No company context - get all users (fallback)
        console.log('No company context - getting all users');
        usersRes = await userAPI.getAll(null);
      }
      
      console.log('ProjectDetails Debug - Users Response:', {
        totalUsers: usersRes.data.length,
        users: usersRes.data.map(u => ({ id: u._id, name: u.name, email: u.email }))
      });

      setProject(projectRes.data);
      setUsers(usersRes.data);
      
      // Fetch additional data based on active tab
      await fetchTabData('overview');
    } catch (error) {
      console.error('Error fetching project data:', error);

      // Check if it's an access denied error (403)
      if (error.response && error.response.status === 403) {
        setError({
          type: 'access_denied',
          message: error.response.data.message || 'You do not have permission to view this project.'
        });
      } else if (error.response && error.response.status === 404) {
        setError({
          type: 'not_found',
          message: 'Project not found.'
        });
      } else {
        // Fallback: if company filtering fails, try to get all users
        try {
          console.log('Fallback: Trying to get all users without company filter');
          const projectRes = await projectAPI.getById(id);
          const usersRes = await userAPI.getAll(null); // Get all users

          setProject(projectRes.data);
          setUsers(usersRes.data);

          console.log('Fallback successful - got', usersRes.data.length, 'users');
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          if (fallbackError.response && fallbackError.response.status === 403) {
            setError({
              type: 'access_denied',
              message: fallbackError.response.data.message || 'You do not have permission to view this project.'
            });
          } else if (fallbackError.response && fallbackError.response.status === 404) {
            setError({
              type: 'not_found',
              message: 'Project not found.'
            });
          } else {
            setError({
              type: 'error',
              message: 'An error occurred while loading the project.'
            });
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTabData = async (tab) => {
    try {
      switch (tab) {
        case 'requirements':
          const reqRes = await requirementAPI.getAll(id);
          setRequirements(reqRes.data);
          break;
        case 'meetings':
          const meetRes = await meetingNoteAPI.getAll(id);
          setMeetingNotes(meetRes.data);
          break;
        case 'sprints':
          const sprintRes = await sprintAPI.getAll(id);
          setSprints(sprintRes.data);
          break;
        case 'phases':
          const phaseRes = await phaseAPI.getAll(id);
          setPhases(phaseRes.data);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${tab} data:`, error);
    }
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    await fetchTabData(tab);
  };

  // More robust project owner check
  const isProjectOwner = authState.user && project && (
    project.owner === authState.user.id || 
    project.owner?._id === authState.user.id ||
    project.owner === authState.user._id ||
    project.owner?._id === authState.user._id
  );

  if (loading) return <Layout><div>Loading...</div></Layout>;

  if (error) {
    return (
      <Layout>
        <div style={{
          padding: '40px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>
            {error.type === 'access_denied' ? '🔒' : '❌'}
          </div>
          <h2 style={{
            marginBottom: '10px',
            color: '#333'
          }}>
            {error.type === 'access_denied' ? 'Access Denied' : error.type === 'not_found' ? 'Project Not Found' : 'Error'}
          </h2>
          <p style={{
            color: '#666',
            marginBottom: '30px',
            lineHeight: '1.6'
          }}>
            {error.message}
          </p>
          <button
            onClick={() => navigate('/projects')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Go to Projects
          </button>
        </div>
      </Layout>
    );
  }

  if (!project) return <Layout><div>Project not found</div></Layout>;

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      )
    },
    {
      id: 'team',
      label: 'Team',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      )
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="20" x2="12" y2="10"></line>
          <line x1="18" y1="20" x2="18" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="16"></line>
        </svg>
      )
    },
    {
      id: 'files',
      label: 'Files',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
          <polyline points="13 2 13 9 20 9"></polyline>
        </svg>
      )
    },
    {
      id: 'requirements',
      label: 'Requirements',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      )
    },
    {
      id: 'meetings',
      label: 'Meeting Notes',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
      )
    },
    {
      id: 'phases',
      label: 'Phases',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      )
    },
    {
      id: 'sprints',
      label: 'Sprints',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      )
    },
    {
      id: 'risks',
      label: 'Risks',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      )
    },
    {
      id: 'dependencies',
      label: 'Dependencies',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
      )
    },
    {
      id: 'history',
      label: 'History',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
      )
    }
  ];

  return (
    <Layout>
      <Breadcrumb 
        onNavigateToProjects={() => navigate('/projects')}
        projectTitle={project.title}
      />
      
      <ProjectHeader 
        project={project}
        onNavigateToTasks={() => navigate(`/projects/${id}/tasks`)}
        isProjectOwner={isProjectOwner}
      />

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #e5e7eb',
        borderRadius: '16px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          borderBottom: '2px solid #f3f4f6',
          padding: '8px 12px',
          gap: '4px',
          background: 'linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                padding: '12px 20px',
                backgroundColor: activeTab === tab.id ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'transparent',
                background: activeTab === tab.id ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'transparent',
                border: 'none',
                borderRadius: '10px',
                color: activeTab === tab.id ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === tab.id ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                transform: activeTab === tab.id ? 'translateY(-1px)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.color = '#1e293b';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#64748b';
                }
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '24px' }}>
          {activeTab === 'overview' && (
            <ProjectOverview 
              project={project} 
              users={users}
              isProjectOwner={isProjectOwner}
            />
          )}
          
          {activeTab === 'team' && (
            <TeamTab
              projectId={id}
              project={project}
              users={users}
              isProjectOwner={isProjectOwner}
              onRefresh={fetchProjectData}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab
              projectId={id}
            />
          )}

          {activeTab === 'files' && (
            <FilesTab
              project={project}
              isProjectOwner={isProjectOwner}
              onRefresh={fetchProjectData}
            />
          )}

          {activeTab === 'requirements' && (
            <RequirementsTab 
              projectId={id}
              requirements={requirements}
              setRequirements={setRequirements}
              users={users}
              isProjectOwner={isProjectOwner}
              onRefresh={() => fetchTabData('requirements')}
            />
          )}
          
          {activeTab === 'meetings' && (
            <MeetingNotesTab 
              projectId={id}
              meetingNotes={meetingNotes}
              setMeetingNotes={setMeetingNotes}
              users={users}
              isProjectOwner={isProjectOwner}
              onRefresh={() => fetchTabData('meetings')}
            />
          )}
          
          {activeTab === 'phases' && (
            <PhasesTab 
              projectId={id}
              phases={phases}
              setPhases={setPhases}
              users={users}
              isProjectOwner={isProjectOwner}
              onRefresh={() => fetchTabData('phases')}
            />
          )}
          
          {activeTab === 'sprints' && (
            <SprintsTab
              projectId={id}
              sprints={sprints}
              setSprints={setSprints}
              phases={phases}
              users={users}
              isProjectOwner={isProjectOwner}
              onRefresh={() => fetchTabData('sprints')}
            />
          )}

          {activeTab === 'risks' && (
            <RisksTab
              projectId={id}
              project={project}
              isProjectOwner={isProjectOwner}
              onRefresh={fetchProjectData}
            />
          )}

          {activeTab === 'dependencies' && (
            <DependenciesTab
              projectId={id}
              project={project}
              isProjectOwner={isProjectOwner}
              onRefresh={fetchProjectData}
            />
          )}

          {activeTab === 'history' && (
            <ProjectHistoryTab
              projectId={id}
              project={project}
            />
          )}


        </div>
      </div>
    </Layout>
  );
};

export default ProjectDetails;