import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { autoScheduleAllTasks } from '../../../utils/ganttScheduler';
import { taskAPI } from '../../../services/api';
import AutoScheduleGuide from '../AutoScheduleGuide';

const GanttRow = ({ task, level, totalDays, dayWidth, getTaskPosition, onEdit, onDelete, onAddSubtask, isExpanded, onToggleExpand, hasChildren, isHoliday, startDate, todayPosition, teamActivity }) => {
  const position = getTaskPosition(task);
  const indent = level * 20;

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#ef4444', // Red 500
      high: '#f97316',   // Orange 500
      medium: '#eab308', // Yellow 500
      low: '#22c55e'     // Green 500
    };
    return colors[priority] || '#3b82f6'; // Blue 500
  };

  const getIssueTypeIcon = (type) => {
    const types = {
      task: { icon: '✓', color: '#3b82f6', bg: '#eff6ff' },
      bug: { icon: '🐛', color: '#ef4444', bg: '#fef2f2' },
      story: { icon: '📖', color: '#10b981', bg: '#ecfdf5' },
      epic: { icon: '⚡', color: '#8b5cf6', bg: '#f5f3ff' },
      subtask: { icon: '↳', color: '#64748b', bg: '#f1f5f9' }
    };
    return types[type] || (level > 0 ? types.subtask : types.task);
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const issueType = getIssueTypeIcon(task.issueType || (level > 0 ? 'subtask' : 'task'));
  const priorityColor = getPriorityColor(task.priority);

  return (
    <div
      className="gantt-row-hover"
      style={{
        display: 'flex',
        borderBottom: '1px solid #f1f5f9',
        minHeight: '60px',
        backgroundColor: level > 0 ? '#f8fafc' : 'white',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{
        width: '350px',
        padding: '12px 16px',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0,
        backgroundColor: 'inherit',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Expand/Collapse Button */}
        <div style={{ paddingLeft: `${indent}px`, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              style={{
                background: '#f1f5f9',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                borderRadius: '6px',
                width: '24px',
                height: '24px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
            >
              <span style={{
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'inline-block',
                fontSize: '10px'
              }}>
                ▶
              </span>
            </button>
          )}

          {/* Issue Type Icon */}
          <div style={{
            width: '28px',
            height: '28px',
            backgroundColor: issueType.bg,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            marginLeft: hasChildren ? '0' : '32px',
            flexShrink: 0,
            border: `1px solid ${issueType.color}20`
          }}>
            {issueType.icon}
          </div>
        </div>

        {/* Task Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {task.title}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {/* Date range */}
            {(task.startDate || task.dueDate) && (
              <span style={{
                color: '#3b82f6',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#eff6ff',
                padding: '1px 6px',
                borderRadius: '4px'
              }}>
                <span>📅</span> {formatDate(task.startDate) || '?'} - {formatDate(task.dueDate) || '?'}
              </span>
            )}
            {/* Duration */}
            {task.duration?.value && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ opacity: 0.5 }}>•</span>
                <span>⏱️ {task.duration.value} {task.duration.unit}</span>
              </span>
            )}

            {/* Assignee */}
            {task.assignees && task.assignees.length > 0 && (() => {
              const activeMember = teamActivity && teamActivity.find(m =>
                m.currentTask?._id === task._id &&
                task.assignees.some(a => (a._id || a) === (m.user?._id || m.user))
              );
              return (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: activeMember ? '#ecfdf5' : '#f8fafc',
                  padding: '1px 8px',
                  borderRadius: '10px',
                  border: `1px solid ${activeMember ? '#10b98130' : '#e2e8f0'}`,
                  color: activeMember ? '#059669' : '#64748b'
                }}>
                  <span style={{ opacity: 0.5 }}>•</span>
                  <img
                    src={task.assignees[0].profile?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignees[0].name)}&background=random`}
                    style={{ width: '14px', height: '14px', borderRadius: '50%' }}
                    alt=""
                  />
                  <span style={{ fontWeight: activeMember ? '700' : '500' }}>{task.assignees[0].name}</span>
                  {activeMember && (
                    <span style={{
                      width: '6px',
                      height: '6px',
                      backgroundColor: '#10b981',
                      borderRadius: '50%',
                      display: 'inline-block',
                      boxShadow: '0 0 0 2px #10b98140'
                    }} />
                  )}
                </span>
              );
            })()}
          </div>
        </div>
      </div>

      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'visible'
      }}>
        <div style={{
          width: totalDays * dayWidth,
          height: '100%',
          position: 'relative',
          minHeight: '60px'
        }}>
          {/* Today marker line */}
          {todayPosition >= 0 && todayPosition <= totalDays * dayWidth && (
            <div
              style={{
                position: 'absolute',
                left: todayPosition + dayWidth / 2,
                top: 0,
                bottom: 0,
                width: '2px',
                backgroundColor: '#3b82f6',
                zIndex: 10,
                pointerEvents: 'none',
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: -4,
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: '#3b82f6'
              }} />
            </div>
          )}

          {/* Task Bar */}
          <div
            className="task-bar-transition"
            title={`${task.title}\n${position.startDate ? position.startDate.toLocaleDateString() : 'No start'} → ${position.endDate ? position.endDate.toLocaleDateString() : 'No end'}\nDuration: ${position.durationDays} day${position.durationDays !== 1 ? 's' : ''}${task.duration?.value ? ` (${task.duration.value} ${task.duration.unit})` : ''}`}
            style={{
              position: 'absolute',
              left: Math.max(0, position.left),
              width: position.width,
              height: level > 0 ? '24px' : '32px',
              top: level > 0 ? '18px' : '14px',
              background: position.hasDates ? `linear-gradient(135deg, ${priorityColor} 0%, ${priorityColor}dd 100%)` : '#94a3b8',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 10px',
              color: 'white',
              fontSize: level > 0 ? '11px' : '12px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: position.hasDates ? '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' : '0 1px 2px rgba(0,0,0,0.05)',
              zIndex: 5,
              border: position.hasDates ? 'none' : '2px dashed rgba(255,255,255,0.4)',
              opacity: position.hasDates ? 1 : 0.8
            }}
            onClick={() => onEdit(task)}
          >
            {/* Task title inside bar */}
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }}>
              {task.title}
            </span>

            {/* In-progress status pulsator */}
            {teamActivity && teamActivity.some(m =>
              m.currentTask?._id === task._id &&
              task.assignees?.some(a => (a._id || a) === (m.user?._id || m.user))
            ) && (
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.4)',
                  flexShrink: 0,
                  marginLeft: '8px',
                  animation: 'pulse 1.5s infinite'
                }} />
              )}
          </div>

          {/* Progress Overlay */}
          {task.status && (
            <div style={{
              position: 'absolute',
              left: Math.max(0, position.left),
              width: task.status.name?.toLowerCase() === 'done' ? position.width :
                task.status.name?.toLowerCase().includes('progress') ? position.width * 0.5 : 0,
              height: level > 0 ? '24px' : '32px',
              top: level > 0 ? '18px' : '14px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: '6px',
              zIndex: 6,
              pointerEvents: 'none'
            }} />
          )}

          {/* Deadline indicator */}
          {task.dueDate && (
            <div style={{
              position: 'absolute',
              left: position.left + position.width - 2,
              top: level > 0 ? '12px' : '8px',
              width: '4px',
              height: level > 0 ? '36px' : '44px',
              backgroundColor: '#ef4444',
              borderRadius: '2px',
              zIndex: 7,
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.3)'
            }} />
          )}
        </div>
      </div>
    </div>
  );
};


const MemoizedGanttRow = memo(GanttRow);


const GanttView = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onAddSubtask,
  project,
  company,
  onUpdateTask,
  employeeLeaves = [],
  teamActivity = [],
  onRefresh
}) => {
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  const [showAutoScheduleModal, setShowAutoScheduleModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [showScrollShadow, setShowScrollShadow] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const ganttContainerRef = useRef(null);
  const exportMenuRef = useRef(null);

  // Scheduling options
  const [schedulingMode, setSchedulingMode] = useState('sequential'); // 'sequential' or 'parallel'
  const [maxParallelTasks, setMaxParallelTasks] = useState(3);
  const [scheduleStartFrom, setScheduleStartFrom] = useState('project'); // 'project' or 'today'
  const [scheduleResult, setScheduleResult] = useState(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add custom scrollbar styles
  useEffect(() => {
    const styleId = 'gantt-scrollbar-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .gantt-scroll-container::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .gantt-scroll-container::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .gantt-scroll-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .gantt-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .gantt-scroll-container {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
          scroll-behavior: smooth;
        }
        .gantt-row-hover:hover {
          background-color: #f8fafc !important;
        }
        .task-bar-transition {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
        }
        .task-bar-transition:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      const style = document.getElementById(styleId);
      if (style) {
        style.remove();
      }
    };
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Pre-calculate holiday map for fast lookups
  const holidayMap = useMemo(() => {
    const map = {};
    const holidays = company?.settings?.holidays || project?.settings?.holidays || [];
    holidays.forEach(h => {
      if (h.date) {
        const d = new Date(h.date);
        if (!isNaN(d.getTime())) {
          map[d.toISOString().split('T')[0]] = h.name || 'Holiday';
        }
      }
    });
    return map;
  }, [company?.settings?.holidays, project?.settings?.holidays]);

  // Fast holiday checker
  const isHoliday = useCallback((date) => {
    if (!date) return false;
    try {
      const dateStr = date.toISOString().split('T')[0];
      return !!holidayMap[dateStr];
    } catch (e) {
      return false;
    }
  }, [holidayMap]);

  // Pre-calculate date range and total days
  const { startDate, endDate, totalDays, dateHeaders } = useMemo(() => {
    let minDate = null;
    let maxDate = null;

    tasks.forEach(task => {
      if (task.startDate) {
        const start = new Date(task.startDate);
        start.setHours(0, 0, 0, 0);
        if (!minDate || start < minDate) minDate = start;
      }
      if (task.dueDate) {
        const end = new Date(task.dueDate);
        end.setHours(0, 0, 0, 0);
        if (!maxDate || end > maxDate) maxDate = end;
      }
    });

    if (!minDate) {
      minDate = project?.startDate ? new Date(project.startDate) : new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    if (!maxDate) {
      maxDate = project?.endDate ? new Date(project.endDate) : new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
    }

    const paddedStart = new Date(minDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    paddedStart.setHours(0, 0, 0, 0);
    const paddedEnd = new Date(maxDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    paddedEnd.setHours(0, 0, 0, 0);

    if (paddedStart > today) paddedStart.setTime(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (paddedEnd < today) paddedEnd.setTime(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const days = Math.ceil((paddedEnd - paddedStart) / (1000 * 60 * 60 * 24));

    // Generate headers
    const headers = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(paddedStart);
      d.setDate(d.getDate() + i);
      headers.push(d);
    }

    return { startDate: paddedStart, endDate: paddedEnd, totalDays: days, dateHeaders: headers };
  }, [tasks, project?.startDate, project?.endDate, today]);

  // Group dateHeaders by month for calendar view
  const monthHeaders = useMemo(() => {
    if (!dateHeaders || dateHeaders.length === 0) return [];
    const groups = [];
    dateHeaders.forEach((date) => {
      const monthStr = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (groups.length === 0 || groups[groups.length - 1].label !== monthStr) {
        groups.push({ label: monthStr, count: 1 });
      } else {
        groups[groups.length - 1].count++;
      }
    });
    return groups;
  }, [dateHeaders]);

  const dayWidth = 40;

  // Pre-calculate grid data (weekend and holiday status)
  const gridData = useMemo(() => {
    return dateHeaders.map(date => {
      const day = date.getDay();
      const dateStr = date.toISOString().split('T')[0];
      return {
        isWeekend: day === 0 || day === 6,
        isHol: !!holidayMap[dateStr],
        holidayName: holidayMap[dateStr] || ''
      };
    });
  }, [dateHeaders, holidayMap]);

  // Memoize task hierarchy
  const hierarchicalTasks = useMemo(() => {
    const buildHierarchy = (taskList) => {
      const taskMap = new Map();
      const roots = [];

      taskList.forEach(task => {
        taskMap.set(task._id, { ...task, children: [] });
      });

      taskList.forEach(task => {
        if (task.parent) {
          const parentId = typeof task.parent === 'object' ? task.parent._id : task.parent;
          const parent = taskMap.get(parentId);
          if (parent) {
            parent.children.push(taskMap.get(task._id));
          } else {
            roots.push(taskMap.get(task._id));
          }
        } else {
          roots.push(taskMap.get(task._id));
        }
      });

      return roots;
    };
    return buildHierarchy(tasks);
  }, [tasks]);

  const toggleExpand = useCallback((taskId) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) newSet.delete(taskId);
      else newSet.add(taskId);
      return newSet;
    });
  }, []);

  // Export Gantt chart as PNG
  const exportAsPNG = async () => {
    if (!ganttContainerRef.current) return;

    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const container = ganttContainerRef.current;

      // Temporarily expand container for full capture
      const originalStyle = {
        maxHeight: container.style.maxHeight,
        overflow: container.style.overflow
      };
      container.style.maxHeight = 'none';
      container.style.overflow = 'visible';

      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: container.scrollWidth,
        windowHeight: container.scrollHeight
      });

      // Restore original styles
      container.style.maxHeight = originalStyle.maxHeight;
      container.style.overflow = originalStyle.overflow;

      // Download the image
      const link = document.createElement('a');
      link.download = `${project?.title || 'gantt-chart'}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error exporting PNG:', error);
      alert('Failed to export. Please make sure html2canvas is installed.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export as CSV
  const exportAsCSV = () => {
    setShowExportMenu(false);

    const headers = ['Task Name', 'Status', 'Priority', 'Assignee', 'Start Date', 'End Date', 'Duration', 'Progress'];
    const rows = [];

    const flattenTasks = (taskList, level = 0) => {
      taskList.forEach(task => {
        const indent = '  '.repeat(level);
        rows.push([
          `${indent}${task.title}`,
          task.status || 'To Do',
          task.priority || 'Medium',
          task.assignee?.name || 'Unassigned',
          task.startDate ? new Date(task.startDate).toLocaleDateString() : '',
          task.endDate ? new Date(task.endDate).toLocaleDateString() : '',
          task.duration ? `${task.duration.value} ${task.duration.unit}` : '',
          `${task.progress || 0}%`
        ]);
        if (task.children && task.children.length > 0) {
          flattenTasks(task.children, level + 1);
        }
      });
    };

    flattenTasks(hierarchicalTasks);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${project?.title || 'gantt-chart'}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Export as JSON
  const exportAsJSON = () => {
    setShowExportMenu(false);

    const exportData = {
      projectName: project?.title || 'Unknown Project',
      exportDate: new Date().toISOString(),
      tasks: tasks.map(task => ({
        id: task._id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        assignee: task.assignee?.name,
        startDate: task.startDate,
        endDate: task.endDate,
        duration: task.duration,
        progress: task.progress || 0,
        parentId: task.parentId || null
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${project?.title || 'gantt-chart'}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Export as Excel WBS (Work Breakdown Structure)
  const exportAsExcelWBS = async () => {
    setShowExportMenu(false);
    setIsExporting(true);

    try {
      const XLSX = await import('xlsx');

      // Build WBS data with hierarchical numbering
      const wbsData = [];
      let wbsCounter = { level0: 0 };

      const buildWBSRows = (taskList, level = 0, parentWBS = '') => {
        taskList.forEach((task, index) => {
          // Generate WBS number
          let wbsNumber;
          if (level === 0) {
            wbsCounter.level0++;
            wbsNumber = `${wbsCounter.level0}`;
          } else {
            wbsNumber = `${parentWBS}.${index + 1}`;
          }

          // Calculate duration in days
          let durationDays = '';
          if (task.duration && task.duration.value) {
            const value = parseFloat(task.duration.value);
            const unit = task.duration.unit || 'hours';
            const hoursPerDay = company?.settings?.timeTracking?.hoursPerDay || 8;

            switch (unit) {
              case 'minutes': durationDays = (value / 60 / hoursPerDay).toFixed(2); break;
              case 'hours': durationDays = (value / hoursPerDay).toFixed(2); break;
              case 'days': durationDays = value.toString(); break;
              case 'weeks': durationDays = (value * 5).toString(); break;
              default: durationDays = (value / hoursPerDay).toFixed(2);
            }
          }

          wbsData.push({
            'WBS': wbsNumber,
            'Level': level,
            'Task Name': task.title,
            'Description': task.description || '',
            'Status': task.status || 'To Do',
            'Priority': task.priority || 'Medium',
            'Assignee': task.assignee?.name || 'Unassigned',
            'Start Date': task.startDate ? new Date(task.startDate).toLocaleDateString() : '',
            'End Date': task.endDate ? new Date(task.endDate).toLocaleDateString() : '',
            'Duration (Days)': durationDays,
            'Progress (%)': task.progress || 0,
            'Estimated Hours': task.duration ? `${task.duration.value} ${task.duration.unit}` : '',
            'Dependencies': task.dependencies?.length ? task.dependencies.join(', ') : ''
          });

          // Process children
          if (task.children && task.children.length > 0) {
            buildWBSRows(task.children, level + 1, wbsNumber);
          }
        });
      };

      buildWBSRows(hierarchicalTasks);

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();

      // Project Info Sheet
      const projectInfo = [
        ['Project Name', project?.title || 'Unknown Project'],
        ['Export Date', new Date().toLocaleDateString()],
        ['Total Tasks', tasks.length],
        ['Project Start', project?.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not Set'],
        ['Project End', project?.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not Set'],
        [''],
        ['Work Breakdown Structure (WBS) Export']
      ];
      const wsInfo = XLSX.utils.aoa_to_sheet(projectInfo);
      XLSX.utils.book_append_sheet(wb, wsInfo, 'Project Info');

      // WBS Tasks Sheet
      const wsWBS = XLSX.utils.json_to_sheet(wbsData);

      // Set column widths
      wsWBS['!cols'] = [
        { wch: 10 },  // WBS
        { wch: 6 },   // Level
        { wch: 40 },  // Task Name
        { wch: 50 },  // Description
        { wch: 12 },  // Status
        { wch: 10 },  // Priority
        { wch: 20 },  // Assignee
        { wch: 12 },  // Start Date
        { wch: 12 },  // End Date
        { wch: 14 },  // Duration
        { wch: 12 },  // Progress
        { wch: 16 },  // Estimated Hours
        { wch: 20 }   // Dependencies
      ];

      XLSX.utils.book_append_sheet(wb, wsWBS, 'WBS Tasks');

      // Summary Sheet
      const statusCounts = {};
      const priorityCounts = {};
      tasks.forEach(task => {
        statusCounts[task.status || 'To Do'] = (statusCounts[task.status || 'To Do'] || 0) + 1;
        priorityCounts[task.priority || 'Medium'] = (priorityCounts[task.priority || 'Medium'] || 0) + 1;
      });

      const summaryData = [
        ['Task Summary'],
        [''],
        ['By Status'],
        ...Object.entries(statusCounts).map(([status, count]) => [status, count]),
        [''],
        ['By Priority'],
        ...Object.entries(priorityCounts).map(([priority, count]) => [priority, count])
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // Generate and download file
      XLSX.writeFile(wb, `${project?.title || 'project'}-WBS-${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (error) {
      console.error('Error exporting Excel WBS:', error);
      alert('Failed to export Excel. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Convert task duration to days for display
  const getDurationInDays = useCallback((task) => {
    if (!task.duration || !task.duration.value) return null;

    const value = parseFloat(task.duration.value);
    const unit = task.duration.unit || 'hours';
    const hoursPerDay = company?.settings?.timeTracking?.hoursPerDay || 8;

    switch (unit) {
      case 'minutes': return value / 60 / hoursPerDay;
      case 'hours': return value / hoursPerDay;
      case 'days': return value;
      case 'weeks': return value * 5; // Working days in a week
      default: return value / hoursPerDay;
    }
  }, [company?.settings?.timeTracking?.hoursPerDay]);

  const getTaskPosition = useCallback((task) => {
    const taskStart = task.startDate ? new Date(task.startDate) : null;
    const taskEnd = task.dueDate ? new Date(task.dueDate) : null;

    // If no dates, calculate from duration if available
    let effectiveStart = taskStart;
    let effectiveEnd = taskEnd;

    if (!effectiveStart && !effectiveEnd) {
      // No dates at all - show at today with estimated duration
      effectiveStart = new Date(today);
      const durationDays = getDurationInDays(task);
      if (durationDays) {
        effectiveEnd = new Date(today.getTime() + durationDays * 24 * 60 * 60 * 1000);
      } else {
        effectiveEnd = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000); // Default 3 days
      }
    } else if (effectiveStart && !effectiveEnd) {
      // Has start but no end - calculate from duration
      const durationDays = getDurationInDays(task);
      if (durationDays) {
        effectiveEnd = new Date(effectiveStart.getTime() + durationDays * 24 * 60 * 60 * 1000);
      } else {
        effectiveEnd = new Date(effectiveStart.getTime() + 3 * 24 * 60 * 60 * 1000);
      }
    } else if (!effectiveStart && effectiveEnd) {
      // Has end but no start - calculate backwards from duration
      const durationDays = getDurationInDays(task);
      if (durationDays) {
        effectiveStart = new Date(effectiveEnd.getTime() - durationDays * 24 * 60 * 60 * 1000);
      } else {
        effectiveStart = new Date(effectiveEnd.getTime() - 3 * 24 * 60 * 60 * 1000);
      }
    }

    // Reset time parts for accurate day calculations
    effectiveStart.setHours(0, 0, 0, 0);
    effectiveEnd.setHours(23, 59, 59, 999);

    const startOffset = (effectiveStart - startDate) / (1000 * 60 * 60 * 24);
    const durationDays = Math.max(1, Math.ceil((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)));

    return {
      left: startOffset * dayWidth,
      width: Math.max(dayWidth, durationDays * dayWidth),
      startDate: effectiveStart,
      endDate: effectiveEnd,
      durationDays,
      hasDates: !!(task.startDate || task.dueDate)
    };
  }, [startDate, dayWidth, today, getDurationInDays]);

  // Fast holiday name getter
  const getHolidayName = useCallback((date) => {
    if (!date) return '';
    const dateStr = date.toISOString().split('T')[0];
    return holidayMap[dateStr] || '';
  }, [holidayMap]);

  // Handle scroll synchronization
  const handleScroll = (e) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.target;
    setScrollLeft(scrollLeft);
    // Hide shadow when scrolled to the end
    setShowScrollShadow(scrollLeft + clientWidth < scrollWidth - 10);
  };

  // Auto-schedule handler
  const handleAutoSchedule = async () => {
    // Determine start date based on user selection
    const startDateToUse = scheduleStartFrom === 'today'
      ? new Date().toISOString()
      : project?.startDate;

    if (!startDateToUse) {
      setScheduleResult({ success: false, error: 'Please set a project start date first' });
      setShowAutoScheduleModal(false);
      return;
    }

    // Filter tasks with duration (only these can be scheduled)
    const tasksWithDuration = tasks.filter(t => t.duration?.value);
    const tasksNoDuration = tasks.filter(t => !t.duration?.value);

    if (tasksWithDuration.length === 0) {
      setScheduleResult({
        success: false,
        error: `No tasks have duration set. Please add duration to tasks first.`
      });
      setShowAutoScheduleModal(false);
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

      // Auto-schedule all tasks with duration (reschedule everything)
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

      // Update all tasks in a single API call
      await taskAPI.bulkSchedule(project._id, scheduledTasks);

      setShowAutoScheduleModal(false);
      if (onRefresh) {
        await onRefresh();
      }
      setScheduleResult({
        success: true,
        count: scheduledTasks.length,
        noDuration: tasksNoDuration.length,
        mode: schedulingMode,
        maxParallel: maxParallelTasks,
        startedFrom: scheduleStartFrom,
        projectName: project.title
      });
    } catch (error) {
      console.error('Error auto-scheduling tasks:', error);
      setShowAutoScheduleModal(false);
      setScheduleResult({ success: false, error: 'Failed to auto-schedule tasks. Please try again.' });
    } finally {
      setIsAutoScheduling(false);
    }
  };

  const jumpToDate = useCallback((targetDate) => {
    if (!targetDate) return;
    const d = new Date(targetDate);
    d.setHours(0, 0, 0, 0);
    const offset = Math.floor((d - startDate) / (1000 * 60 * 60 * 24));
    const newScrollLeft = Math.max(0, offset * dayWidth - 200); // Offset by 200px to center it a bit

    // Update scroll
    if (ganttContainerRef.current) {
      const scrollContainer = ganttContainerRef.current.querySelector('.gantt-scroll-container');
      if (scrollContainer) {
        scrollContainer.scrollLeft = newScrollLeft;
      }
    }
  }, [startDate, dayWidth]);

  const jumpToToday = () => jumpToDate(new Date());

  // Calculate today's position for the "Today" marker line
  const todayPosition = useMemo(() => {
    const todayOffset = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    return todayOffset * dayWidth;
  }, [startDate, today, dayWidth]);

  const renderTaskRows = (taskList, level = 0) => {
    return taskList.map(task => (
      <React.Fragment key={task._id}>
        <MemoizedGanttRow
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
          todayPosition={todayPosition}
          teamActivity={teamActivity}
        />
        {task.children && task.children.length > 0 && expandedTasks.has(task._id) && (
          renderTaskRows(task.children, level + 1)
        )}
      </React.Fragment>
    ));
  };

  return (
    <div style={{
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
      position: 'relative',
      margin: '24px 0',
      fontFamily: '"Outfit", "Inter", sans-serif'
    }}>
      {/* High-End Integrated Toolbar */}
      <div style={{
        padding: '24px 32px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '20px' }}>🗓️</span>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
                Project Timeline
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                fontSize: '11px',
                color: '#3b82f6',
                backgroundColor: '#eff6ff',
                padding: '2px 10px',
                borderRadius: '20px',
                fontWeight: '700',
                border: '1px solid #3b82f620'
              }}>
                {tasks.length} Syncronized Tasks
              </span>
              <div style={{ width: '4px', height: '4px', backgroundColor: '#cbd5e1', borderRadius: '50%' }} />
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                Resource optimized scheduling
              </span>
            </div>
          </div>

          <div style={{ width: '1px', height: '40px', backgroundColor: '#e2e8f0' }} />

          {/* Calendar Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={jumpToToday}
              style={{
                padding: '8px 16px',
                backgroundColor: '#eff6ff',
                color: '#3b82f6',
                border: '1px solid #3b82f630',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '700',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
            >
              Today
            </button>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="date"
                onChange={(e) => jumpToDate(e.target.value)}
                style={{
                  padding: '8px 12px', paddingLeft: '32px', borderRadius: '10px', border: '1px solid #e2e8f0',
                  fontSize: '12px', color: '#475569', fontWeight: '600', outline: 'none', backgroundColor: 'white', cursor: 'pointer'
                }}
              />
              <span style={{ position: 'absolute', left: '10px', fontSize: '14px', pointerEvents: 'none' }}>📅</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Documentation Button */}
          <button
            onClick={() => setShowGuide(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              color: '#475569',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <span>📖</span> Guide
          </button>

          {/* Export Dropdown */}
          <div style={{ position: 'relative' }} ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={tasks.length === 0 || isExporting}
              style={{
                padding: '10px 24px',
                backgroundColor: tasks.length === 0 ? '#f1f5f9' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: tasks.length === 0 || isExporting ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.2s',
                boxShadow: tasks.length === 0 ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.2)'
              }}
            >
              <span>📥</span> Export <span style={{ fontSize: '10px', opacity: 0.7 }}>{showExportMenu ? '▲' : '▼'}</span>
            </button>
            {showExportMenu && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0', minWidth: '220px', zIndex: 100, padding: '6px'
              }}>
                {[
                  { label: 'Export as PNG', icon: '🖼️', action: exportAsPNG },
                  { label: 'Export as CSV', icon: '📊', action: exportAsCSV },
                  { label: 'Export as JSON', icon: '📋', action: exportAsJSON }
                ].map((item, id) => (
                  <button key={id} onClick={() => { item.action(); setShowExportMenu(false); }} style={{ width: '100%', padding: '12px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px', color: '#475569', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}>
                    <span style={{ fontSize: '18px' }}>{item.icon}</span> {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auto-Schedule Button */}
          <button
            onClick={() => setShowAutoScheduleModal(true)}
            style={{
              padding: '10px 28px',
              backgroundColor: '#3b82f6',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)'
            }}
          >
            <span>⚡</span> Auto Schedule
          </button>
        </div>
      </div>


      {/* Main Gantt Area */}
      <div
        ref={ganttContainerRef}
        style={{
          display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 250px)',
          overflow: 'hidden', position: 'relative', backgroundColor: 'white'
        }}
      >
        {/* Scroll Shadows */}
        {showScrollShadow && (
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: '40px',
            background: 'linear-gradient(to left, rgba(248, 250, 252, 0.8), transparent)',
            pointerEvents: 'none', zIndex: 15
          }} />
        )}

        {/* Header with Sticky Task List and Calendar View */}
        <div style={{
          display: 'flex', borderBottom: '2px solid #f1f5f9', position: 'sticky',
          top: 0, zIndex: 20, backgroundColor: '#f8fafc'
        }}>
          {/* Sidebar header (Total Task Detail) */}
          <div style={{
            width: '350px', borderRight: '1px solid #e2e8f0',
            fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase',
            letterSpacing: '0.08em', flexShrink: 0, backgroundColor: '#f8fafc',
            display: 'flex', alignItems: 'center', padding: '0 24px', alignSelf: 'stretch'
          }}>Task Detail & Resource</div>

          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            {/* Month Row */}
            <div style={{
              display: 'flex', width: totalDays * dayWidth, transform: `translateX(-${scrollLeft}px)`,
              transition: 'transform 0.1s linear', borderBottom: '1px solid #e2e8f0'
            }}>
              {monthHeaders.map((group, idx) => (
                <div key={idx} style={{
                  width: group.count * dayWidth, flexShrink: 0, padding: '8px 12px',
                  fontSize: '11px', fontWeight: '700', color: '#475569', borderRight: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  {group.label}
                </div>
              ))}
            </div>

            {/* Day Row */}
            <div style={{
              display: 'flex', width: totalDays * dayWidth, transform: `translateX(-${scrollLeft}px)`,
              transition: 'transform 0.1s linear'
            }}>
              {dateHeaders.map((date, index) => {
                const isToday = date.toDateString() === today.toDateString();
                const day = gridData[index];
                return (
                  <div key={index} title={day.isHol ? `Holiday: ${day.holidayName}` : ''} style={{
                    width: dayWidth, padding: '12px 0', borderRight: '1px solid #f1f5f9', fontSize: '11px',
                    textAlign: 'center', color: isToday ? '#3b82f6' : (day.isHol ? '#ef4444' : '#94a3b8'),
                    backgroundColor: isToday ? '#eff6ff' : (day.isHol ? '#fff1f2' : (day.isWeekend ? '#f8fafc' : 'transparent')),
                    fontWeight: isToday || day.isHol ? '800' : '600', position: 'relative', flexShrink: 0,
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px',
                    boxShadow: isToday ? 'inset 0 -3px 0 #3b82f6' : 'none'
                  }}>
                    <div style={{ fontSize: '12px', color: isToday ? '#2563eb' : 'inherit' }}>{date.getDate()}</div>
                    <div style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.6 }}>{date.toLocaleDateString('en', { weekday: 'short' }).slice(0, 1)}</div>
                    {day.isHol && <div style={{ fontSize: '10px' }}>🎁</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tasks Container with Unified Scroll */}
        <div className="gantt-scroll-container" style={{ flex: 1, overflow: 'auto', position: 'relative' }} onScroll={handleScroll}>
          {tasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', color: '#5e6c84' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.5 }}>📊</div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#172b4d', fontWeight: '600' }}>No tasks to display</h4>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>Create tasks with dates to see them in the Gantt chart.</p>
            </div>
          ) : (
            <div style={{ minWidth: `${350 + totalDays * dayWidth}px`, position: 'relative' }}>
              {/* Unified Background Grid Layer */}
              <div style={{
                position: 'absolute', top: 0, left: 350, right: 0, bottom: 0,
                display: 'flex', pointerEvents: 'none', zIndex: 0
              }}>
                {gridData.map((day, i) => (
                  <div key={i} style={{
                    width: dayWidth, borderRight: '1px solid #f1f5f9',
                    backgroundColor: day.isHol ? '#fff1f2' : (day.isWeekend ? '#f8fafc' : 'transparent'),
                    height: '100%', flexShrink: 0
                  }} />
                ))}
              </div>

              {/* Tasks Content Layer */}
              <div style={{ position: 'relative', zIndex: 1, minHeight: '100%' }}>
                {renderTaskRows(hierarchicalTasks)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals Section */}
      {showAutoScheduleModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '8px', padding: '32px',
            maxWidth: '600px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600', color: '#172b4d' }}>
              ⚡ Auto-Schedule Tasks
            </h3>

            {/* Scheduling Mode Selection */}
            <div style={{
              backgroundColor: '#f4f5f7',
              borderRadius: '4px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#172b4d' }}>
                📊 Scheduling Mode
              </h4>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <label style={{
                  flex: 1,
                  padding: '12px',
                  border: schedulingMode === 'sequential' ? '2px solid #0052cc' : '2px solid #dfe1e6',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: schedulingMode === 'sequential' ? '#deebff' : 'white',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    name="schedulingMode"
                    value="sequential"
                    checked={schedulingMode === 'sequential'}
                    onChange={(e) => setSchedulingMode(e.target.value)}
                    style={{ display: 'none' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '18px' }}>📋</span>
                    <strong style={{ color: '#172b4d', fontSize: '13px' }}>Sequential</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#5e6c84', lineHeight: '1.4' }}>
                    Tasks run one after another based on priority. Higher priority tasks start first.
                  </p>
                </label>

                <label style={{
                  flex: 1,
                  padding: '12px',
                  border: schedulingMode === 'parallel' ? '2px solid #0052cc' : '2px solid #dfe1e6',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: schedulingMode === 'parallel' ? '#deebff' : 'white',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    name="schedulingMode"
                    value="parallel"
                    checked={schedulingMode === 'parallel'}
                    onChange={(e) => setSchedulingMode(e.target.value)}
                    style={{ display: 'none' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '18px' }}>⚡</span>
                    <strong style={{ color: '#172b4d', fontSize: '13px' }}>Parallel</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#5e6c84', lineHeight: '1.4' }}>
                    Multiple tasks can start at the same time. Great for team collaboration.
                  </p>
                </label>
              </div>

              {schedulingMode === 'parallel' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#e3fcef',
                  borderRadius: '4px',
                  border: '1px solid #36b37e'
                }}>
                  <label style={{ fontSize: '13px', color: '#172b4d', fontWeight: '500' }}>
                    Max parallel tasks:
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[2, 3, 4, 5].map(num => (
                      <button
                        key={num}
                        onClick={() => setMaxParallelTasks(num)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: maxParallelTasks === num ? '2px solid #0052cc' : '1px solid #dfe1e6',
                          backgroundColor: maxParallelTasks === num ? '#0052cc' : 'white',
                          color: maxParallelTasks === num ? 'white' : '#172b4d',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '14px',
                          transition: 'all 0.2s'
                        }}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <span style={{ fontSize: '11px', color: '#5e6c84' }}>
                    tasks at the same time
                  </span>
                </div>
              )}
            </div>

            {/* Priority Info */}
            <div style={{
              backgroundColor: '#fffae6',
              border: '1px solid #ffab00',
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span>🎯</span>
                <strong style={{ fontSize: '13px', color: '#172b4d' }}>Priority-Based Scheduling</strong>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#5e6c84', lineHeight: '1.5' }}>
                Tasks are automatically sorted by priority before scheduling:
                <span style={{ marginLeft: '8px' }}>
                  🔴 Urgent → 🟠 High → 🟡 Medium → 🟢 Low
                </span>
              </p>
            </div>

            {/* Start Date Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#172b4d', marginBottom: '8px' }}>
                Start Scheduling From
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{
                  flex: 1, padding: '12px', border: scheduleStartFrom === 'project' ? '2px solid #0052cc' : '1px solid #dfe1e6',
                  borderRadius: '4px', cursor: 'pointer', backgroundColor: scheduleStartFrom === 'project' ? '#deebff' : 'white'
                }}>
                  <input
                    type="radio" name="ganttStartFrom" value="project"
                    checked={scheduleStartFrom === 'project'}
                    onChange={() => setScheduleStartFrom('project')}
                    style={{ marginRight: '8px' }}
                  />
                  <strong>Project Start</strong>
                  <div style={{ fontSize: '12px', color: '#5e6c84', marginTop: '4px' }}>
                    {project?.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
                  </div>
                </label>
                <label style={{
                  flex: 1, padding: '12px', border: scheduleStartFrom === 'today' ? '2px solid #0052cc' : '1px solid #dfe1e6',
                  borderRadius: '4px', cursor: 'pointer', backgroundColor: scheduleStartFrom === 'today' ? '#deebff' : 'white'
                }}>
                  <input
                    type="radio" name="ganttStartFrom" value="today"
                    checked={scheduleStartFrom === 'today'}
                    onChange={() => setScheduleStartFrom('today')}
                    style={{ marginRight: '8px' }}
                  />
                  <strong>Today</strong>
                  <div style={{ fontSize: '12px', color: '#5e6c84', marginTop: '4px' }}>
                    {new Date().toLocaleDateString()}
                  </div>
                </label>
              </div>
            </div>

            {/* Warning about rescheduling */}
            <div style={{
              padding: '10px 14px', backgroundColor: '#fef3c7', borderRadius: '6px',
              fontSize: '12px', color: '#92400e', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span>⚠️</span>
              <span>This will reschedule all tasks with duration. Existing dates will be replaced.</span>
            </div>

            {/* Project Info */}
            <div style={{
              backgroundColor: '#f4f5f7',
              borderRadius: '4px',
              padding: '16px',
              marginBottom: '24px'
            }}>
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
                disabled={isAutoScheduling || (scheduleStartFrom === 'project' && !project?.startDate)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: isAutoScheduling || (scheduleStartFrom === 'project' && !project?.startDate) ? '#dfe1e6' : '#0052cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: isAutoScheduling || (scheduleStartFrom === 'project' && !project?.startDate) ? 'not-allowed' : 'pointer',
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

      {scheduleResult && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '20px', padding: '32px', maxWidth: '480px',
            width: '90%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{scheduleResult.success ? '✅' : '⚠️'}</div>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '700' }}>{scheduleResult.success ? 'Tasks Scheduled!' : 'Failed'}</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>{scheduleResult.success ? `Successfully updated ${scheduleResult.count} tasks.` : scheduleResult.error}</p>
            <button onClick={() => setScheduleResult(null)} style={{ padding: '12px 32px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GanttView;