import React, { useEffect, useState } from 'react';
import { projectAPI } from '../../services/api';

const AnalyticsTab = ({ projectId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [projectId]);

  const fetchAnalytics = async () => {
    try {
      const res = await projectAPI.getAnalytics(projectId);
      setAnalytics(res.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          margin: '0 auto 16px',
          animation: 'spin 1s linear infinite'
        }}></div>
        Loading analytics...
      </div>
    );
  }

  if (!analytics) {
    return <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No analytics data available</div>;
  }

  const getHealthColor = (status) => {
    const colors = {
      'healthy': { bg: '#dcfce7', text: '#166534', border: '#86efac' },
      'at-risk': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
      'critical': { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
      'completed': { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
      'on-hold': { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' }
    };
    return colors[status] || colors['at-risk'];
  };

  const healthColor = getHealthColor(analytics.health.status);

  return (
    <div>
      {/* Health Score Card */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '32px',
        boxShadow: '0 10px 40px rgba(59, 130, 246, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          transform: 'translate(30%, -30%)'
        }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ margin: '0 0 24px 0', color: '#ffffff', fontSize: '24px', fontWeight: '600' }}>
            Project Health
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '8px' }}>
                Health Score
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#ffffff' }}>
                {analytics.health.score}
                <span style={{ fontSize: '18px', marginLeft: '4px' }}>/100</span>
              </div>
            </div>

            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '8px' }}>
                Status
              </div>
              <div style={{
                display: 'inline-block',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: healthColor.bg,
                color: healthColor.text,
                border: `2px solid ${healthColor.border}`,
                textTransform: 'capitalize'
              }}>
                {analytics.health.status.replace('-', ' ')}
              </div>
            </div>

            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '8px' }}>
                Progress
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#ffffff' }}>
                {analytics.overview.progress}%
              </div>
            </div>

            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '8px' }}>
                Team Size
              </div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#ffffff' }}>
                {analytics.overview.teamSize}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Analytics */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #e5e7eb',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
          Timeline Progress
        </h3>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Timeline Completion</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
              {analytics.timeline.progress}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '12px',
            backgroundColor: '#e5e7eb',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(100, analytics.timeline.progress)}%`,
              height: '100%',
              background: analytics.timeline.isOverdue 
                ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Start Date</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
              {analytics.timeline.startDate ? new Date(analytics.timeline.startDate).toLocaleDateString() : 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>End Date</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
              {analytics.timeline.endDate ? new Date(analytics.timeline.endDate).toLocaleDateString() : 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Days Elapsed</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
              {analytics.timeline.daysElapsed}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Days Remaining</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: analytics.timeline.isOverdue ? '#ef4444' : '#1e293b' }}>
              {analytics.timeline.daysRemaining}
              {analytics.timeline.isOverdue && ' (Overdue)'}
            </div>
          </div>
        </div>
      </div>

      {/* Budget Analytics */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '2px solid #e5e7eb',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
          Budget Tracking
        </h3>
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Budget Utilization</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
              {analytics.budget.utilization}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '12px',
            backgroundColor: '#e5e7eb',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(100, analytics.budget.utilization)}%`,
              height: '100%',
              background: analytics.budget.isOverBudget
                ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                : analytics.budget.utilization > 80
                ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                : 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Budget</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
              {analytics.budget.currency} {analytics.budget.budgetAmount.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Actual Cost</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: analytics.budget.isOverBudget ? '#ef4444' : '#1e293b' }}>
              {analytics.budget.currency} {analytics.budget.actualCost.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Remaining</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: analytics.budget.remaining < 0 ? '#ef4444' : '#10b981' }}>
              {analytics.budget.currency} {analytics.budget.remaining.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Milestones */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #e5e7eb',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
            Milestones
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Total</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{analytics.milestones.total}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Completed</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#10b981' }}>{analytics.milestones.completed}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Delayed</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#ef4444' }}>{analytics.milestones.delayed}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Progress</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#3b82f6' }}>{analytics.milestones.progress}%</span>
            </div>
          </div>
        </div>

        {/* Risks */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #e5e7eb',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
            Risks
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Total</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{analytics.risks.total}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Critical</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#dc2626' }}>{analytics.risks.critical}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>High</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#f59e0b' }}>{analytics.risks.high}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Mitigated</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#10b981' }}>{analytics.risks.mitigated}</span>
            </div>
          </div>
        </div>

        {/* Dependencies */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #e5e7eb',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
            Dependencies
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Total</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{analytics.dependencies.total}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Blocked</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#ef4444' }}>{analytics.dependencies.blocked}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Resolved</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#10b981' }}>{analytics.dependencies.resolved}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;

