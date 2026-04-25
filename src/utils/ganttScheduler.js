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
export const calculateTaskDates = (task, projectStartDate, settings, allLeaves = [], options = {}) => {
  const { workingDays = [1, 2, 3, 4, 5], holidays = [], timeTracking = {} } = settings;
  const { roleId } = options;

  // Find duration and assignees for calculation
  let durationToUse = task.duration;
  let assigneesToUse = task.assignees;

  if (roleId) {
    const ra = task.roleAssignments?.find(a => (a.role?._id || a.role) === roleId);
    if (ra) {
      durationToUse = ra.duration || task.duration;
      assigneesToUse = ra.assignees || task.assignees;
    }
  }

  // If task has no duration, return null
  if (!durationToUse || !durationToUse.value) {
    return null;
  }

  // Convert duration to working days
  const workingDaysNeeded = convertDurationToWorkingDays(durationToUse, timeTracking);

  if (workingDaysNeeded === 0) {
    return null;
  }

  // Get employee leaves for this role/task
  const employeeLeaves = filterEmployeeLeaves(
    allLeaves,
    assigneesToUse,
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
 * Snap a datetime forward to the next valid working datetime
 * (i.e. inside working hours of a working day).
 */
const snapToWorkingTime = (date, workingDays, holidays, employeeLeaves, timeTracking) => {
  const { workingHoursStart = '09:00', workingHoursEnd = '17:00' } = timeTracking || {};
  const [sh, sm] = workingHoursStart.split(':').map(Number);
  const [eh, em] = workingHoursEnd.split(':').map(Number);

  let d = new Date(date);
  while (!isWorkingDay(d, workingDays, holidays, employeeLeaves)) {
    d.setDate(d.getDate() + 1);
    d.setHours(sh, sm, 0, 0);
  }
  const dayStart = new Date(d); dayStart.setHours(sh, sm, 0, 0);
  const dayEnd = new Date(d); dayEnd.setHours(eh, em, 0, 0);
  if (d < dayStart) return dayStart;
  if (d >= dayEnd) {
    d.setDate(d.getDate() + 1);
    d.setHours(sh, sm, 0, 0);
    while (!isWorkingDay(d, workingDays, holidays, employeeLeaves)) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  }
  return d;
};

/**
 * Add a number of working hours to a starting datetime, respecting
 * working days, holidays, leaves and the daily working window.
 */
const addWorkingHours = (startDateTime, hoursToAdd, workingDays, holidays, employeeLeaves, timeTracking) => {
  const { workingHoursStart = '09:00', workingHoursEnd = '17:00' } = timeTracking || {};
  const [sh, sm] = workingHoursStart.split(':').map(Number);
  const [eh, em] = workingHoursEnd.split(':').map(Number);

  let cursor = snapToWorkingTime(startDateTime, workingDays, holidays, employeeLeaves, timeTracking);
  let remainingMs = Math.max(0, hoursToAdd) * 60 * 60 * 1000;
  let safety = 0;

  while (remainingMs > 0 && safety++ < 5000) {
    if (!isWorkingDay(cursor, workingDays, holidays, employeeLeaves)) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(sh, sm, 0, 0);
      continue;
    }
    const eod = new Date(cursor); eod.setHours(eh, em, 0, 0);
    const slotMs = eod - cursor;
    if (slotMs <= 0) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(sh, sm, 0, 0);
      continue;
    }
    if (remainingMs <= slotMs) {
      cursor = new Date(cursor.getTime() + remainingMs);
      remainingMs = 0;
    } else {
      remainingMs -= slotMs;
      cursor = new Date(eod);
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(sh, sm, 0, 0);
    }
  }
  return cursor;
};

/**
 * Convert a {value, unit} duration to working hours.
 */
const durationToHours = (duration, timeTracking) => {
  if (!duration || duration.value == null) return 0;
  const hpd = calculateWorkingHoursPerDay(timeTracking);
  switch (duration.unit) {
    case 'minutes': return duration.value / 60;
    case 'hours':   return duration.value;
    case 'days':    return duration.value * hpd;
    case 'weeks':   return duration.value * hpd * (timeTracking?.daysPerWeek || 5);
    default:        return duration.value;
  }
};

