import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, taskAPI, taskStatusAPI, sprintAPI, phaseAPI, userAPI, companyAPI, leaveAPI, taskRoleAPI } from '../../services/api';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import TaskDetailModal from './TaskDetailModal';
import InlineTaskCreator from './InlineTaskCreator';
import AssigneeModal from './AssigneeModal';
import BulkAssigneeModal from './BulkAssigneeModal';
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
    const [scheduleStartFrom, setScheduleStartFrom] = useState('project'); // 'project', 'today', or 'custom'
    const [customScheduleDate, setCustomScheduleDate] = useState(new Date().toISOString().split('T')[0]);
    const [scheduleRoleId, setScheduleRoleId] = useState(''); // New: Role-wise scheduling
    const [scheduleResult, setScheduleResult] = useState(null); // { success: bool, count: number, mode: string }

    // Duration entry states
    const [isDurationEntryMode, setIsDurationEntryMode] = useState(false);
    const [durationContext, setDurationContext] = useState({ roleId: '', userId: '' });
    const [pendingDurations, setPendingDurations] = useState({}); // { taskId: value }
    const [existingDurations, setExistingDurations] = useState({}); // { taskId: durationMinutes }
    const [isSubmittingDurations, setIsSubmittingDurations] = useState(false);
    const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
    const [deleteTaskModal, setDeleteTaskModal] = useState({ isOpen: false, taskId: null, taskTitle: '' });

    // Fetch existing durations when both role + user are selected in Duration Entry Mode
    useEffect(() => {
        if (isDurationEntryMode && durationContext.roleId && durationContext.userId) {
            taskAPI.getBulkUserDurations(id, durationContext.userId, durationContext.roleId)
                .then(res => {
                    setExistingDurations(res.data || {});
                    setPendingDurations({}); // reset pending so existing values show as placeholders
                })
                .catch(() => setExistingDurations({}));
        } else {
            setExistingDurations({});
        }
    }, [isDurationEntryMode, durationContext.roleId, durationContext.userId, id]);

    useEffect(() => {
        if (isDurationEntryMode) {
            const timer = setTimeout(() => {
                const firstInput = document.querySelector('.duration-input');
                if (firstInput) {
                    firstInput.focus();
                    firstInput.select();
                }
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [isDurationEntryMode]);

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
        let startDate;
        if (scheduleStartFrom === 'today') {
            startDate = new Date().toISOString();
        } else if (scheduleStartFrom === 'custom') {
            startDate = new Date(customScheduleDate).toISOString();
        } else {
            startDate = project?.startDate;
        }

        if (!startDate) {
            setScheduleResult({ success: false, error: 'Please set a start date first' });
            setShowAutoScheduleModal(false);
            return;
        }

        // If role-wise, focus only on tasks that have that role assignment
        const tasksToConsider = scheduleRoleId
            ? tasks.filter(t => t.roleAssignments?.some(ra => (ra.role?._id || ra.role) === scheduleRoleId))
            : tasks;

        const tasksWithDuration = tasksToConsider.filter(t => {
            if (scheduleRoleId) {
                const ra = t.roleAssignments?.find(ra => (ra.role?._id || ra.role) === scheduleRoleId);
                return ra?.duration?.value;
            }
            return t.duration?.value;
        });

        const tasksNoDuration = tasksToConsider.filter(t => !tasksWithDuration.includes(t));

        if (tasksWithDuration.length === 0) {
            setScheduleResult({
                success: false,
                error: scheduleRoleId
                    ? `No tasks have duration set for the selected role.`
                    : `No tasks have duration set. Please add duration to tasks first.`
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
                    forceReschedule: true,
                    roleId: scheduleRoleId,  // Pass the role filter to the scheduler
                    useTaskSequence: true    // New opt: follow the current task order
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
            // Filter to tasks that have this role
            const hasRole = task.roleAssignments?.some(ra =>
                (ra.role?._id === durationContext.roleId) || (ra.role === durationContext.roleId)
            );
            if (!hasRole) return false;

            // When a user is also selected, further filter to tasks where that user is assigned to that role
            if (durationContext.userId) {
                const userInRole = task.roleAssignments?.some(ra => {
                    const roleMatch = (ra.role?._id === durationContext.roleId) || (ra.role === durationContext.roleId);
                    const userMatch = ra.assignees?.some(a => (a._id || a) === durationContext.userId);
                    return roleMatch && userMatch;
                });
                if (!userInRole) return false;
            }
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
                                padding: '6px 12px',
                                backgroundColor: isDurationEntryMode ? '#ff8b00' : '#ffffff',
                                border: isDurationEntryMode ? 'none' : '1px solid #dfe1e6',
                                borderRadius: '4px', fontSize: '12px',
                                cursor: 'pointer', color: isDurationEntryMode ? 'white' : '#5e6c84',
                                fontWeight: '600',
                                boxShadow: isDurationEntryMode ? '0 4px 10px rgba(255, 139, 0, 0.3)' : 'none',
                                transition: 'all 0.2s'
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

                        <button
                            onClick={() => setShowBulkAssignModal(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 12px', backgroundColor: '#6554c0',
                                border: 'none', borderRadius: '4px', fontSize: '12px',
                                cursor: 'pointer', color: 'white', fontWeight: '600'
                            }}
                        >
                            👥 Bulk Assign Member
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
                        <div style={{
                            marginTop: '16px',
                            padding: '12px 20px',
                            background: 'linear-gradient(135deg, #fffaf0 0%, #fff4e5 100%)',
                            borderRadius: '8px',
                            border: '1px solid #ffab00',
                            display: 'flex',
                            gap: '15px',
                            alignItems: 'center',
                            boxShadow: '0 4px 15px rgba(255, 171, 0, 0.1)',
                            animation: 'slideDown 0.3s ease-out'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '800', color: '#855700', letterSpacing: '0.05em' }}>⏱️ DURATION ENTRY MODE</span>
                                <div style={{ width: '1px', height: '20px', backgroundColor: '#ffd599' }}></div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: '600', color: '#855700' }}>Target Role:</label>
                                <select
                                    value={durationContext.roleId}
                                    onChange={(e) => setDurationContext({ roleId: e.target.value, userId: '' })}
                                    style={{
                                        padding: '6px 12px',
                                        border: '1px solid #ffab00',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        backgroundColor: 'white',
                                        fontWeight: '600',
                                        color: '#172b4d',
                                        cursor: 'pointer',
                                        outline: 'none',
                                        minWidth: '150px'
                                    }}
                                >
                                    <option value="">Select a Workflow Role...</option>
                                    {taskRoles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                                </select>
                            </div>

                            {/* Target User — only shown once a role is picked */}
                            {durationContext.roleId && (() => {
                                // Build list of users assigned to the selected role across all tasks
                                const roleUserMap = new Map();
                                tasks.forEach(t => {
                                    t.roleAssignments?.forEach(ra => {
                                        const roleId = ra.role?._id || ra.role;
                                        if (roleId === durationContext.roleId) {
                                            ra.assignees?.forEach(a => {
                                                const uid = a._id || a;
                                                if (uid && !roleUserMap.has(uid)) {
                                                    roleUserMap.set(uid, a.name || users.find(u => u._id === uid)?.name || uid);
                                                }
                                            });
                                        }
                                    });
                                });
                                const roleUsers = Array.from(roleUserMap.entries()).map(([id, name]) => ({ _id: id, name }));

                                return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: '600', color: '#855700' }}>Target User:</label>
                                        <select
                                            value={durationContext.userId}
                                            onChange={(e) => setDurationContext({ ...durationContext, userId: e.target.value })}
                                            style={{
                                                padding: '6px 12px',
                                                border: `1px solid ${durationContext.userId ? '#ffab00' : '#f0a500'}`,
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                backgroundColor: 'white',
                                                fontWeight: '600',
                                                color: '#172b4d',
                                                cursor: 'pointer',
                                                outline: 'none',
                                                minWidth: '150px'
                                            }}
                                        >
                                            <option value="">Select a Member...</option>
                                            {roleUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                );
                            })()}

                            <div style={{ flex: 1 }}></div>

                            {Object.keys(pendingDurations).length > 0 ? (
                                <button
                                    onClick={handleSubmitDurations}
                                    disabled={isSubmittingDurations || !durationContext.roleId || !durationContext.userId}
                                    style={{
                                        padding: '8px 20px',
                                        backgroundColor: '#ff8b00',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 10px rgba(255, 139, 0, 0.3)',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e67e00'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ff8b00'}
                                >
                                    {isSubmittingDurations ? 'Saving Changes...' : `🚀 Save ${Object.keys(pendingDurations).length} Task Durations`}
                                </button>
                            ) : (
                                <span style={{ fontSize: '12px', color: '#855700', fontStyle: 'italic', opacity: 0.8 }}>
                                    {!durationContext.roleId
                                        ? 'Select a role to begin.'
                                        : !durationContext.userId
                                            ? 'Now select a member to filter tasks and enter hours.'
                                            : 'Enter hours in the list below. Press Tab to move between fields.'}
                                </span>
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
                        existingDurations={existingDurations}
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
                        taskRoles={taskRoles}
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

            {showBulkAssignModal && (
                <BulkAssigneeModal
                    projectId={id}
                    users={users}
                    taskRoles={taskRoles}
                    tasksCount={tasks.length}
                    onClose={() => setShowBulkAssignModal(false)}
                    onUpdate={async () => {
                        await fetchProjectData();
                        if (onProjectRefresh) onProjectRefresh();
                    }}
                />
            )}

            {showAutoScheduleModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9, 30, 66, 0.54)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAutoScheduleModal(false)}>
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '28px', maxWidth: '500px', width: '95%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#eae6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⚡</div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', color: '#172b4d' }}>Auto-Schedule Tasks</h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#5e6c84' }}>Optimize your timeline based on work sequence and availability.</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: '20px' }}>
                            {/* Start Date Selection */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#5e6c84', marginBottom: '8px', textTransform: 'uppercase' }}>Start Timeline From</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                    {['project', 'today', 'custom'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setScheduleStartFrom(opt)}
                                            style={{
                                                padding: '8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer',
                                                border: '1px solid #dfe1e6',
                                                backgroundColor: scheduleStartFrom === opt ? '#deebff' : 'white',
                                                color: scheduleStartFrom === opt ? '#0052cc' : '#5e6c84',
                                                fontWeight: scheduleStartFrom === opt ? '600' : '400'
                                            }}
                                        >
                                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                        </button>
                                    ))}
                                </div>
                                {scheduleStartFrom === 'custom' && (
                                    <input
                                        type="date"
                                        value={customScheduleDate}
                                        onChange={e => setCustomScheduleDate(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #dfe1e6', fontSize: '14px' }}
                                    />
                                )}
                            </div>

                            {/* Role Selection */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#5e6c84', marginBottom: '8px', textTransform: 'uppercase' }}>Role-Wise Scheduling (Optional)</label>
                                <select
                                    value={scheduleRoleId}
                                    onChange={e => setScheduleRoleId(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #dfe1e6', fontSize: '14px', backgroundColor: 'white' }}
                                >
                                    <option value="">All Roles (Global Schedule)</option>
                                    {taskRoles.map(role => (
                                        <option key={role._id} value={role._id}>{role.name}</option>
                                    ))}
                                </select>
                                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#855700', fontStyle: 'italic' }}>
                                    {scheduleRoleId ? 'Only tasks with this role will be rescheduled sequentially.' : 'All tasks with durations will be rescheduled.'}
                                </p>
                            </div>

                            {/* Mode Selection */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#5e6c84', marginBottom: '8px', textTransform: 'uppercase' }}>Strategy</label>
                                    <select value={schedulingMode} onChange={e => setSchedulingMode(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #dfe1e6', backgroundColor: 'white' }}>
                                        <option value="sequential">Sequential</option>
                                        <option value="parallel">Parallel</option>
                                    </select>
                                </div>
                                {schedulingMode === 'parallel' && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#5e6c84', marginBottom: '8px', textTransform: 'uppercase' }}>Max Parallel</label>
                                        <input type="number" min="1" max="10" value={maxParallelTasks} onChange={e => setMaxParallelTasks(parseInt(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #dfe1e6' }} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
                            <button onClick={() => setShowAutoScheduleModal(false)} style={{ padding: '10px 20px', border: '1px solid #dfe1e6', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'white', color: '#5e6c84', fontWeight: '600' }}>Cancel</button>
                            <button
                                onClick={handleAutoSchedule}
                                disabled={isAutoScheduling}
                                style={{
                                    padding: '10px 24px', backgroundColor: '#0052cc', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer',
                                    fontWeight: '600', boxShadow: '0 4px 10px rgba(0, 82, 204, 0.2)', opacity: isAutoScheduling ? 0.7 : 1
                                }}
                            >
                                {isAutoScheduling ? '⏳ Calculating...' : '⚡ Run Auto-Schedule'}
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
