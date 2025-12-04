import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyAPI } from '../../services/api';
import { useCompany } from '../../context/CompanyContext';
import Layout from '../Layout';

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const SummaryCard = ({ icon, label, value, color, isCurrency = false }) => (
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
          {isCurrency ? formatCurrency(value) : value}
        </div>
        <div style={{ fontSize: '13px', color: '#64748b' }}>{label}</div>
      </div>
    </div>
  </div>
);

const EmployeeCard = ({ item, isExpanded, onToggle, formatDate, getDaysRemaining, navigate }) => {
  const { employee, tasks, costs } = item;

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      overflow: 'hidden'
    }}>
      {/* Employee Header */}
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
            {employee.avatar ? (
              <img src={employee.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              employee.name?.charAt(0)?.toUpperCase() || '?'
            )}
          </div>
          <div>
            <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {employee.name}
              {employee.isOwner && (
                <span style={{ fontSize: '11px', backgroundColor: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '12px' }}>Owner</span>
              )}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              {employee.designation} • {employee.email}
              {employee.hourlyRate > 0 && (
                <span style={{ marginLeft: '8px', color: '#059669' }}>
                  • {formatCurrency(employee.hourlyRate)}/hr
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Cost Summary */}
          {costs && costs.totalTaskCost > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#0f766e' }}>
                {formatCurrency(costs.totalTaskCost)}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Task Cost</div>
            </div>
          )}

          {/* Task Summary Pills */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '500' }}>
              {tasks.totalActive} active
            </span>
            {tasks.totalOverdue > 0 && (
              <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '500' }}>
                {tasks.totalOverdue} overdue
              </span>
            )}
            <span style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '500' }}>
              {tasks.totalCompleted} done
            </span>
          </div>

          {/* Expand Arrow */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {/* Tasks List (Expanded) */}
      {isExpanded && (
        <div style={{ borderTop: '1px solid #e5e7eb', padding: '16px 20px' }}>
          {tasks.total === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>No tasks assigned</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Overdue Tasks */}
              {tasks.overdue.length > 0 && (
                <TaskSection title="⚠️ Overdue Tasks" tasks={tasks.overdue} formatDate={formatDate} getDaysRemaining={getDaysRemaining} isOverdue navigate={navigate} />
              )}
              {/* Active Tasks */}
              {tasks.active.length > 0 && (
                <TaskSection title="📋 Active Tasks" tasks={tasks.active} formatDate={formatDate} getDaysRemaining={getDaysRemaining} navigate={navigate} />
              )}
              {/* Completed Tasks (show only last 3) */}
              {tasks.completed.length > 0 && (
                <TaskSection title="✅ Recently Completed" tasks={tasks.completed.slice(0, 3)} formatDate={formatDate} getDaysRemaining={getDaysRemaining} isCompleted navigate={navigate} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TaskSection = ({ title, tasks, formatDate, getDaysRemaining, isOverdue, isCompleted, navigate }) => (
  <div style={{ marginBottom: '16px' }}>
    <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>{title}</div>
    {tasks.map(task => {
      const daysRemaining = getDaysRemaining(task.dueDate);
      return (
        <div
          key={task._id}
          onClick={() => navigate(`/projects/${task.project?._id}/tasks`)}
          style={{
            padding: '12px 16px',
            backgroundColor: isOverdue ? '#fef2f2' : isCompleted ? '#f0fdf4' : '#f8fafc',
            borderRadius: '8px',
            marginBottom: '6px',
            cursor: 'pointer',
            border: `1px solid ${isOverdue ? '#fecaca' : isCompleted ? '#bbf7d0' : '#e5e7eb'}`,
            transition: 'transform 0.1s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '500', color: '#1e293b', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {task.title}
                {task.cost > 0 && (
                  <span style={{
                    fontSize: '11px',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontWeight: '600'
                  }}>
                    {formatCurrency(task.cost)}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span>📁 {task.project?.title || 'Unknown Project'}</span>
                {task.startDate && <span>📅 Started: {formatDate(task.startDate)}</span>}
                {task.dueDate && <span>🎯 Due: {formatDate(task.dueDate)}</span>}
                {task.durationHours > 0 && <span>⏱️ {task.durationHours}h</span>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              {task.status && (
                <span style={{
                  backgroundColor: task.status.color || '#6b7280',
                  color: '#fff',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>{task.status.name}</span>
              )}
              {!isCompleted && daysRemaining !== null && (
                <span style={{
                  fontSize: '11px',
                  color: daysRemaining < 0 ? '#dc2626' : daysRemaining <= 2 ? '#f59e0b' : '#10b981',
                  fontWeight: '500'
                }}>
                  {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : daysRemaining === 0 ? 'Due today' : `${daysRemaining} days left`}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

// Running Tasks Table Component
const RunningTasksTable = ({ workforceData, formatDate, getDaysRemaining, navigate }) => {
  // Collect all running (active + overdue) tasks across all employees
  const runningTasks = [];

  workforceData?.workforce?.forEach(item => {
    const { employee, tasks } = item;

    // Add active tasks
    tasks.active?.forEach(task => {
      runningTasks.push({
        ...task,
        employee: employee,
        isOverdue: false
      });
    });

    // Add overdue tasks
    tasks.overdue?.forEach(task => {
      runningTasks.push({
        ...task,
        employee: employee,
        isOverdue: true
      });
    });
  });

  // Sort by due date (overdue first, then by due date)
  runningTasks.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  if (runningTasks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
        <p>No running tasks at the moment</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      {/* Table Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px',
        padding: '12px 20px',
        backgroundColor: '#f8fafc',
        borderBottom: '2px solid #e5e7eb',
        fontWeight: '600',
        fontSize: '12px',
        color: '#64748b',
        textTransform: 'uppercase'
      }}>
        <div>Task</div>
        <div>Assignee</div>
        <div>Start Date</div>
        <div>Due Date</div>
        <div>Status</div>
        <div style={{ textAlign: 'right' }}>Cost</div>
      </div>

      {/* Table Rows */}
      {runningTasks.map((task, index) => {
        const daysRemaining = getDaysRemaining(task.dueDate);
        return (
          <div
            key={`${task._id}-${index}`}
            onClick={() => navigate(`/projects/${task.project?._id}/tasks`)}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px',
              padding: '14px 20px',
              borderBottom: '1px solid #f1f5f9',
              cursor: 'pointer',
              backgroundColor: task.isOverdue ? '#fef2f2' : '#fff',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = task.isOverdue ? '#fee2e2' : '#f8fafc'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = task.isOverdue ? '#fef2f2' : '#fff'}
          >
            {/* Task Title & Project */}
            <div>
              <div style={{ fontWeight: '500', color: '#1e293b', marginBottom: '2px' }}>{task.title}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>📁 {task.project?.title || 'Unknown Project'}</div>
            </div>

            {/* Assignee */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                {task.employee?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div style={{ fontSize: '13px', color: '#374151' }}>{task.employee?.name}</div>
            </div>

            {/* Start Date */}
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              {formatDate(task.startDate)}
            </div>

            {/* Due Date */}
            <div>
              <div style={{ fontSize: '13px', color: '#374151' }}>{formatDate(task.dueDate)}</div>
              {daysRemaining !== null && (
                <div style={{
                  fontSize: '11px',
                  color: daysRemaining < 0 ? '#dc2626' : daysRemaining <= 2 ? '#f59e0b' : '#10b981',
                  fontWeight: '500'
                }}>
                  {daysRemaining < 0 ? `${Math.abs(daysRemaining)}d overdue` : daysRemaining === 0 ? 'Today' : `${daysRemaining}d left`}
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              {task.status && (
                <span style={{
                  backgroundColor: task.status.color || '#6b7280',
                  color: '#fff',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '500',
                  display: 'inline-block'
                }}>{task.status.name}</span>
              )}
            </div>

            {/* Cost */}
            <div style={{ textAlign: 'right', fontWeight: '600', color: task.cost > 0 ? '#059669' : '#9ca3af' }}>
              {formatCurrency(task.cost)}
            </div>
          </div>
        );
      })}

      {/* Total Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px',
        padding: '14px 20px',
        backgroundColor: '#f0fdf4',
        borderTop: '2px solid #e5e7eb',
        fontWeight: '600'
      }}>
        <div style={{ color: '#1e293b' }}>Total ({runningTasks.length} tasks)</div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div style={{ textAlign: 'right', color: '#059669' }}>
          {formatCurrency(runningTasks.reduce((sum, t) => sum + (t.cost || 0), 0))}
        </div>
      </div>
    </div>
  );
};

const Workforce = () => {
  const navigate = useNavigate();
  const { state: companyState } = useCompany();
  const [workforceData, setWorkforceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [filter, setFilter] = useState('all'); // all, with-tasks, overdue
  const [viewMode, setViewMode] = useState('tasks'); // 'employees' or 'tasks'

  useEffect(() => {
    if (companyState.selectedCompany?.id && companyState.selectedCompany.id !== 'personal') {
      fetchWorkforce();
    } else {
      setLoading(false);
      setError('Please select a company to view workforce');
    }
  }, [companyState.selectedCompany]);

  const fetchWorkforce = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getWorkforce(companyState.selectedCompany.id);
      setWorkforceData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load workforce data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getFilteredWorkforce = () => {
    if (!workforceData?.workforce) return [];
    switch (filter) {
      case 'with-tasks':
        return workforceData.workforce.filter(w => w.tasks.total > 0);
      case 'overdue':
        return workforceData.workforce.filter(w => w.tasks.totalOverdue > 0);
      default:
        return workforceData.workforce;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
            <p style={{ color: '#6b7280' }}>Loading workforce data...</p>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ color: '#dc2626', marginBottom: '8px' }}>Access Denied</h2>
          <p style={{ color: '#6b7280' }}>{error}</p>
        </div>
      </Layout>
    );
  }

  const filteredWorkforce = getFilteredWorkforce();

  return (
    <Layout>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
            👥 Workforce Overview
          </h1>
          <p style={{ color: '#64748b' }}>
            Monitor employee tasks and workload for {workforceData?.company?.name}
          </p>
        </div>

        {/* Summary Cards - Tasks */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <SummaryCard icon="👥" label="Total Employees" value={workforceData?.summary?.totalEmployees || 0} color="#3b82f6" />
          <SummaryCard icon="📋" label="Active Tasks" value={workforceData?.summary?.totalActiveTasks || 0} color="#10b981" />
          <SummaryCard icon="⚠️" label="Overdue Tasks" value={workforceData?.summary?.totalOverdueTasks || 0} color="#ef4444" />
          <SummaryCard icon="✅" label="Completed Tasks" value={workforceData?.summary?.totalCompletedTasks || 0} color="#8b5cf6" />
        </div>

        {/* Cost Summary Cards */}
        {workforceData?.costs && workforceData.costs.total > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <SummaryCard icon="💰" label="Total Task Cost" value={workforceData.costs.total || 0} color="#0f766e" isCurrency />
            <SummaryCard icon="⏳" label="Pending Cost" value={workforceData.costs.active || 0} color="#f59e0b" isCurrency />
            <SummaryCard icon="✅" label="Completed Cost" value={workforceData.costs.completed || 0} color="#22c55e" isCurrency />
          </div>
        )}

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
            <button
              onClick={() => setViewMode('tasks')}
              style={{
                padding: '8px 20px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: viewMode === 'tasks' ? '#fff' : 'transparent',
                color: viewMode === 'tasks' ? '#1e293b' : '#64748b',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: viewMode === 'tasks' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              📋 Running Tasks
            </button>
            <button
              onClick={() => setViewMode('employees')}
              style={{
                padding: '8px 20px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: viewMode === 'employees' ? '#fff' : 'transparent',
                color: viewMode === 'employees' ? '#1e293b' : '#64748b',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: viewMode === 'employees' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              👥 By Employee
            </button>
          </div>

          {/* Filter (only for employees view) */}
          {viewMode === 'employees' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'all', label: 'All', count: workforceData?.workforce?.length || 0 },
                { id: 'with-tasks', label: 'With Tasks', count: workforceData?.workforce?.filter(w => w.tasks.total > 0).length || 0 },
                { id: 'overdue', label: 'Overdue', count: workforceData?.workforce?.filter(w => w.tasks.totalOverdue > 0).length || 0 }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  style={{
                    padding: '6px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: filter === tab.id ? '#3b82f6' : '#f1f5f9',
                    color: filter === tab.id ? '#fff' : '#64748b',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content based on view mode */}
        {viewMode === 'tasks' ? (
          <RunningTasksTable
            workforceData={workforceData}
            formatDate={formatDate}
            getDaysRemaining={getDaysRemaining}
            navigate={navigate}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredWorkforce.map(item => (
              <EmployeeCard
                key={item.employee._id}
                item={item}
                isExpanded={expandedEmployee === item.employee._id}
                onToggle={() => setExpandedEmployee(expandedEmployee === item.employee._id ? null : item.employee._id)}
                formatDate={formatDate}
                getDaysRemaining={getDaysRemaining}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Workforce;
