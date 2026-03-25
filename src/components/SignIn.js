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
      let errorMessage = 'Sign in protocol failure';
      if (error.response) errorMessage = error.response.data?.error || error.response.data?.message || 'Invalid credentials recorded';
      else if (error.request) errorMessage = 'Transmission error: Check link status';
      setError(errorMessage);
      dispatch({ type: 'SET_LOADING', payload: false });
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="IDENTITY_ACCESS"
      subtitle="Synchronize your authority profile to secure terminal access."
    >
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-10 py-6 rounded-[2.5rem] mb-12 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-6 animate-in slide-in-from-top-6 duration-700 italic shadow-24 shadow-rose-500/5">
          <span className="text-2xl">⚠️</span>
          {error}
        </div>
      )}

      <SocialLoginButtons />

      <div className="relative flex items-center my-16 opacity-30">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/20"></div>
        <span className="px-10 text-[9px] font-black text-white uppercase tracking-[0.5em] italic whitespace-nowrap">SECURE_CREDENTIAL_BLOCK</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/20"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12 group/form">
        <div className="space-y-4">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic ml-4">EMAIL_REGISTRY_IDENT</label>
          <div className="relative group/input">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="IDENT_USER@NODE.SYS"
              className="w-full px-12 py-7 bg-white/5 border border-white/10 rounded-[3rem] text-sm font-black text-white uppercase tracking-wider outline-none focus:bg-white/10 focus:border-indigo-500 transition-all placeholder:text-white/5 shadow-inner"
            />
            <div className="absolute right-10 top-1/2 -translate-y-1/2 text-2xl grayscale group-hover/input:grayscale-0 transition-grayscale duration-700">📧</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">SECRET_KEYPHRASE</label>
            <Link to="/forgot-password" size="small" className="text-indigo-400 no-underline text-[9px] font-black uppercase tracking-[0.3em] hover:text-indigo-300 transition-colors italic">RESET_VAULT_LINK</Link>
          </div>
          <div className="relative group/input">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••••••••••"
              className="w-full pl-12 pr-24 py-7 bg-white/5 border border-white/10 rounded-[3rem] text-sm font-black text-indigo-400 uppercase tracking-[0.5em] outline-none focus:bg-white/10 focus:border-indigo-500 transition-all placeholder:text-white/5 shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center text-xl italic"
            >
              {showPassword ? '👁️' : '🔒'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-8 rounded-[3rem] font-black text-[10px] uppercase tracking-[0.5em] transition-all duration-1000 flex items-center justify-center gap-6 shadow-24 active:scale-95 group overflow-hidden relative italic ${isLoading
            ? 'bg-slate-950 text-slate-600 grayscale cursor-not-allowed border border-white/5'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02] shadow-indigo-600/30 border-2 border-indigo-500/20'
            }`}
        >
          <span className="relative z-10">{isLoading ? 'SYNCHRONIZING_PHASE_01...' : 'GRANT_ACCESS_DIRECTIVE'}</span>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-[shimmer_3s_infinite] -z-0" />

          {isLoading ? (
            <div className="w-5 h-5 border-4 border-indigo-200 border-t-white rounded-full animate-spin" />
          ) : (
            <span className="text-2xl group-hover:translate-x-6 transition-transform duration-1000 opacity-60">➜</span>
          )}
        </button>
      </form>

      <div className="text-center pt-12 space-y-4">
        <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] italic opacity-60">
          UNREGISTERED_OPERATIONAL_TARGET?
        </p>
        <Link
          to="/signup"
          className="inline-block text-white no-underline font-black text-[10px] uppercase tracking-[0.5em] hover:text-indigo-400 transition-all italic border-b-2 border-white/10 hover:border-indigo-500 pb-2"
        >
          INITIALIZE_NEW_AUTH_NODE
        </Link>
      </div>
    </AuthLayout>
  );
};

export default SignIn;