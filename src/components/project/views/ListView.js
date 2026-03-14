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
import { useCompany } from '../../../context/CompanyContext';

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0px rgba(16, 185, 129, 0.4); }
    70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
    100% { box-shadow: 0 0 0 0px rgba(16, 185, 129, 0); }
  }
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

const formatCurrency = (amount, currencyCode = 'USD') => {
  if (amount === undefined || amount === null || amount === 0) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};


const ListView = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onAddSubtask,
  selectedTaskId,
  onSelectTask,
  onReorderTasks,
  taskCosts = {},
  teamActivity = [],
  // Duration mode props
  isDurationEntryMode,
  durationContext,
  pendingDurations,
  setPendingDurations,
  // Filter props
  selectedAssignee,
  selectedTaskRole,
  selectedProjectRole
}) => {
  const { state: companyState } = useCompany();
  const companyCurrency = companyState?.selectedCompany?.currency || 'USD';

  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [activeTask, setActiveTask] = useState(null);

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '40px minmax(300px, 1fr) 120px 100px 160px 100px 80px 100px',
    gap: '12px',
    alignItems: 'center'
  };

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
          ...gridStyle,
          padding: '12px 16px',
          borderBottom: '2px solid #dfe1e6',
          backgroundColor: '#f4f5f7',
          fontSize: '11px',
          fontWeight: '700',
          color: '#5e6c84',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
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
          <div>Dur (h)</div>
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
                    companyCurrency={companyCurrency}
                    teamActivity={teamActivity}
                    // Duration mode props
                    isDurationEntryMode={isDurationEntryMode}
                    durationContext={durationContext}
                    pendingDurations={pendingDurations}
                    setPendingDurations={setPendingDurations}
                    // Filter props
                    selectedAssignee={selectedAssignee}
                    selectedTaskRole={selectedTaskRole}
                    selectedProjectRole={selectedProjectRole}
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
const SortableTaskRow = ({
  task,
  level,
  onEdit,
  onDelete,
  onAddSubtask,
  isSelected,
  onSelect,
  isExpanded,
  onToggleExpand,
  countSubtasks,
  taskCosts = {},
  companyCurrency,
  teamActivity,
  // Duration mode props
  isDurationEntryMode,
  durationContext,
  pendingDurations,
  setPendingDurations,
  // Filter props
  selectedAssignee,
  selectedTaskRole,
  selectedProjectRole
}) => {
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
          companyCurrency={companyCurrency}
          teamActivity={teamActivity}
          // Duration mode props
          isDurationEntryMode={isDurationEntryMode}
          durationContext={durationContext}
          pendingDurations={pendingDurations}
          setPendingDurations={setPendingDurations}
          // Filter props
          selectedAssignee={selectedAssignee}
          selectedTaskRole={selectedTaskRole}
          selectedProjectRole={selectedProjectRole}
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
              companyCurrency={companyCurrency}
              teamActivity={teamActivity}
              // Duration mode props
              isDurationEntryMode={isDurationEntryMode}
              durationContext={durationContext}
              pendingDurations={pendingDurations}
              setPendingDurations={setPendingDurations}
              // Filter props
              selectedAssignee={selectedAssignee}
              selectedTaskRole={selectedTaskRole}
              selectedProjectRole={selectedProjectRole}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TaskListRow = ({
  task,
  level,
  indent,
  hasChildren,
  subtaskCount,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddSubtask,
  isSelected,
  onSelect,
  isDragging,
  cost,
  companyCurrency,
  teamActivity,
  // Duration mode props
  isDurationEntryMode,
  durationContext,
  pendingDurations,
  setPendingDurations,
  // Filter props
  selectedAssignee,
  selectedTaskRole,
  selectedProjectRole
}) => {
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
      companyCurrency={companyCurrency}
      teamActivity={teamActivity}
      // Duration mode props
      isDurationEntryMode={isDurationEntryMode}
      durationContext={durationContext}
      pendingDurations={pendingDurations}
      setPendingDurations={setPendingDurations}
      // Filter props
      selectedAssignee={selectedAssignee}
      selectedTaskRole={selectedTaskRole}
      selectedProjectRole={selectedProjectRole}
    />
  );
};

