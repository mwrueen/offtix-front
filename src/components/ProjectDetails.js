import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import ChatTab from './project/ChatTab';
import ProjectSidebar, { SIDEBAR_EXPANDED_WIDTH } from './project/ProjectSidebar';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { state: authState } = useAuth();
  const companyFilter = useCompanyFilter();
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_EXPANDED_WIDTH);

  // Get active tab from URL query param
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'overview';
  const [requirements, setRequirements] = useState([]);
  const [meetingNotes, setMeetingNotes] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [phases, setPhases] = useState([]);

  const handleSidebarWidthChange = useCallback((width) => {
    setSidebarWidth(width);
  }, []);

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

  // Fetch tab data when tab changes via URL
  useEffect(() => {
    if (project && activeTab !== 'overview') {
      fetchTabData(activeTab);
    }
  }, [activeTab, project]);

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

  return (
    <Layout>
      {/* Collapsible Sidebar */}
      <ProjectSidebar projectId={id} project={project} onWidthChange={handleSidebarWidthChange} />

      {/* Main Content - adjusts for sidebar */}
      <div style={{ marginRight: `${sidebarWidth}px`, transition: 'margin-right 0.3s ease' }}>
        <Breadcrumb
          onNavigateToProjects={() => navigate('/projects')}
          projectTitle={project.title}
        />

        <ProjectHeader
          project={project}
          onNavigateToTasks={() => navigate(`/projects/${id}/tasks`)}
          isProjectOwner={isProjectOwner}
          onRefresh={fetchProjectData}
        />

        {/* Tab Content */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #e5e7eb',
          borderRadius: '16px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          padding: '24px'
        }}>
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

          {activeTab === 'chat' && (
            <ChatTab
              projectId={id}
              project={project}
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