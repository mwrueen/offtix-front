import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import AuthLayout from '../auth/AuthLayout';
import SocialLoginButtons from '../auth/SocialLoginButtons';

const SignIn = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { state, dispatch } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (state.isAuthenticated) navigate(from, { replace: true });
  }, [state.isAuthenticated, navigate, from]);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) setError(decodeURIComponent(errorParam));
  }, [location.search]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await authAPI.signin(formData);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response.data });
      navigate(from, { replace: true });
    } catch (error) {
      let errorMessage = 'Failed to sign in. Please try again.';
      if (error.response) errorMessage = error.response.data?.error || error.response.data?.message || 'Invalid credentials provided.';
      else if (error.request) errorMessage = 'Network error: Please check your connection.';
      setError(errorMessage);
      dispatch({ type: 'SET_LOADING', payload: false });
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (email, password) => {
    setFormData({ email, password });
    setError('');
    setIsLoading(true);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await authAPI.signin({ email, password });
      dispatch({ type: 'LOGIN_SUCCESS', payload: response.data });
      navigate(from, { replace: true });
    } catch (err) {
      let errorMessage = 'Failed to sign in. Please try again.';
      if (err.response) errorMessage = err.response.data?.error || err.response.data?.message || 'Invalid credentials.';
      setError(errorMessage);
      dispatch({ type: 'SET_LOADING', payload: false });
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account to continue.">
      {error && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-5 text-sm">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Quick Demo Login Panel */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3.5 mb-5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            Quick Demo Login
          </span>
          <span className="text-[11px] font-medium text-indigo-600 bg-indigo-100/80 px-2 py-0.5 rounded-full">1-Click Test</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('admin@offtix.com', 'password123')}
            className="px-2 py-2 bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 text-indigo-950 font-medium text-xs rounded-xl shadow-xs transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer"
          >
            <span className="font-bold text-[11px]">Super Admin</span>
            <span className="text-[10px] opacity-75">admin@offtix.com</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('client@offtix.com', 'password123')}
            className="px-2 py-2 bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 text-indigo-950 font-medium text-xs rounded-xl shadow-xs transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer"
          >
            <span className="font-bold text-[11px]">Company/Client</span>
            <span className="text-[10px] opacity-75">client@offtix.com</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('user@offtix.com', 'password123')}
            className="px-2 py-2 bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 text-indigo-950 font-medium text-xs rounded-xl shadow-xs transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer"
          >
            <span className="font-bold text-[11px]">Employee/User</span>
            <span className="text-[10px] opacity-75">user@offtix.com</span>
          </button>
        </div>
      </div>

      <SocialLoginButtons />


      <div className="relative flex items-center my-6">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="px-4 text-xs text-slate-400">or continue with email</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Email address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <Link to="/forgot-password" className="text-xs text-indigo-600 no-underline hover:text-indigo-500 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              className="w-full pl-4 pr-11 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500/30 focus:ring-2 cursor-pointer"
          />
          <span className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors">Remember me for 30 days</span>
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 mt-2 ${
            isLoading
              ? 'bg-indigo-400 text-white cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98] shadow-sm'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Signing in...
            </>
          ) : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Don't have an account?{' '}
        <Link to="/signup" className="text-indigo-600 no-underline hover:text-indigo-500 transition-colors font-medium">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
};

export default SignIn;
