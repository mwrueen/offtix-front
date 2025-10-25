import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import AuthLayout from './auth/AuthLayout';

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const { state, dispatch } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';
  
  useEffect(() => {
    if (state.isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [state.isAuthenticated, navigate, from]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await authAPI.signin(formData);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response.data });
      navigate(from, { replace: true });
    } catch (error) {
      setError(error.response?.data?.error || 'Sign in failed');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <AuthLayout 
      title="Welcome back" 
      subtitle="Sign in to your account to continue"
    >
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151'
          }}>
            Email address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151'
          }}>
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none'
            }}
          />
        </div>
        
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Sign in
        </button>
      </form>
      
      <div style={{ textAlign: 'center' }}>
        <span style={{ color: '#6b7280', fontSize: '14px' }}>
          Don't have an account?{' '}
        </span>
        <Link 
          to="/signup" 
          style={{
            color: '#667eea',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          Sign up
        </Link>
      </div>
    </AuthLayout>
  );
};

export default SignIn;