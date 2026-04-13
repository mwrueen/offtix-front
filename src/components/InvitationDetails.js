import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Layout from './Layout';
import { getCookie } from '../utils/cookies';
import { useToast } from '../context/ToastContext';
import { BASE_SERVER_URL } from '../services/api';
import { getCurrencySymbol } from '../utils/currency';

const authHeaders = () => ({
  Authorization: `Bearer ${getCookie('authToken')}`,
  'Content-Type': 'application/json'
});

const logoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_SERVER_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const Section = ({ title, children, empty }) => {
  if (empty) return null;
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4">{title}</h2>
      <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{children}</div>
    </section>
  );
};

const InvitationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [inv, setInv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/invitations/invitation/${id}`, { headers: authHeaders() });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.message || 'Could not load invitation.');
        setInv(null);
        return;
      }
      setInv(await res.json());
    } catch {
      setError('Network error.');
      setInv(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const currency = inv?.company?.currency || 'USD';
  const sym = getCurrencySymbol(currency);

  const accept = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/invitations/${id}/accept`, { method: 'POST', headers: authHeaders() });
      if (res.ok) {
        toast?.success?.('You have joined the company.');
        navigate('/overview');
      } else {
        toast?.error?.((await res.json()).message || 'Could not accept.');
      }
    } catch {
      toast?.error?.('Network error.');
    } finally {
      setProcessing(false);
    }
  };

  const reject = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/invitations/${id}/reject`, { method: 'POST', headers: authHeaders() });
      if (res.ok) {
        toast?.success?.('Invitation declined.');
        navigate('/notifications');
      } else {
        toast?.error?.((await res.json()).message || 'Could not decline.');
      }
    } catch {
      toast?.error?.('Network error.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-20 flex flex-col items-center text-slate-600">
          <div className="h-9 w-9 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
          <p className="mt-4 text-sm">Loading invitation…</p>
        </div>
      </Layout>
    );
  }

  if (error || !inv) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-slate-700">{error || 'Invitation not found.'}</p>
          <Link to="/notifications" className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800">
            Back to notifications
          </Link>
        </div>
      </Layout>
    );
  }

  const pending = inv.status === 'pending';
  const expired = inv.expiresAt && new Date(inv.expiresAt) < new Date();

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-10 pb-20">
        <div className="mb-8">
          <Link to="/notifications" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            ← Notifications
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <div className="w-16 h-16 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-bold shrink-0 overflow-hidden">
                {inv.company?.logo ? (
                  <img src={logoUrl(inv.company.logo)} alt="" className="w-full h-full object-cover" />
                ) : (
                  inv.company?.name?.charAt(0) || '?'
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Company invitation</p>
                <h1 className="text-2xl font-semibold tracking-tight mt-1">{inv.company?.name || 'Company'}</h1>
                {inv.company?.description ? (
                  <p className="mt-3 text-sm text-slate-300 leading-relaxed">{inv.company.description}</p>
                ) : (
                  <p className="mt-3 text-sm text-slate-400 italic">No company summary provided.</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4 border-b border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Role</p>
                <p className="mt-1 font-semibold text-slate-900">{inv.designation}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Salary</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {inv.salary > 0 ? `${sym}${Number(inv.salary).toLocaleString()} (${currency})` : 'Negotiable / not specified'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Invited by</p>
                <p className="mt-1 font-semibold text-slate-900">{inv.invitedBy?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</p>
                <p className="mt-1 font-semibold text-slate-900 capitalize">
                  {expired && pending ? 'Expired' : inv.status}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <Section title="Job description" empty={!inv.jobDescription?.trim()}>
            {inv.jobDescription?.trim() || ''}
          </Section>
          <Section title="Facilities & benefits" empty={!inv.facilities?.trim()}>
            {inv.facilities?.trim() || ''}
          </Section>
          <Section title="Terms & policies" empty={!inv.termsAndPolicies?.trim()}>
            {inv.termsAndPolicies?.trim() || ''}
          </Section>
          {!inv.jobDescription?.trim() && !inv.facilities?.trim() && !inv.termsAndPolicies?.trim() && (
            <p className="text-sm text-slate-500 text-center py-4">No additional offer details were attached to this invitation.</p>
          )}
        </div>

        {pending && !expired && (
          <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={reject}
              disabled={processing}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={accept}
              disabled={processing}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {processing ? 'Please wait…' : 'Accept invitation'}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default InvitationDetails;
