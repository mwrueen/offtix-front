import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import Layout from '../Layout';
import { useToast } from '../../context/ToastContext';
import { getCookie } from '../../utils/cookies';

const currencySymbols = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹', BDT: '৳', AUD: 'A$', CAD: 'C$' };

const JobOfferAccept = () => {
    const { applicationId } = useParams();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [offer, setOffer] = useState(null);

    const authHeaders = useCallback(() => {
        const token = getCookie('authToken');
        return { Authorization: `Bearer ${token}` };
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`/api/recruitment/applications/${applicationId}/offer-details`, {
                headers: authHeaders()
            });
            setOffer(res.data);
        } catch (e) {
            const msg = e.response?.data?.message || 'Unable to load this offer.';
            setError(msg);
            setOffer(null);
        } finally {
            setLoading(false);
        }
    }, [applicationId, authHeaders]);

    useEffect(() => {
        load();
    }, [load]);

    const handleAccept = async () => {
        setSubmitting(true);
        try {
            const res = await axios.post(
                `/api/recruitment/applications/${applicationId}/accept-offer`,
                {},
                { headers: authHeaders() }
            );
            const companyId = res.data.companyId;
            const listRes = await fetch('/api/companies/user-companies', { headers: authHeaders() });
            if (listRes.ok) {
                const list = await listRes.json();
                const next = list.find((c) => String(c.id) === String(companyId));
                if (next) {
                    localStorage.setItem('selectedCompany', JSON.stringify(next));
                }
            }
            toast.showToast(res.data.message || 'Offer accepted.', 'success');
            window.location.assign('/employees');
        } catch (e) {
            toast.showToast(e.response?.data?.message || 'Could not accept the offer.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="max-w-2xl mx-auto px-6 py-24 flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading offer…</p>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="max-w-lg mx-auto px-6 py-20 text-center space-y-6">
                    <p className="text-slate-600 font-medium">{error}</p>
                    <Link to="/notifications" className="inline-block text-sm font-bold text-indigo-600 hover:underline">Back to notifications</Link>
                </div>
            </Layout>
        );
    }

    if (offer?.phase === 'accepted') {
        return (
            <Layout>
                <div className="max-w-lg mx-auto px-6 py-20 text-center space-y-4">
                    <h1 className="text-2xl font-bold text-slate-900">You are already on the team</h1>
                    <p className="text-slate-600">You accepted this offer for <span className="font-bold text-indigo-600">{offer.companyName}</span>.</p>
                    <Link to="/employees" className="inline-block mt-4 px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-md hover:bg-indigo-700">Open employee directory</Link>
                </div>
            </Layout>
        );
    }

    if (offer?.phase !== 'pending') {
        return null;
    }

    const cur = offer.company?.currency || 'USD';
    const sym = currencySymbols[cur] || `${cur} `;
    const amount = offer.offeredSalary?.amount;

    return (
        <Layout>
            <div className="max-w-2xl mx-auto px-6 py-12 space-y-8 animate-in fade-in">
                <div>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">Job offer</p>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{offer.company?.name}</h1>
                    <p className="text-slate-500 text-sm mt-2">
                        Hi {offer.applicantName}, review the offer below. When you accept, you will be added as an employee and can use the team directory.
                    </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 bg-slate-50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Position</p>
                        <p className="text-lg font-bold text-slate-900 mt-1">{offer.jobTitle}</p>
                        {offer.role && <p className="text-sm font-bold text-indigo-600 mt-0.5">{offer.role}</p>}
                    </div>
                    <div className="px-8 py-6 border-b border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proposed monthly salary</p>
                        <p className="text-2xl font-black text-emerald-700 mt-1">
                            {amount != null ? `${sym}${Number(amount).toLocaleString()} ${cur}` : '—'}
                        </p>
                    </div>
                    <div className="px-8 py-6">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Role description</p>
                        <div
                            className="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none [&_a]:text-indigo-600 [&_a]:underline"
                            dangerouslySetInnerHTML={{
                                __html: offer.hireRoleDescription || '<p class="text-slate-400 italic">No description was attached.</p>'
                            }}
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                    <Link
                        to="/notifications"
                        className="px-6 py-3 text-center border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50"
                    >
                        Decide later
                    </Link>
                    <button
                        type="button"
                        onClick={handleAccept}
                        disabled={submitting}
                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-emerald-600/25"
                    >
                        {submitting ? 'Accepting…' : 'Accept offer & join company'}
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default JobOfferAccept;
