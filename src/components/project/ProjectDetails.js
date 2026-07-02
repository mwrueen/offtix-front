import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { projectAPI, requirementAPI, meetingNoteAPI, sprintAPI, phaseAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { usePermissions, PERMISSIONS } from '../../context/PermissionsContext';
import Layout from '../layout/Layout';
import Breadcrumb from '../project/Breadcrumb';
import ProjectHeader from '../project/ProjectHeader';
import ProjectOverview from '../project/ProjectOverview';
import RequirementsTab from '../project/RequirementsTab';
import MeetingNotesTab from '../project/MeetingNotesTab';
import SprintsTab from '../project/SprintsTab';
import PhasesTab from '../project/PhasesTab';
import RisksTab from '../project/RisksTab';
import DependenciesTab from '../project/DependenciesTab';
import ProjectHistoryTab from '../project/ProjectHistoryTab';
import TeamTab from '../project/TeamTab';
import AnalyticsTab from '../project/AnalyticsTab';
import FilesTab from '../project/FilesTab';
import ChatTab from '../project/ChatTab';
import TasksTab from '../project/TasksTab';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { state: authState } = useAuth();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'overview';
  const [requirements, setRequirements] = useState([]);
  const [meetingNotes, setMeetingNotes] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [phases, setPhases] = useState([]);



  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (project && activeTab !== 'overview') fetchTabData(activeTab); }, [activeTab, project]);

  const isProjectOwner = authState.user && project && (project.owner?._id === authState.user.id || project.owner === authState.user.id || project.owner === authState.user._id || project.owner?._id === authState.user._id);
  const isProjectManager = authState.user && project && (
    (project.projectManager?._id === authState.user.id || project.projectManager === authState.user.id || project.projectManager?._id === authState.user._id || project.projectManager === authState.user._id) ||
    project.members?.some(m => (m.user?._id === authState.user.id || m.user === authState.user.id || m.user?._id === authState.user._id || m.user === authState.user._id) && m.role === 'Project Manager')
  );
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
    { id: 'overview',      label: 'Overview',      icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
    { id: 'tasks',         label: 'Tasks',         icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { id: 'team',          label: 'Team',          icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'chat',          label: 'Chat',          icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    { id: 'analytics',     label: 'Analytics',     icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', permission: canViewAnalytics },
    { id: 'files',         label: 'Files',         icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
    { id: 'requirements',  label: 'Requirements',  icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'meetings',      label: 'Meetings',      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'phases',        label: 'Phases',        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'sprints',       label: 'Sprints',       icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'risks',         label: 'Risks',         icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    { id: 'dependencies',  label: 'Dependencies',  icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
    { id: 'history',       label: 'History',       icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  return (
    <Layout>
      <div className="transition-all duration-300 ease-in-out min-h-screen pb-20">
        <div className="space-y-6 max-w-[1600px] mx-auto px-4 lg:px-6">
          <Breadcrumb onNavigateToProjects={() => navigate('/projects')} projectTitle={project.title} />

          <ProjectHeader project={project} onNavigateToTasks={() => navigate(`/projects/${id}?tab=tasks`)} isProjectOwner={isProjectOwner} onRefresh={fetchProjectData} />

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white/50 backdrop-blur-sm sticky top-0 z-20 px-2">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {projectTabs.slice(0, 7).map((tab) => {
                if (tab.permission === false) return null;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigate(tab.id === 'overview' ? `/projects/${id}` : `/projects/${id}?tab=${tab.id}`)}
                    className={`flex items-center gap-2 px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider transition-all relative shrink-0 ${
                      isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={tab.icon} />
                    </svg>
                    {tab.label}
                    {isActive && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full" />}
                  </button>
                );
              })}
            </div>

            {/* Extra Tabs Dropdown */}
            <div className="relative group ml-4 border-l border-slate-100 pl-4 py-2">
              <button className="flex items-center gap-2 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all">
                <span>More</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 shadow-xl rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2 py-3 overflow-hidden">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4 mb-2">Project Modules</div>
                {projectTabs.slice(7).map((tab) => {
                  if (tab.permission === false) return null;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => navigate(`/projects/${id}?tab=${tab.id}`)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all rounded-xl ${
                        isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={tab.icon} />
                      </svg>
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[600px] overflow-hidden">
            <div className="p-6 lg:p-8 h-full">
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
