import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCompany } from '../../../context/CompanyContext';

const TaskRowContent = ({ task, level, hasChildren, isExpanded, onToggleExpand, onSelect, isSelected, isDragging, taskCosts, companyCurrency, isDurationEntryMode, durationContext, pendingDurations, setPendingDurations, existingDurations, onOpenAssigneeModal, canViewCost, myDurations, onSetMyDuration, currentUserId }) => {
  const cost = taskCosts[task._id];
  const priorityColor = { urgent: 'bg-rose-500', high: 'bg-orange-500', medium: 'bg-amber-400', low: 'bg-emerald-500' }[task.priority] || 'bg-slate-300';
  const statusColor = task.status?.color ? { color: task.status.color, bg: `${task.status.color}10` } : { color: '#64748b', bg: '#f8fafc' };

  const gridClass = canViewCost 
    ? "grid grid-cols-[40px_1fr_120px_100px_140px_100px_80px_100px] gap-4 px-6 py-4 items-center" 
    : "grid grid-cols-[40px_1fr_120px_100px_140px_100px_80px] gap-4 px-6 py-4 items-center";

  return (
    <div
      onClick={onSelect}
      className={`${gridClass} cursor-pointer transition-colors relative group ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'}`}
    >
      {isSelected && <div className="absolute left-0 top-0 w-1 h-full bg-indigo-600 shadow-sm" />}

      <div className="flex justify-center" style={{ marginLeft: `${level * 20}px` }}>
        {hasChildren ? (
          <button
            onClick={e => { e.stopPropagation(); onToggleExpand(); }}
            className={`w-6 h-6 rounded flex items-center justify-center transition-all ${isExpanded ? 'bg-indigo-600 text-white rotate-90' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <span className="text-[8px]">▶</span>
          </button>
        ) : (
          <div className="w-1 h-4 rounded-full bg-slate-200 opacity-50" />
        )}
      </div>

      <div className="min-w-0 pr-4">
        <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors whitespace-normal break-words leading-5">
          {task.title}
          {task.children?.length > 0 && <span className="ml-2 text-[10px] font-medium text-slate-400">({task.children.length})</span>}
          {task.requirement && (
            <span className="ml-2 bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase ring-1 ring-emerald-100 italic" title={task.requirement.title}>
              REQ: {task.requirement.title}
            </span>
          )}
          {task.meeting && (
            <span className="ml-2 bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase ring-1 ring-indigo-100 italic" title={task.meeting.title}>
              MTG: {task.meeting.title}
            </span>
          )}
        </h4>
        <p 
          className="text-[10px] text-slate-500 mt-0.5 truncate"
          title={task.description?.replace(/<[^>]*>/g, '')}
        >
          {task.description?.replace(/<[^>]*>/g, '') || 'No description'}
        </p>
      </div>

      <div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight" style={{ backgroundColor: statusColor.bg, color: statusColor.color }}>
          {task.status?.name || 'Backlog'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${priorityColor}`} />
        <span className="text-[10px] font-medium text-slate-600 capitalize">{task.priority}</span>
      </div>

      <div
        onClick={e => {
          e.stopPropagation();
          onOpenAssigneeModal?.(task);
        }}
        className="flex -space-x-2 overflow-hidden items-center cursor-pointer"
        title="Manage members"
      >
        {task.assignees?.slice(0, 3).map((a, i) => (
          <div key={i} className="w-7 h-7 rounded-lg border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-700 shrink-0 shadow-sm overflow-hidden" title={a.name}>
            {a.avatar ? <img src={a.avatar} alt="" className="w-full h-full object-cover" /> : a.name?.charAt(0)}
          </div>
        ))}
        {(task.assignees?.length > 3) && <div className="w-7 h-7 rounded-lg border-2 border-white bg-slate-800 text-white flex items-center justify-center text-[8px] font-bold shrink-0">+{task.assignees.length - 3}</div>}
        {!task.assignees?.length && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onOpenAssigneeModal?.(task);
            }}
            className="w-7 h-7 rounded-lg border border-dashed border-indigo-300 bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold hover:bg-indigo-100 transition-colors"
            aria-label="Assign members"
            title="Assign members"
          >
            +
          </button>
        )}
      </div>

      <div className="text-[11px] font-medium text-slate-600 tabular-nums">
        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '--'}
      </div>

      <div className="text-center">
        {isDurationEntryMode && durationContext?.roleId ? (
          <input
            type="number" step="0.5"
            onClick={e => { e.stopPropagation(); e.target.select(); }}
            onChange={e => setPendingDurations({ ...pendingDurations, [task._id]: e.target.value })}
            className="w-12 py-1 bg-amber-50 border border-amber-300 rounded text-center text-xs font-bold text-amber-700 outline-none focus:bg-white"
            value={pendingDurations[task._id] !== undefined ? pendingDurations[task._id] : (existingDurations?.[task._id] ? +(existingDurations[task._id] / 60).toFixed(2) : '')}
          />
        ) : (
          (() => {
            const isAssigned = task.assignees?.some(a => (a._id || a) === currentUserId) || task.roleAssignments?.some(ra => ra.assignees?.some(a => (a._id || a) === currentUserId));
            if (!canViewCost && isAssigned) {
              const myMin = myDurations[task._id] || 0;
              const myHr = myMin > 0 ? +(myMin / 60).toFixed(2) : '';
              return (
                <div className="flex justify-center" onClick={e => e.stopPropagation()}>
                  <input
                    type="number" step="0.5" placeholder="0"
                    className="w-12 py-1 bg-slate-50 border border-slate-200 hover:border-indigo-300 focus:border-indigo-500 rounded text-center text-xs font-bold text-indigo-700 outline-none transition-colors"
                    defaultValue={myHr}
                    onBlur={e => {
                        const val = e.target.value;
                        if (val !== String(myHr)) onSetMyDuration(task._id, val);
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                    title="Your personal duration"
                  />
                  <span className="ml-1 text-[10px] text-slate-400 self-center">h</span>
                </div>
              );
            }
            return <span className="text-[11px] font-bold text-slate-400 tabular-nums">{task.duration?.value || '-'}h</span>;
          })()
        )}
      </div>

      {canViewCost && (
        <div className="text-right text-[11px] font-bold text-slate-700 tabular-nums">
          {cost ? new Intl.NumberFormat('en-US', { style: 'currency', currency: companyCurrency }).format(cost) : '-'}
        </div>
      )}
    </div>
  );
};

