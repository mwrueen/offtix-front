import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, taskAPI, taskStatusAPI, sprintAPI, phaseAPI, userAPI, companyAPI, leaveAPI, taskRoleAPI } from '../../services/api';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import TaskDetailModal from './TaskDetailModal';
import InlineTaskCreator from './InlineTaskCreator';
import AssigneeModal from './AssigneeModal';
import ListView from './views/ListView';
import BoardView from './views/BoardView';
import GanttView from './views/GanttView';
import { autoScheduleAllTasks } from '../../utils/ganttScheduler';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

const TasksTab = ({ projectId, project: initialProject, users: initialUsers, onRefresh: onProjectRefresh }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { state: authState } = useAuth();
    const [project, setProject] = useState(initialProject || null);
    const [company, setCompany] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [teamActivity, setTeamActivity] = useState([]);
    const [users, setUsers] = useState(initialUsers || []);
    const [taskStatuses, setTaskStatuses] = useState([]);
    const [sprints, setSprints] = useState([]);
    const [phases, setPhases] = useState([]);
    const [taskRoles, setTaskRoles] = useState([]);
    const [employeeLeaves, setEmployeeLeaves] = useState([]);
    const [taskCosts, setTaskCosts] = useState({}); // Map of task._id -> cost
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [assigneeModalTask, setAssigneeModalTask] = useState(null);
    const [selectedSprint, setSelectedSprint] = useState('');
    const [selectedPhase, setSelectedPhase] = useState('');
    const [currentView, setCurrentView] = useState('list');
    const [showInlineCreator, setShowInlineCreator] = useState(false);
    const [error, setError] = useState(null);

    // New filter states
    const [selectedAssignee, setSelectedAssignee] = useState('');
    const [selectedPriority, setSelectedPriority] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedTaskRole, setSelectedTaskRole] = useState(''); // Filter by task workflow role
    const [selectedProjectRole, setSelectedProjectRole] = useState(''); // Filter by project member role
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

    // Duration entry states
    const [isDurationEntryMode, setIsDurationEntryMode] = useState(false);
    const [durationContext, setDurationContext] = useState({ roleId: '', userId: '' });
    const [pendingDurations, setPendingDurations] = useState({}); // { taskId: value }
    const [isSubmittingDurations, setIsSubmittingDurations] = useState(false);
    const [deleteTaskModal, setDeleteTaskModal] = useState({ isOpen: false, taskId: null, taskTitle: '' });

    useEffect(() => {
        fetchProjectData();

        // Set up polling for team activity to keep "active" indicators fresh
        const intervalId = setInterval(() => {
            fetchTeamActivity();
        }, 30000); // 30 seconds

        return () => clearInterval(intervalId);
    }, [id]);

    const handleSubmitDurations = async () => {
        if (!durationContext.roleId) return;
        setIsSubmittingDurations(true);
        try {
            const updates = Object.entries(pendingDurations).map(([taskId, duration]) => ({
                taskId,
                duration
            }));

            await taskAPI.bulkUpdateRoleDurations(id, durationContext.roleId, updates, durationContext.userId);

            // Refresh project data (tasks + costs)
            fetchProjectData();

            // Clear pending
            setPendingDurations({});
            setIsDurationEntryMode(false);

            // If there's a project level refresh needed
            if (onProjectRefresh) onProjectRefresh();
        } catch (err) {
            console.error('Error submitting durations:', err);
            setError('Failed to save durations');
        } finally {
            setIsSubmittingDurations(false);
        }
    };

    const fetchTeamActivity = async () => {
        try {
            const activityRes = await api.get('/team-activity', { params: { projectId: id } });
            setTeamActivity(activityRes.data || []);
        } catch (err) {
            console.error('Error fetching team activity poll:', err);
        }
    };

    const fetchProjectData = async () => {
        try {
            const [projectRes, tasksRes, statusesRes, sprintsRes, phasesRes, rolesRes, activityRes] = await Promise.all([
                projectAPI.getById(id),
                taskAPI.getAll(id),
                taskStatusAPI.getAll(id),
                sprintAPI.getAll(id),
                phaseAPI.getAll(id),
                taskRoleAPI.getAll(id).catch(err => ({ data: [] })), // Handle if roles API not available
                api.get('/team-activity', { params: { projectId: id } }).catch(err => ({ data: [] }))
            ]);

            const projectData = projectRes.data;
            setProject(projectData);
            setTasks(tasksRes.data);
            setTeamActivity(activityRes.data || []);
            setTaskStatuses(statusesRes.data);
            setSprints(sprintsRes.data);
            setPhases(phasesRes.data);
            setTaskRoles(rolesRes.data || []);

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
                    const companyId = typeof projectData.company === 'object'
                        ? projectData.company._id
                        : projectData.company;
                    const companyRes = await companyAPI.getById(companyId);
                    setCompany(companyRes.data);

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

            if (projectData.owner) {
                projectTeamMembers.push({
                    ...projectData.owner,
                    projectRole: 'Owner'
                });
            }

            if (projectData.members && projectData.members.length > 0) {
                projectData.members.forEach(member => {
                    if (member.user) {
                        const exists = projectTeamMembers.find(u => u._id === member.user._id);
                        if (!exists) {
                            projectTeamMembers.push({
                                ...member.user,
                                projectRole: member.role || 'Member'
                            });
                        }
                    }
                });
            }

            setUsers(projectTeamMembers);

            if (selectedTask) {
                const updatedTask = tasksRes.data.find(t => t._id === selectedTask._id);
                if (updatedTask) {
                    setSelectedTask(updatedTask);
                }
            }
        } catch (error) {
            console.error('Error fetching project data:', error);
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

            if (!newTaskData.status && project?.settings?.defaultTaskStatus) {
                newTaskData.status = project.settings.defaultTaskStatus;
            } else if (!newTaskData.status && taskStatuses.length > 0) {
                newTaskData.status = taskStatuses[0]._id;
            }

            Object.keys(newTaskData).forEach(key => {
                if (newTaskData[key] === undefined) {
                    delete newTaskData[key];
                }
            });

            const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.order || 0)) : 0;
            newTaskData.order = maxOrder + 1;

            await taskAPI.create(id, newTaskData);
            await fetchProjectData();
            if (onProjectRefresh) onProjectRefresh();
        } catch (error) {
            console.error('Error creating task:', error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError('Failed to create task. Please try again.');
            }
        }
    };

    const handleUpdateTask = async (taskId, updates, skipFetch = false) => {
        setError(null);
        try {
            const response = await taskAPI.update(id, taskId, updates);
            if (selectedTask && selectedTask._id === taskId && response && response.data) {
                setSelectedTask(response.data);
            }
            if (!skipFetch) {
                await fetchProjectData();
            }
            if (onProjectRefresh) onProjectRefresh();
        } catch (error) {
            console.error('Error updating task:', error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError('Failed to update task. Please try again.');
            }
        }
    };

    const handleSelectTask = async (task) => {
        if (task.useRoleWorkflow) {
            try {
                const response = await taskAPI.getTaskWithWorkflow(id, task._id);
                setSelectedTask(response.data);
            } catch (error) {
                console.error('Error fetching task workflow:', error);
                setSelectedTask(task);
            }
        } else {
            setSelectedTask(task);
        }
    };

    const handleDeleteTask = async () => {
        try {
            await taskAPI.delete(id, deleteTaskModal.taskId);
            if (selectedTask && selectedTask._id === deleteTaskModal.taskId) {
                setSelectedTask(null);
            }
            await fetchProjectData();
            if (onProjectRefresh) onProjectRefresh();
        } catch (error) {
            console.error('Error deleting task:', error);
        } finally {
            setDeleteTaskModal({ isOpen: false, taskId: null, taskTitle: '' });
        }
    };

    const handleReorderTasks = async (reorderedTasks) => {
        setTasks(reorderedTasks);
        try {
            const taskOrders = reorderedTasks.map((task, index) => ({
                taskId: task._id,
                order: index
            }));
            const response = await taskAPI.reorder(id, taskOrders);
            if (response && response.data) {
                setTasks(response.data);
            }
        } catch (error) {
            console.error('Error reordering tasks:', error);
            await fetchProjectData();
        }
    };

    const handleUpdateTaskStatus = async (taskId, newStatusId) => {
        try {
            await taskAPI.update(id, taskId, { status: newStatusId });
            await fetchProjectData();
            if (onProjectRefresh) onProjectRefresh();
        } catch (error) {
            console.error('Error updating task status:', error);
            setError('Failed to update task status. Please try again.');
        }
    };

    const handleAutoSchedule = async () => {
        const startDate = scheduleStartFrom === 'today'
            ? new Date().toISOString()
            : project?.startDate;

        if (!startDate) {
            setScheduleResult({ success: false, error: 'Please set a project start date first' });
            setShowAutoScheduleModal(false);
            return;
        }

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
            const settings = {
                workingDays: company?.settings?.workingDays || project?.settings?.workingDays || [1, 2, 3, 4, 5],
                holidays: company?.settings?.holidays || project?.settings?.holidays || [],
                timeTracking: company?.settings?.timeTracking || project?.settings?.timeTracking || {
                    hoursPerDay: 8,
                    daysPerWeek: 5,
                    defaultDurationUnit: 'hours'
                }
            };

            const scheduledTasks = autoScheduleAllTasks(
                tasksWithDuration,
                startDate,
                settings,
                employeeLeaves,
                {
                    mode: schedulingMode,
                    maxParallel: maxParallelTasks,
                    forceReschedule: true
                }
            );

            await taskAPI.bulkSchedule(id, scheduledTasks);
            setShowAutoScheduleModal(false);
            await fetchProjectData();
            if (onProjectRefresh) onProjectRefresh();
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

    const filteredTasks = tasks.filter(task => {
        if (selectedSprint && task.sprint?._id !== selectedSprint) return false;
        if (selectedPhase && task.phase?._id !== selectedPhase) return false;
        if (selectedTaskRole) {
            const hasRole = task.roleAssignments?.some(ra =>
                (ra.role?._id === selectedTaskRole) || (ra.role === selectedTaskRole)
            );
            if (!hasRole) return false;
        }
        if (selectedProjectRole) {
            const usersWithRole = users.filter(u => u.projectRole === selectedProjectRole);
            const userIdsWithRole = usersWithRole.map(u => u._id);
            const hasDirectAssignee = task.assignees?.some(a => userIdsWithRole.includes(a._id || a));
            const hasRoleAssignee = task.roleAssignments?.some(ra =>
                ra.assignees?.some(a => userIdsWithRole.includes(a._id || a))
            );
            if (!hasDirectAssignee && !hasRoleAssignee) return false;
        }
        if (selectedAssignee) {
            const isDirectAssignee = task.assignees?.some(a => (a._id || a) === selectedAssignee);
            const isRoleAssignee = task.roleAssignments?.some(ra =>
                ra.assignees?.some(a => (a._id || a) === selectedAssignee)
            );
            if (!isDirectAssignee && !isRoleAssignee) return false;
        }
        if (selectedPriority && task.priority !== selectedPriority) return false;
        if (selectedStatus && task.status?._id !== selectedStatus) return false;
        if (dueDateFrom || dueDateTo) {
            const taskDueDate = task.dueDate ? new Date(task.dueDate) : null;
            if (!taskDueDate) return false;
            if (dueDateFrom && taskDueDate < new Date(dueDateFrom)) return false;
            if (dueDateTo && taskDueDate > new Date(dueDateTo + 'T23:59:59')) return false;
        }
        if (isDurationEntryMode && durationContext.roleId) {
            const hasRole = task.roleAssignments?.some(ra =>
                (ra.role?._id === durationContext.roleId) || (ra.role === durationContext.roleId)
            );
            if (!hasRole) return false;
        }
        return true;
    });

    const activeFilterCount = [selectedAssignee, selectedPriority, selectedStatus, selectedTaskRole, selectedProjectRole, dueDateFrom, dueDateTo].filter(Boolean).length;

    const clearAllFilters = () => {
        setSelectedAssignee('');
        setSelectedPriority('');
        setSelectedStatus('');
        setSelectedTaskRole('');
        setSelectedProjectRole('');
        setDueDateFrom('');
        setDueDateTo('');
        setSelectedSprint('');
        setSelectedPhase('');
    };

    if (loading) return <div>Loading tasks...</div>;

    if (error && error.type) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>{error.type === 'access_denied' ? '🔒' : '❌'}</div>
                <h2>{error.type === 'access_denied' ? 'Access Denied' : 'Error'}</h2>
                <p>{error.message}</p>
            </div>
        );
    }

    if (!project) return <div>Project not found</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Tasks Header */}
            <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #dfe1e6',
                borderRadius: '8px',
                boxShadow: '0 1px 2px rgba(9, 30, 66, 0.1)',
                marginBottom: '16px'
            }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #dfe1e6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {/* View Switcher */}
                            <div style={{ display: 'flex', backgroundColor: '#f4f5f7', borderRadius: '4px', padding: '2px' }}>
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
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            boxShadow: currentView === view.id ? '0 1px 2px rgba(9, 30, 66, 0.1)' : 'none'
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
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 10px', backgroundColor: showFilters ? '#deebff' : 'white',
                                border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '12px',
                                cursor: 'pointer', color: '#172b4d', fontWeight: '500'
                            }}
                        >
                            🔍 Filters {activeFilterCount > 0 && <span style={{ backgroundColor: '#0052cc', color: 'white', borderRadius: '10px', padding: '1px 5px', fontSize: '10px' }}>{activeFilterCount}</span>}
                        </button>

                        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
                            style={{ padding: '6px 8px', border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '12px', minWidth: '110px' }}>
                            <option value="">All Status</option>
                            {taskStatuses.map(status => (<option key={status._id} value={status._id}>{status.name}</option>))}
                        </select>

                        <select value={selectedAssignee} onChange={(e) => setSelectedAssignee(e.target.value)}
                            style={{ padding: '6px 8px', border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '12px', minWidth: '120px' }}>
                            <option value="">All Assignees</option>
                            {users.map(user => (<option key={user._id} value={user._id}>{user.name}</option>))}
                        </select>

                        <div style={{ flex: 1 }} />

                        <button
                            onClick={() => setIsDurationEntryMode(!isDurationEntryMode)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 10px', backgroundColor: isDurationEntryMode ? '#ff8b00' : '#ffffff',
                                border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '12px',
                                cursor: 'pointer', color: isDurationEntryMode ? 'white' : '#5e6c84', fontWeight: '500'
                            }}
                        >
                            ⏱️ {isDurationEntryMode ? 'Exit Duration Mode' : 'Add Duration'}
                        </button>

                        <button
                            onClick={() => setShowInlineCreator(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 12px', backgroundColor: '#36b37e',
                                border: 'none', borderRadius: '4px', fontSize: '12px',
                                cursor: 'pointer', color: 'white', fontWeight: '600'
                            }}
                        >
                            ➕ Create
                        </button>

                        <button
                            onClick={() => setShowAutoScheduleModal(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 12px', backgroundColor: '#0052cc',
                                border: 'none', borderRadius: '4px', fontSize: '12px',
                                cursor: 'pointer', color: 'white', fontWeight: '600'
                            }}
                        >
                            ⚡ Auto-Schedule
                        </button>
                    </div>

                    {/* Extended Filters Panel */}
                    {showFilters && (
                        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fafbfc', borderRadius: '4px', border: '1px solid #dfe1e6' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                <div>
                                    <label style={{ fontSize: '10px', fontWeight: '600', color: '#5e6c84', display: 'block', marginBottom: '4px' }}>PHASE</label>
                                    <select value={selectedPhase} onChange={(e) => setSelectedPhase(e.target.value)}
                                        style={{ padding: '5px 8px', border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '12px', minWidth: '120px' }}>
                                        <option value="">All Phases</option>
                                        {phases.map(p => (<option key={p._id} value={p._id}>{p.name}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '10px', fontWeight: '600', color: '#5e6c84', display: 'block', marginBottom: '4px' }}>SPRINT</label>
                                    <select value={selectedSprint} onChange={(e) => setSelectedSprint(e.target.value)}
                                        style={{ padding: '5px 8px', border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '12px', minWidth: '120px' }}>
                                        <option value="">All Sprints</option>
                                        {sprints.map(s => (<option key={s._id} value={s._id}>{s.name}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '10px', fontWeight: '600', color: '#5e6c84', display: 'block', marginBottom: '4px' }}>PRIORITY</label>
                                    <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}
                                        style={{ padding: '5px 8px', border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '12px', minWidth: '100px' }}>
                                        <option value="">All Priority</option>
                                        <option value="urgent">Urgent</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                                {(activeFilterCount > 0 || selectedSprint || selectedPhase) && (
                                    <button onClick={clearAllFilters}
                                        style={{ padding: '5px 10px', backgroundColor: 'white', border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', color: '#de350b' }}>
                                        Clear All
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Duration entry sub-header */}
                    {isDurationEntryMode && (
                        <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#fff4e5', borderRadius: '4px', border: '1px solid #ffd599', display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#855700' }}>DURATION MODE:</span>
                            <select value={durationContext.roleId} onChange={(e) => setDurationContext({ ...durationContext, roleId: e.target.value })}
                                style={{ padding: '4px 8px', border: '1px solid #ffab00', borderRadius: '3px', fontSize: '11px' }}>
                                <option value="">Select Role *</option>
                                {taskRoles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                            </select>
                            {Object.keys(pendingDurations).length > 0 && (
                                <button onClick={handleSubmitDurations} disabled={isSubmittingDurations || !durationContext.roleId}
                                    style={{ padding: '4px 10px', backgroundColor: '#ff8b00', color: 'white', border: 'none', borderRadius: '3px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                                    {isSubmittingDurations ? 'Saving...' : `Save ${Object.keys(pendingDurations).length} Durations`}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Task Content Area */}
            <div style={{ flex: 1, minHeight: '500px' }}>
                {showInlineCreator && (
                    <div style={{ marginBottom: '16px' }}>
                        <InlineTaskCreator
                            onCreateTask={handleCreateTask}
                            onCancel={() => setShowInlineCreator(false)}
                            defaultDurationUnit={company?.settings?.timeTracking?.defaultDurationUnit || 'hours'}
                        />
                    </div>
                )}

                {currentView === 'list' && (
                    <ListView
                        tasks={filteredTasks}
                        onEditTask={(task) => setAssigneeModalTask(task)}
                        onDeleteTask={handleDeleteTask}
                        onAddSubtask={() => { }}
                        selectedTaskId={selectedTask?._id}
                        onSelectTask={handleSelectTask}
                        onReorderTasks={handleReorderTasks}
                        taskCosts={taskCosts}
                        teamActivity={teamActivity}
                        isDurationEntryMode={isDurationEntryMode}
                        durationContext={durationContext}
                        pendingDurations={pendingDurations}
                        setPendingDurations={setPendingDurations}
                        selectedAssignee={selectedAssignee}
                        selectedTaskRole={isDurationEntryMode && durationContext.roleId ? durationContext.roleId : selectedTaskRole}
                        selectedProjectRole={selectedProjectRole}
                    />
                )}

                {currentView === 'board' && (
                    <BoardView
                        tasks={filteredTasks}
                        taskStatuses={taskStatuses}
                        onEditTask={handleSelectTask}
                        onDeleteTask={handleDeleteTask}
                        onAddSubtask={() => { }}
                        onUpdateTaskStatus={handleUpdateTaskStatus}
                        teamActivity={teamActivity}
                    />
                )}

                {currentView === 'gantt' && (
                    <GanttView
                        tasks={filteredTasks}
                        onEditTask={handleSelectTask}
                        onDeleteTask={handleDeleteTask}
                        onAddSubtask={() => { }}
                        project={project}
                        company={company}
                        onUpdateTask={handleUpdateTask}
                        employeeLeaves={employeeLeaves}
                        teamActivity={teamActivity}
                        onRefresh={fetchProjectData}
                    />
                )}
            </div>

            {/* Modals */}
            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    project={project}
                    users={users}
                    taskStatuses={taskStatuses}
                    taskRoles={taskRoles}
                    sprints={sprints}
                    phases={phases}
                    onUpdateTask={handleUpdateTask}
                    onClose={() => setSelectedTask(null)}
                />
            )}

            {assigneeModalTask && (
                <AssigneeModal
                    task={assigneeModalTask}
                    projectId={id}
                    users={users}
                    taskRoles={taskRoles}
                    onClose={() => setAssigneeModalTask(null)}
                    onUpdate={async () => {
                        await fetchProjectData();
                        if (selectedTask && selectedTask._id === assigneeModalTask._id) {
                            try {
                                const response = await taskAPI.getTaskWithWorkflow(id, assigneeModalTask._id);
                                setSelectedTask(response.data);
                            } catch (e) { console.error(e); }
                        }
                    }}
                />
            )}

            {showAutoScheduleModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAutoScheduleModal(false)}>
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', maxWidth: '450px', width: '90%' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 16px 0' }}>⚡ Auto-Schedule</h3>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>Mode</label>
                            <select value={schedulingMode} onChange={e => setSchedulingMode(e.target.value)} style={{ width: '100%', padding: '8px' }}>
                                <option value="sequential">Sequential</option>
                                <option value="parallel">Parallel</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button onClick={() => setShowAutoScheduleModal(false)} style={{ padding: '8px 16px', border: '1px solid #dfe1e6', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleAutoSchedule} disabled={isAutoScheduling} style={{ padding: '8px 16px', backgroundColor: '#0052cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                {isAutoScheduling ? 'Scheduling...' : 'Schedule'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {scheduleResult && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }} onClick={() => setScheduleResult(null)}>
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>{scheduleResult.success ? '✅' : '⚠️'}</div>
                        <h3>{scheduleResult.success ? 'Success!' : 'Failed'}</h3>
                        <p>{scheduleResult.success ? `Scheduled ${scheduleResult.count} tasks.` : scheduleResult.error}</p>
                        <button onClick={() => setScheduleResult(null)} style={{ marginTop: '20px', padding: '10px 24px', backgroundColor: '#0052cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TasksTab;
