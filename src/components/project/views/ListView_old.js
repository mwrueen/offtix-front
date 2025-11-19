import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Add CSS animation for tooltip fade-in
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
      max-height: 500px;
    }
  }
`;
if (!document.head.querySelector('style[data-listview-animations]')) {
  style.setAttribute('data-listview-animations', 'true');
  document.head.appendChild(style);
}

const ListView = ({ tasks, onEditTask, onDeleteTask, onAddSubtask, selectedTaskId, onSelectTask, onReorderTasks }) => {
  // Build task hierarchy
  const [expandedTasks, setExpandedTasks] = useState(new Set());

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
        const parent = taskMap.get(task.parent._id || task.parent);
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

  const handleDragEnd = (event) => {
    const { active, over } = event;

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

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e1e4e8',
      borderRadius: '6px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      overflow: 'hidden'
    }}>
      {/* Header with task count */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '2px solid #e1e4e8',
        backgroundColor: '#fafbfc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '32px 48px minmax(300px, 2fr) 140px 120px 140px 120px',
          gap: '16px',
          fontSize: '11px',
          fontWeight: '700',
          color: '#57606a',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          flex: 1
        }}>
          <div></div>
          <div>Type</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Title
            {tasks.length > 0 && (
              <span style={{
                backgroundColor: '#0969da',
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
          <div>Assignee</div>
          <div>Due Date</div>
        </div>
      </div>

      <div>
        {tasks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 24px',
            color: '#57606a',
            backgroundColor: '#fafbfc'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '20px',
              opacity: 0.6
            }}>📋</div>
            <h4 style={{
              margin: '0 0 12px 0',
              fontSize: '18px',
              color: '#24292f',
              fontWeight: '600'
            }}>No issues yet</h4>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: '#57606a',
              lineHeight: '1.6'
            }}>Create an issue to get started with your project tracking.</p>
          </div>
        ) : (
          <div>
            {hierarchicalTasks.map(task => (
              <TaskRow
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SortableTaskListRow = ({ task, onEdit, onDelete, onAddSubtask, isSelected, onSelect }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#d73527',
      high: '#ff8b00',
      medium: '#ffab00',
      low: '#36b37e'
    };
    return colors[priority] || '#6b7280';
  };

  const getStatusColor = (status) => {
    if (!status || !status.color) {
      return { bg: '#f3f4f6', text: '#374151' };
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
      epic: { icon: '⚡', color: '#6554c0', bg: '#eae6ff' }
    };
    return types[type] || types.task;
  };

  const statusColor = getStatusColor(task.status);
  const issueType = getIssueTypeIcon(task.issueType || 'task');

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        padding: '16px 20px',
        borderBottom: '1px solid #e1e4e8',
        display: 'grid',
        gridTemplateColumns: '32px 48px minmax(300px, 2fr) 140px 120px 140px 120px',
        gap: '16px',
        alignItems: 'center',
        fontSize: '14px',
        cursor: isDragging ? 'grabbing' : 'pointer',
        backgroundColor: isSelected ? '#f0f6ff' : 'white',
        borderLeft: isSelected ? '4px solid #0969da' : '4px solid transparent',
        transition: 'all 0.15s ease-in-out',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        if (!isSelected && !isDragging) {
          e.currentTarget.style.backgroundColor = '#f6f8fa';
          e.currentTarget.style.borderLeftColor = '#d0d7de';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.borderLeftColor = 'transparent';
        }
      }}
    >
      <div
        {...attributes}
        {...listeners}
        style={{
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#8c959f',
          fontSize: '18px',
          userSelect: 'none',
          opacity: 0.6,
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
      >
        ⋮⋮
      </div>

      <div
        onClick={onSelect}
        style={{
          width: '28px',
          height: '28px',
          backgroundColor: issueType.bg,
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          border: `1px solid ${issueType.color}20`,
          transition: 'transform 0.15s ease-in-out'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {issueType.icon}
      </div>

      <div onClick={onSelect} style={{ minWidth: 0 }}>
        <div style={{
          fontWeight: '600',
          color: '#24292f',
          marginBottom: '6px',
          fontSize: '14px',
          lineHeight: '1.4',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {task.title}
        </div>
        {task.description && (
          <div style={{
            fontSize: '13px',
            color: '#57606a',
            lineHeight: '1.5',
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

      <div onClick={onSelect}>
        {task.status && (
          <span style={{
            padding: '6px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: statusColor.bg,
            color: statusColor.text,
            textTransform: 'capitalize',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            border: `1px solid ${statusColor.text}30`,
            transition: 'all 0.15s ease-in-out'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: statusColor.text
            }} />
            {task.status.name}
          </span>
        )}
      </div>

      <div onClick={onSelect}>
        {task.priority && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 10px',
            borderRadius: '6px',
            backgroundColor: `${getPriorityColor(task.priority)}10`,
            border: `1px solid ${getPriorityColor(task.priority)}30`
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: getPriorityColor(task.priority),
              boxShadow: `0 0 0 2px ${getPriorityColor(task.priority)}20`
            }} />
            <span style={{
              fontSize: '12px',
              textTransform: 'capitalize',
              fontWeight: '600',
              color: getPriorityColor(task.priority)
            }}>
              {task.priority}
            </span>
          </div>
        )}
      </div>

      <div onClick={onSelect}>
        {task.assignees && task.assignees.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '-4px' }}>
            {task.assignees.slice(0, 3).map((assignee, index) => (
              <div key={assignee._id || index} style={{ marginLeft: index > 0 ? '-8px' : '0' }}>
                <AssigneeAvatar assignee={assignee} />
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#f6f8fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '700',
                color: '#57606a',
                border: '2px solid white',
                marginLeft: '-8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        ) : (
          <span style={{
            fontSize: '12px',
            color: '#8c959f',
            fontStyle: 'italic'
          }}>
            Unassigned
          </span>
        )}
      </div>

      <div onClick={onSelect}>
        {task.dueDate ? (
          <div style={{
            fontSize: '13px',
            color: '#24292f',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '14px' }}>📅</span>
            {new Date(task.dueDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: new Date(task.dueDate).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
            })}
          </div>
        ) : (
          <span style={{
            fontSize: '12px',
            color: '#8c959f',
            fontStyle: 'italic'
          }}>
            No due date
          </span>
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
        fontWeight: '700',
        border: '2px solid white',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
        transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.15)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.12)';
      }}
      >
        {getInitials(assignee.name)}
      </div>

      {showTooltip && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '12px',
          backgroundColor: '#24292f',
          color: 'white',
          padding: '10px 14px',
          borderRadius: '6px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          zIndex: 1000,
          boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <div style={{ fontWeight: '700', marginBottom: '4px', fontSize: '13px' }}>
            {assignee.name}
          </div>
          {assignee.email && (
            <div style={{ fontSize: '11px', opacity: 0.85, color: '#8c959f' }}>
              {assignee.email}
            </div>
          )}
          {assignee.role && (
            <div style={{
              fontSize: '10px',
              opacity: 0.75,
              marginTop: '4px',
              padding: '2px 6px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '3px',
              display: 'inline-block'
            }}>
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
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid #24292f'
          }} />
        </div>
      )}
    </div>
  );
};

export default ListView;