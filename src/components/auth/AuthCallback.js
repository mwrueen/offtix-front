import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AuthLayout from './AuthLayout';

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
      localStorage.setItem('token', token);

      const fetchProfileAndLogin = async () => {
        try {
          const response = await api.get('/users/profile');
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              token,
              user: response.data
            }
          });
          navigate('/dashboard');
        } catch (err) {
          console.error('Error fetching user profile during social login callback:', err);
          navigate('/signin?error=Failed to retrieve user profile');
        }
      };

      fetchProfileAndLogin();
    } else {
      navigate('/signin?error=Authentication failed');
    }
  }, [location.search, navigate, dispatch]);

  return (
    <AuthLayout
      title="Completing Sign In"
      subtitle="Please wait while we verify your account credentials."
    >
      <div className="py-12 flex flex-col items-center justify-center text-center">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping"></div>
          </div>
        </div>

        <h2 className="text-base font-semibold text-slate-800 mb-1">
          Authenticating...
        </h2>
        <p className="text-xs text-slate-500 max-w-xs">
          Setting up your session. You will be redirected automatically.
        </p>
      </div>
    </AuthLayout>
  );
};

export default AuthCallback;