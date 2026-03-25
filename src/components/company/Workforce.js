import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyAPI } from '../../services/api';
import { useCompany } from '../../context/CompanyContext';
import Layout from '../Layout';
import PageHeader from '../PageHeader';

const formatCurrency = (a, cc = 'USD') => {
  if (a === undefined || a === null) return '-';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cc, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(a);
};

const SummaryCard = ({ icon, label, value, color, isCurrency = false, currencyCode = 'USD' }) => (
  <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm hover:shadow-24 transition-all duration-700 group relative overflow-hidden italic">
    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 group-hover:bg-indigo-50 transition-colors rounded-bl-[4rem]" />
    <div className="flex items-center gap-10 relative z-10">
      <div className={`w-20 h-20 rounded-[2.5rem] bg-${color.split('-')[0]}-600/10 border-2 border-${color.split('-')[0]}-600/20 flex items-center justify-center text-5xl shadow-24 group-hover:rotate-12 transition-all duration-700`}>{icon}</div>
      <div>
        <div className="text-4xl font-black text-slate-950 italic tracking-tighter leading-tight">{isCurrency ? formatCurrency(value, currencyCode) : value}</div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1 underline underline-offset-4">{label}</div>
      </div>
    </div>
  </div>
);

const EmployeeCard = ({ item, isExpanded, onToggle, formatDate, getDaysRemaining, navigate, currencyCode }) => {
  const { employee, tasks, costs } = item;
  return (
    <div className={`group bg-white rounded-[4.5rem] border border-slate-100 shadow-sm hover:shadow-24 transition-all duration-1000 overflow-hidden relative italic ${isExpanded ? 'ring-8 ring-indigo-50/50 border-indigo-200 shadow-24' : ''}`}>
      <div onClick={onToggle} className={`p-10 flex items-center justify-between cursor-pointer transition-colors duration-700 ${isExpanded ? 'bg-indigo-50/20' : 'bg-white hover:bg-slate-50'}`}>
        <div className="flex items-center gap-10">
          <div className="w-24 h-24 rounded-[3rem] bg-slate-950 text-white flex items-center justify-center text-4xl font-black shadow-24 group-hover:rotate-12 group-hover:scale-110 transition-all duration-1000 relative overflow-hidden uppercase italic"> {employee.avatar ? <img src={employee.avatar} alt="" className="w-full h-full object-cover" /> : employee.name?.charAt(0)} </div>
          <div>
            <div className="text-2xl font-black text-slate-950 uppercase tracking-tighter leading-tight group-hover:text-indigo-600 transition-colors uppercase italic truncate max-w-[300px]"> {employee.name} </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 underline underline-offset-4 decoration-slate-200"> {employee.designation?.toUpperCase()} </div>
          </div>
        </div>
        <div className="flex items-center gap-16 relative z-10">
          {costs && costs.totalTaskCost > 0 && <div className="text-right">
            <div className="text-2xl font-black text-emerald-600 italic tracking-tighter">{formatCurrency(costs.totalTaskCost, currencyCode)}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ALLOCATED_BUDGET</div>
          </div>}
          <div className="flex gap-4">
            <span className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg animate-pulse"> {tasks.totalActive} ACTIVE_DIR </span>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="4" className={`transition-transform duration-1000 ${isExpanded ? 'rotate-180 text-indigo-600 scale-125' : 'group-hover:translate-y-2 opacity-30 hover:opacity-100'}`}> <polyline points="6 9 12 15 18 9"></polyline> </svg>
        </div>
      </div>
      {isExpanded && <div className="p-12 border-t-4 border-slate-50 border-dashed animate-in slide-in-from-top-12 duration-1000 bg-white shadow-inner">
        {tasks.total === 0 ? <div className="p-20 text-center flex flex-col items-center gap-6"><div className="text-6xl grayscale opacity-10">📭</div><p className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">ZERO_OPERATIONAL_DIRECTIVES</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-10 italic">
          {tasks.active.map(task => (
            <div key={task._id} className="p-10 bg-slate-50 rounded-[3.5rem] border border-slate-100 hover:bg-white hover:border-indigo-100 hover:shadow-24 transition-all duration-700 group/task relative overflow-hidden">
              <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-50 shadow-sm rounded-bl-full" />
              <div className="text-lg font-black text-slate-950 uppercase italic tracking-tighter group-hover:text-indigo-600 transition-colors uppercase leading-tight mb-3"> {task.title} </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3"> <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-[0_0_10px_rgba(99,102,241,1)]" /> {task.project?.title?.toUpperCase() || 'CORE_SYSTEM'} </div>
            </div>
          ))}
        </div>}
      </div>}
    </div>
  );
};

