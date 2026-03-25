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
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500 relative font-sans">
      <div className="bg-slate-900 p-8 lg:p-10 relative overflow-hidden group/header border-b border-white/10">
        <div className="relative z-10">
          <div className="flex items-center gap-6 mb-2">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-md text-slate-900 group-hover/header:scale-110 transition-transform"> {initialData ? '✏️' : '📁'} </div>
            <h3 className="text-2xl font-bold text-white uppercase italic tracking-tight"> {initialData ? 'Update Project Details' : 'Initialize New Project'} </h3>
          </div>
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1 opacity-70"> {initialData ? 'Modify the existing project parameters and deadline.' : 'Establish a new project workspace for your team.'} </p>
          {company && (
            <div className="mt-8 flex items-center gap-4 py-2 border-t border-white/5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Organization Unit:</span>
              <span className="text-xs font-bold text-white uppercase italic">{company.name}</span>
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="p-8 lg:p-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Project Title *</label>
            <input type="text" name="title" placeholder="e.g. Q4 Marketing Campaign" value={formData.title} onChange={handleChange} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all font-sans" />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Project Description *</label>
            <textarea name="description" placeholder="Briefly describe the project objectives and scope..." value={formData.description} onChange={handleChange} required rows="5" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-600 outline-none focus:bg-white focus:border-indigo-400 transition-all min-h-[140px] leading-relaxed resize-none italic" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Lifecycle Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-900 outline-none focus:bg-white focus:border-indigo-400 cursor-pointer appearance-none transition-all">
                <option value="not_started">Not Started</option>
                <option value="running">In Progress</option>
                <option value="paused">On Hold</option>
                <option value="cancelled">Cancelled</option>
                <option value="closed">Completed</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Priority Level</label>
              <select name="priority" value={formData.priority} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-900 outline-none focus:bg-white focus:border-indigo-400 cursor-pointer appearance-none transition-all">
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Critical / Urgent</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Deadline</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-600 outline-none focus:bg-white focus:border-indigo-400 transition-all" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-slate-100">
            {onCancel && (
              <button type="button" onClick={onCancel} className="px-8 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-all italic underline underline-offset-8">Cancel Entry</button>
            )}
            <button type="submit" className="flex-1 sm:flex-initial px-10 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg hover:bg-slate-950 transition-all active:scale-95">
              {initialData ? 'Save Project Changes' : 'Create Project Hub'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;