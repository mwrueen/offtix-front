import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskAPI, projectAPI, taskStatusAPI, getAssetUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import Layout from '../layout/Layout';
import PageHeader from '../layout/PageHeader';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const ProjectTaskDetails = () => {
    const { id: projectId, taskId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { state: authState } = useAuth();
    const user = authState.user;

    const [task, setTask] = useState(null);
    const [project, setProject] = useState(null);
    const [subtasks, setSubtasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [taskStatuses, setTaskStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [showSubtaskForm, setShowSubtaskForm] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [selectedUsersForSubtask, setSelectedUsersForSubtask] = useState([]);

    const [editingSubtask, setEditingSubtask] = useState(null);
    const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');
    const [editingSubtaskUsers, setEditingSubtaskUsers] = useState([]);

    const [isEditingTask, setIsEditingTask] = useState(false);
    const [editedTask, setEditedTask] = useState({ title: '', description: '' });
    const [isSavingTask, setIsSavingTask] = useState(false);

    const canEditTask = React.useMemo(() => {
        if (!user || !project) return false;
        if (user.role === 'superadmin') return true;
        if ((project.owner?._id || project.owner) === user._id) return true;
        
        let hasCompanyPermission = false;
        if (user.company === project.company || (project.company && project.company._id === user.company)) {
            // Approximating permission since frontend resolves this broadly for project owners / assigned members
            hasCompanyPermission = true; 
        }

        const isMember = project.members?.some(m => (m.user?._id || m.user) === user._id);
        
        return hasCompanyPermission || isMember;
    }, [project, user]);

    const mainTaskUsers = React.useMemo(() => {
        if (!task) return [];
        const usersMap = new Map();
        
        if (task.roleAssignments) {
            task.roleAssignments.forEach(ra => {
                ra.assignees?.forEach(a => {
                    const roleId = ra.role?._id || ra.role;
                    usersMap.set(a._id || a, { ...(a._id ? a : {}), roleId, roleName: ra.role?.name, _id: a._id || a });
                });
            });
        }
        if (task.sequentialAssignees) {
            task.sequentialAssignees.forEach(sa => {
                if (sa.user) usersMap.set(sa.user._id || sa.user, { ...(sa.user._id ? sa.user : {}), _id: sa.user._id || sa.user });
            });
        }
        if (task.assignees) {
            task.assignees.forEach(a => usersMap.set(a._id || a, { ...(a._id ? a : {}), _id: a._id || a }));
        }
        
        // Match with full user info if we just had IDs
        return Array.from(usersMap.values()).map(u => {
            const fullUser = users.find(user => user._id === u._id);
            return fullUser ? { ...fullUser, ...u } : u;
        });
    }, [task, users]);

    const getUserInitials = (user) => {
        if (!user || !user.name) return '?';
        const names = user.name.split(' ');
        return names.length >= 2 ? (names[0][0] + names[names.length - 1][0]).toUpperCase() : user.name.substring(0, 2).toUpperCase();
    };

    const getUserColor = (userId) => {
        const colors = ['#0052cc', '#00875a', '#ff8b00', '#6554c0', '#00b8d9', '#ff5630'];
        return colors[userId ? userId.charCodeAt(userId.length - 1) % colors.length : 0];
    };

    const getSubtaskAssignees = (st) => {
        const usersMap = new Map();
        if (st.roleAssignments) {
            st.roleAssignments.forEach(ra => ra.assignees?.forEach(a => usersMap.set(a._id || a, a)));
        }
        if (st.sequentialAssignees) {
            st.sequentialAssignees.forEach(sa => sa.user && usersMap.set(sa.user._id || sa.user, sa.user));
        }
        if (st.assignees) {
            st.assignees.forEach(a => usersMap.set(a._id || a, a));
        }
        return Array.from(usersMap.values()).filter(a => typeof a === 'object' && a.name);
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [taskRes, projRes, statusesRes] = await Promise.all([
                taskAPI.getById(projectId, taskId).catch(() => ({ data: null })),
                projectAPI.getById(projectId).catch(() => ({ data: null })),
                taskStatusAPI.getAll(projectId).catch(() => ({ data: [] }))
            ]);

            setTask(taskRes.data);
            if (taskRes.data) {
                setEditedTask({ title: taskRes.data.title || '', description: taskRes.data.description || '' });
            }
            setSubtasks(taskRes.data?.subtasks || []);
            setProject(projRes.data);
            setTaskStatuses(statusesRes.data);

            if (projRes.data) {
                const projectTeam = [];
                if (projRes.data.owner) projectTeam.push({ ...projRes.data.owner, projectRole: 'Owner' });
                projRes.data.members?.forEach(m => {
                    if (m.user && !projectTeam.find(u => u._id === m.user._id)) {
                        projectTeam.push({ ...m.user, projectRole: m.role || 'Member' });
                    }
                });
                setUsers(projectTeam);
            }
        } catch (error) {
            toast?.showToast?.('Failed to load task details', 'error');
        } finally {
            setLoading(false);
        }
    }, [projectId, taskId, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdateTaskStatus = async (statusId) => {
        try {
            await taskAPI.update(projectId, taskId, { status: statusId });
            toast?.showToast?.('Task status updated', 'success');
            fetchData();
        } catch (e) {
            toast?.showToast?.('Failed to update task status', 'error');
        }
    };

    const handleSaveTaskDetails = async () => {
        if (!editedTask.title.trim()) return toast?.showToast?.('Title is required', 'error');
        setIsSavingTask(true);
        try {
            await taskAPI.update(projectId, taskId, {
                title: editedTask.title,
                description: editedTask.description
            });
            toast?.showToast?.('Task updated successfully', 'success');
            setIsEditingTask(false);
            fetchData();
        } catch (e) {
            toast?.showToast?.('Failed to update task details', 'error');
        } finally {
            setIsSavingTask(false);
        }
    };

    const handleCreateSubtask = async () => {
        if (!newSubtaskTitle.trim()) return toast?.showToast?.('Title required', 'error');
        
        try {
            const roleAssignmentsMap = new Map();
            const genericAssignees = [];
            
            selectedUsersForSubtask.forEach(userId => {
                const u = mainTaskUsers.find(mu => mu._id === userId);
                if (u && u.roleId) {
                    if (!roleAssignmentsMap.has(u.roleId)) roleAssignmentsMap.set(u.roleId, []);
                    roleAssignmentsMap.get(u.roleId).push(userId);
                } else {
                    genericAssignees.push(userId);
                }
            });
            
            const roleAssignments = Array.from(roleAssignmentsMap.entries()).map(([roleId, userIds], idx) => ({
                role: roleId,
                assignees: userIds,
                order: idx + 1
            }));
            
            const payload = {
                title: newSubtaskTitle,
                parent: taskId,
                roleAssignments: roleAssignments,
                assignees: genericAssignees,
                useRoleWorkflow: roleAssignments.length > 0,
                status: taskStatuses[0]?._id,
                project: projectId
            };
            
            await taskAPI.create(projectId, payload);
            toast?.showToast?.('Subtask created successfully', 'success');
            setNewSubtaskTitle('');
            setSelectedUsersForSubtask([]);
            setShowSubtaskForm(false);
            fetchData();
        } catch (e) {
            toast?.showToast?.('Failed to create subtask', 'error');
        }
    };

    const startEditingSubtask = (st) => {
        setEditingSubtask(st._id);
        setEditingSubtaskTitle(st.title);
        const currentUsers = [];
        if (st.roleAssignments) {
            st.roleAssignments.forEach(ra => ra.assignees?.forEach(a => currentUsers.push(a._id || a)));
        }
        if (st.assignees) {
            st.assignees.forEach(a => currentUsers.push(a._id || a));
        }
        setEditingSubtaskUsers(currentUsers);
    };

    const cancelEditingSubtask = () => {
        setEditingSubtask(null);
        setEditingSubtaskTitle('');
        setEditingSubtaskUsers([]);
    };

    const saveSubtaskEdit = async (stId) => {
        if (!editingSubtaskTitle.trim()) return toast?.showToast?.('Title required', 'error');
        try {
            const roleAssignmentsMap = new Map();
            const genericAssignees = [];
            
            editingSubtaskUsers.forEach(userId => {
                const u = mainTaskUsers.find(mu => mu._id === userId);
                if (u && u.roleId) {
                    if (!roleAssignmentsMap.has(u.roleId)) roleAssignmentsMap.set(u.roleId, []);
                    roleAssignmentsMap.get(u.roleId).push(userId);
                } else {
                    genericAssignees.push(userId);
                }
            });
            
            const roleAssignments = Array.from(roleAssignmentsMap.entries()).map(([roleId, userIds], idx) => ({
                role: roleId,
                assignees: userIds,
                order: idx + 1
            }));

            await taskAPI.update(projectId, stId, {
                title: editingSubtaskTitle,
                roleAssignments,
                assignees: genericAssignees,
                useRoleWorkflow: roleAssignments.length > 0
            });
            toast?.showToast?.('Subtask updated successfully', 'success');
            cancelEditingSubtask();
            fetchData();
        } catch (e) {
            toast?.showToast?.('Failed to update subtask', 'error');
        }
    };

    const deleteSubtask = async (stId) => {
        if (!window.confirm('Are you sure you want to delete this subtask?')) return;
        try {
            await taskAPI.delete(projectId, stId);
            toast?.showToast?.('Subtask deleted successfully', 'success');
            fetchData();
        } catch (e) {
            toast?.showToast?.('Failed to delete subtask', 'error');
        }
    };

    const handleSubtaskStatusChange = async (subtaskId, newStatusId) => {
        try {
            await taskAPI.update(projectId, subtaskId, { status: newStatusId });
            await fetchData();
        } catch (e) {
            toast?.showToast?.('Failed to update subtask', 'error');
        }
    };

    const [showCompletionPrompt, setShowCompletionPrompt] = useState(false);

    useEffect(() => {
        if (!task || !taskStatuses.length || !subtasks.length) return;
        const completeStatusSlugs = ['completed', 'done'];
        const completedStatuses = taskStatuses.filter(s => completeStatusSlugs.includes(s.slug) || s.isCompleted).map(s => s._id);
        
        const allDone = subtasks.every(st => completedStatuses.includes(st.status?._id || st.status));
        const parentDone = completedStatuses.includes(task.status?._id || task.status);
        
        if (allDone && !parentDone) {
            setShowCompletionPrompt(true);
        } else {
            setShowCompletionPrompt(false);
        }
    }, [task, subtasks, taskStatuses]);

    if (loading) {
        return (
            <Layout>
                <div className="max-w-5xl mx-auto px-6 py-24 text-center">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                    <p className="mt-4 text-sm font-medium text-slate-500">Loading details...</p>
                </div>
            </Layout>
        );
    }

    if (!task) {
         return (
            <Layout>
                <div className="max-w-3xl mx-auto my-24 bg-white rounded-2xl p-10 text-center border border-rose-200">
                    <h2 className="text-2xl font-semibold text-rose-700">Task Not Found</h2>
                    <button onClick={() => navigate(`/projects/${projectId}?tab=tasks`)} className="mt-4 px-5 py-2.5 bg-slate-900 text-white rounded-lg">Back to Project Tasks</button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-6xl mx-auto py-8 px-6 space-y-8 pb-24">
                {isEditingTask ? (
                    <div className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-sm flex flex-col gap-4">
                        <label className="text-xs font-bold text-slate-500 uppercase">Task Title</label>
                        <input 
                            type="text" 
                            value={editedTask.title} 
                            onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })} 
                            className="w-full text-2xl font-bold px-4 py-3 border border-slate-200 rounded-xl"
                            placeholder="Enter task title"
                        />
                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={() => { setIsEditingTask(false); setEditedTask({ title: task.title, description: task.description}); }} className="px-5 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel Edit</button>
                            <button onClick={handleSaveTaskDetails} disabled={isSavingTask} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-sm">{isSavingTask ? 'Saving Base Task...' : 'Save Changes'}</button>
                        </div>
                    </div>
                ) : (
                    <PageHeader
                        title={task.title}
                        subtitle={`Task Details - ${project?.title || ''}`}
                        actions={
                            <div className="flex gap-3 items-center">
                                {canEditTask && (
                                    <button onClick={() => setIsEditingTask(true)} className="px-4 py-2 text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors">Edit Details</button>
                                )}
                                <button onClick={() => navigate(`/projects/${projectId}?tab=tasks`)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Back to Tasks</button>
                            </div>
                        }
                    />
                )}

                {showCompletionPrompt && (
                    <div className="bg-emerald-50 border-emerald-200 p-6 rounded-2xl border shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-emerald-800 font-bold text-lg">All Subtasks Completed!</h3>
                            <p className="text-emerald-600 text-sm mt-1">All referenced subtasks have been completed successfully. Would you like to mark the main task as complete?</p>
                        </div>
                        <button 
                            onClick={() => {
                                const completedStatus = taskStatuses.find(s => ['completed', 'done'].includes(s.slug) || s.isCompleted);
                                if (completedStatus) handleUpdateTaskStatus(completedStatus._id);
                            }}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow hover:bg-emerald-700 transition"
                        >
                            Mark Full Task Complete
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        {/* Parent Description */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Main Task Description</h3>
                                {canEditTask && !isEditingTask && (
                                    <button onClick={() => setIsEditingTask(true)} className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">Edit</button>
                                )}
                            </div>
                            
                            {isEditingTask ? (
                                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                                    <ReactQuill 
                                        value={editedTask.description} 
                                        onChange={(val) => setEditedTask({ ...editedTask, description: val })} 
                                        className="h-64" 
                                        theme="snow" 
                                    />
                                    <div className="h-10" />
                                </div>
                            ) : (
                                <div className="text-sm font-normal text-slate-700 prose max-w-none" dangerouslySetInnerHTML={{ __html: task.description || 'No description provided.' }} />
                            )}
                        </div>

                        {/* Subtasks Section */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Subtasks ({subtasks.length})</h3>
                                <button onClick={() => setShowSubtaskForm(!showSubtaskForm)} className="text-indigo-600 text-xs font-bold bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition border border-indigo-100 shadow-sm">+ Add Subtask</button>
                            </div>

                            {showSubtaskForm && (
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Subtask Title</label>
                                        <input type="text" value={newSubtaskTitle} onChange={e => setNewSubtaskTitle(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white" placeholder="E.g., Login Page, Registration Page" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Assignees (Inherits from Main Task)</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {mainTaskUsers.map(u => (
                                                <label key={u._id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedUsersForSubtask.includes(u._id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedUsersForSubtask.includes(u._id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedUsersForSubtask([...selectedUsersForSubtask, u._id]);
                                                            else setSelectedUsersForSubtask(selectedUsersForSubtask.filter(id => id !== u._id));
                                                        }}
                                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        {u.profile?.profilePicture ? (
                                                            <img src={getAssetUrl(u.profile.profilePicture)} alt={u.name || 'User'} className="w-8 h-8 rounded-full object-cover shadow-sm bg-white" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-semibold shrink-0" style={{ backgroundColor: getUserColor(u._id) }}>
                                                                {getUserInitials(u)}
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col truncate">
                                                            <span className="text-sm font-bold text-slate-700 truncate">{u.name || 'User'}</span>
                                                            {u.roleName && <span className="text-[10px] text-indigo-600 truncate">{u.roleName}</span>}
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                            {mainTaskUsers.length === 0 && (
                                                <p className="text-xs text-slate-400 italic">No assignees found in main task.</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-3 justify-end pt-2">
                                        <button onClick={() => setShowSubtaskForm(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg">Cancel</button>
                                        <button onClick={handleCreateSubtask} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm">Save Subtask</button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                {subtasks.length === 0 && !showSubtaskForm && (
                                    <p className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50">No subtasks found.</p>
                                )}
                                {subtasks.map(st => (
                                    editingSubtask === st._id ? (
                                        <div key={st._id} className="bg-slate-50 p-6 rounded-xl border border-indigo-200 shadow-sm space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Edit Title</label>
                                                <input type="text" value={editingSubtaskTitle} onChange={e => setEditingSubtaskTitle(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-indigo-400 outline-none" />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Assignees</label>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {mainTaskUsers.map(u => (
                                                        <label key={u._id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${editingSubtaskUsers.includes(u._id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={editingSubtaskUsers.includes(u._id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) setEditingSubtaskUsers([...editingSubtaskUsers, u._id]);
                                                                    else setEditingSubtaskUsers(editingSubtaskUsers.filter(id => id !== u._id));
                                                                }}
                                                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                                            />
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                {u.profile?.profilePicture ? (
                                                                    <img src={getAssetUrl(u.profile.profilePicture)} alt={u.name || 'User'} className="w-8 h-8 rounded-full object-cover shadow-sm bg-white" />
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-semibold shrink-0" style={{ backgroundColor: getUserColor(u._id) }}>
                                                                        {getUserInitials(u)}
                                                                    </div>
                                                                )}
                                                                <div className="flex flex-col truncate">
                                                                    <span className="text-sm font-bold text-slate-700 truncate">{u.name || 'User'}</span>
                                                                    {u.roleName && <span className="text-[10px] text-indigo-600 truncate">{u.roleName}</span>}
                                                                </div>
                                                            </div>
                                                        </label>
                                                    ))}
                                                    {mainTaskUsers.length === 0 && (
                                                        <p className="text-xs text-slate-400 italic">No assignees available to map.</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-3 justify-end pt-2">
                                                <button onClick={cancelEditingSubtask} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg">Cancel</button>
                                                <button onClick={() => saveSubtaskEdit(st._id)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm">Save Changes</button>
                                            </div>
                                        </div>
                                    ) : (
                                    <div key={st._id} className="border border-slate-200 rounded-xl p-5 hover:border-indigo-200 transition-colors bg-white shadow-sm flex flex-col gap-4 group">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col gap-1">
                                                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                    <span className="text-slate-400 text-xs">↳</span> {st.title}
                                                </h4>
                                                {canEditTask && (
                                                    <div className="flex items-center gap-3 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => startEditingSubtask(st)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800">EDIT</button>
                                                        <button onClick={() => deleteSubtask(st._id)} className="text-[10px] font-bold text-rose-600 hover:text-rose-800">DELETE</button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex -space-x-2">
                                                    {getSubtaskAssignees(st).slice(0, 5).map(u => (
                                                        <div key={u._id} title={u.name} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-white shadow-sm overflow-hidden" style={{ backgroundColor: u.profile?.profilePicture ? 'transparent' : getUserColor(u._id) }}>
                                                            {u.profile?.profilePicture ? (
                                                                <img src={getAssetUrl(u.profile.profilePicture)} alt={u.name} className="w-full h-full object-cover" />
                                                            ) : getUserInitials(u)}
                                                        </div>
                                                    ))}
                                                    {getSubtaskAssignees(st).length > 5 && (
                                                        <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600 shadow-sm z-10">
                                                            +{getSubtaskAssignees(st).length - 5}
                                                        </div>
                                                    )}
                                                </div>
                                                <select 
                                                    value={st.status?._id || st.status} 
                                                    onChange={e => handleSubtaskStatusChange(st._id, e.target.value)}
                                                    className="text-xs font-bold bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg outline-none cursor-pointer"
                                                >
                                                    {taskStatuses.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        
                                        {st.roleAssignments && st.roleAssignments.length > 0 && (
                                            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mt-2">
                                                <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Role Assignments</h5>
                                                {st.roleAssignments.map(ra => (
                                                    <div key={ra._id} className="flex items-center gap-3 mb-2 last:mb-0 bg-white border border-slate-100 p-2 rounded-lg">
                                                        <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[9px]" style={{ backgroundColor: ra.role?.color || '#6366f1' }}>R</div>
                                                        <span className="text-xs font-bold text-slate-700 w-24">{ra.role?.name || 'Role'}</span>
                                                        <div className="flex gap-1 flex-1 flex-wrap">
                                                            {ra.assignees?.map(a => (
                                                                <span key={a._id} className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-[10px] font-medium">{a.name}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 pb-3">Assignments</h3>
                            
                            {/* Generic Assignees */}
                            {task.assignees && task.assignees.length > 0 && !task.useRoleWorkflow && !task.useSequentialWorkflow && (
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase">All Assignees (Active)</h4>
                                    <div className="flex flex-col gap-2">
                                        {task.assignees.map(a => (
                                            <div key={a._id} className="flex items-center gap-2 p-2 rounded-lg border border-indigo-100 bg-indigo-50">
                                                <div className="w-6 h-6 rounded-md bg-indigo-200 text-indigo-700 flex items-center justify-center text-[10px] font-bold uppercase">{a.name.charAt(0)}</div>
                                                <span className="text-xs font-bold text-slate-700">{a.name}</span>
                                                <span className="text-[9px] text-indigo-600 font-bold ml-auto bg-indigo-100 px-2 py-0.5 rounded">ACTIVE</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Role Workflow Assignees */}
                            {task.useRoleWorkflow && task.roleAssignments && task.roleAssignments.length > 0 && (
                                <div className="space-y-3">
                                    {task.roleAssignments.map((ra, idx) => {
                                        const isActive = task.currentRoleIndex === idx;
                                        const isCompleted = ra.status === 'completed';
                                        return (
                                            <div key={ra._id || idx} className={`space-y-2 p-3 rounded-xl border ${isActive ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white ${isActive ? 'bg-indigo-600' : isCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`}>{idx + 1}</span>
                                                        {ra.role?.name || 'Role'}
                                                    </span>
                                                    {isActive && <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">ACTIVE</span>}
                                                    {isCompleted && <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">DONE</span>}
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 pl-5">
                                                    {ra.assignees?.map(a => (
                                                        <span key={a._id} className={`text-[10px] items-center gap-1 font-medium px-2 py-0.5 rounded border flex ${isActive ? 'bg-white border-indigo-100 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                                                            {a.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Sequential Workflow Assignees */}
                            {task.useSequentialWorkflow && task.sequentialAssignees && task.sequentialAssignees.length > 0 && (
                                <div className="space-y-3">
                                    {task.sequentialAssignees.map((sa, idx) => {
                                        const isActive = task.currentAssigneeIndex === idx;
                                        const isCompleted = sa.status === 'completed';
                                        return (
                                            <div key={sa._id || idx} className={`flex items-center justify-between p-3 rounded-xl border ${isActive ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white ${isActive ? 'bg-indigo-600' : isCompleted ? 'bg-emerald-500' : 'bg-slate-300'}`}>{idx + 1}</span>
                                                    <span className="text-xs font-bold text-slate-700">{sa.user?.name || 'User'}</span>
                                                </div>
                                                {isActive && <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">ACTIVE</span>}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                            
                            {(!task.assignees?.length && !task.roleAssignments?.length && !task.sequentialAssignees?.length) && (
                                <p className="text-xs text-slate-400 italic">No members assigned.</p>
                            )}
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 pb-3">Status</h3>
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-slate-400 uppercase block">Current Main Task Status</label>
                                <select 
                                    value={task.status?._id || task.status} 
                                    onChange={e => handleUpdateTaskStatus(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none cursor-pointer"
                                >
                                    {taskStatuses.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl shadow-sm">
                            <h3 className="text-indigo-800 font-bold text-sm mb-2">Task Sequence Info</h3>
                            <p className="text-indigo-600/80 text-xs leading-relaxed">
                                Complete all active subtasks listed here. Once the final subtask is completed, you will receive a prompt to mark the main authentication flow as complete automatically.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ProjectTaskDetails;
