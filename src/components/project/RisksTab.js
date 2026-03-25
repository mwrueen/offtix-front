import React, { useState } from 'react';
import { projectAPI } from '../../services/api';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

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

  const getSeverityBadge = (severity) => {
    const severityMap = {
      low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      medium: 'bg-amber-50 text-amber-700 border-amber-200',
      high: 'bg-orange-50 text-orange-700 border-orange-200 font-bold',
      critical: 'bg-rose-50 text-rose-700 border-rose-200 font-black'
    };
    return severityMap[severity] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const getProbabilityBadge = (probability) => {
    const probabilityMap = {
      low: 'bg-slate-50 text-slate-500 border-slate-200',
      medium: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      high: 'bg-purple-50 text-purple-700 border-purple-200 font-bold'
    };
    return probabilityMap[probability] || 'bg-slate-50 text-slate-500 border-slate-200';
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      identified: 'bg-slate-100 text-slate-600',
      monitoring: 'bg-indigo-50 text-indigo-700',
      mitigated: 'bg-emerald-50 text-emerald-700 font-bold',
      occurred: 'bg-rose-50 text-rose-700 font-black'
    };
    return statusMap[status] || 'bg-slate-100 text-slate-600';
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
          <button
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 ${showForm ? 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            {showForm ? 'Cancel' : '+ Create Risk'}
          </button>
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
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-white text-slate-500 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition-all"
              >
                {editingRisk ? 'Update Risk' : 'Save Risk'}
              </button>
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
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border tracking-wider ${getSeverityBadge(risk.severity)}`}>
                    {risk.severity} Impact
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border tracking-wider ${getProbabilityBadge(risk.probability)}`}>
                    {risk.probability} Likely
                  </span>
                </div>
                {isProjectOwner && (
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleEdit(risk)} className="p-1 px-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs">✎</button>
                    <button onClick={() => handleDelete(risk._id)} className="p-1 px-2 text-slate-400 hover:text-rose-600 transition-colors text-xs">✕</button>
                  </div>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">{risk.title}</h3>
              <p className="text-xs text-slate-500 mb-6 line-clamp-2 h-8">{risk.description || 'No summary provided.'}</p>

              <div className="mt-auto flex justify-between items-center pt-4 border-t border-slate-50">
                <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${getStatusBadge(risk.status)}`}>
                  {risk.status}
                </div>
                <div className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">See Details ⮕</div>
              </div>
            </div>
          ))}

          {filteredRisks.length === 0 && (
            <div className="col-span-full py-24 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-lg font-bold text-slate-900">No risks identified</h3>
              <p className="text-sm text-slate-500 mt-1">Excellent! No threats currently match your filters.</p>
              <button
                onClick={() => { setSearchTerm(''); setFilterSeverity('all'); setFilterProbability('all'); setFilterStatus('all'); }}
                className="mt-6 text-xs font-bold text-indigo-600 hover:underline uppercase tracking-widest"
              >
                Clear Filters
              </button>
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
                  <div className="flex items-center gap-3 mt-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-widest ${getSeverityBadge(viewingRisk.severity)}`}>{viewingRisk.severity} Severity</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-widest ${getProbabilityBadge(viewingRisk.probability)}`}>{viewingRisk.probability} Likelihood</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-widest ${getStatusBadge(viewingRisk.status)}`}>{viewingRisk.status}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewingRisk(null)} className="p-2 text-slate-400 hover:text-slate-900 text-2xl leading-none">✕</button>
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
                <button onClick={() => { handleEdit(viewingRisk); }} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition-all uppercase tracking-widest">Edit Risk</button>
                <button onClick={() => { setViewingRisk(null); handleDelete(viewingRisk._id); }} className="flex-1 py-3 bg-slate-50 text-rose-500 border border-slate-200 rounded-xl text-xs font-bold hover:bg-rose-50 transition-all uppercase tracking-widest">Delete Risk</button>
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
