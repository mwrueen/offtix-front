import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCookie } from '../../utils/cookies';
import Layout from '../layout/Layout';
import { useCompany } from '../../context/CompanyContext';
import { useToast } from '../../context/ToastContext';
import { getAssetUrl } from '../../services/api';

const EditCompanyInfo = () => {
  const navigate = useNavigate();
  const { state: companyState } = useCompany();
  const selectedCompany = companyState.selectedCompany;
  const isCompanyLoading = companyState.loading;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    foundedYear: '',
    companySize: '',
    currency: 'USD'
  });

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
    { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
    { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
    { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' }
  ];

  useEffect(() => {
    if (isCompanyLoading) return;

    if (selectedCompany && selectedCompany.id !== 'personal') {
      fetchCompany();
    } else if (!isCompanyLoading) {
      navigate('/overview');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany, isCompanyLoading]);

  const fetchCompany = async () => {
    setLoading(true);
    try {
      const token = getCookie('authToken');
      const response = await fetch(`/api/companies/${selectedCompany.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.name || '',
          description: data.description || '',
          industry: data.industry || '',
          website: data.website || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || '',
          zipCode: data.zipCode || '',
          foundedYear: data.foundedYear || '',
          companySize: data.companySize || '',
          currency: data.currency || 'USD'
        });
        if (data.logo) {
          setLogoPreview(getAssetUrl(data.logo));
        }
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      showToast('Failed to load company information', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Logo file size must be less than 5MB', 'error');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = getCookie('authToken');

      // Upload logo if changed
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('logo', logoFile);

        const logoResponse = await fetch(`/api/companies/${selectedCompany.id}/logo`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: logoFormData
        });

        if (!logoResponse.ok) {
          throw new Error('Failed to upload logo');
        }
      }

      // Update company profile
      const response = await fetch(`/api/companies/${selectedCompany.id}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showToast('Company information updated successfully', 'success');
        navigate('/overview');
      } else {
        const data = await response.json();
        showToast(data.message || 'Failed to update company information', 'error');
      }
    } catch (error) {
      console.error('Error updating company:', error);
      showToast('Failed to update company information', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center p-24 text-center">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 text-base font-semibold tracking-tight">Accessing company records...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
              Edit Company Profile
            </h1>
            <p className="text-slate-500 font-medium">
              Update your collective identity and brand presence
            </p>
          </div>
          <button
            onClick={() => navigate('/overview')}
            className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-95"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Logo Upload Section */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 group">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="text-xl">🖼️</span> Company Logo
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative group/logo">
                <div className="w-32 h-32 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 group-hover:border-indigo-400 group-hover:bg-indigo-50/30 transition-all duration-300 shadow-inner">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Company logo"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/logo:scale-110"
                    />
                  ) : (
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-slate-300" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-xl shadow-lg border border-slate-100 group-hover/logo:scale-110 transition-transform">
                  <div className="bg-indigo-600 text-white p-2 rounded-lg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M12 5v14M5 12h14"></path>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <label className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl cursor-pointer font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"></path>
                  </svg>
                  Upload New Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
                <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
                  Optimal format: Square PNG/JPG <br />
                  Resolution: 400x400px • Max size: 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="text-xl">📝</span> Core Identity
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">
                  Company Legal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  placeholder="e.g., Acme Corporation"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">
                  Primary Industry
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="e.g., Design & Engineering"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">
                  Collective Bio / Mission
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell us what makes your team unique..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all placeholder:text-slate-400 resize-y min-h-[120px]"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">
                  Founded Year
                </label>
                <input
                  type="number"
                  value={formData.foundedYear}
                  onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value ? parseInt(e.target.value) : '' })}
                  placeholder="e.g., 2024"
                  min="1800"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">
                  Team Scale
                </label>
                <select
                  value={formData.companySize}
                  onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select size range</option>
                  <option value="1-10">1-10 visionaries</option>
                  <option value="11-50">11-50 specialists</option>
                  <option value="51-200">51-200 pioneers</option>
                  <option value="201-500">201-500 experts</option>
                  <option value="501-1000">501-1000 leaders</option>
                  <option value="1000+">1000+ industry force</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">
                  Operating Currency
                </label>
                <div className="relative">
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.code} — {currency.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M6 9l6 6 6-6"></path>
                    </svg>
                  </div>
                </div>
                <p className="mt-2 text-[10px] uppercase font-black tracking-widest text-slate-400 ml-1">
                  Default currency for projects & billing
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="text-xl">📞</span> Communication Hub
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">
                  Public Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@company.sh"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (000) 000-0000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">
                  Web Presence
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold select-none">🔗</span>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://company.sh"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="text-xl">📍</span> Physical HQ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">
                  Headquarters Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Urban Plaza, Creative District"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Metropolis"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">
                  State / Territory
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="CA"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="United States"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">
                  Postal Identity
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="000000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 py-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/overview')}
              className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-95"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-10 py-3 rounded-2xl font-black text-sm text-white transition-all active:scale-95 shadow-xl ${saving
                ? 'bg-slate-300 cursor-wait'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                }`}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Saving Sync...
                </span>
              ) : 'Commit Changes'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditCompanyInfo;

