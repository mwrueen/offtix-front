import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, taskAPI, taskStatusAPI, sprintAPI, phaseAPI, userAPI, companyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';
import Breadcrumb from './project/Breadcrumb';
import TaskDetailsSidebar from './project/TaskDetailsSidebar';
import InlineTaskCreator from './project/InlineTaskCreator';
import ListView from './project/views/ListView';
import BoardView from './project/views/BoardView';
import GanttView from './project/views/GanttView';

const Tasks = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const [project, setProject] = useState(null);
  const [company, setCompany] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedSprint, setSelectedSprint] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('');
  const [currentView, setCurrentView] = useState('list');
  const [showInlineCreator, setShowInlineCreator] = useState(false);
  const [error, setError] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, tasksRes, statusesRes, sprintsRes, phasesRes] = await Promise.all([
        projectAPI.getById(id),
        taskAPI.getAll(id),
        taskStatusAPI.getAll(id),
        sprintAPI.getAll(id),
        phaseAPI.getAll(id)
      ]);

      const projectData = projectRes.data;
      setProject(projectData);
      setTasks(tasksRes.data);
      setTaskStatuses(statusesRes.data);
      setSprints(sprintsRes.data);
      setPhases(phasesRes.data);

      // Fetch company data if project has a company
      if (projectData.company) {
        try {
          const companyRes = await companyAPI.getById(projectData.company);
          setCompany(companyRes.data);
        } catch (error) {
          console.error('Error fetching company data:', error);
        }
      }

      // Extract project team members (owner + members)
      const projectTeamMembers = [];

      // Add owner
      if (projectData.owner) {
        projectTeamMembers.push(projectData.owner);
      }

      // Add all members
      if (projectData.members && projectData.members.length > 0) {
        projectData.members.forEach(member => {
          if (member.user) {
            // Avoid duplicates (in case owner is also in members array)
            const exists = projectTeamMembers.find(u => u._id === member.user._id);
            if (!exists) {
              projectTeamMembers.push(member.user);
            }
          }
        });
      }

      setUsers(projectTeamMembers);

      // Update selected task if it exists
      if (selectedTask) {
        const updatedTask = tasksRes.data.find(t => t._id === selectedTask._id);
        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData) => {
    setError(null);
    try {
      const newTaskData = {
        ...taskData,
        sprint: selectedSprint || undefined,
        phase: selectedPhase || undefined
      };

      // Set default status if available and not already set
      if (!newTaskData.status && project?.settings?.defaultTaskStatus) {
        newTaskData.status = project.settings.defaultTaskStatus;
      } else if (!newTaskData.status && taskStatuses.length > 0) {
        // If no default status, use the first status (typically "To Do")
        newTaskData.status = taskStatuses[0]._id;
      }

      // Remove undefined values
      Object.keys(newTaskData).forEach(key => {
        if (newTaskData[key] === undefined) {
          delete newTaskData[key];
        }
      });

      const response = await taskAPI.create(id, newTaskData);
      setShowInlineCreator(false);

      // Automatically select the newly created task
      // The API returns the task directly in response.data
      if (response && response.data) {
        setSelectedTask(response.data);
      }

      // Refresh the task list
      await fetchProjectData();
    } catch (error) {
      console.error('Error creating task:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to create task. Please try again.');
      }
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    setError(null);
    try {
      const response = await taskAPI.update(id, taskId, updates);

      // Update the selected task with the latest data immediately
      // The API returns the updated task directly in response.data
      if (selectedTask && selectedTask._id === taskId && response && response.data) {
        setSelectedTask(response.data);
      }

      // Refresh the task list
      await fetchProjectData();
    } catch (error) {
      console.error('Error updating task:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to update task. Please try again.');
      }
    }
  };

  const handleSelectTask = (task) => {
    setSelectedTask(task);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskAPI.delete(id, taskId);
        if (selectedTask && selectedTask._id === taskId) {
          setSelectedTask(null);
        }
        await fetchProjectData();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleReorderTasks = async (reorderedTasks) => {
    // Optimistically update the UI
    setTasks(reorderedTasks);

    try {
      // Create task order array with new positions
      const taskOrders = reorderedTasks.map((task, index) => ({
        taskId: task._id,
        order: index
      }));

      // Send to backend
      const response = await taskAPI.reorder(id, taskOrders);

      // Update with the response from backend
      if (response && response.data) {
        setTasks(response.data);
      }
    } catch (error) {
      console.error('Error reordering tasks:', error);
      // Revert to original order on error
      await fetchProjectData();
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatusId) => {
    try {
      // Update task status
      await taskAPI.update(id, taskId, { status: newStatusId });

      // Refresh tasks to get updated data
      await fetchProjectData();
    } catch (error) {
      console.error('Error updating task status:', error);
      setError('Failed to update task status. Please try again.');
    }
  };

  // Filter tasks based on selected sprint/phase
  const filteredTasks = tasks.filter(task => {
    if (selectedSprint && task.sprint?._id !== selectedSprint) return false;
    if (selectedPhase && task.phase?._id !== selectedPhase) return false;
    return true;
  });

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (!project) return <Layout><div>Project not found</div></Layout>;

  const isProjectOwner = authState.user && project.owner === authState.user.id;

  return (
    <Layout>
      <Breadcrumb
        onNavigateToProjects={() => navigate('/projects')}
        projectTitle={project.title}
        currentPage="Tasks"
        onNavigateToProject={() => navigate(`/projects/${id}`)}
      />

      {/* Main Container with Sidebar */}
      <div style={{ display: 'flex', gap: '0', height: 'calc(100vh - 200px)' }}>
        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tasks Header */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #dfe1e6',
            borderRadius: '3px 3px 0 0',
            boxShadow: '0 1px 2px rgba(9, 30, 66, 0.25)'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #dfe1e6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#172b4d' }}>
                    {project.title}
                  </h1>

                  {/* View Switcher */}
                  <div style={{ display: 'flex', backgroundColor: '#f4f5f7', borderRadius: '3px', padding: '2px' }}>
                    {[
                      { id: 'list', label: 'List', icon: '☰' },
                      { id: 'board', label: 'Board', icon: '⚏' },
                      { id: 'gantt', label: 'Gantt', icon: '📊' }
                    ].map(view => (
                      <button
                        key={view.id}
                        onClick={() => setCurrentView(view.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: currentView === view.id ? '#ffffff' : 'transparent',
                          color: currentView === view.id ? '#172b4d' : '#5e6c84',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: currentView === view.id ? '0 1px 2px rgba(9, 30, 66, 0.25)' : 'none'
                        }}
                      >
                        <span>{view.icon}</span>
                        {view.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                    PHASE:
                  </label>
                  <select
                    value={selectedPhase}
                    onChange={(e) => setSelectedPhase(e.target.value)}
                    style={{
                      padding: '6px 8px',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      fontSize: '13px',
                      backgroundColor: 'white',
                      minWidth: '150px'
                    }}
                  >
                    <option value="">All Phases</option>
                    {phases.map(phase => (
                      <option key={phase._id} value={phase._id}>{phase.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                    SPRINT:
                  </label>
                  <select
                    value={selectedSprint}
                    onChange={(e) => setSelectedSprint(e.target.value)}
                    style={{
                      padding: '6px 8px',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      fontSize: '13px',
                      backgroundColor: 'white',
                      minWidth: '150px'
                    }}
                  >
                    <option value="">All Sprints</option>
                    {sprints.map(sprint => (
                      <option key={sprint._id} value={sprint._id}>
                        {sprint.name} (Sprint #{sprint.sprintNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ fontSize: '12px', color: '#5e6c84' }}>
                  {filteredTasks.length} {filteredTasks.length === 1 ? 'issue' : 'issues'}
                </div>
              </div>
            </div>
          </div>

          {/* Task List Content */}
          <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f4f5f7' }}>
            {currentView === 'list' && (
              <div style={{ padding: '16px' }}>
                <ListView
                  tasks={filteredTasks}
                  onEditTask={() => {}}
                  onDeleteTask={handleDeleteTask}
                  onAddSubtask={() => {}}
                  selectedTaskId={selectedTask?._id}
                  onSelectTask={handleSelectTask}
                  onReorderTasks={handleReorderTasks}
                />

                {/* Inline Task Creator */}
                {!showInlineCreator ? (
                  <button
                    onClick={() => setShowInlineCreator(true)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      marginTop: '8px',
                      backgroundColor: 'white',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#5e6c84',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>➕</span>
                    Create issue
                  </button>
                ) : (
                  <InlineTaskCreator
                    onCreateTask={handleCreateTask}
                    onCancel={() => setShowInlineCreator(false)}
                    defaultDurationUnit={company?.settings?.timeTracking?.defaultDurationUnit || 'hours'}
                  />
                )}
              </div>
            )}

            {currentView === 'board' && (
              <BoardView
                tasks={filteredTasks}
                taskStatuses={taskStatuses}
                onEditTask={() => {}}
                onDeleteTask={handleDeleteTask}
                onAddSubtask={() => {}}
                onUpdateTaskStatus={handleUpdateTaskStatus}
              />
            )}

            {currentView === 'gantt' && (
              <GanttView
                tasks={filteredTasks}
                onEditTask={() => {}}
                onDeleteTask={handleDeleteTask}
                onAddSubtask={() => {}}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <TaskDetailsSidebar
          selectedTask={selectedTask}
          project={project}
          users={users}
          taskStatuses={taskStatuses}
          sprints={sprints}
          phases={phases}
          onUpdateTask={handleUpdateTask}
          onClose={() => setSelectedTask(null)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>
    </Layout>
  );
};

export default Tasks;