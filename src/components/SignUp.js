import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import AuthLayout from './auth/AuthLayout';
import SocialLoginButtons from './auth/SocialLoginButtons';

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { state, dispatch } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (state.isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [state.isAuthenticated, navigate, from]);

  // Handle URL parameters for social login errors
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [location.search]);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const { confirmPassword, ...signupData } = formData;
      const response = await authAPI.signup(signupData);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response.data });
      navigate(from, { replace: true });
    } catch (error) {
      setError(error.response?.data?.error || 'Sign up failed');
      dispatch({ type: 'SET_LOADING', payload: false });
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-rose-500';
    if (passwordStrength <= 3) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getPasswordStrengthTextColor = () => {
    if (passwordStrength <= 2) return 'text-rose-500';
    if (passwordStrength <= 3) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Fragile';
    if (passwordStrength <= 3) return 'Standard';
    return 'Fortress';
  };

  return (
    <AuthLayout
      title="Initiate Presence"
      subtitle="Register your node in the global orchestration network"
    >
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-5 rounded-2xl mb-8 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </div>
          <span className="text-xs font-black uppercase tracking-widest">{error}</span>
        </div>
      )}

      {/* Social Login Buttons */}
      <div className="mb-10">
        <SocialLoginButtons />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-6 mb-10 group">
        <div className="flex-1 h-[2px] bg-slate-50 group-hover:bg-slate-100 transition-colors"></div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Encryption Link</span>
        <div className="flex-1 h-[2px] bg-slate-50 group-hover:bg-slate-100 transition-colors"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 mb-10">
        <div className="space-y-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-6 py-4 bg-slate-50 border-b-4 border-slate-100 rounded-2xl text-slate-700 font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner"
            placeholder="John Wick"
          />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Interface</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-6 py-4 bg-slate-50 border-b-4 border-slate-100 rounded-2xl text-slate-700 font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner"
            placeholder="node@offtix.io"
          />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Cryptographic Key</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-6 py-4 bg-slate-50 border-b-4 border-slate-100 rounded-2xl text-slate-700 font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner"
            placeholder="••••••••"
          />
          {formData.password && (
            <div className="pt-4 px-2">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Signal Integrity</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${getPasswordStrengthTextColor()}`}>
                  {getPasswordStrengthText()}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`flex-1 h-full rounded-full transition-all duration-500 ${i < passwordStrength ? getPasswordStrengthColor() : 'bg-transparent opacity-20'}`}></div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Key Verification</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="w-full px-6 py-4 bg-slate-50 border-b-4 border-slate-100 rounded-2xl text-slate-700 font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-2xl transition-all active:scale-95 disabled:grayscale disabled:opacity-50 flex items-center justify-center gap-4 ${isLoading ? 'bg-slate-400' : 'bg-slate-900 shadow-slate-200 hover:bg-indigo-600 hover:shadow-indigo-100'}`}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              Deploy Presence
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </>
          )}
        </button>
      </form>

      <div className="text-center bg-slate-50 p-6 rounded-[32px] border border-slate-100 group">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Existing Identity Found?{' '}
        </span>
        <Link
          to="/signin"
          className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 hover:underline decoration-2 underline-offset-4"
        >
          Access Vault
        </Link>
      </div>
    </AuthLayout>
  );
};

export default SignUp;