/**
 * Auto-schedule tasks from a given start date.
 *
 * Two modes (controlled by options.roleId):
 *
 *  1. Per-role mode (roleId provided)
 *     For each task in `order`, the matching role-assignment is scheduled
 *     starting at max(currentCursor, end-of-earlier-role-assignments-in-the-same-task).
 *     This guarantees a later role never starts before an earlier role ends.
 *
 *  2. Workflow mode (no roleId)
 *     For each task in `order`, every role-assignment is scheduled
 *     sequentially within the task (role N+1 starts at role N's end), and
 *     the task-level start/due is set to the union of role-assignment dates.
 *
 * Both modes honour working days, holidays, employee leaves and the daily
 * working window (workingHoursStart/workingHoursEnd) from settings.timeTracking.
 *
 * Returns a flat array suitable for the bulk-schedule endpoint:
 *   [{ taskId, roleId?, startDate, dueDate }, ...]
 */
export const autoScheduleAllTasks = (tasks, projectStartDate, settings, allLeaves = [], options = {}) => {
  const { roleId, durationOverrides = {} } = options;
  const { workingDays = [1, 2, 3, 4, 5], holidays = [], timeTracking = {} } = settings;
  const schedules = [];

  const yearMs = 365 * 24 * 3600 * 1000;
  let cursor = snapToWorkingTime(new Date(projectStartDate), workingDays, holidays, [], timeTracking);

  const ordered = [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));

  ordered.forEach(task => {
    if (roleId) {
      const ra = task.roleAssignments?.find(r => (r.role?._id || r.role) === roleId);
      if (!ra) return;
      const overrideMin = durationOverrides[task._id] || durationOverrides[String(task._id)];
      const hours = overrideMin > 0 ? overrideMin / 60 : durationToHours(ra.duration, timeTracking);
      if (!hours) return;

      let earlierEnd = null;
      (task.roleAssignments || []).forEach(r => {
        if ((r.order ?? 0) < (ra.order ?? 0) && r.dueDate) {
          const e = new Date(r.dueDate);
          if (!earlierEnd || e > earlierEnd) earlierEnd = e;
        }
      });
      const minStart = earlierEnd && earlierEnd > cursor ? earlierEnd : cursor;
      const leaves = filterEmployeeLeaves(allLeaves, ra.assignees, minStart, new Date(minStart.getTime() + yearMs));
      const start = snapToWorkingTime(minStart, workingDays, holidays, leaves, timeTracking);
      const end = addWorkingHours(start, hours, workingDays, holidays, leaves, timeTracking);

      schedules.push({ taskId: task._id, roleId, startDate: start, dueDate: end });
      cursor = end;
    } else {
      const ras = (task.roleAssignments || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      let taskStart = null;
      let taskCursor = cursor;

      ras.forEach(ra => {
        const hours = durationToHours(ra.duration, timeTracking);
        if (!hours) return;
        const leaves = filterEmployeeLeaves(allLeaves, ra.assignees, taskCursor, new Date(taskCursor.getTime() + yearMs));
        const raStart = snapToWorkingTime(taskCursor, workingDays, holidays, leaves, timeTracking);
        const raEnd = addWorkingHours(raStart, hours, workingDays, holidays, leaves, timeTracking);
        if (!taskStart) taskStart = raStart;
        schedules.push({ taskId: task._id, roleId: (ra.role?._id || ra.role), startDate: raStart, dueDate: raEnd });
        taskCursor = raEnd;
      });

      if (!taskStart) {
        const hours = durationToHours(task.duration, timeTracking);
        if (!hours) return;
        const leaves = filterEmployeeLeaves(allLeaves, task.assignees, cursor, new Date(cursor.getTime() + yearMs));
        taskStart = snapToWorkingTime(cursor, workingDays, holidays, leaves, timeTracking);
        taskCursor = addWorkingHours(taskStart, hours, workingDays, holidays, leaves, timeTracking);
      }

      schedules.push({ taskId: task._id, startDate: taskStart, dueDate: taskCursor });
      cursor = taskCursor;
    }
  });

  return schedules;
};

