import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import PageHeader from '../layout/PageHeader';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { BASE_SERVER_URL, getAssetUrl } from '../../services/api';

const CompanyDetails = () => {
    const { id } = useParams();
    const { state } = useAuth();
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'projects', 'employees'

    const getLogoUrl = getAssetUrl;

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
                const companyRes = await fetch(`${BASE_SERVER_URL}/api/admin/companies/${id}`, {
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
                const projectsRes = await fetch(`${BASE_SERVER_URL}/api/admin/companies/${id}/projects`, {
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
                <div className="min-h-[60vh] flex flex-col items-center justify-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-slate-500 font-medium">Loading organization details...</p>
                </div>
            </Layout>
        );
    }

    if (!company) {
        return (
            <Layout>
                <div className="bg-white border border-slate-200 p-16 rounded-2xl text-center shadow-sm max-w-2xl mx-auto my-12">
                    <div className="text-6xl mb-6">🏢</div>
                    <h3 className="text-2xl font-bold text-slate-900">Organization Not Found</h3>
                    <p className="text-slate-500 mt-4 leading-relaxed">
                        The requested organization could not be found in the system registry. It may have been removed or the ID is incorrect.
                    </p>
                    <Button
                        onClick={() => navigate('/companies')}
                        variant="primary"
                        className="mt-8 px-8"
                    >
                        Return to Organizations
                    </Button>
                </div>
            </Layout>
        );
    }

    const TabButton = ({ id, label, icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm border border-transparent'
                }`}
        >
            <span className="text-lg">{icon}</span>
            {label}
        </button>
    );

    return (
        <Layout>
            {/* Header */}
            <div className="mb-8">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/companies')}
                    className="mb-4 -ml-2 text-slate-500 hover:text-indigo-600 group"
                >
                    <svg className="mr-2 group-hover:-translate-x-1 transition-transform" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    Back to Directory
                </Button>

                <PageHeader
                    title={company.name}
                    subtitle={company.description || "Project management organization."}
                    icon={
                        company.logo ? (
                            <img src={getLogoUrl(company.logo)} alt="" className="w-full h-full object-cover" />
                        ) : company.name?.charAt(0)?.toUpperCase()
                    }
                    stats={[
                        { label: 'Personnel', value: company.memberCount || 0 },
                        { label: 'Active Projects', value: projects.length },
                        { label: 'Industry', value: company.industry || 'General' }
                    ]}
                    actions={
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/edit-company-info?id=${company.id}`)}
                        >
                            Edit Organization
                        </Button>
                    }
                />
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 p-1 bg-slate-100/50 rounded-xl w-fit border border-slate-200">
                <TabButton
                    id="overview"
                    label="Overview"
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>}
                />
                <TabButton
                    id="projects"
                    label="Projects"
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>}
                />
                <TabButton
                    id="employees"
                    label="Personnel"
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
                />
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-500">
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card className="hover:border-indigo-200 transition-colors">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                                Contact Information
                            </h3>
                            <div className="space-y-5">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
                                    <p className="text-sm font-medium text-slate-700">{company.email || 'None provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
                                    <p className="text-sm font-medium text-slate-700">{company.phone || 'None provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Website</p>
                                    {company.website ? (
                                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 underline truncate block">
                                            {company.website.replace(/^https?:\/\//, '')}
                                        </a>
                                    ) : (
                                        <p className="text-sm font-medium text-slate-700">None provided</p>
                                    )}
                                </div>
                            </div>
                        </Card>

                        <Card className="hover:border-indigo-200 transition-colors">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                                Business Details
                            </h3>
                            <div className="space-y-5">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Founded Year</p>
                                    <p className="text-sm font-medium text-slate-700">{company.foundedYear || 'Not specified'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Organization Size</p>
                                    <p className="text-sm font-medium text-slate-700">{company.companySize || 'Not specified'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Owner / Administrator</p>
                                    <p className="text-sm font-bold text-slate-800">{company.owner?.name || 'Unassigned'}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-slate-900 text-white border-none shadow-lg group relative overflow-hidden">
                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            </div>
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-indigo-400 rounded-full"></span>
                                Location
                            </h3>
                            <div className="space-y-4">
                                {company.address ? (
                                    <p className="text-sm font-medium leading-relaxed text-slate-200">{company.address}</p>
                                ) : (
                                    <p className="text-sm font-medium text-slate-500 italic">Address not provided.</p>
                                )}
                                <div className="pt-2 border-t border-slate-800">
                                    <div className="text-xl font-bold text-white">
                                        {company.city}{company.city && (company.state || company.country) ? ', ' : ''}{company.state}
                                    </div>
                                    <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                        {company.country} {company.zipCode && `[${company.zipCode}]`}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* PROJECTS TAB */}
                {activeTab === 'projects' && (
                    <div>
                        {projects.length === 0 ? (
                            <div className="bg-white border border-slate-200 p-16 rounded-2xl text-center shadow-sm">
                                <div className="text-5xl mb-4">📂</div>
                                <h3 className="text-xl font-bold text-slate-900">No projects yet</h3>
                                <p className="text-slate-500 mt-2 max-w-sm mx-auto">This organization hasn't created any projects in the system yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {projects.map(project => (
                                    <Card
                                        key={project._id}
                                        className="hover:border-indigo-300 hover:shadow-md transition-all group cursor-pointer"
                                        onClick={() => navigate(`/projects/${project._id}`)}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase truncate pr-4">
                                                {project.name}
                                            </h3>
                                            <Badge variant={project.status === 'completed' ? 'success' : 'info'} size="sm">
                                                {project.status.replace('-', ' ')}
                                            </Badge>
                                        </div>

                                        <div
                                            className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2"
                                            dangerouslySetInnerHTML={{ __html: project.description || 'No project description available.' }}
                                        />

                                        <div className="flex justify-between items-center text-xs font-bold text-slate-400 pt-4 border-t border-slate-100">
                                            <div className="capitalize">
                                                {project.priority || 'Medium'} Priority
                                            </div>
                                            <div>
                                                {new Date(project.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* PERSONNEL TAB */}
                {activeTab === 'employees' && (
                    <div className="space-y-6">
                        {!company.members || company.members.length === 0 ? (
                            <div className="bg-white border border-slate-200 p-16 rounded-2xl text-center shadow-sm">
                                <div className="text-5xl mb-4">👥</div>
                                <h3 className="text-xl font-bold text-slate-900">No personnel registered</h3>
                                <p className="text-slate-500 mt-2 max-w-sm mx-auto">There are no employees or members currently assigned to this company.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {company.members.map(member => {
                                    const user = member.user;
                                    return (
                                        <Card key={user._id} className="text-center group hover:border-indigo-300 transition-all">
                                            <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-2xl font-bold text-slate-400 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                {user.name?.charAt(0)?.toUpperCase()}
                                            </div>

                                            <h3 className="text-base font-bold text-slate-900 truncate px-2">{user.name}</h3>
                                            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1 mb-6">
                                                {member.designation || 'Specialist'}
                                            </p>

                                            <Button
                                                onClick={() => navigate(`/users/${user._id}`)}
                                                variant="outline"
                                                size="sm"
                                                className="w-full font-bold uppercase tracking-wider text-[10px]"
                                            >
                                                View Profile
                                            </Button>
                                        </Card>
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

