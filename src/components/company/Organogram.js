import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanyFilter } from '../../hooks/useCompanyFilter';
import { useToast } from '../../context/ToastContext';
import { getCookie } from '../../utils/cookies';
import Layout from '../layout/Layout';
import PageHeader from '../layout/PageHeader';

const Organogram = () => {
  const navigate = useNavigate();
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

  // Drag state
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragOverNode, setDragOverNode] = useState(null);
  const dragNodeRef = useRef(null);

  useEffect(() => {
    if (selectedCompany && selectedCompany.id !== 'personal') {
      fetchOrganogram();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany]);

  const fetchOrganogram = async () => {
    try {
      setLoading(true);
      const token = getCookie('authToken');
      const response = await fetch(`/api/companies/${selectedCompany.id}/organogram`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHierarchy(data.hierarchy || []);
        setEmployees(data.employees || []);
        setDesignations(data.designations || []);
      }
    } catch {
      toast?.showToast?.('Failed to sync organizational map.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateManager = async (memberId, reportsTo) => {
    setSaving(true);
    try {
      const token = getCookie('authToken');
      const response = await fetch(`/api/companies/${selectedCompany.id}/reporting-manager`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ memberId, reportsTo: reportsTo || null })
      });
      if (response.ok) {
        toast?.showToast?.('Reporting structure updated.', 'success');
        fetchOrganogram();
        setEditingEmployee(null);
        setSelectedManager('');
      } else {
        const data = await response.json();
        toast?.showToast?.(data.message || 'Update failed.', 'error');
      }
    } catch {
      toast?.showToast?.('Connection error.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const handleDragStart = (e, node) => {
    setDraggedNode(node);
    dragNodeRef.current = node;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', node.id);
  };

  const handleDragOver = (e, node) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragNodeRef.current?.id !== node.id) {
      setDragOverNode(node.id);
    }
  };

  const handleDragLeave = () => {
    setDragOverNode(null);
  };

  const handleDrop = (e, targetNode) => {
    e.preventDefault();
    setDragOverNode(null);
    const source = dragNodeRef.current;
    if (!source || source.id === targetNode.id) return;

    // Prevent dropping onto own current manager
    if (source.reportsTo === targetNode.id) {
      toast?.showToast?.('Already reports to this person.', 'error');
      return;
    }

    // Prevent dropping if target reports to source (would create cycle)
    if (targetNode.reportsTo === source.id) {
      toast?.showToast?.('Cannot create circular reporting.', 'error');
      return;
    }

    // Find source memberId
    const emp = employees.find(e => e.id === source.id);
    if (!emp || !emp.memberId) {
      toast?.showToast?.('Cannot update owner reporting.', 'error');
      return;
    }

    handleUpdateManager(emp.memberId, targetNode.id);
    setDraggedNode(null);
    dragNodeRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggedNode(null);
    dragNodeRef.current = null;
    setDragOverNode(null);
  };

  // ── Styles helpers ─────────────────────────────────────────────────────────

  const getLevelStyles = (l) => {
    const configs = {
      0: { border: 'border-indigo-500', bg: 'bg-indigo-600', text: 'text-indigo-600', lightBg: 'bg-indigo-50' },
      1: { border: 'border-blue-500', bg: 'bg-blue-600', text: 'text-blue-600', lightBg: 'bg-blue-50' },
      2: { border: 'border-cyan-500', bg: 'bg-cyan-600', text: 'text-cyan-600', lightBg: 'bg-cyan-50' },
      3: { border: 'border-emerald-500', bg: 'bg-emerald-600', text: 'text-emerald-600', lightBg: 'bg-emerald-50' },
      4: { border: 'border-slate-400', bg: 'bg-slate-500', text: 'text-slate-600', lightBg: 'bg-slate-50' },
      5: { border: 'border-slate-300', bg: 'bg-slate-400', text: 'text-slate-500', lightBg: 'bg-slate-50' }
    };
    return configs[l] || configs[5];
  };

  // ── Employee Node ──────────────────────────────────────────────────────────

  const EmployeeNode = ({ node, depth = 0 }) => {
    const hasChildren = node.children && node.children.length > 0;
    const styles = getLevelStyles(node.level);
    const isDragging = draggedNode?.id === node.id;
    const isDropTarget = dragOverNode === node.id;

    return (
      <div
        className={`relative ${depth > 0 ? 'ml-16 lg:ml-24' : ''} mb-8 animate-in fade-in slide-in-from-left-4 duration-500`}
        style={{ animationDelay: `${depth * 50}ms` }}
      >
        {/* Connection Lines */}
        {depth > 0 && (
          <>
            <div className="absolute -left-10 lg:-left-16 top-10 w-10 lg:w-16 h-0.5 bg-slate-200" />
            <div className="absolute -left-10 lg:-left-16 top-[-32px] bottom-10 w-0.5 bg-slate-200" />
          </>
        )}

        <div
          draggable={!!node.memberId}
          onDragStart={(e) => handleDragStart(e, node)}
          onDragOver={(e) => handleDragOver(e, node)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node)}
          onDragEnd={handleDragEnd}
          className={`
            group relative bg-white rounded-2xl border p-5 pl-7 shadow-sm
            flex items-center gap-5 max-w-2xl transition-all duration-200
            ${isDragging ? 'opacity-40 scale-95 shadow-none' : ''}
            ${isDropTarget ? 'border-indigo-400 shadow-lg ring-2 ring-indigo-400/30 bg-indigo-50/30 scale-[1.02]' : 'border-slate-200 hover:shadow-md'}
            ${editingEmployee?.id === node.id ? 'ring-2 ring-indigo-500 ring-offset-2 border-transparent' : ''}
            ${node.memberId ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
          `}
        >
          {/* Level Color Bar */}
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-r-lg ${styles.bg}`} />

          {/* Drag handle indicator */}
          {node.memberId && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity">
              <svg className="w-3 h-6 text-slate-400" fill="currentColor" viewBox="0 0 6 24">
                <circle cx="1.5" cy="4" r="1.5"/><circle cx="4.5" cy="4" r="1.5"/>
                <circle cx="1.5" cy="10" r="1.5"/><circle cx="4.5" cy="10" r="1.5"/>
                <circle cx="1.5" cy="16" r="1.5"/><circle cx="4.5" cy="16" r="1.5"/>
                <circle cx="1.5" cy="22" r="1.5"/><circle cx="4.5" cy="22" r="1.5"/>
              </svg>
            </div>
          )}

          {/* Drop target hint */}
          {isDropTarget && (
            <div className="absolute inset-0 rounded-2xl flex items-center justify-center pointer-events-none">
              <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 shadow-sm">
                Drop to set as manager
              </span>
            </div>
          )}

          {/* Avatar */}
          <div className={`w-14 h-14 rounded-xl ${styles.lightBg} border border-white shadow-sm flex items-center justify-center shrink-0 overflow-hidden relative group-hover:scale-105 transition-transform duration-300`}>
            {node.avatar ? (
              <img src={node.avatar} alt={node.name} className="w-full h-full object-cover" />
            ) : (
              <span className={`text-xl font-bold ${styles.text}`}>{node.name?.charAt(0).toUpperCase()}</span>
            )}
            {node.isOwner && (
              <div className="absolute top-0 right-0 p-1">
                <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="text-base font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                {node.name}
              </h4>
              {node.isOwner && (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase rounded-md border border-amber-100">
                  Founder
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">
              {node.designation || 'Specialist'}
            </p>
            {node.reportsToName && (
              <p className="text-[10px] text-slate-400 mt-0.5">Reports to: {node.reportsToName}</p>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-2 px-2">
            <button
              onClick={() => { setEditingEmployee(node); setSelectedManager(node.reportsTo || ''); }}
              className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-100"
              title="Edit Hierarchy"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Child Nodes */}
        {hasChildren && (
          <div className="mt-8">
            {node.children.map((child) => (
              <EmployeeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!selectedCompany || selectedCompany.id === 'personal') {
    return (
      <Layout>
        <div className="max-w-xl mx-auto my-32 p-12 bg-white rounded-3xl border border-slate-200 text-center shadow-sm animate-in fade-in duration-500">
          <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center text-5xl mx-auto mb-8 border border-slate-100">🏢</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">No Workspace Selected</h2>
          <p className="text-slate-500 mb-10 text-sm">Please select a company workspace to view the organizational chart and reporting hierarchy.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all active:scale-95"
          >
            Go to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="py-40 text-center space-y-6">
          <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Mapping Infrastructure...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 pb-32">
        <PageHeader
          title="Organizational Structure"
          subtitle={`Managing ${employees.length} personnel across ${designations.length} primary departments.`}
          icon="📐"
          stats={[
            { label: 'Headcount', value: employees.length },
            { label: 'Echelons', value: designations.length }
          ]}
          actions={
            <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200 backdrop-blur-sm">
              <button
                onClick={() => setViewMode('tree')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'tree' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.172-1.172a2 2 0 012.828 0l6.364 6.364a2 2 0 010 2.828l-1.172 1.172L11 7.343z" /></svg>
                Tree View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                Directory
              </button>
            </div>
          }
        />

        {/* Legend */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-8 min-w-max">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-100 pr-8">Authority Levels</span>
            {designations.sort((a, b) => a.level - b.level).map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getLevelStyles(d.level).bg} shadow-sm`} />
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {viewMode === 'tree' ? (
          <div className="p-8 lg:p-16 bg-slate-50/50 rounded-3xl border border-slate-200 shadow-inner min-h-[600px] relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

            {/* Drag & Drop instruction */}
            <div className="absolute top-4 right-6 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur border border-slate-200 rounded-xl shadow-sm text-[11px] font-semibold text-slate-500 pointer-events-none">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Drag a card onto another to set reporting
            </div>

            <div className="relative z-10">
              {hierarchy.length > 0 ? (
                hierarchy.map((node) => <EmployeeNode key={node.id} node={node} />)
              ) : (
                <div className="flex flex-col items-center justify-center py-32 opacity-30 grayscale">
                  <div className="text-8xl mb-6">🏜️</div>
                  <h3 className="text-xl font-bold text-slate-900 uppercase tracking-widest">No Hierarchy Data</h3>
                  <p className="text-sm">Establish reporting lines in the directory</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Personnel</th>
                  <th className="px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Official Designation</th>
                  <th className="px-8 py-5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Hierarchy Level</th>
                  <th className="px-8 py-5 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="group hover:bg-slate-50/80 transition-all">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg ${getLevelStyles(emp.level).lightBg} flex items-center justify-center text-sm font-bold ${getLevelStyles(emp.level).text} border border-slate-100 shadow-sm`}>
                          {emp.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-none">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-500">{emp.designation || 'Specialist'}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getLevelStyles(emp.level).lightBg} ${getLevelStyles(emp.level).text} shadow-sm`}>
                        Level {emp.level}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => { setEditingEmployee(emp); setSelectedManager(emp.reportsTo || ''); }}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm active:scale-95"
                      >
                        Adjust Structure
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Hierarchy Modal */}
        {editingEmployee && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[2000] p-6 animate-in fade-in duration-300" onClick={() => setEditingEmployee(null)}>
            <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden relative animate-in zoom-in-95 duration-400" onClick={(e) => e.stopPropagation()}>
              <div className="p-10 pb-0 flex justify-between items-start">
                <div>
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm border border-indigo-100">⚖️</div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Update Reporting Line</h3>
                  <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                    Assign a direct supervisor for <span className="font-bold text-indigo-600 underline underline-offset-4 decoration-indigo-200">{editingEmployee.name}</span> to maintain organizational integrity.
                  </p>
                </div>
                <button onClick={() => setEditingEmployee(null)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 transition-all font-bold">×</button>
              </div>

              <div className="p-10 space-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assigned Reporting Manager</label>
                  <div className="relative group">
                    <select
                      value={selectedManager}
                      onChange={(e) => setSelectedManager(e.target.value)}
                      className="w-full appearance-none px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none shadow-sm cursor-pointer"
                    >
                      <option value="">Department Head (Top Level)</option>
                      {employees.filter(e => e.id !== editingEmployee.id && e.id !== editingEmployee.memberId).map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} — {emp.designation}</option>
                      ))}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-indigo-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                  <div className="text-2xl pt-1">💡</div>
                  <p className="text-xs text-amber-700 leading-relaxed font-medium">
                    Restructuring the hierarchy will immediately re-index the organizational mapping for all connected personnel.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setEditingEmployee(null)}
                    className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100 rounded-2xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const emp = employees.find(e => e.id === editingEmployee.id);
                      if (emp?.memberId) handleUpdateManager(emp.memberId, selectedManager);
                    }}
                    disabled={saving}
                    className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : 'Confirm Restructure'}
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
