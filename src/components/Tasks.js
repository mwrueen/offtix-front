import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, taskAPI, taskStatusAPI, sprintAPI, phaseAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';
import Breadcrumb from './project/Breadcrumb';
import TaskForm from './project/TaskForm';
import TaskList from './project/TaskList';
import ListView from './project/views/ListView';
import BoardView from './project/views/BoardView';
import GanttView from './project/views/GanttView';

const Tasks = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [parentTask, setParentTask] = useState(null);
  const [selectedSprint, setSelectedSprint] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('');
  const [currentView, setCurrentView] = useState('list');
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    assignees: [],
    dependencies: [],
    duration: '',
    startDate: '',
    dueDate: '',
    parent: '',
    sprint: '',
    phase: ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, tasksRes, usersRes, statusesRes, sprintsRes, phasesRes] = await Promise.all([
        projectAPI.getById(id),
        taskAPI.getAll(id),
        userAPI.getAll(),
        taskStatusAPI.getAll(id),
        sprintAPI.getAll(id),
        phaseAPI.getAll(id)
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data);
      setUsers(usersRes.data);
      setTaskStatuses(statusesRes.data);
      setSprints(sprintsRes.data);
      setPhases(phasesRes.data);
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const taskData = {
        title: taskForm.title,
        description: taskForm.description || undefined,
        status: taskForm.status || undefined,
        priority: taskForm.priority || undefined,
        assignees: taskForm.assignees.length > 0 ? taskForm.assignees : undefined,
        dependencies: taskForm.dependencies.length > 0 ? taskForm.dependencies : undefined,
        duration: taskForm.duration ? parseFloat(taskForm.duration) : undefined,
        startDate: taskForm.startDate || undefined,
        dueDate: taskForm.dueDate || undefined,
        parent: taskForm.parent || undefined,
        sprint: taskForm.sprint || undefined,
        phase: taskForm.phase || undefined
      };

      // Remove undefined values
      Object.keys(taskData).forEach(key => {
        if (taskData[key] === undefined) {
          delete taskData[key];
        }
      });

      if (editingTask) {
        await taskAPI.update(id, editingTask._id, taskData);
      } else {
        await taskAPI.create(id, taskData);
      }
      
      await fetchProjectData();
      resetTaskForm();
    } catch (error) {
      console.error('Error saving task:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to save task. Please try again.');
      }
    }
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      status: '',
      priority: '',
      assignees: [],
      dependencies: [],
      duration: '',
      startDate: '',
      dueDate: '',
      parent: '',
      sprint: selectedSprint,
      phase: selectedPhase
    });
    setShowTaskForm(false);
    setEditingTask(null);
    setParentTask(null);
  };

  const handleEditTask = (task) => {
    setTaskForm({
      title: task.title,
      description: task.description || '',
      status: task.status?._id || '',
      priority: task.priority || '',
      assignees: task.assignees?.map(a => a._id) || [],
      dependencies: task.dependencies?.map(d => d._id) || [],
      duration: task.duration || '',
      startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      parent: task.parent?._id || '',
      sprint: task.sprint?._id || '',
      phase: task.phase?._id || ''
    });
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleAddSubtask = (parentTaskId) => {
    setTaskForm({
      title: '',
      description: '',
      status: '',
      priority: '',
      assignees: [],
      dependencies: [],
      duration: '',
      startDate: '',
      dueDate: '',
      parent: parentTaskId,
      sprint: selectedSprint,
      phase: selectedPhase
    });
    setParentTask(parentTaskId);
    setShowTaskForm(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskAPI.delete(id, taskId);
        await fetchProjectData();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleCreateTask = () => {
    setTaskForm({
      ...taskForm,
      sprint: selectedSprint,
      phase: selectedPhase
    });
    setShowTaskForm(true);
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
      
      {/* Tasks Header */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #dfe1e6',
        borderRadius: '3px',
        marginBottom: '24px',
        boxShadow: '0 1px 2px rgba(9, 30, 66, 0.25)'
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #dfe1e6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#172b4d' }}>
                Tasks Management
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
            
            <button
              onClick={handleCreateTask}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0052cc',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>➕</span>
              Create Task
            </button>
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
              Showing {filteredTasks.length} of {tasks.length} tasks
            </div>
          </div>
        </div>
      </div>

      {showTaskForm && (
        <TaskForm
          taskForm={taskForm}
          setTaskForm={setTaskForm}
          onSubmit={handleTaskSubmit}
          onCancel={resetTaskForm}
          taskStatuses={taskStatuses}
          editingTask={editingTask}
          parentTask={parentTask}
          projectId={id}
          onStatusesUpdate={fetchProjectData}
          availableTasks={tasks.flatMap(task => [task, ...(task.subtasks || [])])}
          error={error}
          isProjectOwner={isProjectOwner}
          users={users}
          sprints={sprints}
          phases={phases}
        />
      )}

      {/* Render Current View */}
      {currentView === 'list' && (
        <ListView
          tasks={filteredTasks}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onAddSubtask={handleAddSubtask}
        />
      )}
      
      {currentView === 'board' && (
        <BoardView
          tasks={filteredTasks}
          taskStatuses={taskStatuses}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onAddSubtask={handleAddSubtask}
        />
      )}
      
      {currentView === 'gantt' && (
        <GanttView
          tasks={filteredTasks}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onAddSubtask={handleAddSubtask}
        />
      )}
    </Layout>
  );
};

export default Tasks;