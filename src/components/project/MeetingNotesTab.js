import React, { useState } from 'react';
import { meetingNoteAPI } from '../../services/api';

const MeetingNotesTab = ({ projectId, meetingNotes, setMeetingNotes, users, isProjectOwner, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [viewingMeeting, setViewingMeeting] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meetingDate: '',
    duration: '',
    meetingType: 'planning',
    attendees: [],
    notes: '',
    actionItems: [],
    decisions: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        attendees: formData.attendees.map(userId => ({ user: userId, attended: true }))
      };

      if (editingMeeting) {
        await meetingNoteAPI.update(projectId, editingMeeting._id, data);
      } else {
        await meetingNoteAPI.create(projectId, data);
      }
      
      await onRefresh();
      resetForm();
    } catch (error) {
      console.error('Error saving meeting note:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      meetingDate: '',
      duration: '',
      meetingType: 'planning',
      attendees: [],
      notes: '',
      actionItems: [],
      decisions: []
    });
    setShowForm(false);
    setEditingMeeting(null);
  };

  const handleEdit = (meeting) => {
    setFormData({
      title: meeting.title,
      description: meeting.description || '',
      meetingDate: new Date(meeting.meetingDate).toISOString().split('T')[0],
      duration: meeting.duration || '',
      meetingType: meeting.meetingType,
      attendees: meeting.attendees?.map(a => a.user._id) || [],
      notes: meeting.notes || '',
      actionItems: meeting.actionItems || [],
      decisions: meeting.decisions || []
    });
    setEditingMeeting(meeting);
    setShowForm(true);
  };

  const handleDelete = async (meetingId) => {
    if (window.confirm('Are you sure you want to delete this meeting note?')) {
      try {
        await meetingNoteAPI.delete(projectId, meetingId);
        await onRefresh();
      } catch (error) {
        console.error('Error deleting meeting note:', error);
      }
    }
  };

  const getMeetingTypeColor = (type) => {
    const colors = {
      'planning': { bg: '#e6f7ff', text: '#0052cc', border: '#91d5ff' },
      'standup': { bg: '#fff4e6', text: '#d46b08', border: '#ffcc95' },
      'review': { bg: '#f6ffed', text: '#389e0d', border: '#b7eb8f' },
      'retrospective': { bg: '#f9f0ff', text: '#722ed1', border: '#d3adf7' },
      'stakeholder': { bg: '#fff1f0', text: '#cf1322', border: '#ffa39e' },
      'technical': { bg: '#f4f5f7', text: '#5e6c84', border: '#dfe1e6' },
      'other': { bg: '#f4f5f7', text: '#5e6c84', border: '#dfe1e6' }
    };
    return colors[type] || colors.other;
  };

  // Filter meeting notes
  const filteredMeetingNotes = meetingNotes.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (meeting.description && meeting.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (meeting.notes && meeting.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || meeting.meetingType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ padding: '24px', backgroundColor: '#fafbfc', minHeight: '100vh' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        padding: '0 4px'
      }}>
        <div>
          <h1 style={{
            margin: '0 0 4px 0',
            fontSize: '28px',
            fontWeight: '700',
            color: '#172b4d',
            letterSpacing: '-0.5px'
          }}>
            Meeting Notes
          </h1>
          <p style={{
            margin: 0,
            fontSize: '16px',
            color: '#5e6c84',
            fontWeight: '400'
          }}>
            {filteredMeetingNotes.length} of {meetingNotes.length} meeting{meetingNotes.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isProjectOwner && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '12px 24px',
              backgroundColor: showForm ? '#f4f5f7' : '#0052cc',
              color: showForm ? '#5e6c84' : 'white',
              border: showForm ? '1px solid #dfe1e6' : 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: showForm ? 'none' : '0 2px 4px rgba(0, 82, 204, 0.2)'
            }}
          >
            {showForm ? '✕ Cancel' : '+ Add Meeting Note'}
          </button>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e1e5e9',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '50px' }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#5e6c84',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Search meeting notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0052cc'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#5e6c84',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Meeting Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Types</option>
              <option value="planning">Planning</option>
              <option value="standup">Standup</option>
              <option value="review">Review</option>
              <option value="retrospective">Retrospective</option>
              <option value="stakeholder">Stakeholder</option>
              <option value="technical">Technical</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {showForm && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px solid #e1e5e9',
          borderRadius: '16px',
          padding: '40px',
          marginBottom: '32px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
            paddingBottom: '24px',
            borderBottom: '2px solid #f4f5f7'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              backgroundColor: '#e6f7ff',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              boxShadow: '0 2px 8px rgba(0, 82, 204, 0.1)'
            }}>
              📝
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#172b4d', letterSpacing: '-0.5px' }}>
                {editingMeeting ? 'Edit Meeting Note' : 'Create New Meeting Note'}
              </h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#5e6c84', lineHeight: '1.5' }}>
                {editingMeeting ? 'Update meeting details and notes' : 'Document meeting discussions and decisions'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '40px' }}>
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#172b4d',
                    letterSpacing: '0.2px'
                  }}>
                    Meeting Title <span style={{ color: '#cf1322' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    placeholder="Enter meeting title"
                    style={{
                      boxSizing: 'border-box',
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '10px',
                      fontSize: '15px',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      backgroundColor: '#fafbfc'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0052cc';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0, 82, 204, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e1e5e9';
                      e.target.style.backgroundColor = '#fafbfc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#172b4d',
                    letterSpacing: '0.2px'
                  }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                    placeholder="Brief description of the meeting purpose"
                    style={{
                      boxSizing: 'border-box',
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '10px',
                      fontSize: '15px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      backgroundColor: '#fafbfc',
                      lineHeight: '1.6'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0052cc';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0, 82, 204, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e1e5e9';
                      e.target.style.backgroundColor = '#fafbfc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#172b4d',
                    letterSpacing: '0.2px'
                  }}>
                    Meeting Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="6"
                    placeholder="Add meeting notes, discussions, and key points..."
                    style={{
                      boxSizing: 'border-box',
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '10px',
                      fontSize: '15px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      backgroundColor: '#fafbfc',
                      lineHeight: '1.6'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0052cc';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0, 82, 204, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e1e5e9';
                      e.target.style.backgroundColor = '#fafbfc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#172b4d',
                    letterSpacing: '0.2px'
                  }}>
                    Meeting Date <span style={{ color: '#cf1322' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.meetingDate}
                    onChange={(e) => setFormData({...formData, meetingDate: e.target.value})}
                    required
                    style={{
                      boxSizing: 'border-box',
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '10px',
                      fontSize: '15px',
                      outline: 'none',
                      backgroundColor: '#fafbfc',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0052cc';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0, 82, 204, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e1e5e9';
                      e.target.style.backgroundColor = '#fafbfc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#172b4d',
                    letterSpacing: '0.2px'
                  }}>
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    placeholder="60"
                    min="0"
                    step="5"
                    style={{
                      boxSizing: 'border-box',
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '10px',
                      fontSize: '15px',
                      outline: 'none',
                      backgroundColor: '#fafbfc',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0052cc';
                      e.target.style.backgroundColor = '#ffffff';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0, 82, 204, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e1e5e9';
                      e.target.style.backgroundColor = '#fafbfc';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#172b4d',
                    letterSpacing: '0.2px'
                  }}>
                    Meeting Type
                  </label>
                  <select
                    value={formData.meetingType}
                    onChange={(e) => setFormData({...formData, meetingType: e.target.value})}
                    style={{
                      boxSizing: 'border-box',
                      width: '100%',
                      padding: '14px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '10px',
                      fontSize: '15px',
                      backgroundColor: '#fafbfc',
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0052cc';
                      e.target.style.backgroundColor = '#ffffff';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e1e5e9';
                      e.target.style.backgroundColor = '#fafbfc';
                    }}
                  >
                    <option value="planning">📋 Planning</option>
                    <option value="standup">🏃 Standup</option>
                    <option value="review">✅ Review</option>
                    <option value="retrospective">🔄 Retrospective</option>
                    <option value="stakeholder">👥 Stakeholder</option>
                    <option value="technical">⚙️ Technical</option>
                    <option value="other">📌 Other</option>
                  </select>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#172b4d',
                    letterSpacing: '0.2px'
                  }}>
                    Attendees
                  </label>
                  <select
                    multiple
                    value={formData.attendees}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData({...formData, attendees: values});
                    }}
                    style={{
                      boxSizing: 'border-box',
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '10px',
                      fontSize: '15px',
                      minHeight: '140px',
                      backgroundColor: '#fafbfc',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0052cc';
                      e.target.style.backgroundColor = '#ffffff';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e1e5e9';
                      e.target.style.backgroundColor = '#fafbfc';
                    }}
                  >
                    {users.map(user => (
                      <option key={user._id} value={user._id}>👤 {user.name}</option>
                    ))}
                  </select>
                  <div style={{
                    fontSize: '13px',
                    color: '#5e6c84',
                    marginTop: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#f4f5f7',
                    borderRadius: '6px',
                    border: '1px solid #e1e5e9'
                  }}>
                    💡 Hold Ctrl/Cmd to select multiple attendees
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '16px',
              marginTop: '40px',
              paddingTop: '32px',
              borderTop: '2px solid #f4f5f7'
            }}>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '14px 32px',
                  backgroundColor: '#ffffff',
                  color: '#5e6c84',
                  border: '2px solid #dfe1e6',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '700',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.3px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f4f5f7';
                  e.target.style.borderColor = '#c1c7d0';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#ffffff';
                  e.target.style.borderColor = '#dfe1e6';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '14px 32px',
                  backgroundColor: '#0052cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '700',
                  boxShadow: '0 4px 12px rgba(0, 82, 204, 0.3)',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.3px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#0747a6';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(0, 82, 204, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#0052cc';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 82, 204, 0.3)';
                }}
              >
                {editingMeeting ? '✓ Update Meeting Note' : '+ Create Meeting Note'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Meeting Notes List - Only show when form is not visible */}
      {!showForm && (
        <div style={{ display: 'grid', gap: '16px' }}>
        {filteredMeetingNotes.length === 0 && meetingNotes.length > 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '64px 24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e1e5e9'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#172b4d' }}>
              No Meeting Notes Found
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#5e6c84' }}>
              Try adjusting your search or filter criteria.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f4f5f7',
                color: '#5e6c84',
                border: '1px solid #dfe1e6',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : meetingNotes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '64px 24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e1e5e9'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#172b4d' }}>
              No Meeting Notes Yet
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#5e6c84' }}>
              Start documenting your meetings to track discussions and decisions.
            </p>
            {isProjectOwner && (
              <button
                onClick={() => setShowForm(true)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#0052cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: '0 2px 4px rgba(0, 82, 204, 0.2)'
                }}
              >
                Create First Meeting Note
              </button>
            )}
          </div>
        ) : (
          filteredMeetingNotes.map(meeting => {
            const typeColor = getMeetingTypeColor(meeting.meetingType);
            
            return (
              <div
                key={meeting._id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e1e5e9',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      margin: '0 0 8px 0',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#172b4d',
                      lineHeight: '1.3'
                    }}>
                      {meeting.title}
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{
                        ...typeColor,
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        border: `1px solid ${typeColor.border}`
                      }}>
                        {meeting.meetingType}
                      </span>
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: '#f4f5f7',
                        color: '#5e6c84',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        📅 {new Date(meeting.meetingDate).toLocaleDateString()}
                      </span>
                      {meeting.duration && (
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: '#fff4e6',
                          color: '#d46b08',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          ⏱️ {meeting.duration}min
                        </span>
                      )}
                      {meeting.attendees && meeting.attendees.length > 0 && (
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: '#e6f7ff',
                          color: '#0052cc',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          👥 {meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                    <button
                      onClick={() => setViewingMeeting(meeting)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#e6f7ff',
                        color: '#0052cc',
                        border: '1px solid #91d5ff',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#0052cc';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#e6f7ff';
                        e.target.style.color = '#0052cc';
                      }}
                    >
                      View
                    </button>
                    {isProjectOwner && (
                      <>
                        <button
                          onClick={() => handleEdit(meeting)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#f4f5f7',
                            color: '#5e6c84',
                            border: '1px solid #dfe1e6',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#0052cc';
                            e.target.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#f4f5f7';
                            e.target.style.color = '#5e6c84';
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(meeting._id)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#fff1f0',
                            color: '#cf1322',
                            border: '1px solid #ffa39e',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#cf1322';
                            e.target.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#fff1f0';
                            e.target.style.color = '#cf1322';
                          }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {meeting.description && (
                  <p style={{
                    margin: '0 0 16px 0',
                    color: '#5e6c84',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    {meeting.description}
                  </p>
                )}

                {meeting.notes && (
                  <div style={{
                    backgroundColor: '#f4f5f7',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}>
                    <h5 style={{
                      margin: '0 0 8px 0',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#5e6c84',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Meeting Notes
                    </h5>
                    <p style={{
                      margin: 0,
                      color: '#172b4d',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {meeting.notes.length > 200 ? `${meeting.notes.substring(0, 200)}...` : meeting.notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
        </div>
      )}

      {/* Details Modal */}
      {viewingMeeting && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }}
        onClick={() => setViewingMeeting(null)}
        >
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '32px',
              borderBottom: '1px solid #e1e5e9',
              position: 'sticky',
              top: 0,
              backgroundColor: '#ffffff',
              zIndex: 1
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '700', color: '#172b4d' }}>
                    {viewingMeeting.title}
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{
                      ...getMeetingTypeColor(viewingMeeting.meetingType),
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      border: `1px solid ${getMeetingTypeColor(viewingMeeting.meetingType).border}`
                    }}>
                      {viewingMeeting.meetingType}
                    </span>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: '#f4f5f7',
                      color: '#5e6c84',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      📅 {new Date(viewingMeeting.meetingDate).toLocaleDateString()}
                    </span>
                    {viewingMeeting.duration && (
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: '#fff4e6',
                        color: '#d46b08',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        ⏱️ {viewingMeeting.duration} minutes
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setViewingMeeting(null)}
                  style={{
                    padding: '8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '24px',
                    color: '#5e6c84',
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ padding: '32px' }}>
              {viewingMeeting.description && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#5e6c84', textTransform: 'uppercase' }}>
                    Description
                  </h3>
                  <p style={{ margin: 0, fontSize: '16px', color: '#172b4d', lineHeight: '1.6' }}>
                    {viewingMeeting.description}
                  </p>
                </div>
              )}

              {viewingMeeting.notes && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#5e6c84', textTransform: 'uppercase' }}>
                    Meeting Notes
                  </h3>
                  <div style={{
                    backgroundColor: '#f4f5f7',
                    padding: '20px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    color: '#172b4d',
                    lineHeight: '1.8',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {viewingMeeting.notes}
                  </div>
                </div>
              )}

              {viewingMeeting.attendees && viewingMeeting.attendees.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#5e6c84', textTransform: 'uppercase' }}>
                    Attendees ({viewingMeeting.attendees.length})
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {viewingMeeting.attendees.map((attendee, index) => (
                      <span key={index} style={{
                        padding: '8px 16px',
                        backgroundColor: '#e6f7ff',
                        color: '#0052cc',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: '1px solid #91d5ff'
                      }}>
                        👤 {attendee.user.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {viewingMeeting.actionItems && viewingMeeting.actionItems.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#5e6c84', textTransform: 'uppercase' }}>
                    Action Items
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#172b4d', fontSize: '16px', lineHeight: '1.8' }}>
                    {viewingMeeting.actionItems.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {viewingMeeting.decisions && viewingMeeting.decisions.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#5e6c84', textTransform: 'uppercase' }}>
                    Decisions Made
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#172b4d', fontSize: '16px', lineHeight: '1.8' }}>
                    {viewingMeeting.decisions.map((decision, index) => (
                      <li key={index}>{decision}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e1e5e9', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                {isProjectOwner && (
                  <>
                    <button
                      onClick={() => {
                        handleEdit(viewingMeeting);
                        setViewingMeeting(null);
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#0052cc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      Edit Meeting Note
                    </button>
                    <button
                      onClick={() => {
                        setViewingMeeting(null);
                        handleDelete(viewingMeeting._id);
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#fff1f0',
                        color: '#cf1322',
                        border: '1px solid #ffa39e',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingNotesTab;