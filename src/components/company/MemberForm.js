import React, { useState, useEffect } from 'react';
import { useCompany } from '../../context/CompanyContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const MemberForm = ({ onClose }) => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    userId: '',
    designation: '',
    salary: 0
  });
  const [loading, setLoading] = useState(false);
  const { company, addMember } = useCompany();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addMember(formData.userId, formData.designation, formData.salary);
      onClose();
    } catch (error) {
      toast.error('Error adding member: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[2500] p-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl border border-white/20 overflow-hidden relative animate-in zoom-in-95 duration-500 flex flex-col font-sans">

        {/* Modal Header */}
        <div className="px-10 py-8 bg-slate-950 text-white flex justify-between items-center shrink-0 relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-2xl font-black uppercase italic tracking-tight leading-none mb-2">Initialize Personnel</h3>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.4em] opacity-80 italic">Assign new operative to organization registry</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/10 text-white hover:bg-rose-600 transition-all text-2xl font-bold active:scale-90 relative z-10">×</button>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        </div>

        {/* Modal Content */}
        <div className="p-10 lg:p-12 overflow-y-auto scrollbar-none flex-1 font-sans bg-white">
          <form onSubmit={handleSubmit} className="space-y-10">

            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">1. Select Target User</label>
              <div className="relative group">
                <select
                  required
                  className="w-full px-8 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[13px] font-bold text-slate-950 focus:border-indigo-400 focus:bg-white transition-all outline-none appearance-none cursor-pointer uppercase italic tracking-tight"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                >
                  <option value="" className="bg-white">Choose an operative...</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id} className="bg-white">
                      {user.name?.toUpperCase()} ({user.email?.toLowerCase()})
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400 opacity-40 group-hover:opacity-100 transition-opacity italic font-black text-xs">▼</div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">2. Designation Protocol</label>
              <div className="relative group">
                <select
                  required
                  className="w-full px-8 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[13px] font-bold text-slate-950 focus:border-indigo-400 focus:bg-white transition-all outline-none appearance-none cursor-pointer uppercase italic tracking-tight"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                >
                  <option value="" className="bg-white">Select Rank / Position...</option>
                  {company?.designations?.map((designation, index) => (
                    <option key={index} value={designation.name} className="bg-white">
                      {designation.name?.toUpperCase()}
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400 opacity-40 group-hover:opacity-100 transition-opacity italic font-black text-xs">▼</div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">3. Remuneration Rate</label>
              <div className="relative group">
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.salary || ''}
                  onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                  className="w-full px-8 py-4 bg-slate-100 border-2 border-transparent rounded-2xl text-2xl font-black text-indigo-600 outline-none focus:bg-white focus:border-indigo-400 focus:ring-8 focus:ring-indigo-50 transition-all italic placeholder:opacity-20 shadow-inner"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black italic uppercase tracking-widest text-[10px]">MONTHLY_STIPEND</div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-slate-50">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-4 font-black text-[11px] uppercase tracking-[0.3em] text-slate-400 hover:text-slate-950 transition-all italic active:scale-95"
              >
                Abort Protocol
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-24 hover:bg-slate-950 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group/btn relative overflow-hidden ${loading ? 'opacity-50 grayscale cursor-wait' : ''}`}
              >
                <span className="relative z-10">{loading ? 'Synchronizing...' : 'Finalize Assignment'}</span>
                {!loading && <span className="relative z-10 group-hover:translate-x-2 transition-transform italic">→</span>}
                <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover/btn:animate-[shimmer_3s_infinite]" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MemberForm;