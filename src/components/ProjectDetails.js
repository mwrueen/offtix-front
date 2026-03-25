import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { projectAPI, requirementAPI, meetingNoteAPI, sprintAPI, phaseAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import { usePermissions, PERMISSIONS } from '../context/PermissionsContext';
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
import TasksTab from './project/TasksTab';
import ProjectSidebar, { SIDEBAR_EXPANDED_WIDTH } from './project/ProjectSidebar';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { state: authState } = useAuth();
  const companyFilter = useCompanyFilter();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_EXPANDED_WIDTH);

  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'overview';
  const [requirements, setRequirements] = useState([]);
  const [meetingNotes, setMeetingNotes] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [phases, setPhases] = useState([]);

  const handleSidebarWidthChange = useCallback((width) => setSidebarWidth(width), []);

  useEffect(() => { fetchProjectData(); }, [id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const projectRes = await projectAPI.getById(id);
      let usersRes;
      if (projectRes.data.company) usersRes = await userAPI.getCompanyEmployees(projectRes.data.company._id || projectRes.data.company);
      else usersRes = await userAPI.getAll(null);

      setProject(projectRes.data);
      setUsers(usersRes.data);
      await fetchTabData('overview');
    } catch (error) {
      console.error('Project Data Fetch Error', error);
      setError({ type: 'error', message: 'Failed to load project information.' });
    } finally { setLoading(false); }
  };

  const fetchTabData = async (tab) => {
    try {
      const apiMap = { requirements: requirementAPI, meetings: meetingNoteAPI, sprints: sprintAPI, phases: phaseAPI };
      const setterMap = { requirements: setRequirements, meetings: setMeetingNotes, sprints: setSprints, phases: setPhases };
      if (apiMap[tab]) {
        const res = await apiMap[tab].getAll(id);
        setterMap[tab](res.data);
      }
    } catch (e) { console.error(`Data sync error: ${tab}`, e); }
  };

  useEffect(() => { if (project && activeTab !== 'overview') fetchTabData(activeTab); }, [activeTab, project]);

  const isProjectOwner = authState.user && project && (project.owner?._id === authState.user.id || project.owner === authState.user.id || project.owner === authState.user._id || project.owner?._id === authState.user._id);
  const isProjectManager = authState.user && project?.members?.some(m => (m.user?._id === authState.user.id || m.user === authState.user.id) && m.role === 'Project Manager');
  const canEditProject = isProjectOwner || isSuperAdmin || hasPermission(PERMISSIONS.EDIT_PROJECT);
  const canViewAnalytics = isProjectOwner || isSuperAdmin || hasPermission(PERMISSIONS.VIEW_PROJECT_ANALYTICS);

  if (loading) return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading project details...</p>
      </div>
    </Layout>
  );

  if (error || !project) return (
    <Layout>
      <div className="max-w-2xl mx-auto my-20 bg-white rounded-3xl p-12 shadow-sm border border-rose-100 text-center space-y-6">
        <div className="text-7xl opacity-20">🚫</div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Access Denied</h2>
          <p className="text-slate-500">{error?.message || 'The project could not be found or you do not have permission to view it.'}</p>
        </div>
        <button onClick={() => navigate('/projects')} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-md">
          Back to Projects
        </button>
      </div>
    </Layout>
  );

  const projectTabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'team', label: 'Team', icon: '👥' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'analytics', label: 'Analytics', icon: '📈', permission: canViewAnalytics },
    { id: 'files', label: 'Files', icon: '📁' },
    { id: 'requirements', label: 'Requirements', icon: '📝' },
    { id: 'meetings', label: 'Meetings', icon: '🤝' },
    { id: 'phases', label: 'Phases', icon: '🌊' },
    { id: 'sprints', label: 'Sprints', icon: '🏃' },
    { id: 'risks', label: 'Risks', icon: '⚠️' },
    { id: 'dependencies', label: 'Dependencies', icon: '🔗' },
    { id: 'history', label: 'History', icon: '📜' }
  ];

  return (
    <Layout>
      <ProjectSidebar projectId={id} project={project} onWidthChange={handleSidebarWidthChange} />

      <div
        className="transition-all duration-300 ease-in-out min-h-screen pb-20"
        style={{ marginRight: `${sidebarWidth}px` }}
      >
        <div className="space-y-8 max-w-[1600px] mx-auto">
          <Breadcrumb onNavigateToProjects={() => navigate('/projects')} projectTitle={project.title} />

          <ProjectHeader project={project} onNavigateToTasks={() => navigate(`/projects/${id}?tab=tasks`)} isProjectOwner={isProjectOwner} onRefresh={fetchProjectData} />

          {/* Tab Navigation */}
          <div className="sticky top-0 z-[100] flex bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto scrollbar-none gap-1">
            {projectTabs.map((tab) => {
              if (tab.permission === false) return null;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(`/projects/${id}?tab=${tab.id}`)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap relative shrink-0 ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[600px] relative">
            <div className="relative z-10 h-full">
              {activeTab === 'overview' && <ProjectOverview project={project} users={users} isProjectOwner={canEditProject} />}
              {activeTab === 'team' && <TeamTab projectId={id} project={project} users={users} isProjectOwner={isProjectOwner} isProjectManager={isProjectManager} onRefresh={fetchProjectData} />}
              {activeTab === 'chat' && <ChatTab projectId={id} project={project} />}
              {activeTab === 'analytics' && canViewAnalytics && <AnalyticsTab projectId={id} />}
              {activeTab === 'files' && <FilesTab project={project} isProjectOwner={canEditProject} onRefresh={fetchProjectData} />}
              {activeTab === 'requirements' && <RequirementsTab projectId={id} requirements={requirements} setRequirements={setRequirements} users={users} isProjectOwner={canEditProject} onRefresh={() => fetchTabData('requirements')} />}
              {activeTab === 'meetings' && <MeetingNotesTab projectId={id} meetingNotes={meetingNotes} setMeetingNotes={setMeetingNotes} users={users} isProjectOwner={canEditProject} onRefresh={() => fetchTabData('meetings')} />}
              {activeTab === 'phases' && <PhasesTab projectId={id} phases={phases} setPhases={setPhases} users={users} isProjectOwner={canEditProject} onRefresh={() => fetchTabData('phases')} />}
              {activeTab === 'sprints' && <SprintsTab projectId={id} sprints={sprints} setSprints={setSprints} phases={phases} users={users} isProjectOwner={canEditProject} onRefresh={() => fetchTabData('sprints')} />}
              {activeTab === 'risks' && <RisksTab projectId={id} project={project} isProjectOwner={canEditProject} onRefresh={fetchProjectData} />}
              {activeTab === 'dependencies' && <DependenciesTab projectId={id} project={project} isProjectOwner={canEditProject} onRefresh={fetchProjectData} />}
              {activeTab === 'history' && <ProjectHistoryTab projectId={id} project={project} />}
              {activeTab === 'tasks' && <TasksTab projectId={id} project={project} users={users} onRefresh={fetchProjectData} />}
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent opacity-20 pointer-events-none" />
    </Layout>
  );
};

export default ProjectDetails;