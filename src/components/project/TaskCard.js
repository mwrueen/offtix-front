import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePermissions, PERMISSIONS } from '../../context/PermissionsContext';

const TaskCard = ({ task, level = 0, onEdit, onDelete, onAddSubtask }) => {
  const { state: authState } = useAuth();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const currentUserId = authState?.user?._id || authState?.user?.id;

  const getPriorityConfig = (p) => {
    const map = {
      urgent: { icon: '!', color: 'rose-600', bg: 'bg-rose-50', label: 'CRITICAL' },
      high: { icon: '↑', color: 'rose-500', bg: 'bg-rose-50', label: 'HIGH' },
      medium: { icon: '-', color: 'indigo-600', bg: 'bg-indigo-50', label: 'MEDIUM' },
      low: { icon: '↓', color: 'slate-400', bg: 'bg-slate-50', label: 'LOW' }
    };
    return map[p?.toLowerCase()] || { icon: '?', color: 'slate-300', bg: 'bg-slate-50', label: 'PENDING' };
  };

  const priority = getPriorityConfig(task.priority);
  const indent = level * 32;

  const isCurrentActiveAssignee = () => {
    if (!currentUserId || !task.useSequentialWorkflow || !task.sequentialAssignees) return false;
    const ca = task.sequentialAssignees[task.currentAssigneeIndex];
    if (!ca) return false;
    const auid = ca.user._id || ca.user;
    return auid.toString() === currentUserId.toString();
  };

  const isActiveTurn = isCurrentActiveAssignee();

  return (
    <div className="font-sans">
      <div
        onClick={() => onEdit(task)}
        className={`ml-[${indent}px] group bg-white rounded-[2rem] mb-4 border-2 transition-all duration-500 cursor-pointer overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 relative
          ${isActiveTurn ? 'border-indigo-600 ring-8 ring-indigo-50/50' : 'border-slate-50 hover:border-indigo-100'}`}
      >
        <div className={`absolute top-0 left-0 w-1.5 h-full transition-all duration-500 ${isActiveTurn ? 'bg-indigo-600 w-3' : 'bg-slate-200 group-hover:bg-indigo-400'}`} />

        <div className="p-8 grid grid-cols-[auto_1fr_auto] gap-8 items-start relative z-10">
          {/* Task Identity Icon */}
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shadow-lg transition-all duration-500 group-hover:scale-110 shrink-0 border-2 border-white
            ${level > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>
            {level > 0 ? 'SUB' : 'TASK'}
          </div>

          <div className="min-w-0 pr-6">
            <div className="flex flex-wrap items-center gap-4 mb-2">
              <h4 className="text-lg font-bold text-slate-900 uppercase italic tracking-tight truncate group-hover:text-indigo-600 transition-colors leading-tight">{task.title}</h4>
              {isActiveTurn && <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[8px] font-bold uppercase tracking-widest shadow-md animate-pulse whitespace-nowrap italic">Active Assignment</span>}
              <span className={`px-3 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest italic border border-slate-100 shadow-sm ${priority.bg} ${priority.color} whitespace-nowrap`}>
                <span className="mr-1">{priority.icon}</span> {priority.label}
              </span>
            </div>

            {task.description && (
              <p className="text-[11px] font-medium text-slate-400 leading-relaxed italic line-clamp-2 opacity-70 group-hover:opacity-100 transition-opacity"> {task.description} </p>
            )}

            <div className="flex flex-wrap items-center gap-6 mt-6 no-print">
              {task.status && (
                <span className="px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest italic border border-slate-100 bg-white text-slate-950 shadow-sm group-hover:border-indigo-100 transition-all flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: task.status.color }} /> {task.status.name}
                </span>
              )}
              {task.assignees?.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl group-hover:bg-white transition-all max-w-[300px] truncate">
                  <span className="text-sm">👥</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic group-hover:text-slate-900 truncate">{task.assignees.map(a => a.name).join(', ')}</span>
                </div>
              )}
              {task.duration && (
                <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl italic group-hover:bg-white transition-all">
                  <span className="text-sm opacity-40">⏱️</span>
                  <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">{task.duration}h Estimated</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex flex-col items-end gap-6 h-full justify-between">
            <div className="space-y-3 text-right">
              {task.dueDate && (
                <div className={`text-[9px] font-bold uppercase tracking-widest italic flex items-center gap-3 justify-end px-4 py-1.5 rounded-xl border transition-all ${new Date(task.dueDate) < new Date() ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' : 'bg-slate-50 text-slate-400 border-slate-100 group-hover:text-indigo-600 group-hover:border-indigo-100'}`}>
                  <span>📅</span> {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
              )}
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
              {(isSuperAdmin || hasPermission(PERMISSIONS.CREATE_TASK)) && (
                <button onClick={(e) => { e.stopPropagation(); onAddSubtask(task._id); }} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-400 hover:scale-110 transition-all shadow-sm" title="Add Subtask">+</button>
              )}
              {(isSuperAdmin || hasPermission(PERMISSIONS.EDIT_TASK)) && (
                <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-400 hover:scale-110 transition-all shadow-sm" title="Edit Task">✏️</button>
              )}
              {(isSuperAdmin || hasPermission(PERMISSIONS.DELETE_TASK)) && (
                <button onClick={(e) => { e.stopPropagation(); onDelete(task._id); }} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-lg text-slate-400 hover:text-rose-600 hover:border-rose-400 hover:scale-110 transition-all shadow-sm" title="Delete Task">🗑️</button>
              )}
            </div>
          </div>
        </div>

        {/* Progress Background Sweep */}
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/[0.02] rounded-full blur-3xl pointer-events-none group-hover:opacity-100 opacity-0 transition-opacity duration-1000" />
      </div>

      {/* Sequential Workflow Indicator */}
      {task.useSequentialWorkflow && task.sequentialAssignees?.length > 0 && (
        <div className={`ml-[${indent + 48}px] mb-6 flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 animate-in slide-in-from-left-4 duration-700`}>
          <span className="text-xl">🔄</span>
          <div className="flex flex-wrap items-center gap-3">
            {task.sequentialAssignees.map((sa, idx) => {
              const u = sa.user;
              const name = u.name || u.email || 'Unknown Entity';
              const isCurrent = idx === task.currentAssigneeIndex;
              const isPast = sa.status === 'completed';
              return (
                <React.Fragment key={idx}>
                  <div className={`px-4 py-1.5 rounded-xl text-[8px] font-bold uppercase tracking-widest italic flex items-center gap-2 transition-all
                      ${isCurrent ? 'bg-indigo-600 text-white shadow-lg animate-pulse scale-105 z-10' : isPast ? 'bg-emerald-50 text-emerald-600' : 'bg-white text-slate-300'}`}>
                    {isPast && <span>✓</span>}
                    {name}
                  </div>
                  {idx < task.sequentialAssignees.length - 1 && <span className="text-slate-200 font-bold">»</span>}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Recursive Subtasks Rendering */}
      {task.subtasks && task.subtasks.map(st => (
        <TaskCard key={st._id} task={st} level={level + 1} onEdit={onEdit} onDelete={onDelete} onAddSubtask={onAddSubtask} />
      ))}
    </div>
  );
};

export default TaskCard;