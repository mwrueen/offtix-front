import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import AuthLayout from '../auth/AuthLayout';
import SocialLoginButtons from '../auth/SocialLoginButtons';

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false
  });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (name === 'password') setPasswordStrength(calculatePasswordStrength(value));

    // Clear errors when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Full name is required';

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.acceptedTerms) {
      newErrors.acceptedTerms = 'You must accept the terms and privacy policy';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setError('Please correct the highlighted errors below.');
      return;
    }

    setIsLoading(true);
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { confirmPassword, acceptedTerms, ...signupData } = formData;
      const response = await authAPI.signup(signupData);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response.data });
      navigate(from, { replace: true });
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed. Please try again.');
      dispatch({ type: 'SET_LOADING', payload: false });
      setIsLoading(false);
    }
  };

  const strengthColor = passwordStrength <= 2 ? 'bg-rose-500' : passwordStrength <= 3 ? 'bg-amber-400' : 'bg-emerald-500';
  const strengthText = passwordStrength <= 2 ? 'Weak' : passwordStrength <= 3 ? 'Fair' : 'Strong';
  const strengthTextColor = passwordStrength <= 2 ? 'text-rose-500' : passwordStrength <= 3 ? 'text-amber-500' : 'text-emerald-600';

  const EyeIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  const inputClass = "w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all";

  return (
    <AuthLayout title="Create an account" subtitle="Sign up to get started with Offtix.">
      {error && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl mb-5 text-sm">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <SocialLoginButtons />

      <div className="relative flex items-center my-6">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="px-4 text-xs text-slate-400">or sign up with email</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Full name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              placeholder="Jane Smith"
              className={`${inputClass} ${errors.name ? 'border-rose-300 ring-2 ring-rose-500/10 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
            />
            {errors.name && <p className="text-[11px] font-medium text-rose-500 mt-1">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              placeholder="you@example.com"
              className={`${inputClass} ${errors.email ? 'border-rose-300 ring-2 ring-rose-500/10 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
            />
            {errors.name && !errors.email && <div className="h-[15px]" />} {/* Spacer if only name has error */}
            {errors.email && <p className="text-[11px] font-medium text-rose-500 mt-1">{errors.email}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              placeholder="Create a password"
              className={`${inputClass} pr-11 ${errors.password ? 'border-rose-300 ring-2 ring-rose-500/10 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {errors.password && <p className="text-[11px] font-medium text-rose-500 mt-1">{errors.password}</p>}
          {formData.password && !errors.password && (
            <div className="pt-1 space-y-1.5">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i < passwordStrength ? strengthColor : 'bg-slate-200'}`} />
                ))}
              </div>
              <p className={`text-xs ${strengthTextColor}`}>{strengthText} password</p>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Confirm password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              placeholder="Repeat your password"
              className={`${inputClass} pr-11 ${errors.confirmPassword ? 'border-rose-300 ring-2 ring-rose-500/10 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" aria-label={showConfirm ? 'Hide password' : 'Show password'}>
              {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-[11px] font-medium text-rose-500 mt-1">{errors.confirmPassword}</p>}
        </div>

        <label className={`flex items-start gap-2.5 cursor-pointer group p-3 rounded-xl transition-all ${errors.acceptedTerms ? 'bg-rose-50 border border-rose-100' : 'hover:bg-slate-50'}`}>
          <input
            type="checkbox"
            name="acceptedTerms"
            checked={formData.acceptedTerms}
            onChange={handleChange}
            className={`w-4 h-4 mt-0.5 rounded border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500/30 focus:ring-2 cursor-pointer shrink-0 transition-all ${errors.acceptedTerms ? 'border-rose-300 ring-2 ring-rose-500/20' : ''}`}
          />
          <div className="space-y-1">
            <span className={`text-sm transition-colors leading-snug ${errors.acceptedTerms ? 'text-rose-600 font-medium' : 'text-slate-500 group-hover:text-slate-700'}`}>
              I agree to the{' '}
              <Link to="/terms" className="text-indigo-600 hover:text-indigo-500 no-underline font-medium">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-indigo-600 hover:text-indigo-500 no-underline font-medium">Privacy Policy</Link>
            </span>
            {errors.acceptedTerms && <p className="text-[11px] font-medium text-rose-500">{errors.acceptedTerms}</p>}
          </div>
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 mt-1 ${isLoading
            ? 'bg-indigo-400 text-white cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98] shadow-sm'
            }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Creating account...
            </>
          ) : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{' '}
        <Link to="/signin" className="text-indigo-600 no-underline hover:text-indigo-500 transition-colors font-medium">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default SignUp;
