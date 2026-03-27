import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import { useToast } from '../context/ToastContext';
import { getCookie } from '../utils/cookies';
import Layout from './Layout';
import PageHeader from './PageHeader';
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
      toast.showToast('Failed to load organizational roles.', 'error');
    } finally {
      setLoadingDesignations(false);
      setCheckingPermission(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format.';

    if (!formData.designation) newErrors.designation = 'Role selection is required.';
    if (formData.salary && isNaN(formData.salary)) newErrors.salary = 'Must be a numeric value.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const token = getCookie('authToken');
      const response = await fetch(`/api/invitations/company/${selectedCompany.id}/invite`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          designation: formData.designation,
          salary: formData.salary ? parseFloat(formData.salary) : 0
        })
      });

      if (response.ok) {
        toast.showToast('Invitation dispatched successfully.', 'success');
        navigate('/employees');
      } else {
        const errorData = await response.json();
        toast.showToast(errorData.message || 'Transmission failed.', 'error');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.showToast('Network error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCompany || selectedCompany.id === 'personal') {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto my-32 bg-white rounded-3xl p-32 shadow-2xl border border-slate-100 text-center space-y-10 animate-in zoom-in-95 duration-700">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-5xl shadow-inner border border-slate-100">🏢</div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Organization Context Required</h2>
          <p className="text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">Please select a professional entity from the company filter to initiate the onboarding workflow.</p>
          <button onClick={() => navigate('/overview')} className="px-12 py-4.5 bg-indigo-600 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-slate-950 transition-all active:scale-95">Go to Overview</button>
        </div>
      </Layout>
    );
  }

  if (checkingPermission || loadingDesignations) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-60 animate-in fade-in space-y-8">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-100 rounded-full" />
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] animate-pulse">Synchronizing access protocols...</p>
        </div>
      </Layout>
    );
  }

  if (!hasPermission) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto my-32 bg-white rounded-3xl p-32 shadow-2xl border border-slate-100 text-center space-y-10 animate-in zoom-in-95 duration-700">
          <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-5xl shadow-inner border border-rose-100">🔒</div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight text-rose-600">Access Restricted</h2>
          <p className="text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">Your account lacks the necessary administrative clearance to invite new members to this organization.</p>
          <button onClick={() => navigate('/overview')} className="px-12 py-4.5 bg-slate-950 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-rose-600 transition-all active:scale-95">Abort and Return</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-12 space-y-12 animate-in fade-in duration-700 pb-40">
        <PageHeader
          title="Onboard New Talent"
          subtitle={`Design and dispatch a formal invitation for ${selectedCompany.name}.`}
          icon="✨"
          actions={<button onClick={() => navigate(-1)} className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-all flex items-center gap-2 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Return
          </button>}
        />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
          {/* Form Side */}
          <div className="xl:col-span-7 bg-white p-10 lg:p-16 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

            <form onSubmit={handleSubmit} className="space-y-12 relative z-10">
              <div className="space-y-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-sm border border-indigo-100">01</div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Identity Details</h3>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Work Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@company.com"
                    required
                    className={`w-full px-8 py-5 bg-slate-50 border-2 rounded-2xl text-base font-bold text-slate-900 outline-none focus:bg-white transition-all shadow-sm ${errors.email ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-50 focus:border-indigo-400 focus:shadow-indigo-100/30 focus:ring-4 focus:ring-indigo-50'}`}
                  />
                  {errors.email && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-4 animate-in slide-in-from-left-2 transition-all">⚠️ {errors.email}</p>}
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-sm border border-indigo-100">02</div>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Role & Compensation</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Professional Role</label>
                    <select
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      required
                      className={`w-full px-8 py-5 bg-slate-50 border-2 rounded-2xl text-[11px] font-bold text-slate-950 uppercase tracking-widest outline-none focus:bg-white transition-all cursor-pointer shadow-sm ${errors.designation ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-50 focus:border-indigo-400 focus:shadow-indigo-100/30 focus:ring-4 focus:ring-indigo-50'}`}
                    >
                      <option value="">Select Position</option>
                      {designations.map(d => <option key={d._id} value={d.name}>{d.name.toUpperCase()}</option>)}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Annual Package</label>
                    <div className="relative group/salary">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-300 group-focus-within/salary:text-indigo-500 transition-all pointer-events-none">
                        {getCurrencySymbol(companyCurrency)}
                      </span>
                      <input
                        type="number"
                        name="salary"
                        value={formData.salary}
                        onChange={handleChange}
                        placeholder="0.00"
                        className={`w-full py-5 pl-12 pr-8 bg-slate-50 border-2 rounded-2xl text-base font-bold text-slate-900 outline-none focus:bg-white transition-all shadow-sm ${errors.salary ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-50 focus:border-indigo-400 focus:shadow-indigo-100/30 focus:ring-4 focus:ring-indigo-50'}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading || loadingDesignations}
                  className="w-full py-6 bg-slate-950 text-white rounded-2xl font-bold text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-slate-300 hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-4 relative overflow-hidden group/btn"
                >
                  <span className="relative z-10">{loading ? 'Dispatching Invitation...' : 'Launch Invitation'}</span>
                  {!loading && <svg className="relative z-10 group-hover:translate-x-2 transition-transform" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>}
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-indigo-700 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
                </button>
              </div>
            </form>
          </div>

          {/* Preview Side */}
          <div className="xl:col-span-5 space-y-8 animate-in slide-in-from-right-8 duration-1000">
            <div className="bg-slate-950 rounded-[2.5rem] p-10 lg:p-12 text-white shadow-2xl shadow-indigo-100/20 relative overflow-hidden border border-white/5 group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-indigo-500/40 transition-all duration-700" />

              <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-2xl">📧</div>
                  <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-emerald-500/20">Live Preview</div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Invitation Subject</h4>
                    <p className="text-xl font-bold tracking-tight leading-tight">Join the {selectedCompany.name} Professional Network</p>
                  </div>

                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                    <p className="text-sm font-medium text-slate-300 leading-relaxed italic">
                      "You've been formally invited to join <span className="text-indigo-400 font-bold">{selectedCompany.name}</span> as a <span className="text-white font-bold">{formData.designation || '[Position]'}</span>. Your profile is ready for activation."
                    </p>
                    <div className="h-px bg-white/10 w-full" />
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold uppercase">{selectedCompany.name.charAt(0)}</div>
                      <div>
                        <p className="text-[10px] font-bold text-white uppercase tracking-widest">{selectedCompany.name}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Identity Verified</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col items-center">
                  <div className="w-full h-12 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/30 group-hover:bg-indigo-500 transition-colors">
                    Accept Invitation
                  </div>
                  <p className="mt-4 text-[9px] font-bold text-slate-600 uppercase tracking-widest text-center">This link will securely authenticate through corporate SSL protocols.</p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-600 rounded-3xl p-8 lg:p-10 text-white shadow-xl shadow-indigo-100 flex items-center gap-8 group">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shrink-0 border border-white/20 group-hover:rotate-12 transition-transform duration-500">🛡️</div>
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-widest opacity-80">Security Protocol</h4>
                <p className="text-sm font-medium leading-relaxed">Invitations are cryptographically signed and valid for 72 hours. Unauthorized access attempts are monitored.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AddEmployee;


