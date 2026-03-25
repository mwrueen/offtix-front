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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 font-sans">
      {/* Top Section: Budget and Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Financial Section */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-lg font-bold uppercase tracking-tight text-white italic">Project Financial Health</h3>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold opacity-70">Resource allocation and budget oversight</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold tracking-tight italic">{companyCurrency} {budget.amount.toLocaleString()}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mt-1">Total Project Budget</div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Budget Utilization</span>
                <span className={`text-xl font-bold italic ${budgetUtilization > 90 ? 'text-rose-400' : 'text-indigo-400'}`}>{budgetUtilization}%</span>
              </div>
              <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full transition-all duration-1000 ${budgetUtilization > 100 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min(100, budgetUtilization)}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Expenditure</div>
                  <div className="text-xl font-bold text-white italic">{companyCurrency} {actualCost.amount.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Available Funds</div>
                  <div className="text-xl font-bold text-emerald-400 italic">{companyCurrency} {(budget.amount - actualCost.amount).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
        </div>

        {/* Tags Section */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col group">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 uppercase italic tracking-tight">Project Taxonomy</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest opacity-70">Categorization & Labels</p>
            </div>
            {isProjectOwner && (
              <button
                onClick={() => setShowTagModal(true)}
                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white border border-slate-200 transition-all font-bold text-xl"
              >
                +
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {tags.length > 0 ? tags.map((tag, i) => (
              <span key={i} className="px-5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:border-indigo-400 hover:text-indigo-600 transition-all cursor-default italic">
                {tag}
              </span>
            )) : (
              <div className="w-full py-10 text-center text-[10px] font-bold text-slate-400 border border-dashed border-slate-200 rounded-2xl uppercase tracking-widest italic">
                No labels assigned
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Milestones Section */}
        <section className="bg-white rounded-3xl p-8 lg:p-10 border border-slate-200 shadow-sm space-y-8">
          <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-50">
            <div>
              <h3 className="text-xl font-bold text-slate-900 uppercase italic tracking-tight">Project Milestones</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest opacity-75">Key delivery targets and completion logs</p>
            </div>
            {isProjectOwner && (
              <button
                onClick={() => setShowMilestoneModal(true)}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-slate-950 transition-all active:scale-95 italic"
              >
                + Add Milestone
              </button>
            )}
          </div>

          <div className="space-y-6 relative pl-4">
            <div className="absolute left-[30px] top-6 bottom-6 w-px bg-slate-100" />
            {milestones.length > 0 ? milestones.map((m, i) => (
              <div key={i} className="flex gap-8 relative group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-md text-xs font-bold ${m.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
                  {m.status === 'completed' ? '✓' : String(i + 1).padStart(2, '0')}
                </div>
                <div className={`flex-1 p-6 rounded-[2rem] border transition-all ${m.status === 'completed' ? 'bg-emerald-50/20 border-emerald-100' : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-md hover:border-indigo-100'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase italic tracking-tight">{m.title}</h4>
                    <span className={`px-4 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getMilestoneStatusColor(m.status)}`}>
                      {m.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed italic">{m.description}</p>
                  <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>📅</span> Targeted: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'Pending Date'}
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl opacity-50 italic text-[10px] font-bold uppercase tracking-widest uppercase">
                Zero milestones identified.
              </div>
            )}
          </div>
        </section>

        {/* Risks and Dependencies Section */}
        <div className="space-y-8">
          {/* Recent Risks Preview */}
          <section className="bg-white rounded-3xl p-8 lg:p-10 border border-slate-200 shadow-sm group">
            <h3 className="text-lg font-bold text-slate-900 mb-8 uppercase italic tracking-tight border-b border-slate-50 pb-4">Key Risk Factors</h3>
            <div className="space-y-4">
              {risks.length > 0 ? risks.slice(0, 3).map((r, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-white hover:border-rose-100 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${r.severity === 'critical' ? 'bg-rose-50 text-rose-600 font-bold' : 'bg-amber-50 text-amber-600 font-bold'}`}>
                      !
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-900 uppercase italic leading-tight">{r.title}</h4>
                      <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest font-bold opacity-60">Status: Monitored</p>
                    </div>
                  </div>
                  <span className={`px-4 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${r.severity === 'critical' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>
                    {r.severity}
                  </span>
                </div>
              )) : (
                <div className="py-12 bg-emerald-50/20 rounded-2xl border border-dashed border-emerald-100 text-center">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">No critical risks logged</p>
                </div>
              )}
            </div>
            <div className="mt-8 flex justify-end">
              <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:translate-x-1 transition-transform italic underline underline-offset-8">View Full Registry</button>
            </div>
          </section>

          {/* Recent Dependencies Preview */}
          <section className="bg-slate-900 rounded-3xl p-8 lg:p-10 shadow-xl text-white group relative overflow-hidden italic">
            <h3 className="text-lg font-bold text-white mb-8 uppercase tracking-tight relative z-10 border-b border-white/5 pb-4">Operational Dependencies</h3>
            <div className="space-y-4 relative z-10">
              {dependencies.length > 0 ? dependencies.slice(0, 3).map((d, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4 hover:bg-white/10 hover:border-indigo-400/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl border border-white/5 grayscale">
                    {d.type === 'external' ? '🌐' : '🏢'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white uppercase tracking-tight truncate italic">{d.title}</h4>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="px-5 py-0.5 bg-indigo-600 rounded-lg text-[9px] font-bold uppercase tracking-widest">{d.status}</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-60">Link Status: Connected</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-12 bg-white/5 rounded-2xl border border-dashed border-white/10 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-40">No critical dependencies</p>
                </div>
              )}
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          </section>
        </div>
      </div>

      {/* Tag Injection Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[3000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-500 font-sans">
            <div className="p-8 bg-slate-900 text-white">
              <h3 className="text-lg font-bold uppercase italic tracking-tight">Add Project Tag</h3>
              <p className="text-[10px] text-indigo-400 mt-1 uppercase tracking-widest font-bold opacity-70">Assign professional labels to this mission.</p>
            </div>
            <div className="p-8 space-y-8">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Label Identifier</label>
                <input
                  autoFocus
                  placeholder="e.g. Infrastructure, UI Refactor..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddTag()}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-indigo-400 transition-all shadow-inner uppercase tracking-tight italic"
                />
              </div>
              <div className="flex gap-4 pt-4 border-t border-slate-100 italic">
                <button onClick={() => setShowTagModal(false)} className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-all">Cancel</button>
                <button
                  onClick={handleAddTag}
                  disabled={loading || !tagInput.trim()}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-slate-950 transition-all font-sans"
                >
                  Save Label
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