const RunningTasksTable = ({ workforceData, formatDate, getDaysRemaining, navigate, currencyCode }) => {
  const runningTasks = [];
  workforceData?.workforce?.forEach(it => { it.tasks.active?.forEach(t => runningTasks.push({ ...t, employee: it.employee, isO: false })); it.tasks.overdue?.forEach(t => runningTasks.push({ ...t, employee: it.employee, isO: true })); });
  return (
    <div className="bg-white rounded-[5rem] overflow-hidden border border-slate-50 shadow-24 relative group italic">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />
      <table className="w-full border-collapse relative z-10">
        <thead className="bg-slate-950 text-white">
          <tr className="border-b border-white/5 uppercase">
            {['Directive_Ident', 'Assigned_Entity', 'Allocated_Budget', 'Protocol_Status'].map(h => <th key={h} className="px-12 py-10 text-left text-[11px] font-black uppercase tracking-[0.4em] opacity-40 italic">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {runningTasks.map((t, i) => (
            <tr key={i} className="group hover:bg-slate-50 transition-all duration-700">
              <td className="px-12 py-10"> <div className="text-base font-black text-slate-950 uppercase italic tracking-tight group-hover:text-indigo-600 transition-colors uppercase leading-tight">{t.title}</div> <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] mt-2 italic underline underline-offset-4 decoration-slate-100">{t.project?.title?.toUpperCase() || 'CORE_MISSION'}</div> </td>
              <td className="px-12 py-10"> <div className="flex items-center gap-6"> <div className="w-12 h-12 rounded-[1rem] bg-slate-950 text-white flex items-center justify-center text-xl font-black italic shadow-24 group-hover:rotate-12 transition-all">{t.employee?.name?.charAt(0)}</div> <span className="text-sm font-black text-slate-800 uppercase italic tracking-tighter">{t.employee?.name}</span> </div> </td>
              <td className="px-12 py-10"> <div className="text-xl font-black text-emerald-600 italic tracking-tighter">{formatCurrency(t.cost, currencyCode)}</div> <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1 italic">UNIT_COST</div> </td>
              <td className="px-12 py-10"> <span className="px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest italic flex items-center gap-3 w-fit"> <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> ACTIVE_UPLINK </span> </td>
            </tr>
          ))}
          {runningTasks.length === 0 && <tr><td colSpan="4" className="p-40 text-center italic flex flex-col items-center gap-6"><div className="text-9xl grayscale opacity-10">🔍</div><p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.6em]">ZERO_ACTIVE_DIRECTIVES_DETECTED</p></td></tr>}
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
    else { setLoading(false); setError('Select an active organizational sector node.'); }
  }, [companyState.selectedCompany]);

  const fetchWorkforce = async () => {
    try {
      setLoading(true);
      const res = await companyAPI.getWorkforce(companyState.selectedCompany.id);
      setWorkforceData(res.data);
      setError(null);
    } catch { setError('FAILED_TO_HYDRATE_RESOURCE_INDEX'); }
    finally { setLoading(false); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString().toUpperCase() : '-';
  const getDaysRemaining = (d) => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null;

  if (loading) return (
    <Layout>
      <div className="max-w-[1600px] mx-auto px-10 py-40 text-center animate-pulse space-y-12">
        <div className="w-24 h-24 border-8 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-24" />
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em] italic">EXTRACTING_WORKFORCE_TELEMETRY_DATA...</p>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="max-w-[1600px] mx-auto px-10 py-32 text-center flex flex-col items-center gap-10 italic">
        <div className="text-9xl grayscale opacity-30 select-none animate-bounce">🛰️</div>
        <h2 className="text-5xl font-black text-rose-600 uppercase tracking-tighter">TELEMETRY_LINK_LOST</h2>
        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] underline underline-offset-8 decoration-rose-100 decoration-dotted">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="mt-10 px-16 py-7 bg-slate-950 text-white rounded-[3rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-24 hover:bg-indigo-600 transition-all italic">RE-INITIATE_UPLINK</button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto px-10 py-16 animate-in fade-in slide-in-from-bottom-24 duration-1000 space-y-20 italic">
        <PageHeader
          title="WORKFORCE_CAPACITY_MATRIX"
          subtitle={`Monitor kinetic directives and resource distribution for the ${workforceData?.company?.name.toUpperCase()} sector.`}
          icon={<div className="w-16 h-16 bg-slate-950 text-white rounded-full flex items-center justify-center text-3xl shadow-24 border-4 border-white/10 italic">🧠</div>}
          actions={
            <div className="flex bg-slate-100 p-2 rounded-[2.5rem] gap-2 border border-slate-200 shadow-inner italic">
              <button onClick={() => setViewMode('tasks')} className={`px-10 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all duration-700 ${viewMode === 'tasks' ? 'bg-white text-indigo-600 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-950'}`}>DIRECTIVE_STREAM</button>
              <button onClick={() => setViewMode('employees')} className={`px-10 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all duration-700 ${viewMode === 'employees' ? 'bg-white text-indigo-600 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-950'}`}>ENTITY_RESOURCES</button>
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <SummaryCard icon="👥" label="INDUCTED_ENTITIES" value={workforceData?.summary?.totalEmployees || 0} color="indigo" />
          <SummaryCard icon="📋" label="ACTIVE_DIRECTIVES" value={workforceData?.summary?.totalActiveTasks || 0} color="emerald" />
          <SummaryCard icon="⚠️" label="OVERDUE_HALTS" value={workforceData?.summary?.totalOverdueTasks || 0} color="rose" />
          <SummaryCard icon="💰" label="CUMULATIVE_COST" value={workforceData?.costs?.total || 0} color="teal" isCurrency currencyCode={companyCurrency} />
        </div>

        <section className="animate-in slide-in-from-bottom-32 duration-1200 delay-300">
          <div className="flex items-center gap-6 mb-12 ml-6">
            <div className="h-px bg-slate-200 flex-1" />
            <div className="text-[11px] font-black text-slate-300 uppercase tracking-[0.6em] italic opacity-60">RESOURCE_IDENTIFICATION_STREAM</div>
            <div className="h-px bg-slate-200 flex-1" />
          </div>
          {viewMode === 'tasks' ? (
            <RunningTasksTable workforceData={workforceData} formatDate={formatDate} getDaysRemaining={getDaysRemaining} navigate={navigate} currencyCode={companyCurrency} />
          ) : (
            <div className="grid grid-cols-1 gap-10">
              {workforceData?.workforce?.map(item => (
                <EmployeeCard key={item.employee?._id} item={item} isExpanded={expandedEmployee === item.employee?._id} onToggle={() => setExpandedEmployee(expandedEmployee === item.employee?._id ? null : item.employee?._id)} formatDate={formatDate} getDaysRemaining={getDaysRemaining} navigate={navigate} currencyCode={companyCurrency} />
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Workforce;
