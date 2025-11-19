import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { dispatch } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (error) {
      navigate('/signin?error=' + encodeURIComponent(error));
      return;
    }

    if (token) {
      // Store token and redirect to dashboard
      localStorage.setItem('token', token);
      
      // You might want to fetch user data here
      // For now, we'll just set a basic auth state
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { 
          token,
          user: { id: 'temp' } // This should be replaced with actual user data
        }
      });
      
      navigate('/dashboard');
    } else {
      navigate('/signin?error=Authentication failed');
    }
  }, [location.search, navigate, dispatch]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '48px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          margin: '0 auto 24px',
          borderRadius: '50%',
          border: '4px solid #667eea',
          borderTopColor: 'transparent',
          animation: 'spin 1s linear infinite'
        }}></div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#1e293b',
          marginBottom: '8px'
        }}>
          Completing sign in...
        </h2>
        <p style={{
          color: '#64748b',
          fontSize: '16px'
        }}>
          Please wait while we redirect you.
        </p>
      </div>
      
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default AuthCallback;