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
      toast?.showToast?.('Failed to load employee designations.', 'error');
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
    if (!formData.email.trim()) newErrors.email = 'Personnel email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email address.';

    if (!formData.designation) newErrors.designation = 'Professional designation is required.';
    if (formData.salary && isNaN(formData.salary)) newErrors.salary = 'Compensation must be a numeric value.';

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
        const data = await response.json();
        toast?.showToast?.(data.message || 'Invitation sent successfully.', 'success');
        navigate('/employees');
      } else {
        const errorData = await response.json();
        toast?.showToast?.(errorData.message || 'Failed to send invitation.', 'error');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast?.showToast?.('Network error occurred while sending invitation.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCompany || selectedCompany.id === 'personal') {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto my-40 bg-white rounded-3xl p-32 shadow-sm border border-slate-200 text-center space-y-12 animate-in zoom-in-95 duration-700">
          <div className="text-9xl grayscale opacity-10">🏢</div>
          <h2 className="text-4xl font-bold text-slate-900 uppercase italic tracking-tight underline underline-offset-[16px] decoration-slate-100">Organization Not Selected</h2>
          <p className="text-lg font-medium text-slate-500 max-w-xl mx-auto italic leading-relaxed">Please select a valid organization from the company filter to initiate the professional onboarding process.</p>
          <button onClick={() => navigate('/overview')} className="px-16 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-slate-950 transition-all active:scale-95">Return to Dashboard</button>
        </div>
      </Layout>
    );
  }

  if (checkingPermission || loadingDesignations) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-60 text-center animate-pulse space-y-12 italic">
          <div className="w-16 h-16 border-8 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-sm" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Authenticating corporate credentials...</p>
        </div>
      </Layout>
    );
  }

  if (!hasPermission) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto my-40 bg-white rounded-3xl p-32 shadow-sm border border-rose-100 text-center space-y-12 animate-in zoom-in-95 duration-700">
          <div className="text-9xl grayscale opacity-10">🔒</div>
          <h2 className="text-4xl font-bold text-slate-900 uppercase italic tracking-tight text-rose-600">Access Denied</h2>
          <p className="text-lg font-medium text-slate-500 max-w-xl mx-auto italic leading-relaxed">Your professional clearance level is insufficient for personnel onboarding in this organization branch.</p>
          <button onClick={() => navigate('/overview')} className="px-16 py-5 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-rose-600 transition-all active:scale-95 italic">Abort Operation</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-24 space-y-16 animate-in fade-in duration-1000 font-sans pb-40">
        <PageHeader
          title="Incorporate New Personnel"
          subtitle={`Initiating formal professional invitation for ${selectedCompany.name.toUpperCase()}.`}
          icon="👥"
          stats={[
            { label: 'Entity Status', value: 'ACTIVE' },
            { label: 'Organization Node', value: selectedCompany.name.toUpperCase() }
          ]}
          actions={<button onClick={() => navigate(-1)} className="px-8 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all underline underline-offset-8 italic">Cancel Operation</button>}
        />

        <div className="bg-white p-12 lg:p-20 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <form onSubmit={handleSubmit} className="space-y-16 relative z-10 font-sans italic">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-4">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Personnel Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="professional.identity@organization.net"
                  required
                  className={`w-full px-8 py-5 bg-slate-50 border-2 rounded-2xl text-sm font-bold text-indigo-600 outline-none focus:bg-white transition-all uppercase tracking-tight ${errors.email ? 'border-rose-400' : 'border-slate-100 focus:border-indigo-400'}`}
                />
                {errors.email && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-4">⚠️ {errors.email}</p>}
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4 opacity-50">System will dispatch a formal professional invitation package.</p>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Professional Designation / Rank</label>
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  required
                  disabled={loadingDesignations}
                  className={`w-full px-8 py-5 bg-slate-50 border-2 rounded-2xl text-[10px] font-bold text-slate-950 uppercase tracking-widest outline-none focus:bg-white transition-all cursor-pointer ${errors.designation ? 'border-rose-400' : 'border-slate-100 focus:border-indigo-400'}`}
                >
                  <option value="">Select Professional Rank</option>
                  {designations.map(d => <option key={d._id} value={d.name}>{d.name.toUpperCase()}</option>)}
                </select>
                {errors.designation && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-4">⚠️ {errors.designation}</p>}
              </div>
            </div>

            <div className="space-y-8">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] italic ml-1">Annual Compensation Package / Fiscal Allocation</label>
              <div className="relative group/salary">
                <span className="absolute left-8 top-1/2 -translate-y-1/2 text-4xl font-bold text-slate-200 group-focus-within/salary:text-indigo-400 transition-all pointer-events-none z-10 italic">
                  {getCurrencySymbol(companyCurrency)}
                </span>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={`w-full py-12 pl-20 pr-12 bg-slate-50 border-2 rounded-[2.5rem] text-slate-950 font-bold text-6xl lg:text-8xl outline-none focus:bg-white italic transition-all shadow-inner tracking-tighter ${errors.salary ? 'border-rose-400 focus:border-rose-500' : 'border-slate-100 focus:border-indigo-400'}`}
                />
              </div>
              {errors.salary && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-8">⚠️ {errors.salary}</p>}
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-8 opacity-40">Specify primary fiscal resource allocation for this individual role.</p>
            </div>

            <div className="p-12 bg-slate-900 rounded-[3rem] text-white space-y-10 group-hover:rotate-1 transition-transform duration-700 shadow-2xl">
              <h4 className="text-sm font-bold uppercase tracking-[0.5em] text-indigo-400 border-b border-white/5 pb-4 italic">Onboarding Protocol Logs</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  "Instant synchronization with corporate database hubs.",
                  "Formal SMTP notification dispatch to target personnel.",
                  "Onboarding identity verification required upon login.",
                  "Full professional operational rights granted post-verification."
                ].map((log, i) => (
                  <div key={i} className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">
                    <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center italic text-xs shadow-lg">{i + 1}</span>
                    {log}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-6 pt-16 border-t border-slate-50">
              <button
                type="submit"
                disabled={loading || loadingDesignations}
                className="px-24 py-5 bg-indigo-600 text-white rounded-[2rem] font-bold text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-950 transition-all active:scale-95 flex items-center gap-4 italic group/submit"
              >
                {loading ? 'Transmitting data...' : 'Authorize Onboarding Hub'}
                {!loading && <span className="group-hover:translate-x-2 transition-transform">→</span>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddEmployee;
