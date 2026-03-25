import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { useToast } from '../context/ToastContext';
import Layout from './Layout';
import PageHeader from './PageHeader';
import Input from './common/Input';

const CreateCompany = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { createCompany } = useCompany();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    phone: '',
    email: '',
    foundedYear: '',
    companySize: '',
    founderRole: 'Founder/Owner'
  });

  const [additionalRoles, setAdditionalRoles] = useState([]);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleAddRole = () => {
    if (!newRole.name.trim()) {
      toast?.showToast?.('Role name is required for identification.', 'error');
      return;
    }
    setAdditionalRoles(prev => [...prev, { ...newRole, id: Date.now() }]);
    setNewRole({ name: '', description: '' });
  };

  const handleRemoveRole = (roleId) => {
    setAdditionalRoles(prev => prev.filter(role => role.id !== roleId));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Organization name is required.';
    if (!formData.description.trim()) newErrors.description = 'Mission description is required.';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email address.';
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) newErrors.website = 'Website must start with http/https.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast?.showToast?.('Please correct the highlighted errors.', 'error');
      return;
    }
    setLoading(true);
    try {
      const companyData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        additionalRoles: additionalRoles.map(role => ({ name: role.name, description: role.description }))
      };
      await createCompany(companyData);
      toast?.showToast?.('Organization registered successfully.', 'success');
      navigate('/overview');
    } catch (error) {
      console.error('Error creating company:', error);
      toast?.showToast?.(error.response?.data?.message || 'Failed to initialize organization.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const companySizeOptions = [
    { value: '', label: 'Select Employee Count' },
    { value: '1-10', label: '1-10 Employees' },
    { value: '11-50', label: '11-50 Employees' },
    { value: '51-200', label: '51-200 Employees' },
    { value: '201-500', label: '201-500 Employees' },
    { value: '501-1000', label: '501-1000 Employees' },
    { value: '1000+', label: '1000+ Employees' }
  ];

  const industryOptions = [
    { value: '', label: 'Select Industry Sector' },
    { value: 'Technology', label: 'Technology & Software' },
    { value: 'Finance', label: 'Financial Services' },
    { value: 'Healthcare', label: 'Healthcare & Biotech' },
    { value: 'Education', label: 'Education & Training' },
    { value: 'Retail', label: 'Retail & E-commerce' },
    { value: 'Manufacturing', label: 'Manufacturing & Industrial' },
    { value: 'Consulting', label: 'Professional Consulting' },
    { value: 'Real Estate', label: 'Real Estate & Construction' },
    { value: 'Other', label: 'Other/Not Listed' }
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-12 px-6 space-y-12 animate-in fade-in duration-1000 font-sans pb-40">
        <PageHeader
          title="Incorporate New Organization"
          subtitle="Establish organizational parameters and initialize the primary command structure."
          icon="🏢"
          actions={<button onClick={() => navigate('/overview')} className="px-8 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-all underline underline-offset-8 italic">Back to Overview</button>}
        />

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Configuration */}
          <div className="lg:col-span-8 space-y-12 italic">
            <section className="bg-white p-12 lg:p-16 rounded-[4rem] border border-slate-200 shadow-sm space-y-12 relative overflow-hidden group">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-4">Core Specifications & Mission</h3>
              <div className="space-y-10">
                <Input label="Organization Legal Name" name="name" value={formData.name} onChange={handleChange} placeholder="i.e. Global Dynamics Corporation" required error={errors.name} />
                <Input label="Mission Statement & Executive Summary" name="description" type="textarea" value={formData.description} onChange={handleChange} placeholder="Define the primary operational objectives and scope..." required rows={4} error={errors.description} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                  <Input label="Industry Sector" name="industry" type="select" value={formData.industry} onChange={handleChange} options={industryOptions} />
                  <Input label="Organization Scale" name="companySize" type="select" value={formData.companySize} onChange={handleChange} options={companySizeOptions} />
                  <Input label="Founded Cycle" name="foundedYear" type="number" value={formData.foundedYear} onChange={handleChange} placeholder="YYYY" min="1800" max={new Date().getFullYear()} />
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-8">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-4">Communication Channels</h3>
                <div className="space-y-8">
                  <Input label="Primary Business Email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="ops@organization.io" error={errors.email} />
                  <Input label="Direct Contact Line" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+X XXX-XXX-XXXX" />
                  <Input label="Official Web Presence" name="website" type="url" value={formData.website} onChange={handleChange} placeholder="https://organization.io" error={errors.website} />
                </div>
              </section>

              <section className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-8">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-4">Geospatial Logistics</h3>
                <div className="space-y-8">
                  <Input label="Headquarters Address" name="address" value={formData.address} onChange={handleChange} placeholder="Physical street location..." />
                  <div className="grid grid-cols-2 gap-6">
                    <Input label="Metro Core" name="city" value={formData.city} onChange={handleChange} placeholder="City Name" />
                    <Input label="Region / State" name="state" value={formData.state} onChange={handleChange} placeholder="State" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <Input label="Territory" name="country" value={formData.country} onChange={handleChange} placeholder="Country" />
                    <Input label="Postal Index" name="zipCode" value={formData.zipCode} onChange={handleChange} placeholder="ZIP Code" />
                  </div>
                </div>
              </section>
            </div>

            <section className="bg-slate-900 p-12 lg:p-20 rounded-[5rem] text-white space-y-12 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
              <div className="flex items-center gap-10 mb-8 relative z-10 border-b border-white/5 pb-10">
                <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center text-4xl shadow-xl group-hover:rotate-12 transition-all">🛡️</div>
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter italic">Administrative Authority</h3>
                  <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mt-2">Initialize Security & Permission Levels</p>
                </div>
              </div>

              <div className="relative z-10 space-y-10">
                <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5 backdrop-blur-md">
                  <p className="text-sm font-medium text-slate-400 uppercase tracking-widest leading-relaxed">By initializing this organization, you will be granted permanent <span className="text-white font-bold">EXECUTIVE OWNER</span> privileges over all personnel, project logs, and financial assets linked to this sector.</p>
                </div>
                <Input label="Your Professional Title / Designation" name="founderRole" value={formData.founderRole} onChange={handleChange} placeholder="e.g. Executive Director / Managing Partner" required inputClassName="bg-white/5 border-white/10 text-white text-2xl py-8 font-black uppercase italic tracking-tighter focus:bg-white/10" />
              </div>
            </section>
          </div>

          {/* Sidebar / Roles */}
          <div className="lg:col-span-4 space-y-8 italic">
            <section className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-10">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-4 text-center">Operational Role Matrix</h3>

              <div className="space-y-6">
                {additionalRoles.length === 0 ? (
                  <div className="py-20 text-center bg-slate-50/50 rounded-[3.5rem] border-4 border-dashed border-slate-100 grayscale opacity-20">
                    <span className="text-7xl block mb-6">📂</span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Subsidiary Roles Defined</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {additionalRoles.map(role => (
                      <div key={role.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex justify-between items-center group/role">
                        <div className="min-w-0 pr-4">
                          <p className="font-bold text-slate-900 uppercase tracking-tight truncate">{role.name}</p>
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest truncate">{role.description || 'No description'}</p>
                        </div>
                        <button type="button" onClick={() => handleRemoveRole(role.id)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-rose-500 hover:bg-rose-600 hover:text-white transition-all font-bold text-xl flex items-center justify-center shadow-sm">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-8">
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic text-center">Initialize New Role Module</h4>
                <div className="space-y-6">
                  <Input label="Designation Name" name="roleName" value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} placeholder="e.g. Lead Project Coordinator" inputClassName="bg-white py-4" />
                  <Input label="Scope of Authority" name="roleDescription" type="textarea" value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} placeholder="Briefly define responsibilities..." rows={2} inputClassName="bg-white py-4" />
                  <button type="button" onClick={handleAddRole} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-slate-950 transition-all active:scale-95 italic">+ Register Role</button>
                </div>
              </div>
            </section>

            <div className="px-4 space-y-6 pt-10">
              <button type="submit" disabled={loading} className="w-full py-8 bg-slate-950 text-white rounded-[2.5rem] font-bold text-sm uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 hover:-translate-y-2 transition-all active:scale-95 disabled:grayscale italic border-8 border-white">
                {loading ? 'Initializing Core...' : 'Confirm Incorporation 🚀'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateCompany;
