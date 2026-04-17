import React, { useState } from 'react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const BoardView = ({ tasks, taskStatuses, onEditTask, onDeleteTask, onAddSubtask, onUpdateTaskStatus, teamActivity = [] }) => {
  const [activeTask, setActiveTask] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const buildTaskHierarchy = (tasks) => {
    const taskMap = new Map();
    const parentTasks = [];
    tasks.forEach(task => taskMap.set(task._id, { ...task, children: [] }));
    tasks.forEach(task => {
      if (task.parent) {
        const parentId = typeof task.parent === 'object' ? task.parent._id : task.parent;
        const parent = taskMap.get(parentId);
        if (parent) parent.children.push(taskMap.get(task._id));
        else parentTasks.push(taskMap.get(task._id));
      } else parentTasks.push(taskMap.get(task._id));
    });
    return parentTasks;
  };

  const hierarchicalTasks = buildTaskHierarchy(tasks);
  const getTasksByStatus = (statusId) => hierarchicalTasks.filter(task => task.status?._id === statusId);
  const getUnassignedTasks = () => hierarchicalTasks.filter(task => !task.status);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;
    const targetStatus = taskStatuses.find(s => s._id === over.id);
    if (targetStatus && onUpdateTaskStatus) onUpdateTaskStatus(active.id, targetStatus._id);
    else if (over.id === 'unassigned' && onUpdateTaskStatus) onUpdateTaskStatus(active.id, null);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={e => setActiveTask(tasks.find(t => t._id === e.active.id))} onDragEnd={handleDragEnd} onDragCancel={() => setActiveTask(null)}>
      <div className="p-6 h-[calc(100vh-320px)] overflow-x-auto scrollbar-none">
        <div className="flex gap-6 h-full min-w-max pb-4">
          <StatusColumn id="unassigned" title="Backlog" tasks={getUnassignedTasks()} color="#94a3b8" onEditTask={onEditTask} />
          {taskStatuses.map(status => (
            <StatusColumn key={status._id} id={status._id} title={status.name} tasks={getTasksByStatus(status._id)} color={status.color || '#6366f1'} onEditTask={onEditTask} />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 scale-105 opacity-90 cursor-grabbing">
            <TaskCard task={activeTask} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

const StatusColumn = ({ id, title, tasks, color, onEditTask }) => {
  const { setNodeRef, isOver } = useSortable({ id, data: { type: 'column' } });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-80 rounded-2xl border transition-all duration-200 overflow-hidden ${isOver ? 'bg-slate-100 border-indigo-300 shadow-md ring-2 ring-indigo-100' : 'bg-slate-50 border-slate-200'}`}
    >
      <div className="p-4 flex items-center justify-between shrink-0 border-b border-slate-200 bg-white/50">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
        </div>
        <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-500 shadow-sm">{tasks.length}</span>
      </div>

      <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
        <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[100px]">
          {tasks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-40 py-12">
              <div className="text-3xl mb-2">📥</div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Empty</p>
            </div>
          ) : (
            tasks.map(task => (
              <SortableTaskCard key={task._id} task={task} onEdit={onEditTask} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

const SortableTaskCard = ({ task, onEdit }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id, data: { type: 'task', task } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onEdit={onEdit} isDragging={isDragging} />
    </div>
  );
};

const TaskCard = ({ task, onEdit, isDragging }) => {
  const priorityColor = { urgent: 'bg-rose-500', high: 'bg-orange-500', medium: 'bg-amber-400', low: 'bg-emerald-500' }[task.priority] || 'bg-slate-300';
  const hasSubtasks = task.children?.length > 0;
  const completed = hasSubtasks ? task.children.filter(c => c.status?.name?.toLowerCase() === 'done' || c.status?.name?.toLowerCase() === 'completed').length : 0;

  return (
    <div
      onClick={() => onEdit?.(task)}
      className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer relative group ${isDragging ? 'shadow-lg ring-2 ring-indigo-500' : ''}`}
    >
      <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${priorityColor}`} />

      <div className="flex justify-between items-start gap-4 mb-3 pl-1">
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase leading-tight">{task.title}</h4>
          <p 
            className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed"
            title={task.description?.replace(/<[^>]*>/g, '')}
          >
            {task.description?.replace(/<[^>]*>/g, '')}
          </p>
        </div>
        <div className={`shrink-0 w-2 h-2 rounded-full ${priorityColor}`} />
      </div>

      {hasSubtasks && (
        <div className="mt-4 space-y-1.5 pl-1">
          <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
            <span>Progress</span>
            <span>{completed}/{task.children.length}</span>
          </div>
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${(completed / task.children.length) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-50 pl-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">📅</span>
          <span className="text-[10px] font-medium text-slate-500">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}</span>
        </div>
        <div className="flex -space-x-1.5">
          {task.assignees?.slice(0, 3).map((a, i) => (
            <div key={i} className="w-6 h-6 rounded-md border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-700 shrink-0 shadow-sm overflow-hidden" title={a.name}>
              {a.avatar ? <img src={a.avatar} alt="" className="w-full h-full object-cover" /> : a.name?.charAt(0)}
            </div>
          ))}
          {task.assignees?.length > 3 && <div className="w-6 h-6 rounded-md border-2 border-white bg-slate-900 text-white flex items-center justify-center text-[8px] font-bold shrink-0">+{task.assignees.length - 3}</div>}
        </div>
      </div>
    </div>
  );
};

export default BoardView;