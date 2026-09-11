import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import { getCookie } from '../../utils/cookies';
import { useToast } from '../../context/ToastContext';
import axios from 'axios';
import { getAssetUrl } from '../../services/api';

const CircularDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [circular, setCircular] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCircular = async () => {
            try {
                const token = getCookie('authToken');
                const res = await axios.get(`/api/recruitment/public/circulars/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCircular(res.data);
            } catch (err) {
                toast.showToast('Failed to load circular details', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchCircular();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const shareUrl = `${window.location.origin}/careers/${id}`;
    
    // Sharing handlers
    const shareFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    const shareLinkedIn = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
    const shareX = () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out this job opening: ${circular?.title}`)}`, '_blank');
    const shareInstagram = () => {
        navigator.clipboard.writeText(shareUrl);
        toast.showToast('Link copied to clipboard for Instagram sharing!', 'success');
    };

    if (loading) return <Layout><div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div></Layout>;
    
    if (!circular) return <Layout><div className="text-center p-10 text-slate-500">Circular not found</div></Layout>;

    return (
        <Layout>
            <div className="space-y-8 animate-in fade-in pb-20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/recruitment')} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Circular Details</h1>
                            <p className="text-slate-400 text-sm font-medium mt-1">Reviewing {circular?.title}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link to={`/recruitment/circulars/${id}/edit`} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50">
                            Edit Circular
                        </Link>
                        <Link to={`/recruitment/circulars/${id}/applicants`} className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-bold text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200">
                            View Applicants
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                    {circular.coverImage && (
                        <div className="w-full h-48 md:h-64 rounded-xl overflow-hidden mb-8 border border-slate-200">
                            <img src={getAssetUrl(circular.coverImage)} alt="Cover" className="w-full h-full object-cover" />
                        </div>
                    )}
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex gap-4">
                            <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                                {circular.company?.logo ? (
                                    <img src={getAssetUrl(circular.company.logo)} alt={circular.company?.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-slate-400">{circular.title?.charAt(0)}</span>
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{circular.title}</h2>
                                <p className="text-slate-500 mt-1 font-medium">{circular.company?.name}</p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100 capitalize">{circular.jobNature}</span>
                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200">{circular.location}</span>
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border uppercase tracking-wider ${circular.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{circular.status}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Share section */}
                        <div className="flex flex-col items-start md:items-end gap-3 md:mt-0 mt-2">
                            <div className="flex items-center gap-2 mb-2">
                                <Link to={`/careers/${id}`} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all">
                                    <span>🌐</span> Preview Public
                                </Link>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Share on Socials</span>
                            <div className="flex items-center gap-2">
                                <button onClick={shareFacebook} className="w-10 h-10 rounded-xl bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2] hover:text-white transition-colors flex items-center justify-center shadow-sm" title="Share on Facebook">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                </button>
                                <button onClick={shareLinkedIn} className="w-10 h-10 rounded-xl bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white transition-colors flex items-center justify-center shadow-sm" title="Share on LinkedIn">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                </button>
                                <button onClick={shareX} className="w-10 h-10 rounded-xl bg-black/5 text-black hover:bg-black hover:text-white transition-colors flex items-center justify-center shadow-sm" title="Share on X">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                </button>
                                <button onClick={shareInstagram} className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FD1D1D]/20 via-[#E1306C]/20 to-[#833AB4]/20 text-[#E1306C] hover:from-[#FD1D1D] hover:via-[#E1306C] hover:to-[#833AB4] hover:text-white transition-all flex items-center justify-center shadow-sm" title="Copy Instagram Link">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 border-t border-slate-100 pt-8">
                        <div className="md:col-span-2 space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-5 bg-indigo-500 rounded-full"></div>
                                    Role Overview
                                </h3>
                                <div className="text-slate-700 leading-relaxed text-[15px] space-y-4" dangerouslySetInnerHTML={{ __html: circular.description }} />
                            </div>
                            {circular.benefits && (
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
                                        Benefits
                                    </h3>
                                    <div className="text-slate-700 leading-relaxed text-[15px] space-y-4" dangerouslySetInnerHTML={{ __html: circular.benefits }} />
                                </div>
                            )}
                        </div>
                        
                        <div className="space-y-6">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-5">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Salary</p>
                                    <p className="font-bold text-slate-800 mt-1">
                                        {circular.salaryRange?.currency || '৳'}{Number(circular.salaryRange?.min || 0).toLocaleString()} - {circular.salaryRange?.currency || '৳'}{Number(circular.salaryRange?.max || 0).toLocaleString()} / {circular.salaryRange?.period === 'yearly' ? 'yr' : 'mo'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Experience</p>
                                    <p className="font-bold text-slate-800 mt-1">{circular.experience} years minimum</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mandatory Skills</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {circular.mandatorySkills?.map((s, i) => (
                                            <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm">{s}</span>
                                        ))}
                                    </div>
                                </div>
                                {circular.niceToHaveSkills?.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nice To Have</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {circular.niceToHaveSkills?.map((s, i) => (
                                            <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-500">{s}</span>
                                        ))}
                                    </div>
                                </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CircularDetails;
