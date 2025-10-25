import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { setAuthCookies, getAuthCookies, clearAuthCookies } from '../utils/cookies';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      setAuthCookies(action.payload.token, action.payload.user);
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false
      };
    case 'LOGOUT':
      clearAuthCookies();
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false
      };
    case 'RESTORE_AUTH':
      return {
        ...state,
        isAuthenticated: !!action.payload.token,
        user: action.payload.user,
        token: action.payload.token,
        loading: false
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const { token, user } = getAuthCookies();
    dispatch({ type: 'RESTORE_AUTH', payload: { token, user } });
  }, []);

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ state, dispatch, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};