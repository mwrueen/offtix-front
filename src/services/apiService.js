/**
 * Enhanced API service with company filtering support
 */

class ApiService {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
  }

  // Helper method to build headers with company context
  buildHeaders(token, companyId = null) {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    if (companyId && companyId !== 'personal') {
      headers['X-Company-Id'] = companyId;
    }
    
    return headers;
  }

  // Helper method to build URL with company filter
  buildURL(endpoint, params = {}, companyId = null) {
    const url = new URL(`${this.baseURL}${endpoint}`, window.location.origin);
    
    // Add company filter to params if not personal mode
    if (companyId && companyId !== 'personal') {
      params.companyId = companyId;
    }
    
    // Add all params to URL
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    return url.toString();
  }

  // Generic API call method with company filtering
  async apiCall(method, endpoint, data = null, token, companyId = null, params = {}) {
    const url = this.buildURL(endpoint, params, companyId);
    const headers = this.buildHeaders(token, companyId);
    
    const config = {
      method,
      headers
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    
    return response.json();
  }

  // Projects API with company filtering
  async getProjects(token, companyId = null, params = {}) {
    return this.apiCall('GET', '/projects', null, token, companyId, params);
  }

  async createProject(projectData, token, companyId = null) {
    return this.apiCall('POST', '/projects', projectData, token, companyId);
  }

  async updateProject(projectId, projectData, token, companyId = null) {
    return this.apiCall('PUT', `/projects/${projectId}`, projectData, token, companyId);
  }

  async deleteProject(projectId, token, companyId = null) {
    return this.apiCall('DELETE', `/projects/${projectId}`, null, token, companyId);
  }

  // Tasks API with company filtering
  async getTasks(token, companyId = null, params = {}) {
    return this.apiCall('GET', '/tasks', null, token, companyId, params);
  }

  async createTask(taskData, token, companyId = null) {
    return this.apiCall('POST', '/tasks', taskData, token, companyId);
  }

  async updateTask(taskId, taskData, token, companyId = null) {
    return this.apiCall('PUT', `/tasks/${taskId}`, taskData, token, companyId);
  }

  // Users API with company filtering
  async getUsers(token, companyId = null, params = {}) {
    return this.apiCall('GET', '/users', null, token, companyId, params);
  }

  // Companies API
  async getUserCompanies(token) {
    return this.apiCall('GET', '/companies/user-companies', null, token);
  }

  async createCompany(companyData, token) {
    return this.apiCall('POST', '/companies', companyData, token);
  }

  async getCompany(companyId, token) {
    return this.apiCall('GET', `/companies/${companyId}`, null, token);
  }
}

export default new ApiService();