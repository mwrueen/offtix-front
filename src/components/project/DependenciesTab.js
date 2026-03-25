import React, { useState } from 'react';
import { projectAPI } from '../../services/api';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

const DependenciesTab = ({ projectId, project, isProjectOwner, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingDependency, setEditingDependency] = useState(null);
  const [viewingDependency, setViewingDependency] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'internal',
    status: 'pending',
    dueDate: ''
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

  const dependencies = project?.dependencies || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDependency) {
        await projectAPI.updateDependency(projectId, editingDependency._id, formData);
      } else {
        await projectAPI.addDependency(projectId, formData);
      }

      await onRefresh();
      resetForm();
    } catch (error) {
      console.error('Error saving dependency:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'internal',
      status: 'pending',
      dueDate: ''
    });
    setShowForm(false);
    setEditingDependency(null);
  };

  const handleEdit = (dependency) => {
    setFormData({
      title: dependency.title || '',
      description: dependency.description || '',
      type: dependency.type || 'internal',
      status: dependency.status || 'pending',
      dueDate: dependency.dueDate ? dependency.dueDate.split('T')[0] : ''
    });
    setEditingDependency(dependency);
    setShowForm(true);
    setViewingDependency(null);
  };

  const handleDelete = (dependencyId) => {
    const dep = dependencies.find(d => d._id === dependencyId);
    setDeleteModal({
      isOpen: true,
      id: dependencyId,
      name: dep?.title || 'this dependency'
    });
  };

  const confirmDelete = async () => {
    try {
      await projectAPI.deleteDependency(projectId, deleteModal.id);
      await onRefresh();
      setDeleteModal({ isOpen: false, id: null, name: '' });
    } catch (error) {
      console.error('Error deleting dependency:', error);
    }
  };

  const getTypeBadge = (type) => {
    const typeMap = {
      internal: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      external: 'bg-purple-50 text-purple-700 border-purple-200',
      technical: 'bg-slate-50 text-slate-700 border-slate-200',
      resource: 'bg-amber-50 text-amber-700 border-amber-200',
      business: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
    return typeMap[type] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200 font-bold',
      'in-progress': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      blocked: 'bg-rose-50 text-rose-700 border-rose-200 font-black',
      resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-black'
    };
    return statusMap[status] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const filteredDependencies = dependencies.filter(dep => {
    const matchesSearch = dep.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dep.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || dep.type === filterType;
    const matchesStatus = filterStatus === 'all' || dep.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Project Dependencies</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filteredDependencies.length} dependencies currently tracked
          </p>
        </div>
        {isProjectOwner && (
          <button
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 ${showForm ? 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            {showForm ? 'Cancel' : '+ New Dependency'}
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Search</label>
            <input
              type="text"
              placeholder="Filter by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-400 transition-all font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-400 cursor-pointer font-medium"
            >
              <option value="all">All Types</option>
              <option value="internal">Internal</option>
              <option value="external">External</option>
              <option value="technical">Technical</option>
              <option value="resource">Resource</option>
              <option value="business">Business</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-400 cursor-pointer font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8 shadow-md transition-all font-sans">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-xl italic font-black shadow-inner">D</div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{editingDependency ? 'Edit Dependency' : 'Add Dependency'}</h3>
              <p className="text-sm text-slate-500">Track blockers and external requirements.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Title <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g. Server Migration Completion"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400 font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="4"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400 resize-none font-sans"
                    placeholder="Provide details about this dependency..."
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
                    >
                      <option value="internal">Internal</option>
                      <option value="external">External</option>
                      <option value="technical">Technical</option>
                      <option value="resource">Resource</option>
                      <option value="business">Business</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="blocked">Blocked</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Target Resolution Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold shadow-inner outline-none focus:bg-white focus:border-indigo-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-8 border-t border-slate-100">
              <button type="button" onClick={resetForm} className="px-6 py-2.5 bg-white text-slate-500 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">Cancel</button>
              <button
                type="submit"
                className="px-10 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition-all uppercase tracking-widest text-[11px]"
              >
                {editingDependency ? 'Update Dependency' : 'Save Dependency'}
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDependencies.map(dep => (
            <div
              key={dep._id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer flex flex-col"
              onClick={() => setViewingDependency(dep)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg italic font-black shadow-inner ring-1 ring-slate-100 italic">D</div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight line-clamp-1">{dep.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border uppercase ${getTypeBadge(dep.type)}`}>{dep.type}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border uppercase ${getStatusBadge(dep.status)}`}>{dep.status}</span>
                    </div>
                  </div>
                </div>
                {isProjectOwner && (
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleEdit(dep)} className="p-1 px-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs">✎</button>
                    <button onClick={() => handleDelete(dep._id)} className="p-1 px-2 text-slate-400 hover:text-rose-600 transition-colors text-xs">✕</button>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500 line-clamp-2 h-8 mb-6 font-medium bg-slate-50/50 p-3 rounded-lg flex-1">{dep.description || 'No description provided.'}</p>

              <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center bg-white">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">
                  🗓️ {dep.dueDate ? new Date(dep.dueDate).toLocaleDateString() : 'No Target Date'}
                </div>
                <div className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">Details ⮕</div>
              </div>
            </div>
          ))}

          {filteredDependencies.length === 0 && (
            <div className="col-span-full py-24 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-lg font-bold text-slate-900">No dependencies found</h3>
              <p className="text-sm text-slate-500 mt-1">Excellent! No blockers are currently tracked.</p>
              <button onClick={() => { setSearchTerm(''); setFilterType('all'); setFilterStatus('all'); }} className="mt-6 text-xs font-bold text-indigo-600 hover:underline uppercase tracking-widest">Clear Filters</button>
            </div>
          )}
        </div>
      )}

      {viewingDependency && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 font-sans" onClick={() => setViewingDependency(null)}>
          <div className="bg-white rounded-3xl p-10 w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl border border-slate-100 font-black italic">D</div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 leading-none">{viewingDependency.title}</h2>
                  <div className="flex items-center gap-3 mt-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase ${getTypeBadge(viewingDependency.type)}`}>{viewingDependency.type}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase ${getStatusBadge(viewingDependency.status)}`}>{viewingDependency.status}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewingDependency(null)} className="p-2 text-slate-400 hover:text-slate-900 text-2xl leading-none">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin space-y-10">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Dependency Analysis</h4>
                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-slate-700 font-medium leading-relaxed">
                  {viewingDependency.description || 'No detailed documentation available.'}
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 flex justify-between items-center shadow-lg">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target Resolution Date</span>
                  <span className="text-lg font-bold text-white uppercase tracking-tight">
                    {viewingDependency.dueDate ? new Date(viewingDependency.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'NO DATE SET'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Status</span>
                  <span className={`text-xs font-bold uppercase block px-3 py-1 rounded-lg bg-white/10 ${viewingDependency.status === 'blocked' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {viewingDependency.status === 'blocked' ? 'BLOCKED' : 'ON TRACK'}
                  </span>
                </div>
              </div>
            </div>

            {isProjectOwner && (
              <div className="mt-10 pt-8 border-t border-slate-100 flex gap-4 flex-shrink-0">
                <button onClick={() => { handleEdit(viewingDependency); }} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition-all uppercase tracking-widest">Edit Dependency</button>
                <button onClick={() => { setViewingDependency(null); handleDelete(viewingDependency._id); }} className="flex-1 py-3 bg-slate-50 text-rose-500 border border-slate-200 rounded-xl text-xs font-bold hover:bg-rose-50 transition-all uppercase tracking-widest">Delete</button>
              </div>
            )}
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Remove Dependency"
        message={`Are you sure you want to permanently remove "${deleteModal.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default DependenciesTab;
