import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

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
      // Store token
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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>

      <div className="text-center p-12 lg:p-16 bg-white/5 backdrop-blur-3xl rounded-[48px] border border-white/10 shadow-2xl relative z-10 max-w-sm w-full mx-6 animate-in fade-in zoom-in duration-700">
        <div className="w-20 h-20 mx-auto mb-10 relative">
          <div className="absolute inset-0 rounded-3xl border-4 border-indigo-500/20"></div>
          <div className="absolute inset-0 rounded-3xl border-t-4 border-indigo-500 animate-spin"></div>
          <div className="absolute inset-4 bg-indigo-500/10 rounded-xl flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></div>
          </div>
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight mb-4 uppercase italic">
          Synchronizing Hub
        </h2>
        <p className="text-indigo-200/60 text-xs font-black uppercase tracking-[0.2em] animate-pulse">
          Establishing secure handshake...
        </p>

        <div className="mt-12 flex justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30 animate-bounce delay-75"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 animate-bounce delay-150"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/70 animate-bounce delay-300"></div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;