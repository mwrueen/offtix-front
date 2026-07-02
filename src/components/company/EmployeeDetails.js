import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeAPI } from '../../services/api';
import { useCompany } from '../../context/CompanyContext';
import { getCookie } from '../../utils/cookies';
import Layout from '../layout/Layout';
import PageHeader from '../layout/PageHeader';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import { useToast } from '../../context/ToastContext';
import { getCurrencySymbol } from '../../utils/currency';
import { Card, Button, Badge, LoadingSpinner, Modal as UIModal, Input } from '../ui';

const fmtDate = (d, opts = { year: 'numeric', month: 'short', day: 'numeric' }) => 
  d ? new Date(d).toLocaleDateString('en-US', opts) : '—';

const DetailRow = ({ label, value, color = 'text-slate-900' }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
    <span className={`text-sm font-semibold ${color}`}>{value || '—'}</span>
  </div>
);

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state: companyState } = useCompany();
  const toast = useToast();
  const selectedCompany = companyState.selectedCompany;
  const isCompanyLoading = companyState.loading;
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
    if (isCompanyLoading) return;

    if (selectedCompany && selectedCompany.id !== 'personal') {
      fetchEmployeeDetails();
    } else if (!isCompanyLoading) {
      navigate('/overview');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany, isCompanyLoading, id]);

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
      const orgRes = await fetch(`/api/companies/${selectedCompany.id}/organogram`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (orgRes.ok) {
        const orgData = await orgRes.json();
        setAllEmployees(orgData.employees || []);
      }
    } catch { 
        navigate('/employees'); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleUpdateSalary = async () => {
    try {
      await employeeAPI.updateSalary(selectedCompany.id, id, parseFloat(newSalary), salaryReason);
      setShowSalaryModal(false); 
      setNewSalary(''); 
      setSalaryReason(''); 
      fetchEmployeeDetails();
      toast.showToast('Compensation records updated successfully.', 'success');
    } catch { 
      toast.showToast('Failed to update compensation records.', 'error'); 
    }
  };

  const handleUpdateDesignation = async () => {
    try {
      await employeeAPI.updateDesignation(selectedCompany.id, id, newDesignation);
      setShowDesignationModal(false); 
      fetchEmployeeDetails();
      toast.showToast('Professional designation updated.', 'success');
    } catch { 
      toast.showToast('Failed to update designation.', 'error'); 
    }
  };

  const handleUpdateManager = async () => {
    try {
      const token = getCookie('authToken');
      const res = await fetch(`/api/companies/${selectedCompany.id}/reporting-manager`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: employee.memberId, reportsTo: selectedManager || null }),
      });
      if (res.ok) { 
        setShowManagerModal(false); 
        fetchEmployeeDetails(); 
        toast.showToast('Reporting structure updated.', 'success'); 
      } else { 
        const d = await res.json(); 
        toast.showToast(d.message || 'Update failed', 'error'); 
      }
    } catch { 
      toast.showToast('Connection error during update.', 'error'); 
    }
  };

  const handleRemoveEmployee = async () => {
    try { 
      await employeeAPI.remove(selectedCompany.id, id); 
      navigate('/employees'); 
      toast.showToast('Personnel record removed.', 'warning'); 
    } catch { 
      toast.showToast('Failed to remove personnel record.', 'error'); 
    }
  };

  const handleExportPDF = async () => {
    if (!resumeRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(resumeRef.current, { 
        scale: 2, 
        useCORS: true, 
        allowTaint: true, 
        backgroundColor: '#ffffff', 
        logging: false 
      });
      const imgData = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Professional Profile - ${employee.name}</title>
            <style>@media print { @page { margin: 0; size: A4; } }</style>
          </head>
          <body style="margin:0;padding:0;">
            <img src="${imgData}" style="width:100%;display:block;page-break-inside:avoid;" />
            <script>window.onload = function() { window.print(); window.close(); };</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (e) { 
      console.error('Export error', e); 
      toast.showToast('Failed to export professional profile.', 'error'); 
    } finally { 
      setExporting(false); 
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">Retrieving personnel records...</p>
      </div>
    </Layout>
  );

  const profile = employee.profile || {};
  const managerName = allEmployees.find(e => e.id === employee.reportsTo)?.name;
  const joinedYears = employee.joinedAt ? Math.floor((Date.now() - new Date(employee.joinedAt)) / (1000 * 60 * 60 * 24 * 365)) : 0;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-10 px-6 sm:px-8">
        <PageHeader
          title="Employee Profile"
          subtitle={`Managing professional records for ${employee.name}`}
          icon="👤"
          stats={[
            { label: 'Tenure', value: `${joinedYears} ${joinedYears === 1 ? 'Year' : 'Years'}` },
            { label: 'Role', value: employee.designation }
          ]}
          actions={
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleExportPDF} 
                disabled={exporting}
                className="gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {exporting ? 'Processing...' : 'Export'}
              </Button>
              {!employee.isOwner && (
                <Button 
                    variant="danger" 
                    onClick={() => setShowRemoveModal(true)}
                >
                  Remove
                </Button>
              )}
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Essential Identity Card */}
            <Card padding={false} className="overflow-hidden border-none shadow-md">
              <div 
                className={`h-40 bg-gradient-to-br transition-all duration-700 ${profile.coverPhoto ? '' : 'from-indigo-600 via-indigo-700 to-indigo-900'}`}
                style={profile.coverPhoto ? { backgroundImage: `url(${profile.coverPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
              >
                {!profile.coverPhoto && (
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                )}
              </div>
              <div className="px-8 pb-10 relative">
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end">
                  {/* Avatar with negative margin */}
                  <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-white flex items-center justify-center shrink-0 -mt-16 relative z-10 transition-transform hover:scale-105 duration-500">
                    {profile.profilePicture ? (
                      <img src={profile.profilePicture} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-5xl font-bold text-indigo-600">
                        {employee.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Identity Details */}
                  <div className="flex-1 min-w-0 pt-4 sm:pt-0 pb-1">
                    <div className="flex flex-col gap-1">
                      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none group">
                        {employee.name}
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ml-2 animate-pulse" title="Active Personnel" />
                      </h1>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-lg font-bold text-indigo-600 tracking-tight">{employee.designation}</p>
                        <Badge variant="info" size="sm" className="bg-indigo-50 text-indigo-700 border border-indigo-100">Official Profile</Badge>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-3 mt-5 text-sm font-semibold text-slate-500">
                        <a href={`mailto:${employee.email}`} className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
                          <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 italic">@</div>
                          {employee.email}
                        </a>
                        {profile.phone && (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 italic">#</div>
                            {profile.phone}
                          </div>
                        )}
                        {profile.location && (
                          <div className="flex items-center gap-2">
                             <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 italic">📍</div>
                            {profile.location}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div ref={resumeRef} className="space-y-8">
              {profile.summary && (
                <Card>
                    <Card.Header>
                        <Card.Title>Professional Summary</Card.Title>
                    </Card.Header>
                    <Card.Content>
                        <div 
                          className="text-slate-600 leading-relaxed prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: profile.summary }}
                        />
                    </Card.Content>
                </Card>
              )}

              {profile.experience?.length > 0 && (
                <Card>
                    <Card.Header>
                        <Card.Title>Work Experience</Card.Title>
                    </Card.Header>
                    <Card.Content className="space-y-8">
                        {profile.experience.map((exp, i) => (
                            <div key={i} className="relative pl-6 border-l-2 border-slate-100 last:pb-0 pb-8">
                                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-indigo-600 shadow-sm" />
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-900">{exp.title}</h4>
                                        <p className="text-sm font-semibold text-indigo-600 mb-2">{exp.company}</p>
                                    </div>
                                    <Badge variant="default" className="w-fit">
                                        {fmtDate(exp.startDate, { year: 'numeric' })} — {exp.current ? 'Present' : fmtDate(exp.endDate, { year: 'numeric' })}
                                    </Badge>
                                </div>
                                <div 
                                  className="text-sm text-slate-500 mt-3 leading-relaxed prose prose-slate prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{ __html: exp.description }}
                                />
                            </div>
                        ))}
                    </Card.Content>
                </Card>
              )}

              <Card>
                <Card.Header>
                    <Card.Title>Organization Information</Card.Title>
                </Card.Header>
                <Card.Content>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                        <DetailRow label="Employee ID" value={employee.memberId} />
                        <DetailRow label="Department" value={profile.department || 'General'} />
                        <DetailRow label="Reports To" value={managerName || 'None (Top Level)'} />
                        <DetailRow label="Monthly Compensation" value={`${currSym}${employee.currentSalary?.toLocaleString()}`} color="text-indigo-600" />
                        <DetailRow label="Joining Date" value={fmtDate(employee.joinedAt)} />
                        <DetailRow label="Status" value={<Badge variant={employee.isOwner ? 'success' : 'info'}>{employee.isOwner ? 'Founder / Owner' : 'Active Personnel'}</Badge>} />
                    </div>
                </Card.Content>
              </Card>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-8">
            {/* Administration controls */}
            {!employee.isOwner && (
              <Card>
                <Card.Header>
                    <Card.Title className="text-sm font-bold uppercase tracking-wider text-slate-400">Administration</Card.Title>
                </Card.Header>
                <Card.Content className="space-y-3">
                    <Button variant="outline" className="w-full justify-start text-xs font-bold uppercase" onClick={() => setShowDesignationModal(true)}>
                        Update Role / Rank
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-xs font-bold uppercase" onClick={() => setShowSalaryModal(true)}>
                        Adjust Compensation
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-xs font-bold uppercase" onClick={() => setShowManagerModal(true)}>
                        Reassign Reporting Line
                    </Button>
                </Card.Content>
              </Card>
            )}

            {profile.skills?.length > 0 && (
                <Card>
                    <Card.Header>
                        <Card.Title className="text-sm font-bold uppercase tracking-wider text-slate-400">Expertise & Skills</Card.Title>
                    </Card.Header>
                    <Card.Content>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill, i) => (
                                <Badge key={i} variant="primary" size="md">
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                    </Card.Content>
                </Card>
            )}

            {employee.salaryHistory?.length > 0 && !employee.isOwner && (
                <Card>
                    <Card.Header>
                        <Card.Title className="text-sm font-bold uppercase tracking-wider text-slate-400">Compensation History</Card.Title>
                    </Card.Header>
                    <Card.Content className="p-0">
                        <div className="divide-y divide-slate-100">
                            {employee.salaryHistory.slice().reverse().slice(0, 5).map((h, i) => (
                                <div key={i} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-center bg-transparent">
                                        <span className="font-bold text-slate-900">{currSym}{h.amount?.toLocaleString()}</span>
                                        <span className="text-[10px] text-slate-400 font-bold">{fmtDate(h.effectiveDate)}</span>
                                    </div>
                                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mt-1">{h.reason || 'Standard Adjustment'}</p>
                                </div>
                            ))}
                        </div>
                    </Card.Content>
                </Card>
            )}
          </div>
        </div>

        {/* Modals */}
        <UIModal 
            isOpen={showSalaryModal} 
            onClose={() => setShowSalaryModal(false)}
            title="Adjust Compensation"
        >
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Salary ({company?.currency})</label>
                    <Input 
                        type="number" 
                        value={newSalary} 
                        onChange={e => setNewSalary(e.target.value)} 
                        placeholder="e.g. 50000"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adjustment Reason</label>
                    <Input 
                        type="text" 
                        value={salaryReason} 
                        onChange={e => setSalaryReason(e.target.value)} 
                        placeholder="e.g. Annual Review"
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setShowSalaryModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleUpdateSalary}>Apply Adjustment</Button>
                </div>
            </div>
        </UIModal>

        <UIModal 
            isOpen={showDesignationModal} 
            onClose={() => setShowDesignationModal(false)}
            title="Update Professional Rank"
        >
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Designation</label>
                    <select 
                        value={newDesignation} 
                        onChange={e => setNewDesignation(e.target.value)} 
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all bg-white"
                    >
                        {designations.map(d => (
                            <option key={d._id} value={d.name}>{d.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setShowDesignationModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleUpdateDesignation}>Update Rank</Button>
                </div>
            </div>
        </UIModal>

        <UIModal 
            isOpen={showManagerModal} 
            onClose={() => setShowManagerModal(false)}
            title="Update Reporting Line"
        >
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Direct Reporting Lead</label>
                    <select 
                        value={selectedManager} 
                        onChange={e => setSelectedManager(e.target.value)} 
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all bg-white"
                    >
                        <option value="">No Reporting Lead (Top Level)</option>
                        {allEmployees.filter(emp => emp.id !== id).map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name} — {emp.designation}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setShowManagerModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleUpdateManager}>Confirm Update</Button>
                </div>
            </div>
        </UIModal>

        <DeleteConfirmModal 
            isOpen={showRemoveModal} 
            onClose={() => setShowRemoveModal(false)} 
            onConfirm={handleRemoveEmployee} 
            title="Remove Personnel Record" 
            message={`Are you sure you want to permanently remove ${employee?.name} from the organization? This action will archive their employment history and revoke system access.`} 
            itemName={employee?.name} 
        />
      </div>
    </Layout>
  );
};

export default EmployeeDetails;
