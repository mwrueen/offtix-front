import React, { useState } from 'react';
import { useCompany } from '../../context/CompanyContext';
import { useToast } from '../../context/ToastContext';

const CompanyForm = ({ onClose }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const { createCompany } = useCompany();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createCompany(formData);
      onClose();
    } catch (error) {
      toast.error('Error creating company: ' + (error.response?.data?.message || error.message));
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
            <h3 className="text-2xl font-black uppercase italic tracking-tight leading-none mb-2">Initialize Organization</h3>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.4em] opacity-80 italic">Set up a new corporate node for team synchronization</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/10 text-white hover:bg-rose-600 transition-all text-2xl font-bold active:scale-90 relative z-10">×</button>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        </div>

        {/* Modal Content */}
        <div className="p-10 lg:p-12 overflow-y-auto scrollbar-none flex-1 font-sans bg-white">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">1. Official Identity</label>
              <input
                type="text"
                required
                placeholder="e.g. ACME_PROTOCOLS_INC"
                className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xl font-black text-slate-950 focus:border-indigo-400 focus:bg-white transition-all outline-none italic tracking-tight uppercase placeholder:opacity-20"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 italic">2. Strategic Directives</label>
              <textarea
                placeholder="Briefly define the organization's mission and scope..."
                rows="4"
                className="w-full px-8 py-6 bg-slate-100 border-2 border-transparent rounded-[2.5rem] text-sm font-semibold text-slate-600 outline-none focus:bg-white focus:border-indigo-400 focus:ring-8 focus:ring-indigo-50 transition-all resize-none italic leading-relaxed min-h-[150px] shadow-inner"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
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
                <span className="relative z-10">{loading ? 'Constructing...' : 'Construct Organization'}</span>
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

export default CompanyForm;