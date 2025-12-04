import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, taskAPI, taskStatusAPI, sprintAPI, phaseAPI, userAPI, companyAPI, leaveAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';
import Breadcrumb from './project/Breadcrumb';
import TaskDetailModal from './project/TaskDetailModal';
import InlineTaskCreator from './project/InlineTaskCreator';
import ListView from './project/views/ListView';
import BoardView from './project/views/BoardView';
import GanttView from './project/views/GanttView';
import ProjectSidebar, { SIDEBAR_EXPANDED_WIDTH } from './project/ProjectSidebar';
import { autoScheduleAllTasks } from '../utils/ganttScheduler';

const Tasks = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const [project, setProject] = useState(null);
  const [company, setCompany] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_EXPANDED_WIDTH);

  const handleSidebarWidthChange = useCallback((width) => {
    setSidebarWidth(width);
  }, []);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [phases, setPhases] = useState([]);
  const [employeeLeaves, setEmployeeLeaves] = useState([]);
  const [taskCosts, setTaskCosts] = useState({}); // Map of task._id -> cost
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedSprint, setSelectedSprint] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('');
  const [currentView, setCurrentView] = useState('list');
  const [showInlineCreator, setShowInlineCreator] = useState(false);
  const [error, setError] = useState(null);

  // New filter states
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Auto-schedule states
  const [showAutoScheduleModal, setShowAutoScheduleModal] = useState(false);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  const [schedulingMode, setSchedulingMode] = useState('sequential');
  const [maxParallelTasks, setMaxParallelTasks] = useState(3);
  const [scheduleStartFrom, setScheduleStartFrom] = useState('project'); // 'project' or 'today'
  const [scheduleResult, setScheduleResult] = useState(null); // { success: bool, count: number, mode: string }

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

      // Fetch task costs
      try {
        const costsRes = await projectAPI.getCosts(id);
        if (costsRes.data && costsRes.data.tasks) {
          const costsMap = {};
          costsRes.data.tasks.forEach(t => {
            costsMap[t._id] = t.totalCost;
          });
          setTaskCosts(costsMap);
        }
      } catch (costError) {
        console.error('Error fetching task costs:', costError);
        setTaskCosts({});
      }

      // Fetch company data if project has a company
      if (projectData.company) {
        try {
          // Extract company ID - it might be an object or a string
          const companyId = typeof projectData.company === 'object'
            ? projectData.company._id
            : projectData.company;
          const companyRes = await companyAPI.getById(companyId);
          setCompany(companyRes.data);

          // Fetch employee leaves for auto-scheduling
          try {
            const leavesRes = await leaveAPI.getAll(companyId, { status: 'approved' });
            setEmployeeLeaves(leavesRes.data.leaves || []);
          } catch (leaveError) {
            console.error('Error fetching employee leaves:', leaveError);
            setEmployeeLeaves([]);
          }
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

      // Check if it's an access denied error (403)
      if (error.response && error.response.status === 403) {
        setError({
          type: 'access_denied',
          message: error.response.data.message || 'You do not have permission to view tasks for this project.'
        });
      } else if (error.response && error.response.status === 404) {
        setError({
          type: 'not_found',
          message: 'Project not found.'
        });
      } else {
        setError({
          type: 'error',
          message: 'An error occurred while loading the project data.'
        });
      }
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

  // Auto-schedule handler
  const handleAutoSchedule = async () => {
    // Determine start date based on user selection
    const startDate = scheduleStartFrom === 'today'
      ? new Date().toISOString()
      : project?.startDate;

    if (!startDate) {
      setScheduleResult({ success: false, error: 'Please set a project start date first' });
      setShowAutoScheduleModal(false);
      return;
    }

    // Filter tasks with duration (only these can be scheduled)
    const tasksWithDuration = tasks.filter(t => t.duration?.value);
    const tasksNoDuration = tasks.filter(t => !t.duration?.value);

    if (tasksWithDuration.length === 0) {
      setScheduleResult({
        success: false,
        error: `No tasks have duration set. Please add duration to tasks first.`
      });
      setShowAutoScheduleModal(false);
      return;
    }

    setIsAutoScheduling(true);

    try {
      // Get settings from company or project
      const settings = {
        workingDays: company?.settings?.workingDays || project?.settings?.workingDays || [1, 2, 3, 4, 5],
        holidays: company?.settings?.holidays || project?.settings?.holidays || [],
        timeTracking: company?.settings?.timeTracking || project?.settings?.timeTracking || {
          hoursPerDay: 8,
          daysPerWeek: 5,
          defaultDurationUnit: 'hours'
        }
      };

      // Auto-schedule all tasks with duration (reschedule everything)
      const scheduledTasks = autoScheduleAllTasks(
        tasksWithDuration,
        startDate,
        settings,
        employeeLeaves,
        {
          mode: schedulingMode,
          maxParallel: maxParallelTasks,
          forceReschedule: true // Always reschedule
        }
      );

      // Update each task with calculated dates
      for (const scheduledTask of scheduledTasks) {
        await handleUpdateTask(scheduledTask.taskId, {
          startDate: scheduledTask.startDate,
          dueDate: scheduledTask.dueDate
        });
      }

      setShowAutoScheduleModal(false);
      setScheduleResult({
        success: true,
        count: scheduledTasks.length,
        noDuration: tasksNoDuration.length,
        mode: schedulingMode,
        maxParallel: maxParallelTasks,
        startedFrom: scheduleStartFrom,
        projectName: project.title
      });
    } catch (error) {
      console.error('Error auto-scheduling tasks:', error);
      setShowAutoScheduleModal(false);
      setScheduleResult({ success: false, error: 'Failed to auto-schedule tasks. Please try again.' });
    } finally {
      setIsAutoScheduling(false);
    }
  };

  // Filter tasks based on all filters
  const filteredTasks = tasks.filter(task => {
    // Sprint filter
    if (selectedSprint && task.sprint?._id !== selectedSprint) return false;
    // Phase filter
    if (selectedPhase && task.phase?._id !== selectedPhase) return false;
    // Assignee filter
    if (selectedAssignee) {
      const hasAssignee = task.assignees?.some(a => a._id === selectedAssignee);
      if (!hasAssignee) return false;
    }
    // Priority filter
    if (selectedPriority && task.priority !== selectedPriority) return false;
    // Status filter
    if (selectedStatus && task.status?._id !== selectedStatus) return false;
    // Due date range filter
    if (dueDateFrom || dueDateTo) {
      const taskDueDate = task.dueDate ? new Date(task.dueDate) : null;
      if (!taskDueDate) return false;
      if (dueDateFrom && taskDueDate < new Date(dueDateFrom)) return false;
      if (dueDateTo && taskDueDate > new Date(dueDateTo + 'T23:59:59')) return false;
    }
    return true;
  });

  // Count active filters
  const activeFilterCount = [selectedAssignee, selectedPriority, selectedStatus, dueDateFrom, dueDateTo].filter(Boolean).length;

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedAssignee('');
    setSelectedPriority('');
    setSelectedStatus('');
    setDueDateFrom('');
    setDueDateTo('');
    setSelectedSprint('');
    setSelectedPhase('');
  };

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

  const isProjectOwner = authState.user && project.owner === authState.user.id;

  return (
    <Layout>
      {/* Collapsible Sidebar */}
      <ProjectSidebar projectId={id} project={project} onWidthChange={handleSidebarWidthChange} />

      {/* Main Content - adjusts for sidebar */}
      <div style={{ marginRight: `${sidebarWidth}px`, transition: 'margin-right 0.3s ease' }}>
        <Breadcrumb
          onNavigateToProjects={() => navigate('/projects')}
          projectTitle={project.title}
          currentPage="Tasks"
          onNavigateToProject={() => navigate(`/projects/${id}`)}
        />

        {/* Main Container */}
        <div style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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

              {/* Filter Bar */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Filter Toggle Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', backgroundColor: showFilters ? '#deebff' : 'white',
                    border: '1px solid #dfe1e6', borderRadius: '3px', fontSize: '13px',
                    cursor: 'pointer', color: '#172b4d', fontWeight: '500'
                  }}
                >
                  🔍 Filters
                  {activeFilterCount > 0 && (
                    <span style={{
                      backgroundColor: '#0052cc', color: 'white', borderRadius: '10px',
                      padding: '2px 6px', fontSize: '11px', fontWeight: '600'
                    }}>{activeFilterCount}</span>
                  )}
                </button>

                {/* Quick Filters - Always visible */}
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{ padding: '6px 8px', border: '1px solid #dfe1e6', borderRadius: '3px', fontSize: '13px', backgroundColor: selectedStatus ? '#e6f0ff' : 'white', minWidth: '120px' }}>
                  <option value="">All Status</option>
                  {taskStatuses.map(status => (<option key={status._id} value={status._id}>{status.name}</option>))}
                </select>

                <select value={selectedAssignee} onChange={(e) => setSelectedAssignee(e.target.value)}
                  style={{ padding: '6px 8px', border: '1px solid #dfe1e6', borderRadius: '3px', fontSize: '13px', backgroundColor: selectedAssignee ? '#e6f0ff' : 'white', minWidth: '130px' }}>
                  <option value="">All Assignees</option>
                  {users.map(user => (<option key={user._id} value={user._id}>{user.name}</option>))}
                </select>

                <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}
                  style={{ padding: '6px 8px', border: '1px solid #dfe1e6', borderRadius: '3px', fontSize: '13px', backgroundColor: selectedPriority ? '#e6f0ff' : 'white', minWidth: '110px' }}>
                  <option value="">All Priority</option>
                  <option value="urgent">⬆️ Urgent</option>
                  <option value="high">⬆ High</option>
                  <option value="medium">➡ Medium</option>
                  <option value="low">⬇ Low</option>
                </select>

                <div style={{ flex: 1 }} />

                {/* Auto-Schedule Button */}
                <button
                  onClick={() => setShowAutoScheduleModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', backgroundColor: '#0052cc',
                    border: 'none', borderRadius: '3px', fontSize: '13px',
                    cursor: 'pointer', color: 'white', fontWeight: '500'
                  }}
                  title="Auto-schedule tasks based on priority and duration"
                >
                  ⚡ Auto-Schedule
                </button>

                <div style={{ fontSize: '12px', color: '#5e6c84', fontWeight: '500' }}>
                  {filteredTasks.length} {filteredTasks.length === 1 ? 'issue' : 'issues'}
                </div>
              </div>

              {/* Extended Filters Panel */}
              {showFilters && (
                <div style={{
                  marginTop: '16px', padding: '16px', backgroundColor: '#fafbfc',
                  borderRadius: '3px', border: '1px solid #dfe1e6'
                }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    {/* Phase Filter */}
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#5e6c84', display: 'block', marginBottom: '4px' }}>PHASE</label>
                      <select value={selectedPhase} onChange={(e) => setSelectedPhase(e.target.value)}
                        style={{ padding: '6px 8px', border: '1px solid #dfe1e6', borderRadius: '3px', fontSize: '13px', backgroundColor: 'white', minWidth: '140px' }}>
                        <option value="">All Phases</option>
                        {phases.map(phase => (<option key={phase._id} value={phase._id}>{phase.name}</option>))}
                      </select>
                    </div>

                    {/* Sprint Filter */}
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#5e6c84', display: 'block', marginBottom: '4px' }}>SPRINT</label>
                      <select value={selectedSprint} onChange={(e) => setSelectedSprint(e.target.value)}
                        style={{ padding: '6px 8px', border: '1px solid #dfe1e6', borderRadius: '3px', fontSize: '13px', backgroundColor: 'white', minWidth: '140px' }}>
                        <option value="">All Sprints</option>
                        {sprints.map(sprint => (<option key={sprint._id} value={sprint._id}>{sprint.name}</option>))}
                      </select>
                    </div>

                    {/* Due Date Range */}
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#5e6c84', display: 'block', marginBottom: '4px' }}>DUE DATE FROM</label>
                      <input type="date" value={dueDateFrom} onChange={(e) => setDueDateFrom(e.target.value)}
                        style={{ padding: '6px 8px', border: '1px solid #dfe1e6', borderRadius: '3px', fontSize: '13px', backgroundColor: 'white' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#5e6c84', display: 'block', marginBottom: '4px' }}>DUE DATE TO</label>
                      <input type="date" value={dueDateTo} onChange={(e) => setDueDateTo(e.target.value)}
                        style={{ padding: '6px 8px', border: '1px solid #dfe1e6', borderRadius: '3px', fontSize: '13px', backgroundColor: 'white' }} />
                    </div>

                    {/* Clear All Button */}
                    {(activeFilterCount > 0 || selectedSprint || selectedPhase) && (
                      <button onClick={clearAllFilters}
                        style={{ padding: '6px 12px', backgroundColor: 'white', border: '1px solid #dfe1e6', borderRadius: '3px', fontSize: '13px', cursor: 'pointer', color: '#de350b', fontWeight: '500' }}>
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
              )}
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
                  taskCosts={taskCosts}
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
                onEditTask={handleSelectTask}
                onDeleteTask={handleDeleteTask}
                onAddSubtask={() => {}}
                onUpdateTaskStatus={handleUpdateTaskStatus}
              />
            )}

            {currentView === 'gantt' && (
              <GanttView
                tasks={filteredTasks}
                onEditTask={handleSelectTask}
                onDeleteTask={handleDeleteTask}
                onAddSubtask={() => {}}
                project={project}
                company={company}
                onUpdateTask={handleUpdateTask}
                employeeLeaves={employeeLeaves}
              />
            )}
          </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          project={project}
          users={users}
          taskStatuses={taskStatuses}
          sprints={sprints}
          phases={phases}
          onUpdateTask={handleUpdateTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* Auto-Schedule Modal */}
      {showAutoScheduleModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}
          onClick={() => setShowAutoScheduleModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white', borderRadius: '8px', padding: '24px',
              maxWidth: '500px', width: '90%', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#172b4d' }}>
              ⚡ Auto-Schedule Tasks
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#5e6c84' }}>
              Automatically schedule tasks based on priority and duration.
            </p>

            {/* Priority Info */}
            <div style={{
              padding: '12px', backgroundColor: '#f4f5f7', borderRadius: '4px',
              marginBottom: '20px', fontSize: '13px', color: '#5e6c84'
            }}>
              <strong>Priority Order:</strong> 🔴 Urgent → 🟠 High → 🟡 Medium → 🟢 Low
            </div>

            {/* Scheduling Mode */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#172b4d', marginBottom: '8px' }}>
                Scheduling Mode
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{
                  flex: 1, padding: '12px', border: schedulingMode === 'sequential' ? '2px solid #0052cc' : '1px solid #dfe1e6',
                  borderRadius: '4px', cursor: 'pointer', backgroundColor: schedulingMode === 'sequential' ? '#deebff' : 'white'
                }}>
                  <input
                    type="radio" name="mode" value="sequential"
                    checked={schedulingMode === 'sequential'}
                    onChange={() => setSchedulingMode('sequential')}
                    style={{ marginRight: '8px' }}
                  />
                  <strong>Sequential</strong>
                  <div style={{ fontSize: '12px', color: '#5e6c84', marginTop: '4px' }}>
                    Tasks run one after another
                  </div>
                </label>
                <label style={{
                  flex: 1, padding: '12px', border: schedulingMode === 'parallel' ? '2px solid #0052cc' : '1px solid #dfe1e6',
                  borderRadius: '4px', cursor: 'pointer', backgroundColor: schedulingMode === 'parallel' ? '#deebff' : 'white'
                }}>
                  <input
                    type="radio" name="mode" value="parallel"
                    checked={schedulingMode === 'parallel'}
                    onChange={() => setSchedulingMode('parallel')}
                    style={{ marginRight: '8px' }}
                  />
                  <strong>Parallel</strong>
                  <div style={{ fontSize: '12px', color: '#5e6c84', marginTop: '4px' }}>
                    Multiple tasks at once
                  </div>
                </label>
              </div>
            </div>

            {/* Parallel Count */}
            {schedulingMode === 'parallel' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#172b4d', marginBottom: '8px' }}>
                  Max Parallel Tasks
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      onClick={() => setMaxParallelTasks(num)}
                      style={{
                        padding: '8px 16px', border: maxParallelTasks === num ? '2px solid #0052cc' : '1px solid #dfe1e6',
                        borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                        backgroundColor: maxParallelTasks === num ? '#deebff' : 'white', color: '#172b4d'
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Start Date Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#172b4d', marginBottom: '8px' }}>
                Start Scheduling From
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{
                  flex: 1, padding: '12px', border: scheduleStartFrom === 'project' ? '2px solid #0052cc' : '1px solid #dfe1e6',
                  borderRadius: '4px', cursor: 'pointer', backgroundColor: scheduleStartFrom === 'project' ? '#deebff' : 'white'
                }}>
                  <input
                    type="radio" name="startFrom" value="project"
                    checked={scheduleStartFrom === 'project'}
                    onChange={() => setScheduleStartFrom('project')}
                    style={{ marginRight: '8px' }}
                  />
                  <strong>Project Start</strong>
                  <div style={{ fontSize: '12px', color: '#5e6c84', marginTop: '4px' }}>
                    {project?.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
                  </div>
                </label>
                <label style={{
                  flex: 1, padding: '12px', border: scheduleStartFrom === 'today' ? '2px solid #0052cc' : '1px solid #dfe1e6',
                  borderRadius: '4px', cursor: 'pointer', backgroundColor: scheduleStartFrom === 'today' ? '#deebff' : 'white'
                }}>
                  <input
                    type="radio" name="startFrom" value="today"
                    checked={scheduleStartFrom === 'today'}
                    onChange={() => setScheduleStartFrom('today')}
                    style={{ marginRight: '8px' }}
                  />
                  <strong>Today</strong>
                  <div style={{ fontSize: '12px', color: '#5e6c84', marginTop: '4px' }}>
                    {new Date().toLocaleDateString()}
                  </div>
                </label>
              </div>
            </div>

            {/* Warning about rescheduling */}
            <div style={{
              padding: '10px 14px', backgroundColor: '#fef3c7', borderRadius: '6px',
              fontSize: '12px', color: '#92400e', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span>⚠️</span>
              <span>This will reschedule all tasks with duration. Existing dates will be replaced.</span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAutoScheduleModal(false)}
                style={{
                  padding: '8px 16px', backgroundColor: 'white', border: '1px solid #dfe1e6',
                  borderRadius: '4px', cursor: 'pointer', fontSize: '14px', color: '#172b4d'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAutoSchedule}
                disabled={isAutoScheduling}
                style={{
                  padding: '8px 16px', backgroundColor: '#0052cc', border: 'none',
                  borderRadius: '4px', cursor: isAutoScheduling ? 'not-allowed' : 'pointer',
                  fontSize: '14px', color: 'white', fontWeight: '500',
                  opacity: isAutoScheduling ? 0.7 : 1
                }}
              >
                {isAutoScheduling ? 'Scheduling...' : 'Schedule Tasks'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Result Modal */}
      {scheduleResult && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1001
          }}
          onClick={() => setScheduleResult(null)}
        >
          <div
            style={{
              backgroundColor: 'white', borderRadius: '16px', padding: '32px',
              maxWidth: '450px', width: '90%', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
              textAlign: 'center', animation: 'fadeIn 0.3s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {scheduleResult.success ? (
              <>
                {/* Success Icon */}
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 20px', fontSize: '40px'
                }}>
                  ✅
                </div>

                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#065f46' }}>
                  Tasks Scheduled!
                </h2>

                <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: '#6b7280' }}>
                  Tasks without dates have been scheduled based on priority and duration.
                </p>

                {/* Stats */}
                <div style={{
                  display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px'
                }}>
                  <div style={{
                    padding: '14px 20px', backgroundColor: '#f0fdf4', borderRadius: '12px',
                    border: '1px solid #bbf7d0', minWidth: '100px'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#16a34a' }}>
                      {scheduleResult.count}
                    </div>
                    <div style={{ fontSize: '11px', color: '#15803d', fontWeight: '500' }}>
                      SCHEDULED
                    </div>
                  </div>

                  <div style={{
                    padding: '14px 20px', backgroundColor: '#eff6ff', borderRadius: '12px',
                    border: '1px solid #bfdbfe', minWidth: '100px'
                  }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>
                      {scheduleResult.mode === 'parallel' ? `${scheduleResult.maxParallel}x` : '1x'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: '500' }}>
                      {scheduleResult.mode === 'parallel' ? 'PARALLEL' : 'SEQUENTIAL'}
                    </div>
                  </div>

                  {scheduleResult.noDuration > 0 && (
                    <div style={{
                      padding: '14px 20px', backgroundColor: '#fef3c7', borderRadius: '12px',
                      border: '1px solid #fde68a', minWidth: '100px'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#92400e' }}>
                        {scheduleResult.noDuration}
                      </div>
                      <div style={{ fontSize: '11px', color: '#92400e', fontWeight: '500' }}>
                        NO DURATION
                      </div>
                    </div>
                  )}
                </div>

                {/* Started from info */}
                <div style={{
                  padding: '10px 14px', backgroundColor: '#f0fdf4', borderRadius: '6px',
                  fontSize: '13px', color: '#065f46', marginBottom: '16px', textAlign: 'center'
                }}>
                  📅 Scheduled from: <strong>{scheduleResult.startedFrom === 'today' ? 'Today' : 'Project Start Date'}</strong>
                </div>

                {/* Info about no duration */}
                {scheduleResult.noDuration > 0 && (
                  <div style={{
                    padding: '10px 14px', backgroundColor: '#fef3c7', borderRadius: '6px',
                    fontSize: '12px', color: '#92400e', marginBottom: '16px', textAlign: 'left'
                  }}>
                    ⚠ <strong>{scheduleResult.noDuration}</strong> task(s) have no duration - add duration to schedule them
                  </div>
                )}

                {/* Mode Description */}
                <div style={{
                  padding: '12px 16px', backgroundColor: '#f9fafb', borderRadius: '8px',
                  fontSize: '13px', color: '#6b7280', marginBottom: '24px'
                }}>
                  {scheduleResult.mode === 'parallel'
                    ? `Tasks scheduled up to ${scheduleResult.maxParallel} at a time, grouped by priority.`
                    : 'Tasks scheduled one after another in priority order.'
                  }
                </div>

                {/* View Gantt Button */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    onClick={() => {
                      setScheduleResult(null);
                      setCurrentView('gantt');
                    }}
                    style={{
                      padding: '12px 24px', backgroundColor: '#0052cc', border: 'none',
                      borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
                      color: 'white', fontWeight: '600', display: 'flex',
                      alignItems: 'center', gap: '8px'
                    }}
                  >
                    📊 View in Gantt Chart
                  </button>
                  <button
                    onClick={() => setScheduleResult(null)}
                    style={{
                      padding: '12px 24px', backgroundColor: 'white', border: '1px solid #d1d5db',
                      borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
                      color: '#374151', fontWeight: '500'
                    }}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Error Icon */}
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 20px', fontSize: '40px'
                }}>
                  ⚠️
                </div>

                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#991b1b' }}>
                  Scheduling Failed
                </h2>

                <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: '#6b7280' }}>
                  {scheduleResult.error}
                </p>

                <button
                  onClick={() => setScheduleResult(null)}
                  style={{
                    padding: '12px 32px', backgroundColor: '#dc2626', border: 'none',
                    borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
                    color: 'white', fontWeight: '600'
                  }}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
};

export default Tasks;