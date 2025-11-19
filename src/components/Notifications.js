import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { getCookie } from '../utils/cookies';
import Layout from './Layout';

const Notifications = () => {
  const toast = useToast();

  const [invitations, setInvitations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingInvitation, setProcessingInvitation] = useState(null);

  useEffect(() => {
    fetchInvitations();
    fetchNotifications();
  }, []);

  const fetchInvitations = async () => {
    try {
      const token = getCookie('authToken');
      const response = await fetch('/api/invitations/my-invitations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = getCookie('authToken');
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId) => {
    setProcessingInvitation(invitationId);
    try {
      const token = getCookie('authToken');
      const response = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast?.showToast?.('Invitation accepted successfully!', 'success');
        fetchInvitations();
        fetchNotifications();
        // Reload page to update company list
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const errorData = await response.json();
        toast?.showToast?.(errorData.message || 'Failed to accept invitation', 'error');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast?.showToast?.('Failed to accept invitation. Please try again.', 'error');
    } finally {
      setProcessingInvitation(null);
    }
  };

  const handleRejectInvitation = async (invitationId) => {
    setProcessingInvitation(invitationId);
    try {
      const token = getCookie('authToken');
      const response = await fetch(`/api/invitations/${invitationId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast?.showToast?.('Invitation rejected', 'success');
        fetchInvitations();
        fetchNotifications();
      } else {
        const errorData = await response.json();
        toast?.showToast?.(errorData.message || 'Failed to reject invitation', 'error');
      }
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      toast?.showToast?.('Failed to reject invitation. Please try again.', 'error');
    } finally {
      setProcessingInvitation(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '18px', color: '#64748b' }}>Loading notifications...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '40px',
          borderRadius: '16px',
          marginBottom: '30px',
          boxShadow: '0 10px 40px rgba(102, 126, 234, 0.2)',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <div>
              <h1 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '700' }}>
                Notifications
              </h1>
              <p style={{ margin: 0, fontSize: '15px', opacity: 0.9 }}>
                {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Invitations Section */}
        {invitations.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{
              margin: '0 0 20px 0',
              fontSize: '20px',
              fontWeight: '700',
              color: '#1e293b'
            }}>
              Company Invitations
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {invitations.map((invitation) => (
                <div
                  key={invitation._id}
                  style={{
                    background: 'white',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#1e293b'
                      }}>
                        {invitation.company?.name}
                      </h3>
                      <p style={{
                        margin: '0 0 12px 0',
                        fontSize: '14px',
                        color: '#64748b',
                        lineHeight: '1.5'
                      }}>
                        {invitation.company?.description}
                      </p>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          <span style={{ fontSize: '14px', color: '#64748b' }}>
                            Role: <strong style={{ color: '#1e293b' }}>{invitation.designation}</strong>
                          </span>
                        </div>
                        {invitation.salary > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="1" x2="12" y2="23"></line>
                              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                            <span style={{ fontSize: '14px', color: '#64748b' }}>
                              Salary: <strong style={{ color: '#10b981' }}>${invitation.salary.toLocaleString()}</strong>
                            </span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="20" y1="8" x2="20" y2="14"></line>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                          </svg>
                          <span style={{ fontSize: '14px', color: '#64748b' }}>
                            Invited by: <strong style={{ color: '#1e293b' }}>{invitation.invitedBy?.name}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                    <button
                      onClick={() => handleAcceptInvitation(invitation._id)}
                      disabled={processingInvitation === invitation._id}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: processingInvitation === invitation._id ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: processingInvitation === invitation._id ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                        boxShadow: processingInvitation === invitation._id ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {processingInvitation === invitation._id ? 'Processing...' : 'Accept Invitation'}
                    </button>
                    <button
                      onClick={() => handleRejectInvitation(invitation._id)}
                      disabled={processingInvitation === invitation._id}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'white',
                        color: '#64748b',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        cursor: processingInvitation === invitation._id ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.2s',
                        opacity: processingInvitation === invitation._id ? 0.5 : 1
                      }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {invitations.length === 0 && notifications.length === 0 && (
          <div style={{
            background: 'white',
            padding: '60px',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 20px' }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
              No Notifications
            </h3>
            <p style={{ margin: 0, fontSize: '15px', color: '#64748b' }}>
              You're all caught up! No new notifications at this time.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Notifications;

