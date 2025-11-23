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
const isWorkingDay = (date, workingDays, holidays, employeeLeaves = []) => {
  const dayOfWeek = date.getDay();
  
  // Check if it's a working day of the week
  if (!workingDays.includes(dayOfWeek)) {
    return false;
  }
  
  // Check if it's a holiday
  const dateStr = date.toISOString().split('T')[0];
  const isHoliday = holidays.some(holiday => {
    const holidayDate = new Date(holiday.date).toISOString().split('T')[0];
    return holidayDate === dateStr;
  });
  
  if (isHoliday) {
    return false;
  }
  
  // Check if any assigned employee is on leave
  const isOnLeave = employeeLeaves.some(leave => {
    const leaveStart = new Date(leave.startDate);
    const leaveEnd = new Date(leave.endDate);
    return date >= leaveStart && date <= leaveEnd;
  });
  
  return !isOnLeave;
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
  
  // Determine start date (use project start date if not specified)
  let taskStartDate = task.startDate ? new Date(task.startDate) : new Date(projectStartDate);
  
  // Ensure start date is a working day
  while (!isWorkingDay(taskStartDate, workingDays, holidays)) {
    taskStartDate.setDate(taskStartDate.getDate() + 1);
  }
  
  // Get employee leaves for this task
  const employeeLeaves = filterEmployeeLeaves(
    allLeaves,
    task.assignees,
    taskStartDate,
    new Date(taskStartDate.getTime() + workingDaysNeeded * 7 * 24 * 60 * 60 * 1000) // Rough estimate
  );
  
  // Calculate end date by adding working days
  const taskEndDate = addWorkingDays(
    taskStartDate,
    workingDaysNeeded - 1, // -1 because start date counts as day 1
    workingDays,
    holidays,
    employeeLeaves
  );
  
  return {
    startDate: taskStartDate,
    dueDate: taskEndDate,
    workingDaysCalculated: workingDaysNeeded
  };
};

/**
 * Auto-schedule all tasks in a project
 */
export const autoScheduleAllTasks = (tasks, projectStartDate, settings, allLeaves = []) => {
  const scheduledTasks = [];
  const taskMap = new Map();
  
  // Build task hierarchy
  tasks.forEach(task => {
    taskMap.set(task._id, { ...task, children: [] });
  });
  
  tasks.forEach(task => {
    if (task.parent) {
      const parentId = typeof task.parent === 'object' ? task.parent._id : task.parent;
      const parent = taskMap.get(parentId);
      if (parent) {
        parent.children.push(taskMap.get(task._id));
      }
    }
  });
  
  // Schedule tasks in order
  let currentDate = new Date(projectStartDate);
  
  tasks.forEach(task => {
    const calculatedDates = calculateTaskDates(
      task,
      currentDate,
      settings,
      allLeaves
    );
    
    if (calculatedDates) {
      scheduledTasks.push({
        taskId: task._id,
        ...calculatedDates
      });
      
      // Next task starts after this one ends (sequential scheduling)
      currentDate = new Date(calculatedDates.dueDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });
  
  return scheduledTasks;
};

