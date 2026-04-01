import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from './Layout';
import api, { API_BASE_URL, BASE_SERVER_URL } from '../services/api';
import { useToast } from '../context/ToastContext';
import PageHeader from './PageHeader';

const ProfilePreview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    };

    const getImageUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${BASE_SERVER_URL}${url}`;
    };

    useEffect(() => {
        fetchUserProfile();
    }, [id]);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/users/${id}`);
            setUser(response.data);
        } catch (error) {
            console.error('Error fetching profile', error);
            toast?.showToast?.('Failed to load profile.', 'error');
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            toast?.showToast?.('Generating resume PDF...', 'info');
            const response = await api.get(`/users/${id}/export-pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${user.name.replace(/\s+/g, '_')}_Resume.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast?.showToast?.('Download complete.', 'success');
        } catch (error) {
            console.error('Export error:', error);
            toast?.showToast?.('Export failed. Please check your data.', 'error');
        }
    };

    if (loading) return (
        <Layout>
            <div className="p-40 text-center space-y-8">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-sm" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Loading Credentials...</p>
            </div>
        </Layout>
    );

    if (!user) return null;

    const profile = user.profile || {};

    return (
        <Layout>
            <div className="space-y-12 pb-40">
                <PageHeader
                    title="Professional Portfolio"
                    subtitle={`Comprehensive career summary and technical proficiency for ${user.name}.`}
                    icon="💼"
                    stats={[
                        { label: 'Verified Role', value: user.role.toUpperCase() },
                        { label: 'Identity Token', value: user._id.slice(-6).toUpperCase() }
                    ]}
                    actions={
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all active:scale-95"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleExport}
                                className="px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <span>📥</span> Export CV (PDF)
                            </button>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Main Content Area */}
                    <div className="lg:col-span-8 space-y-10">
                        {/* Header / Intro Card */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                            <div
                                className={`h-48 w-full ${!profile.coverPhoto ? 'bg-gradient-to-br from-indigo-600 to-slate-900' : ''}`}
                                style={profile.coverPhoto ? { backgroundImage: `url(${getImageUrl(profile.coverPhoto)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                            />
                            <div className="px-10 pb-10 relative">
                                <div className="flex flex-col md:flex-row gap-8 items-end -mt-16 mb-8">
                                    <div className="relative">
                                        <div className="w-40 h-40 rounded-[2.5rem] border-8 border-white shadow-xl overflow-hidden bg-slate-200">
                                            {profile.profilePicture ? (
                                                <img src={getImageUrl(profile.profilePicture)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-white text-5xl font-bold bg-indigo-600">{user.name.charAt(0)}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight uppercase leading-none mb-3">{user.name}</h1>
                                        <p className="text-lg font-bold text-indigo-600 uppercase tracking-widest opacity-80">{profile.title || 'System Professional'}</p>
                                    </div>
                                </div>

                                {profile.summary && (
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Professional Narrative</h4>
                                        <div className="text-lg font-medium text-slate-600 leading-relaxed border-l-4 border-indigo-200 pl-8" dangerouslySetInnerHTML={{ __html: profile.summary }} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Employment History */}
                        {profile.experience && profile.experience.length > 0 && (
                            <div className="space-y-8">
                                <div className="flex items-center gap-4 px-4">
                                    <span className="text-2xl">📂</span>
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Operational Experience</h2>
                                    <div className="flex-1 border-t-2 border-slate-100" />
                                </div>
                                <div className="space-y-6">
                                    {profile.experience.map((exp, i) => (
                                        <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative group hover:border-indigo-200 transition-all">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                                <div className="space-y-1">
                                                    <h3 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">{exp.position}</h3>
                                                    <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest">{exp.company}</p>
                                                </div>
                                                <div className="px-6 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                    {formatDate(exp.startDate)} — {exp.current ? 'Current Status' : formatDate(exp.endDate)}
                                                </div>
                                            </div>
                                            <div className="text-slate-600 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: exp.description }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Projects */}
                        {/* Projects */}
                        {profile.projects && profile.projects.length > 0 && (
                            <div className="space-y-8">
                                <div className="flex items-center gap-4 px-4">
                                    <span className="text-2xl">⚛️</span>
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Technical Projects</h2>
                                    <div className="flex-1 border-t-2 border-slate-100" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {profile.projects.map((proj, i) => (
                                        <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start mb-6">
                                                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">{proj.name}</h3>
                                                {proj.url && <a href={proj.url} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest hover:underline">Link 🔗</a>}
                                            </div>
                                            <div className="text-sm font-medium text-slate-500 mb-6 line-clamp-3 overflow-hidden h-[4.5rem]" dangerouslySetInnerHTML={{ __html: proj.description }} />
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(proj.startDate)} — {formatDate(proj.endDate)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Achievements */}
                        {profile.achievements && profile.achievements.length > 0 && (
                            <div className="space-y-8">
                                <div className="flex items-center gap-4 px-4">
                                    <span className="text-2xl">🏆</span>
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Achievements & Certifications</h2>
                                    <div className="flex-1 border-t-2 border-slate-100" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {profile.achievements.map((ach, i) => (
                                        <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight mb-2">{ach.title}</h3>
                                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-4">{ach.issuer} {ach.date && `• ${formatDate(ach.date)}`}</p>
                                            <div className="text-sm font-medium text-slate-500 line-clamp-3" dangerouslySetInnerHTML={{ __html: ach.description }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Area */}
                    <div className="lg:col-span-4 space-y-10">
                        {/* Contact & Location Info */}
                        <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-xl space-y-10">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 opacity-80 border-b border-white/10 pb-4">Access Metadata</h4>
                            <div className="space-y-8">
                                <div className="flex items-center gap-6 group">
                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-xl group-hover:bg-indigo-600 transition-all">📧</div>
                                    <div>
                                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Electronic Mail</div>
                                        <div className="text-sm font-bold uppercase tracking-tight break-all">{user.email}</div>
                                    </div>
                                </div>
                                {profile.phone && (
                                    <div className="flex items-center gap-6 group">
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-xl group-hover:bg-indigo-600 transition-all">📡</div>
                                        <div>
                                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Direct Link</div>
                                            <div className="text-sm font-bold uppercase tracking-tight">{profile.phone}</div>
                                        </div>
                                    </div>
                                )}
                                {profile.location && (
                                    <div className="flex items-center gap-6 group">
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-xl group-hover:bg-indigo-600 transition-all">📍</div>
                                        <div>
                                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Base Coordinates</div>
                                            <div className="text-sm font-bold uppercase tracking-tight">{profile.location}</div>
                                        </div>
                                    </div>
                                )}
                                {profile.linkedin && (
                                    <div className="flex items-center gap-6 group">
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-xl group-hover:bg-indigo-600 transition-all">🔗</div>
                                        <div>
                                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">LinkedIn Network</div>
                                            <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`} target="_blank" rel="noreferrer" className="text-sm font-bold uppercase tracking-tight text-indigo-400 hover:text-white transition-colors truncate block max-w-[150px]">View Profile</a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Skills Card */}
                        {profile.skills && profile.skills.length > 0 && (
                            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-4">Technical Assets</h4>
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.map((s, i) => (
                                        <span key={i} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 uppercase tracking-tight hover:border-indigo-600 transition-all">{s}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Academic Journey */}
                        {profile.education && profile.education.length > 0 && (
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-4">Credentials</h4>
                                <div className="space-y-4">
                                    {profile.education.map((edu, i) => (
                                        <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                                            <h5 className="text-sm font-bold text-slate-900 uppercase tracking-tight mb-1">{edu.degree}</h5>
                                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3">{edu.institution}</p>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formatDate(edu.startDate)} — {edu.current ? 'Ongoing' : formatDate(edu.endDate)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </Layout>
    );
};

export default ProfilePreview;