const TaskListRowContent = ({
  task,
  level,
  indent,
  hasChildren,
  subtaskCount,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddSubtask,
  isSelected,
  onSelect,
  isDragging,
  cost,
  companyCurrency,
  teamActivity,
  // Duration mode props
  isDurationEntryMode,
  durationContext,
  pendingDurations,
  setPendingDurations,
  // Filter props
  selectedAssignee,
  selectedTaskRole,
  selectedProjectRole
}) => {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '40px minmax(300px, 1fr) 120px 100px 160px 100px 80px 100px',
    gap: '12px',
    alignItems: 'center'
  };

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
        ...gridStyle,
        padding: '12px 16px',
        borderBottom: '1px solid #f4f5f7',
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
      <AssigneeList
        assignees={task.assignees}
        roleAssignments={task.roleAssignments}
        teamActivity={teamActivity}
        taskId={task._id}
        onClick={(e) => {
          e.stopPropagation();
          if (onEdit) {
            onEdit(task);
          }
        }}
        // Filter props
        selectedAssignee={selectedAssignee}
        selectedTaskRole={selectedTaskRole}
        selectedProjectRole={selectedProjectRole}
      />

      {/* Due Date */}
      <div style={{ fontSize: '12px', color: '#5e6c84' }}>
        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
      </div>

      {/* Duration */}
      <div style={{ fontSize: '12px' }}>
        {isDurationEntryMode ? (
          <input
            type="number"
            min="0"
            step="0.5"
            placeholder="hr"
            value={(() => {
              if (pendingDurations[task._id] !== undefined) return pendingDurations[task._id];
              // Fallback to existing duration for the selected role
              const selectedRole = durationContext.roleId;
              const ra = task.roleAssignments?.find(a =>
                (a.role?._id === selectedRole) || (a.role === selectedRole)
              );
              return ra?.duration?.value || '';
            })()}
            onChange={(e) => setPendingDurations({ ...pendingDurations, [task._id]: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              padding: '4px 8px',
              border: '1px solid #ffab00',
              borderRadius: '3px',
              backgroundColor: '#fffcf5',
              fontSize: '12px',
              outline: 'none'
            }}
          />
        ) : (
          <div style={{ color: '#5e6c84', fontWeight: '500' }}>
            {(() => {
              // Show role assignment duration if exists for some role
              const roleWithDuration = task.roleAssignments?.find(ra => ra.duration?.value);
              if (roleWithDuration) {
                // Sum all durations
                const totalDur = task.roleAssignments.reduce((sum, ra) => sum + (ra.duration?.value || 0), 0);
                return `${totalDur}h`;
              }
              return task.duration?.value ? `${task.duration.value}h` : '-';
            })()}
          </div>
        )}
      </div>

      {/* Cost */}
      <div style={{ fontSize: '12px', color: cost ? '#059669' : '#a8b1bd', fontWeight: cost ? '600' : '400' }}>
        {formatCurrency(cost, companyCurrency)}
      </div>
    </div>
  );
};

