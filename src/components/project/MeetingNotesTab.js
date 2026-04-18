import React, { useState } from 'react';
import { meetingNoteAPI } from '../../services/api';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import { Button, Badge } from '../ui';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Select from 'react-select';

const MeetingNotesTab = ({ projectId, meetingNotes, users, isProjectOwner, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [viewingMeeting, setViewingMeeting] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meetingDate: new Date().toISOString().split('T')[0],
    duration: '60',
    meetingType: 'planning',
    attendees: [],
    notes: '',
    actionItems: [],
    decisions: []
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });

  const meetingTypes = [
    { value: 'planning', label: 'Planning', icon: '📋' },
    { value: 'standup', label: 'Standup', icon: '🏃' },
    { value: 'review', label: 'Review', icon: '✅' },
    { value: 'retrospective', label: 'Retrospective', icon: '🔄' },
    { value: 'stakeholder', label: 'Stakeholder', icon: '👥' },
    { value: 'technical', label: 'Technical', icon: '⚙️' },
    { value: 'other', label: 'Other', icon: '📌' }
  ];

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
      alert('Failed to save meeting note');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      meetingDate: new Date().toISOString().split('T')[0],
      duration: '60',
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
      attendees: meeting.attendees?.map(a => a.user?._id || a.user) || [],
      notes: meeting.notes || '',
      actionItems: meeting.actionItems || [],
      decisions: meeting.decisions || []
    });
    setEditingMeeting(meeting);
    setShowForm(true);
    setViewingMeeting(null);
  };

  const addActionItem = () => {
    setFormData({
      ...formData,
      actionItems: [...formData.actionItems, { description: '', assignedTo: '', status: 'pending' }]
    });
  };

  const removeActionItem = (index) => {
    setFormData({
      ...formData,
      actionItems: formData.actionItems.filter((_, i) => i !== index)
    });
  };

  const addDecision = () => {
    setFormData({
      ...formData,
      decisions: [...formData.decisions, { description: '' }]
    });
  };

  const removeDecision = (index) => {
    setFormData({
      ...formData,
      decisions: formData.decisions.filter((_, i) => i !== index)
    });
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

  const filteredMeetingNotes = meetingNotes.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (meeting.description && typeof meeting.description === 'string' && meeting.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || meeting.meetingType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Meeting Notes</h2>
          <p className="text-sm text-slate-500">Documented discussions and session summaries.</p>
        </div>
        {isProjectOwner && !showForm && (
          <Button variant="primary" onClick={() => setShowForm(true)} className="shadow-sm">
            + New Meeting Record
          </Button>
        )}
      </div>

      {!showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400 transition-all"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:bg-white focus:border-indigo-400 cursor-pointer min-w-[160px]"
          >
            <option value="all">All Types</option>
            {meetingTypes.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
          </select>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-md">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">{editingMeeting ? 'Edit Meeting' : 'Create New Meeting Record'}</h3>
            <Button variant="ghost" onClick={resetForm} className="!text-slate-400">✕</Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 ml-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-1">Date *</label>
                <input
                  type="date"
                  value={formData.meetingDate}
                  onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-1">Type</label>
                <select
                  value={formData.meetingType}
                  onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none cursor-pointer"
                >
                  {meetingTypes.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-1">Duration (min)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-1">Attendees</label>
                <Select
                  isMulti
                  options={users.map(u => ({ value: u._id, label: u.name }))}
                  value={users.filter(u => formData.attendees.includes(u._id)).map(u => ({ value: u._id, label: u.name }))}
                  onChange={(selected) => setFormData({ ...formData, attendees: selected ? selected.map(s => s.value) : [] })}
                  placeholder="Select..."
                  className="text-sm"
                  classNames={{ control: () => "!bg-slate-50 !border-slate-200 !rounded-xl !p-1" }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 ml-1">Meeting Notes</label>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={formData.notes}
                  onChange={(content, delta, source, editor) => {
                    if (source === 'user') {
                      setFormData(prev => ({ ...prev, notes: content }));
                    }
                  }}
                  className="bg-white h-[200px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
               <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Action Items</h4>
                    <button type="button" onClick={addActionItem} className="text-xs text-indigo-600 hover:underline">+ Add</button>
                  </div>
                  <div className="space-y-2">
                    {formData.actionItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          type="text" value={item.description}
                          onChange={(e) => {
                            const newItems = [...formData.actionItems];
                            newItems[idx].description = e.target.value;
                            setFormData({...formData, actionItems: newItems});
                          }}
                          placeholder="What needs to be done?"
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                        />
                        <button type="button" onClick={() => removeActionItem(idx)} className="text-slate-300 hover:text-rose-500">✕</button>
                      </div>
                    ))}
                  </div>
               </div>

               <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Decisions</h4>
                    <button type="button" onClick={addDecision} className="text-xs text-indigo-600 hover:underline">+ Add</button>
                  </div>
                  <div className="space-y-2">
                    {formData.decisions.map((dec, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          type="text" value={dec.description}
                          onChange={(e) => {
                            const newDecs = [...formData.decisions];
                            newDecs[idx].description = e.target.value;
                            setFormData({...formData, decisions: newDecs});
                          }}
                          placeholder="What was decided?"
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                        />
                        <button type="button" onClick={() => removeDecision(idx)} className="text-slate-300 hover:text-rose-500">✕</button>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
              <Button type="submit" variant="primary">{editingMeeting ? 'Update Meeting' : 'Save Meeting'}</Button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMeetingNotes.map(meeting => {
            const mType = meetingTypes.find(t => t.value === meeting.meetingType) || meetingTypes[0];
            return (
              <div
                key={meeting._id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col group"
                onClick={() => setViewingMeeting(meeting)}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    📅 {new Date(meeting.meetingDate).toLocaleDateString()}
                  </span>
                  <Badge variant="default" size="sm" className="!bg-slate-50 !text-slate-600 !px-2 font-bold">
                    {mType.icon} {mType.label}
                  </Badge>
                </div>

                <h3 className="text-sm font-bold text-slate-800 mb-2 truncate group-hover:text-indigo-600 uppercase tracking-tight">{meeting.title}</h3>
                <p className="text-[11px] text-slate-500 line-clamp-2 min-h-[2rem]">{meeting.duration || 0} mins • {meeting.attendees?.length || 0} attendees</p>

                <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-indigo-600 font-bold text-[10px] uppercase">View Details</span>
                  {isProjectOwner && (
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                       <button onClick={() => handleEdit(meeting)} className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors">✎</button>
                       <button onClick={() => handleDelete(meeting._id)} className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors">✕</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredMeetingNotes.length === 0 && (
            <div className="col-span-full py-20 bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
              <div className="text-4xl mb-4 grayscale opacity-20">📝</div>
              <h3 className="text-lg font-bold text-slate-900">No meetings found</h3>
              <p className="text-sm text-slate-500 mt-1">Try adjusting filters or record a new meeting.</p>
            </div>
          )}
        </div>
      )}

      {viewingMeeting && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-4" onClick={() => setViewingMeeting(null)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <Badge variant="primary" className="mb-2 !text-[10px] uppercase font-bold">{viewingMeeting.meetingType}</Badge>
                <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{viewingMeeting.title}</h2>
              </div>
              <button onClick={() => setViewingMeeting(null)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 text-2xl font-bold">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <section>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Notes</h4>
                      <div 
                        className="prose prose-slate prose-sm max-w-none text-slate-700 font-medium leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-100"
                        dangerouslySetInnerHTML={{ __html: viewingMeeting.notes || 'No notes documented.' }}
                      />
                    </section>
                 </div>

                 <div className="space-y-6">
                    <section>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Outcome</h4>
                      <div className="space-y-4">
                         {viewingMeeting.actionItems?.length > 0 && (
                           <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                             <h5 className="text-[10px] font-bold text-indigo-600 uppercase mb-2">Action Items</h5>
                             <ul className="space-y-2">
                                {viewingMeeting.actionItems.map((it, i) => (
                                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                                     <span className="text-indigo-400">•</span> {it.description}
                                  </li>
                                ))}
                             </ul>
                           </div>
                         )}
                         {viewingMeeting.decisions?.length > 0 && (
                           <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                             <h5 className="text-[10px] font-bold text-amber-600 uppercase mb-2">Decisions</h5>
                             <ul className="space-y-2">
                                {viewingMeeting.decisions.map((dec, i) => (
                                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                                     <span className="text-amber-400">•</span> {dec.description}
                                  </li>
                                ))}
                             </ul>
                           </div>
                         )}
                      </div>
                    </section>

                    <section>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Attendees</h4>
                      <div className="flex flex-wrap gap-2">
                        {viewingMeeting.attendees?.map((a, i) => (
                          <div key={i} className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600">{a.user?.name}</div>
                        ))}
                      </div>
                    </section>
                 </div>
              </div>
            </div>

            {isProjectOwner && (
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
                <Button variant="primary" onClick={() => handleEdit(viewingMeeting)} className="flex-1">Edit Record</Button>
                <Button variant="danger" onClick={() => { setViewingMeeting(null); handleDelete(viewingMeeting._id); }} className="px-6">Delete</Button>
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