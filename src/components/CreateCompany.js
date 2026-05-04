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
      toast?.showToast?.('Role name is required.', 'error');
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
    if (!formData.name.trim()) newErrors.name = 'Company name is required.';
    if (!formData.description.trim()) newErrors.description = 'Description is required.';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email address.';
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) newErrors.website = 'Website must start with http/https.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast?.showToast?.('Please fix the errors in the form.', 'error');
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
      toast?.showToast?.('Company created successfully.', 'success');
      navigate('/overview');
    } catch (error) {
      console.error('Error creating company:', error);
      toast?.showToast?.(error.response?.data?.message || 'Failed to create company.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const companySizeOptions = [
    { value: '', label: 'Select Company Size' },
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '501-1000', label: '501-1000 employees' },
    { value: '1000+', label: '1000+ employees' }
  ];

  const industryOptions = [
    { value: '', label: 'Select Industry' },
    { value: 'Technology', label: 'Technology' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Education', label: 'Education' },
    { value: 'Retail', label: 'Retail' },
    { value: 'Manufacturing', label: 'Manufacturing' },
    { value: 'Consulting', label: 'Consulting' },
    { value: 'Real Estate', label: 'Real Estate' },
    { value: 'Other', label: 'Other' }
  ];

  return (
    <Layout wide>
      <div className="w-full py-10 px-4 sm:px-6 lg:px-8 pb-32">
        <PageHeader
          title="Create New Company"
          subtitle="Fill in the details below to set up your company."
          icon="🏢"
          actions={
            <button 
              onClick={() => navigate('/overview')} 
              className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
          }
        />

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* General Information */}
            <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-900">Company Information</h3>
              </div>
              <div className="p-6 space-y-4">
                <Input 
                  label="Company Name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="e.g. Acme Corp" 
                  required 
                  error={errors.name} 
                  variant="standard"
                />
                <Input 
                  label="About the Company" 
                  name="description" 
                  type="textarea" 
                  value={formData.description} 
                  onChange={handleChange} 
                  placeholder="Brief description..." 
                  required 
                  rows={3} 
                  error={errors.description} 
                  variant="standard"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input label="Industry" name="industry" type="select" value={formData.industry} onChange={handleChange} options={industryOptions} variant="standard" />
                  <Input label="Company Size" name="companySize" type="select" value={formData.companySize} onChange={handleChange} options={companySizeOptions} variant="standard" />
                  <Input label="Founded Year" name="foundedYear" type="number" value={formData.foundedYear} onChange={handleChange} placeholder="YYYY" min="1800" max={new Date().getFullYear()} variant="standard" />
                </div>
              </div>
            </section>

            {/* Contact & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-sm font-semibold text-slate-900">Contact Details</h3>
                </div>
                <div className="p-6 space-y-4">
                  <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="contact@company.com" error={errors.email} variant="standard" />
                  <Input label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" variant="standard" />
                  <Input label="Website" name="website" type="url" value={formData.website} onChange={handleChange} placeholder="https://company.com" error={errors.website} variant="standard" />
                </div>
              </section>

              <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-sm font-semibold text-slate-900">Address</h3>
                </div>
                <div className="p-6 space-y-4">
                  <Input label="Street Address" name="address" value={formData.address} onChange={handleChange} placeholder="123 Business St" variant="standard" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="City" name="city" value={formData.city} onChange={handleChange} placeholder="City" variant="standard" />
                    <Input label="State" name="state" value={formData.state} onChange={handleChange} placeholder="State" variant="standard" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Country" name="country" value={formData.country} onChange={handleChange} placeholder="Country" variant="standard" />
                    <Input label="ZIP Code" name="zipCode" value={formData.zipCode} onChange={handleChange} placeholder="ZIP" variant="standard" />
                  </div>
                </div>
              </section>
            </div>

            {/* Admin Section */}
            <section className="bg-slate-900 rounded-lg p-8 text-white shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-1">Administrative Control</h3>
                <p className="text-slate-400 text-sm mb-6">
                  You will be the primary administrator for this company.
                </p>
                <div className="max-w-md">
                  <Input 
                    label="Your Job Title" 
                    name="founderRole" 
                    value={formData.founderRole} 
                    onChange={handleChange} 
                    placeholder="e.g. CEO" 
                    required 
                    variant="standard"
                    labelClassName="text-slate-300"
                    inputClassName="bg-white/5 border-white/10 text-white placeholder:text-white/20" 
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-900">Initial Roles</h3>
              </div>
              <div className="p-6">
                <div className="space-y-2 mb-6">
                  {additionalRoles.length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <p className="text-xs text-slate-400">No additional roles.</p>
                    </div>
                  ) : (
                    additionalRoles.map(role => (
                      <div key={role.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-md border border-slate-100">
                        <p className="text-sm font-medium text-slate-900 truncate">{role.name}</p>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveRole(role.id)}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <Input 
                    label="Role Name" 
                    name="roleName" 
                    value={newRole.name} 
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} 
                    placeholder="e.g. Manager" 
                    variant="standard"
                  />
                  <Input 
                    label="Description" 
                    name="roleDescription" 
                    type="textarea" 
                    value={newRole.description} 
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} 
                    placeholder="Responsibilities..." 
                    rows={2} 
                    variant="standard"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddRole} 
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
                  >
                    Add Role
                  </button>
                </div>
              </div>
            </section>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm shadow-sm transition-all active:transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateCompany;
