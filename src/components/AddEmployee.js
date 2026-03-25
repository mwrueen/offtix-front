import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import { useToast } from '../context/ToastContext';
import { getCookie } from '../utils/cookies';
import Layout from './Layout';
import Input from './common/Input';
import { getCurrencySymbol } from '../utils/currency';

const AddEmployee = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { selectedCompany } = useCompanyFilter();
  const toast = useToast();

  const [formData, setFormData] = useState({
    email: '',
    designation: '',
    salary: ''
  });

  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDesignations, setLoadingDesignations] = useState(true);
  const [errors, setErrors] = useState({});
  const [companyCurrency, setCompanyCurrency] = useState('USD');
  const [hasPermission, setHasPermission] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);


  useEffect(() => {
    if (selectedCompany && selectedCompany.id !== 'personal') {
      fetchDesignations();
    }
  }, [selectedCompany]);

  const fetchDesignations = async () => {
    try {
      const token = getCookie('authToken');
      const response = await fetch(`/api/companies/${selectedCompany.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const company = await response.json();
        setDesignations(company.designations || []);
        setCompanyCurrency(company.currency || 'USD');

        // Check user permissions
        const userId = state.user?._id || state.user?.id;
        const ownerId = company.owner?._id || company.owner;
        const isOwner = ownerId?.toString() === userId?.toString();
        const isSuperAdmin = state.user?.role === 'superadmin';

        if (isOwner || isSuperAdmin) {
          setHasPermission(true);
        } else {
          const memberInfo = company.members?.find(m => {
            const memberId = m.user?._id || m.user;
            return memberId?.toString() === userId?.toString();
          });

          if (memberInfo) {
            const designation = company.designations?.find(d => d.name === memberInfo.designation);
            if (designation?.permissions?.addEmployee) {
              setHasPermission(true);
            } else {
              setHasPermission(false);
            }
          } else {
            setHasPermission(false);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching designations:', error);
      toast?.showToast?.('Failed to load designations', 'error');
    } finally {
      setLoadingDesignations(false);
      setCheckingPermission(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email required for uplink';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid communication address';
    }

    if (!formData.designation) {
      newErrors.designation = 'Designation required';
    }

    if (formData.salary && isNaN(formData.salary)) {
      newErrors.salary = 'Compensation must be numeric';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast?.showToast?.('Encryption errors detected in form', 'error');
      return;
    }

    setLoading(true);

    try {
      const token = getCookie('authToken');
      const response = await fetch(`/api/invitations/company/${selectedCompany.id}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          designation: formData.designation,
          salary: formData.salary ? parseFloat(formData.salary) : 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast?.showToast?.(data.message || 'Invitation broadcast successful!', 'success');
        navigate('/overview');
      } else {
        const errorData = await response.json();
        toast?.showToast?.(errorData.message || 'Broadcast failed', 'error');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast?.showToast?.('Broadcasting error. Check network link.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCompany || selectedCompany.id === 'personal') {
    return (
      <Layout>
        <div className="bg-white p-24 rounded-[56px] text-center shadow-sm border border-slate-100 flex flex-col items-center">
          <div className="text-8xl mb-8 opacity-20 grayscale">🏢</div>
          <h2 className="text-slate-800 mb-4 text-3xl font-black tracking-tight">Node Not Selected</h2>
          <p className="text-slate-500 mb-10 max-w-sm font-medium uppercase text-xs tracking-[0.2em]">Select a company node to initiate person-to-person uplink.</p>
          <button
            onClick={() => navigate('/overview')}
            className="px-10 py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
          >
            Return to Overview
          </button>
        </div>
      </Layout>
    );
  }

  if (checkingPermission || loadingDesignations) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-24 text-center">
          <div className="text-6xl mb-6 animate-pulse">📡</div>
          <div className="text-lg font-black text-slate-400 uppercase tracking-widest italic animate-pulse">Authenticating Uplink...</div>
        </div>
      </Layout>
    );
  }

  if (!hasPermission) {
    return (
      <Layout>
        <div className="bg-white p-24 rounded-[56px] text-center shadow-sm border border-slate-100 flex flex-col items-center">
          <div className="text-8xl mb-10 bg-rose-50 w-32 h-32 rounded-[40px] flex items-center justify-center text-rose-500 shadow-inner">🔒</div>
          <h2 className="text-slate-800 mb-4 text-3xl font-black tracking-tight">Authorization Refused</h2>
          <p className="text-slate-500 mb-10 max-w-sm font-medium uppercase text-xs tracking-[0.2em]">Your neural link level is insufficient for employee induction.</p>
          <button
            onClick={() => navigate('/overview')}
            className="px-10 py-5 bg-rose-600 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all active:scale-95 shadow-xl shadow-rose-100"
          >
            Abort Protocol
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-12 px-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-12 lg:p-16 rounded-[56px] mb-12 shadow-2xl shadow-indigo-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-full bg-white/5 -skew-x-12 -z-0 group-hover:bg-white/10 transition-colors duration-700"></div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative z-10 text-white">
            <div className="w-20 h-20 rounded-[28px] bg-white/10 backdrop-blur-xl flex items-center justify-center border-2 border-white/20 shadow-inner group-hover:rotate-6 transition-all duration-500">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-2">Personnel Uplink</h1>
              <p className="text-indigo-100 font-bold uppercase text-[10px] tracking-[0.3em] opacity-80">
                Initiating invitation for <span className="text-white italic underline decoration-indigo-400 group-hover:decoration-white transition-all">{selectedCompany.name}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white p-12 lg:p-16 rounded-[56px] shadow-sm border border-slate-100 group">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-3">
                Target Email <span className="w-8 h-[1px] bg-slate-100"></span>
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="subject@offtix.net"
                error={errors.email}
                required
                className="w-full px-8 py-5 bg-slate-50 border-b-4 border-slate-100 rounded-[24px] text-slate-700 font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner border-t-0 border-l-0 border-r-0"
                noLabel
              />
              <p className="text-[10px] font-bold text-slate-400 italic ml-2 tracking-wide uppercase opacity-60">System will broadcast a neural link invitation</p>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-3">
                Operational Role <span className="w-8 h-[1px] bg-slate-100"></span>
              </label>
              <div className="relative">
                <Input
                  type="select"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  error={errors.designation}
                  required
                  disabled={loadingDesignations}
                  options={[
                    { value: '', label: loadingDesignations ? 'Decrypting Roles...' : 'Identify Base Designation' },
                    ...designations.map(d => ({ value: d.name, label: d.name }))
                  ]}
                  className="w-full px-8 py-5 bg-slate-50 border-b-4 border-slate-100 rounded-[24px] text-slate-700 font-bold outline-none appearance-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner border-t-0 border-l-0 border-r-0"
                  noLabel
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-3">
                Compensation / Cycle <span className="w-8 h-[1px] bg-slate-100"></span>
              </label>
              <div className="relative group/salary">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-slate-300 group-focus-within/salary:text-indigo-500 transition-colors pointer-events-none z-10 italic">
                  {getCurrencySymbol(companyCurrency)}
                </span>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={`w-full py-5 pl-14 pr-8 bg-slate-50 border-b-4 ${errors.salary ? 'border-rose-400 focus:border-rose-500' : 'border-slate-100 focus:border-indigo-500'} rounded-[24px] text-slate-800 font-black outline-none focus:bg-white transition-all shadow-inner`}
                />
              </div>
              {errors.salary && <p className="text-xs font-black text-rose-500 uppercase tracking-widest ml-2">{errors.salary}</p>}
              {!errors.salary && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 opacity-60 italic">Define financial resource allocation (Null allowed)</p>}
            </div>

            {/* Protocol Summary Card */}
            <div className="p-10 bg-slate-900 rounded-[40px] border border-slate-800 relative overflow-hidden group shadow-2xl">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
              <div className="flex gap-6 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-500/30">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                </div>
                <div className="space-y-6">
                  <p className="text-sm font-black text-white uppercase tracking-[0.2em] italic underline decoration-indigo-500 underline-offset-8">Uplink Protocol Documentation</p>
                  <ul className="space-y-4">
                    {[
                      "Registered entities receive instant notification pulse",
                      "Unregistered subjects receive induction link via SMTP",
                      "Identity validation required at sign-up terminal",
                      "Full company access granted upon protocol acceptance"
                    ].map((step, idx) => (
                      <li key={idx} className="flex items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest group/li">
                        <span className="w-5 h-5 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-500 font-black group-hover/li:bg-indigo-600 group-hover/li:text-white transition-colors">{idx + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-end pt-10">
              <button
                type="button"
                onClick={() => navigate('/overview')}
                disabled={loading}
                className="px-10 py-5 bg-white text-slate-400 border-2 border-slate-100 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-50 hover:border-slate-200 hover:text-slate-600 transition-all active:scale-95 disabled:grayscale"
              >
                Abort
              </button>
              <button
                type="submit"
                disabled={loading || loadingDesignations}
                className={`px-12 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest text-white shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 min-w-[240px] ${loading || loadingDesignations ? 'bg-slate-300 text-slate-500 grayscale' : 'bg-slate-900 shadow-slate-200 hover:bg-indigo-600 hover:shadow-indigo-100'}`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Broadcasting...
                  </>
                ) : (
                  <>
                    Initiate Uplink
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddEmployee;
