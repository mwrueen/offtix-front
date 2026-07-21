import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

const CompanyContext = createContext();

const initialState = {
  companies: [],
  selectedCompany: null,
  loading: true, // Start with loading true to prevent premature redirects
  error: null
};

const companyReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_COMPANIES':
      return { ...state, companies: action.payload, loading: false };
    case 'SET_SELECTED_COMPANY':
      return { ...state, selectedCompany: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

export const CompanyProvider = ({ children }) => {
  const [state, dispatch] = useReducer(companyReducer, initialState);
  const { state: authState } = useAuth();

  // Fetch user's companies
  const fetchUserCompanies = useCallback(async () => {
    if (!authState.token) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch('/api/companies/user-companies', {
        headers: {
          'Authorization': `Bearer ${authState.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const companies = await response.json();
        dispatch({ type: 'SET_COMPANIES', payload: companies });

        // Set default company (first one or Personal)
        if (companies.length > 0) {
          // Check if there's a saved company in localStorage that matches
          const savedCompany = localStorage.getItem('selectedCompany');
          if (savedCompany) {
            try {
              const parsedCompany = JSON.parse(savedCompany);
              const matchingCompany = companies.find(c => (c.id || c._id) === (parsedCompany.id || parsedCompany._id));
              if (matchingCompany) {
                dispatch({ type: 'SET_SELECTED_COMPANY', payload: matchingCompany });
                dispatch({ type: 'SET_LOADING', payload: false });
                return;
              }
            } catch (error) {
              console.error('Error parsing saved company:', error);
            }
          }
          // Default to first company
          dispatch({ type: 'SET_SELECTED_COMPANY', payload: companies[0] });
        } else {
          dispatch({ type: 'SET_SELECTED_COMPANY', payload: { id: 'personal', name: 'Personal' } });
        }
        dispatch({ type: 'SET_LOADING', payload: false });
      } else {
        throw new Error('Failed to fetch companies');
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      // Default to Personal if error
      dispatch({ type: 'SET_SELECTED_COMPANY', payload: { id: 'personal', name: 'Personal' } });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [authState.token]);

  // Create new company
  const createCompany = useCallback(async (companyData) => {
    if (!authState.token) return;

    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authState.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(companyData)
      });

      if (response.ok) {
        const data = await response.json();
        const newCompany = { ...data, id: data.id || data._id };
        dispatch({ type: 'SET_COMPANIES', payload: [...state.companies, newCompany] });
        dispatch({ type: 'SET_SELECTED_COMPANY', payload: newCompany });
        localStorage.setItem('selectedCompany', JSON.stringify(newCompany));
        return newCompany;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create company');
      }
    } catch (error) {
      console.error('Error creating company:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [authState.token, state.companies]);

  // Select company
  const selectCompany = useCallback((company) => {
    dispatch({ type: 'SET_SELECTED_COMPANY', payload: company });
    // Store in localStorage for persistence
    localStorage.setItem('selectedCompany', JSON.stringify(company));
  }, []);

  // Load selected company from localStorage on mount
  useEffect(() => {
    const savedCompany = localStorage.getItem('selectedCompany');
    if (savedCompany) {
      try {
        const company = JSON.parse(savedCompany);
        dispatch({ type: 'SET_SELECTED_COMPANY', payload: company });
      } catch (error) {
        console.error('Error parsing saved company:', error);
      }
    }
    // If no auth token yet, set loading to false
    if (!authState.token) {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [authState.token]);

  // Fetch companies when user logs in
  useEffect(() => {
    if (authState.token && authState.user) {
      fetchUserCompanies();
    } else {
      dispatch({ type: 'RESET' });
    }
  }, [authState.token, authState.user, fetchUserCompanies]);

  const value = useMemo(() => ({
    state,
    dispatch,
    fetchUserCompanies,
    createCompany,
    selectCompany
  }), [state, fetchUserCompanies, createCompany, selectCompany]);

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};