const AssigneeList = ({
  assignees,
  roleAssignments = [],
  teamActivity = [],
  taskId,
  onClick,
  // Filter props
  selectedAssignee,
  selectedTaskRole,
  selectedProjectRole
}) => {
  if ((!assignees || assignees.length === 0) && (!roleAssignments || roleAssignments.length === 0)) {
    return (
      <div
        onClick={onClick}
        style={{
          fontSize: '12px',
          color: '#a8b1bd',
          fontStyle: 'italic',
          cursor: onClick ? 'pointer' : 'default',
          padding: '4px 8px',
          borderRadius: '4px',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => {
          if (onClick) e.currentTarget.style.backgroundColor = '#f4f5f7';
        }}
        onMouseLeave={(e) => {
          if (onClick) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        Unassigned
      </div>
    );
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

  // Flatten roleAssignments into a list of { user, roleName }
  let flattenedAssignments = [];
  if (roleAssignments && roleAssignments.length > 0) {
    roleAssignments.forEach(ra => {
      // Filter by task role if selected
      const currentRoleId = ra.role?._id || ra.role;
      if (selectedTaskRole && currentRoleId !== selectedTaskRole) return;

      const roleName = ra.role?.name || ra.roleName;
      if (ra.assignees && ra.assignees.length > 0) {
        ra.assignees.forEach(assignee => {
          // Filter by specific assignee if selected
          const userId = assignee._id || assignee;
          if (selectedAssignee && userId !== selectedAssignee) return;

          // Filter by project role if selected (assignee object might have it)
          if (selectedProjectRole && assignee.projectRole !== selectedProjectRole) return;

          flattenedAssignments.push({
            user: assignee,
            roleName: roleName
          });
        });
      }
    });
  } else if (assignees && assignees.length > 0) {
    // Fallback to flat assignees if no roleAssignments
    assignees.forEach(a => {
      const userId = a._id || a;
      if (selectedAssignee && userId !== selectedAssignee) return;
      if (selectedProjectRole && a.projectRole !== selectedProjectRole) return;

      flattenedAssignments.push({ user: a });
    });
  }

  // Final deduplication (same user might have multiple roles)
  const uniqueMemberMap = new Map();
  flattenedAssignments.forEach(item => {
    const userId = item.user._id || item.user;
    if (!uniqueMemberMap.has(userId)) {
      uniqueMemberMap.set(userId, item);
    }
  });
  flattenedAssignments = Array.from(uniqueMemberMap.values());

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '-4px',
        cursor: onClick ? 'pointer' : 'default',
        padding: '4px 8px',
        borderRadius: '4px',
        margin: '-4px -8px',
        transition: 'background-color 0.2s'
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.backgroundColor = '#f4f5f7';
      }}
      onMouseLeave={(e) => {
        if (onClick) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {flattenedAssignments.slice(0, 3).map((assignment, index) => {
        const assignee = assignment.user;
        const isActive = teamActivity.some(m =>
          m.currentTask?._id === taskId &&
          (m.user?._id === (assignee._id || assignee) || m.user === (assignee._id || assignee))
        );
        return (
          <AssigneeAvatar
            key={`${assignee._id || index}-${assignment.roleName || ''}`}
            assignee={assignee}
            roleName={assignment.roleName}
            getInitials={getInitials}
            getAvatarColor={getAvatarColor}
            style={{ marginLeft: index > 0 ? '-6px' : '0' }}
            isActive={isActive}
          />
        );
      })}
      {flattenedAssignments.length > 3 && (
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
          +{flattenedAssignments.length - 3}
        </div>
      )}
    </div>
  );
};

const AssigneeAvatar = ({ assignee, roleName, getInitials, getAvatarColor, style, isActive }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const profilePicture = assignee.profile?.profilePicture;

  return (
    <div
      style={{ position: 'relative', display: 'inline-block', ...style }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {profilePicture ? (
        <img
          src={profilePicture}
          alt={assignee.name}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid white',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease-in-out',
            backgroundColor: 'white',
            display: 'block'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />
      ) : (
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
      )}

      {isActive && (
        <div style={{
          position: 'absolute',
          bottom: '-2px',
          right: '-2px',
          width: '10px',
          height: '10px',
          backgroundColor: '#10b981',
          borderRadius: '50%',
          border: '2px solid white',
          boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)',
          zIndex: 2,
          animation: 'pulse 1.5s infinite'
        }} />
      )}

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
          {roleName && (
            <div style={{ fontSize: '11px', color: '#00dcff', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>
              {roleName}
            </div>
          )}
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

