import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import api, { BASE_SERVER_URL } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../layout/PageHeader';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <div className="p-40 text-center space-y-6">
                <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                <p className="text-sm font-medium text-slate-500">Loading profile...</p>
            </div>
        </Layout>
    );

    if (!user) return null;

    const profile = user.profile || {};

    return (
        <Layout>
            <div className="space-y-8 pb-32 fade-in">
                <PageHeader
                    title="User Profile"
                    subtitle={`Professional background and expertise for ${user.name}`}
                    icon="💼"
                    stats={[
                        { label: 'Role', value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
                        { label: 'User ID', value: user._id.slice(-6).toUpperCase() }
                    ]}
                    actions={
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate(-1)}
                                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-all"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={handleExport}
                                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-md hover:bg-slate-800 transition-all flex items-center gap-2"
                            >
                                <span>📥</span> Export PDF
                            </button>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Main Content Area */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Header / Intro Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                            <div
                                className={`h-40 w-full ${!profile.coverPhoto ? 'bg-gradient-to-r from-slate-900 to-indigo-900' : ''}`}
                                style={profile.coverPhoto ? { backgroundImage: `url(${getImageUrl(profile.coverPhoto)})`, backgroundSize: 'cover', backgroundPosition: `center ${profile.coverPosition ?? 50}%` } : {}}
                            />
                            <div className="px-10 pb-10 relative">
                                <div className="flex flex-col md:flex-row gap-6 items-end -mt-12 mb-8">
                                    <div className="relative">
                                        <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-lg overflow-hidden bg-slate-100">
                                            {profile.profilePicture ? (
                                                <img src={getImageUrl(profile.profilePicture)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-indigo-600 text-4xl font-bold">{user.name.charAt(0)}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 pb-2 text-center md:text-left">
                                        <h1 className="text-3xl font-bold text-slate-900 mb-1">{user.name}</h1>
                                        <p className="text-base font-semibold text-indigo-600">{profile.title || 'Professional'}</p>
                                    </div>
                                </div>

                                {profile.summary && (
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-3">Professional Summary</h4>
                                        <div className="text-base text-slate-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: profile.summary }} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Employment History */}
                        {profile.experience && profile.experience.length > 0 && (
                            <div className="space-y-6">
                                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Work Experience</h2>
                                <div className="space-y-4">
                                    {profile.experience.map((exp, i) => (
                                        <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-100 transition-colors">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-900 leading-tight">{exp.position}</h3>
                                                    <p className="text-sm font-bold text-indigo-600">{exp.company}</p>
                                                </div>
                                                <div className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500">
                                                    {formatDate(exp.startDate)} — {exp.current ? 'Present' : formatDate(exp.endDate)}
                                                </div>
                                            </div>
                                            <div className="text-sm text-slate-600 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: exp.description }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Projects */}
                        {profile.projects && profile.projects.length > 0 && (
                            <div className="space-y-6">
                                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Key Projects</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {profile.projects.map((proj, i) => (
                                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-100 transition-colors">
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-base font-bold text-slate-900">{proj.name}</h3>
                                                {proj.url && <a href={proj.url} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold text-[10px] uppercase hover:underline">Link 🔗</a>}
                                            </div>
                                            <div className="text-sm text-slate-500 font-medium mb-4 line-clamp-3" dangerouslySetInnerHTML={{ __html: proj.description }} />
                                            <div className="text-[10px] font-bold text-slate-400">{formatDate(proj.startDate)} — {formatDate(proj.endDate)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Achievements */}
                        {profile.achievements && profile.achievements.length > 0 && (
                            <div className="space-y-6">
                                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Achievements</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {profile.achievements.map((ach, i) => (
                                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                            <h3 className="text-base font-bold text-slate-900 mb-1">{ach.title}</h3>
                                            <p className="text-[10px] font-bold text-indigo-600 uppercase mb-3">{ach.issuer} {ach.date && `• ${formatDate(ach.date)}`}</p>
                                            <div className="text-sm text-slate-500 font-medium line-clamp-3" dangerouslySetInnerHTML={{ __html: ach.description }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Area */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Contact Info */}
                        <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-lg space-y-8">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 border-b border-white/10 pb-4">Contact Information</h4>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-lg">📧</div>
                                    <div>
                                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Email</div>
                                        <div className="text-sm font-semibold break-all">{user.email}</div>
                                    </div>
                                </div>
                                {profile.phone && (
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-lg">📱</div>
                                        <div>
                                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Phone</div>
                                            <div className="text-sm font-semibold">{profile.phone}</div>
                                        </div>
                                    </div>
                                )}
                                {profile.location && (
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-lg">📍</div>
                                        <div>
                                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Location</div>
                                            <div className="text-sm font-semibold">{profile.location}</div>
                                        </div>
                                    </div>
                                )}
                                {profile.linkedin && (
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-lg">🔗</div>
                                        <div>
                                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">LinkedIn</div>
                                            <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-indigo-400 hover:text-white transition-colors truncate block max-w-[150px]">View Profile</a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Skills */}
                        {profile.skills && profile.skills.length > 0 && (
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">Skills</h4>
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.map((s, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 hover:border-indigo-600 transition-colors">{s}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Education */}
                        {profile.education && profile.education.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Education</h4>
                                <div className="space-y-4">
                                    {profile.education.map((edu, i) => (
                                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                            <h5 className="text-sm font-bold text-slate-900 mb-1">{edu.degree}</h5>
                                            <p className="text-[11px] font-bold text-indigo-600 mb-1">{edu.institution}</p>
                                            {(edu.level || edu.stream || edu.field) && (
                                                <p className="text-[11px] text-slate-600 mb-2">
                                                    {[edu.level, edu.stream, edu.field].filter(Boolean).join(' · ')}
                                                </p>
                                            )}
                                            {edu.result && (
                                                <p className="text-[11px] font-semibold text-slate-500 mb-2">Result: {edu.result}</p>
                                            )}
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">{formatDate(edu.startDate)} — {edu.current ? 'Ongoing' : formatDate(edu.endDate)}</div>
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
