import React, { useState } from 'react';

const GanttView = ({ tasks, onEditTask, onDeleteTask, onAddSubtask }) => {
  const [expandedTasks, setExpandedTasks] = useState(new Set());

  const today = new Date();
  const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const endDate = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days from now

  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const dayWidth = 40;

  // Build task hierarchy
  const buildTaskHierarchy = (tasks) => {
    const taskMap = new Map();
    const rootTasks = [];

    tasks.forEach(task => {
      taskMap.set(task._id, { ...task, children: [] });
    });

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

  const getTaskPosition = (task) => {
    const taskStart = task.startDate ? new Date(task.startDate) : today;
    const taskEnd = task.dueDate ? new Date(task.dueDate) : new Date(taskStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const startOffset = Math.max(0, (taskStart - startDate) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, (taskEnd - taskStart) / (1000 * 60 * 60 * 1000));
    
    return {
      left: startOffset * dayWidth,
      width: Math.max(dayWidth, duration * dayWidth)
    };
  };

  const generateDateHeaders = () => {
    const headers = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      headers.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return headers;
  };

  const dateHeaders = generateDateHeaders();

  const renderTaskRows = (tasks, level = 0) => {
    return tasks.map(task => (
      <React.Fragment key={task._id}>
        <GanttRow
          task={task}
          level={level}
          totalDays={totalDays}
          dayWidth={dayWidth}
          getTaskPosition={getTaskPosition}
          onEdit={onEditTask}
          onDelete={onDeleteTask}
          onAddSubtask={onAddSubtask}
          isExpanded={expandedTasks.has(task._id)}
          onToggleExpand={() => toggleExpand(task._id)}
          hasChildren={task.children && task.children.length > 0}
        />
        {task.children && task.children.length > 0 && expandedTasks.has(task._id) && (
          renderTaskRows(task.children, level + 1)
        )}
      </React.Fragment>
    ));
  };

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #dfe1e6',
      borderRadius: '3px',
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(9, 30, 66, 0.08)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #dfe1e6',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: '#f4f5f7'
      }}>
        <div style={{
          width: '350px',
          padding: '12px 16px',
          backgroundColor: '#f4f5f7',
          borderRight: '2px solid #dfe1e6',
          fontSize: '11px',
          fontWeight: '700',
          color: '#5e6c84',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Issue
        </div>

        <div style={{
          flex: 1,
          overflowX: 'auto',
          backgroundColor: '#f4f5f7'
        }}>
          <div style={{
            display: 'flex',
            width: totalDays * dayWidth
          }}>
            {dateHeaders.map((date, index) => {
              const isToday = date.toDateString() === today.toDateString();
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              return (
                <div
                  key={index}
                  style={{
                    width: dayWidth,
                    padding: '6px 4px',
                    borderRight: '1px solid #e1e4e8',
                    fontSize: '10px',
                    textAlign: 'center',
                    color: isToday ? '#0052cc' : '#5e6c84',
                    backgroundColor: isToday ? '#deebff' : (isWeekend ? '#fafbfc' : 'transparent'),
                    fontWeight: isToday ? '700' : '400'
                  }}
                >
                  <div style={{ fontSize: '11px', marginBottom: '2px' }}>{date.getDate()}</div>
                  <div style={{ fontSize: '9px', opacity: 0.8 }}>
                    {date.toLocaleDateString('en', { weekday: 'short' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
        {tasks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 24px',
            color: '#5e6c84'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.5 }}>📊</div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#172b4d', fontWeight: '600' }}>No tasks to display</h4>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>Create tasks with dates to see them in the Gantt chart.</p>
          </div>
        ) : (
          renderTaskRows(hierarchicalTasks)
        )}
      </div>
    </div>
  );
};

const GanttRow = ({ task, level, totalDays, dayWidth, getTaskPosition, onEdit, onDelete, onAddSubtask, isExpanded, onToggleExpand, hasChildren }) => {
  const position = getTaskPosition(task);
  const indent = level * 20;

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#de350b',
      high: '#ff8b00',
      medium: '#ffab00',
      low: '#36b37e'
    };
    return colors[priority] || '#0052cc';
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

  const issueType = getIssueTypeIcon(task.issueType || (level > 0 ? 'subtask' : 'task'));
  const priorityColor = getPriorityColor(task.priority);

  return (
    <div style={{
      display: 'flex',
      borderBottom: '1px solid #f4f5f7',
      minHeight: '52px',
      backgroundColor: level > 0 ? '#fafbfc' : 'white',
      transition: 'background-color 0.15s ease'
    }}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = level > 0 ? '#f4f5f7' : '#fafbfc'}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = level > 0 ? '#fafbfc' : 'white'}
    >
      <div style={{
        width: '350px',
        padding: '12px 16px',
        borderRight: '2px solid #dfe1e6',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {/* Expand/Collapse Button */}
        <div style={{ paddingLeft: `${indent}px`, display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                fontSize: '10px'
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

          {/* Issue Type Icon */}
          <div style={{
            width: '20px',
            height: '20px',
            backgroundColor: issueType.bg,
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            marginLeft: hasChildren ? '0' : '14px',
            flexShrink: 0
          }}>
            {issueType.icon}
          </div>
        </div>

        {/* Task Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '13px',
            fontWeight: '500',
            color: '#172b4d',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {task.title}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#5e6c84',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {task.assignees && task.assignees.length > 0 && (
              <span>{task.assignees[0].name}</span>
            )}
            {task.priority && (
              <>
                <span>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: priorityColor
                  }} />
                  <span style={{ textTransform: 'capitalize' }}>{task.priority}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{
        flex: 1,
        position: 'relative',
        overflowX: 'auto',
        backgroundColor: 'white'
      }}>
        <div style={{
          width: totalDays * dayWidth,
          height: '100%',
          position: 'relative'
        }}>
          {/* Grid lines for weekends */}
          {Array.from({ length: totalDays }).map((_, index) => {
            const date = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000 + index * 24 * 60 * 60 * 1000);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            return (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  left: index * dayWidth,
                  width: dayWidth,
                  height: '100%',
                  backgroundColor: isWeekend ? '#fafbfc' : 'transparent',
                  borderRight: '1px solid #f4f5f7'
                }}
              />
            );
          })}

          {/* Task Bar */}
          <div
            style={{
              position: 'absolute',
              left: position.left,
              width: position.width,
              height: level > 0 ? '16px' : '24px',
              top: level > 0 ? '18px' : '14px',
              backgroundColor: priorityColor,
              borderRadius: level > 0 ? '8px' : '12px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 10px',
              color: 'white',
              fontSize: level > 0 ? '10px' : '11px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              zIndex: 5,
              transition: 'all 0.2s ease'
            }}
            onClick={() => onEdit(task)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15)';
            }}
          >
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {task.title}
            </span>
          </div>

          {/* Progress indicator */}
          {task.status && task.status.name && (
            <div
              style={{
                position: 'absolute',
                left: position.left,
                width: position.width * 0.5, // Assume 50% progress
                height: level > 0 ? '16px' : '24px',
                top: level > 0 ? '18px' : '14px',
                backgroundColor: 'rgba(255,255,255,0.25)',
                borderRadius: level > 0 ? '8px' : '12px',
                zIndex: 6,
                pointerEvents: 'none'
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GanttView;