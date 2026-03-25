import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import { useToast } from '../context/ToastContext';
import { getCookie } from '../utils/cookies';
import Layout from './Layout';
import PageHeader from './PageHeader';

const Organogram = () => {
  const { state } = useAuth();
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
    } catch { toast?.showToast?.('RESOURCE_MAP_SYNC_FAILURE', 'error'); }
    finally { setLoading(false); }
  };

  const handleUpdateManager = async () => {
    if (!editingEmployee) return; setSaving(true);
    try {
      const token = getCookie('authToken');
      const response = await fetch(`/api/companies/${selectedCompany.id}/reporting-manager`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId: editingEmployee.memberId, reportsTo: selectedManager || null }) });
      if (response.ok) { toast?.showToast?.('UPLINK_RECALIBRATED_SUCCESSFULLY', 'success'); fetchOrganogram(); setEditingEmployee(null); setSelectedManager(''); }
      else { const data = await response.json(); toast?.showToast?.(data.message || 'INJECTION_PROTOCOL_FAILED', 'error'); }
    } catch { toast?.showToast?.('UPLINK_FAILED_STABILITY_NEGATIVE', 'error'); }
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
      <div className={`${depth > 0 ? 'ml-12 lg:ml-24 relative' : ''} italic animate-in fade-in slide-in-from-left-12 duration-1000`} style={{ animationDelay: `${depth * 100}ms` }}>
        {depth > 0 && <div className="absolute left-[-40px] lg:left-[-80px] top-12 w-10 lg:w-20 h-1 bg-slate-100 rounded-full" />}
        <div className={`group bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm hover:shadow-24 transition-all duration-1000 mb-10 flex items-center gap-10 relative overflow-hidden ${editingEmployee?.id === node.id ? 'ring-8 ring-indigo-50/50 border-indigo-200 scale-105' : ''}`}>
          <div className={`absolute top-0 left-0 w-3 h-full ${cl} group-hover:w-6 transition-all duration-700`} />
          <div className={`w-20 h-20 rounded-[2.5rem] ${cl} text-white flex items-center justify-center text-3xl font-black shadow-24 group-hover:rotate-12 group-hover:scale-110 transition-all duration-1000 shrink-0 overflow-hidden relative`}>
            {node.avatar ? <img src={node.avatar} alt="" className="w-full h-full object-cover" /> : node.name?.charAt(0).toUpperCase()}
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex-1 min-w-0 translate-y-1">
            <div className="flex items-center gap-6 mb-2">
              <h4 className="text-2xl font-black text-slate-950 uppercase tracking-tighter truncate leading-tight group-hover:text-indigo-600 transition-colors">{node.name}</h4>
              {node.isOwner && <span className="px-5 py-2 bg-amber-500 text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-2xl italic shadow-lg shadow-amber-500/20">ROOT_AUTH_ENTITY</span>}
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic truncate underline underline-offset-4 decoration-slate-100 group-hover:text-slate-600 group-hover:decoration-indigo-100 transition-all">{node.designation?.toUpperCase()}</p>
          </div>
          <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-x-10 group-hover:translate-x-0 pr-6">
            <button onClick={() => { setEditingEmployee(node); setSelectedManager(node.reportsTo || ''); }} className="px-10 py-5 bg-slate-950 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-indigo-600 transition-all shadow-24 active:scale-95 italic">RE-UPLINK</button>
          </div>
        </div>
        {hasC && <div className="border-l-4 border-slate-50 ml-10 lg:ml-12 pl-4"> {node.children.map((c) => <EmployeeNode key={c.id} node={c} depth={depth + 1} />)} </div>}
      </div>
    );
  };

  if (!selectedCompany || selectedCompany.id === 'personal') return (
    <Layout>
      <div className="max-w-7xl mx-auto px-10 py-32 text-center flex flex-col items-center gap-12 animate-in fade-in slide-in-from-bottom-24 duration-1000 italic">
        <div className="text-[180px] grayscale opacity-20 pointer-events-none select-none animate-pulse">🏢</div>
        <h2 className="text-6xl font-black text-slate-900 uppercase tracking-tighter italic">ENTITY_SECTOR_VOID</h2>
        <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.6em] italic max-w-lg mx-auto leading-relaxed underline underline-offset-8 decoration-slate-100 decoration-dashed">Select a valid organizational node from the primary terminal to decrypt the structural hierarchy map for current sector access.</p>
        <button onClick={() => toast?.showToast?.('ACTION_REQUISITIONED_ACCESS', 'warning')} className="mt-10 px-16 py-7 bg-indigo-600 text-white rounded-[3rem] font-black text-[12px] uppercase tracking-[0.5em] shadow-24 hover:bg-slate-950 transition-all">INITIALIZE_SECTOR_SYNC</button>
      </div>
    </Layout>
  );

  if (loading) return (
    <Layout>
      <div className="max-w-7xl mx-auto px-10 py-40 text-center animate-pulse space-y-16">
        <div className="w-32 h-32 border-8 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-24 shadow-indigo-100" />
        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.6em] italic underline underline-offset-8 decoration-indigo-200">DECRYPTING_STRUCTURAL_MATRIX_ARRAY...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto px-10 py-16 animate-in fade-in slide-in-from-bottom-24 duration-1200 space-y-20 italic">
        <PageHeader
          title="CLUSTER_STRUCTURAL_ORGANOGRAM"
          subtitle={`Full visual mapping of ${employees.length} inductive nodes within the ${selectedCompany.name.toUpperCase()} sector cluster.`}
          icon={<div className="w-16 h-16 bg-slate-950 text-white rounded-full flex items-center justify-center text-3xl shadow-24 border-4 border-white/10 italic">🕸️</div>}
          stats={[{ label: 'INDUCTED_NODES', value: employees.length }, { label: 'HIERARCHY_LEVELS', value: designations.length }]}
          actions={
            <div className="flex bg-slate-100 p-2 rounded-[2.5rem] gap-2 border border-slate-200 shadow-inner italic">
              <button onClick={() => setViewMode('tree')} className={`px-10 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-700 ${viewMode === 'tree' ? 'bg-white text-indigo-600 shadow-sm scale-105 italic' : 'text-slate-400 hover:text-slate-950'}`}>TREE_MAP</button>
              <button onClick={() => setViewMode('list')} className={`px-10 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-700 ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm scale-105 italic' : 'text-slate-400 hover:text-slate-950'}`}>REGISTRY_LIST</button>
            </div>
          }
        />

        <div className="flex flex-wrap gap-8 p-12 bg-slate-950 rounded-[4rem] text-white shadow-24 relative overflow-hidden group border border-white/5">
          <div className="absolute top-0 right-0 w-[40%] h-full bg-indigo-500/10 rounded-full blur-[140px] animate-pulse" />
          <div className="relative z-10 flex flex-wrap gap-12 items-center">
            <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em] italic mr-4 flex items-center gap-3"> <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-slow-ping" /> PROTOCOL_CLEARANCE_STRATA: </h4>
            {designations.sort((a, b) => a.level - b.level).map((d, i) => (
              <div key={i} className="flex items-center gap-4 group/leg cursor-default border-l-2 border-white/5 pl-6 translate-y-1">
                <div className={`w-4 h-4 rounded-full ${getLevelColor(d.level)} shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover/leg:scale-125 group-hover/leg:shadow-[0_0_20px_white] transition-all duration-700`} />
                <span className="text-[10px] font-black text-slate-500 group-hover/leg:text-white transition-colors uppercase tracking-widest">L_{d.level}: {d.name.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>

        {viewMode === 'tree' ? (
          <div className="p-16 lg:p-32 bg-slate-50/50 rounded-[6rem] border-4 border-dashed border-slate-100 relative overflow-hidden group/tree shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_2px,transparent_2px)] [background-size:60px_60px] opacity-40 group-hover/tree:opacity-60 transition-opacity duration-1000" />
            <div className="relative z-10 max-w-6xl mx-auto">
              {hierarchy.length > 0 ? hierarchy.map((node) => <EmployeeNode key={node.id} node={node} />) : (
                <div className="py-40 text-center opacity-30 grayscale italic group hover:opacity-100 hover:grayscale-0 transition-all duration-[2s]">
                  <div className="text-[120px] mb-12 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-1000">🕸️</div>
                  <h3 className="text-4xl font-black text-slate-300 uppercase tracking-[0.6em]">STRUCTURAL_STRUCT_VOID</h3>
                  <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mt-6 italic max-w-sm mx-auto opacity-50 underline underline-offset-8">Node_Interactions_Negative // Cluster_Mapping_Not_Initialized</p>
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
          </div>
        ) : (
          <div className="bg-white rounded-[5rem] border border-slate-50 shadow-24 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-indigo-500/[0.03] rounded-full blur-[140px] pointer-events-none" />
            <table className="w-full border-collapse relative z-10">
              <thead>
                <tr className="bg-slate-950 text-white">
                  <th className="px-12 py-10 text-left text-[11px] font-black uppercase tracking-[0.4em] opacity-40 italic">ENTITY_NODE_IDENT</th>
                  <th className="px-12 py-10 text-left text-[11px] font-black uppercase tracking-[0.4em] opacity-40 italic">DESIGNATION_STRATA</th>
                  <th className="px-12 py-10 text-left text-[11px] font-black uppercase tracking-[0.4em] opacity-40 italic">SECURITY_LVL_REF</th>
                  <th className="px-12 py-10 text-center text-[11px] font-black uppercase tracking-[0.4em] opacity-40 italic">PROTOCOL_UPDATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employees.map((emp) => (
                  <tr key={emp.id} className="group/row hover:bg-slate-50 transition-all duration-700">
                    <td className="px-12 py-10">
                      <div className="flex items-center gap-8">
                        <div className={`w-16 h-16 rounded-[1.5rem] ${getLevelColor(emp.level)} text-white flex items-center justify-center text-2xl font-black italic shadow-24 group-hover/row:rotate-12 transition-all`}>{emp.name.charAt(0)}</div>
                        <span className="font-black text-slate-950 uppercase tracking-tighter text-2xl italic group-hover/row:text-indigo-600 transition-colors">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-12 py-10"> <span className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] italic group-hover/row:text-slate-950 transition-colors decoration-slate-100 underline underline-offset-8">{emp.designation?.toUpperCase()}</span> </td>
                    <td className="px-12 py-10"> <span className={`px-5 py-2.5 rounded-2xl text-[9px] font-black text-white uppercase tracking-[0.3em] shadow-24 ${getLevelColor(emp.level)} animate-pulse`}>LVL_{emp.level}_AUTH</span> </td>
                    <td className="px-12 py-10 text-center"> <button onClick={() => { setEditingEmployee(emp); setSelectedManager(emp.reportsTo || ''); }} className="px-10 py-5 bg-white border-2 border-slate-100 text-slate-950 rounded-[2.5rem] text-[9px] font-black uppercase tracking-[0.4em] hover:bg-slate-950 hover:text-white transition-all shadow-sm active:scale-95 italic">UPLINK_CONFIG</button> </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editingEmployee && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-3xl flex items-center justify-center z-[1000] p-10 animate-in fade-in duration-500" onClick={() => setEditingEmployee(null)}>
            <div className="bg-white rounded-[5rem] w-full max-w-2xl shadow-24 border border-white/20 overflow-hidden relative animate-in zoom-in-95 slide-in-from-bottom-24 duration-1000 italic" onClick={(e) => e.stopPropagation()}>
              <div className="p-16 bg-slate-950 text-white relative overflow-hidden border-b border-white/10">
                <div className="relative z-10">
                  <h3 className="text-4xl font-black uppercase tracking-tighter italic mb-2">Recalibrate_Node_Uplink</h3>
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] italic mt-4 underline underline-offset-8 decoration-white/10">Target_Entity: {editingEmployee.name.toUpperCase()} // STRATA: {editingEmployee.designation?.toUpperCase()}</p>
                </div>
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
              </div>
              <div className="p-16 space-y-16">
                <div className="space-y-6">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em] italic ml-6">AUTHORIZED_COMMAND_MANAGER_REF</label>
                  <select value={selectedManager} onChange={(e) => setSelectedManager(e.target.value)} className="w-full px-12 py-8 bg-slate-50 border-4 border-slate-50 rounded-[3rem] text-[12px] font-black text-slate-950 focus:bg-white focus:border-indigo-400 focus:shadow-24 transition-all uppercase outline-none shadow-inner italic tracking-widest">
                    <option value="">SOVEREIGN_ENTITY (NO MANAGER)</option>
                    {employees.filter(e => e.id !== editingEmployee.id && e.id !== editingEmployee.memberId).map(emp => <option key={emp.id} value={emp.id}>{emp.name.toUpperCase()}</option>)}
                  </select>
                  <p className="text-[10px] font-black text-amber-500 uppercase italic px-10 leading-relaxed border-l-4 border-amber-200 py-2">WARNING: Re-uplinking this node will propagate structural changes across all subordinate leaves in the organizational registry.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-8 pt-12 border-t border-slate-100">
                  <button onClick={() => setEditingEmployee(null)} className="flex-1 py-8 text-[11px] font-black uppercase tracking-[0.6em] text-slate-300 hover:text-slate-950 transition-all italic underline underline-offset-8">ABORT_RECONFIG</button>
                  <button onClick={handleUpdateManager} disabled={saving} className="flex-[2] py-8 bg-indigo-600 text-white rounded-[3.5rem] font-black text-[12px] uppercase tracking-[0.5em] shadow-24 hover:bg-slate-950 hover:scale-105 active:scale-95 transition-all group overflow-hidden relative italic">
                    <span className="relative z-10">{saving ? 'INJECTING_TELEMETRY...' : 'COMMIT_RECALIBRATED_UPLINK'}</span>
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
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
