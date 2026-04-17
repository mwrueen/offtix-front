import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const sd = { ...formData };
    if (sd.endDate) sd.endDate = new Date(sd.endDate);
    onSubmit(sd);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 ml-1">Project Title</label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Website Revamp 2024"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 ml-1">Target Deadline</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 ml-1">Description</label>
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all [&_.ql-toolbar]:border-none [&_.ql-toolbar]:bg-slate-50 [&_.ql-container]:border-none [&_.ql-editor]:text-sm [&_.ql-editor]:text-slate-700 [&_.ql-editor]:min-h-[160px]">
            <ReactQuill
              theme="snow"
              value={formData.description}
              onChange={(val) => setFormData({ ...formData, description: val })}
              placeholder="Outline the project scope, objectives, and key milestones..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 ml-1">Current Status</label>
            <div className="relative">
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer appearance-none transition-all"
              >
                <option value="not_started">Not Started</option>
                <option value="running">In Progress</option>
                <option value="paused">On Hold</option>
                <option value="cancelled">Cancelled</option>
                <option value="closed">Completed</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 ml-1">Priority</label>
            <div className="relative">
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer appearance-none transition-all"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-700 transition-all active:scale-[0.98]"
          >
            {initialData ? 'Update Project' : 'Save Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;