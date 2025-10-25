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
import ProjectHistoryTab from './project/ProjectHistoryTab';
import TeamTab from './project/TeamTab';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const companyFilter = useCompanyFilter();
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
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
  if (!project) return <Layout><div>Project not found</div></Layout>;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'team', label: 'Team', icon: '👥' },
    { id: 'requirements', label: 'Requirements', icon: '📋' },
    { id: 'meetings', label: 'Meeting Notes', icon: '📝' },
    { id: 'phases', label: 'Phases', icon: '🎯' },
    { id: 'sprints', label: 'Sprints', icon: '🏃‍♂️' },
    { id: 'history', label: 'History', icon: '📚' }
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
        border: '1px solid #dfe1e6',
        borderRadius: '3px',
        marginBottom: '24px',
        boxShadow: '0 1px 2px rgba(9, 30, 66, 0.25)'
      }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #dfe1e6',
          padding: '0 16px'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                padding: '12px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #0052cc' : '2px solid transparent',
                color: activeTab === tab.id ? '#0052cc' : '#5e6c84',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{tab.icon}</span>
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