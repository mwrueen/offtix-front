import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeAPI } from '../services/api';
import { useCompany } from '../context/CompanyContext';
import { getCookie } from '../utils/cookies';
import Layout from './Layout';
import DeleteConfirmModal from './common/DeleteConfirmModal';

// ─── Currency helper ───────────────────────────────────────────────────────
const CURRENCY_SYMBOLS = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$',
  CHF: 'CHF', CNY: '¥', INR: '₹', SGD: 'S$', HKD: 'HK$', NZD: 'NZ$',
  SEK: 'kr', NOK: 'kr', DKK: 'kr', MXN: 'MX$', BRL: 'R$', ZAR: 'R',
  AED: 'د.إ', SAR: '﷼',
};

const fmtDate = (d, opts = { year: 'numeric', month: 'long', day: 'numeric' }) =>
  d ? new Date(d).toLocaleDateString('en-US', opts) : '—';

// ─── CV Section wrapper ───────────────────────────────────────────────────
const CVSection = ({ title, icon, children, style = {} }) => (
  <div style={{ marginBottom: '28px', ...style }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      marginBottom: '14px', paddingBottom: '8px',
      borderBottom: '2px solid #e2e8f0',
    }}>
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <h3 style={{
        margin: 0, fontSize: '15px', fontWeight: '700',
        color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.8px'
      }}>
        {title}
      </h3>
    </div>
    {children}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────
