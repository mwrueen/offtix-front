import React, { useState } from 'react';
import { useCompany } from '../context/CompanyContext';

const ProjectForm = ({ onSubmit, initialData = null, onCancel }) => {
  const { company } = useCompany();
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    status: initialData?.status || 'not_started',
    priority: initialData?.priority || 'medium',
    endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
  });

  const handleSubmit = (e) => { e.preventDefault(); const sd = { ...formData }; if (sd.endDate) sd.endDate = new Date(sd.endDate); onSubmit(sd); };
  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

  return (
    <div className="bg-white rounded-[4rem] border-4 border-slate-50 shadow-24 overflow-hidden italic animate-in zoom-in-95 duration-700 relative">
      <div className="bg-slate-950 p-12 relative overflow-hidden group/header border-b-8 border-indigo-600/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none group-hover/header:translate-x-1/2 transition-transform duration-1000 animate-pulse" />
        <div className="relative z-10">
          <div className="flex items-center gap-8 mb-4">
            <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center text-3xl shadow-24 text-slate-950 group-hover/header:rotate-12 transition-transform duration-700"> {initialData ? '✏️' : '📁'} </div>
            <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter"> {initialData ? 'Update_Project_Parameters' : 'Initiate_New_Mission_Cluster'} </h3>
          </div>
          <p className="text-[11px] font-black text-indigo-400/60 uppercase tracking-[0.5em] italic underline underline-offset-8 decoration-white/10"> {initialData ? 'Recalibrate tactical surveillance data points' : 'Establish primary deployment signal in current sector'} </p>
          {company && (
            <div className="mt-12 p-6 bg-white/5 backdrop-blur-3xl border-2 border-white/10 rounded-[2rem] text-sm font-black text-white italic tracking-tighter shadow-lg flex items-center gap-6 group-hover/header:border-indigo-400 group-hover/header:bg-white/10 transition-all duration-700">
              <span className="text-2xl grayscale group-hover/header:grayscale-0 transition-all">🏢</span>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest opacity-40">SECTOR_COMMAND_CENTER</span>
                <span className="uppercase">{company.name}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-16 space-y-16">
        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em] italic ml-8 flex items-center gap-3 decoration-indigo-200"> <span className="text-xl">🎏</span> PROJECT_MISSION_TITLE * </label>
            <input type="text" name="title" placeholder="E.G., STRATEGIC_NEURAL_REFINEMENT_V2..." value={formData.title} onChange={handleChange} required className="w-full px-12 py-8 bg-slate-50 border-4 border-slate-50 rounded-[3rem] font-black text-[12px] uppercase italic tracking-widest text-slate-950 outline-none focus:bg-white focus:border-indigo-400 focus:shadow-24 transition-all shadow-inner shadow-indigo-100/50" />
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em] italic ml-8 flex items-center gap-3"> <span className="text-xl">📑</span> MISSION_DIRECTIVE_SYNOPSIS * </label>
            <textarea name="description" placeholder="IDENTIFY_PRIMARY_OBJECTIVES_AND_TACTICAL_DELIVERABLES..." value={formData.description} onChange={handleChange} required rows="5" className="w-full px-12 py-10 bg-slate-50 border-4 border-slate-50 rounded-[4rem] font-black text-[11px] uppercase italic tracking-widest text-slate-950 outline-none focus:bg-white focus:border-indigo-400 focus:shadow-24 transition-all shadow-inner shadow-indigo-100/50 min-h-[180px] leading-relaxed" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic ml-6 flex items-center gap-2"> <span className="text-lg">⏳</span> STATUS_PROTOCOL </label>
              <div className="relative group">
                <select name="status" value={formData.status} onChange={handleChange} className="w-full pl-10 pr-16 py-8 bg-slate-50 border-4 border-slate-50 rounded-[3rem] font-black text-[10px] uppercase italic tracking-widest text-slate-950 outline-none focus:bg-white focus:border-indigo-400 cursor-pointer appearance-none transition-all shadow-inner">
                  <option value="not_started">INITIALIZING</option>
                  <option value="running">OPERATIONAL</option>
                  <option value="paused">HALT_STANDBY</option>
                  <option value="cancelled">TERMINATED</option>
                  <option value="closed">LOG_ARCHIVED</option>
                </select>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">▼</div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic ml-6 flex items-center gap-2"> <span className="text-lg">⚠️</span> PRIORITY_STRATA </label>
              <div className="relative group">
                <select name="priority" value={formData.priority} onChange={handleChange} className="w-full pl-10 pr-16 py-8 bg-slate-50 border-4 border-slate-50 rounded-[3rem] font-black text-[10px] uppercase italic tracking-widest text-slate-950 outline-none focus:bg-white focus:border-rose-400 cursor-pointer appearance-none transition-all shadow-inner">
                  <option value="low">LEVEL_04_LOW</option>
                  <option value="medium">LEVEL_03_MED</option>
                  <option value="high">LEVEL_02_HIGH</option>
                  <option value="urgent">LEVEL_01_URGENT</option>
                </select>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">▼</div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic ml-6 flex items-center gap-2"> <span className="text-lg">📅</span> TEMPORUS_EXPECTANCY </label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full px-10 py-8 bg-slate-50 border-4 border-slate-50 rounded-[3rem] font-black text-[11px] uppercase italic text-indigo-600 outline-none focus:bg-white focus:border-indigo-400 transition-all shadow-inner tracking-widest" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-8 pt-12 border-t border-slate-50">
            {onCancel && (
              <button type="button" onClick={onCancel} className="flex-1 py-10 bg-white text-slate-400 rounded-[3rem] font-black text-[11px] uppercase tracking-[0.6em] italic border-4 border-slate-50 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all group overflow-hidden relative shadow-sm">
                <span className="relative z-10 flex items-center justify-center gap-6"> <span className="text-2xl group-hover:rotate-90 transition-transform">✕</span> ABORT_PROTOCOL </span>
              </button>
            )}
            <button type="submit" className="flex-[2] py-10 bg-slate-950 text-white rounded-[3.5rem] font-black text-[11px] uppercase tracking-[0.6em] italic shadow-24 hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all group overflow-hidden relative">
              <span className="relative z-10 flex items-center justify-center gap-8">
                {initialData ? (<> <span>🔄</span> RECALIBRATE_MISSION_UPLINK </>) : (<> <span>🚀</span> AUTHORIZE_DEPLOYMENT_SIGNAL </>)}
              </span>
              <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
            </button>
          </div>
        </form>
      </div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
};

export default ProjectForm;