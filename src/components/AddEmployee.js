import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import { useToast } from '../context/ToastContext';
import { getCookie } from '../utils/cookies';
import Layout from './Layout';
import { getCurrencySymbol } from '../utils/currency';

const AddEmployee = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { selectedCompany } = useCompanyFilter();
  const toast = useToast();

  const [formData, setFormData] = useState({
    email: '',
    designation: '',
    salary: '',
    jobDescription: '',
    facilities: '',
    termsAndPolicies: ''
  });

  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDesignations, setLoadingDesignations] = useState(true);
  const [errors, setErrors] = useState({});
  const [companyCurrency, setCompanyCurrency] = useState('USD');
  const [hasPermission, setHasPermission] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);

  useEffect(() => {
    if (selectedCompany && selectedCompany.id !== 'personal') {
      fetchDesignations();
    }
  }, [selectedCompany]);

  const fetchDesignations = async () => {
    try {
      const token = getCookie('authToken');
      const response = await fetch(`/api/companies/${selectedCompany.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const company = await response.json();
        setDesignations(company.designations || []);
        setCompanyCurrency(company.currency || 'USD');

        const userId = state.user?._id || state.user?.id;
        const ownerId = company.owner?._id || company.owner;
        const isOwner = ownerId?.toString() === userId?.toString();
        const isSuperAdmin = state.user?.role === 'superadmin';

        if (isOwner || isSuperAdmin) {
          setHasPermission(true);
        } else {
          const memberInfo = company.members?.find(m => {
            const memberId = m.user?._id || m.user;
            return memberId?.toString() === userId?.toString();
          });

          if (memberInfo) {
            const designation = company.designations?.find(d => d.name === memberInfo.designation);
            if (designation?.permissions?.addEmployee) {
              setHasPermission(true);
            } else {
              setHasPermission(false);
            }
          } else {
            setHasPermission(false);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching designations:', error);
      toast.showToast('Failed to load organizational roles.', 'error');
    } finally {
      setLoadingDesignations(false);
      setCheckingPermission(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format.';

    if (!formData.designation) newErrors.designation = 'Role selection is required.';
    if (formData.salary && isNaN(formData.salary)) newErrors.salary = 'Must be a numeric value.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const token = getCookie('authToken');
      const response = await fetch(`/api/invitations/company/${selectedCompany.id}/invite`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          designation: formData.designation,
          salary: formData.salary ? parseFloat(formData.salary) : 0,
          jobDescription: formData.jobDescription.trim(),
          facilities: formData.facilities.trim(),
          termsAndPolicies: formData.termsAndPolicies.trim()
        })
      });

      if (response.ok) {
        toast.showToast('Invitation sent successfully.', 'success');
        navigate('/employees');
      } else {
        const errorData = await response.json();
        toast.showToast(errorData.message || 'Request failed.', 'error');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.showToast('Network error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    'w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-shadow focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500';
  const inputOk = `${inputBase} border-slate-300 bg-white`;
  const inputErr = `${inputBase} border-rose-400 bg-white ring-2 ring-rose-100`;
  const textareaOk = `${inputBase} min-h-[100px] resize-y align-top`;

  if (!selectedCompany || selectedCompany.id === 'personal') {
    return (
      <Layout>
        <div className="max-w-lg mx-auto py-16 px-4">
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <h1 className="text-lg font-semibold text-slate-900">Select an organization</h1>
            <p className="mt-2 text-sm text-slate-600">
              Choose a company from the header to invite someone to that team.
            </p>
            <button
              type="button"
              onClick={() => navigate('/overview')}
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              Go to overview
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (checkingPermission || loadingDesignations) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-slate-600">
          <div className="h-9 w-9 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
          <p className="mt-4 text-sm">Loading…</p>
        </div>
      </Layout>
    );
  }

  if (!hasPermission) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto py-16 px-4">
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <h1 className="text-lg font-semibold text-slate-900">You cannot invite members</h1>
            <p className="mt-2 text-sm text-slate-600">
              Your role does not include permission to add employees for this organization.
            </p>
            <button
              type="button"
              onClick={() => navigate('/overview')}
              className="mt-6 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to overview
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-10 pb-20">
        <header className="mb-10 border-b border-slate-200 pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">People</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Invite a team member</h1>
              <p className="mt-2 max-w-xl text-sm text-slate-600">
                Send a structured invitation to join <span className="font-medium text-slate-800">{selectedCompany.name}</span>.
                Include role details so the recipient can review everything in one place.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="self-start text-sm font-medium text-slate-600 hover:text-slate-900 sm:self-auto"
            >
              Cancel
            </button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          <fieldset className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 sm:p-8 space-y-6">
            <legend className="sr-only">Candidate and role</legend>
            <h2 className="text-sm font-semibold text-slate-900">Basics</h2>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="add-emp-email" className="block text-sm font-medium text-slate-700">
                  Work email
                </label>
                <input
                  id="add-emp-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  required
                  className={`mt-1.5 ${errors.email ? inputErr : inputOk}`}
                  autoComplete="email"
                />
                {errors.email && <p className="mt-1.5 text-sm text-rose-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="add-emp-role" className="block text-sm font-medium text-slate-700">
                  Role
                </label>
                <select
                  id="add-emp-role"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  required
                  className={`mt-1.5 ${errors.designation ? inputErr : `${inputOk} cursor-pointer`}`}
                >
                  <option value="">Select a role</option>
                  {designations.map(d => (
                    <option key={d._id} value={d.name}>{d.name}</option>
                  ))}
                </select>
                {errors.designation && <p className="mt-1.5 text-sm text-rose-600">{errors.designation}</p>}
              </div>

              <div>
                <label htmlFor="add-emp-salary" className="block text-sm font-medium text-slate-700">
                  Annual salary <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    {getCurrencySymbol(companyCurrency)}
                  </span>
                  <input
                    id="add-emp-salary"
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    step="any"
                    className={`${errors.salary ? inputErr : inputOk} pl-9`}
                  />
                </div>
                {errors.salary && <p className="mt-1.5 text-sm text-rose-600">{errors.salary}</p>}
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm">
            <legend className="sr-only">Offer details</legend>
            <h2 className="text-sm font-semibold text-slate-900">Offer details</h2>
            <p className="-mt-2 text-xs text-slate-500">Shown on the recipient&apos;s invitation page with company summary and salary.</p>

            <div>
              <label htmlFor="add-emp-job-desc" className="block text-sm font-medium text-slate-700">
                Job description
              </label>
              <textarea
                id="add-emp-job-desc"
                name="jobDescription"
                value={formData.jobDescription}
                onChange={handleChange}
                rows={5}
                placeholder="Responsibilities, reporting line, working hours, location, etc."
                className={`mt-1.5 ${textareaOk}`}
              />
            </div>

            <div>
              <label htmlFor="add-emp-facilities" className="block text-sm font-medium text-slate-700">
                Facilities &amp; benefits
              </label>
              <textarea
                id="add-emp-facilities"
                name="facilities"
                value={formData.facilities}
                onChange={handleChange}
                rows={4}
                placeholder="Health cover, leave, equipment, remote policy, meals, transport…"
                className={`mt-1.5 ${textareaOk}`}
              />
            </div>

            <div>
              <label htmlFor="add-emp-terms" className="block text-sm font-medium text-slate-700">
                Terms &amp; policies
              </label>
              <textarea
                id="add-emp-terms"
                name="termsAndPolicies"
                value={formData.termsAndPolicies}
                onChange={handleChange}
                rows={4}
                placeholder="Probation, confidentiality, code of conduct, notice period, etc."
                className={`mt-1.5 ${textareaOk}`}
              />
            </div>
          </fieldset>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-8">
            <p className="text-xs text-slate-500 max-w-md">
              Invitations expire after 7 days. Recipients with an account get an in-app alert and can open the full offer from notifications.
            </p>
            <button
              type="submit"
              disabled={loading || loadingDesignations}
              className="shrink-0 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send invitation'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddEmployee;
