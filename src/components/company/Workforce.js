import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyAPI } from '../../services/api';
import { useCompany } from '../../context/CompanyContext';
import Layout from '../Layout';
import PageHeader from '../PageHeader'; // Note the path difference

const formatCurrency = (amount, currencyCode = 'USD') => {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const SummaryCard = ({ icon, label, value, color, isCurrency = false, currencyCode = 'USD' }) => (
  <div style={{
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        backgroundColor: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px'
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
          {isCurrency ? formatCurrency(value, currencyCode) : value}
        </div>
        <div style={{ fontSize: '13px', color: '#64748b' }}>{label}</div>
      </div>
    </div>
  </div>
);

const EmployeeCard = ({ item, isExpanded, onToggle, formatDate, getDaysRemaining, navigate, currencyCode }) => {
  const { employee, tasks, costs } = item;

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      overflow: 'hidden'
    }}>
      <div
        onClick={onToggle}
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          backgroundColor: isExpanded ? '#f8fafc' : '#fff',
          transition: 'background-color 0.2s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            fontSize: '18px'
          }}>
            {employee.avatar ? <img src={employee.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : employee.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '16px' }}>{employee.name}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>{employee.designation}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {costs && costs.totalTaskCost > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#0f766e' }}>{formatCurrency(costs.totalTaskCost, currencyCode)}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Cost</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '4px 12px', borderRadius: '12px', fontSize: '12px' }}>{tasks.totalActive} active</span>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div style={{ borderTop: '1px solid #e5e7eb', padding: '16px 20px' }}>
          {tasks.total === 0 ? <p style={{ textAlign: 'center', color: '#64748b' }}>No tasks</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tasks.active.map(task => (
                <div key={task._id} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontWeight: '500' }}>{task.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{task.project?.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const RunningTasksTable = ({ workforceData, formatDate, getDaysRemaining, navigate, currencyCode }) => {
  const runningTasks = [];
  workforceData?.workforce?.forEach(item => {
    item.tasks.active?.forEach(task => runningTasks.push({ ...task, employee: item.employee, isOverdue: false }));
    item.tasks.overdue?.forEach(task => runningTasks.push({ ...task, employee: item.employee, isOverdue: true }));
  });

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f8fafc' }}>
          <tr>
            <th style={{ padding: '12px 20px', textAlign: 'left' }}>Task</th>
            <th style={{ padding: '12px 20px', textAlign: 'left' }}>Assignee</th>
            <th style={{ padding: '12px 20px', textAlign: 'right' }}>Cost</th>
          </tr>
        </thead>
        <tbody>
          {runningTasks.map((task, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '14px 20px' }}>{task.title}</td>
              <td style={{ padding: '14px 20px' }}>{task.employee?.name}</td>
              <td style={{ padding: '14px 20px', textAlign: 'right' }}>{formatCurrency(task.cost, currencyCode)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Workforce = () => {
  const navigate = useNavigate();
  const { state: companyState } = useCompany();
  const companyCurrency = companyState?.selectedCompany?.currency || 'USD';
  const [workforceData, setWorkforceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('tasks');

  useEffect(() => {
    if (companyState.selectedCompany?.id && companyState.selectedCompany.id !== 'personal') {
      fetchWorkforce();
    } else {
      setLoading(false);
      setError('Select a company');
    }
  }, [companyState.selectedCompany]);

  const fetchWorkforce = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getWorkforce(companyState.selectedCompany.id);
      setWorkforceData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '-';
  const getDaysRemaining = (d) => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null;

  if (loading) return <Layout><div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div></Layout>;
  if (error) return <Layout><div style={{ padding: '40px', textAlign: 'center' }}>{error}</div></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Workforce Overview"
        subtitle={`Monitor tasks and workload for ${workforceData?.company?.name}`}
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        }
        actions={
          <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '10px' }}>
            <button onClick={() => setViewMode('tasks')} style={{ padding: '8px 16px', background: viewMode === 'tasks' ? 'white' : 'transparent', color: viewMode === 'tasks' ? '#1e293b' : 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Tasks</button>
            <button onClick={() => setViewMode('employees')} style={{ padding: '8px 16px', background: viewMode === 'employees' ? 'white' : 'transparent', color: viewMode === 'employees' ? '#1e293b' : 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Employees</button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <SummaryCard icon="👥" label="Employees" value={workforceData?.summary?.totalEmployees || 0} color="#3b82f6" />
        <SummaryCard icon="📋" label="Active" value={workforceData?.summary?.totalActiveTasks || 0} color="#10b981" />
        <SummaryCard icon="⚠️" label="Overdue" value={workforceData?.summary?.totalOverdueTasks || 0} color="#ef4444" />
        <SummaryCard icon="💰" label="Cost" value={workforceData?.costs?.total || 0} color="#0f766e" isCurrency currencyCode={companyCurrency} />
      </div>

      {viewMode === 'tasks' ? (
        <RunningTasksTable workforceData={workforceData} formatDate={formatDate} getDaysRemaining={getDaysRemaining} navigate={navigate} currencyCode={companyCurrency} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {workforceData?.workforce?.map(item => (
            <EmployeeCard key={item.employee._id} item={item} isExpanded={expandedEmployee === item.employee._id} onToggle={() => setExpandedEmployee(expandedEmployee === item.employee._id ? null : item.employee._id)} formatDate={formatDate} getDaysRemaining={getDaysRemaining} navigate={navigate} currencyCode={companyCurrency} />
          ))}
        </div>
      )}
    </Layout>
  );
};

export default Workforce;
