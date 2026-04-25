import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, taskAPI, taskStatusAPI, sprintAPI, phaseAPI, taskRoleAPI, companyAPI, leaveAPI, meetingNoteAPI } from '../../services/api';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

import TaskDetailModal from './TaskDetailModal';
import AssigneeModal from './AssigneeModal';
import InlineTaskCreator from './InlineTaskCreator';
import ListView from './views/ListView';
import BoardView from './views/BoardView';
import GanttView from './views/GanttView';
import { autoScheduleAllTasks } from '../../utils/ganttScheduler';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

const TasksTab = ({ projectId, project: initialProject, users: initialUsers, onRefresh: onProjectRefresh }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { state: authState } = useAuth();
    const user = authState?.user;
    const [project, setProject] = useState(initialProject || null);
    const [company, setCompany] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [teamActivity, setTeamActivity] = useState([]);
    const [users, setUsers] = useState(initialUsers || []);
    const [taskStatuses, setTaskStatuses] = useState([]);
    const [sprints, setSprints] = useState([]);
    const [phases, setPhases] = useState([]);
    const [taskRoles, setTaskRoles] = useState([]);
    const [meetingNotes, setMeetingNotes] = useState([]);
    const [employeeLeaves, setEmployeeLeaves] = useState([]);
    const [taskCosts, setTaskCosts] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedSprint] = useState('');
    const [selectedPhase] = useState('');
    const [currentView, setCurrentView] = useState('list');
    const [showInlineCreator, setShowInlineCreator] = useState(false);

    // Filter states
    const [selectedAssignee, setSelectedAssignee] = useState('');
    const [selectedPriority, setSelectedPriority] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedTaskRole, setSelectedTaskRole] = useState('');
    const [selectedProjectRole, setSelectedProjectRole] = useState('');
    const [dueDateFrom, setDueDateFrom] = useState('');
    const [dueDateTo, setDueDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Auto-schedule states
    const [showAutoScheduleModal, setShowAutoScheduleModal] = useState(false);
    const [isAutoScheduling, setIsAutoScheduling] = useState(false);
    const [schedulingMode] = useState('sequential');
    const [maxParallelTasks] = useState(3);
    const [scheduleStartFrom] = useState('project');
    const [customScheduleDate] = useState(new Date().toISOString().split('T')[0]);
    const [scheduleRoleId, setScheduleRoleId] = useState('');

    // Duration entry states
    const [isDurationEntryMode, setIsDurationEntryMode] = useState(false);
    const [durationContext, setDurationContext] = useState({ roleId: '', userId: '' });
    const [pendingDurations, setPendingDurations] = useState({});
    const [existingDurations, setExistingDurations] = useState({});
    const [isSubmittingDurations, setIsSubmittingDurations] = useState(false);
    const [deleteTaskModal, setDeleteTaskModal] = useState({ isOpen: false, taskId: null, taskTitle: '' });
    const [assigneeModalTask, setAssigneeModalTask] = useState(null);
    const [myDurations, setMyDurations] = useState({});

    const isProjectManager = React.useMemo(() => {
        if (!user || !project) return false;
        return (project.projectManager?._id || project.projectManager) === user?._id;
    }, [user, project]);

    const canViewCost = React.useMemo(() => {
        if (!user || !project) return false;
        if (user.role === 'superadmin' || user.role === 'owner' || user.role === 'company_admin' || user.role === 'admin') return true;
        
        // Project Manager also has cost/duration visibility
        if (isProjectManager) return true;

        if (project.owner === user._id || project.owner?._id === user._id) return true;
        if (user.permissions && user.permissions.includes('viewProjectCost')) return true;
        return false;
    }, [user, project, isProjectManager]);

    useEffect(() => {
        if (isDurationEntryMode && durationContext.roleId && durationContext.userId) {
            taskAPI.getBulkUserDurations(id, durationContext.userId, durationContext.roleId)
                .then(res => {
                    setExistingDurations(res.data || {});
                    setPendingDurations({});
                })
                .catch(() => setExistingDurations({}));
        } else {
            setExistingDurations({});
        }
    }, [isDurationEntryMode, durationContext.roleId, durationContext.userId, id]);



    const fetchTeamActivity = React.useCallback(async () => {
        try {
            const activityRes = await api.get('/team-activity', { params: { projectId: id } });
            setTeamActivity(activityRes.data || []);
        } catch (err) {
            console.error('Failed to sync activity', err);
        }
    }, [id]);

    const fetchProjectData = React.useCallback(async () => {
        try {
            setLoading(true);
            const [projectRes, tasksRes, statusesRes, sprintsRes, phasesRes, rolesRes, meetingNoteNotesRes, activityRes] = await Promise.all([
                projectAPI.getById(id).catch(() => ({ data: {} })),
                taskAPI.getAll(id).catch(() => ({ data: [] })),
                taskStatusAPI.getAll(id).catch(() => ({ data: [] })),
                sprintAPI.getAll(id).catch(() => ({ data: [] })),
                phaseAPI.getAll(id).catch(() => ({ data: [] })),
                taskRoleAPI.getAll(id).catch(() => ({ data: [] })),
                meetingNoteAPI.getAll(id).catch(() => ({ data: [] })),
                api.get('/team-activity', { params: { projectId: id } }).catch(() => ({ data: [] }))
            ]);

            setProject(projectRes.data);
            setTasks(tasksRes.data);
            setTeamActivity(activityRes.data || []);
            setTaskStatuses(statusesRes.data);
            setSprints(sprintsRes.data);
            setPhases(phasesRes.data);
            setTaskRoles(rolesRes.data || []);
            setMeetingNotes(meetingNoteNotesRes.data || []);

            try {
                const costsRes = await projectAPI.getCosts(id);
                if (costsRes.data?.tasks) {
                    const costsMap = {};
                    costsRes.data.tasks.forEach(t => costsMap[t._id] = t.totalCost);
                    setTaskCosts(costsMap);
                }
            } catch (e) {
                console.error('Failed to load costs', e);
            }

            if (projectRes.data.company) {
                const companyId = projectRes.data.company._id || projectRes.data.company;
                const companyRes = await companyAPI.getById(companyId);
                setCompany(companyRes.data);
                const leavesRes = await leaveAPI.getAll(companyId, { status: 'approved' }).catch(() => ({ data: { leaves: [] } }));
                setEmployeeLeaves(leavesRes.data.leaves || []);
            }

            if (user?._id) {
                taskAPI.getBulkUserDurations(id, user._id, '')
                    .then(res => setMyDurations(res.data || {}))
                    .catch(e => console.error('Failed to load personal durations', e));
            }

            const projectTeam = [];
            if (projectRes.data.owner) projectTeam.push({ ...projectRes.data.owner, projectRole: 'Owner' });
            projectRes.data.members?.forEach(m => {
                if (m.user && !projectTeam.find(u => u._id === m.user._id)) {
                    projectTeam.push({ ...m.user, projectRole: m.role || 'Member' });
                }
            });
            setUsers(projectTeam);
        } catch (error) {
            console.error('Failed to load project data', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchProjectData();
        const intervalId = setInterval(fetchTeamActivity, 30000);
        return () => clearInterval(intervalId);
    }, [id, fetchProjectData, fetchTeamActivity]);

    const handleCreateTask = async (taskData) => {
        try {
            const data = { ...taskData, sprint: selectedSprint || undefined, phase: selectedPhase || undefined };
            if (!data.status) data.status = project?.settings?.defaultTaskStatus || taskStatuses[0]?._id;
            const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.order || 0)) : 0;
            data.order = maxOrder + 1;
            await taskAPI.create(id, data);
            fetchProjectData();
            if (onProjectRefresh) onProjectRefresh();
        } catch (error) {
            console.error('Failed to create task', error);
        }
    };

    const handleUpdateTask = async (taskId, updates, skipFetch = false) => {
        try {
            const response = await taskAPI.update(id, taskId, updates);
            if (selectedTask?._id === taskId) setSelectedTask(response.data);
            if (!skipFetch) fetchProjectData();
            if (onProjectRefresh) onProjectRefresh();
        } catch (error) {
            console.error('Failed to update task', error);
        }
    };

    const handleUpdateTaskStatus = async (taskId, statusId) => {
        try {
            await taskAPI.update(id, taskId, { status: statusId });
            fetchProjectData();
            if (onProjectRefresh) onProjectRefresh();
        } catch (error) {
            console.error('Failed to update task status', error);
        }
    };

    const handleReorderTasks = async (newTasks) => {
        try {
            setTasks(newTasks);
            const taskOrders = newTasks.map((t, index) => ({ taskId: t._id, order: index + 1 }));
            await taskAPI.reorder(id, taskOrders);
        } catch (error) {
            console.error('Failed to reorder tasks', error);
            fetchProjectData();
        }
    };

    const handleSubmitDurations = async () => {
        if (!durationContext.roleId) return;
        setIsSubmittingDurations(true);
        try {
            const updates = Object.entries(pendingDurations).map(([taskId, value]) => ({
                taskId,
                duration: parseFloat(value) // backend parses this directly as hours
            }));
            await taskAPI.bulkUpdateRoleDurations(id, durationContext.roleId, updates, durationContext.userId);
            setIsDurationEntryMode(false);
            setPendingDurations({});
            fetchProjectData();
        } catch (error) {
            console.error('Failed to submit durations', error);
        } finally {
            setIsSubmittingDurations(false);
        }
    };

    const handleSelectTask = (task) => {
        navigate(`/projects/${id}/tasks/${task._id}`);
    };

    const handleOpenAssigneeModal = (task) => {
        setAssigneeModalTask(task);
    };

    const handleDeleteTask = async () => {
        try {
            await taskAPI.delete(id, deleteTaskModal.taskId);
            if (selectedTask?._id === deleteTaskModal.taskId) setSelectedTask(null);
            fetchProjectData();
            if (onProjectRefresh) onProjectRefresh();
        } catch (e) { console.error('Failed to delete task', e); }
        finally { setDeleteTaskModal({ isOpen: false, taskId: null, taskTitle: '' }); }
    };

    const handleSetMyDuration = async (taskId, hours) => {
        try {
            const numHours = parseFloat(hours) || 0;
            await taskAPI.setRoleDuration(id, taskId, { targetUserId: user._id, durationMinutes: Math.round(numHours * 60) });
            setMyDurations(prev => ({ ...prev, [taskId]: Math.round(numHours * 60) }));
        } catch (e) { console.error('Failed to set personal duration', e); }
    };

    const handleAutoSchedule = async () => {
        let startDate = scheduleStartFrom === 'today' ? new Date().toISOString() : (scheduleStartFrom === 'custom' ? new Date(customScheduleDate).toISOString() : project?.startDate);
        if (!startDate) return;

        setIsAutoScheduling(true);
        try {
            const tasksToConsider = scheduleRoleId ? tasks.filter(t => t.roleAssignments?.some(ra => (ra.role?._id || ra.role) === scheduleRoleId)) : tasks;
            const settings = {
                workingDays: company?.settings?.workingDays || project?.settings?.workingDays || [1, 2, 3, 4, 5],
                holidays: company?.settings?.holidays || project?.settings?.holidays || [],
                timeTracking: company?.settings?.timeTracking || project?.settings?.timeTracking || { hoursPerDay: 8, daysPerWeek: 5, defaultDurationUnit: 'hours' }
            };

            const scheduledTasks = autoScheduleAllTasks(tasksToConsider.filter(t => scheduleRoleId ? t.roleAssignments?.find(ra => (ra.role?._id || ra.role) === scheduleRoleId)?.duration?.value : t.duration?.value), startDate, settings, employeeLeaves, { mode: schedulingMode, maxParallel: maxParallelTasks, forceReschedule: true, roleId: scheduleRoleId, useTaskSequence: true });

            await taskAPI.bulkSchedule(id, scheduledTasks);
            setShowAutoScheduleModal(false);
            fetchProjectData();
        } catch (e) { console.error('Auto-schedule failed', e); }
        finally { setIsAutoScheduling(false); }
    };

    // When duration entry mode is active with a role selected, only show tasks that have that role
    const durationRoleId = isDurationEntryMode ? durationContext.roleId : '';

    // Users assigned to the selected duration role (for the User dropdown in duration mode)
    const durationRoleUsers = durationRoleId
        ? users.filter(u =>
            tasks.some(t =>
                t.roleAssignments?.some(ra =>
                    (ra.role?._id || ra.role) === durationRoleId &&
                    ra.assignees?.some(a => (a._id || a) === u._id)
                )
            )
          )
        : users;

    const filteredTasks = tasks.filter(task => {
        if (selectedSprint && task.sprint?._id !== selectedSprint) return false;
        if (selectedPhase && task.phase?._id !== selectedPhase) return false;
        // Auto-filter by duration role when in bulk entry mode
        if (durationRoleId && !task.roleAssignments?.some(ra => (ra.role?._id || ra.role) === durationRoleId)) return false;
        if (selectedTaskRole && !task.roleAssignments?.some(ra => (ra.role?._id || ra.role) === selectedTaskRole)) return false;
        if (selectedProjectRole) {
            const ids = users.filter(u => u.projectRole === selectedProjectRole).map(u => u._id);
            if (!task.assignees?.some(a => ids.includes(a._id || a)) && !task.roleAssignments?.some(ra => ra.assignees?.some(a => ids.includes(a._id || a)))) return false;
        }
        if (selectedAssignee) {
            if (!task.assignees?.some(a => (a._id || a) === selectedAssignee) && !task.roleAssignments?.some(ra => ra.assignees?.some(a => (a._id || a) === selectedAssignee))) return false;
        }
        if (selectedPriority && task.priority !== selectedPriority) return false;
        if (selectedStatus && task.status?._id !== selectedStatus) return false;
        if (dueDateFrom && new Date(task.dueDate) < new Date(dueDateFrom)) return false;
        if (dueDateTo && new Date(task.dueDate) > new Date(dueDateTo + 'T23:59:59')) return false;
        return true;
    });

    const activeFilterCount = [selectedAssignee, selectedPriority, selectedStatus, selectedTaskRole, selectedProjectRole, dueDateFrom, dueDateTo].filter(Boolean).length;

    if (loading) return (
        <div className="p-16 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-400">Loading tasks...</p>
        </div>
    );

    return (
        <div className="flex flex-col min-h-[500px] space-y-6">
            {/* Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex bg-slate-50 p-1 rounded-xl gap-1 border border-slate-100 shrink-0">
                    {[
                        { id: 'list', label: 'List', icon: '☰' },
                        { id: 'board', label: 'Board', icon: '⚏' },
                        { id: 'gantt', label: 'Timeline', icon: '📊' }
                    ].map(view => (
                        <button
                            key={view.id}
                            onClick={() => setCurrentView(view.id)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${currentView === view.id ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <span>{view.icon}</span>
                            {view.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${showFilters || activeFilterCount > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        <span>🔍</span>
                        Filters {activeFilterCount > 0 && <span className="bg-indigo-600 text-white px-1.5 py-0.5 rounded-full text-[9px]">{activeFilterCount}</span>}
                    </button>

                    {canViewCost && (
                        <button
                            onClick={() => {
                                const enteringMode = !isDurationEntryMode;
                                setIsDurationEntryMode(enteringMode);
                                if (enteringMode) {
                                    setDurationContext({ roleId: '', userId: user?._id || '' });
                                }
                            }}
                            className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${isDurationEntryMode ? 'bg-amber-500 border-amber-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <span>⏱️</span>
                            Durations
                        </button>
                    )}

                    <button
                        onClick={() => setShowAutoScheduleModal(true)}
                        className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-100 transition-colors"
                    >
                        <span>⚡</span>
                        Auto Schedule
                    </button>

                    <button
                        onClick={() => setShowInlineCreator(true)}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-sm"
                    >
                        <span>+</span>
                        Add Task
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-in slide-in-from-top-2">
                    <div className="col-span-full flex justify-end">
                        <button onClick={() => { setSelectedAssignee(''); setSelectedPriority(''); setSelectedStatus(''); setSelectedTaskRole(''); setSelectedProjectRole(''); setDueDateFrom(''); setDueDateTo(''); }} className="text-[10px] font-bold text-rose-600 uppercase tracking-wider hover:underline">Reset Filters</button>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Assignee</label>
                        <select value={selectedAssignee} onChange={e => setSelectedAssignee(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-400">
                            <option value="">All Assignees</option>
                            {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Status</label>
                        <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none">
                            <option value="">All Statuses</option>
                            {taskStatuses.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Priority</label>
                        <select value={selectedPriority} onChange={e => setSelectedPriority(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none">
                            <option value="">All Priorities</option>
                            {['urgent', 'high', 'medium', 'low'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Due From</label>
                        <input type="date" value={dueDateFrom} onChange={e => setDueDateFrom(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Due To</label>
                        <input type="date" value={dueDateTo} onChange={e => setDueDateTo(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Workflow Role</label>
                        <select value={selectedTaskRole} onChange={e => setSelectedTaskRole(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none">
                            <option value="">All Roles</option>
                            {taskRoles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {/* Duration Mode Sub-Bar */}
            {isDurationEntryMode && (
                <div className="bg-amber-500 p-4 rounded-2xl text-white shadow-md flex items-center justify-between animate-in zoom-in-95">
                    <div className="flex items-center gap-6">
                        <div className="text-[10px] font-bold bg-white/20 px-3 py-1 rounded-lg">BULK DURATION ENTRY</div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase opacity-80">Role:</span>
                            <select value={durationContext.roleId} onChange={e => setDurationContext({ roleId: e.target.value, userId: user?._id || '' })} className="bg-white/10 border-white/20 rounded-lg px-3 py-1.5 text-xs font-bold outline-none cursor-pointer">
                                <option value="" className="text-slate-800">Select Role</option>
                                {taskRoles.map(r => <option key={r._id} value={r._id} className="text-slate-800">{r.name}</option>)}
                            </select>
                        </div>
                        {canViewCost && (
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold uppercase opacity-80">User:</span>
                                <select value={durationContext.userId || user?._id} onChange={e => setDurationContext({ ...durationContext, userId: e.target.value })} className="bg-white/10 border-white/20 rounded-lg px-3 py-1.5 text-xs font-bold outline-none cursor-pointer">
                                    <option value="" className="text-slate-800">{durationRoleId && durationRoleUsers.length === 0 ? 'No users in role' : 'Select User'}</option>
                                    {durationRoleUsers.map(u => <option key={u._id} value={u._id} className="text-slate-800">{u.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsDurationEntryMode(false)} className="px-4 py-1.5 text-xs font-bold hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
                        <button onClick={handleSubmitDurations} disabled={isSubmittingDurations} className="bg-white text-amber-600 px-6 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:scale-105 transition-all disabled:opacity-50">
                            {isSubmittingDurations ? 'Saving...' : 'Save Durations'}
                        </button>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                {currentView === 'list' && (
                    <ListView
                        tasks={filteredTasks}
                        onEditTask={handleSelectTask}
                        onDeleteTask={t => setDeleteTaskModal({ isOpen: true, taskId: t._id, taskTitle: t.title })}
                        onOpenAssigneeModal={handleOpenAssigneeModal}
                        onSelectTask={handleSelectTask}
                        onReorderTasks={handleReorderTasks}
                        taskCosts={taskCosts}
                        teamActivity={teamActivity}
                        isDurationEntryMode={isDurationEntryMode}
                        durationContext={durationContext}
                        pendingDurations={pendingDurations}
                        setPendingDurations={setPendingDurations}
                        existingDurations={existingDurations}
                        canViewCost={canViewCost}
                        myDurations={myDurations}
                        onSetMyDuration={handleSetMyDuration}
                        currentUserId={user?._id}
                    />
                )}
                {currentView === 'board' && (
                    <BoardView
                        tasks={filteredTasks}
                        taskStatuses={taskStatuses}
                        onUpdateTaskStatus={handleUpdateTaskStatus}
                        onSelectTask={handleSelectTask}
                    />
                )}
                {currentView === 'gantt' && (
                    <GanttView
                        tasks={filteredTasks}
                        project={project}
                        onSelectTask={handleSelectTask}
                    />
                )}
            </div>

            {/* Modals */}
            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    isOpen={!!selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={handleUpdateTask}
                    onDelete={() => setDeleteTaskModal({ isOpen: true, taskId: selectedTask._id, taskTitle: selectedTask.title })}
                    projectId={id}
                    projectTitle={project?.title}
                    users={users}
                    taskStatuses={taskStatuses}
                    sprints={sprints}
                    phases={phases}
                    taskRoles={taskRoles}
                    meetingNotes={meetingNotes}
                />
            )}

            {assigneeModalTask && (
                <AssigneeModal
                    task={assigneeModalTask}
                    projectId={id}
                    users={users}
                    taskRoles={taskRoles}
                    onClose={() => setAssigneeModalTask(null)}
                    onUpdate={() => {
                        setAssigneeModalTask(null);
                        fetchProjectData();
                        if (onProjectRefresh) onProjectRefresh();
                    }}
                />
            )}

            <InlineTaskCreator
                isOpen={showInlineCreator}
                onClose={() => setShowInlineCreator(false)}
                onCreate={handleCreateTask}
                taskStatuses={taskStatuses}
                users={users}
                sprints={sprints}
                phases={phases}
                meetingNotes={meetingNotes}
            />

            <DeleteConfirmModal
                isOpen={deleteTaskModal.isOpen}
                onClose={() => setDeleteTaskModal({ isOpen: false })}
                onConfirm={handleDeleteTask}
                title="Delete Task"
                message={`Are you sure you want to permanently delete "${deleteTaskModal.taskTitle}"?`}
            />

            {showAutoScheduleModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-6 animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-sm shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 bg-indigo-600 text-white">
                            <h3 className="text-xl font-bold">Auto Schedule</h3>
                            <p className="text-xs text-indigo-100 mt-1">Automatically calculate task dates based on dependencies and durations.</p>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Scheduling Target Role</label>
                                <select value={scheduleRoleId} onChange={e => setScheduleRoleId(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-400">
                                    <option value="">Global Sync (All Roles)</option>
                                    {taskRoles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button onClick={() => setShowAutoScheduleModal(false)} className="flex-1 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                                <button onClick={handleAutoSchedule} disabled={isAutoScheduling} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow-md hover:bg-indigo-700 transition-all">
                                    {isAutoScheduling ? 'Scheduling...' : 'Start Auto Sync'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TasksTab;
