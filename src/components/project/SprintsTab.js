import React, { useState } from 'react';
import { sprintAPI } from '../../services/api';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import { Button, Badge } from '../ui';

const SprintsTab = ({ projectId, sprints, setSprints, phases, users, isProjectOwner, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [viewingSprint, setViewingSprint] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPhase, setFilterPhase] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phase: '',
    status: 'planning',
    startDate: '',
    endDate: '',
    goal: '',
    capacity: '',
    velocity: ''
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        phase: formData.phase || undefined,
        capacity: formData.capacity ? parseFloat(formData.capacity) : undefined,
        velocity: formData.velocity ? parseFloat(formData.velocity) : undefined
      };

      if (editingSprint) {
        await sprintAPI.update(projectId, editingSprint._id, data);
      } else {
        await sprintAPI.create(projectId, data);
      }

      await onRefresh();
      resetForm();
    } catch (error) {
      console.error('Error saving sprint:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      phase: '',
      status: 'planning',
      startDate: '',
      endDate: '',
      goal: '',
      capacity: '',
      velocity: ''
    });
    setShowForm(false);
    setEditingSprint(null);
  };

  const handleEdit = (sprint) => {
    setFormData({
      name: sprint.name,
      description: sprint.description || '',
      phase: sprint.phase?._id || '',
      status: sprint.status,
      startDate: sprint.startDate ? new Date(sprint.startDate).toISOString().split('T')[0] : '',
      endDate: sprint.endDate ? new Date(sprint.endDate).toISOString().split('T')[0] : '',
      goal: sprint.goal || '',
      capacity: sprint.capacity || '',
      velocity: sprint.velocity || ''
    });
    setEditingSprint(sprint);
    setShowForm(true);
  };

  const handleDelete = (sprintId) => {
    const sprint = sprints.find(s => s._id === sprintId);
    setDeleteModal({
      isOpen: true,
      id: sprintId,
      name: sprint?.name || 'this sprint'
    });
  };

  const confirmDelete = async () => {
    try {
      await sprintAPI.delete(projectId, deleteModal.id);
      await onRefresh();
      setDeleteModal({ isOpen: false, id: null, name: '' });
    } catch (error) {
      console.error('Error deleting sprint:', error);
    }
  };



  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredSprints = sprints.filter(sprint => {
    const matchesSearch = sprint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sprint.description && sprint.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sprint.goal && sprint.goal.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || sprint.status === filterStatus;
    const matchesPhase = filterPhase === 'all' || sprint.phase?._id === filterPhase;
    return matchesSearch && matchesStatus && matchesPhase;
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Project Sprints</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filteredSprints.length} of {sprints.length} total sprints
          </p>
        </div>
        {isProjectOwner && (
          <Button
            variant={showForm ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          >
            {showForm ? 'Cancel' : '+ Add New Sprint'}
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Search</label>
            <input
              type="text"
              placeholder="Filter by name or goal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-400 transition-all font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-400 transition-all cursor-pointer font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Phase</label>
            <select
              value={filterPhase}
              onChange={(e) => setFilterPhase(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-400 transition-all cursor-pointer font-medium"
            >
              <option value="all">All Phases</option>
              {phases.map(phase => (
                <option key={phase._id} value={phase._id}>{phase.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8 shadow-md">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-xl">🏃</div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{editingSprint ? 'Edit Sprint' : 'Create New Sprint'}</h3>
              <p className="text-xs text-slate-500 font-medium font-sans">Define sprint goals, duration, and capacity.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Sprint Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., Development Sprint 1"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400 resize-none"
                    placeholder="Focus area..."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Phase</label>
                    <select
                      value={formData.phase}
                      onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400 transition-all cursor-pointer"
                    >
                      <option value="">No Phase</option>
                      {phases.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400 transition-all cursor-pointer"
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">Start Date <span className="text-rose-500">*</span></label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-1">End Date <span className="text-rose-500">*</span></label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={resetForm}>Discard</Button>
              <Button type="submit" variant="primary">{editingSprint ? 'Update Sprint' : 'Create Sprint'}</Button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSprints.map(sprint => (
            <div key={sprint._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg border border-slate-100 shadow-inner">🏃</div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{sprint.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant={sprint.status === 'completed' ? 'success' : sprint.status === 'active' ? 'primary' : sprint.status === 'planning' ? 'warning' : sprint.status === 'cancelled' ? 'danger' : 'default'} size="sm">{sprint.status}</Badge>
                      {sprint.phase && <Badge variant="default" size="sm">{sprint.phase.name}</Badge>}
                    </div>
                  </div>
                </div>
                {isProjectOwner && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(sprint)} className="!text-slate-400 hover:!text-indigo-600 !p-2">✎</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(sprint._id)} className="!text-slate-400 hover:!text-rose-600 !p-2">✕</Button>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase mb-1 font-sans">Timeline</div>
                  <div className="text-xs font-bold text-slate-700">
                    {sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : 'N/A'} - {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5 font-medium">({calculateDuration(sprint.startDate, sprint.endDate)} days)</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setViewingSprint(sprint)} className="!text-indigo-600 hover:underline uppercase tracking-widest !text-[10px]">View Details ⮕</Button>
              </div>
            </div>
          ))}

          {filteredSprints.length === 0 && (
            <div className="col-span-full py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-bold text-slate-900">No sprints found</h3>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or create a new sprint.</p>
              <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterPhase('all'); }} className="mt-4 !text-indigo-600 hover:underline">Clear all filters</Button>
            </div>
          )}
        </div>
      )}

      {viewingSprint && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4" onClick={() => setViewingSprint(null)}>
          <div className="bg-white rounded-3xl p-10 w-full max-w-2xl shadow-2xl border border-slate-200 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-slate-100">🏃</div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{viewingSprint.name}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant={viewingSprint.status === 'completed' ? 'success' : viewingSprint.status === 'active' ? 'primary' : viewingSprint.status === 'planning' ? 'warning' : viewingSprint.status === 'cancelled' ? 'danger' : 'default'} size="sm">{viewingSprint.status}</Badge>
                    {viewingSprint.phase && <Badge variant="default" size="sm">{viewingSprint.phase.name}</Badge>}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingSprint(null)} className="!text-slate-400 hover:!text-slate-900 !text-2xl !p-2">✕</Button>
            </div>

            <div className="space-y-8">
              {viewingSprint.description && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Description</h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-6 rounded-2xl border border-slate-100">{viewingSprint.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Timeline</h4>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <div className="text-sm font-bold text-slate-900">
                      {new Date(viewingSprint.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      <br />
                      <span className="text-slate-400 font-medium">to</span>
                      <br />
                      {new Date(viewingSprint.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-[10px] font-bold text-indigo-600 mt-2 uppercase tracking-wider">{calculateDuration(viewingSprint.startDate, viewingSprint.endDate)} Day Cycle</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Metrics</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                        <div className="text-lg font-black text-amber-900">{viewingSprint.capacity || '0'}h</div>
                        <div className="text-[8px] font-bold text-amber-600 uppercase tracking-widest">Capacity</div>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                        <div className="text-lg font-black text-emerald-900">{viewingSprint.velocity || '0'}</div>
                        <div className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Velocity</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isProjectOwner && (
              <div className="mt-10 pt-8 border-t border-slate-100 flex gap-4">
                <Button variant="primary" onClick={() => { handleEdit(viewingSprint); setViewingSprint(null); }} className="flex-1">Edit Sprint</Button>
                <Button variant="danger" onClick={() => { setViewingSprint(null); handleDelete(viewingSprint._id); }} className="flex-1">Delete</Button>
              </div>
            )}
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Delete Sprint"
        message={`Are you sure you want to delete ${deleteModal.name}? This action cannot be undone.`}
      />
    </div>
  );
};

export default SprintsTab;