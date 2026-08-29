import axios from 'axios';
import { getCookie } from '../utils/cookies';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BASE_SERVER_URL = API_BASE_URL.replace('/api', '');

/**
 * Helper to construct the full URL for static assets (images, files, documents).
 * Resolves against REACT_APP_ASSET_URL if defined, falling back to the base server URL.
 *
 * @param {string} path File path (e.g. '/uploads/requirement-files/req-123.txt')
 * @returns {string} Fully qualified URL
 */
const getAssetUrl = (filePath) => {
  if (!filePath) return '';
  if (filePath.startsWith('http') || filePath.startsWith('data:')) return filePath;
  // Sanitize: if path is an absolute filesystem path, extract the /uploads/... part
  const uploadsIdx = filePath.replace(/\\/g, '/').indexOf('uploads/');
  if (uploadsIdx > 0) {
    filePath = '/' + filePath.replace(/\\/g, '/').substring(uploadsIdx);
  }
  const assetBase = process.env.REACT_APP_ASSET_URL || BASE_SERVER_URL;
  return `${assetBase}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
};

/**
 * Helper to get the correct Socket.IO connection URL.
 * Automatically uses window.location.origin in production if REACT_APP_SOCKET_URL points to localhost or is missing.
 */
const getSocketUrl = () => {
  if (process.env.REACT_APP_SOCKET_URL && !process.env.REACT_APP_SOCKET_URL.includes('localhost')) {
    return process.env.REACT_APP_SOCKET_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return window.location.origin;
  }
  return process.env.REACT_APP_SOCKET_URL || BASE_SERVER_URL || 'http://localhost:5000';
};

export { API_BASE_URL, BASE_SERVER_URL, getAssetUrl, getSocketUrl };

export const generateProjectDescription = (title) => api.post('/ai/generate-project-description', { title });
export const generateProjectTasks = (title, description, existingTasks = []) => api.post('/ai/generate-tasks', { title, description, existingTasks });
export const generateJobDescription = (data) => api.post('/ai/generate-job-description', data);
export const generateJobBenefits = (data) => api.post('/ai/generate-job-benefits', data);
export const transcribeMeetingAudio = (data) => api.post('/ai/transcribe-meeting-audio', data);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests from cookies
api.interceptors.request.use((config) => {
  const token = getCookie('authToken') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // When sending FormData, let the browser/Axios set Content-Type automatically
  // (with correct multipart boundary). The default 'application/json' header
  // would otherwise override it and break file uploads.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});


// Handle token expiration & premium feature restrictions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.error === 'PREMIUM_FEATURE_RESTRICTED') {
      const featureKey = error.response.data.feature || 'ai';
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-upgrade-modal', { detail: { featureKey } }));
      }
    } else if (error.response?.status === 401) {
      // Only redirect if it's not a signin/signup request (those should show errors)
      const isAuthRequest = error.config?.url?.includes('/auth/signin') ||
        error.config?.url?.includes('/auth/signup');

      if (!isAuthRequest) {
        // Token expired or invalid for authenticated requests
        import('../utils/cookies').then(({ clearAuthCookies }) => {
          clearAuthCookies();
          window.location.href = '/signin';
        });
      }
    }
    return Promise.reject(error);
  }
);


export const authAPI = {
  signup: (userData) => api.post('/auth/signup', userData),
  signin: (credentials) => api.post('/auth/signin', credentials),
};

export const userAPI = {
  getAll: (companyId = null, page, limit, search) => {
    const config = { params: {} };
    if (companyId && companyId !== 'personal') {
      config.headers = { 'X-Company-Id': companyId };
      config.params.companyId = companyId;
    }
    if (page) {
      config.params.paginated = 'true';
      config.params.page = page;
      if (limit) config.params.limit = limit;
    }
    if (search) {
      config.params.search = search;
    }
    return api.get('/users', config);
  },
  getCompanyEmployees: (companyId) => api.get(`/users/company/${companyId}`),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  updatePassword: (id, password) => api.put(`/users/${id}/password`, { password }),
  delete: (id) => api.delete(`/users/${id}`),
};

export const projectAPI = {
  getAll: (companyId = null) => {
    const config = {};
    if (companyId && companyId !== 'personal') {
      config.headers = { 'X-Company-Id': companyId };
      config.params = { companyId };
    }
    return api.get('/projects', config);
  },
  getById: (id) => api.get(`/projects/${id}`),
  create: (projectData) => api.post('/projects', projectData),
  update: (id, projectData) => api.put(`/projects/${id}`, projectData),
  delete: (id) => api.delete(`/projects/${id}`),
  addTeamMember: (id, userId, role) => api.post(`/projects/${id}/members`, { userId, role }),
  removeTeamMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
  getAnalytics: (id) => api.get(`/projects/${id}/analytics`),
  uploadAttachment: (id, formData) => api.post(`/projects/${id}/attachments`, formData),
  deleteAttachment: (id, attachmentId) => api.delete(`/projects/${id}/attachments/${attachmentId}`),

  // Milestone management
  addMilestone: (id, milestoneData) => api.post(`/projects/${id}/milestones`, milestoneData),
  updateMilestone: (id, milestoneId, milestoneData) => api.put(`/projects/${id}/milestones/${milestoneId}`, milestoneData),
  deleteMilestone: (id, milestoneId) => api.delete(`/projects/${id}/milestones/${milestoneId}`),

  // Risk management
  addRisk: (id, riskData) => api.post(`/projects/${id}/risks`, riskData),
  updateRisk: (id, riskId, riskData) => api.put(`/projects/${id}/risks/${riskId}`, riskData),
  deleteRisk: (id, riskId) => api.delete(`/projects/${id}/risks/${riskId}`),

  // Dependency management
  addDependency: (id, dependencyData) => api.post(`/projects/${id}/dependencies`, dependencyData),
  updateDependency: (id, dependencyId, dependencyData) => api.put(`/projects/${id}/dependencies/${dependencyId}`, dependencyData),
  deleteDependency: (id, dependencyId) => api.delete(`/projects/${id}/dependencies/${dependencyId}`),

  // Tag management
  addTags: (id, tags) => api.post(`/projects/${id}/tags`, { tags }),
  removeTag: (id, tag) => api.delete(`/projects/${id}/tags/${encodeURIComponent(tag)}`),

  // Settings management
  updateSettings: (id, settings) => api.put(`/projects/${id}/settings`, { settings }),
  addHoliday: (id, holidayData) => api.post(`/projects/${id}/holidays`, holidayData),
  removeHoliday: (id, holidayId) => api.delete(`/projects/${id}/holidays/${holidayId}`),

  // Status management
  updateStatus: (id, status, scheduledStartDate) => api.put(`/projects/${id}/status`, { status, scheduledStartDate }),

  // Cost breakdown
  getCosts: (id) => api.get(`/projects/${id}/costs`),
};

export const taskAPI = {
  getAll: (projectId) => api.get(`/projects/${projectId}/tasks`),
  getById: (projectId, taskId) => api.get(`/projects/${projectId}/tasks/${taskId}`),
  create: (projectId, taskData) => api.post(`/projects/${projectId}/tasks`, taskData),
  update: (projectId, taskId, taskData) => api.put(`/projects/${projectId}/tasks/${taskId}`, taskData),
  delete: (projectId, taskId) => api.delete(`/projects/${projectId}/tasks/${taskId}`),
  reorder: (projectId, taskOrders) => api.post(`/projects/${projectId}/tasks/reorder`, { taskOrders }),
  // Workflow role operations
  getTaskWithWorkflow: (projectId, taskId) => api.get(`/projects/${projectId}/tasks/${taskId}/workflow`),
  startWorkflow: (projectId, taskId) => api.post(`/projects/${projectId}/tasks/${taskId}/workflow/start`),
  completeRoleAndHandoff: (projectId, taskId, handoffData) =>
    api.post(`/projects/${projectId}/tasks/${taskId}/workflow/complete-role`, handoffData),
  skipRole: (projectId, taskId, reason) =>
    api.post(`/projects/${projectId}/tasks/${taskId}/workflow/skip-role`, { reason }),
  updateRoleAssignments: (projectId, taskId, roleAssignments, useRoleWorkflow) =>
    api.put(`/projects/${projectId}/tasks/${taskId}/role-assignments`, { roleAssignments, useRoleWorkflow }),
  bulkUpdateRoleDurations: (projectId, roleId, updates, userId) =>
    api.post(`/projects/${projectId}/tasks/bulk-update-role-durations`, { roleId, updates, userId }),
  getBulkUserDurations: (projectId, userId, roleId) =>
    api.get(`/projects/${projectId}/tasks/bulk-durations`, { params: { userId, roleId } }),
  getRoleTaskDurations: (projectId, roleId) =>
    api.get(`/projects/${projectId}/tasks/role-task-durations`, { params: { roleId } }),
  bulkAssignMember: (projectId, userId, roleIds) =>
    api.post(`/projects/${projectId}/tasks/bulk-assign-member`, { userId, roleIds }),
  bulkSchedule: (projectId, schedules) => api.post(`/projects/${projectId}/tasks/bulk-schedule`, { schedules }),
  // Per-member duration endpoints
  setRoleDuration: (projectId, taskId, data) =>
    api.put(`/projects/${projectId}/tasks/${taskId}/role-duration`, data),
  getTaskDurations: (projectId, taskId) =>
    api.get(`/projects/${projectId}/tasks/${taskId}/durations`),
};

export const taskRoleAPI = {
  getAll: (projectId) => api.get(`/task-roles/project/${projectId}`),
  create: (projectId, roleData) => api.post(`/task-roles/project/${projectId}`, roleData),
  update: (projectId, roleId, roleData) => api.put(`/task-roles/project/${projectId}/${roleId}`, roleData),
  delete: (projectId, roleId) => api.delete(`/task-roles/project/${projectId}/${roleId}`),
  reorder: (projectId, roleOrders) => api.put(`/task-roles/project/${projectId}/reorder`, { roleOrders }),
  initializeDefaults: (projectId) => api.post(`/task-roles/project/${projectId}/initialize`),
};

export const taskStatusAPI = {
  getAll: (projectId) => api.get(`/projects/${projectId}/task-statuses`),
  create: (projectId, statusData) => api.post(`/projects/${projectId}/task-statuses`, statusData),
  update: (projectId, statusId, statusData) => api.put(`/projects/${projectId}/task-statuses/${statusId}`, statusData),
  delete: (projectId, statusId) => api.delete(`/projects/${projectId}/task-statuses/${statusId}`),
};

export const requirementAPI = {
  getAll: (projectId) => api.get(`/projects/${projectId}/requirements`),
  create: (projectId, requirementData) => api.post(`/projects/${projectId}/requirements`, requirementData),
  update: (projectId, requirementId, requirementData) => api.put(`/projects/${projectId}/requirements/${requirementId}`, requirementData),
  delete: (projectId, requirementId) => api.delete(`/projects/${projectId}/requirements/${requirementId}`),
  addComment: (projectId, requirementId, comment) => api.post(`/projects/${projectId}/requirements/${requirementId}/comments`, comment),
  uploadAttachment: (projectId, requirementId, formData) => api.post(
    `/projects/${projectId}/requirements/${requirementId}/attachments`,
    formData
  ),
  deleteAttachment: (projectId, requirementId, attachmentId) =>
    api.delete(`/projects/${projectId}/requirements/${requirementId}/attachments/${attachmentId}`),
  convertToTask: (projectId, requirementId) =>
    api.post(`/projects/${projectId}/requirements/${requirementId}/convert-to-task`),
};

export const meetingNoteAPI = {
  getAll: (projectId) => api.get(`/projects/${projectId}/meeting-notes`),
  create: (projectId, meetingData) => api.post(`/projects/${projectId}/meeting-notes`, meetingData),
  update: (projectId, meetingId, meetingData) => api.put(`/projects/${projectId}/meeting-notes/${meetingId}`, meetingData),
  delete: (projectId, meetingId) => api.delete(`/projects/${projectId}/meeting-notes/${meetingId}`),
};

export const sprintAPI = {
  getAll: (projectId) => api.get(`/projects/${projectId}/sprints`),
  create: (projectId, sprintData) => api.post(`/projects/${projectId}/sprints`, sprintData),
  update: (projectId, sprintId, sprintData) => api.put(`/projects/${projectId}/sprints/${sprintId}`, sprintData),
  delete: (projectId, sprintId) => api.delete(`/projects/${projectId}/sprints/${sprintId}`),
};

export const phaseAPI = {
  getAll: (projectId) => api.get(`/projects/${projectId}/phases`),
  create: (projectId, phaseData) => api.post(`/projects/${projectId}/phases`, phaseData),
  update: (projectId, phaseId, phaseData) => api.put(`/projects/${projectId}/phases/${phaseId}`, phaseData),
  delete: (projectId, phaseId) => api.delete(`/projects/${projectId}/phases/${phaseId}`),
};

export const companyAPI = {
  // Company management
  getById: (id) => api.get(`/companies/${id}`),
  getPublic: (id) => api.get(`/companies/public/${id}`),
  updateProfile: (id, profileData) => api.put(`/companies/${id}/profile`, profileData),
  // Settings management
  updateSettings: (id, settings) => api.put(`/companies/${id}/settings`, { settings }),
  addHoliday: (id, holidayData) => api.post(`/companies/${id}/holidays`, holidayData),
  removeHoliday: (id, holidayId) => api.delete(`/companies/${id}/holidays/${holidayId}`),
  // Workforce - employees with their tasks
  getWorkforce: (id) => api.get(`/companies/${id}/workforce`),
};

export const invitationAPI = {
  send: (companyId, invitationData) => api.post(`/invitations/company/${companyId}/invite`, invitationData),
  getCompanyInvitations: (companyId) => api.get(`/invitations/company/${companyId}`),
};

export const employeeAPI = {
  // Get all employees for a company
  getAll: (companyId) => api.get(`/companies/${companyId}/employees`),
  // Get single employee details
  getById: (companyId, employeeId) => api.get(`/companies/${companyId}/employees/${employeeId}`),
  // Update employee designation
  updateDesignation: (companyId, employeeId, designation) =>
    api.put(`/companies/${companyId}/employees/${employeeId}/designation`, { designation }),
  // Update employee salary
  updateSalary: (companyId, employeeId, newSalary, reason) =>
    api.put(`/companies/${companyId}/employees/${employeeId}/salary`, { newSalary, reason }),
  // Remove employee
  remove: (companyId, employeeId) => api.delete(`/companies/${companyId}/employees/${employeeId}`),
};

export const holidayAPI = {
  // Get all holidays for a company
  getAll: (companyId) => api.get(`/companies/${companyId}/holidays`),
  // Get upcoming holidays
  getUpcoming: (companyId, limit = 5) => api.get(`/companies/${companyId}/holidays/upcoming`, { params: { limit } }),
  // Add a holiday
  create: (companyId, holidayData) => api.post(`/companies/${companyId}/holidays`, holidayData),
  // Update a holiday
  update: (companyId, holidayId, holidayData) =>
    api.put(`/companies/${companyId}/holidays/${holidayId}`, holidayData),
  // Delete a holiday
  delete: (companyId, holidayId) => api.delete(`/companies/${companyId}/holidays/${holidayId}`),
};

export const leaveAPI = {
  // Get all leaves for a company
  getAll: (companyId, params = {}) => api.get(`/companies/${companyId}/leaves`, { params }),
  // Get leave details
  getById: (companyId, leaveId) => api.get(`/companies/${companyId}/leaves/${leaveId}`),
  // Request new leave
  request: (companyId, leaveData) => api.post(`/companies/${companyId}/leaves`, leaveData),
  // Update leave request
  update: (companyId, leaveId, leaveData) =>
    api.put(`/companies/${companyId}/leaves/${leaveId}`, leaveData),
  // Approve/Reject leave
  updateStatus: (companyId, leaveId, status, rejectionReason = null) =>
    api.patch(`/companies/${companyId}/leaves/${leaveId}/status`, { status, rejectionReason }),
  // Cancel leave
  cancel: (companyId, leaveId) =>
    api.patch(`/companies/${companyId}/leaves/${leaveId}/cancel`),
  // Get leave balance
  getBalance: (companyId, employeeId, year) =>
    api.get(`/companies/${companyId}/leaves/balance/${employeeId}`, { params: { year } }),
  // Get leave statistics
  getStatistics: (companyId, params = {}) =>
    api.get(`/companies/${companyId}/leaves/statistics`, { params }),
};

export const chatAPI = {
  // Generic fetch for any context (project, company, or DM)
  getMessages: (params) => api.get('/chat/messages', { params }),
  // Get members for mentions (project or company)
  getMembers: (params) => api.get('/chat/members', { params }),
  // Delete message
  deleteMessage: (messageId) => api.delete(`/chat/messages/${messageId}`),
  // Edit message
  editMessage: (messageId, content) => api.put(`/chat/messages/${messageId}`, { content }),

  // Unread counts
  getUnreadCounts: (companyId = null) => {
    const config = {};
    if (companyId && companyId !== 'personal') {
      config.headers = { 'X-Company-Id': companyId };
      config.params = { companyId };
    }
    return api.get('/chat/unread-counts', config);
  },
  // Mark as read
  markRead: (data) => api.post('/chat/mark-read', data),

  // Legacy project-specific methods (kept for compatibility)
  getProjectMessages: (projectId, params = {}) =>
    api.get(`/projects/${projectId}/chat/messages`, { params }),
  getProjectMembers: (projectId) =>
    api.get(`/projects/${projectId}/chat/members`),
};

export const myTasksAPI = {
  // Get all tasks assigned to logged-in user
  getAll: (companyId = null) => {
    const config = {};
    if (companyId && companyId !== 'personal') {
      config.headers = { 'X-Company-Id': companyId };
      config.params = { companyId };
    }
    return api.get('/my-tasks', config);
  },
  // Get single task details
  getById: (taskId, companyId = null) => {
    const config = {};
    if (companyId && companyId !== 'personal') {
      config.headers = { 'X-Company-Id': companyId };
      config.params = { companyId };
    }
    return api.get(`/my-tasks/${taskId}`, config);
  },
  // Set/update user's duration
  setDuration: (taskId, durationMinutes) =>
    api.post(`/my-tasks/${taskId}/duration`, { duration_minutes: durationMinutes }),
  // Start task step
  start: (taskId) => api.post(`/my-tasks/${taskId}/start`),
  // Pause task step
  pause: (taskId) => api.post(`/my-tasks/${taskId}/pause`),
  // Helper to safely construct FormData for task completions/returns
  buildFormData: (note, message, link, files) => {
    const formData = new FormData();
    if (note !== undefined && note !== null) formData.append('note', note);
    
    // Safely append text message
    if (typeof message === 'string' && message !== '[object File]') {
      formData.append('message', message);
    } else if (message instanceof File || message instanceof Blob) {
      formData.append('files', message);
    } else if (Array.isArray(message)) {
      message.forEach(f => { if (f instanceof File || f instanceof Blob) formData.append('files', f); });
    }

    // Safely append link
    if (typeof link === 'string' && link !== '[object File]') {
      formData.append('link', link);
    } else if (link instanceof File || link instanceof Blob) {
      formData.append('files', link);
    } else if (Array.isArray(link)) {
      link.forEach(f => { if (f instanceof File || f instanceof Blob) formData.append('files', f); });
    }

    // Safely append files array or single file
    if (files) {
      if (Array.isArray(files)) {
        files.forEach(file => { if (file instanceof File || file instanceof Blob) formData.append('files', file); });
      } else if (files instanceof File || files instanceof Blob) {
        formData.append('files', files);
      }
    }
    return formData;
  },

  // Complete task step
  complete: function(taskId, note, message, link, files) {
    const formData = this.buildFormData(note, message, link, files);
    return api.post(`/my-tasks/${taskId}/complete`, formData);
  },
  // Send back for fix
  sendBack: function(taskId, note, message, link, files) {
    const formData = this.buildFormData(note, message, link, files);
    return api.post(`/my-tasks/${taskId}/send-back`, formData);
  },

  // Sequential workflow operations
  startSequential: (taskId) => api.post(`/my-tasks/${taskId}/sequential/start`),
  pauseSequential: (taskId) => api.post(`/my-tasks/${taskId}/sequential/pause`),
  completeSequential: function(taskId, note, message, link, files) {
    const formData = this.buildFormData(note, message, link, files);
    return api.post(`/my-tasks/${taskId}/sequential/complete`, formData);
  },
  sendBackSequential: function(taskId, note, message, link, files) {
    const formData = this.buildFormData(note, message, link, files);
    return api.post(`/my-tasks/${taskId}/sequential/send-back`, formData);
  },
  // Edit Activity
  editActivity: function(activityId, note, message, link, files, keepDocIds) {
    const formData = this.buildFormData(note, message, link, files);
    if (keepDocIds && keepDocIds.length > 0) {
      formData.append('keepDocIds', JSON.stringify(keepDocIds));
    }
    return api.put(`/my-tasks/activity/${activityId}`, formData);
  }

};

export const currencyAPI = {
  getAll: () => api.get('/currencies'),
  create: (data) => api.post('/currencies', data),
  update: (id, data) => api.put(`/currencies/${id}`, data),
  delete: (id) => api.delete(`/currencies/${id}`),
  uploadIcon: (id, formData) => api.post(`/currencies/${id}/icon`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const subscriptionAPI = {
  getPlanConfig: () => api.get('/subscription/plan-config'),
  getStatus: () => api.get('/subscription/status'),
  createCheckoutSession: () => api.post('/subscription/create-checkout-session'),
  verifySession: (sessionId) => api.post('/subscription/verify-session', { sessionId }),
  updatePlanConfig: (data) => api.put('/subscription/plan-config', data),
  manualSetUserPlan: (data) => api.post('/subscription/manual-set-user-plan', data),
  getSubscribers: () => api.get('/subscription/subscribers')
};


export default api;