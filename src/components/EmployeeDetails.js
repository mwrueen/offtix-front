import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeAPI } from '../services/api';
import { useCompany } from '../context/CompanyContext';
import { getCookie } from '../utils/cookies';
import Layout from './Layout';
import PageHeader from './PageHeader';
import DeleteConfirmModal from './common/DeleteConfirmModal';
import { useToast } from '../context/ToastContext';
import { getCurrencySymbol } from '../utils/currency';

const fmtDate = (d, opts = { year: 'numeric', month: 'short', day: 'numeric' }) => d ? new Date(d).toLocaleDateString('en-US', opts).toUpperCase() : '—';

const DetailSection = ({ title, icon, children }) => (
  <div className="mb-16 animate-in fade-in slide-in-from-left-8 duration-700 italic group/sec">
    <div className="flex items-center gap-6 mb-8 pb-4 border-b border-slate-100 relative">
      <span className="text-3xl grayscale group-hover/sec:grayscale-0 group-hover/sec:rotate-12 transition-all duration-500">{icon}</span>
      <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest"> {title} </h3>
    </div>
    <div className="pl-4"> {children} </div>
  </div>
);

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useCompany();
  const toast = useToast();
  const selectedCompany = state.selectedCompany;
  const resumeRef = useRef(null);

  const [employee, setEmployee] = useState(null);
  const [company, setCompany] = useState(null);
  const [designations, setDesignations] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showDesignationModal, setShowDesignationModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const [newSalary, setNewSalary] = useState('');
  const [salaryReason, setSalaryReason] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [selectedManager, setSelectedManager] = useState('');

  const currSym = getCurrencySymbol(company?.currency);

  useEffect(() => {
    if (selectedCompany && selectedCompany.id !== 'personal') fetchEmployeeDetails();
    else navigate('/overview');
  }, [selectedCompany, id]);

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      const res = await employeeAPI.getById(selectedCompany.id, id);
      setEmployee(res.data.employee);
      setCompany(res.data.company);
      setDesignations(res.data.designations || []);
      setNewDesignation(res.data.employee.designation);
      setSelectedManager(res.data.employee.reportsTo || '');

      const token = getCookie('authToken');
      const orgRes = await fetch(`/api/companies/${selectedCompany.id}/organogram`, { headers: { Authorization: `Bearer ${token}` } });
      if (orgRes.ok) {
        const orgData = await orgRes.json();
        setAllEmployees(orgData.employees || []);
      }
    } catch { navigate('/employees'); }
    finally { setLoading(false); }
  };

  const handleUpdateSalary = async () => {
    try {
      await employeeAPI.updateSalary(selectedCompany.id, id, parseFloat(newSalary), salaryReason);
      setShowSalaryModal(false); setNewSalary(''); setSalaryReason(''); fetchEmployeeDetails();
      toast.showToast('Compensation records updated successfully.', 'success');
    } catch { toast.showToast('Failed to update compensation records.', 'error'); }
  };

  const handleUpdateDesignation = async () => {
    try {
      await employeeAPI.updateDesignation(selectedCompany.id, id, newDesignation);
      setShowDesignationModal(false); fetchEmployeeDetails();
      toast.showToast('Professional designation updated.', 'success');
    } catch { toast.showToast('Failed to update designation.', 'error'); }
  };

  const handleUpdateManager = async () => {
    try {
      const token = getCookie('authToken');
      const res = await fetch(`/api/companies/${selectedCompany.id}/reporting-manager`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: employee.memberId, reportsTo: selectedManager || null }),
      });
      if (res.ok) { setShowManagerModal(false); fetchEmployeeDetails(); toast.showToast('Reporting structure updated.', 'success'); }
      else { const d = await res.json(); toast.showToast(d.message || 'Update failed', 'error'); }
    } catch { toast.showToast('Connection error during update.', 'error'); }
  };

  const handleRemoveEmployee = async () => {
    try { await employeeAPI.remove(selectedCompany.id, id); navigate('/employees'); toast.showToast('Personnel record removed.', 'warning'); }
    catch { toast.showToast('Failed to remove personnel record.', 'error'); }
  };

  const handleExportPDF = async () => {
    if (!resumeRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(resumeRef.current, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false });
      const imgData = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`<html><head><title>Professional Profile - ${employee.name}</title><style>@media print { @page { margin: 0; size: A4; } }</style></head><body style="margin:0;padding:0;"><img src="${imgData}" style="width:100%;display:block;page-break-inside:avoid;" /><script>window.onload = function() { window.print(); window.close(); };</script></body></html>`);
      printWindow.document.close();
    } catch (e) { console.error('Export error', e); toast.showToast('Failed to export professional profile.', 'error'); }
    finally { setExporting(false); }
  };

  if (loading) return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-10 py-40 text-center animate-pulse space-y-12 italic">
        <div className="w-16 h-16 border-8 border-slate-50 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-sm" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Retrieving detailed personnel records...</p>
      </div>
    </Layout>
  );

  const profile = employee.profile || {};
  const managerName = allEmployees.find(e => e.id === employee.reportsTo)?.name;
  const joinedYears = employee.joinedAt ? Math.floor((Date.now() - new Date(employee.joinedAt)) / (1000 * 60 * 60 * 24 * 365)) : 0;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-12 px-6 space-y-12 animate-in fade-in duration-1000 font-sans pb-40">
        <PageHeader
          title="Personnel Profile"
          subtitle={`Detailed professional overview and career trajectory for ${employee.name}.`}
          icon="👤"
          stats={[
            { label: 'Tenure', value: `${joinedYears} Years` },
            { label: 'Role', value: employee.designation?.toUpperCase() }
          ]}
          actions={
            <div className="flex gap-4">
              <button onClick={handleExportPDF} disabled={exporting} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-slate-900 transition-all flex items-center gap-2">
                {exporting ? 'Processing...' : 'Export Profile'}
              </button>
              {!employee.isOwner && (
                <button onClick={() => setShowRemoveModal(true)} className="px-6 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-50 transition-all">
                  Remove Personnel
                </button>
              )}
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div ref={resumeRef} className="lg:col-span-8 bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col italic">
            {/* Header Section */}
            <div className={`p-12 lg:p-20 relative overflow-hidden flex items-end gap-12 border-b border-slate-100 ${profile.coverPhoto ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
              {profile.coverPhoto && <img src={profile.coverPhoto} className="absolute inset-0 w-full h-full object-cover opacity-20" alt="" />}
              <div className="relative z-10 w-32 h-32 lg:w-48 lg:h-48 rounded-[3rem] border-8 border-white shadow-xl overflow-hidden bg-slate-200 shrink-0">
                {profile.profilePicture ? <img src={profile.profilePicture} className="w-full h-full object-cover" alt="" /> : <span className="text-8xl flex items-center justify-center h-full font-bold opacity-10">{employee.name.charAt(0)}</span>}
              </div>
              <div className="relative z-10 flex-1 pb-4">
                <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none mb-4">{employee.name}</h1>
                <p className="text-lg font-bold text-indigo-500 uppercase tracking-widest">{employee.designation}</p>
                <div className="flex flex-wrap gap-6 mt-8 opacity-70">
                  <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">✉️ {employee.email}</span>
                  {profile.phone && <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">📞 {profile.phone}</span>}
                  {profile.location && <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">📍 {profile.location}</span>}
                </div>
              </div>
            </div>

            <div className="p-12 lg:p-20 space-y-16">
              {profile.summary && (
                <DetailSection title="Executive Summary" icon="📑">
                  <p className="text-xl font-medium text-slate-500 leading-relaxed uppercase tracking-tight">"{profile.summary}"</p>
                </DetailSection>
              )}

              {profile.experience?.length > 0 && (
                <DetailSection title="Career Trajectory" icon="⚔️">
                  <div className="space-y-12">
                    {profile.experience.map((exp, i) => (
                      <div key={i} className="relative pl-10 border-l-2 border-slate-100">
                        <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-indigo-500 shadow-lg" />
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <h4 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">{exp.title}</h4>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-1.5 rounded-lg">{fmtDate(exp.startDate, { year: 'numeric' })} — {exp.current ? 'PRESENT' : fmtDate(exp.endDate, { year: 'numeric' })}</span>
                          </div>
                          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{exp.company}</p>
                          <p className="text-sm font-medium text-slate-400 uppercase tracking-tight leading-relaxed">{exp.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </DetailSection>
              )}

              <DetailSection title="Internal Placement Metrics" icon="📊">
                <div className="grid grid-cols-2 gap-8 bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100">
                  {[{ label: 'Member ID', val: employee.memberId }, { label: 'Department / Unit', val: profile.department || 'General' }, { label: 'Reporting Lead', val: managerName || 'Unassigned' }, { label: 'Compensation Rate', val: `${currSym}${employee.currentSalary?.toLocaleString()}`, color: 'emerald-600' }].map((item, i) => (
                    <div key={i} className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{item.label}</span>
                      <span className={`text-lg font-bold uppercase tracking-tight ${item.color ? `text-${item.color}` : 'text-slate-900'}`}>{item.val || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </DetailSection>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-8 italic">
            {/* Admin Actions */}
            {!employee.isOwner && (
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-4">Administrative Controls</h4>
                <div className="grid grid-cols-1 gap-4">
                  <button onClick={() => setShowDesignationModal(true)} className="w-full py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:border-indigo-400 hover:bg-white transition-all italic">Update Designation</button>
                  <button onClick={() => setShowSalaryModal(true)} className="w-full py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:border-indigo-400 hover:bg-white transition-all italic">Adjust Compensation</button>
                  <button onClick={() => setShowManagerModal(true)} className="w-full py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:border-indigo-400 hover:bg-white transition-all italic">Change Reporting Lead</button>
                </div>
              </div>
            )}

            {profile.skills?.length > 0 && (
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-4">Professional Skills</h4>
                <div className="flex flex-wrap gap-3">
                  {profile.skills.map((skill, i) => (
                    <span key={i} className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-bold uppercase tracking-widest italic">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {employee.salaryHistory?.length > 0 && !employee.isOwner && (
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-4">Compensation History</h4>
                <div className="space-y-6">
                  {employee.salaryHistory.slice().reverse().slice(0, 3).map((h, i) => (
                    <div key={i} className="flex justify-between items-center text-sm font-bold">
                      <div>
                        <p className="text-slate-900">{currSym}{h.amount?.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{h.reason || 'Annual Adjustment'}</p>
                      </div>
                      <span className="text-[9px] text-indigo-400 uppercase tracking-widest italic">{fmtDate(h.effectiveDate)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showSalaryModal && (
          <Modal title="Adjust Compensation" onClose={() => setShowSalaryModal(false)}>
            <div className="space-y-10 py-4 italic">
              <div className="space-y-4">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Compensation Rate ({company?.currency})</label>
                <input type="number" value={newSalary} onChange={e => setNewSalary(e.target.value)} className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-bold text-6xl italic outline-none focus:bg-white focus:border-indigo-400 transition-all text-center tracking-tighter" placeholder="00.00" />
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Adjustment Rationale</label>
                <input type="text" value={salaryReason} onChange={e => setSalaryReason(e.target.value)} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm uppercase italic tracking-widest outline-none focus:bg-white focus:border-indigo-400 transition-all" placeholder="i.e. Performance Review 2026" />
              </div>
              <div className="flex justify-end gap-6 pt-10">
                <button onClick={() => setShowSalaryModal(false)} className="px-8 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-all">Cancel</button>
                <button onClick={handleUpdateSalary} className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all">Commit Adjustment</button>
              </div>
            </div>
          </Modal>
        )}

        {showDesignationModal && (
          <Modal title="Update Professional Rank" onClose={() => setShowDesignationModal(false)}>
            <div className="space-y-10 py-4 italic">
              <div className="space-y-4">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Target Designation</label>
                <select value={newDesignation} onChange={e => setNewDesignation(e.target.value)} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm uppercase tracking-widest outline-none focus:bg-white focus:border-indigo-400 transition-all appearance-none cursor-pointer">
                  {designations.map(d => <option key={d._id} value={d.name}>{d.name.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-6 pt-10">
                <button onClick={() => setShowDesignationModal(false)} className="px-8 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-all">Cancel</button>
                <button onClick={handleUpdateDesignation} className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all">Update Rank</button>
              </div>
            </div>
          </Modal>
        )}

        {showManagerModal && (
          <Modal title="Reporting Structure" onClose={() => setShowManagerModal(false)}>
            <div className="space-y-10 py-4 italic">
              <div className="space-y-4">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assigned Reporting Lead</label>
                <select value={selectedManager} onChange={e => setSelectedManager(e.target.value)} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm uppercase tracking-widest outline-none focus:bg-white focus:border-indigo-400 transition-all appearance-none cursor-pointer">
                  <option value="">No Reporting Lead (Top Level)</option>
                  {allEmployees.filter(emp => emp.id !== id).map(emp => (<option key={emp.id} value={emp.id}>{emp.name.toUpperCase()} — {emp.designation.toUpperCase()}</option>))}
                </select>
              </div>
              <div className="flex justify-end gap-6 pt-10">
                <button onClick={() => setShowManagerModal(false)} className="px-8 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-all">Cancel</button>
                <button onClick={handleUpdateManager} className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all">Confirm Update</button>
              </div>
            </div>
          </Modal>
        )}

        <DeleteConfirmModal isOpen={showRemoveModal} onClose={() => setShowRemoveModal(false)} onConfirm={handleRemoveEmployee} title="Remove Personnel Record" message={`Are you sure you want to permanently remove ${employee?.name} from the organization? This action is irreversible and will delete all associated employment history.`} itemName={employee?.name} />
      </div>
    </Layout>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
    <div className="bg-white rounded-[3rem] w-full max-w-2xl p-12 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-500 relative">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-950 italic"> {title} </h3>
        <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-xl text-2xl text-slate-400 hover:text-rose-600 transition-all">×</button>
      </div>
      {children}
    </div>
  </div>
);

export default EmployeeDetails;
