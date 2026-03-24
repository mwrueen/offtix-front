import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useToast } from '../../../context/ToastContext';
import { autoScheduleAllTasks } from '../../../utils/ganttScheduler';
import { taskAPI } from '../../../services/api';

const GanttView = ({
  tasks,
  onEditTask,
  onDeleteTask,
  project,
  company,
  employeeLeaves = [],
  taskRoles = [],
  onRefresh
}) => {
  const toast = useToast();
  const ganttRef = useRef(null);
  
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [showAutoScheduleModal, setShowAutoScheduleModal] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [schedulingMode, setSchedulingMode] = useState('sequential');
  const [maxParallelTasks, setMaxParallelTasks] = useState(3);
  const [scheduleStartFrom, setScheduleStartFrom] = useState('project');

  const DAY_WIDTH = 40;
  const SIDEBAR_WIDTH = 350;

  // Get today
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Get settings
  const settings = useMemo(() => ({
    workingDays: company?.settings?.workingDays || project?.settings?.workingDays || [1, 2, 3, 4, 5],
    holidays: company?.settings?.holidays || project?.settings?.holidays || [],
    timeTracking: company?.settings?.timeTracking || project?.settings?.timeTracking || {
      hoursPerDay: 8,
      daysPerWeek: 5
    }
  }), [company, project]);

  // Build holiday map
  const holidayMap = useMemo(() => {
    const map = {};
    settings.holidays.forEach(h => {
      if (h.date) {
        const d = new Date(h.date);
        const key = d.toISOString().split('T')[0];
        map[key] = h.name || 'Holiday';
      }
    });
    return map;
  }, [settings.holidays]);

  // Calculate date range
  const { startDate, endDate, totalDays, dateHeaders } = useMemo(() => {
    let min = null;
    let max = null;

    tasks.forEach(task => {
      // Check task dates
      if (task.startDate) {
        const d = new Date(task.startDate);
        if (!min || d < min) min = d;
      }
      if (task.dueDate) {
        const d = new Date(task.dueDate);
        if (!max || d > max) max = d;
      }

      // Check role assignment dates
      if (task.roleAssignments) {
        task.roleAssignments.forEach(ra => {
          if (ra.startDate) {
            const d = new Date(ra.startDate);
            if (!min || d < min) min = d;
          }
          if (ra.dueDate) {
            const d = new Date(ra.dueDate);
            if (!max || d > max) max = d;
          }
        });
      }
    });

    // Fallback to project dates or today
    if (!min) min = project?.startDate ? new Date(project.startDate) : new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (!max) max = project?.endDate ? new Date(project.endDate) : new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

    // Add padding
    const paddedStart = new Date(min.getTime() - 7 * 24 * 60 * 60 * 1000);
    const paddedEnd = new Date(max.getTime() + 30 * 24 * 60 * 60 * 1000);
    paddedStart.setHours(0, 0, 0, 0);
    paddedEnd.setHours(0, 0, 0, 0);

    const days = Math.ceil((paddedEnd - paddedStart) / (1000 * 60 * 60 * 24));
    const headers = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(paddedStart);
      d.setDate(d.getDate() + i);
      headers.push(d);
    }

    return { startDate: paddedStart, endDate: paddedEnd, totalDays: days, dateHeaders: headers };
  }, [tasks, project, today]);

  // Group headers by month
  const monthHeaders = useMemo(() => {
    const groups = [];
    dateHeaders.forEach(date => {
      const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (groups.length === 0 || groups[groups.length - 1].label !== label) {
        groups.push({ label, count: 1 });
      } else {
        groups[groups.length - 1].count++;
      }
    });
    return groups;
  }, [dateHeaders]);

  // Calculate today position
  const todayPosition = useMemo(() => {
    const offset = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    return offset * DAY_WIDTH;
  }, [today, startDate]);

  // Filter tasks by role
  const filteredTasks = useMemo(() => {
    if (!selectedRoleFilter) return tasks;
    return tasks.filter(t => 
      t.roleAssignments?.some(ra => (ra.role?._id || ra.role) === selectedRoleFilter)
    );
  }, [tasks, selectedRoleFilter]);

  // Toggle expand
  const toggleExpand = (taskId) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Get bar position
  const getBarPosition = (startDateStr, endDateStr, durationObj) => {
    let start = startDateStr ? new Date(startDateStr) : null;
    let end = endDateStr ? new Date(endDateStr) : null;

    // If no dates, estimate from duration
    if (!start && !end && durationObj?.value) {
      start = new Date(today);
      const days = convertDurationToDays(durationObj);
      end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    } else if (start && !end && durationObj?.value) {
      const days = convertDurationToDays(durationObj);
      end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    } else if (!start && end && durationObj?.value) {
      const days = convertDurationToDays(durationObj);
      start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    }

    if (!start || !end) return null;

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const startOffset = (start - startDate) / (1000 * 60 * 60 * 24);
    const duration = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    return {
      left: startOffset * DAY_WIDTH,
      width: Math.max(DAY_WIDTH, duration * DAY_WIDTH),
      startDate: start,
      endDate: end
    };
  };

  // Convert duration to days
  const convertDurationToDays = (duration) => {
    if (!duration?.value) return 1;
    const hoursPerDay = settings.timeTracking.hoursPerDay || 8;
    switch (duration.unit) {
      case 'minutes': return Math.ceil(duration.value / 60 / hoursPerDay);
      case 'hours': return Math.ceil(duration.value / hoursPerDay);
      case 'days': return duration.value;
      case 'weeks': return duration.value * 5;
      default: return 1;
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get role color
  const getRoleColor = (roleName) => {
    const name = (roleName || '').toLowerCase();
    if (name.includes('ui') || name.includes('ux')) return '#8b5cf6';
    if (name.includes('back')) return '#3b82f6';
    if (name.includes('front')) return '#10b981';
    if (name.includes('qa') || name.includes('test')) return '#f59e0b';
    return '#6366f1';
  };

  // Handle auto-schedule
  const handleAutoSchedule = async () => {
    const startDateToUse = scheduleStartFrom === 'today' 
      ? new Date().toISOString() 
      : project?.startDate;

    if (!startDateToUse) {
      toast.error('Please set a project start date first');
      return;
    }

    const tasksWithDuration = tasks.filter(t => t.duration?.value);
    if (tasksWithDuration.length === 0) {
      toast.error('No tasks have duration set');
      return;
    }

    setIsScheduling(true);
    try {
      const scheduledTasks = autoScheduleAllTasks(
        tasksWithDuration,
        startDateToUse,
        settings,
        employeeLeaves,
        {
          mode: schedulingMode,
          maxParallel: maxParallelTasks,
          forceReschedule: true
        }
      );

      await taskAPI.bulkSchedule(project._id, scheduledTasks);
      setShowAutoScheduleModal(false);
      toast.success(`Successfully scheduled ${scheduledTasks.length} tasks`);
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error('Auto-schedule error:', error);
      toast.error('Failed to auto-schedule tasks');
    } finally {
      setIsScheduling(false);
    }
  };

  // Jump to today
  const jumpToToday = () => {
    if (ganttRef.current) {
      const scrollContainer = ganttRef.current.querySelector('.gantt-scroll');
      if (scrollContainer) {
        scrollContainer.scrollLeft = Math.max(0, todayPosition - 200);
      }
    }
  };

  return (
    <div style={{
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      fontFamily: 'Inter, sans-serif'
    }}>

      {/* Toolbar */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
              📊 Project Timeline
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              {filteredTasks.length} tasks • Resource-optimized scheduling
            </p>
          </div>

          <div style={{ width: '1px', height: '32px', backgroundColor: '#e2e8f0' }} />

          <button onClick={jumpToToday} style={{
            padding: '8px 16px',
            backgroundColor: '#eff6ff',
            color: '#3b82f6',
            border: '1px solid #3b82f620',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            Today
          </button>

          <div style={{ width: '1px', height: '32px', backgroundColor: '#e2e8f0' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Filter by Role:</span>
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                fontWeight: '600',
                color: '#1e293b',
                backgroundColor: 'white',
                cursor: 'pointer',
                minWidth: '150px'
              }}
            >
              <option value="">All Roles</option>
              {taskRoles.map(role => (
                <option key={role._id} value={role._id}>{role.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowAutoScheduleModal(true)}
          style={{
            padding: '10px 24px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
          }}
        >
          <span>⚡</span> Auto-Schedule
        </button>
      </div>

      {/* Gantt Chart */}
      <div ref={ganttRef} style={{ backgroundColor: 'white' }}>
        {/* Header */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#f8fafc' }}>
          <div style={{
            width: SIDEBAR_WIDTH,
            padding: '12px 16px',
            borderRight: '1px solid #e2e8f0',
            fontSize: '11px',
            fontWeight: '700',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            backgroundColor: '#f8fafc'
          }}>
            Task / Role
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            {/* Month headers */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
              {monthHeaders.map((month, idx) => (
                <div key={idx} style={{
                  width: month.count * DAY_WIDTH,
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#475569',
                  borderRight: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {month.label}
                </div>
              ))}
            </div>

            {/* Day headers */}
            <div style={{ display: 'flex' }}>
              {dateHeaders.map((date, idx) => {
                const isToday = date.toDateString() === today.toDateString();
                const dayOfWeek = date.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const dateKey = date.toISOString().split('T')[0];
                const isHoliday = !!holidayMap[dateKey];

                return (
                  <div key={idx} style={{
                    width: DAY_WIDTH,
                    padding: '10px 0',
                    borderRight: '1px solid #f1f5f9',
                    fontSize: '11px',
                    textAlign: 'center',
                    color: isToday ? '#3b82f6' : (isHoliday ? '#ef4444' : '#94a3b8'),
                    backgroundColor: isToday ? '#eff6ff' : (isHoliday ? '#fff1f2' : (isWeekend ? '#f8fafc' : 'white')),
                    fontWeight: isToday || isHoliday ? '700' : '600',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    boxShadow: isToday ? 'inset 0 -2px 0 #3b82f6' : 'none'
                  }}>
                    <div style={{ fontSize: '12px' }}>{date.getDate()}</div>
                    <div style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.6 }}>
                      {date.toLocaleDateString('en', { weekday: 'short' }).slice(0, 1)}
                    </div>
                    {isHoliday && <div style={{ fontSize: '10px' }}>🎁</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="gantt-scroll" style={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
          {filteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: '#94a3b8' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <p style={{ margin: 0, fontSize: '14px' }}>No tasks to display</p>
            </div>
          ) : (
            <div style={{ position: 'relative', minWidth: SIDEBAR_WIDTH + totalDays * DAY_WIDTH }}>
              {/* Background grid */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: SIDEBAR_WIDTH,
                right: 0,
                bottom: 0,
                display: 'flex',
                pointerEvents: 'none',
                zIndex: 0
              }}>
                {dateHeaders.map((date, idx) => {
                  const dayOfWeek = date.getDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  const dateKey = date.toISOString().split('T')[0];
                  const isHoliday = !!holidayMap[dateKey];

                  return (
                    <div key={idx} style={{
                      width: DAY_WIDTH,
                      borderRight: '1px solid #f1f5f9',
                      backgroundColor: isHoliday ? '#fff1f2' : (isWeekend ? '#f8fafc' : 'transparent'),
                      height: '100%'
                    }} />
                  );
                })}
              </div>

              {/* Today line */}
              {todayPosition >= 0 && todayPosition <= totalDays * DAY_WIDTH && (
                <div style={{
                  position: 'absolute',
                  left: SIDEBAR_WIDTH + todayPosition + DAY_WIDTH / 2,
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  backgroundColor: '#3b82f6',
                  opacity: 0.3,
                  zIndex: 5,
                  pointerEvents: 'none'
                }} />
              )}

              {/* Task rows */}
              {filteredTasks.map(task => {
                const isExpanded = expandedTasks.has(task._id);
                const hasRoles = task.roleAssignments && task.roleAssignments.length > 0;
                const taskBar = getBarPosition(task.startDate, task.dueDate, task.duration);

                return (
                  <React.Fragment key={task._id}>
                    {/* Main task row */}
                    <div style={{
                      display: 'flex',
                      borderBottom: '1px solid #f1f5f9',
                      minHeight: '48px',
                      backgroundColor: 'white',
                      position: 'relative',
                      zIndex: 1
                    }}>
                      <div style={{
                        width: SIDEBAR_WIDTH,
                        padding: '12px 16px',
                        borderRight: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {hasRoles && (
                          <button
                            onClick={() => toggleExpand(task._id)}
                            style={{
                              background: '#f1f5f9',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px',
                              width: '20px',
                              height: '20px',
                              color: '#64748b'
                            }}
                          >
                            <span style={{ fontSize: '10px', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                          </button>
                        )}
                        {!hasRoles && <div style={{ width: '20px' }} />}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#1e293b',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer'
                          }} onClick={() => onEditTask(task)}>
                            {task.title}
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                            {formatDate(task.startDate) || '?'} – {formatDate(task.dueDate) || '?'}
                          </div>
                        </div>
                      </div>

                      <div style={{ flex: 1, position: 'relative' }}>
                        {taskBar && (
                          <div
                            onClick={() => onEditTask(task)}
                            style={{
                              position: 'absolute',
                              left: taskBar.left,
                              width: taskBar.width,
                              height: '20px',
                              top: '14px',
                              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              zIndex: 10,
                              transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                          />
                        )}
                      </div>
                    </div>

                    {/* Role sub-rows */}
                    {isExpanded && hasRoles && task.roleAssignments.map((ra, raIdx) => {
                      const roleId = ra.role?._id || ra.role;
                      const roleObj = taskRoles.find(r => r._id === roleId) || ra.role;
                      const roleName = typeof roleObj === 'object' ? roleObj?.name : roleObj;
                      const roleColor = getRoleColor(roleName);
                      const roleBar = getBarPosition(ra.startDate, ra.dueDate, ra.duration);

                      return (
                        <div key={`${task._id}-role-${raIdx}`} style={{
                          display: 'flex',
                          borderBottom: '1px solid #f1f5f9',
                          minHeight: '40px',
                          backgroundColor: '#fcfdfe',
                          position: 'relative',
                          zIndex: 1
                        }}>
                          <div style={{
                            width: SIDEBAR_WIDTH,
                            padding: '10px 16px 10px 56px',
                            borderRight: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <div style={{
                              width: '18px',
                              height: '18px',
                              backgroundColor: `${roleColor}15`,
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              border: `1px solid ${roleColor}30`
                            }}>
                              👤
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: '12px',
                                fontWeight: '500',
                                color: '#64748b',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {roleName || 'Unknown Role'}
                              </div>
                              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                                {formatDate(ra.startDate) || '?'} – {formatDate(ra.dueDate) || '?'}
                              </div>
                            </div>
                          </div>

                          <div style={{ flex: 1, position: 'relative' }}>
                            {roleBar && (
                              <div style={{
                                position: 'absolute',
                                left: roleBar.left,
                                width: roleBar.width,
                                height: '16px',
                                top: '12px',
                                backgroundColor: roleColor,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                zIndex: 10
                              }} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>


      {/* Auto-Schedule Modal */}
      {showAutoScheduleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>⚡</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'white' }}>
                    Auto-Schedule Tasks
                  </h3>
                  <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                    Optimize timeline based on work sequence
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAutoScheduleModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: 'white',
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >✕</button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Scheduling Mode */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'block',
                  marginBottom: '10px'
                }}>
                  Scheduling Mode
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[
                    { value: 'sequential', icon: '📋', label: 'Sequential', desc: 'One after another' },
                    { value: 'parallel', icon: '⚡', label: 'Parallel', desc: 'Multiple at once' }
                  ].map(opt => (
                    <label
                      key={opt.value}
                      onClick={() => setSchedulingMode(opt.value)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        border: schedulingMode === opt.value ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                        backgroundColor: schedulingMode === opt.value ? '#eff6ff' : 'white',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontSize: '18px', marginBottom: '6px' }}>{opt.icon}</div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '2px' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{opt.desc}</div>
                    </label>
                  ))}
                </div>

                {schedulingMode === 'parallel' && (
                  <div style={{
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '8px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <span style={{ fontSize: '11px', color: '#166534', fontWeight: '600' }}>
                      Max parallel:
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[2, 3, 4, 5].map(num => (
                        <button
                          key={num}
                          onClick={() => setMaxParallelTasks(num)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '6px',
                            border: maxParallelTasks === num ? '2px solid #16a34a' : '1px solid #d1fae5',
                            backgroundColor: maxParallelTasks === num ? '#16a34a' : 'white',
                            color: maxParallelTasks === num ? 'white' : '#166534',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '12px'
                          }}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Start From */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'block',
                  marginBottom: '10px'
                }}>
                  Start Scheduling From
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[
                    {
                      value: 'project',
                      label: 'Project Start',
                      sub: project?.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'
                    },
                    { value: 'today', label: 'Today', sub: new Date().toLocaleDateString() }
                  ].map(opt => (
                    <label
                      key={opt.value}
                      onClick={() => setScheduleStartFrom(opt.value)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        border: scheduleStartFrom === opt.value ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                        backgroundColor: scheduleStartFrom === opt.value ? '#eff6ff' : 'white',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <div style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        border: scheduleStartFrom === opt.value ? '4px solid #3b82f6' : '2px solid #cbd5e1',
                        flexShrink: 0
                      }} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>{opt.sub}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Warning */}
              <div style={{
                padding: '10px 12px',
                backgroundColor: '#fef9c3',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#854d0e',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #fde68a'
              }}>
                <span>⚠️</span>
                <span>
                  This will reschedule <strong>{tasks.filter(t => t.duration?.value).length} tasks</strong> with duration
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowAutoScheduleModal(false)}
                  disabled={isScheduling}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'white',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAutoSchedule}
                  disabled={isScheduling || (scheduleStartFrom === 'project' && !project?.startDate)}
                  style={{
                    padding: '10px 24px',
                    background: isScheduling || (scheduleStartFrom === 'project' && !project?.startDate)
                      ? '#e2e8f0'
                      : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: isScheduling || (scheduleStartFrom === 'project' && !project?.startDate)
                      ? '#94a3b8'
                      : 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isScheduling || (scheduleStartFrom === 'project' && !project?.startDate)
                      ? 'not-allowed'
                      : 'pointer',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: isScheduling ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  {isScheduling ? (
                    <>
                      <span>⏳</span> Scheduling...
                    </>
                  ) : (
                    <>
                      <span>⚡</span> Schedule Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GanttView;
