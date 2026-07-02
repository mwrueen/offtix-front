import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyAPI } from '../../services/api';
import { useCompany } from '../../context/CompanyContext';
import Layout from '../layout/Layout';
import PageHeader from '../layout/PageHeader';

const formatCurrency = (a, cc = 'USD') => {
  if (a === undefined || a === null) return '-';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cc, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(a);
};

const SummaryCard = ({ icon, label, value, color, isCurrency = false, currencyCode = 'USD' }) => (
  <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden italic">
    <div className="flex items-center gap-8 relative z-10">
      <div className={`w-16 h-16 rounded-2xl bg-${color}-500/10 text-${color}-600 flex items-center justify-center text-3xl shadow-inner group-hover:rotate-12 transition-all`}>{icon}</div>
      <div>
        <div className="text-3xl font-black text-slate-900 italic tracking-tighter leading-tight">{isCurrency ? formatCurrency(value, currencyCode) : value}</div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</div>
      </div>
    </div>
  </div>
);

const EmployeeCard = ({ item, isExpanded, onToggle, currencyCode }) => {
  const { employee, tasks, costs } = item;
  return (
    <div className={`group bg-white rounded-[3.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-700 overflow-hidden italic ${isExpanded ? 'ring-8 ring-indigo-50 border-indigo-200' : ''}`}>
      <div onClick={onToggle} className={`p-10 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/20' : 'bg-white hover:bg-slate-50'}`}>
        <div className="flex items-center gap-10">
          <div className="w-20 h-20 rounded-[2.5rem] bg-slate-900 text-white flex items-center justify-center text-3xl font-black shadow-lg group-hover:rotate-12 transition-all uppercase italic"> {employee.avatar ? <img src={employee.avatar} alt="" className="w-full h-full object-cover" /> : employee.name?.charAt(0)} </div>
          <div>
            <div className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight group-hover:text-indigo-600 transition-colors">{employee.name}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{employee.designation}</div>
          </div>
        </div>
        <div className="flex items-center gap-12">
          {costs && costs.totalTaskCost > 0 && (
            <div className="text-right hidden sm:block">
              <div className="text-xl font-black text-emerald-600 italic tracking-tighter">{formatCurrency(costs.totalTaskCost, currencyCode)}</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Allocated Budget</div>
            </div>
          )}
          <span className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md"> {tasks.totalActive} Active Tasks </span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className={`text-slate-300 transition-transform duration-500 ${isExpanded ? 'rotate-180 text-indigo-600' : ''}`}> <polyline points="6 9 12 15 18 9"></polyline> </svg>
        </div>
      </div>
      {isExpanded && (
        <div className="p-10 border-t border-slate-100 bg-slate-50/30 animate-in slide-in-from-top-4 duration-500">
          {tasks.active.length === 0 ? (
            <div className="py-12 text-center text-slate-400 italic font-medium uppercase tracking-widest text-[10px]">No active directives currently assigned.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tasks.active.map(task => (
                <div key={task._id} className="p-8 bg-white rounded-[2.5rem] border border-slate-200 hover:border-indigo-300 transition-all flex items-center justify-between group/task">
                  <div>
                    <div className="font-bold text-slate-900 uppercase italic tracking-tight mb-1 group-hover/task:text-indigo-600">{task.title}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{task.project?.title || 'Standalone'}</div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-md group-hover/task:animate-ping" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const RunningTasksTable = ({ workforceData, currencyCode }) => {
  const runningTasks = [];
  workforceData?.workforce?.forEach(it => {
    it.tasks.active?.forEach(t => runningTasks.push({ ...t, employee: it.employee }));
    it.tasks.overdue?.forEach(t => runningTasks.push({ ...t, employee: it.employee, isO: true }));
  });

  return (
    <div className="bg-white rounded-[3.5rem] overflow-hidden border border-slate-200 shadow-sm italic">
      <table className="w-full border-collapse">
        <thead className="bg-slate-950 text-white">
          <tr className="uppercase italic">
            <th className="px-10 py-6 text-left text-[10px] font-bold uppercase tracking-widest opacity-50">Task Directive</th>
            <th className="px-10 py-6 text-left text-[10px] font-bold uppercase tracking-widest opacity-50">Assigned Personnel</th>
            <th className="px-10 py-6 text-left text-[10px] font-bold uppercase tracking-widest opacity-50">Budget</th>
            <th className="px-10 py-6 text-left text-[10px] font-bold uppercase tracking-widest opacity-50">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {runningTasks.map((t, i) => (
            <tr key={i} className="hover:bg-slate-50 transition-colors group">
              <td className="px-10 py-8">
                <div className="text-lg font-bold text-slate-900 uppercase italic tracking-tight group-hover:text-indigo-600">{t.title}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t.project?.title || 'Standalone'}</div>
              </td>
              <td className="px-10 py-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-black italic">{t.employee?.name?.charAt(0)}</div>
                  <span className="text-sm font-bold text-slate-800 uppercase italic">{t.employee?.name}</span>
                </div>
              </td>
              <td className="px-10 py-8">
                <div className="text-lg font-black text-emerald-600 italic tracking-tighter">{formatCurrency(t.cost, currencyCode)}</div>
              </td>
              <td className="px-10 py-8">
                <span className="px-5 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-[9px] font-bold uppercase tracking-widest italic flex items-center gap-3 w-fit">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active Session
                </span>
              </td>
            </tr>
          ))}
          {runningTasks.length === 0 && (
            <tr>
              <td colSpan="4" className="p-32 text-center">
                <div className="text-7xl grayscale opacity-10 mb-6">🔍</div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No active task directives detected.</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const Workforce = () => {
  const navigate = useNavigate();
  const { state: companyState } = useCompany();
  const companyCurrency = companyState?.selectedCompany?.currency || 'USD';
  const [workforceData, setWorkforceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [viewMode, setViewMode] = useState('tasks');

  useEffect(() => {
    if (companyState.selectedCompany?.id && companyState.selectedCompany.id !== 'personal') fetchWorkforce();
    else { setLoading(false); setError('Select an active organization to view workforce data.'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyState.selectedCompany]);

  const fetchWorkforce = async () => {
    try {
      setLoading(true);
      const res = await companyAPI.getWorkforce(companyState.selectedCompany.id);
      setWorkforceData(res.data);
      setError(null);
    } catch { setError('Failed to retrieve organizational workforce index.'); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-10 py-40 text-center animate-pulse space-y-12 italic">
        <div className="w-16 h-16 border-8 border-slate-50 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-sm" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aggregating personnel distribution data...</p>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="max-w-4xl mx-auto my-40 bg-white rounded-3xl p-32 shadow-sm border border-rose-100 text-center space-y-12 animate-in zoom-in-95 duration-700 font-sans italic">
        <div className="text-9xl grayscale opacity-10">🛰️</div>
        <h2 className="text-4xl font-bold text-slate-900 uppercase italic tracking-tight text-rose-600">Sync Error</h2>
        <p className="text-lg font-medium text-slate-500 max-w-xl mx-auto leading-relaxed">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="px-16 py-5 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-slate-950 transition-all active:scale-95">Re-establish Connection</button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-12 px-6 space-y-12 animate-in fade-in duration-1000 font-sans pb-40">
        <PageHeader
          title="Workforce Distribution"
          subtitle={`Monitor personnel capacity, task allocation, and resource distribution for ${workforceData?.company?.name}.`}
          icon="🧠"
          actions={
            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 border border-slate-200">
              <button onClick={() => setViewMode('tasks')} className={`px-8 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'tasks' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Task Streams</button>
              <button onClick={() => setViewMode('employees')} className={`px-8 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'employees' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Personnel Index</button>
            </div>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <SummaryCard icon="👥" label="Inducted Personnel" value={workforceData?.summary?.totalEmployees || 0} color="indigo" />
          <SummaryCard icon="📋" label="Active Assignments" value={workforceData?.summary?.totalActiveTasks || 0} color="emerald" />
          <SummaryCard icon="⚠️" label="Overdue Milestones" value={workforceData?.summary?.totalOverdueTasks || 0} color="rose" />
          <SummaryCard icon="💰" label="CUMULATIVE ALLOCATION" value={workforceData?.costs?.total || 0} color="teal" isCurrency currencyCode={companyCurrency} />
        </div>

        <section className="space-y-10">
          <div className="flex items-center gap-6">
            <div className="h-px bg-slate-200 flex-1" />
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em] italic">Resource Allocation Intelligence</div>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          {viewMode === 'tasks' ? (
            <RunningTasksTable workforceData={workforceData} currencyCode={companyCurrency} />
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {workforceData?.workforce?.map(item => (
                <EmployeeCard key={item.employee?._id} item={item} isExpanded={expandedEmployee === item.employee?._id} onToggle={() => setExpandedEmployee(expandedEmployee === item.employee?._id ? null : item.employee?._id)} currencyCode={companyCurrency} />
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Workforce;
