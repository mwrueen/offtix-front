import React, { useState } from 'react';
import { phaseAPI } from '../../services/api';
import { useCompany } from '../../context/CompanyContext';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import { Button, Badge } from '../ui';

const PhasesTab = ({ projectId, phases, setPhases, users, isProjectOwner, onRefresh }) => {
  const { state: companyState } = useCompany();
  const companyCurrency = companyState?.selectedCompany?.currency || 'USD';

  const [showForm, setShowForm] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);
  const [viewingPhase, setViewingPhase] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning',
    startDate: '',
    endDate: '',
    budget: '',
    milestones: []
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined
      };

      if (editingPhase) {
        await phaseAPI.update(projectId, editingPhase._id, data);
      } else {
        await phaseAPI.create(projectId, data);
      }

      await onRefresh();
      resetForm();
    } catch (error) {
      console.error('Error saving phase:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'planning',
      startDate: '',
      endDate: '',
      budget: '',
      milestones: []
    });
    setShowForm(false);
    setEditingPhase(null);
  };

  const handleEdit = (phase) => {
    setFormData({
      name: phase.name,
      description: phase.description || '',
      status: phase.status,
      startDate: phase.startDate ? new Date(phase.startDate).toISOString().split('T')[0] : '',
      endDate: phase.endDate ? new Date(phase.endDate).toISOString().split('T')[0] : '',
      budget: phase.budget || '',
      milestones: phase.milestones || []
    });
    setEditingPhase(phase);
    setShowForm(true);
  };

  const handleDelete = (phaseId) => {
    const phase = phases.find(p => p._id === phaseId);
    setDeleteModal({
      isOpen: true,
      id: phaseId,
      name: phase?.name || 'this phase'
    });
  };

  const confirmDelete = async () => {
    try {
      await phaseAPI.delete(projectId, deleteModal.id);
      await onRefresh();
      setDeleteModal({ isOpen: false, id: null, name: '' });
    } catch (error) {
      console.error('Error deleting phase:', error);
    }
  };


  const calculateProgress = (phase) => {
    if (!phase.milestones || phase.milestones.length === 0) return 0;
    const completed = phase.milestones.filter(m => m.completed).length;
    return Math.round((completed / phase.milestones.length) * 100);
  };

  const filteredPhases = phases.filter(phase => {
    const matchesSearch = phase.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (phase.description && phase.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || phase.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Project Phases</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filteredPhases.length} of {phases.length} total phases
          </p>
        </div>
        {isProjectOwner && (
          <Button
            variant={showForm ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          >
            {showForm ? 'Cancel' : '+ Add New Phase'}
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Search</label>
            <input
              type="text"
              placeholder="Filter by phase name..."
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
              <option value="on-hold">On Hold</option>
            </select>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8 shadow-md">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-xl">📁</div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{editingPhase ? 'Edit Phase' : 'Create New Phase'}</h3>
              <p className="text-xs text-slate-500 font-medium">Structure your project timeline and deliverables.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Phase Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., Discovery & Analysis"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="4"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400 resize-none"
                    placeholder="Objectives and scope..."
                  />
                </div>
              </div>

              <div className="space-y-4">
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
                    <option value="on-hold">On Hold</option>
                  </select>
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

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Allocated Budget ({companyCurrency})</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400"
                    placeholder="e.g., 5000"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={resetForm}>Discard</Button>
              <Button type="submit" variant="primary">{editingPhase ? 'Update Phase' : 'Create Phase'}</Button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhases.map(phase => {
            const progress = calculateProgress(phase);
            return (
              <div key={phase._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg border border-slate-100">📁</div>
                    <div>
                      <h3 className="font-bold text-slate-900 line-clamp-1 uppercase tracking-tight">{phase.name}</h3>
                      <div className="mt-1">
                        <Badge variant={phase.status === 'completed' ? 'success' : phase.status === 'active' ? 'primary' : phase.status === 'planning' ? 'warning' : 'default'} size="sm">{phase.status}</Badge>
                      </div>
                    </div>
                  </div>
                  {isProjectOwner && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(phase)} className="!text-slate-400 hover:!text-indigo-600 !p-2">✎</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(phase._id)} className="!text-slate-400 hover:!text-rose-600 !p-2">✕</Button>
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Progress</span>
                    <span className="text-xs font-bold text-slate-900">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                  <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase mb-1">Budget</div>
                    <div className="text-xs font-bold text-slate-900">{companyCurrency} {phase.budget || '0'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-bold text-slate-400 uppercase mb-1">Timeline</div>
                    <div className="text-[10px] font-bold text-slate-700">Ends {new Date(phase.endDate).toLocaleDateString()}</div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => setViewingPhase(phase)}
                  className="mt-6 w-full !bg-slate-50 hover:!bg-indigo-50 !text-slate-500 hover:!text-indigo-600 !rounded-xl !text-[10px] uppercase tracking-widest"
                >
                  Phase Details
                </Button>
              </div>
            );
          })}

          {filteredPhases.length === 0 && (
            <div className="col-span-full py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-bold text-slate-900">No phases found</h3>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or create a new phase.</p>
              <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setFilterStatus('all'); }} className="mt-4 !text-indigo-600 hover:underline">Clear all filters</Button>
            </div>
          )}
        </div>
      )}

      {/* Viewing Modal */}
      {viewingPhase && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4" onClick={() => setViewingPhase(null)}>
          <div className="bg-white rounded-3xl p-10 w-full max-w-3xl shadow-2xl border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-10">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl border border-slate-100">📁</div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{viewingPhase.name}</h2>
                  <div className="mt-2">
                    <Badge variant={viewingPhase.status === 'completed' ? 'success' : viewingPhase.status === 'active' ? 'primary' : viewingPhase.status === 'planning' ? 'warning' : 'default'} size="sm">{viewingPhase.status}</Badge>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingPhase(null)} className="!text-slate-400 hover:!text-slate-900 !text-2xl !p-2">✕</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Description</h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-6 rounded-2xl border border-slate-100 min-h-[140px]">{viewingPhase.description || 'No description provided.'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                    <div className="text-[9px] font-bold text-amber-600 uppercase mb-1">Budget</div>
                    <div className="text-xl font-black text-amber-900 truncate">{companyCurrency} {viewingPhase.budget || '0'}</div>
                  </div>
                  <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                    <div className="text-[9px] font-bold text-indigo-600 uppercase mb-1">Progress</div>
                    <div className="text-xl font-black text-indigo-900">{calculateProgress(viewingPhase)}%</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Timeline & Milestones</h4>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-700">
                    <span>Starts: {new Date(viewingPhase.startDate).toLocaleDateString()}</span>
                    <span>Ends: {new Date(viewingPhase.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="space-y-3">
                    {viewingPhase.milestones?.length > 0 ? viewingPhase.milestones.map((m, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <div className={`w-2 h-2 rounded-full ${m.completed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className="text-xs font-bold text-slate-700">{m.name}</span>
                        {m.dueDate && <span className="text-[9px] text-slate-400 ml-auto font-medium">{new Date(m.dueDate).toLocaleDateString()}</span>}
                      </div>
                    )) : (
                      <p className="text-xs text-slate-400 text-center py-4">No milestones defined for this phase.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Delete Phase"
        message={`Are you sure you want to delete ${deleteModal.name}? This will remove all phase associations.`}
      />
    </div>
  );
};

export default PhasesTab;