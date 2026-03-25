import React, { useState } from 'react';
import { projectAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useCompany } from '../../context/CompanyContext';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

const ProjectOverview = ({ project, users, isProjectOwner }) => {
  const { showToast } = useToast();
  const { state: companyState } = useCompany();
  const companyCurrency = companyState?.selectedCompany?.currency || 'USD';

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null, name: '' });

  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', dueDate: '' });
  const [tagInput, setTagInput] = useState('');
  const milestones = project.milestones || [];
  const risks = project.risks || [];
  const dependencies = project.dependencies || [];
  const tags = project.tags || [];
  const budget = project.budget || { amount: 0, currency: 'USD' };
  const actualCost = project.actualCost || { amount: 0, currency: 'USD' };

  const getMilestoneStatusColor = (status) => {
    const map = {
      'pending': 'bg-slate-100 text-slate-600 border-slate-200',
      'in-progress': 'bg-indigo-50 text-indigo-600 border-indigo-100',
      'completed': 'bg-emerald-50 text-emerald-600 border-emerald-100',
      'delayed': 'bg-rose-50 text-rose-600 border-rose-100'
    };
    return map[status] || map.pending;
  };

  const budgetUtilization = budget.amount > 0 ? Math.round((actualCost.amount / budget.amount) * 100) : 0;

  const handleAddMilestone = async () => {
    if (!milestoneForm.title.trim()) { showToast('Please enter a milestone title', 'error'); return; }
    setLoading(true);
    try {
      await projectAPI.addMilestone(project._id, milestoneForm);
      showToast('Milestone added successfully', 'success');
      setShowMilestoneModal(false);
      setMilestoneForm({ title: '', description: '', dueDate: '' });
      window.location.reload();
    } catch (error) { showToast('Failed to add milestone', 'error'); }
    finally { setLoading(false); }
  };

  const handleAddTag = async () => {
    if (!tagInput.trim()) return;
    setLoading(true);
    try {
      const updatedTags = [...tags, tagInput.trim()];
      await projectAPI.update(project._id, { tags: updatedTags });
      showToast('Tag added successfully', 'success');
      setTagInput('');
      setShowTagModal(false);
      window.location.reload();
    } catch (e) { showToast('Failed to add tag', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Top Section: Budget and Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Financial Section */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-lg font-bold uppercase tracking-wider text-slate-400">Project Budget & Financials</h3>
                <p className="text-sm text-slate-500 mt-1">Real-time resource utilization and capital allocation</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black tracking-tight">{companyCurrency} {budget.amount.toLocaleString()}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Total Allocation</div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resource Utilization</span>
                <span className={`text-xl font-black ${budgetUtilization > 90 ? 'text-rose-400' : 'text-indigo-400'}`}>{budgetUtilization}%</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full transition-all duration-1000 ${budgetUtilization > 100 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min(100, budgetUtilization)}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-800">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Spent to Date</div>
                  <div className="text-xl font-bold text-white">{companyCurrency} {actualCost.amount.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Remaining Balance</div>
                  <div className="text-xl font-bold text-emerald-400">{companyCurrency} {(budget.amount - actualCost.amount).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
        </div>

        {/* Tags Section */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col group">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Project Tags</h3>
              <p className="text-xs text-slate-500 mt-0.5">Categorization labels</p>
            </div>
            {isProjectOwner && (
              <button
                onClick={() => setShowTagModal(true)}
                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 border border-slate-100 transition-all font-bold"
              >
                +
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {tags.length > 0 ? tags.map((tag, i) => (
              <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-wider hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all cursor-default flex items-center gap-1.5">
                <span className="text-slate-300 opacity-50">#</span>{tag}
              </span>
            )) : (
              <div className="w-full py-10 text-center text-xs font-medium text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                No tags defined
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Milestones Section */}
        <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Project Milestones</h3>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold opacity-75">Key delivery targets and completion logs</p>
            </div>
            {isProjectOwner && (
              <button
                onClick={() => setShowMilestoneModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition-all active:scale-95"
              >
                + Add Milestone
              </button>
            )}
          </div>

          <div className="space-y-6 relative pl-4">
            <div className="absolute left-[30px] top-6 bottom-6 w-0.5 bg-slate-100" />
            {milestones.length > 0 ? milestones.map((m, i) => (
              <div key={i} className="flex gap-8 relative group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-md text-sm font-bold ${m.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
                  {m.status === 'completed' ? '✓' : String(i + 1).padStart(2, '0')}
                </div>
                <div className={`flex-1 p-5 rounded-2xl border transition-all ${m.status === 'completed' ? 'bg-emerald-50/20 border-emerald-100' : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-md hover:border-indigo-100'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{m.title}</h4>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${getMilestoneStatusColor(m.status)}`}>
                      {m.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{m.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>📅</span> Due: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'TBD'}
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl opacity-50 italic">
                No milestones identified.
              </div>
            )}
          </div>
        </section>

        {/* Risks and Dependencies Section */}
        <div className="space-y-8">
          {/* Recent Risks Preview */}
          <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm group">
            <h3 className="text-lg font-bold text-slate-900 mb-6 uppercase tracking-tight">Key Risk Vectors</h3>
            <div className="space-y-4">
              {risks.length > 0 ? risks.slice(0, 3).map((r, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-white hover:border-rose-100 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${r.severity === 'critical' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                      ⚠️
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">{r.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold opacity-60">Mitigation: Active</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${r.severity === 'critical' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>
                    {r.severity}
                  </span>
                </div>
              )) : (
                <div className="py-12 bg-emerald-50/20 rounded-2xl border border-dashed border-emerald-100 text-center">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">No active threats detected</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end block">
              <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] hover:translate-x-1 transition-transform">Registry Audit ⮕</button>
            </div>
          </section>

          {/* Recent Dependencies Preview */}
          <section className="bg-slate-900 rounded-3xl p-8 shadow-xl text-white group relative overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-tight relative z-10">Critical Dependencies</h3>
            <div className="space-y-4 relative z-10">
              {dependencies.length > 0 ? dependencies.slice(0, 3).map((d, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center gap-4 hover:bg-white/10 hover:border-indigo-400/30 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl border border-white/5">
                    {d.type === 'external' ? '🌐' : '🏢'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white uppercase tracking-tight truncate">{d.title}</h4>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="px-1.5 py-0.5 bg-indigo-600 rounded-md text-[8px] font-bold uppercase tracking-widest">{d.status}</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-60">Protocol: Linked</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-12 bg-white/5 rounded-2xl border border-dashed border-white/10 text-center">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest italic opacity-40">Operational Flow Optimal</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Tag Injection Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-slate-900 text-white">
              <h3 className="text-lg font-bold uppercase tracking-tight">Add Project Tag</h3>
              <p className="text-xs text-slate-500 mt-1">Identify focus area for this project</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tag Identifier</label>
                <input
                  autoFocus
                  placeholder="e.g. Infrastructure, UI Refactor..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddTag()}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400 transition-all shadow-inner"
                />
              </div>
              <div className="flex gap-4 pt-4 border-t border-slate-50">
                <button onClick={() => setShowTagModal(false)} className="flex-1 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50 rounded-lg">Cancel</button>
                <button
                  onClick={handleAddTag}
                  disabled={loading || !tagInput.trim()}
                  className="flex-[2] py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md hover:bg-indigo-700 transition-all"
                >
                  Save Tag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectOverview;
