import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import AuthLayout from './auth/AuthLayout';
import SocialLoginButtons from './auth/SocialLoginButtons';

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

  return (
    <AuthLayout
      title="Access Portal"
      subtitle="Sign in to your professional workspace to manage projects and personnel."
    >
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-8 py-4 rounded-2xl mb-8 text-[11px] font-bold uppercase tracking-widest flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 italic">
          <span className="text-xl">!</span>
          {error}
        </div>
      )}

      <SocialLoginButtons />

      <div className="relative flex items-center my-12 opacity-30">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/20"></div>
        <span className="px-6 text-[9px] font-bold text-white uppercase tracking-[0.4em] italic whitespace-nowrap">Secure Credentials</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/20"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 italic">
        <div className="space-y-3">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
          <div className="relative group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="name@organization.com"
              className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[2.5rem] text-sm font-bold text-white outline-none focus:bg-white/10 focus:border-indigo-500 transition-all placeholder:text-white/10 shadow-inner lowercase"
            />
            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-xl grayscale group-hover:grayscale-0 transition-all opacity-20">✉️</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center px-4">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secret Password</label>
            <Link to="/forgot-password" size="small" className="text-indigo-400 no-underline text-[9px] font-bold uppercase tracking-widest hover:text-indigo-300 transition-colors">Forgot?</Link>
          </div>
          <div className="relative group">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••••••"
              className="w-full pl-8 pr-20 py-5 bg-white/5 border border-white/10 rounded-[2.5rem] text-sm font-bold text-indigo-300 tracking-[0.4em] outline-none focus:bg-white/10 focus:border-indigo-500 transition-all placeholder:text-white/10 shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/5 text-white/40 hover:text-white transition-all flex items-center justify-center text-lg"
            >
              {showPassword ? '👁️' : '🔒'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-6 rounded-[2.5rem] font-bold text-[11px] uppercase tracking-[0.3em] transition-all duration-700 flex items-center justify-center gap-6 shadow-2xl active:scale-95 group overflow-hidden relative ${isLoading
            ? 'bg-slate-900 text-slate-600 grayscale cursor-not-allowed border border-white/5'
            : 'bg-indigo-600 text-white hover:bg-slate-950 hover:scale-[1.02] shadow-indigo-600/20 border border-white/10'
            }`}
        >
          <span className="relative z-10">{isLoading ? 'Authenticating...' : 'Sign In Now'}</span>
          {isLoading ? (
            <div className="w-4 h-4 border-4 border-indigo-200 border-t-white rounded-full animate-spin" />
          ) : (
            <span className="text-xl group-hover:translate-x-4 transition-transform duration-700 opacity-60">➜</span>
          )}
        </button>
      </form>

      <div className="text-center pt-10 space-y-4 font-sans italic">
        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest opacity-60">
          New to the organization?
        </p>
        <Link
          to="/signup"
          className="inline-block text-white no-underline font-bold text-[10px] uppercase tracking-widest hover:text-indigo-400 transition-all border-b border-white/10 hover:border-indigo-500 pb-1"
        >
          Create New Account
        </Link>
      </div>
    </AuthLayout>
  );
};

export default SignIn;