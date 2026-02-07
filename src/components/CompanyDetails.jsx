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
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                    <div style={{ fontSize: '18px', color: '#64748b' }}>Loading company details...</div>
                </div>
            </Layout>
        );
    }

    if (!company) {
        return (
            <Layout>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <h3>Company not found</h3>
                    <button onClick={() => navigate('/companies')} style={{
                        padding: '10px 20px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        marginTop: '20px'
                    }}>
                        Back to Companies
                    </button>
                </div>
            </Layout>
        );
    }

    const TabButton = ({ id, label, icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                padding: '12px 24px',
                backgroundColor: activeTab === id ? '#3b82f6' : 'transparent',
                color: activeTab === id ? 'white' : '#64748b',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
            }}
        >
            {icon}
            {label}
        </button>
    );

    return (
        <Layout>
            {/* Header */}
            <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '16px',
                marginBottom: '24px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Pattern */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '300px',
                    height: '100%',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(255, 255, 255, 0) 100%)',
                    clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)'
                }} />

                <button
                    onClick={() => navigate('/companies')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        marginBottom: '20px',
                        fontSize: '14px',
                        fontWeight: '500',
                        padding: 0
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back to Companies
                </button>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', position: 'relative' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        fontWeight: '700',
                        color: 'white',
                        boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)'
                    }}>
                        {company.name?.charAt(0)?.toUpperCase()}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <h1 style={{ margin: 0, color: '#1e293b', fontSize: '32px', fontWeight: '800' }}>
                                {company.name}
                            </h1>
                            {company.industry && (
                                <span style={{
                                    padding: '4px 12px',
                                    backgroundColor: '#f1f5f9',
                                    color: '#475569',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    {company.industry}
                                </span>
                            )}
                        </div>

                        <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '16px', maxWidth: '600px', lineHeight: '1.6' }}>
                            {company.description || 'No description available'}
                        </p>

                        <div style={{ display: 'flex', gap: '24px', color: '#64748b', fontSize: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                                <span style={{ fontWeight: '500' }}>{company.memberCount} Members</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                </svg>
                                <span style={{ fontWeight: '500' }}>{projects.length} Projects</span>
                            </div>
                            {company.website && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="2" y1="12" x2="22" y2="12"></line>
                                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10 15.3 15.3 0 0 1 4-10z"></path>
                                    </svg>
                                    <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>
                                        {company.website}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '24px',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '12px'
            }}>
                <TabButton
                    id="overview"
                    label="Overview"
                    icon={
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="3" y1="9" x2="21" y2="9"></line>
                            <line x1="9" y1="21" x2="9" y2="9"></line>
                        </svg>
                    }
                />
                <TabButton
                    id="projects"
                    label="Projects"
                    icon={
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                    }
                />
                <TabButton
                    id="employees"
                    label="Employees"
                    icon={
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    }
                />
            </div>

            {/* Tab Content */}
            <div>
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '24px',
                            borderRadius: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            border: '1px solid #e2e8f0'
                        }}>
                            <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '18px', fontWeight: '700' }}>Contact Info</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Email</span>
                                    <span style={{ fontWeight: '500', color: '#1e293b' }}>{company.email || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Phone</span>
                                    <span style={{ fontWeight: '500', color: '#1e293b' }}>{company.phone || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Website</span>
                                    <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                                        {company.website || 'N/A'}
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            backgroundColor: 'white',
                            padding: '24px',
                            borderRadius: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            border: '1px solid #e2e8f0'
                        }}>
                            <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '18px', fontWeight: '700' }}>Company Info</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Founded</span>
                                    <span style={{ fontWeight: '500', color: '#1e293b' }}>{company.foundedYear || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Size</span>
                                    <span style={{ fontWeight: '500', color: '#1e293b' }}>{company.companySize || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Owner</span>
                                    <span style={{ fontWeight: '500', color: '#1e293b' }}>{company.owner?.name || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            backgroundColor: 'white',
                            padding: '24px',
                            borderRadius: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            border: '1px solid #e2e8f0'
                        }}>
                            <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '18px', fontWeight: '700' }}>Location</h3>
                            <p style={{ margin: 0, color: '#1e293b', lineHeight: '1.6' }}>
                                {company.address && <div>{company.address}</div>}
                                {(company.city || company.state) && <div>{company.city}{company.city && company.state ? ', ' : ''}{company.state}</div>}
                                {(company.country || company.zipCode) && <div>{company.country}{company.country && company.zipCode ? ' - ' : ''}{company.zipCode}</div>}
                                {!company.address && !company.city && !company.country && <span style={{ color: '#94a3b8' }}>No location info provided</span>}
                            </p>
                        </div>
                    </div>
                )}

                {/* PROJECTS TAB */}
                {activeTab === 'projects' && (
                    <div>
                        {projects.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '12px' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
                                <h3 style={{ color: '#1e293b', marginBottom: '8px' }}>No projects found</h3>
                                <p style={{ color: '#64748b' }}>This company hasn't created any projects yet.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                {projects.map(project => (
                                    <div key={project._id} style={{
                                        backgroundColor: 'white',
                                        padding: '24px',
                                        borderRadius: '12px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                        border: '1px solid #e2e8f0',
                                        transition: 'transform 0.2s',
                                        cursor: 'default'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>{project.name}</h3>
                                            <span style={{
                                                padding: '4px 10px',
                                                backgroundColor: project.status === 'completed' ? '#dcfce7' : '#e0f2fe',
                                                color: project.status === 'completed' ? '#166534' : '#0369a1',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                textTransform: 'capitalize'
                                            }}>
                                                {project.status.replace('-', ' ')}
                                            </span>
                                        </div>
                                        <p style={{
                                            color: '#64748b',
                                            fontSize: '14px',
                                            marginBottom: '20px',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {project.description || 'No description'}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#64748b' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="12" cy="7" r="4"></circle>
                                                </svg>
                                                {project.members?.length || 0} Members
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                                </svg>
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
                    <div>
                        {!company.members || company.members.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '12px' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                                <h3 style={{ color: '#1e293b', marginBottom: '8px' }}>No employees found</h3>
                                <p style={{ color: '#64748b' }}>This company doesn't have any members yet.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                                {company.members.map(member => {
                                    const user = member.user;
                                    return (
                                        <div key={user._id} style={{
                                            backgroundColor: 'white',
                                            padding: '24px',
                                            borderRadius: '12px',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                            border: '1px solid #e2e8f0',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{
                                                width: '64px',
                                                height: '64px',
                                                borderRadius: '50%',
                                                backgroundColor: '#f1f5f9',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '24px',
                                                fontWeight: '600',
                                                color: '#64748b',
                                                marginBottom: '16px'
                                            }}>
                                                {user.name?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                                                {user.name}
                                            </h3>
                                            <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '14px' }}>
                                                {member.designation || 'Member'}
                                            </p>
                                            <div style={{
                                                padding: '4px 10px',
                                                backgroundColor: '#f1f5f9',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                color: '#475569',
                                                marginBottom: '20px'
                                            }}>
                                                {user.email}
                                            </div>
                                            <button
                                                onClick={() => navigate(`/users/${user._id}`)}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    color: '#3b82f6',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                            >
                                                View Profile
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M9 18l6-6-6-6" />
                                                </svg>
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
