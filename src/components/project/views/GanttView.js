import React, { useState } from 'react';
import { autoScheduleAllTasks } from '../../../utils/ganttScheduler';
import AutoScheduleGuide from '../AutoScheduleGuide';

const GanttView = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onAddSubtask,
  project,
  company,
  onUpdateTask,
  employeeLeaves = []
}) => {
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  const [showAutoScheduleModal, setShowAutoScheduleModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

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

  // Check if a date is a holiday
  const isHoliday = (date) => {
    const holidays = company?.settings?.holidays || project?.settings?.holidays || [];
    const dateStr = date.toISOString().split('T')[0];
    return holidays.some(holiday => {
      const holidayDate = new Date(holiday.date).toISOString().split('T')[0];
      return holidayDate === dateStr;
    });
  };

  // Get holiday name for a date
  const getHolidayName = (date) => {
    const holidays = company?.settings?.holidays || project?.settings?.holidays || [];
    const dateStr = date.toISOString().split('T')[0];
    const holiday = holidays.find(h => {
      const holidayDate = new Date(h.date).toISOString().split('T')[0];
      return holidayDate === dateStr;
    });
    return holiday?.name || '';
  };

  const dateHeaders = generateDateHeaders();

  // Auto-schedule handler
  const handleAutoSchedule = async () => {
    if (!project || !project.startDate) {
      alert('Please set a project start date first');
      return;
    }

    setIsAutoScheduling(true);

    try {
      // Get settings from company or project
      const settings = {
        workingDays: company?.settings?.workingDays || project?.settings?.workingDays || [1, 2, 3, 4, 5],
        holidays: company?.settings?.holidays || project?.settings?.holidays || [],
        timeTracking: company?.settings?.timeTracking || project?.settings?.timeTracking || {
          hoursPerDay: 8,
          daysPerWeek: 5,
          defaultDurationUnit: 'hours'
        }
      };

      // Auto-schedule all tasks
      const scheduledTasks = autoScheduleAllTasks(
        tasks,
        project.startDate,
        settings,
        employeeLeaves
      );

      // Update each task with calculated dates
      for (const scheduledTask of scheduledTasks) {
        await onUpdateTask(scheduledTask.taskId, {
          startDate: scheduledTask.startDate,
          dueDate: scheduledTask.dueDate
        });
      }

      setShowAutoScheduleModal(false);
      alert(`Successfully scheduled ${scheduledTasks.length} tasks!`);
    } catch (error) {
      console.error('Error auto-scheduling tasks:', error);
      alert('Failed to auto-schedule tasks. Please try again.');
    } finally {
      setIsAutoScheduling(false);
    }
  };

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
          isHoliday={isHoliday}
          startDate={startDate}
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
      {/* Auto-Schedule Button */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #dfe1e6',
        backgroundColor: '#f4f5f7',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#172b4d' }}>
              Gantt Chart
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#5e6c84' }}>
              Visualize and auto-schedule tasks based on duration, working days, holidays, and leaves
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#5e6c84' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '16px', height: '16px', backgroundColor: '#deebff', border: '1px solid #0052cc', borderRadius: '2px' }}></div>
              <span>Today</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '16px', height: '16px', backgroundColor: '#fafbfc', border: '1px solid #dfe1e6', borderRadius: '2px' }}></div>
              <span>Weekend</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '16px', height: '16px', backgroundColor: '#ffebe6', border: '1px solid #de350b', borderRadius: '2px' }}></div>
              <span>Holiday 🎉</span>
            </div>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: 'white',
              color: '#0052cc',
              border: '1px solid #0052cc',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>❓</span>
            How it works
          </button>
        </div>
        <button
          onClick={() => setShowAutoScheduleModal(true)}
          disabled={tasks.length === 0}
          style={{
            padding: '10px 20px',
            backgroundColor: tasks.length === 0 ? '#dfe1e6' : '#0052cc',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: tasks.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (tasks.length > 0) {
              e.currentTarget.style.backgroundColor = '#0065ff';
            }
          }}
          onMouseLeave={(e) => {
            if (tasks.length > 0) {
              e.currentTarget.style.backgroundColor = '#0052cc';
            }
          }}
        >
          <span>⚡</span>
          Auto-Schedule Tasks
        </button>
      </div>

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
              const isHol = isHoliday(date);
              const holidayName = isHol ? getHolidayName(date) : '';

              return (
                <div
                  key={index}
                  title={isHol ? `Holiday: ${holidayName}` : ''}
                  style={{
                    width: dayWidth,
                    padding: '6px 4px',
                    borderRight: '1px solid #e1e4e8',
                    fontSize: '10px',
                    textAlign: 'center',
                    color: isToday ? '#0052cc' : (isHol ? '#de350b' : '#5e6c84'),
                    backgroundColor: isToday ? '#deebff' : (isHol ? '#ffebe6' : (isWeekend ? '#fafbfc' : 'transparent')),
                    fontWeight: isToday || isHol ? '700' : '400',
                    position: 'relative'
                  }}
                >
                  <div style={{ fontSize: '11px', marginBottom: '2px' }}>
                    {date.getDate()}
                    {isHol && <span style={{ marginLeft: '2px' }}>🎉</span>}
                  </div>
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

      {/* Auto-Schedule Confirmation Modal */}
      {showAutoScheduleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '600px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: '#172b4d' }}>
              ⚡ Auto-Schedule Tasks
            </h3>

            <div style={{
              backgroundColor: '#deebff',
              border: '1px solid #0052cc',
              borderRadius: '4px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#0052cc' }}>
                How it works:
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#172b4d', lineHeight: '1.6' }}>
                <li>Tasks will be scheduled sequentially starting from the project start date</li>
                <li>Only working days will be counted (excluding weekends and holidays)</li>
                <li>Employee leaves will be considered for assigned tasks</li>
                <li>Task duration will be converted to working days automatically</li>
                <li>Existing start/due dates will be overwritten</li>
              </ul>
            </div>

            <div style={{
              backgroundColor: '#f4f5f7',
              borderRadius: '4px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '13px', color: '#5e6c84', marginBottom: '8px' }}>
                <strong>Project Start Date:</strong> {project?.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
              </div>
              <div style={{ fontSize: '13px', color: '#5e6c84', marginBottom: '8px' }}>
                <strong>Tasks to Schedule:</strong> {tasks.filter(t => t.duration && t.duration.value).length} tasks with duration
              </div>
              <div style={{ fontSize: '13px', color: '#5e6c84', marginBottom: '8px' }}>
                <strong>Working Days:</strong> {(company?.settings?.workingDays || project?.settings?.workingDays || [1, 2, 3, 4, 5]).map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
              </div>
              <div style={{ fontSize: '13px', color: '#5e6c84' }}>
                <strong>Holidays:</strong> {(company?.settings?.holidays || project?.settings?.holidays || []).length} configured
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAutoScheduleModal(false)}
                disabled={isAutoScheduling}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  color: '#5e6c84',
                  border: '1px solid #dfe1e6',
                  borderRadius: '3px',
                  cursor: isAutoScheduling ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAutoSchedule}
                disabled={isAutoScheduling || !project?.startDate}
                style={{
                  padding: '10px 20px',
                  backgroundColor: isAutoScheduling || !project?.startDate ? '#dfe1e6' : '#0052cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: isAutoScheduling || !project?.startDate ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isAutoScheduling ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                    Scheduling...
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    Schedule Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      {showGuide && <AutoScheduleGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
};

const GanttRow = ({ task, level, totalDays, dayWidth, getTaskPosition, onEdit, onDelete, onAddSubtask, isExpanded, onToggleExpand, hasChildren, isHoliday, startDate }) => {
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
          {/* Grid lines for weekends and holidays */}
          {Array.from({ length: totalDays }).map((_, index) => {
            const date = new Date(startDate);
            date.setDate(date.getDate() + index);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isHol = isHoliday ? isHoliday(date) : false;
            return (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  left: index * dayWidth,
                  width: dayWidth,
                  height: '100%',
                  backgroundColor: isHol ? '#ffebe6' : (isWeekend ? '#fafbfc' : 'transparent'),
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