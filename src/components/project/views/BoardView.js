import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const BoardView = ({ tasks, taskStatuses, onEditTask, onDeleteTask, onAddSubtask, onUpdateTaskStatus }) => {
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Build task hierarchy and filter only parent tasks for board view
  const buildTaskHierarchy = (tasks) => {
    const taskMap = new Map();
    const parentTasks = [];

    // Create map of all tasks
    tasks.forEach(task => {
      taskMap.set(task._id, { ...task, children: [] });
    });

    // Build hierarchy
    tasks.forEach(task => {
      if (task.parent) {
        const parentId = typeof task.parent === 'object' ? task.parent._id : task.parent;
        const parent = taskMap.get(parentId);
        if (parent) {
          parent.children.push(taskMap.get(task._id));
        } else {
          parentTasks.push(taskMap.get(task._id));
        }
      } else {
        parentTasks.push(taskMap.get(task._id));
      }
    });

    return parentTasks;
  };

  const hierarchicalTasks = buildTaskHierarchy(tasks);

  const getTasksByStatus = (statusId) => {
    return hierarchicalTasks.filter(task => task.status?._id === statusId);
  };

  const getUnassignedTasks = () => {
    return hierarchicalTasks.filter(task => !task.status);
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t._id === active.id);
    setActiveTask(task);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id;
    const overId = over.id;

    // Check if dropped over a status column
    const targetStatus = taskStatuses.find(s => s._id === overId);

    if (targetStatus) {
      // Update task status
      if (onUpdateTaskStatus) {
        onUpdateTaskStatus(taskId, targetStatus._id);
      }
    } else if (overId === 'unassigned') {
      // Remove status
      if (onUpdateTaskStatus) {
        onUpdateTaskStatus(taskId, null);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  // Create containers for all statuses
  const containers = [
    'unassigned',
    ...taskStatuses.map(s => s._id)
  ];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div style={{
        backgroundColor: '#ffffff',
        padding: '20px',
        borderRadius: '3px',
        minHeight: 'calc(100vh - 200px)',
        height: 'calc(100vh - 200px)',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          height: '100%',
          paddingBottom: '8px'
        }}>
          {/* Unassigned Column */}
          <StatusColumn
            id="unassigned"
            title="Backlog"
            tasks={getUnassignedTasks()}
            color="#6b7280"
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onAddSubtask={onAddSubtask}
          />

          {/* Status Columns */}
          {taskStatuses.map(status => (
            <StatusColumn
              key={status._id}
              id={status._id}
              title={status.name}
              tasks={getTasksByStatus(status._id)}
              color={status.color || '#6b7280'}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onAddSubtask={onAddSubtask}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div style={{ opacity: 0.9, transform: 'rotate(3deg)' }}>
            <TaskCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

const StatusColumn = ({ id, title, tasks, color, onEditTask, onDeleteTask, onAddSubtask }) => {
  const { setNodeRef, isOver } = useSortable({
    id: id,
    data: {
      type: 'column',
    },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        backgroundColor: isOver ? '#f0f6ff' : '#f4f5f7',
        borderRadius: '3px',
        minWidth: '300px',
        maxWidth: '300px',
        border: isOver ? '2px dashed #0052cc' : '2px solid transparent',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 200px)'
      }}
    >
      <div style={{
        padding: '14px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0
      }}>
        <span style={{
          fontSize: '12px',
          fontWeight: '700',
          color: '#5e6c84',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          flex: 1
        }}>
          {title}
        </span>
        <span style={{
          fontSize: '11px',
          color: '#5e6c84',
          backgroundColor: '#dfe1e6',
          padding: '3px 8px',
          borderRadius: '12px',
          fontWeight: '700'
        }}>
          {tasks.length}
        </span>
      </div>

      <SortableContext
        items={tasks.map(t => t._id)}
        strategy={verticalListSortingStrategy}
      >
        <div style={{
          padding: '0 8px 8px 8px',
          overflowY: 'auto',
          flex: 1
        }}>
          {tasks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: '#a8b1bd',
              fontSize: '12px',
              fontStyle: 'italic'
            }}>
              Drop issues here
            </div>
          ) : (
            tasks.map(task => (
              <SortableTaskCard
                key={task._id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onAddSubtask={onAddSubtask}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

const SortableTaskCard = ({ task, onEdit, onDelete, onAddSubtask }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddSubtask={onAddSubtask}
        isDragging={isDragging}
      />
    </div>
  );
};

const TaskCard = ({ task, onEdit, onDelete, onAddSubtask, isDragging }) => {
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#de350b',
      high: '#ff8b00',
      medium: '#ffab00',
      low: '#36b37e'
    };
    return colors[priority] || '#6b7280';
  };

  const getIssueTypeIcon = (type) => {
    const types = {
      task: { icon: '✓', color: '#0052cc', bg: '#deebff' },
      bug: { icon: '🐛', color: '#de350b', bg: '#ffebe6' },
      story: { icon: '📖', color: '#00875a', bg: '#e3fcef' },
      epic: { icon: '⚡', color: '#6554c0', bg: '#eae6ff' }
    };
    return types[type] || types.task;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = [
      '#0052cc', '#5243aa', '#ff5630', '#ff8b00',
      '#36b37e', '#00b8d9', '#6554c0', '#ff991f'
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const issueType = getIssueTypeIcon(task.issueType || 'task');
  const hasSubtasks = task.children && task.children.length > 0;
  const completedSubtasks = hasSubtasks ? task.children.filter(child => child.status?.name?.toLowerCase() === 'done').length : 0;

  return (
    <div
      onClick={() => onEdit(task)}
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #dfe1e6',
        borderRadius: '3px',
        padding: '10px 12px',
        marginBottom: '8px',
        cursor: isDragging ? 'grabbing' : 'pointer',
        boxShadow: isDragging ? '0 8px 16px rgba(9, 30, 66, 0.25)' : '0 1px 2px rgba(9, 30, 66, 0.08)',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(9, 30, 66, 0.15)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(9, 30, 66, 0.08)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {/* Issue Type Icon + Title */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        marginBottom: '8px'
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          backgroundColor: issueType.bg,
          borderRadius: '3px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          flexShrink: 0,
          marginTop: '2px'
        }}>
          {issueType.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#172b4d',
            lineHeight: '1.4',
            marginBottom: '4px'
          }}>
            {task.title}
          </div>

          {task.description && (
            <div style={{
              fontSize: '12px',
              color: '#5e6c84',
              lineHeight: '1.4',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {task.description}
            </div>
          )}
        </div>

        {/* Priority Indicator */}
        {task.priority && (
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: getPriorityColor(task.priority),
            flexShrink: 0,
            marginTop: '6px',
            boxShadow: `0 0 0 2px ${getPriorityColor(task.priority)}20`
          }} />
        )}
      </div>

      {/* Subtasks Progress */}
      {hasSubtasks && (
        <div style={{
          marginTop: '10px',
          marginBottom: '10px',
          padding: '6px 8px',
          backgroundColor: '#f4f5f7',
          borderRadius: '3px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            fontSize: '11px',
            color: '#5e6c84',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>↳</span>
            <span>{completedSubtasks}/{task.children.length}</span>
          </div>
          <div style={{
            flex: 1,
            height: '4px',
            backgroundColor: '#dfe1e6',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${task.children.length > 0 ? (completedSubtasks / task.children.length) * 100 : 0}%`,
              height: '100%',
              backgroundColor: '#36b37e',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      {/* Footer: Due Date + Assignees */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px solid #f4f5f7'
      }}>
        {/* Due Date */}
        <div style={{ fontSize: '11px', color: '#5e6c84', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {task.dueDate ? (
            <>
              <span>📅</span>
              <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </>
          ) : (
            <span style={{ opacity: 0.5 }}>No due date</span>
          )}
        </div>

        {/* Assignees */}
        {task.assignees && task.assignees.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '-4px'
          }}>
            {task.assignees.slice(0, 3).map((assignee, index) => (
              <div key={assignee._id || index} style={{ marginLeft: index > 0 ? '-6px' : '0' }}>
                <AssigneeAvatar assignee={assignee} />
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#f4f5f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                fontWeight: '700',
                color: '#5e6c84',
                border: '2px solid white',
                marginLeft: '-6px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AssigneeAvatar = ({ assignee }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = [
      '#0052cc', '#5243aa', '#ff5630', '#ff8b00',
      '#36b37e', '#00b8d9', '#6554c0', '#ff991f'
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        backgroundColor: getAvatarColor(assignee.name),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '11px',
        fontWeight: '600',
        border: '2px solid white',
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
      }}>
        {getInitials(assignee.name)}
      </div>

      {showTooltip && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
          backgroundColor: '#172b4d',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          zIndex: 1000,
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          pointerEvents: 'none'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '2px' }}>
            {assignee.name}
          </div>
          {assignee.email && (
            <div style={{ fontSize: '11px', opacity: 0.9 }}>
              {assignee.email}
            </div>
          )}
          {assignee.role && (
            <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>
              {assignee.role}
            </div>
          )}
          {/* Tooltip arrow */}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #172b4d'
          }} />
        </div>
      )}
    </div>
  );
};

export default BoardView;