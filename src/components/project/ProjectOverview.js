import React, { useState } from 'react';
import { projectAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useCompany } from '../../context/CompanyContext';
import { Button, Badge, Modal } from '../ui';

const ProjectOverview = ({ project, users, isProjectOwner }) => {
  const { showToast } = useToast();
  const { state: companyState } = useCompany();
  const companyCurrency = companyState?.selectedCompany?.currency || 'USD';

  const [showTagModal, setShowTagModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [tagInput, setTagInput] = useState('');
  const milestones = project.milestones || [];
  const risks = project.risks || [];
  const dependencies = project.dependencies || [];
  const tags = project.tags || [];
  const budget = project.budget || { amount: 0, currency: 'USD' };
  const actualCost = project.actualCost || { amount: 0, currency: 'USD' };

  const getMilestoneStatusVariant = (status) => {
    const map = {
      'pending': 'default',
      'in-progress': 'primary',
      'completed': 'success',
      'delayed': 'danger'
    };
    return map[status] || 'default';
  };

  const budgetUtilization = budget.amount > 0 ? Math.round((actualCost.amount / budget.amount) * 100) : 0;



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
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 font-sans">
      {/* Financial and Tags Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Financial Section */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Project Financial Health</h3>
              <p className="text-xs text-slate-500 mt-1">Resource allocation and budget oversight</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xl font-bold text-slate-900">{companyCurrency} {budget.amount.toLocaleString()}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1">Total Project Budget</div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Budget Utilization</span>
              <span className={`text-sm font-bold ${budgetUtilization > 90 ? 'text-rose-600' : 'text-indigo-600'}`}>{budgetUtilization}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-1000 ${budgetUtilization > 100 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                style={{ width: `${Math.min(100, budgetUtilization)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-6 pt-5 border-t border-slate-100">
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Expenditure</div>
                <div className="text-base font-bold text-slate-800">{companyCurrency} {actualCost.amount.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Available Funds</div>
                <div className="text-base font-bold text-emerald-600">{companyCurrency} {(budget.amount - actualCost.amount).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tags Section */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Project Taxonomy</h3>
              <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">Categorization & Labels</p>
            </div>
            {isProjectOwner && (
              <Button variant="outline" size="sm" onClick={() => setShowTagModal(true)}>
                +
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.length > 0 ? tags.map((tag, i) => (
              <span key={i} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-wider hover:border-indigo-400 hover:text-indigo-600 transition-all cursor-default">
                {tag}
              </span>
            )) : (
              <div className="w-full py-6 text-center text-[10px] font-semibold text-slate-400 border border-dashed border-slate-200 rounded-xl uppercase tracking-wider">
                No labels assigned
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risks and Dependencies Section */}
        <div className="space-y-6 order-2 md:order-1">
          {/* Recent Risks Preview */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm group">
            <h3 className="text-base font-bold text-slate-900 mb-6 uppercase italic tracking-tight border-b border-slate-50 pb-3">Key Risk Factors</h3>
            <div className="space-y-3">
              {risks.length > 0 ? risks.slice(0, 3).map((r, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-white hover:border-rose-100 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${r.severity === 'critical' ? 'bg-rose-50 text-rose-600 font-bold' : 'bg-amber-50 text-amber-600 font-bold'}`}>
                      !
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-900 uppercase italic leading-tight">{r.title}</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-widest font-bold opacity-60">Status: Monitored</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${r.severity === 'critical' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>
                    {r.severity}
                  </span>
                </div>
              )) : (
                <div className="py-8 bg-emerald-50/20 rounded-xl border border-dashed border-emerald-100 text-center">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">No critical risks logged</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest hover:translate-x-1 transition-transform italic underline underline-offset-8">View Full Registry</button>
            </div>
          </section>

          {/* Recent Dependencies Preview */}
          <section className="bg-slate-900 rounded-2xl p-6 shadow-md text-white group relative overflow-hidden italic">
            <h3 className="text-base font-bold text-white mb-6 uppercase tracking-tight relative z-10 border-b border-white/5 pb-3">Operational Dependencies</h3>
            <div className="space-y-3 relative z-10">
              {dependencies.length > 0 ? dependencies.slice(0, 3).map((d, i) => (
                <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3 hover:bg-white/10 hover:border-indigo-400/30 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-sm border border-white/5 grayscale">
                    {d.type === 'external' ? '🌐' : '🏢'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-tight truncate italic">{d.title}</h4>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="px-3 py-0.5 bg-indigo-600 rounded text-[9px] font-bold uppercase tracking-widest">{d.status}</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-60">Connected</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-8 bg-white/5 rounded-xl border border-dashed border-white/10 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-40">No dependencies</p>
                </div>
              )}
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          </section>
        </div>

        {/* Milestones Section */}
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 order-1 md:order-2">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 pb-4 border-b border-slate-50">
            <div>
              <h3 className="text-base font-bold text-slate-900">Project Milestones</h3>
              <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">Key delivery targets</p>
            </div>
            {isProjectOwner && (
              <Button variant="primary" size="sm" onClick={() => showToast('Milestones can be managed inside the Phases tab.', 'info')}>
                + Add Milestone
              </Button>
            )}
          </div>

          <div className="space-y-4 relative pl-3">
            <div className="absolute left-[19px] top-4 bottom-4 w-px bg-slate-100" />
            {milestones.length > 0 ? milestones.map((m, i) => (
              <div key={i} className="flex gap-4 relative group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm text-[10px] font-bold ${m.status === 'completed' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
                  {m.status === 'completed' ? '✓' : String(i + 1).padStart(2, '0')}
                </div>
                <div className={`flex-1 p-4 rounded-xl border transition-all ${m.status === 'completed' ? 'bg-emerald-50/20 border-emerald-100' : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-md hover:border-indigo-100'}`}>
                  <div className="flex justify-between items-start mb-1.5 gap-2">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">{m.title}</h4>
                    <Badge variant={getMilestoneStatusVariant(m.status)} size="sm">
                      {m.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{m.description}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>📅</span> {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : 'Pending'}
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-xl opacity-50 italic text-[10px] font-bold uppercase tracking-widest uppercase">
                Zero milestones
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Tag Modal */}
      <Modal isOpen={showTagModal} onClose={() => setShowTagModal(false)} title="Add Project Tag" size="sm">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Label</label>
            <input
              autoFocus
              placeholder="e.g. Infrastructure, UI Refactor..."
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAddTag()}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:bg-white focus:border-primary-400 transition-all"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowTagModal(false)} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={handleAddTag} disabled={loading || !tagInput.trim()} className="flex-1">
              Save Label
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectOverview;
