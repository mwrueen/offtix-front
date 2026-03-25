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
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setIsLoading(true);
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { confirmPassword, ...signupData } = formData;
      const response = await authAPI.signup(signupData);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response.data });
      navigate(from, { replace: true });
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed. Please try again.');
      dispatch({ type: 'SET_LOADING', payload: false });
      setIsLoading(false);
    }
  };

  const getSColor = () => {
    if (passwordStrength <= 2) return 'bg-rose-500';
    if (passwordStrength <= 3) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getSText = () => {
    if (passwordStrength <= 2) return 'Weak / Simple';
    if (passwordStrength <= 3) return 'Moderate Strength';
    return 'Highly Secure';
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Register your professional profile to begin managing projects and teams."
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
        <span className="px-6 text-[9px] font-bold text-white uppercase tracking-[0.4em] italic whitespace-nowrap">Profile Registration</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/20"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 italic">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Professional Name" className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[2.5rem] text-sm font-bold text-white outline-none focus:bg-white/10 focus:border-indigo-500 transition-all placeholder:text-white/10 shadow-inner uppercase tracking-tight" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Work Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="name@organization.com" className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[2.5rem] text-sm font-bold text-white outline-none focus:bg-white/10 focus:border-indigo-500 transition-all placeholder:text-white/10 shadow-inner lowercase" />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Account Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••••••••••" className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[2.5rem] text-sm font-bold text-indigo-300 tracking-[0.4em] outline-none focus:bg-white/10 focus:border-indigo-500 transition-all placeholder:text-white/10 shadow-inner" />
          {formData.password && (
            <div className="pt-4 px-6 scale-95 origin-left">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest italic">Security Strength</span>
                <span className={`text-[8px] font-bold uppercase tracking-widest italic ${passwordStrength <= 2 ? 'text-rose-500' : 'text-emerald-500'}`}>{getSText()}</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`flex-1 h-full rounded-full transition-all duration-700 ${i < passwordStrength ? getSColor() : 'bg-white/5'}`}></div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Confirm Password</label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••••••••••" className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[2.5rem] text-sm font-bold text-indigo-300 tracking-[0.4em] outline-none focus:bg-white/10 focus:border-indigo-500 transition-all placeholder:text-white/10 shadow-inner" />
        </div>

        <button type="submit" disabled={isLoading} className={`w-full py-6 mt-4 rounded-[2.5rem] font-bold text-[11px] uppercase tracking-[0.3em] transition-all duration-700 flex items-center justify-center gap-6 shadow-2xl active:scale-95 group overflow-hidden relative ${isLoading ? 'bg-slate-900 text-slate-600 grayscale' : 'bg-indigo-600 text-white hover:bg-slate-950 shadow-indigo-600/20 border border-white/10'}`}>
          <span className="relative z-10">{isLoading ? 'Registering...' : 'Create My Account'}</span>
          {!isLoading && <span className="text-xl group-hover:translate-x-4 transition-transform duration-700 opacity-60">➜</span>}
        </button>
      </form>

      <div className="text-center pt-10 space-y-4 font-sans italic">
        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest opacity-60">
          Already have an account?
        </p>
        <Link to="/signin" className="inline-block text-white no-underline font-bold text-[10px] uppercase tracking-widest hover:text-indigo-400 transition-all border-b border-white/10 hover:border-indigo-500 pb-1">Sign In Instead</Link>
      </div>
    </AuthLayout>
  );
};

export default SignUp;