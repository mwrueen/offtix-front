/**
 * Advanced Gantt Chart Auto-Scheduler
 * Automatically calculates task dates based on:
 * - Task duration
 * - Project start date
 * - Company working days
 * - Company working hours (start and end time)
 * - Company holidays
 * - Employee leaves
 * - Task dependencies
 *
 * Working Hours Feature:
 * - Uses workingHoursStart and workingHoursEnd from company/project settings
 * - Calculates actual working hours per day (e.g., 09:00 to 17:00 = 8 hours)
 * - Task durations are converted based on actual working hours
 * - Example: If working hours are 09:00-13:00 (4 hours), an 8-hour task takes 2 days
 */

/**
 * Check if a date is a working day
 */
const isWorkingDay = (date, workingDays, holidays = [], employeeLeaves = []) => {
  // Normalize the date to midnight for consistent comparison
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  const dayOfWeek = checkDate.getDay();

  // Check if it's a working day of the week (0 = Sunday, 6 = Saturday)
  // Default working days are Mon-Fri (1-5)
  if (!workingDays.includes(dayOfWeek)) {
    return false;
  }

  // Check if it's a holiday
  if (holidays && holidays.length > 0) {
    const year = checkDate.getFullYear();
    const month = String(checkDate.getMonth() + 1).padStart(2, '0');
    const day = String(checkDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const isHoliday = holidays.some(holiday => {
      if (!holiday.date) return false;
      const holidayDate = new Date(holiday.date);
      holidayDate.setHours(0, 0, 0, 0);
      const hYear = holidayDate.getFullYear();
      const hMonth = String(holidayDate.getMonth() + 1).padStart(2, '0');
      const hDay = String(holidayDate.getDate()).padStart(2, '0');
      const holidayStr = `${hYear}-${hMonth}-${hDay}`;
      return holidayStr === dateStr;
    });

    if (isHoliday) {
      return false;
    }
  }

  // Check if any assigned employee is on leave
  if (employeeLeaves && employeeLeaves.length > 0) {
    const isOnLeave = employeeLeaves.some(leave => {
      const leaveStart = new Date(leave.startDate);
      leaveStart.setHours(0, 0, 0, 0);
      const leaveEnd = new Date(leave.endDate);
      leaveEnd.setHours(23, 59, 59, 999);
      return checkDate >= leaveStart && checkDate <= leaveEnd;
    });

    if (isOnLeave) {
      return false;
    }
  }

  return true;
};

/**
 * Add working days to a date
 */
const addWorkingDays = (startDate, daysToAdd, workingDays, holidays, employeeLeaves = []) => {
  let currentDate = new Date(startDate);
  let daysAdded = 0;
  
  while (daysAdded < daysToAdd) {
    currentDate.setDate(currentDate.getDate() + 1);
    
    if (isWorkingDay(currentDate, workingDays, holidays, employeeLeaves)) {
      daysAdded++;
    }
  }
  
  return currentDate;
};

/**
 * Calculate actual working hours per day from start and end times
 */
const calculateWorkingHoursPerDay = (timeTrackingSettings) => {
  const { workingHoursStart = '09:00', workingHoursEnd = '17:00', hoursPerDay = 8 } = timeTrackingSettings;

  // If working hours are defined, calculate from them
  if (workingHoursStart && workingHoursEnd) {
    const [startHour, startMinute] = workingHoursStart.split(':').map(Number);
    const [endHour, endMinute] = workingHoursEnd.split(':').map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const totalMinutes = endMinutes - startMinutes;

    return totalMinutes / 60; // Convert to hours
  }

  // Fallback to hoursPerDay setting
  return hoursPerDay;
};

/**
 * Convert duration to working days
 */
const convertDurationToWorkingDays = (duration, timeTrackingSettings) => {
  if (!duration || !duration.value) return 0;

  const { value, unit } = duration;
  const { daysPerWeek = 5 } = timeTrackingSettings;

  // Calculate actual working hours per day
  const actualHoursPerDay = calculateWorkingHoursPerDay(timeTrackingSettings);

  switch (unit) {
    case 'minutes':
      return Math.ceil(value / (actualHoursPerDay * 60));
    case 'hours':
      return Math.ceil(value / actualHoursPerDay);
    case 'days':
      return value;
    case 'weeks':
      return value * daysPerWeek;
    default:
      return 0;
  }
};

/**
 * Get employee leaves for a specific date range and assignees
 */
const filterEmployeeLeaves = (allLeaves, assignees, startDate, endDate) => {
  if (!allLeaves || !assignees || assignees.length === 0) {
    return [];
  }
  
  const assigneeIds = assignees.map(a => typeof a === 'object' ? a._id : a);
  
  return allLeaves.filter(leave => {
    const leaveEmployeeId = typeof leave.employee === 'object' ? leave.employee._id : leave.employee;
    const isAssignedEmployee = assigneeIds.includes(leaveEmployeeId);
    const leaveStart = new Date(leave.startDate);
    const leaveEnd = new Date(leave.endDate);
    
    // Check if leave overlaps with the date range
    const overlaps = leaveStart <= endDate && leaveEnd >= startDate;
    
    return isAssignedEmployee && overlaps && leave.status === 'approved';
  });
};

/**
 * Find the next working day from a given date
 */
const getNextWorkingDay = (date, workingDays, holidays, employeeLeaves = []) => {
  let currentDate = new Date(date);
  currentDate.setHours(0, 0, 0, 0);

  // Keep moving forward until we find a working day
  while (!isWorkingDay(currentDate, workingDays, holidays, employeeLeaves)) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return currentDate;
};

/**
 * Calculate task dates automatically
 */
export const calculateTaskDates = (task, projectStartDate, settings, allLeaves = []) => {
  const { workingDays = [1, 2, 3, 4, 5], holidays = [], timeTracking = {} } = settings;

  // If task has no duration, return null
  if (!task.duration || !task.duration.value) {
    return null;
  }

  // Convert duration to working days
  const workingDaysNeeded = convertDurationToWorkingDays(task.duration, timeTracking);

  if (workingDaysNeeded === 0) {
    return null;
  }

  // Get employee leaves for this task (rough estimate for date range)
  const employeeLeaves = filterEmployeeLeaves(
    allLeaves,
    task.assignees,
    new Date(projectStartDate),
    new Date(new Date(projectStartDate).getTime() + workingDaysNeeded * 14 * 24 * 60 * 60 * 1000) // Rough estimate with buffer
  );

  // Determine start date (use project start date if not specified)
  let taskStartDate = task.startDate ? new Date(task.startDate) : new Date(projectStartDate);
  taskStartDate.setHours(0, 0, 0, 0);

  // Ensure start date is a working day (skips weekends and holidays)
  taskStartDate = getNextWorkingDay(taskStartDate, workingDays, holidays, employeeLeaves);

  // Calculate end date by adding working days
  let taskEndDate;
  if (workingDaysNeeded === 1) {
    // If only 1 day, end date is same as start date
    taskEndDate = new Date(taskStartDate);
  } else {
    // Add working days (workingDaysNeeded - 1 because start day counts as day 1)
    taskEndDate = addWorkingDays(
      taskStartDate,
      workingDaysNeeded - 1,
      workingDays,
      holidays,
      employeeLeaves
    );
  }

  taskEndDate.setHours(23, 59, 59, 999);

  return {
    startDate: taskStartDate,
    dueDate: taskEndDate,
    workingDaysCalculated: workingDaysNeeded
  };
};

/**
 * Priority order for sorting (higher value = scheduled first)
 */
const PRIORITY_ORDER = {
  'urgent': 4,
  'high': 3,
  'medium': 2,
  'low': 1,
  '': 0,
  undefined: 0,
  null: 0
};

/**
 * Sort tasks by priority (urgent first, then high, medium, low)
 */
const sortTasksByPriority = (tasks) => {
  return [...tasks].sort((a, b) => {
    const priorityA = PRIORITY_ORDER[a.priority] || 0;
    const priorityB = PRIORITY_ORDER[b.priority] || 0;
    return priorityB - priorityA; // Higher priority first
  });
};

/**
 * Auto-schedule all tasks in a project
 * @param {Array} tasks - List of tasks to schedule
 * @param {Date} projectStartDate - Project start date
 * @param {Object} settings - Scheduling settings (workingDays, holidays, timeTracking)
 * @param {Array} allLeaves - Employee leaves
 * @param {Object} options - Scheduling options
 * @param {string} options.mode - 'sequential' (one after another) or 'parallel' (multiple at same time)
 * @param {number} options.maxParallel - Maximum number of parallel tasks (for parallel mode)
 */
export const autoScheduleAllTasks = (tasks, projectStartDate, settings, allLeaves = [], options = {}) => {
  const { mode = 'sequential', maxParallel = 3 } = options;
  const { workingDays = [1, 2, 3, 4, 5], holidays = [] } = settings;
  const scheduledTasks = [];

  // Filter only tasks with duration
  const tasksWithDuration = tasks.filter(task => task.duration?.value);

  // Sort all tasks by priority (urgent first)
  const sortedTasksToSchedule = sortTasksByPriority(tasksWithDuration);

  // Start scheduling from the provided start date
  let currentDate = new Date(projectStartDate);

  // Ensure we start on a working day
  while (!isWorkingDay(currentDate, workingDays, holidays)) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (mode === 'parallel') {
    // Parallel scheduling: Group tasks by priority and schedule them in parallel
    const priorityGroups = {
      urgent: [],
      high: [],
      medium: [],
      low: [],
      none: []
    };

    // Group tasks by priority
    sortedTasksToSchedule.forEach(task => {
      const priority = task.priority || 'none';
      if (priorityGroups[priority]) {
        priorityGroups[priority].push(task);
      } else {
        priorityGroups.none.push(task);
      }
    });

    // Process each priority group
    ['urgent', 'high', 'medium', 'low', 'none'].forEach(priority => {
      const groupTasks = priorityGroups[priority];

      // Process tasks in batches of maxParallel
      for (let i = 0; i < groupTasks.length; i += maxParallel) {
        const batch = groupTasks.slice(i, i + maxParallel);
        let maxEndDate = currentDate;

        // Schedule all tasks in batch starting from same date
        batch.forEach(task => {
          const calculatedDates = calculateTaskDates(
            { ...task, startDate: null }, // Force recalculate from currentDate
            currentDate,
            settings,
            allLeaves
          );

          if (calculatedDates) {
            scheduledTasks.push({
              taskId: task._id,
              ...calculatedDates
            });

            // Track the latest end date in this batch
            if (calculatedDates.dueDate > maxEndDate) {
              maxEndDate = calculatedDates.dueDate;
            }
          }
        });

        // Next batch starts after the longest task in current batch ends
        if (batch.length > 0) {
          currentDate = new Date(maxEndDate);
          currentDate.setDate(currentDate.getDate() + 1);
          // Ensure next start is a working day
          while (!isWorkingDay(currentDate, workingDays, holidays)) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      }
    });
  } else {
    // Sequential scheduling: One task after another, but sorted by priority
    sortedTasksToSchedule.forEach(task => {
      const calculatedDates = calculateTaskDates(
        { ...task, startDate: null }, // Force recalculate from currentDate
        currentDate,
        settings,
        allLeaves
      );

      if (calculatedDates) {
        scheduledTasks.push({
          taskId: task._id,
          ...calculatedDates
        });

        // Next task starts after this one ends
        currentDate = new Date(calculatedDates.dueDate);
        currentDate.setDate(currentDate.getDate() + 1);
        // Ensure next start is a working day
        while (!isWorkingDay(currentDate, workingDays, holidays)) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });
  }

  return scheduledTasks;
};

