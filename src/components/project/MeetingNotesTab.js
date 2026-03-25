import React, { useState } from 'react';
import { meetingNoteAPI } from '../../services/api';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import { Button, Badge } from '../ui';

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
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

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
    setViewingMeeting(null);
  };

  const handleDelete = (meetingId) => {
    const meeting = meetingNotes.find(m => m._id === meetingId);
    setDeleteModal({
      isOpen: true,
      id: meetingId,
      name: meeting?.title || 'this meeting note'
    });
  };

  const confirmDelete = async () => {
    try {
      await meetingNoteAPI.delete(projectId, deleteModal.id);
      await onRefresh();
      setDeleteModal({ isOpen: false, id: null, name: '' });
    } catch (error) {
      console.error('Error deleting meeting note:', error);
    }
  };

  const getTypeBadge = (type) => {
    const typeMap = {
      'planning': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'standup': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'review': 'bg-amber-50 text-amber-700 border-amber-200',
      'retrospective': 'bg-purple-50 text-purple-700 border-purple-200',
      'stakeholder': 'bg-blue-50 text-blue-700 border-blue-200',
      'technical': 'bg-slate-50 text-slate-700 border-slate-200'
    };
    return typeMap[type] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const filteredMeetingNotes = meetingNotes.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (meeting.description && meeting.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (meeting.notes && meeting.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || meeting.meetingType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meeting Notes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse and manage all project meeting records
          </p>
        </div>
        {isProjectOwner && (
          <Button
            variant={showForm ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          >
            {showForm ? 'Cancel' : '+ New Meeting Note'}
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Search Notes</label>
            <input
              type="text"
              placeholder="Search by title, description, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-400 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Meeting Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-400 cursor-pointer"
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
        <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8 shadow-md">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-xl">📝</div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{editingMeeting ? 'Edit Meeting Details' : 'Record New Meeting'}</h3>
              <p className="text-sm text-slate-500">Document discussions, decisions, and action items.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Meeting Title <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g., Weekly Sync"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Short Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="2"
                    placeholder="Brief summary of the meeting..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400 resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Detailed Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="8"
                    placeholder="Detailed notes, discussions, etc..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Meeting Date <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    value={formData.meetingDate}
                    onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="60"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Meeting Type</label>
                  <select
                    value={formData.meetingType}
                    onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none cursor-pointer"
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
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 ml-1">Attendees</label>
                  <select
                    multiple
                    value={formData.attendees}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData({ ...formData, attendees: values });
                    }}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none h-40 scrollbar-thin"
                  >
                    {users.map(user => (
                      <option key={user._id} value={user._id}>{user.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">Hold Ctrl/Cmd to select multiple</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-8 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
              <Button type="submit" variant="primary">{editingMeeting ? 'Update Meeting' : 'Save Meeting Note'}</Button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMeetingNotes.map(meeting => (
            <div
              key={meeting._id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer flex flex-col"
              onClick={() => setViewingMeeting(meeting)}
            >
              <div className="flex justify-between items-start mb-4">
                <Badge variant={meeting.meetingType === 'standup' ? 'success' : meeting.meetingType === 'review' ? 'warning' : meeting.meetingType === 'retrospective' || meeting.meetingType === 'stakeholder' ? 'info' : meeting.meetingType === 'planning' ? 'primary' : 'default'} size="sm">
                  {meeting.meetingType}
                </Badge>
                {isProjectOwner && (
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(meeting)} className="!text-slate-400 hover:!text-indigo-600 !p-1.5">✎</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(meeting._id)} className="!text-slate-400 hover:!text-rose-600 !p-1.5">✕</Button>
                  </div>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">{meeting.title}</h3>
              <p className="text-xs text-slate-500 mb-6 line-clamp-2 h-8">{meeting.description || 'No summary provided.'}</p>

              <div className="mt-auto flex justify-between items-center pt-4 border-t border-slate-50">
                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <span>📅</span> {new Date(meeting.meetingDate).toLocaleDateString()}
                </div>
                <div className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">See Details ⮕</div>
              </div>
            </div>
          ))}

          {filteredMeetingNotes.length === 0 && (
            <div className="col-span-full py-24 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-bold text-slate-900">No meeting notes found</h3>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or record a new meeting.</p>
              <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setFilterType('all'); }} className="mt-6 !text-indigo-600 hover:underline">Clear Filters</Button>
            </div>
          )}
        </div>
      )}

      {viewingMeeting && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-4" onClick={() => setViewingMeeting(null)}>
          <div className="bg-white rounded-3xl p-10 w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-8 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl border border-slate-100">📝</div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 leading-none">{viewingMeeting.title}</h2>
                  <div className="flex items-center gap-3 mt-3">
                    <Badge variant={viewingMeeting.meetingType === 'standup' ? 'success' : viewingMeeting.meetingType === 'review' ? 'warning' : viewingMeeting.meetingType === 'retrospective' || viewingMeeting.meetingType === 'stakeholder' ? 'info' : viewingMeeting.meetingType === 'planning' ? 'primary' : 'default'} size="sm">{viewingMeeting.meetingType}</Badge>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date: {new Date(viewingMeeting.meetingDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingMeeting(null)} className="!text-slate-400 hover:!text-slate-900 !text-2xl !leading-none !p-2">✕</Button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin space-y-8">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Notes</h4>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {viewingMeeting.notes || 'No notes were recorded.'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Meeting Info</h4>
                    <div className="space-y-2">
                      <div className="bg-white border border-slate-100 p-4 rounded-xl flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</span>
                        <span className="text-sm font-bold text-slate-900">{viewingMeeting.duration || '??'} Minutes</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Attendees ({viewingMeeting.attendees?.length || 0})</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingMeeting.attendees?.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-5 h-5 bg-indigo-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-indigo-700">{a.user?.name?.charAt(0)}</div>
                        <span className="text-[11px] font-medium text-slate-700">{a.user?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {isProjectOwner && (
              <div className="mt-10 pt-8 border-t border-slate-100 flex gap-4 flex-shrink-0">
                <Button variant="primary" onClick={() => { handleEdit(viewingMeeting); }} className="flex-1">Edit Note</Button>
                <Button variant="danger" onClick={() => { setViewingMeeting(null); handleDelete(viewingMeeting._id); }} className="flex-1">Delete Note</Button>
              </div>
            )}
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Delete Meeting Note"
        message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default MeetingNotesTab;