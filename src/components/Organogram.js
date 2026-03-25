import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import { useToast } from '../context/ToastContext';
import { getCookie } from '../utils/cookies';
import Layout from './Layout';
import PageHeader from './PageHeader';

const Organogram = () => {
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const { selectedCompany } = useCompanyFilter();
  const toast = useToast();
  const [hierarchy, setHierarchy] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedManager, setSelectedManager] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('tree');

  useEffect(() => { if (selectedCompany && selectedCompany.id !== 'personal') fetchOrganogram(); }, [selectedCompany]);

  const fetchOrganogram = async () => {
    try {
      setLoading(true);
      const token = getCookie('authToken');
      const response = await fetch(`/api/companies/${selectedCompany.id}/organogram`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setHierarchy(data.hierarchy || []); setEmployees(data.employees || []); setDesignations(data.designations || []);
      }
    } catch { toast?.showToast?.('Failed to sync organizational map.', 'error'); }
    finally { setLoading(false); }
  };

  const handleUpdateManager = async () => {
    if (!editingEmployee) return; setSaving(true);
    try {
      const token = getCookie('authToken');
      const response = await fetch(`/api/companies/${selectedCompany.id}/reporting-manager`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId: editingEmployee.memberId, reportsTo: selectedManager || null }) });
      if (response.ok) { toast?.showToast?.('Reporting structure updated.', 'success'); fetchOrganogram(); setEditingEmployee(null); setSelectedManager(''); }
      else { const data = await response.json(); toast?.showToast?.(data.message || 'Update failed.', 'error'); }
    } catch { toast?.showToast?.('Connection error.', 'error'); }
    finally { setSaving(false); }
  };

  const getLevelColor = (l) => {
    const cs = { 0: 'bg-rose-600', 1: 'bg-indigo-600', 2: 'bg-blue-600', 3: 'bg-cyan-600', 4: 'bg-emerald-600', 5: 'bg-slate-600' };
    return cs[l] || cs[5];
  };

  const EmployeeNode = ({ node, depth = 0 }) => {
    const hasC = node.children && node.children.length > 0;
    const cl = getLevelColor(node.level);
    return (
      <div className={`${depth > 0 ? 'ml-12 lg:ml-24 relative' : ''} animate-in fade-in slide-in-from-left-4 duration-700`} style={{ animationDelay: `${depth * 50}ms` }}>
        {depth > 0 && <div className="absolute left-[-30px] lg:left-[-60px] top-8 w-8 lg:w-16 h-px bg-slate-200" />}
        <div className={`group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 mb-6 flex items-center gap-6 relative overflow-hidden ${editingEmployee?.id === node.id ? 'border-indigo-400 shadow-lg scale-105 z-10' : ''}`}>
          <div className={`absolute top-0 left-0 w-1.5 h-full ${cl} group-hover:w-2.5 transition-all`} />
          <div className={`w-12 h-12 rounded-2xl ${cl} text-white flex items-center justify-center text-xl font-bold shadow-md shrink-0 overflow-hidden relative`}>
            {node.avatar ? <img src={node.avatar} alt="" className="w-full h-full object-cover" /> : node.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 font-sans">
            <div className="flex items-center gap-3 mb-1">
              <h4 className="text-lg font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors uppercase italic tracking-tight">{node.name}</h4>
              {node.isOwner && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-bold uppercase rounded-full">Owner</span>}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic truncate">{node.designation || 'Staff'}</p>
          </div>
          <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 pr-2">
            <button onClick={() => { setEditingEmployee(node); setSelectedManager(node.reportsTo || ''); }} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md active:scale-95 italic">Manage</button>
          </div>
        </div>
        {hasC && <div className="border-l-2 border-slate-100 ml-6 pl-2"> {node.children.map((c) => <EmployeeNode key={c.id} node={c} depth={depth + 1} />)} </div>}
      </div>
    );
  };

  if (!selectedCompany || selectedCompany.id === 'personal') return (
    <Layout>
      <div className="max-w-3xl mx-auto my-32 p-16 bg-white rounded-3xl border-2 border-dashed border-slate-100 text-center shadow-sm font-sans animate-in fade-in duration-700">
        <div className="text-8xl mb-8 opacity-20">🏢</div>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-4">No Organization Selected</h2>
        <p className="text-sm font-medium text-slate-500 mb-10 max-w-sm mx-auto">Please select a company to view the organizational chart and reporting hierarchy.</p>
        <button onClick={() => navigate('/dashboard')} className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-slate-950 transition-all">Go to Dashboard</button>
      </div>
    </Layout>
  );

  if (loading) return (
    <Layout>
      <div className="p-40 text-center animate-pulse space-y-8">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-sm" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Loading organization tree...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-12 animate-in fade-in duration-700 pb-40">
        <PageHeader
          title="Organizational Chart"
          subtitle={`Full visual mapping of ${employees.length} personnel within the ${selectedCompany.name} directory.`}
          icon="🕸️"
          stats={[
            { label: 'Total Personnel', value: employees.length },
            { label: 'Designations', value: designations.length }
          ]}
          actions={
            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 border border-slate-200 shadow-inner">
              <button onClick={() => setViewMode('tree')} className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'tree' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-950'}`}>Tree View</button>
              <button onClick={() => setViewMode('list')} className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-950'}`}>List View</button>
            </div>
          }
        />

        <div className="flex flex-wrap gap-6 p-8 bg-slate-950 rounded-3xl text-white shadow-xl relative overflow-hidden group border border-white/5">
          <div className="relative z-10 flex flex-wrap gap-8 items-center">
            <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest italic mr-2 flex items-center gap-2">Designation Levels: </h4>
            {designations.sort((a, b) => a.level - b.level).map((d, i) => (
              <div key={i} className="flex items-center gap-2.5 border-l border-white/10 pl-6 h-4 first:border-0 first:pl-0">
                <div className={`w-2.5 h-2.5 rounded-full ${getLevelColor(d.level)} shadow-sm group-hover:scale-110 transition-transform`} />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {viewMode === 'tree' ? (
          <div className="p-8 lg:p-16 bg-white rounded-3xl border border-slate-200 relative overflow-hidden group shadow-sm">
            <div className="relative z-10 max-w-5xl mx-auto">
              {hierarchy.length > 0 ? hierarchy.map((node) => <EmployeeNode key={node.id} node={node} />) : (
                <div className="py-20 text-center opacity-30 grayscale italic">
                  <div className="text-8xl mb-8">🕸️</div>
                  <h3 className="text-2xl font-bold text-slate-400 uppercase tracking-widest">No Mapping Available</h3>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden font-sans">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-8 py-4 text-left text-[10px] font-bold uppercase tracking-widest opacity-60">Employee</th>
                  <th className="px-8 py-4 text-left text-[10px] font-bold uppercase tracking-widest opacity-60">Designation</th>
                  <th className="px-8 py-4 text-left text-[10px] font-bold uppercase tracking-widest opacity-60">Authentication</th>
                  <th className="px-8 py-4 text-right text-[10px] font-bold uppercase tracking-widest opacity-60">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="group hover:bg-slate-50 transition-all font-sans">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-xl ${getLevelColor(emp.level)} text-white flex items-center justify-center text-xl font-bold shadow-md`}>{emp.name.charAt(0)}</div>
                        <span className="font-bold text-slate-900 uppercase italic tracking-tight leading-none text-lg group-hover:text-indigo-600 transition-colors">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6"> <span className="text-xs font-bold text-slate-500 uppercase tracking-widest italic">{emp.designation || 'Staff'}</span> </td>
                    <td className="px-8 py-6"> <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold text-white uppercase tracking-widest  ${getLevelColor(emp.level)}`}>Level {emp.level}</span> </td>
                    <td className="px-8 py-6 text-right"> <button onClick={() => { setEditingEmployee(emp); setSelectedManager(emp.reportsTo || ''); }} className="px-6 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95 italic">Update Reporting</button> </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editingEmployee && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-6 animate-in fade-in duration-300" onClick={() => setEditingEmployee(null)}>
            <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-white/20 overflow-hidden relative animate-in zoom-in-95 duration-500 font-sans" onClick={(e) => e.stopPropagation()}>
              <div className="p-8 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold uppercase tracking-tight italic">Update Reporting Structure</h3>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Adjust direct manager for: {editingEmployee.name}</p>
                </div>
                <button onClick={() => setEditingEmployee(null)} className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center text-3xl hover:bg-rose-600 transition-all font-bold">×</button>
              </div>
              <div className="p-8 space-y-10">
                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Direct Reporting Manager</label>
                  <select value={selectedManager} onChange={(e) => setSelectedManager(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[12px] font-bold text-slate-950 focus:bg-white focus:border-indigo-400 transition-all outline-none shadow-sm italic uppercase tracking-widest">
                    <option value="">Top Level (Head of Department)</option>
                    {employees.filter(e => e.id !== editingEmployee.id && e.id !== editingEmployee.memberId).map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                  <p className="text-[10px] font-bold text-amber-500 uppercase italic px-4 py-2 bg-amber-50 rounded-lg border-l-4 border-amber-300">Note: Changing the manager will update the reporting line in the organizational directory.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100">
                  <button onClick={() => setEditingEmployee(null)} className="flex-1 py-3.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-950 transition-all italic underline underline-offset-8">Cancel</button>
                  <button onClick={handleUpdateManager} disabled={saving} className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                    {saving ? 'Saving...' : 'Confirm Structure Update'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Organogram;
