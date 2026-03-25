import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from './Layout';

const CompanyDetails = () => {
    const { id } = useParams();
    const { state } = useAuth();
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'projects', 'employees'

    useEffect(() => {
        // Check if user is admin or superadmin
        if (state.user?.role !== 'admin' && state.user?.role !== 'superadmin') {
            navigate('/dashboard');
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch company details
                const companyRes = await fetch(`http://localhost:5000/api/admin/companies/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${state.token}`
                    }
                });

                if (companyRes.ok) {
                    const companyData = await companyRes.json();
                    setCompany(companyData);
                } else {
                    console.error('Failed to fetch company details');
                }

                // Fetch company projects
                const projectsRes = await fetch(`http://localhost:5000/api/admin/companies/${id}/projects`, {
                    headers: {
                        'Authorization': `Bearer ${state.token}`
                    }
                });

                if (projectsRes.ok) {
                    const projectsData = await projectsRes.json();
                    setProjects(projectsData);
                }
            } catch (error) {
                console.error('Error fetching details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id, state.token, state.user, navigate]);

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center p-24 text-center">
                    <div className="text-6xl mb-6 animate-bounce">⏳</div>
                    <div className="text-xl font-bold text-slate-500 animate-pulse tracking-tight italic">Gathering detailed intel...</div>
                </div>
            </Layout>
        );
    }

    if (!company) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center p-24 text-center bg-white rounded-[48px] shadow-sm border border-slate-100">
                    <div className="text-8xl mb-8 opacity-20 grayscale">🏢</div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Entity Not Found</h3>
                    <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto uppercase text-xs tracking-[0.2em]">The requested organization does not exist in the central registry.</p>
                    <button
                        onClick={() => navigate('/companies')}
                        className="mt-10 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
                    >
                        Return to Registry
                    </button>
                </div>
            </Layout>
        );
    }

    const TabButton = ({ id, label, icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-300 relative group overflow-hidden ${activeTab === id
                    ? 'bg-slate-900 text-white shadow-2xl shadow-slate-300 scale-105 z-10'
                    : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:translate-y-[-2px]'
                }`}
        >
            <span className={`transition-transform duration-500 ${activeTab === id ? 'scale-110 rotate-3' : 'group-hover:rotate-12'}`}>
                {icon}
            </span>
            <span className="relative z-10">{label}</span>
            {activeTab === id && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
            )}
        </button>
    );

    return (
        <Layout>
            {/* Header */}
            <div className="bg-white p-10 lg:p-14 rounded-[56px] shadow-sm border border-slate-100 mb-10 relative overflow-hidden transition-all hover:shadow-md">
                {/* Decorative Background Element */}
                <div className="absolute top-0 right-0 w-[400px] h-full bg-gradient-to-br from-indigo-50/50 to-transparent rounded-bl-[200px] -z-0"></div>

                <button
                    onClick={() => navigate('/companies')}
                    className="flex items-center gap-3 text-slate-400 hover:text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] mb-10 transition-colors group relative z-10"
                >
                    <svg className="group-hover:-translate-x-1 transition-transform" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    Registry Return
                </button>

                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10 relative z-10">
                    <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-[32px] bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-4xl lg:text-5xl font-black text-white shadow-2xl shadow-indigo-200 rotate-3 hover:rotate-0 transition-transform duration-500">
                        {company.name?.charAt(0)?.toUpperCase()}
                    </div>

                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-6 mb-6">
                            <h1 className="text-4xl lg:text-5xl font-black text-slate-800 tracking-tight">
                                {company.name}
                            </h1>
                            {company.industry && (
                                <span className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 italic">
                                    {company.industry} Nexus
                                </span>
                            )}
                        </div>

                        <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl mb-8">
                            {company.description || 'No operational summary provided for this organizational entity.'}
                        </p>

                        <div className="flex flex-wrap gap-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-600 shadow-inner">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                </div>
                                <span className="text-sm font-black text-slate-700 tracking-tight">{company.memberCount || 0} Personnel</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-purple-600 shadow-inner">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                </div>
                                <span className="text-sm font-black text-slate-700 tracking-tight">{projects.length || 0} Active Projects</span>
                            </div>
                            {company.website && (
                                <div className="flex items-center gap-3 group">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-600 shadow-inner group-hover:bg-emerald-50 transition-colors">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                                    </div>
                                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm font-black text-emerald-600 hover:text-emerald-700 transition-colors tracking-tight underline-offset-4 decoration-2">
                                        {company.website.replace(/^https?:\/\//, '')}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-4 mb-10 pb-6 border-b-2 border-slate-50 overflow-x-auto no-scrollbar">
                <TabButton
                    id="overview"
                    label="Intelligence"
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>}
                />
                <TabButton
                    id="projects"
                    label="Directives"
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>}
                />
                <TabButton
                    id="employees"
                    label="Personnel"
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
                />
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all group">
                            <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-indigo-500 group-hover:w-12 transition-all"></span> Communication
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Address</p>
                                    <p className="text-sm font-bold text-slate-700">{company.email || '––'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile Link</p>
                                    <p className="text-sm font-bold text-slate-700">{company.phone || '––'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Public Domain</p>
                                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-indigo-600 hover:underline">
                                        {company.website || '––'}
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-xl hover:border-purple-100 transition-all group">
                            <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-purple-500 group-hover:w-12 transition-all"></span> Structural Data
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Genesis Cycle</p>
                                    <p className="text-sm font-bold text-slate-700">{company.foundedYear || '––'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Scale</p>
                                    <p className="text-sm font-bold text-slate-700">{company.companySize || '––'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Principal Lead</p>
                                    <p className="text-sm font-bold text-slate-700 italic underline decoration-purple-200 decoration-2">{company.owner?.name || '––'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 text-white p-10 rounded-[40px] shadow-2xl border border-slate-800 hover:shadow-indigo-500/10 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            </div>
                            <h3 className="text-lg font-black mb-8 flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-emerald-500 group-hover:w-12 transition-all"></span> Coordinates
                            </h3>
                            <div className="space-y-4">
                                {company.address && <p className="text-sm font-bold leading-relaxed">{company.address}</p>}
                                <div className="pt-2">
                                    {(company.city || company.state) && <p className="text-indigo-300 font-black text-xl tracking-tight">{company.city}{company.city && company.state ? ', ' : ''}{company.state}</p>}
                                    {(company.country || company.zipCode) && <p className="text-xs font-black text-slate-400 mt-1 uppercase tracking-widest tracking-tighter">{company.country} {company.zipCode && `[${company.zipCode}]`}</p>}
                                </div>
                                {!company.address && !company.city && !company.country && <span className="text-slate-500 font-bold italic text-xs">Geo-coordinates restricted.</span>}
                            </div>
                        </div>
                    </div>
                )}

                {/* PROJECTS TAB */}
                {activeTab === 'projects' && (
                    <div className="space-y-8">
                        {projects.length === 0 ? (
                            <div className="bg-slate-50 p-24 rounded-[56px] border-4 border-dashed border-slate-200 text-center animate-in zoom-in duration-700">
                                <div className="text-8xl mb-6 opacity-20 grayscale">📂</div>
                                <h3 className="text-2xl font-black text-slate-800">No Active Directives</h3>
                                <p className="text-slate-500 font-medium max-w-sm mx-auto mt-2">The operational registry for this company is currently vacant.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {projects.map(project => (
                                    <div key={project._id} className="group bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 relative overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-2 h-full transition-all duration-500 ${project.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>

                                        <div className="flex justify-between items-start mb-8">
                                            <h3 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{project.name}</h3>
                                            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${project.status === 'completed'
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                                }`}>
                                                {project.status.replace('-', ' ')}
                                            </span>
                                        </div>

                                        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10 line-clamp-3">
                                            {project.description || 'Global project directive under structural execution.'}
                                        </p>

                                        <div className="flex justify-between items-center bg-slate-50 rounded-3xl p-4 group-hover:bg-white transition-colors">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                                                {project.members?.length || 0} Nodes
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
                                                {new Date(project.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* EMPLOYEES TAB */}
                {activeTab === 'employees' && (
                    <div className="space-y-10">
                        {!company.members || company.members.length === 0 ? (
                            <div className="bg-slate-50 p-24 rounded-[56px] border-4 border-dashed border-slate-200 text-center animate-in zoom-in duration-700">
                                <div className="text-8xl mb-6 opacity-20 grayscale">👥</div>
                                <h3 className="text-2xl font-black text-slate-800">Personnel Void</h3>
                                <p className="text-slate-500 font-medium max-w-sm mx-auto mt-2">No human resources are currently assigned to this organization's database.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {company.members.map(member => {
                                    const user = member.user;
                                    return (
                                        <div key={user._id} className="group bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:border-indigo-100 transition-all duration-500 text-center relative overflow-hidden">
                                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="relative">
                                                <div className="w-20 h-20 rounded-[32px] bg-slate-50 border-4 border-white shadow-inner mx-auto flex items-center justify-center text-3xl font-black text-slate-300 mb-6 group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-12 transition-all duration-500">
                                                    {user.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                            </div>

                                            <h3 className="text-xl font-black text-slate-800 tracking-tight tracking-tighter truncate px-2">{user.name}</h3>
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-2 mb-8 italic">
                                                {member.designation || 'Specialist'}
                                            </p>

                                            <div className="bg-slate-50 rounded-2xl py-2 px-4 inline-block text-[10px] font-bold text-slate-500 mb-8 border border-white truncate max-w-full">
                                                {user.email}
                                            </div>

                                            <button
                                                onClick={() => navigate(`/users/${user._id}`)}
                                                className="w-full py-4 bg-white border-2 border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-800 hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3"
                                            >
                                                Inspect Profile
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6" /></svg>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default CompanyDetails;
