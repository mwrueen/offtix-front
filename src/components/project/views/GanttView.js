import React, { useState, useEffect, useRef } from 'react';
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
          height: 12px;
          width: 12px;
        }
        .gantt-scroll-container::-webkit-scrollbar-track {
          background: #f4f5f7;
          border-radius: 6px;
        }
        .gantt-scroll-container::-webkit-scrollbar-thumb {
          background: #0052cc;
          border-radius: 6px;
          border: 2px solid #f4f5f7;
        }
        .gantt-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #0065ff;
        }
        .gantt-scroll-container {
          scrollbar-width: thin;
          scrollbar-color: #0052cc #f4f5f7;
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

  // Calculate date range based on tasks with dates, or use defaults
  const calculateDateRange = () => {
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

    // If no task dates, use project dates or defaults
    if (!minDate) {
      minDate = project?.startDate ? new Date(project.startDate) : new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    if (!maxDate) {
      maxDate = project?.endDate ? new Date(project.endDate) : new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
    }

    // Add padding: 7 days before and 14 days after
    const paddedStart = new Date(minDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const paddedEnd = new Date(maxDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Ensure today is visible
    if (paddedStart > today) paddedStart.setTime(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (paddedEnd < today) paddedEnd.setTime(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    return { start: paddedStart, end: paddedEnd };
  };

  const dateRange = calculateDateRange();
  const startDate = dateRange.start;
  const endDate = dateRange.end;

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
  const getDurationInDays = (task) => {
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
  };

  const getTaskPosition = (task) => {
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

      // Update each task with calculated dates
      for (const scheduledTask of scheduledTasks) {
        await onUpdateTask(scheduledTask.taskId, {
          startDate: scheduledTask.startDate,
          dueDate: scheduledTask.dueDate
        });
      }

      setShowAutoScheduleModal(false);
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

  // Calculate today's position for the "Today" marker line
  const todayOffset = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  const todayPosition = todayOffset * dayWidth;

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
          todayPosition={todayPosition}
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
      boxShadow: '0 1px 2px rgba(9, 30, 66, 0.08)',
      position: 'relative'
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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Export Button with Dropdown */}
          <div style={{ position: 'relative' }} ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={tasks.length === 0 || isExporting}
              style={{
                padding: '10px 20px',
                backgroundColor: tasks.length === 0 ? '#dfe1e6' : '#36b37e',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: tasks.length === 0 || isExporting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (tasks.length > 0 && !isExporting) {
                  e.currentTarget.style.backgroundColor = '#2d9d6a';
                }
              }}
              onMouseLeave={(e) => {
                if (tasks.length > 0 && !isExporting) {
                  e.currentTarget.style.backgroundColor = '#36b37e';
                }
              }}
            >
              {isExporting ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                  Exporting...
                </>
              ) : (
                <>
                  <span>📥</span>
                  Export
                  <span style={{ fontSize: '10px' }}>▼</span>
                </>
              )}
            </button>

            {/* Export Dropdown Menu */}
            {showExportMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: 'white',
                borderRadius: '6px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                border: '1px solid #dfe1e6',
                minWidth: '180px',
                zIndex: 100,
                overflow: 'hidden'
              }}>
                <button
                  onClick={exportAsPNG}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#172b4d',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f4f5f7'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <span>🖼️</span>
                  Export as PNG
                </button>
                <button
                  onClick={exportAsCSV}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#172b4d',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f4f5f7'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <span>📊</span>
                  Export as CSV
                </button>
                <button
                  onClick={exportAsJSON}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#172b4d',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f4f5f7'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <span>📋</span>
                  Export as JSON
                </button>
                <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }} />
                <button
                  onClick={exportAsExcelWBS}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#172b4d',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f4f5f7'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <span>📑</span>
                  Export Excel (WBS)
                </button>
              </div>
            )}
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
      </div>

      {/* Gantt Container with Single Horizontal Scroll */}
      <div
        ref={ganttContainerRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 300px)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Scroll Shadow Indicator */}
        {showScrollShadow && (
          <div style={{
            position: 'absolute',
            right: 0,
            top: '60px',
            bottom: 0,
            width: '30px',
            background: 'linear-gradient(to left, rgba(0, 0, 0, 0.1), transparent)',
            pointerEvents: 'none',
            zIndex: 5
          }} />
        )}
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
            letterSpacing: '0.5px',
            flexShrink: 0
          }}>
            Issue
          </div>

          <div style={{
            flex: 1,
            backgroundColor: '#f4f5f7',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              width: totalDays * dayWidth,
              transform: `translateX(-${scrollLeft}px)`,
              transition: 'transform 0.05s linear'
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
                      position: 'relative',
                      flexShrink: 0
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

        {/* Tasks Container with Unified Scroll */}
        <div
          className="gantt-scroll-container"
          style={{
            flex: 1,
            overflow: 'auto',
            position: 'relative'
          }}
          onScroll={handleScroll}
        >
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
            <div style={{
              minWidth: `${350 + totalDays * dayWidth}px`
            }}>
              {renderTaskRows(hierarchicalTasks)}
            </div>
          )}
        </div>
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

      {/* Schedule Result Modal */}
      {scheduleResult && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '32px',
            maxWidth: '480px', width: '90%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            {scheduleResult.success ? (
              <>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#d1fae5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px', fontSize: '32px'
                }}>✅</div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#065f46' }}>
                  Tasks Scheduled!
                </h2>
                <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: '#6b7280' }}>
                  Tasks have been scheduled based on priority and duration.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
                  <div style={{ padding: '14px 20px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', minWidth: '100px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#16a34a' }}>{scheduleResult.count}</div>
                    <div style={{ fontSize: '11px', color: '#15803d', fontWeight: '500' }}>SCHEDULED</div>
                  </div>
                  <div style={{ padding: '14px 20px', backgroundColor: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', minWidth: '100px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>
                      {scheduleResult.mode === 'parallel' ? `${scheduleResult.maxParallel}x` : '1x'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: '500' }}>
                      {scheduleResult.mode === 'parallel' ? 'PARALLEL' : 'SEQUENTIAL'}
                    </div>
                  </div>
                  {scheduleResult.noDuration > 0 && (
                    <div style={{ padding: '14px 20px', backgroundColor: '#fef3c7', borderRadius: '12px', border: '1px solid #fde68a', minWidth: '100px' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#92400e' }}>{scheduleResult.noDuration}</div>
                      <div style={{ fontSize: '11px', color: '#92400e', fontWeight: '500' }}>NO DURATION</div>
                    </div>
                  )}
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: '#f0fdf4', borderRadius: '6px', fontSize: '13px', color: '#065f46', marginBottom: '16px' }}>
                  📅 Scheduled from: <strong>{scheduleResult.startedFrom === 'today' ? 'Today' : 'Project Start Date'}</strong>
                </div>
                {scheduleResult.noDuration > 0 && (
                  <div style={{ padding: '10px 14px', backgroundColor: '#fef3c7', borderRadius: '6px', fontSize: '12px', color: '#92400e', marginBottom: '16px' }}>
                    ⚠ <strong>{scheduleResult.noDuration}</strong> task(s) have no duration - add duration to schedule them
                  </div>
                )}
                <button
                  onClick={() => setScheduleResult(null)}
                  style={{
                    padding: '12px 32px', backgroundColor: '#0052cc', border: 'none',
                    borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: 'white', fontWeight: '600'
                  }}
                >Close</button>
              </>
            ) : (
              <>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#fee2e2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px', fontSize: '32px'
                }}>⚠️</div>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
                  Scheduling Failed
                </h2>
                <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: '#6b7280' }}>
                  {scheduleResult.error}
                </p>
                <button
                  onClick={() => setScheduleResult(null)}
                  style={{
                    padding: '12px 32px', backgroundColor: '#dc2626', border: 'none',
                    borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: 'white', fontWeight: '600'
                  }}
                >Close</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const GanttRow = ({ task, level, totalDays, dayWidth, getTaskPosition, onEdit, onDelete, onAddSubtask, isExpanded, onToggleExpand, hasChildren, isHoliday, startDate, todayPosition }) => {
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

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
        gap: '8px',
        flexShrink: 0,
        backgroundColor: level > 0 ? '#fafbfc' : 'white'
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
            marginBottom: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {task.title}
          </div>
          <div style={{
            fontSize: '10px',
            color: '#5e6c84',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap'
          }}>
            {/* Date range */}
            {(task.startDate || task.dueDate) && (
              <span style={{
                color: '#0052cc',
                fontWeight: '500'
              }}>
                📅 {formatDate(task.startDate) || '?'} → {formatDate(task.dueDate) || '?'}
              </span>
            )}
            {/* Duration */}
            {task.duration?.value && (
              <>
                {(task.startDate || task.dueDate) && <span>•</span>}
                <span>⏱️ {task.duration.value} {task.duration.unit}</span>
              </>
            )}
            {/* Assignee */}
            {task.assignees && task.assignees.length > 0 && (
              <>
                <span>•</span>
                <span>👤 {task.assignees[0].name}</span>
              </>
            )}
            {/* Priority */}
            {task.priority && (
              <>
                <span>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
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
        overflow: 'visible',
        backgroundColor: level > 0 ? '#fafbfc' : 'white'
      }}>
        <div style={{
          width: totalDays * dayWidth,
          height: '100%',
          position: 'relative',
          minHeight: '52px'
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

          {/* Today marker line */}
          {todayPosition >= 0 && todayPosition <= totalDays * dayWidth && (
            <div
              style={{
                position: 'absolute',
                left: todayPosition + dayWidth / 2,
                top: 0,
                bottom: 0,
                width: '2px',
                backgroundColor: '#0052cc',
                zIndex: 10,
                pointerEvents: 'none'
              }}
            />
          )}

          {/* Task Bar */}
          <div
            title={`${task.title}\n${position.startDate ? position.startDate.toLocaleDateString() : 'No start'} → ${position.endDate ? position.endDate.toLocaleDateString() : 'No end'}\nDuration: ${position.durationDays} day${position.durationDays !== 1 ? 's' : ''}${task.duration?.value ? ` (${task.duration.value} ${task.duration.unit})` : ''}`}
            style={{
              position: 'absolute',
              left: Math.max(0, position.left),
              width: position.width,
              height: level > 0 ? '20px' : '28px',
              top: level > 0 ? '16px' : '12px',
              backgroundColor: position.hasDates ? priorityColor : '#c1c7d0',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 8px',
              color: 'white',
              fontSize: level > 0 ? '10px' : '11px',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: position.hasDates ? '0 2px 4px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.1)',
              zIndex: 5,
              transition: 'all 0.2s ease',
              border: position.hasDates ? 'none' : '2px dashed #8993a4',
              opacity: position.hasDates ? 1 : 0.7
            }}
            onClick={() => onEdit(task)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = position.hasDates ? '0 2px 4px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.1)';
            }}
          >
            {/* Task title (left side) */}
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}>
              {!position.hasDates && '⚠️ '}
              {task.title}
            </span>

            {/* Duration badge (right side) */}
            {position.width > 80 && (
              <span style={{
                backgroundColor: 'rgba(255,255,255,0.25)',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '10px',
                marginLeft: '6px',
                flexShrink: 0
              }}>
                {position.durationDays}d
              </span>
            )}
          </div>

          {/* Start date marker */}
          {task.startDate && (
            <div style={{
              position: 'absolute',
              left: position.left - 1,
              top: level > 0 ? '14px' : '10px',
              width: '2px',
              height: level > 0 ? '24px' : '32px',
              backgroundColor: '#172b4d',
              zIndex: 7
            }} />
          )}

          {/* Due date marker (deadline indicator) */}
          {task.dueDate && (
            <div style={{
              position: 'absolute',
              left: position.left + position.width - 1,
              top: level > 0 ? '14px' : '10px',
              width: '2px',
              height: level > 0 ? '24px' : '32px',
              backgroundColor: '#de350b',
              zIndex: 7
            }} />
          )}

          {/* Progress indicator based on status */}
          {task.status && task.status.name && (
            <div
              style={{
                position: 'absolute',
                left: Math.max(0, position.left),
                width: task.status.name.toLowerCase() === 'done' ? position.width :
                       task.status.name.toLowerCase().includes('progress') ? position.width * 0.5 :
                       position.width * 0.1,
                height: level > 0 ? '20px' : '28px',
                top: level > 0 ? '16px' : '12px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '4px',
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