import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';

const CompanyList = () => {
    const { state } = useAuth();
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterIndustry, setFilterIndustry] = useState('all');

    useEffect(() => {
        // Check if user is admin or superadmin
        if (state.user?.role !== 'admin' && state.user?.role !== 'superadmin') {
            navigate('/dashboard');
            return;
        }

        fetchCompanies();
    }, [state.user, navigate]);

    const fetchCompanies = async () => {
        if (!state.token) return;

        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/admin/companies', {
                headers: {
                    'Authorization': `Bearer ${state.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCompanies(data);
            } else {
                console.error('Failed to fetch companies:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get unique industries for filter
    const industries = ['all', ...new Set(companies.map(c => c.industry).filter(Boolean))];

    // Filter companies based on search and industry
    const filteredCompanies = companies.filter(company => {
        const matchesSearch = company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            company.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesIndustry = filterIndustry === 'all' || company.industry === filterIndustry;
        return matchesSearch && matchesIndustry;
    });

    if (loading) {
        return (
            <Layout>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                    <div style={{ fontSize: '18px', color: '#64748b' }}>Loading companies...</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            {/* Page Header */}
            <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                marginBottom: '30px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h1 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '28px', fontWeight: '700' }}>
                            🏢 Companies
                        </h1>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                            Manage and view all companies in the system
                        </p>
                    </div>
                    <div style={{
                        padding: '12px 20px',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1e293b'
                    }}>
                        Total: {companies.length} {companies.length === 1 ? 'Company' : 'Companies'}
                    </div>
                </div>

                {/* Search and Filter */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Search companies..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            flex: 1,
                            minWidth: '250px',
                            padding: '10px 16px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />
                    <select
                        value={filterIndustry}
                        onChange={(e) => setFilterIndustry(e.target.value)}
                        style={{
                            padding: '10px 16px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            outline: 'none'
                        }}
                    >
                        <option value="all">All Industries</option>
                        {industries.filter(i => i !== 'all').map(industry => (
                            <option key={industry} value={industry}>{industry}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Companies Grid */}
            {filteredCompanies.length === 0 ? (
                <div style={{
                    backgroundColor: 'white',
                    padding: '60px',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>No companies found</h3>
                    <p style={{ margin: 0, color: '#64748b' }}>
                        {searchTerm || filterIndustry !== 'all'
                            ? 'Try adjusting your search or filter criteria'
                            : 'No companies have been created yet'}
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: '20px'
                }}>
                    {filteredCompanies.map((company) => (
                        <div
                            key={company.id}
                            onClick={() => navigate(`/companies/${company.id}`)}
                            style={{
                                backgroundColor: 'white',
                                padding: '24px',
                                borderRadius: '12px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                border: '1px solid #e2e8f0',
                                transition: 'all 0.2s',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            {/* Company Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px',
                                    fontWeight: '700',
                                    color: 'white'
                                }}>
                                    {company.name?.charAt(0)?.toUpperCase() || 'C'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{
                                        margin: '0 0 4px 0',
                                        fontSize: '18px',
                                        fontWeight: '700',
                                        color: '#1e293b',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {company.name}
                                    </h3>
                                    {company.industry && (
                                        <span style={{
                                            fontSize: '12px',
                                            color: '#64748b',
                                            backgroundColor: '#f1f5f9',
                                            padding: '2px 8px',
                                            borderRadius: '4px'
                                        }}>
                                            {company.industry}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Company Description */}
                            {company.description && (
                                <p style={{
                                    margin: '0 0 16px 0',
                                    fontSize: '14px',
                                    color: '#64748b',
                                    lineHeight: '1.5',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}>
                                    {company.description}
                                </p>
                            )}

                            {/* Company Stats */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '12px',
                                marginBottom: '16px'
                            }}>
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '8px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>
                                        {company.memberCount}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                                        Members
                                    </div>
                                </div>
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '8px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                                        {company.foundedYear || 'N/A'}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                                        Founded
                                    </div>
                                </div>
                            </div>

                            {/* Company Details */}
                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                                {company.owner && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        <span style={{ fontSize: '13px', color: '#64748b' }}>
                                            Owner: <strong style={{ color: '#1e293b' }}>{company.owner.name}</strong>
                                        </span>
                                    </div>
                                )}
                                {company.companySize && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                        </svg>
                                        <span style={{ fontSize: '13px', color: '#64748b' }}>
                                            Size: <strong style={{ color: '#1e293b' }}>{company.companySize}</strong>
                                        </span>
                                    </div>
                                )}
                                {company.city && company.country && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                            <circle cx="12" cy="10" r="3"></circle>
                                        </svg>
                                        <span style={{ fontSize: '13px', color: '#64748b' }}>
                                            {company.city}, {company.country}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Layout>
    );
};

export default CompanyList;
