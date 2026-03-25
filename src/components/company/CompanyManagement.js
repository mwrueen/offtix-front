import React, { useState } from 'react';
import { useCompany } from '../../context/CompanyContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Layout from '../Layout';
import CompanyForm from './CompanyForm';
import MemberForm from './MemberForm';
import CompanySettings from './CompanySettings';
import { companyApi } from '../../services/companyApi';

const SalaryForm = ({ member, onClose, onUpdate }) => {
  const [salary, setSalary] = useState(member.currentSalary || 0);
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(member._id, salary, reason);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[2500] p-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-24 border border-white/20 overflow-hidden animate-in zoom-in-95 duration-500 font-sans">
        <div className="p-10 space-y-8">
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-950 uppercase italic tracking-tight">Adjust Remuneration</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Subject: {member.user?.name}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">New Salary Rate</label>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                className="w-full px-6 py-4 bg-slate-100 border-2 border-transparent rounded-2xl text-xl font-black text-indigo-600 outline-none focus:bg-white focus:border-indigo-400 transition-all italic shadow-inner"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Protocol Justification</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. PERFORMANCE_INCREMENT"
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all italic uppercase"
              />
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all italic"
              >
                Abort
              </button>
              <button
                type="submit"
                className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg hover:bg-slate-950 transition-all active:scale-95 italic"
              >
                Update Data
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const DesignationForm = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(name, description);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[2500] p-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-24 border border-white/20 overflow-hidden animate-in zoom-in-95 duration-500 font-sans">
        <div className="p-10 space-y-8">
          <h3 className="text-2xl font-black text-slate-950 uppercase italic tracking-tight">Define Hierarchy</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Role Nomenclature</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. SR_OPERATIONS_LEAD"
                required
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-950 outline-none focus:bg-white focus:border-indigo-400 transition-all italic uppercase tracking-tight"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Responsibilities</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                placeholder="Outline core directives..."
                className="w-full px-6 py-4 bg-slate-100 border-2 border-transparent rounded-2xl text-sm font-medium text-slate-600 outline-none focus:bg-white focus:border-indigo-400 transition-all resize-none italic leading-relaxed shadow-inner"
              />
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all italic"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg hover:bg-slate-950 transition-all active:scale-95 italic"
              >
                Append Role
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ChangeDesignationForm = ({ member, designations, onClose, onUpdate }) => {
  const [selectedDesignation, setSelectedDesignation] = useState(member.designation || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(member._id, selectedDesignation);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[2500] p-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-24 border border-white/20 overflow-hidden animate-in zoom-in-95 duration-500 font-sans">
        <div className="p-10 space-y-8">
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-950 uppercase italic tracking-tight">Reassign Rank</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Subject: {member.user?.name}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Target Designation</label>
              <div className="relative group">
                <select
                  value={selectedDesignation}
                  onChange={(e) => setSelectedDesignation(e.target.value)}
                  required
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[13px] font-bold text-slate-950 focus:border-indigo-400 focus:bg-white transition-all outline-none appearance-none cursor-pointer uppercase italic tracking-tight"
                >
                  <option value="">Choose new rank...</option>
                  {designations.map((designation, index) => (
                    <option key={index} value={designation.name} className="bg-white">
                      {designation.name?.toUpperCase()}
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400 opacity-40 group-hover:opacity-100 transition-opacity italic font-black text-xs">▼</div>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all italic active:scale-95"
              >
                Abort
              </button>
              <button
                type="submit"
                className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg hover:bg-slate-950 transition-all active:scale-95 italic"
              >
                Confirm Reassignment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const CompanyManagement = () => {
  const { company, loading, fetchMyCompany } = useCompany();
  const { state } = useAuth();
  const toast = useToast();
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [activeTab, setActiveTab] = useState('employees');
  const [showSalaryForm, setShowSalaryForm] = useState(null);
  const [showDesignationForm, setShowDesignationForm] = useState(false);
  const [showPermissionForm, setShowPermissionForm] = useState(null);
  const [showChangeDesignationForm, setShowChangeDesignationForm] = useState(null);

  // Get user permissions
  const userPermission = company?.permissions?.find(p => p.user?._id === state.user?._id);
  const isOwner = company?.owner?._id === state.user?._id;
  const isSuperAdmin = state.user?.role === 'superadmin';

  const canManageEmployees = isSuperAdmin || isOwner || userPermission?.canManageEmployees;
  const canManageDesignations = isSuperAdmin || isOwner || userPermission?.canManageDesignations;
  const canManageSalaries = isSuperAdmin || isOwner || userPermission?.canManageSalaries;

  if (loading) return <Layout><div className="text-center py-12">Loading company...</div></Layout>;

  if (!company) {
    return (
      <Layout>
        <div className="text-center py-15 px-10 bg-white rounded-xl shadow-sm">
          <div className="text-5xl mb-5">🏢</div>
          <h3 className="m-0 mb-2.5 text-slate-800">No company yet</h3>
          <p className="m-0 mb-5 text-slate-500">Create your company to manage teams and projects!</p>
          <button
            onClick={() => setShowCompanyForm(true)}
            className="py-3 px-6 bg-blue-500 text-white border-0 rounded-lg cursor-pointer font-semibold hover:bg-blue-600 transition-colors"
          >
            Create Company
          </button>
        </div>
        {showCompanyForm && <CompanyForm onClose={() => setShowCompanyForm(false)} />}
      </Layout>
    );
  }

  const handleSalaryUpdate = async (memberId, newSalary, reason) => {
    try {
      await companyApi.updateMemberSalary(company._id, { memberId, newSalary, reason });
      await fetchMyCompany();
      toast.success('Salary updated successfully!');
      setShowSalaryForm(null);
    } catch (error) {
      toast.error('Error updating salary: ' + (error.response?.data?.message || 'Please try again'));
    }
  };

  const handleAddDesignation = async (name, description) => {
    try {
      await companyApi.addDesignation(company._id, { name, description });
      await fetchMyCompany();
      toast.success('Designation added successfully!');
      setShowDesignationForm(false);
    } catch (error) {
      toast.error('Error adding designation: ' + (error.response?.data?.message || 'Please try again'));
    }
  };

  const handleChangeDesignation = async (memberId, newDesignation) => {
    try {
      await companyApi.updateMemberDesignation(company._id, { memberId, designation: newDesignation });
      await fetchMyCompany();
      toast.success('Designation updated successfully!');
      setShowChangeDesignationForm(null);
    } catch (error) {
      toast.error('Error updating designation: ' + (error.response?.data?.message || 'Please try again'));
    }
  };

  const tabs = [
    { id: 'employees', label: 'Employees', icon: '👥' },
    { id: 'designations', label: 'Designations', icon: '🏆' },
    { id: 'permissions', label: 'Permissions', icon: '🔐' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const renderEmployees = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-50">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-950 uppercase italic tracking-tight">Personnel Registry</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Inventory of all active organizational operatives</p>
        </div>
        {canManageEmployees && (
          <button
            onClick={() => setShowMemberForm(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-950 hover:scale-[1.02] active:scale-95 transition-all italic flex items-center gap-3 w-fit"
          >
            <span className="text-lg leading-none">+</span> Initialize Operative
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {company.members?.map((member) => (
          <div key={member._id} className="group/node p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-white hover:border-indigo-100 hover:shadow-xl transition-all duration-500 overflow-hidden relative">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-950 text-white border-4 border-white shadow-md flex items-center justify-center font-black text-xl italic group-hover/node:bg-indigo-600 transition-all duration-700 shrink-0">
                  {member.user?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <h4 className="text-lg font-black text-slate-950 uppercase italic tracking-tight truncate mb-1">
                    {member.user?.name || 'Unknown Subject'}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-bold text-indigo-500 uppercase tracking-widest italic shadow-sm">
                      {member.designation?.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                      Remuneration: <span className="text-slate-950">${member.currentSalary?.toLocaleString() || '0'}/MO</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 lg:opacity-0 group-hover/node:opacity-100 translate-y-2 group-hover/node:translate-y-0 transition-all duration-500">
                {canManageEmployees && (
                  <button onClick={() => setShowChangeDesignationForm(member)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 rounded-xl font-black text-[9px] uppercase tracking-widest italic transition-all shadow-sm">Protocol Update</button>
                )}
                {canManageSalaries && (
                  <button onClick={() => setShowSalaryForm(member)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 rounded-xl font-black text-[9px] uppercase tracking-widest italic transition-all shadow-sm">Rate Adjust</button>
                )}
                {isOwner && (
                  <button onClick={() => setShowPermissionForm(member)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-200 rounded-xl font-black text-[9px] uppercase tracking-widest italic transition-all shadow-sm">Privileges</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDesignations = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-50">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-950 uppercase italic tracking-tight">Organization Tiers</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Hierarchical structure definitions</p>
        </div>
        {canManageDesignations && (
          <button
            onClick={() => setShowDesignationForm(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-950 hover:scale-[1.02] active:scale-95 transition-all italic flex items-center gap-3 w-fit"
          >
            <span className="text-lg leading-none">+</span> Append Tier
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {company.designations?.map((designation, index) => (
          <div key={index} className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] group hover:bg-white hover:border-indigo-100 hover:shadow-xl transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 text-5xl opacity-[0.03] group-hover:scale-110 transition-transform duration-700 italic font-black">RANK</div>
            <h4 className="text-lg font-black text-slate-950 uppercase italic tracking-tight mb-3 group-hover:text-indigo-600 transition-colors">
              {designation.name}
            </h4>
            <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic opacity-70 group-hover:opacity-100 transition-opacity">
              {designation.description || 'Null security clearance description provided.'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPermissions = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1 pb-6 border-b border-slate-50">
        <h3 className="text-xl font-black text-slate-950 uppercase italic tracking-tight">Access Control Lists</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Entitlement matrix for organizational operatives</p>
      </div>

      <div className="space-y-4">
        {company.permissions?.map((permission) => (
          <div key={permission._id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-white hover:border-indigo-100 transition-all duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-4">
                <h4 className="text-md font-black text-slate-900 uppercase italic tracking-tight">
                  {permission.user?.name}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { flag: permission.canManageEmployees, label: 'Personnel', color: 'bg-emerald-50 text-emerald-600' },
                    { flag: permission.canManageDesignations, label: 'Hierarchy', color: 'bg-indigo-50 text-indigo-600' },
                    { flag: permission.canManageProjects, label: 'Objectives', color: 'bg-amber-50 text-amber-600' },
                    { flag: permission.canManageClients, label: 'Entities', color: 'bg-rose-50 text-rose-600' },
                    { flag: permission.canManageSalaries, label: 'Fiscal', color: 'bg-blue-50 text-blue-600' }
                  ].map((p, i) => p.flag && (
                    <span key={i} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic border border-current opacity-70 ${p.color}`}>
                      {p.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-700">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-10 border-b-2 border-slate-100 relative overflow-hidden">
          <div className="space-y-4 relative z-10">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest italic">Operations Hub</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-black text-slate-950 uppercase italic tracking-tighter leading-none">{company.name}</h2>
            <p className="text-sm font-medium text-slate-500 italic max-w-2xl leading-relaxed">{company.description || 'Organizational structure and personnel orchestration node.'}</p>
          </div>
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/[0.03] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        </div>

        <div className="flex flex-col xl:flex-row gap-10 items-start">
          {/* Enhanced Tab Navigation */}
          <div className="w-full xl:w-72 shrink-0 space-y-2 bg-white p-4 rounded-[2.5rem] border-2 border-slate-50 shadow-sm sticky top-24">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest italic transition-all duration-300 group
                  ${activeTab === tab.id
                    ? 'bg-slate-950 text-white shadow-xl translate-x-2'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <span className={`text-xl transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'scale-110 rotate-6' : 'opacity-40'}`}>{tab.icon}</span>
                <span className="flex-1 text-left">{tab.label}</span>
                {activeTab === tab.id && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>}
              </button>
            ))}
          </div>

          {/* Dynamic Content Area */}
          <div className="flex-1 min-w-0 w-full">
            {activeTab === 'settings' ? (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <CompanySettings
                  company={company}
                  isOwner={isOwner}
                  onRefresh={fetchMyCompany}
                />
              </div>
            ) : (
              <div className="bg-white rounded-[3rem] border-2 border-slate-50 p-10 lg:p-14 shadow-sm min-h-[600px] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-50"></div>
                <div className="relative z-10">
                  {activeTab === 'employees' && renderEmployees()}
                  {activeTab === 'designations' && renderDesignations()}
                  {activeTab === 'permissions' && renderPermissions()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showMemberForm && <MemberForm onClose={() => setShowMemberForm(false)} />}
      {showSalaryForm && (
        <SalaryForm
          member={showSalaryForm}
          onClose={() => setShowSalaryForm(null)}
          onUpdate={handleSalaryUpdate}
        />
      )}
      {showDesignationForm && (
        <DesignationForm
          onClose={() => setShowDesignationForm(false)}
          onAdd={handleAddDesignation}
        />
      )}
      {showChangeDesignationForm && (
        <ChangeDesignationForm
          member={showChangeDesignationForm}
          designations={company.designations || []}
          onClose={() => setShowChangeDesignationForm(null)}
          onUpdate={handleChangeDesignation}
        />
      )}
    </Layout>
  );
};

export default CompanyManagement;