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
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Project Title *</label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Q4 Marketing Campaign"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Deadline</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-400 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Project Description *</label>
          <div className="rounded-xl border-2 border-slate-100 overflow-hidden bg-white focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all [&_.ql-toolbar]:border-slate-100 [&_.ql-toolbar]:bg-slate-50 [&_.ql-container]:border-slate-100 [&_.ql-editor]:text-sm [&_.ql-editor]:text-slate-800 [&_.ql-editor]:min-h-[180px]">
            <ReactQuill
              theme="snow"
              value={formData.description}
              onChange={(val) => setFormData({ ...formData, description: val })}
              placeholder="Detailed project objectives, requirements, and scope..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Lifecycle Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 cursor-pointer appearance-none transition-all"
            >
              <option value="not_started">Not Started</option>
              <option value="running">In Progress</option>
              <option value="paused">On Hold</option>
              <option value="cancelled">Cancelled</option>
              <option value="closed">Completed</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Priority Level</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 cursor-pointer appearance-none transition-all"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Critical / Urgent</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 mt-4 border-t border-slate-50">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-3.5 text-sm font-bold text-slate-400 hover:text-slate-900 transition-all"
            >
              Discard Changes
            </button>
          )}
          <button
            type="submit"
            className="flex-1 sm:flex-initial px-10 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            {initialData ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;