import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  @keyframes slideDown {
    from {
      opacity: 0;
      max-height: 0;
    }
    to {
      opacity: 1;
      max-height: 1000px;
    }
  }
`;
if (!document.head.querySelector('style[data-listview-animations]')) {
  style.setAttribute('data-listview-animations', 'true');
  document.head.appendChild(style);
}

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || amount === 0) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const ListView = ({ tasks, onEditTask, onDeleteTask, onAddSubtask, selectedTaskId, onSelectTask, onReorderTasks, taskCosts = {} }) => {
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [activeTask, setActiveTask] = useState(null);

  // Setup sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Build task hierarchy
  const buildTaskHierarchy = (tasks) => {
    const taskMap = new Map();
    const rootTasks = [];
    
    // First pass: create map of all tasks
    tasks.forEach(task => {
      taskMap.set(task._id, { ...task, children: [] });
    });
    
    // Second pass: build hierarchy
    tasks.forEach(task => {
      if (task.parent) {
        const parentId = typeof task.parent === 'object' ? task.parent._id : task.parent;
        const parent = taskMap.get(parentId);
        if (parent) {
          parent.children.push(taskMap.get(task._id));
        } else {
          rootTasks.push(taskMap.get(task._id));
        }
      } else {
        rootTasks.push(taskMap.get(task._id));
      }
    });
    
    return rootTasks;
  };
  
  const hierarchicalTasks = buildTaskHierarchy(tasks);
  
  const toggleExpand = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };
  
  const countSubtasks = (task) => {
    if (!task.children || task.children.length === 0) return 0;
    return task.children.length + task.children.reduce((sum, child) => sum + countSubtasks(child), 0);
  };

  // Handle drag start
  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t._id === active.id);
    setActiveTask(task);
  };

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task._id === active.id);
      const newIndex = tasks.findIndex((task) => task._id === over.id);

      const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);

      // Call the parent component's reorder handler
      if (onReorderTasks) {
        onReorderTasks(reorderedTasks);
      }
    }
  };

  // Handle drag cancel
  const handleDragCancel = () => {
    setActiveTask(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #dfe1e6',
        borderRadius: '3px',
        boxShadow: '0 1px 2px rgba(9, 30, 66, 0.08)',
        overflow: 'hidden'
      }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '2px solid #dfe1e6',
        backgroundColor: '#f4f5f7',
        display: 'grid',
        gridTemplateColumns: '40px minmax(350px, 3fr) 140px 120px 160px 100px 100px',
        gap: '12px',
        fontSize: '11px',
        fontWeight: '700',
        color: '#5e6c84',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        alignItems: 'center'
      }}>
        <div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Issue
          {tasks.length > 0 && (
            <span style={{
              backgroundColor: '#0052cc',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: '700',
              textTransform: 'none'
            }}>
              {tasks.length}
            </span>
          )}
        </div>
        <div>Status</div>
        <div>Priority</div>
        <div>Assignees</div>
        <div>Due Date</div>
        <div>Cost</div>
      </div>

      {/* Task List */}
      <SortableContext
        items={tasks.map(t => t._id)}
        strategy={verticalListSortingStrategy}
      >
        <div>
          {tasks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 24px',
              color: '#5e6c84',
              backgroundColor: '#fafbfc'
            }}>
              <div style={{
                fontSize: '64px',
                marginBottom: '20px',
                opacity: 0.5
              }}>📋</div>
              <h4 style={{
                margin: '0 0 12px 0',
                fontSize: '18px',
                color: '#172b4d',
                fontWeight: '600'
              }}>No issues yet</h4>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#5e6c84',
                lineHeight: '1.6'
              }}>Create an issue to get started with your project tracking.</p>
            </div>
          ) : (
            <div>
              {hierarchicalTasks.map(task => (
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
                  countSubtasks={countSubtasks}
                  taskCosts={taskCosts}
                />
              ))}
            </div>
          )}
        </div>
      </SortableContext>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div style={{ opacity: 0.9, cursor: 'grabbing' }}>
            <TaskListRowContent task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

// Sortable wrapper for TaskRow
const SortableTaskRow = ({ task, level, onEdit, onDelete, onAddSubtask, isSelected, onSelect, isExpanded, onToggleExpand, countSubtasks, taskCosts = {} }) => {
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

  const hasChildren = task.children && task.children.length > 0;
  const subtaskCount = countSubtasks(task);
  const indent = level * 24;
  const cost = taskCosts[task._id];

  return (
    <div ref={setNodeRef} style={style}>
      <div {...attributes} {...listeners}>
        <TaskListRow
          task={task}
          level={level}
          indent={indent}
          hasChildren={hasChildren}
          subtaskCount={subtaskCount}
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSubtask={onAddSubtask}
          isSelected={isSelected}
          onSelect={onSelect}
          isDragging={isDragging}
          cost={cost}
        />
      </div>

      {/* Render children if expanded */}
      {hasChildren && isExpanded && (
        <div style={{
          animation: 'slideDown 0.2s ease-out',
          overflow: 'hidden'
        }}>
          {task.children.map(child => (
            <SortableTaskRow
              key={child._id}
              task={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubtask={onAddSubtask}
              isSelected={isSelected}
              onSelect={onSelect}
              isExpanded={isExpanded}
              onToggleExpand={onToggleExpand}
              countSubtasks={countSubtasks}
              taskCosts={taskCosts}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TaskListRow = ({ task, level, indent, hasChildren, subtaskCount, isExpanded, onToggleExpand, onEdit, onDelete, onAddSubtask, isSelected, onSelect, isDragging, cost }) => {
  return (
    <TaskListRowContent
      task={task}
      level={level}
      indent={indent}
      hasChildren={hasChildren}
      subtaskCount={subtaskCount}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
      onEdit={onEdit}
      onDelete={onDelete}
      onAddSubtask={onAddSubtask}
      isSelected={isSelected}
      onSelect={onSelect}
      isDragging={isDragging}
      cost={cost}
    />
  );
};

const TaskListRowContent = ({ task, level, indent, hasChildren, subtaskCount, isExpanded, onToggleExpand, onEdit, onDelete, onAddSubtask, isSelected, onSelect, isDragging, cost }) => {
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#de350b',
      high: '#ff8b00',
      medium: '#ffab00',
      low: '#36b37e'
    };
    return colors[priority] || '#6b7280';
  };

  const getStatusColor = (status) => {
    if (!status || !status.color) {
      return { bg: '#f3f4f6', text: '#6b7280' };
    }
    return {
      bg: status.color + '20',
      text: status.color
    };
  };

  const getIssueTypeIcon = (type) => {
    const types = {
      task: { icon: '✓', color: '#0052cc', bg: '#deebff' },
      bug: { icon: '🐛', color: '#de350b', bg: '#ffebe6' },
      story: { icon: '📖', color: '#00875a', bg: '#e3fcef' },
      epic: { icon: '⚡', color: '#6554c0', bg: '#eae6ff' },
      subtask: { icon: '↳', color: '#5e6c84', bg: '#f4f5f7' }
    };
    return types[type] || (level > 0 ? types.subtask : types.task);
  };

  const statusColor = getStatusColor(task.status);
  const issueType = getIssueTypeIcon(task.issueType || (level > 0 ? 'subtask' : 'task'));
  const priorityColor = getPriorityColor(task.priority);

  return (
    <div
      onClick={onSelect}
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid #f4f5f7',
        display: 'grid',
        gridTemplateColumns: '40px minmax(350px, 3fr) 140px 120px 160px 100px 100px',
        gap: '12px',
        alignItems: 'center',
        backgroundColor: isSelected ? '#f0f6ff' : 'white',
        borderLeft: isSelected ? '3px solid #0052cc' : '3px solid transparent',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'all 0.15s ease-in-out',
        boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
      }}
      onMouseEnter={(e) => {
        if (!isSelected && !isDragging) {
          e.currentTarget.style.backgroundColor = '#fafbfc';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected && !isDragging) {
          e.currentTarget.style.backgroundColor = 'white';
        }
      }}
    >
      {/* Expand/Collapse + Type Icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: `${indent}px` }}>
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#5e6c84',
              fontSize: '12px',
              transition: 'transform 0.2s'
            }}
          >
            <span style={{ 
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              display: 'inline-block'
            }}>
              ▶
            </span>
          </button>
        )}
        <div style={{
          width: '20px',
          height: '20px',
          backgroundColor: issueType.bg,
          borderRadius: '3px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          marginLeft: hasChildren ? '0' : '18px'
        }}>
          {issueType.icon}
        </div>
      </div>

      {/* Title + Subtask Count */}
      <div style={{ minWidth: 0 }}>
        <div style={{ 
          fontWeight: '500', 
          color: '#172b4d', 
          fontSize: '14px',
          marginBottom: '4px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {task.title}
          {subtaskCount > 0 && (
            <span style={{
              fontSize: '11px',
              color: '#5e6c84',
              backgroundColor: '#f4f5f7',
              padding: '2px 6px',
              borderRadius: '10px',
              fontWeight: '600'
            }}>
              {subtaskCount} subtask{subtaskCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {task.description && (
          <div style={{ 
            fontSize: '12px', 
            color: '#5e6c84', 
            lineHeight: '1.4',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {task.description}
          </div>
        )}
      </div>

      {/* Status */}
      <div>
        {task.status && (
          <span style={{
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            backgroundColor: statusColor.bg,
            color: statusColor.text,
            textTransform: 'uppercase',
            display: 'inline-block'
          }}>
            {task.status.name}
          </span>
        )}
      </div>

      {/* Priority */}
      <div>
        {task.priority && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: priorityColor
            }} />
            <span style={{ fontSize: '12px', textTransform: 'capitalize', color: '#172b4d' }}>
              {task.priority}
            </span>
          </div>
        )}
      </div>

      {/* Assignees */}
      <AssigneeList assignees={task.assignees} />

      {/* Due Date */}
      <div style={{ fontSize: '12px', color: '#5e6c84' }}>
        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
      </div>

      {/* Cost */}
      <div style={{ fontSize: '12px', color: cost ? '#059669' : '#a8b1bd', fontWeight: cost ? '600' : '400' }}>
        {formatCurrency(cost)}
      </div>
    </div>
  );
};

const AssigneeList = ({ assignees }) => {
  if (!assignees || assignees.length === 0) {
    return <div style={{ fontSize: '12px', color: '#a8b1bd', fontStyle: 'italic' }}>Unassigned</div>;
  }

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
    <div style={{ display: 'flex', alignItems: 'center', gap: '-4px' }}>
      {assignees.slice(0, 3).map((assignee, index) => (
        <AssigneeAvatar
          key={assignee._id || index}
          assignee={assignee}
          getInitials={getInitials}
          getAvatarColor={getAvatarColor}
          style={{ marginLeft: index > 0 ? '-6px' : '0' }}
        />
      ))}
      {assignees.length > 3 && (
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: '#f4f5f7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: '600',
          color: '#5e6c84',
          border: '2px solid white',
          marginLeft: '-6px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}>
          +{assignees.length - 3}
        </div>
      )}
    </div>
  );
};

const AssigneeAvatar = ({ assignee, getInitials, getAvatarColor, style }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-block', ...style }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        backgroundColor: getAvatarColor(assignee.name),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '10px',
        fontWeight: '600',
        border: '2px solid white',
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        transition: 'transform 0.15s ease-in-out'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
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
          pointerEvents: 'none',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '2px' }}>
            {assignee.name}
          </div>
          {assignee.email && (
            <div style={{ fontSize: '11px', opacity: 0.9 }}>
              {assignee.email}
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

export default ListView;

