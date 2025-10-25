import api from './api';

export const companyApi = {
  createCompany: (data) => api.post('/companies', data),
  getMyCompany: () => api.get('/companies/my-company'),
  getCompany: (id) => api.get(`/companies/${id}`),
  addMember: (companyId, data) => api.post(`/companies/${companyId}/members`, data),
  updateMemberSalary: (companyId, data) => api.put(`/companies/${companyId}/members/salary`, data),
  updateMemberDesignation: (companyId, data) => api.put(`/companies/${companyId}/members/designation`, data),
  addDesignation: (companyId, data) => api.post(`/companies/${companyId}/designations`, data),
  updatePermissions: (companyId, data) => api.put(`/companies/${companyId}/permissions`, data)
};