const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useCompany();
  const selectedCompany = state.selectedCompany;
  const cvRef = useRef(null);

  const [employee, setEmployee] = useState(null);
  const [company, setCompany] = useState(null);
  const [designations, setDesignations] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // modals
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showDesignationModal, setShowDesignationModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  // form state
  const [newSalary, setNewSalary] = useState('');
  const [salaryReason, setSalaryReason] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [selectedManager, setSelectedManager] = useState('');

  const currSym = CURRENCY_SYMBOLS[company?.currency] || '$';

  // ── Data fetching ────────────────────────────────────────────────────────
  useEffect(() => {
    if (selectedCompany && selectedCompany.id !== 'personal') fetchEmployeeDetails();
    else navigate('/overview');
  }, [selectedCompany, id]);

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      const res = await employeeAPI.getById(selectedCompany.id, id);
      setEmployee(res.data.employee);
      setCompany(res.data.company);
      setDesignations(res.data.designations || []);
      setNewDesignation(res.data.employee.designation);
      setSelectedManager(res.data.employee.reportsTo || '');

      const token = getCookie('authToken');
      const orgRes = await fetch(`/api/companies/${selectedCompany.id}/organogram`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (orgRes.ok) {
        const orgData = await orgRes.json();
        setAllEmployees(orgData.employees || []);
      }
    } catch {
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleUpdateSalary = async () => {
    try {
      await employeeAPI.updateSalary(selectedCompany.id, id, parseFloat(newSalary), salaryReason);
      setShowSalaryModal(false); setNewSalary(''); setSalaryReason('');
      fetchEmployeeDetails();
    } catch { alert('Failed to update salary'); }
  };

  const handleUpdateDesignation = async () => {
    try {
      await employeeAPI.updateDesignation(selectedCompany.id, id, newDesignation);
      setShowDesignationModal(false); fetchEmployeeDetails();
    } catch { alert('Failed to update designation'); }
  };

  const handleUpdateManager = async () => {
    try {
      const token = getCookie('authToken');
      const res = await fetch(`/api/companies/${selectedCompany.id}/reporting-manager`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: employee.memberId, reportsTo: selectedManager || null }),
      });
      if (res.ok) { setShowManagerModal(false); fetchEmployeeDetails(); }
      else { const d = await res.json(); alert(d.message || 'Failed to update manager'); }
    } catch { alert('Failed to update manager'); }
  };

  const handleRemoveEmployee = async () => {
    try { await employeeAPI.remove(selectedCompany.id, id); navigate('/employees'); }
    catch { alert('Failed to remove employee'); }
  };

  // ── PDF Export ───────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    if (!cvRef.current) return;
    setExporting(true);
    try {
      // Dynamically import html2canvas + jsPDF (already in package.json via html2canvas)
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(cvRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const A4_W = 210;   // mm
      const A4_H = 297;
      const pxPerMm = canvas.width / A4_W;
      const docH_mm = canvas.height / pxPerMm;

      // Build PDF page-by-page using canvas slicing
      const pages = Math.ceil(docH_mm / A4_H);
      const pageH_px = A4_H * pxPerMm;

      // We'll build a simple multi-page PDF via data URLs
      // Use browser print as fallback if jsPDF not available
      const printWindow = window.open('', '_blank');
      const imgEl = `<img src="${imgData}" style="width:100%;display:block;page-break-inside:avoid;" />`;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${employee.name} – CV</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: white; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              @page { margin: 0; size: A4; }
            }
          </style>
        </head>
        <body>${imgEl}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(() => window.close(), 1000);
          };
        </script>
        </body></html>
      `);
      printWindow.document.close();
    } catch (e) {
      console.error('Export error', e);
      alert('PDF export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // ── Loading/empty ────────────────────────────────────────────────────────
  if (loading) return (
    <Layout>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Skeleton */}
        <div style={{ background: 'linear-gradient(135deg,#1e293b,#334155)', borderRadius: '20px', padding: '40px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            <div>
              <div style={{ width: '200px', height: '28px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', marginBottom: '12px' }} />
              <div style={{ width: '140px', height: '18px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px' }} />
            </div>
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '28px', marginBottom: '16px' }}>
            <div style={{ width: '120px', height: '16px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '20px' }} />
            <div style={{ width: '80%', height: '13px', background: '#f8fafc', borderRadius: '4px', marginBottom: '10px' }} />
            <div style={{ width: '60%', height: '13px', background: '#f8fafc', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    </Layout>
  );

  if (!employee) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>😔</div>
        <h2 style={{ margin: '0 0 12px', color: '#1e293b' }}>Employee Not Found</h2>
        <button onClick={() => navigate('/employees')} style={{
          padding: '12px 28px', background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
          color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer',
          fontSize: '15px', fontWeight: '600',
        }}>← Back to Employees</button>
      </div>
    </Layout>
  );

  const profile = employee.profile || {};
  const managerName = allEmployees.find(e => e.id === employee.reportsTo)?.name;
  const joinedYears = employee.joinedAt
    ? Math.floor((Date.now() - new Date(employee.joinedAt)) / (1000 * 60 * 60 * 24 * 365))
    : 0;

  return (
    <Layout>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* ── Top action bar (NOT printed) ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '28px',
        }} className="no-print">
          <button onClick={() => navigate('/employees')} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 18px', background: 'white', color: '#475569',
            border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer',
            fontSize: '14px', fontWeight: '600', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}
          >
            ← Back
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            {/* Admin actions */}
            {!employee.isOwner && (
              <>
                <button onClick={() => setShowDesignationModal(true)} style={{
                  padding: '10px 16px', background: 'white', color: '#475569',
                  border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '600', transition: 'all 0.2s',
                }}>✏️ Designation</button>
                <button onClick={() => setShowSalaryModal(true)} style={{
                  padding: '10px 16px', background: 'white', color: '#475569',
                  border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '600', transition: 'all 0.2s',
                }}>💰 Salary</button>
                <button onClick={() => setShowManagerModal(true)} style={{
                  padding: '10px 16px', background: 'white', color: '#475569',
                  border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '600', transition: 'all 0.2s',
                }}>👤 Manager</button>
              </>
            )}

            {/* Export PDF */}
            <button onClick={handleExportPDF} disabled={exporting} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px',
              background: exporting ? '#94a3b8' : 'linear-gradient(135deg,#6366f1,#4f46e5)',
              color: 'white', border: 'none', borderRadius: '10px',
              cursor: exporting ? 'not-allowed' : 'pointer',
              fontSize: '13px', fontWeight: '600',
              boxShadow: exporting ? 'none' : '0 4px 14px rgba(99,102,241,0.35)',
              transition: 'all 0.2s',
            }}>
              {exporting ? '⏳ Generating...' : '⬇️ Export PDF'}
            </button>

            {!employee.isOwner && (
              <button onClick={() => setShowRemoveModal(true)} style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                color: 'white', border: 'none', borderRadius: '10px',
                cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                boxShadow: '0 4px 12px rgba(239,68,68,0.3)', transition: 'all 0.2s',
              }}>🗑 Remove</button>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            CV DOCUMENT — this section is exported to PDF
        ══════════════════════════════════════════════ */}
        <div ref={cvRef} style={{
          background: '#ffffff', borderRadius: '20px',
          boxShadow: '0 4px 32px rgba(0,0,0,0.1)', overflow: 'hidden', fontFamily: '"Segoe UI", system-ui, sans-serif'
        }}>

          {/* ─── CV Header / Hero ─── */}
          <div style={{
            background: profile.coverPhoto
              ? `linear-gradient(rgba(15,23,42,0.72),rgba(15,23,42,0.72)) center/cover, url(${profile.coverPhoto}) center/cover`
              : 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e293b 100%)',
            padding: '48px 48px 40px',
            color: 'white',
            position: 'relative',
          }}>
            {/* company watermark */}
            {company?.name && (
              <div style={{
                position: 'absolute', top: '20px', right: '28px',
                fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.45)',
                textTransform: 'uppercase', letterSpacing: '1.5px',
              }}>
                {company.name}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '32px' }}>
              {/* Avatar */}
              <div style={{
                width: '110px', height: '110px', borderRadius: '16px',
                border: '3px solid rgba(255,255,255,0.3)',
                flexShrink: 0, overflow: 'hidden',
                background: profile.profilePicture ? 'none' : 'linear-gradient(135deg,#3b82f6,#2563eb)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
                {profile.profilePicture
                  ? <img src={profile.profilePicture} alt={employee.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '42px', fontWeight: '800', color: 'white' }}>
                    {employee.name.charAt(0).toUpperCase()}
                  </span>
                }
              </div>

              {/* Name block */}
              <div style={{ flex: 1 }}>
                <h1 style={{
                  margin: '0 0 6px', fontSize: '34px', fontWeight: '800',
                  letterSpacing: '-0.5px', lineHeight: 1
                }}>
                  {employee.name}
                </h1>
                <div style={{ fontSize: '16px', color: '#93c5fd', fontWeight: '600', marginBottom: '14px' }}>
                  {profile.title || employee.designation}
                </div>

                {/* Contact chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '13px' }}>
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    background: 'rgba(255,255,255,0.12)', padding: '5px 12px', borderRadius: '20px'
                  }}>
                    ✉ {employee.email}
                  </span>
                  {profile.phone && (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      background: 'rgba(255,255,255,0.12)', padding: '5px 12px', borderRadius: '20px'
                    }}>
                      📞 {profile.phone}
                    </span>
                  )}
                  {profile.location && (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      background: 'rgba(255,255,255,0.12)', padding: '5px 12px', borderRadius: '20px'
                    }}>
                      📍 {profile.location}
                    </span>
                  )}
                  {(profile.linkedin || profile.website) && (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      background: 'rgba(255,255,255,0.12)', padding: '5px 12px', borderRadius: '20px'
                    }}>
                      🔗 {profile.linkedin || profile.website}
                    </span>
                  )}
                </div>
              </div>

              {/* Role badge */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  background: employee.isOwner
                    ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                    : 'linear-gradient(135deg,#3b82f6,#2563eb)',
                  padding: '8px 18px', borderRadius: '10px',
                  fontSize: '13px', fontWeight: '700', letterSpacing: '0.3px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}>
                  {employee.designation}
                </div>
                {joinedYears > 0 && (
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginTop: '8px' }}>
                    {joinedYears} year{joinedYears !== 1 ? 's' : ''} tenure
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── Accent bar ─── */}
          <div style={{ height: '4px', background: 'linear-gradient(90deg,#3b82f6,#6366f1,#8b5cf6,#ec4899)' }} />

          {/* ─── Main CV body (two column) ─── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', minHeight: '600px' }}>

            {/* ── Left column ── */}
            <div style={{ padding: '36px 36px 36px 48px', borderRight: '1px solid #f1f5f9' }}>

              {/* Professional Summary */}
              {profile.summary && (
                <CVSection title="Professional Summary" icon="📝">
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.75', color: '#374151' }}>
                    {profile.summary}
                  </p>
                </CVSection>
              )}

              {/* Experience / Work History (if any) */}
              {profile.experience && profile.experience.length > 0 && (
                <CVSection title="Work Experience" icon="💼">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {profile.experience.map((exp, i) => (
                      <div key={i} style={{ paddingLeft: '16px', borderLeft: '3px solid #3b82f6' }}>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{exp.title}</div>
                        <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '600', margin: '2px 0 4px' }}>
                          {exp.company}{exp.location ? ` · ${exp.location}` : ''}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                          {fmtDate(exp.startDate, { month: 'short', year: 'numeric' })} –{' '}
                          {exp.current ? 'Present' : fmtDate(exp.endDate, { month: 'short', year: 'numeric' })}
                        </div>
                        {exp.description && (
                          <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CVSection>
              )}

              {/* Education */}
              {profile.education && profile.education.length > 0 && (
                <CVSection title="Education" icon="🎓">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {profile.education.map((edu, i) => (
                      <div key={i} style={{ paddingLeft: '16px', borderLeft: '3px solid #8b5cf6' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{edu.degree}</div>
                        <div style={{ fontSize: '13px', color: '#8b5cf6', fontWeight: '600', margin: '2px 0 4px' }}>
                          {edu.institution}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {edu.field && `${edu.field} · `}
                          {fmtDate(edu.startDate, { year: 'numeric' })} –{' '}
                          {edu.current ? 'Present' : fmtDate(edu.endDate, { year: 'numeric' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CVSection>
              )}

              {/* Employment info (current company) */}
              <CVSection title="Current Position" icon="🏢">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {[
                    { label: 'Company', value: company?.name },
                    { label: 'Designation', value: employee.designation },
                    { label: 'Joined', value: fmtDate(employee.joinedAt) },
                    { label: 'Reports To', value: managerName || 'No Manager' },
                    { label: 'Department', value: profile.department || '—' },
                    { label: 'Employee ID', value: employee.memberId || '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{
                        fontSize: '11px', fontWeight: '700', color: '#94a3b8',
                        textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px'
                      }}>
                        {label}
                      </div>
                      <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </CVSection>

              {/* Salary history (for admins — shown in PDF) */}
              {!employee.isOwner && employee.salaryHistory?.length > 0 && (
                <CVSection title="Salary History" icon="💰">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Current */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 16px', background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
                      border: '1px solid #86efac', borderRadius: '10px',
                    }}>
                      <div>
                        <div style={{
                          fontSize: '11px', color: '#16a34a', fontWeight: '700',
                          textTransform: 'uppercase', letterSpacing: '0.5px'
                        }}>Current Salary</div>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#15803d' }}>
                          {currSym}{employee.currentSalary?.toLocaleString() || '0'}
                        </div>
                      </div>
                      <span style={{ fontSize: '24px' }}>💵</span>
                    </div>

                    {/* History */}
                    {employee.salaryHistory.slice().reverse().slice(0, 5).map((h, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 14px', background: '#f8fafc',
                        border: '1px solid #e2e8f0', borderRadius: '8px',
                      }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                            {currSym}{h.amount?.toLocaleString()}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{h.reason || 'Salary update'}</div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {fmtDate(h.effectiveDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CVSection>
              )}
            </div>

            {/* ── Right sidebar ── */}
            <div style={{ padding: '36px 32px 36px 28px', background: '#f8fafc' }}>

              {/* Skills */}
              {profile.skills?.length > 0 && (
                <CVSection title="Skills" icon="⚡">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {profile.skills.map((skill, i) => (
                      <span key={i} style={{
                        background: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
                        color: '#1d4ed8', padding: '5px 12px', borderRadius: '20px',
                        fontSize: '12px', fontWeight: '600',
                        border: '1px solid #bfdbfe',
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </CVSection>
              )}

              {/* Languages */}
              {profile.languages?.length > 0 && (
                <CVSection title="Languages" icon="🌐">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {profile.languages.map((lang, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                          {typeof lang === 'string' ? lang : lang.name}
                        </span>
                        {lang.level && (
                          <span style={{
                            fontSize: '11px', color: '#64748b',
                            background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px'
                          }}>
                            {lang.level}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CVSection>
              )}

              {/* Certifications */}
              {profile.certifications?.length > 0 && (
                <CVSection title="Certifications" icon="🏆">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {profile.certifications.map((cert, i) => (
                      <div key={i} style={{
                        padding: '10px 12px',
                        background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px'
                      }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                          {typeof cert === 'string' ? cert : cert.name}
                        </div>
                        {cert.issuer && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{cert.issuer}</div>}
                      </div>
                    ))}
                  </div>
                </CVSection>
              )}

              {/* Contact & Links */}
              <CVSection title="Contact" icon="📬">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { icon: '✉️', label: employee.email },
                    profile.phone && { icon: '📞', label: profile.phone },
                    profile.location && { icon: '📍', label: profile.location },
                    profile.linkedin && { icon: '🔗', label: profile.linkedin },
                    profile.website && { icon: '🌐', label: profile.website },
                  ].filter(Boolean).map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>{item.icon}</span>
                      <span style={{ fontSize: '12px', color: '#475569', wordBreak: 'break-word', lineHeight: '1.4' }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CVSection>

              {/* Interests / Hobbies */}
              {profile.interests?.length > 0 && (
                <CVSection title="Interests" icon="🎯">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {profile.interests.map((interest, i) => (
                      <span key={i} style={{
                        background: 'white', color: '#475569', padding: '4px 10px',
                        borderRadius: '16px', fontSize: '11px', fontWeight: '600',
                        border: '1px solid #e2e8f0',
                      }}>{interest}</span>
                    ))}
                  </div>
                </CVSection>
              )}

              {/* Document footer */}
              <div style={{
                marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0',
                fontSize: '10px', color: '#94a3b8', textAlign: 'center'
              }}>
                <div>Generated on {fmtDate(new Date())}</div>
                <div style={{ marginTop: '2px' }}>{company?.name}</div>
              </div>
            </div>
          </div>
        </div>
        {/* ── End CV document ── */}
      </div>

      {/* ════════════════════════════════════
          MODALS
      ════════════════════════════════════ */}

      {/* Salary Modal */}
      {showSalaryModal && (
        <Modal title="Update Salary" onClose={() => { setShowSalaryModal(false); setNewSalary(''); setSalaryReason(''); }}>
          <ModalField label="New Salary Amount">
            <input type="number" value={newSalary} onChange={e => setNewSalary(e.target.value)}
              placeholder="Enter amount" style={inputStyle} />
          </ModalField>
          <ModalField label="Reason (Optional)">
            <input type="text" value={salaryReason} onChange={e => setSalaryReason(e.target.value)}
              placeholder="e.g., Annual increment, Promotion" style={inputStyle} />
          </ModalField>
          <ModalFooter>
            <ModalBtn onClick={() => { setShowSalaryModal(false); setNewSalary(''); setSalaryReason(''); }}>Cancel</ModalBtn>
            <ModalBtn primary onClick={handleUpdateSalary} disabled={!newSalary}>Update</ModalBtn>
          </ModalFooter>
        </Modal>
      )}

      {/* Designation Modal */}
      {showDesignationModal && (
        <Modal title="Change Designation" onClose={() => setShowDesignationModal(false)}>
          <ModalField label="Select Designation">
            <select value={newDesignation} onChange={e => setNewDesignation(e.target.value)} style={inputStyle}>
              {designations.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
            </select>
          </ModalField>
          <ModalFooter>
            <ModalBtn onClick={() => setShowDesignationModal(false)}>Cancel</ModalBtn>
            <ModalBtn primary onClick={handleUpdateDesignation}>Update</ModalBtn>
          </ModalFooter>
        </Modal>
      )}

      {/* Manager Modal */}
      {showManagerModal && (
        <Modal title="Set Reporting Manager" onClose={() => setShowManagerModal(false)}>
          <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '14px' }}>
            Select who {employee?.name} reports to
          </p>
          <ModalField label="Select Manager">
            <select value={selectedManager} onChange={e => setSelectedManager(e.target.value)} style={inputStyle}>
              <option value="">No Manager (Top Level)</option>
              {allEmployees
                .filter(e => e.id !== id)
                .sort((a, b) => (a.level || 5) - (b.level || 5))
                .map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} - {emp.designation} (Level {emp.level || 5})
                  </option>
                ))}
            </select>
          </ModalField>
          <ModalFooter>
            <ModalBtn onClick={() => setShowManagerModal(false)}>Cancel</ModalBtn>
            <ModalBtn primary onClick={handleUpdateManager}>Update</ModalBtn>
          </ModalFooter>
        </Modal>
      )}

      {/* Remove confirmation */}
      <DeleteConfirmModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={handleRemoveEmployee}
        title="Remove Employee"
        message={`Are you sure you want to remove ${employee?.name} from ${company?.name}?`}
      />
    </Layout>
  );
};

// ─── Tiny reusable modal helpers ─────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
  borderRadius: '8px', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
};

const Modal = ({ title, children, onClose }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    backdropFilter: 'blur(4px)',
  }}>
    <div style={{
      background: 'white', borderRadius: '16px', padding: '32px',
      width: '100%', maxWidth: '420px',
      boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
      animation: 'modalIn 0.2s ease-out',
    }}>
      <style>{`@keyframes modalIn { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{title}</h3>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', fontSize: '20px',
          color: '#94a3b8', cursor: 'pointer', lineHeight: 1, padding: '2px',
        }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

const ModalField = ({ label, children }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{
      display: 'block', fontSize: '13px', fontWeight: '600',
      color: '#374151', marginBottom: '8px'
    }}>{label}</label>
    {children}
  </div>
);

const ModalFooter = ({ children }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
    {children}
  </div>
);

const ModalBtn = ({ children, onClick, primary, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: '10px 22px',
    background: primary
      ? (disabled ? '#cbd5e1' : 'linear-gradient(135deg,#3b82f6,#2563eb)')
      : 'white',
    color: primary ? 'white' : '#374151',
    border: primary ? 'none' : '1px solid #d1d5db',
    borderRadius: '9px', cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '14px', fontWeight: '600',
    boxShadow: primary && !disabled ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
    transition: 'all 0.2s',
  }}>{children}</button>
);

export default EmployeeDetails;
