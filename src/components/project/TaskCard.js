import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePermissions, PERMISSIONS } from '../../context/PermissionsContext';

const TaskCard = ({ task, level = 0, onEdit, onDelete, onAddSubtask }) => {
  const { state: authState } = useAuth();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const currentUserId = authState?.user?._id || authState?.user?.id;

  const getPriorityConfig = (p) => {
    const map = {
      urgent: { icon: '🔴', color: 'rose-600', bg: 'bg-rose-50', label: 'LEVEL_01_URGENT' },
      high: { icon: '🟠', color: 'amber-600', bg: 'bg-amber-50', label: 'LEVEL_02_HIGH' },
      medium: { icon: '🔵', color: 'indigo-600', bg: 'bg-indigo-50', label: 'LEVEL_03_MED' },
      low: { icon: '🟢', color: 'emerald-600', bg: 'bg-emerald-50', label: 'LEVEL_04_LOW' }
    };
    return map[p?.toLowerCase()] || { icon: '⚪', color: 'slate-400', bg: 'bg-slate-50', label: 'UNDEFINED' };
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
    <div className="italic">
      <div
        onClick={() => onEdit(task)}
        style={{ marginLeft: `${indent}px` }}
        className={`group bg-white rounded-3xl mb-3 border-2 transition-all duration-700 cursor-pointer overflow-hidden shadow-sm hover:shadow-24 hover:-translate-y-1 relative
          ${isActiveTurn ? 'border-indigo-600 ring-8 ring-indigo-50/50' : 'border-slate-50 hover:border-indigo-200'}`}
      >
        <div className={`absolute top-0 left-0 w-2 h-full transition-all duration-700 ${isActiveTurn ? 'bg-indigo-600 w-4' : 'bg-slate-200 group-hover:bg-indigo-400 group-hover:w-3'}`} />

        <div className="p-8 grid grid-cols-[auto_1fr_auto] gap-8 items-start relative z-10">
          {/* Task Identity Icon */}
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-24 transition-all duration-700 group-hover:rotate-12 group-hover:scale-110 shrink-0 border-4 border-white
            ${level > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-white'}`}>
            {level > 0 ? 'S' : 'T'}
          </div>

          <div className="min-w-0 pr-6 translate-y-1">
            <div className="flex items-center gap-6 mb-3">
              <h4 className="text-xl font-black text-slate-950 uppercase italic tracking-tighter truncate group-hover:text-indigo-600 transition-colors leading-none">{task.title}</h4>
              {isActiveTurn && <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg animate-pulse whitespace-nowrap">YOUR_TURN_CO</span>}
              <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] italic border-2 border-white/20 shadow-sm ${priority.bg} text-${priority.color} whitespace-nowrap`}>
                {priority.icon} {priority.label}
              </span>
            </div>

            {task.description && (
              <p className="text-[11px] font-black text-slate-400 leading-relaxed uppercase italic tracking-tight line-clamp-2 opacity-50 group-hover:opacity-100 transition-opacity"> {task.description} </p>
            )}

            <div className="flex flex-wrap items-center gap-6 mt-6 no-print">
              {task.status && (
                <span className="px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] italic border-2 border-slate-50 bg-white text-slate-950 shadow-sm group-hover:border-indigo-100 group-hover:shadow-24 transition-all" style={{ color: task.status.color }}>
                  <span className="w-2 h-2 rounded-full inline-block mr-3" style={{ backgroundColor: task.status.color }} /> {task.status.name?.toUpperCase()}
                </span>
              )}
              {task.assignees?.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-[1.5rem] border border-slate-100 group-hover:bg-white group-hover:border-indigo-50 transition-all max-w-[300px] truncate">
                  <span className="text-lg grayscale group-hover:grayscale-0 transition-all">👥</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic group-hover:text-slate-900 truncate">{task.assignees.map(a => a.name).join(', ').toUpperCase()}</span>
                </div>
              )}
              {task.duration && (
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-[1.5rem] border border-slate-100 italic">
                  <span className="text-lg opacity-40">⏱️</span>
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{task.duration}H_ALLOC</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex flex-col items-end gap-6 h-full justify-between">
            <div className="space-y-3 text-right">
              {task.dueDate && (
                <div className={`text-[9px] font-black uppercase tracking-[0.4em] italic flex items-center gap-3 justify-end px-5 py-2 rounded-2xl border-2 transition-all ${new Date(task.dueDate) < new Date() ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' : 'bg-slate-50 text-slate-400 border-slate-100 group-hover:text-indigo-600 group-hover:border-indigo-100'}`}>
                  <span>📅</span> {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex gap-4 opacity-0 group-hover:opacity-100 translate-x-10 group-hover:translate-x-0 transition-all duration-700">
              {(isSuperAdmin || hasPermission(PERMISSIONS.CREATE_TASK)) && (
                <button onClick={(e) => { e.stopPropagation(); onAddSubtask(task._id); }} className="w-12 h-12 flex items-center justify-center bg-white border-2 border-slate-100 rounded-full text-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:rotate-90 hover:scale-110 transition-all shadow-sm italic" title="ADD_SUB_PROTOCOL">+</button>
              )}
              {(isSuperAdmin || hasPermission(PERMISSIONS.EDIT_TASK)) && (
                <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="w-12 h-12 flex items-center justify-center bg-white border-2 border-slate-100 rounded-full text-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:rotate-12 hover:scale-110 transition-all shadow-sm italic" title="RE-ID_DIRECTIVE">✏️</button>
              )}
              {(isSuperAdmin || hasPermission(PERMISSIONS.DELETE_TASK)) && (
                <button onClick={(e) => { e.stopPropagation(); onDelete(task._id); }} className="w-12 h-12 flex items-center justify-center bg-white border-2 border-slate-100 rounded-full text-lg text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:-rotate-12 hover:scale-110 transition-all shadow-sm italic" title="PURGE_DIRECTIVE">🗑️</button>
              )}
            </div>
          </div>
        </div>

        {/* Progress Background Sweep */}
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/[0.03] rounded-full blur-[100px] pointer-events-none group-hover:opacity-100 opacity-0 transition-opacity duration-1000" />
      </div>

      {/* Sequential Workflow Indicator */}
      {task.useSequentialWorkflow && task.sequentialAssignees?.length > 0 && (
        <div style={{ marginLeft: `${indent + 50}px` }} className="mb-6 flex items-center gap-6 p-4 bg-slate-50/50 rounded-3xl border border-slate-100 animate-in slide-in-from-left-8 duration-1000">
          <span className="text-xl grayscale group-hover:grayscale-0 transition-all">🔄</span>
          <div className="flex flex-wrap items-center gap-4">
            {task.sequentialAssignees.map((sa, idx) => {
              const u = sa.user;
              const name = u.name || u.email || 'UNIT_ID_UNKNOWN';
              const isCurrent = idx === task.currentAssigneeIndex;
              const isPast = sa.status === 'completed';
              return (
                <React.Fragment key={idx}>
                  <div className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest italic flex items-center gap-3 transition-all
                      ${isCurrent ? 'bg-indigo-600 text-white shadow-lg animate-pulse scale-110 z-10' : isPast ? 'bg-emerald-50 text-emerald-600' : 'bg-white text-slate-300'}`}>
                    {isPast && <span>✓</span>}
                    {name.toUpperCase()}
                  </div>
                  {idx < task.sequentialAssignees.length - 1 && <span className="text-slate-200 text-xl font-black italic">»</span>}
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