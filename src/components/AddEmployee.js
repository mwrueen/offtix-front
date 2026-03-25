import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
      toast?.showToast?.('Failed_to_load_designations', 'error');
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
    if (!formData.email.trim()) newErrors.email = 'EMAIL_REQUIRED_FOR_UPLINK';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'INVALID_COMMUNICATION_ADDRESS';

    if (!formData.designation) newErrors.designation = 'DESIGNATION_RANK_REQUIRED';
    if (formData.salary && isNaN(formData.salary)) newErrors.salary = 'COMPENSATION_MUST_BE_NUMERIC';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast?.showToast?.('ENCRYPTION_ERRORS_DETECTED_IN_COMMAND_BLOCK', 'error');
      return;
    }
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
        toast?.showToast?.(data.message || 'INVITATION_BROADCAST_SUCCESSFUL_UPLINK_LOCKED', 'success');
        navigate('/employees');
      } else {
        const errorData = await response.json();
        toast?.showToast?.(errorData.message || 'BROADCAST_PROTOCOL_FAILURE', 'error');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast?.showToast?.('BROADCASTING_ERROR_CHECK_NETWORK_CELLS', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCompany || selectedCompany.id === 'personal') {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto my-40 bg-white rounded-[7rem] p-32 shadow-24 border-8 border-slate-50 text-center relative overflow-hidden group animate-in zoom-in-95 duration-1200 italic">
          <div className="absolute top-0 right-0 p-32 text-[260px] font-black italic opacity-[0.03] grayscale pointer-events-none select-none text-slate-900 leading-none">NULL</div>
          <div className="text-[200px] mb-16 grayscale opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-2000 inline-block drop-shadow-2xl">🏢</div>
          <h2 className="text-6xl font-black text-slate-950 uppercase tracking-tighter italic mb-8 drop-shadow-sm group-hover:text-indigo-600 transition-all">NODE_NOT_SELECTED</h2>
          <p className="text-xl font-black text-slate-400 italic max-w-2xl mx-auto leading-relaxed opacity-60 underline underline-offset-[20px] decoration-slate-100 uppercase tracking-tight">Select a valid company node cluster to initiate person-to-person induction uplink protocol.</p>
          <button onClick={() => navigate('/overview')} className="mt-16 px-24 py-10 bg-slate-950 text-white rounded-[4rem] font-black text-[13px] uppercase tracking-[0.8em] transition-all shadow-24 hover:bg-indigo-600 hover:scale-110 active:scale-95 border-8 border-white group/btn relative overflow-hidden">
            <span className="relative z-10">RETURN_TO_PRIMARY_FRAME</span>
            <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
          </button>
        </div>
      </Layout>
    );
  }

  if (checkingPermission || loadingDesignations) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-60 animate-pulse space-y-16 italic">
          <div className="text-[180px] mb-6 animate-bounce">📡</div>
          <div className="text-[12px] font-black text-slate-400 uppercase tracking-[0.8em] italic underline underline-offset-[16px] decoration-indigo-200 animate-pulse">AUTHENTICATING_NEURAL_UPLINK_WAVES...</div>
        </div>
      </Layout>
    );
  }

  if (!hasPermission) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto my-40 bg-white rounded-[7rem] p-32 shadow-24 border-8 border-rose-100 text-center relative overflow-hidden group animate-in zoom-in-95 duration-1000 italic">
          <div className="absolute top-0 right-0 p-32 text-[260px] font-black italic opacity-[0.03] grayscale pointer-events-none select-none text-rose-900 leading-none">LOCK</div>
          <div className="text-[200px] mb-16 text-rose-500/10 grayscale group-hover:grayscale-0 group-hover:scale-110 group-hover:text-rose-500/10 transition-all duration-2000 inline-block drop-shadow-2xl">🔒</div>
          <h2 className="text-6xl font-black text-slate-950 uppercase tracking-tighter italic mb-8 drop-shadow-sm group-hover:text-rose-600 transition-all">AUTHORIZATION_REFUSED</h2>
          <p className="text-xl font-black text-slate-400 italic max-w-2xl mx-auto leading-relaxed opacity-60 underline underline-offset-[20px] decoration-rose-50 uppercase tracking-tight">Your neural link clearance level is insufficient for personnel induction into this sector.</p>
          <button onClick={() => navigate('/overview')} className="mt-16 px-24 py-10 bg-rose-600 text-white rounded-[4rem] font-black text-[13px] uppercase tracking-[0.8em] transition-all shadow-24 hover:bg-rose-950 hover:scale-110 active:scale-95 border-8 border-white group/btn relative overflow-hidden shadow-rose-950/20">
            <span className="relative z-10">ABORT_PROTOCOL_SEQUENCE</span>
            <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-[1200px] mx-auto py-24 px-10 italic">
        {/* Tactical Header */}
        <div className="bg-slate-950 p-20 rounded-[6rem] shadow-24 mb-20 relative overflow-hidden group border-8 border-slate-900 animate-in slide-in-from-top-12 duration-1200 pb-32">
          <div className="absolute top-0 right-0 w-[60%] h-full bg-indigo-500/10 -skew-x-[24deg] translate-x-32 group-hover:translate-x-16 transition-all duration-1000"></div>
          <div className="absolute bottom-0 right-0 p-24 text-[260px] font-black italic opacity-[0.03] grayscale pointer-events-none select-none text-white leading-none">INDUCT</div>

          <div className="flex flex-col md:flex-row items-center gap-12 relative z-10 text-white">
            <div className="w-40 h-40 rounded-[4rem] bg-indigo-600 text-white flex items-center justify-center border-8 border-white shadow-24 group-hover:rotate-12 transition-all duration-1000 shadow-indigo-500/50">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
            </div>
            <div className="text-center md:text-left space-y-6">
              <h1 className="text-7xl lg:text-8xl font-black uppercase italic tracking-tighter leading-none mb-4 drop-shadow-2xl"> PERSONNEL_UPLINK </h1>
              <p className="text-indigo-400 font-black uppercase text-[12px] tracking-[0.6em] opacity-80 underline underline-offset-[16px] decoration-white/5">
                Initiating invitation for <span className="text-white italic bg-indigo-600 px-4 py-1 rounded-xl group-hover:bg-white group-hover:text-indigo-600 transition-all duration-700">{selectedCompany.name.toUpperCase()}</span> sector index.
              </p>
            </div>
          </div>
        </div>

        {/* Tactical Control Block */}
        <div className="bg-white p-20 lg:p-32 rounded-[7rem] shadow-24 border-8 border-slate-50 relative overflow-hidden group/form animate-in slide-in-from-bottom-20 duration-1200 pb-60">
          <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-indigo-500/[0.03] rounded-full blur-[160px] pointer-events-none group-hover/form:scale-125 transition-transform duration-2000" />
          <form onSubmit={handleSubmit} className="space-y-16 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

              <div className="space-y-6">
                <Input
                  label="TARGET_ENTITY_EMAIL_ID"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="SUBJECT_EMAIL@OFFTIX.NET"
                  error={errors.email}
                  required
                  helperText="SYSTEM_WILL_BROADCAST_A_NEURAL_LINK_INVITATION_SIG_..."
                />
              </div>

              <div className="space-y-6">
                <Input
                  label="OPERATIONAL_DESIGNATION_RANK"
                  type="select"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  error={errors.designation}
                  required
                  disabled={loadingDesignations}
                  placeholder={loadingDesignations ? 'DECRYPTING_DESIGNATIONS...' : 'IDENTIFY_BASE_DESIGNATION_MODULE'}
                  options={designations.map(d => ({ value: d.name, label: d.name.toUpperCase() }))}
                />
              </div>
            </div>

            <div className="space-y-8">
              <label className="block mb-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] italic ml-8"> COMP_RESOURCE_ALLOCATION / CYCLE_Y </label>
              <div className="relative group/salary">
                <span className="absolute left-10 top-1/2 -translate-y-1/2 text-5xl font-black text-slate-200 group-focus-within/salary:text-indigo-400 group-focus-within/salary:opacity-100 transition-all pointer-events-none z-10 italic opacity-40">
                  {getCurrencySymbol(companyCurrency)}
                </span>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="00.00"
                  className={`w-full py-10 pl-24 pr-12 bg-slate-50 border-[6px] rounded-[4.5rem] text-slate-950 font-black text-7xl outline-none focus:bg-white italic transition-all shadow-inner tracking-tighter ${errors.salary ? 'border-rose-400 focus:border-rose-500' : 'border-slate-50 focus:border-indigo-400'}`}
                />
                <div className="absolute right-12 bottom-6 text-[10px] font-black text-slate-300 uppercase italic tracking-widest opacity-60">BASE_UNITS_ONLY</div>
              </div>
              {errors.salary && <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.5em] italic ml-10 animate-pulse">⚠️ {errors.salary.toUpperCase()}</p>}
              {!errors.salary && <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic ml-10 opacity-40">Define primary financial credit allocation (null initialization permitted).</p>}
            </div>

            {/* Protocol Summary Command Buffer */}
            <div className="p-16 bg-slate-950 rounded-[4.5rem] border-8 border-slate-900 relative overflow-hidden group shadow-2xl animate-in zoom-in-95">
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>
              <div className="flex flex-col md:flex-row gap-12 relative z-10">
                <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-600/30 flex items-center justify-center text-indigo-400 shrink-0 border-4 border-indigo-500/30 text-5xl italic animate-pulse group-hover:rotate-12 transition-transform duration-1000 shadow-lg">
                  ℹ️
                </div>
                <div className="space-y-10 flex-1">
                  <p className="text-lg font-black text-white uppercase italic tracking-[0.3em] underline decoration-indigo-500 decoration-4 underline-offset-[16px]"> UPLINK_PROTOCOL_DOCUMENTATION_LOGS </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                    {[
                      "REGISTERED_ENTITIES_SYNC_INSTANT_PULSE",
                      "UNREGISTERED_SUBJECTS_SMTP_INDUCTION_L",
                      "IDENTITY_VALIDATION_MANDATORY_SY_14_S",
                      "FULL_SECTOR_ACCESS_UPLINK_GRANTED_SYNC"
                    ].map((step, idx) => (
                      <div key={idx} className="flex items-center gap-6 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] group/li italic hover:text-white transition-colors duration-700">
                        <span className="w-8 h-8 rounded-xl bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-indigo-500 font-black group-hover/li:bg-indigo-600 group-hover/li:text-white transition-all shadow-sm">{idx + 1}</span>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Sequence */}
            <div className="flex flex-col sm:flex-row gap-10 justify-end pt-16 border-t-8 border-slate-50">
              <button
                type="button"
                onClick={() => navigate('/employees')}
                disabled={loading}
                className="px-14 py-8 bg-white text-slate-400 border-4 border-slate-50 rounded-[3.5rem] font-black text-[12px] uppercase tracking-[0.6em] hover:bg-slate-50 hover:border-slate-100 hover:text-rose-600 transition-all active:scale-95 disabled:grayscale italic underline underline-offset-8 decoration-slate-50"
              >
                ABORT_PROTOCOL
              </button>
              <button
                type="submit"
                disabled={loading || loadingDesignations}
                className={`px-20 py-8 rounded-[3.5rem] font-black text-[13px] uppercase tracking-[0.8em] text-white shadow-24 transition-all active:scale-95 flex items-center justify-center gap-8 min-w-[320px] italic border-8 border-white group/submit relative overflow-hidden ${loading || loadingDesignations ? 'bg-slate-200 text-slate-500 grayscale' : 'bg-slate-950 hover:bg-indigo-600 hover:scale-105 shadow-indigo-950/20'}`}
              >
                {loading ? (
                  <>
                    <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    BROADCASTING_ENCRYPTED_SIGNALS...
                  </>
                ) : (
                  <>
                    <span className="relative z-10">INITIATE_INDUCTION_UPLINK</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="relative z-10 group-hover:translate-x-4 transition-transform duration-700"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
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
