import axios from 'axios';
import { getCookie } from '../utils/cookies';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests from cookies
api.interceptors.request.use((config) => {
  const token = getCookie('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      import('../utils/cookies').then(({ clearAuthCookies }) => {
        clearAuthCookies();
        window.location.href = '/signin';
      });
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (userData) => api.post('/auth/signup', userData),
  signin: (credentials) => api.post('/auth/signin', credentials),
};

export const userAPI = {
  getAll: (companyId = null) => {
    const config = {};
    if (companyId && companyId !== 'personal') {
      config.headers = { 'X-Company-Id': companyId };
      config.params = { companyId };
    }
    return api.get('/users', config);
  },
  getCompanyEmployees: (companyId) => api.get(`/users/company/${companyId}`),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
};

export const projectAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (projectData) => api.post('/projects', projectData),
  update: (id, projectData) => api.put(`/projects/${id}`, projectData),
  delete: (id) => api.delete(`/projects/${id}`),
  addTeamMember: (id, userId, role) => api.post(`/projects/${id}/members`, { userId, role }),
  removeTeamMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
};

export const taskAPI = {
  getAll: (projectId) => api.get(`/projects/${projectId}/tasks`),
  create: (projectId, taskData) => api.post(`/projects/${projectId}/tasks`, taskData),
  update: (projectId, taskId, taskData) => api.put(`/projects/${projectId}/tasks/${taskId}`, taskData),
  delete: (projectId, taskId) => api.delete(`/projects/${projectId}/tasks/${taskId}`),
};

export const taskStatusAPI = {
  getAll: (projectId) => api.get(`/projects/${projectId}/task-statuses`),
  create: (projectId, statusData) => api.post(`/projects/${projectId}/task-statuses`, statusData),
  update: (projectId, statusId, statusData) => api.put(`/projects/${projectId}/task-statuses/${statusId}`, statusData),
  delete: (projectId, statusId) => api.delete(`/projects/${projectId}/task-statuses/${statusId}`),
  checkStatusChange: (projectId, taskId, statusId) => api.get(`/projects/${projectId}/tasks/${taskId}/status-check/${statusId}`),
};

export const requirementAPI = {
  getAll: (projectId) => api.get(`/projects/${projectId}/requirements`),
  create: (projectId, requirementData) => api.post(`/projects/${projectId}/requirements`, requirementData),
  update: (projectId, requirementId, requirementData) => api.put(`/projects/${projectId}/requirements/${requirementId}`, requirementData),
  delete: (projectId, requirementId) => api.delete(`/projects/${projectId}/requirements/${requirementId}`),
  addComment: (projectId, requirementId, comment) => api.post(`/projects/${projectId}/requirements/${requirementId}/comments`, comment),
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

export default api;