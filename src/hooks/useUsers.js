import { useCallback } from 'react';
import { useUserContext } from '../context/UserContext';
import { userAPI } from '../services/api';

export const useUsers = () => {
  const { state, dispatch } = useUserContext();

  const fetchUsers = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await userAPI.getAll();
      dispatch({ type: 'SET_USERS', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [dispatch]);

  const createUser = useCallback(async (userData) => {
    try {
      const response = await userAPI.create(userData);
      dispatch({ type: 'ADD_USER', payload: response.data });
      return response.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || error.message });
      throw error;
    }
  }, [dispatch]);

  const updateUser = useCallback(async (id, userData) => {
    try {
      const response = await userAPI.update(id, userData);
      dispatch({ type: 'UPDATE_USER', payload: response.data });
      return response.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || error.message });
      throw error;
    }
  }, [dispatch]);

  const deleteUser = useCallback(async (id) => {
    try {
      await userAPI.delete(id);
      dispatch({ type: 'DELETE_USER', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || error.message });
      throw error;
    }
  }, [dispatch]);

  return {
    users: state.users,
    loading: state.loading,
    error: state.error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
};