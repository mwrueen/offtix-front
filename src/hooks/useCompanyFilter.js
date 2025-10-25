import { useCompany } from '../context/CompanyContext';

/**
 * Custom hook to get company filtering parameters for API calls
 * @returns {Object} Company filter object with companyId and helper functions
 */
export const useCompanyFilter = () => {
  const { state } = useCompany();
  
  const getCompanyFilter = () => {
    const selectedCompany = state.selectedCompany;
    
    if (!selectedCompany || selectedCompany.id === 'personal') {
      return { companyId: null, isPersonal: true };
    }
    
    return { companyId: selectedCompany.id, isPersonal: false };
  };

  const getApiHeaders = (token) => {
    const filter = getCompanyFilter();
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    if (filter.companyId) {
      headers['X-Company-Id'] = filter.companyId;
    }
    
    return headers;
  };

  const buildApiUrl = (baseUrl, params = {}) => {
    const filter = getCompanyFilter();
    const urlParams = new URLSearchParams(params);
    
    if (filter.companyId) {
      urlParams.set('companyId', filter.companyId);
    }
    
    const queryString = urlParams.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  return {
    selectedCompany: state.selectedCompany,
    companyFilter: getCompanyFilter(),
    getApiHeaders,
    buildApiUrl,
    isPersonalMode: getCompanyFilter().isPersonal
  };
};