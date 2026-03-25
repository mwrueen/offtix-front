import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import AuthLayout from './auth/AuthLayout';
import SocialLoginButtons from './auth/SocialLoginButtons';

const SignUp = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
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

  const calculatePasswordStrength = (password) => {
    let s = 0;
    if (password.length >= 8) s += 1;
    if (/[a-z]/.test(password)) s += 1;
    if (/[A-Z]/.test(password)) s += 1;
    if (/[0-9]/.test(password)) s += 1;
    if (/[^A-Za-z0-9]/.test(password)) s += 1;
    return s;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'password') setPasswordStrength(calculatePasswordStrength(value));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { setError('Keyphrase mismatch detected'); return; }
    if (formData.password.length < 6) { setError('Encryption key insufficient length'); return; }
    setIsLoading(true);
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { confirmPassword, ...signupData } = formData;
      const response = await authAPI.signup(signupData);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response.data });
      navigate(from, { replace: true });
    } catch (error) {
      setError(error.response?.data?.error || 'Initialization protocol failed');
      dispatch({ type: 'SET_LOADING', payload: false });
      setIsLoading(false);
    }
  };

  const getSColor = () => {
    if (passwordStrength <= 2) return 'bg-rose-500 shadow-rose-500/50';
    if (passwordStrength <= 3) return 'bg-amber-500 shadow-amber-500/50';
    return 'bg-emerald-500 shadow-emerald-500/50';
  };

  const getSText = () => {
    if (passwordStrength <= 2) return 'FRAGILE_NODE';
    if (passwordStrength <= 3) return 'SYSTEM_STANDARD';
    return 'FORTRESS_LEVEL_9';
  };

  return (
    <AuthLayout
      title="IDENTITY_NEXUS"
      subtitle="Initialize your authority node in the orchestration registry."
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
        <span className="px-10 text-[9px] font-black text-white uppercase tracking-[0.5em] italic whitespace-nowrap">INIT_PHASE_01_ENCRYPTION_LINK</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/20"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10 group/form">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic ml-4">DISPLAY_IDENTITY</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="FULL_IDENTITY_NAME"
              className="w-full px-12 py-7 bg-white/5 border border-white/10 rounded-[3rem] text-sm font-black text-white uppercase tracking-wider outline-none focus:bg-white/10 focus:border-indigo-500 transition-all placeholder:text-white/5 shadow-inner"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic ml-4">ACCESS_MAILBOX</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="NODE@DOMAIN.SYS"
              className="w-full px-12 py-7 bg-white/5 border border-white/10 rounded-[3rem] text-sm font-black text-white uppercase tracking-wider outline-none focus:bg-white/10 focus:border-indigo-500 transition-all placeholder:text-white/5 shadow-inner"
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic ml-4">MASTER_PRIV_KEY</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="••••••••••••••••••••"
            className="w-full px-12 py-7 bg-white/5 border border-white/10 rounded-[3rem] text-sm font-black text-indigo-400 uppercase tracking-[0.5em] outline-none focus:bg-white/10 focus:border-indigo-500 transition-all placeholder:text-white/5 shadow-inner"
          />
          {formData.password && (
            <div className="pt-6 px-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic">SIGNAL_STRENGTH_INDEX</span>
                <span className={`text-[9px] font-black uppercase tracking-[0.3em] italic ${passwordStrength <= 2 ? 'text-rose-500' : passwordStrength <= 3 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {getSText()}
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex gap-1.5 p-[2px]">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`flex-1 h-full rounded-full transition-all duration-1000 ${i < passwordStrength ? getSColor() : 'bg-transparent opacity-0'}`}></div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 pb-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic ml-4">CONFIRM_AUTHORITY</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="••••••••••••••••••••"
            className="w-full px-12 py-7 bg-white/5 border border-white/10 rounded-[3rem] text-sm font-black text-indigo-400 uppercase tracking-[0.5em] outline-none focus:bg-white/10 focus:border-indigo-500 transition-all placeholder:text-white/5 shadow-inner"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-8 bg-indigo-600 text-white rounded-[3.5rem] font-black text-[10px] uppercase tracking-[0.6em] shadow-24 active:scale-95 group overflow-hidden relative transition-all duration-1000 italic ${isLoading ? 'grayscale opacity-50 cursor-not-allowed border border-white/5' : 'hover:bg-indigo-700 hover:scale-[1.02] shadow-indigo-600/30'}`}
        >
          <span className="relative z-10">{isLoading ? 'DEPLOYING_NODE_01...' : 'FORGE_USER_IDENTITY'}</span>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-[shimmer_3s_infinite] -z-0" />
          {!isLoading && <span className="absolute right-12 top-1/2 -translate-y-1/2 text-2xl group-hover:translate-x-6 transition-transform duration-1000 opacity-60">➜</span>}
        </button>
      </form>

      <div className="text-center pt-12 space-y-4">
        <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] italic opacity-60">
          EXISTING_AUTHORITY_VAULT?
        </p>
        <Link
          to="/signin"
          className="inline-block text-white no-underline font-black text-[10px] uppercase tracking-[0.5em] hover:text-indigo-400 transition-all italic border-b-2 border-white/10 hover:border-indigo-500 pb-2"
        >
          SYNCHRONIZE_EXISTING_VAULT
        </Link>
      </div>
    </AuthLayout>
  );
};

export default SignUp;