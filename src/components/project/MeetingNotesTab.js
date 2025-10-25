import React, { useState } from 'react';
import { meetingNoteAPI } from '../../services/api';

const MeetingNotesTab = ({ projectId, meetingNotes, setMeetingNotes, users, isProjectOwner, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#172b4d' }}>
          Meeting Notes ({meetingNotes.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0052cc',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {showForm ? 'Cancel' : 'Add Meeting Note'}
        </button>
      </div>

      {showForm && (
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #dfe1e6',
          borderRadius: '3px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#172b4d' }}>
            {editingMeeting ? 'Edit Meeting Note' : 'New Meeting Note'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                    Meeting Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="6"
                    placeholder="Add meeting notes, discussions, and key points..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
              
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                    Meeting Date *
                  </label>
                  <input
                    type="date"
                    value={formData.meetingDate}
                    onChange={(e) => setFormData({...formData, meetingDate: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
                    Meeting Type
                  </label>
                  <select
                    value={formData.meetingType}
                    onChange={(e) => setFormData({...formData, meetingType: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="planning">Planning</option>
                    <option value="standup">Standup</option>
                    <option value="review">Review</option>
                    <option value="retrospective">Retrospective</option>
                    <option value="stakeholder">Stakeholder</option>
                    <option value="technical">Technical</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#5e6c84' }}>
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
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #dfe1e6',
                      borderRadius: '3px',
                      fontSize: '14px',
                      minHeight: '100px'
                    }}
                  >
                    {users.map(user => (
                      <option key={user._id} value={user._id}>{user.name}</option>
                    ))}
                  </select>
                  <div style={{ fontSize: '11px', color: '#5e6c84', marginTop: '4px' }}>
                    Hold Ctrl/Cmd to select multiple
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: '#5e6c84',
                  border: '1px solid #dfe1e6',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#0052cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {editingMeeting ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Meeting Notes List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {meetingNotes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            color: '#5e6c84',
            backgroundColor: '#ffffff',
            border: '1px solid #dfe1e6',
            borderRadius: '3px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#172b4d' }}>No meeting notes yet</h4>
            <p style={{ margin: 0, fontSize: '14px' }}>Add your first meeting note to track discussions and decisions.</p>
          </div>
        ) : (
          meetingNotes.map(meeting => {
            const typeColor = getMeetingTypeColor(meeting.meetingType);
            
            return (
              <div key={meeting._id} style={{
                backgroundColor: '#ffffff',
                border: '1px solid #dfe1e6',
                borderRadius: '3px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#172b4d' }}>
                      {meeting.title}
                    </h4>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '11px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: typeColor.bg,
                        color: typeColor.text,
                        border: `1px solid ${typeColor.border}`,
                        textTransform: 'capitalize'
                      }}>
                        {meeting.meetingType}
                      </span>
                      <span style={{ fontSize: '12px', color: '#5e6c84' }}>
                        📅 {new Date(meeting.meetingDate).toLocaleDateString()}
                      </span>
                      {meeting.duration && (
                        <span style={{ fontSize: '12px', color: '#5e6c84' }}>
                          ⏱️ {meeting.duration}min
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(meeting)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'transparent',
                        color: '#5e6c84',
                        border: '1px solid #dfe1e6',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(meeting._id)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'transparent',
                        color: '#de350b',
                        border: '1px solid #dfe1e6',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {meeting.description && (
                  <p style={{ margin: '0 0 12px 0', color: '#5e6c84', fontSize: '14px', lineHeight: '1.5' }}>
                    {meeting.description}
                  </p>
                )}
                
                {meeting.notes && (
                  <div style={{ marginBottom: '12px' }}>
                    <h5 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '600', color: '#5e6c84', textTransform: 'uppercase' }}>
                      Notes
                    </h5>
                    <p style={{ margin: 0, color: '#172b4d', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                      {meeting.notes}
                    </p>
                  </div>
                )}
                
                {meeting.attendees && meeting.attendees.length > 0 && (
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#5e6c84' }}>
                    <span>👥 Attendees: {meeting.attendees.map(a => a.user.name).join(', ')}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MeetingNotesTab;