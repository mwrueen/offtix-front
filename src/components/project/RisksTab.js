import React, { useState } from 'react';
import { projectAPI } from '../../services/api';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import { Button, Badge } from '../ui';

const RisksTab = ({ projectId, project, isProjectOwner, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingRisk, setEditingRisk] = useState(null);
  const [viewingRisk, setViewingRisk] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterProbability, setFilterProbability] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium',
    probability: 'medium',
    mitigation: '',
    status: 'identified'
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

  const risks = project?.risks || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRisk) {
        await projectAPI.updateRisk(projectId, editingRisk._id, formData);
      } else {
        await projectAPI.addRisk(projectId, formData);
      }

      await onRefresh();
      resetForm();
    } catch (error) {
      console.error('Error saving risk:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      severity: 'medium',
      probability: 'medium',
      mitigation: '',
      status: 'identified'
    });
    setShowForm(false);
    setEditingRisk(null);
  };

  const handleEdit = (risk) => {
    setFormData({
      title: risk.title || '',
      description: risk.description || '',
      severity: risk.severity || 'medium',
      probability: risk.probability || 'medium',
      mitigation: risk.mitigation || '',
      status: risk.status || 'identified'
    });
    setEditingRisk(risk);
    setShowForm(true);
    setViewingRisk(null);
  };

  const handleDelete = (riskId) => {
    const risk = risks.find(r => r._id === riskId);
    setDeleteModal({
      isOpen: true,
      id: riskId,
      name: risk?.title || 'this risk'
    });
  };

  const confirmDelete = async () => {
    try {
      await projectAPI.deleteRisk(projectId, deleteModal.id);
      await onRefresh();
      setDeleteModal({ isOpen: false, id: null, name: '' });
    } catch (error) {
      console.error('Error deleting risk:', error);
    }
  };



  const filteredRisks = risks.filter(risk => {
    const matchesSearch = risk.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      risk.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || risk.severity === filterSeverity;
    const matchesProbability = filterProbability === 'all' || risk.probability === filterProbability;
    const matchesStatus = filterStatus === 'all' || risk.status === filterStatus;
    return matchesSearch && matchesSeverity && matchesProbability && matchesStatus;
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Risk Registry</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filteredRisks.length} active risks identified within project scope
          </p>
        </div>
        {isProjectOwner && (
          <Button
            variant={showForm ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          >
            {showForm ? 'Cancel' : '+ Create Risk'}
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Search</label>
            <input
              type="text"
              placeholder="Filter by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-400 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Severity</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-400 cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="low">Low Impact</option>
              <option value="medium">Medium Impact</option>
              <option value="high">High Impact</option>
              <option value="critical">Critical Impact</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Probability</label>
            <select
              value={filterProbability}
              onChange={(e) => setFilterProbability(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-400 cursor-pointer"
            >
              <option value="all">All Probabilities</option>
              <option value="low">Low Probability</option>
              <option value="medium">Medium Probability</option>
              <option value="high">High Probability</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-400 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="identified">Identified</option>
              <option value="monitoring">Monitoring</option>
              <option value="mitigated">Mitigated</option>
              <option value="occurred">Occurred</option>
            </select>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8 shadow-md">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-xl">⚠️</div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{editingRisk ? 'Edit Risk Profile' : 'Identify New Risk'}</h3>
              <p className="text-sm text-slate-500 mt-1">Document potential project threats and mitigation strategies.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Risk Title <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g., Resources unavailable in Phase 2"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Description & Impact</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    placeholder="Explain the risk and its potential impact..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400 resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Mitigation Strategy</label>
                  <textarea
                    value={formData.mitigation}
                    onChange={(e) => setFormData({ ...formData, mitigation: e.target.value })}
                    rows="4"
                    placeholder="How will we prevent or handle this risk?"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Severity / Impact</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Probability / Likelihood</label>
                  <select
                    value={formData.probability}
                    onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none"
                  >
                    <option value="identified">Identified</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="mitigated">Mitigated</option>
                    <option value="occurred">Occurred</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-8 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
              <Button type="submit" variant="primary">{editingRisk ? 'Update Risk' : 'Save Risk'}</Button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRisks.map(risk => (
            <div
              key={risk._id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer flex flex-col"
              onClick={() => setViewingRisk(risk)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant={risk.severity === 'critical' ? 'danger' : risk.severity === 'high' ? 'warning' : risk.severity === 'medium' ? 'warning' : 'success'} size="sm">{risk.severity} Impact</Badge>
                  <Badge variant={risk.probability === 'high' ? 'warning' : risk.probability === 'medium' ? 'primary' : 'default'} size="sm">{risk.probability} Likely</Badge>
                </div>
                {isProjectOwner && (
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(risk)} className="!text-slate-400 hover:!text-indigo-600 !p-1.5">✎</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(risk._id)} className="!text-slate-400 hover:!text-rose-600 !p-1.5">✕</Button>
                  </div>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">{risk.title}</h3>
              <p className="text-xs text-slate-500 mb-6 line-clamp-2 h-8">{risk.description || 'No summary provided.'}</p>

              <div className="mt-auto flex justify-between items-center pt-4 border-t border-slate-50">
                <Badge variant={risk.status === 'mitigated' ? 'success' : risk.status === 'occurred' ? 'danger' : risk.status === 'monitoring' ? 'primary' : 'default'} size="sm">{risk.status}</Badge>
                <div className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">See Details ⮕</div>
              </div>
            </div>
          ))}

          {filteredRisks.length === 0 && (
            <div className="col-span-full py-24 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-lg font-bold text-slate-900">No risks identified</h3>
              <p className="text-sm text-slate-500 mt-1">Excellent! No threats currently match your filters.</p>
              <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setFilterSeverity('all'); setFilterProbability('all'); setFilterStatus('all'); }} className="mt-6 !text-indigo-600 hover:underline">Clear Filters</Button>
            </div>
          )}
        </div>
      )}

      {viewingRisk && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-4" onClick={() => setViewingRisk(null)}>
          <div className="bg-white rounded-3xl p-10 w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-2xl border border-rose-100 italic font-black text-rose-500">!</div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 leading-none">{viewingRisk.title}</h2>
                  <div className="flex items-center gap-3 mt-4 flex-wrap">
                    <Badge variant={viewingRisk.severity === 'critical' ? 'danger' : viewingRisk.severity === 'high' ? 'warning' : viewingRisk.severity === 'medium' ? 'warning' : 'success'} size="sm">{viewingRisk.severity} Severity</Badge>
                    <Badge variant={viewingRisk.probability === 'high' ? 'warning' : viewingRisk.probability === 'medium' ? 'primary' : 'default'} size="sm">{viewingRisk.probability} Likelihood</Badge>
                    <Badge variant={viewingRisk.status === 'mitigated' ? 'success' : viewingRisk.status === 'occurred' ? 'danger' : viewingRisk.status === 'monitoring' ? 'primary' : 'default'} size="sm">{viewingRisk.status}</Badge>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingRisk(null)} className="!text-slate-400 hover:!text-slate-900 !text-2xl !leading-none !p-2">✕</Button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin space-y-10">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Context & Impact</h4>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-sm text-slate-700 leading-relaxed font-medium">
                  {viewingRisk.description || 'No detailed documentation available.'}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Mitigation & Response</h4>
                <div className="bg-indigo-50/30 p-6 rounded-2xl border border-indigo-100 text-sm font-bold text-slate-900 leading-relaxed">
                  {viewingRisk.mitigation || 'No mitigation protocol has been established yet.'}
                </div>
              </div>
            </div>

            {isProjectOwner && (
              <div className="mt-10 pt-8 border-t border-slate-100 flex gap-4 flex-shrink-0">
                <Button variant="primary" onClick={() => { handleEdit(viewingRisk); }} className="flex-1">Edit Risk</Button>
                <Button variant="danger" onClick={() => { setViewingRisk(null); handleDelete(viewingRisk._id); }} className="flex-1">Delete Risk</Button>
              </div>
            )}
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Delete Risk"
        message={`Are you sure you want to permanently delete this risk: "${deleteModal.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default RisksTab;
