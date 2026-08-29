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
    case 'UPDATE_USER':
      setAuthCookies(state.token, action.payload);
      return {
        ...state,
        user: action.payload
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
    const { token, user: cookieUser } = getAuthCookies();
    
    // Always prioritize fetching fresh user data from API if we have a token
    if (token) {
      const fetchUser = async () => {
        try {
          const response = await fetch('/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const userData = await response.json();
            dispatch({ type: 'RESTORE_AUTH', payload: { token, user: userData } });
            // Sync cookies with fresh, server-side data
            setAuthCookies(token, userData);
          } else {
            // Token might be invalid/expired
            dispatch({ type: 'RESTORE_AUTH', payload: { token: null, user: null } });
          }
        } catch (error) {
          // Fallback to cookie data if network fails
          dispatch({ type: 'RESTORE_AUTH', payload: { token, user: cookieUser } });
        }
      };
      fetchUser();
    } else {
      dispatch({ type: 'RESTORE_AUTH', payload: { token: null, user: null } });
    }
  }, []);

  const refreshUser = async () => {
    const { token } = getAuthCookies();
    const activeToken = token || state.token;
    if (!activeToken) return;
    try {
      const response = await fetch('/api/users/profile', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (response.ok) {
        const userData = await response.json();
        dispatch({ type: 'UPDATE_USER', payload: userData });
        setAuthCookies(activeToken, userData);
        return userData;
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ state, dispatch, logout, refreshUser }}>
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