const SortableTaskRow = (props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.task._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };
  const hasChildren = props.task.children?.length > 0;

  return (
    <div ref={setNodeRef} style={style}>
      <div {...attributes} {...listeners}>
        <TaskRowContent {...props} isDragging={isDragging} hasChildren={hasChildren} />
      </div>
      {hasChildren && props.isExpanded && (
        <div className="bg-slate-50/30">
          {props.task.children.map(child => (
            <SortableTaskRow key={child._id} {...props} task={child} level={props.level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const ListView = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onAddSubtask,
  onOpenAssigneeModal,
  selectedTaskId,
  onSelectTask,
  onReorderTasks,
  taskCosts = {},
  teamActivity = [],
  isDurationEntryMode,
  durationContext,
  pendingDurations,
  setPendingDurations,
  existingDurations,
  canViewCost,
  myDurations = {},
  onSetMyDuration,
  currentUserId
}) => {
  const { state: companyState } = useCompany();
  const companyCurrency = companyState?.selectedCompany?.currency || 'USD';
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const buildTaskHierarchy = (tasks) => {
    const taskMap = new Map();
    const rootTasks = [];
    tasks.forEach(task => taskMap.set(task._id, { ...task, children: [] }));
    tasks.forEach(task => {
      if (task.parent) {
        const parentId = typeof task.parent === 'object' ? task.parent._id : task.parent;
        const parent = taskMap.get(parentId);
        if (parent) parent.children.push(taskMap.get(task._id));
        else rootTasks.push(taskMap.get(task._id));
      } else rootTasks.push(taskMap.get(task._id));
    });
    return rootTasks;
  };

  const hierarchicalTasks = buildTaskHierarchy(tasks);
  const toggleExpand = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) newExpanded.delete(taskId);
    else newExpanded.add(taskId);
    setExpandedTasks(newExpanded);
  };

  const handleDragStart = (e) => setActiveTask(tasks.find(t => t._id === e.active.id));
  const handleDragEnd = (e) => {
    setActiveTask(null);
    if (e.over && e.active.id !== e.over.id) {
      const oldIndex = tasks.findIndex(t => t._id === e.active.id);
      const newIndex = tasks.findIndex(t => t._id === e.over.id);
      if (onReorderTasks) onReorderTasks(arrayMove(tasks, oldIndex, newIndex));
    }
  };

  const gridClass = canViewCost 
    ? "grid grid-cols-[40px_1fr_120px_100px_140px_100px_80px_100px] gap-4 px-6 py-4 items-center" 
    : "grid grid-cols-[40px_1fr_120px_100px_140px_100px_80px] gap-4 px-6 py-4 items-center";

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveTask(null)}>
      <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
        <div className={`${gridClass} bg-slate-50 border-b border-slate-200`}>
          <div />
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Task Name</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Priority</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assignees</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Due Date</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Duration</div>
          {canViewCost && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Cost</div>}
        </div>

        <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
          <div className="divide-y divide-slate-100 min-h-[400px]">
            {tasks.length === 0 ? (
              <div className="py-24 text-center space-y-4">
                <div className="text-4xl">📋</div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">No tasks found</h4>
                  <p className="text-xs text-slate-500">Add a task to get started on your project.</p>
                </div>
              </div>
            ) : (
              hierarchicalTasks.map(task => (
                <SortableTaskRow
                  key={task._id}
                  task={task}
                  level={0}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onAddSubtask={onAddSubtask}
                  isSelected={selectedTaskId === task._id}
                  onSelect={() => onSelectTask(task)}
                  isExpanded={expandedTasks.has(task._id)}
                  onToggleExpand={() => toggleExpand(task._id)}
                  taskCosts={taskCosts}
                  companyCurrency={companyCurrency}
                  teamActivity={teamActivity}
                  isDurationEntryMode={isDurationEntryMode}
                  durationContext={durationContext}
                  pendingDurations={pendingDurations}
                  onOpenAssigneeModal={onOpenAssigneeModal}
                  canViewCost={canViewCost}
                  myDurations={myDurations}
                  onSetMyDuration={onSetMyDuration}
                  currentUserId={currentUserId}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="bg-white rounded-lg p-4 shadow-xl border border-indigo-200 flex items-center gap-4 cursor-grabbing">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <div className="text-sm font-bold text-slate-900">{activeTask.title}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default ListView;
