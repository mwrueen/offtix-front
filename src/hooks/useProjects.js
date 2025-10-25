import { useCallback } from 'react';
import { useProjectContext } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { useCompanyFilter } from './useCompanyFilter';
import apiService from '../services/apiService';
import { projectAPI } from '../services/api';

export const useProjects = () => {
  const { state, dispatch } = useProjectContext();
  const { state: authState } = useAuth();
  const { companyFilter } = useCompanyFilter();

  const fetchProjects = useCallback(async () => {
    if (!authState.token) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Use the new API service with company filtering
      const projects = await apiService.getProjects(authState.token, companyFilter.companyId);
      dispatch({ type: 'SET_PROJECTS', payload: projects });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [dispatch, authState.token, companyFilter.companyId]);

  const createProject = useCallback(async (projectData) => {
    if (!authState.token) throw new Error('Not authenticated');
    
    try {
      // Use the new API service with company filtering
      const project = await apiService.createProject(projectData, authState.token, companyFilter.companyId);
      dispatch({ type: 'ADD_PROJECT', payload: project });
      return project;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [dispatch, authState.token, companyFilter.companyId]);

  const updateProject = useCallback(async (id, projectData) => {
    if (!authState.token) throw new Error('Not authenticated');
    
    try {
      // Use the new API service with company filtering
      const project = await apiService.updateProject(id, projectData, authState.token, companyFilter.companyId);
      dispatch({ type: 'UPDATE_PROJECT', payload: project });
      return project;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [dispatch, authState.token, companyFilter.companyId]);

  const deleteProject = useCallback(async (id) => {
    if (!authState.token) throw new Error('Not authenticated');
    
    try {
      // Use the new API service with company filtering
      await apiService.deleteProject(id, authState.token, companyFilter.companyId);
      dispatch({ type: 'DELETE_PROJECT', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [dispatch, authState.token, companyFilter.companyId]);

  return {
    projects: state.projects,
    loading: state.loading,
    error: state.error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
};