import React, { useState, useEffect } from 'react';
import { holidayAPI } from '../services/api';
import { useCompany } from '../context/CompanyContext';
import { useToast } from '../context/ToastContext';
import Layout from './Layout';
import DeleteConfirmModal from './common/DeleteConfirmModal';
import PageHeader from './PageHeader';

const HolidayManagement = () => {
  const { state } = useCompany();
  const toast = useToast();
  const selectedCompany = state.selectedCompany;
  const [holidays, setHolidays] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    name: '',
    description: ''
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: '' });
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (selectedCompany && selectedCompany.id !== 'personal') {
      fetchHolidays();
    }
  }, [selectedCompany]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const response = await holidayAPI.getAll(selectedCompany.id);
      setHolidays(response.data.holidays || []);
      setCompany(response.data.company);
    } catch (error) {
      console.error('Error fetching holidays', error);
      toast?.error?.('Failed to sync holiday records.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    try {
      await holidayAPI.create(selectedCompany.id, formData);
      setShowAddModal(false);
      setFormData({ date: '', name: '', description: '' });
      fetchHolidays();
      toast?.success?.('Holiday added successfully.');
    } catch (error) {
      toast?.error?.(error.response?.data?.error || 'Failed to add holiday.');
    }
  };

  const handleUpdateHoliday = async (e) => {
    e.preventDefault();
    try {
      await holidayAPI.update(selectedCompany.id, editingHoliday._id, formData);
      setShowEditModal(false);
      setEditingHoliday(null);
      setFormData({ date: '', name: '', description: '' });
      fetchHolidays();
      toast?.success?.('Holiday updated.');
    } catch (error) {
      toast?.error?.('Update failed.');
    }
  };

  const handleDeleteHoliday = (holidayId) => {
    const holiday = holidays.find(h => h._id === holidayId);
    setDeleteModal({
      isOpen: true,
      id: holidayId,
      name: holiday?.name || 'this holiday'
    });
  };

  const confirmDeleteHoliday = async () => {
    try {
      await holidayAPI.delete(selectedCompany.id, deleteModal.id);
      fetchHolidays();
      setDeleteModal({ isOpen: false, id: null, name: '' });
      toast?.success?.('Holiday deleted.');
    } catch (error) {
      toast?.error?.('Deletion failed.');
    }
  };

  const openEditModal = (holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      date: new Date(holiday.date).toISOString().split('T')[0],
      name: holiday.name,
      description: holiday.description || ''
    });
    setShowEditModal(true);
  };

  const filteredHolidays = holidays.filter(h =>
    new Date(h.date).getFullYear() === filterYear
  );

  const upcomingHolidays = holidays.filter(h => {
    const holidayDate = new Date(h.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return holidayDate >= today;
  }).slice(0, 5);

  const years = [...new Set(holidays.map(h => new Date(h.date).getFullYear()))].sort((a, b) => b - a);
  if (!years.includes(new Date().getFullYear())) {
    years.unshift(new Date().getFullYear());
  }

  const isUpcoming = (date) => {
    const holidayDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return holidayDate >= today;
  };

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
        <PageHeader
          title="Holiday Management"
          subtitle={`Directory of official public holidays and company-wide breaks for ${company?.name || 'the organization'}.`}
          icon="🎉"
          stats={[
            { label: 'Planned Days', value: filteredHolidays.length },
            { label: 'Selected Year', value: filterYear }
          ]}
          actions={
            <button
              onClick={() => setShowAddModal(true)}
              className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-slate-950 transition-all active:scale-95"
            >
              + Add Holiday
            </button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6 font-sans">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4 italic">Year Filter:</span>
              <div className="flex gap-2">
                {years.map(y => (
                  <button
                    key={y}
                    onClick={() => setFilterYear(y)}
                    className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${filterYear === y ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                Array(4).fill(0).map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />)
              ) : filteredHolidays.length > 0 ? (
                filteredHolidays.map((holiday) => (
                  <div key={holiday._id} className={`group bg-white p-6 rounded-3xl border transition-all duration-300 flex items-center gap-8 ${isUpcoming(holiday.date) ? 'border-indigo-100 shadow-md shadow-indigo-500/5' : 'border-slate-100 shadow-sm'}`}>
                    <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-center shadow-inner shrink-0 group-hover:scale-105 transition-all ${isUpcoming(holiday.date) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-900 border border-slate-200'}`}>
                      <span className="text-xl font-bold leading-none">{new Date(holiday.date).getDate()}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-70">{new Date(holiday.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                    </div>

                    <div className="flex-1 min-w-0 font-sans">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{holiday.name}</h3>
                        {isUpcoming(holiday.date) && <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-widest rounded-full border border-emerald-100 animate-pulse">Upcoming</span>}
                      </div>
                      <p className="text-xs font-medium text-slate-500 line-clamp-1 italic">{holiday.description || 'General downtime recorded.'}</p>
                      <div className="mt-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{new Date(holiday.date).toLocaleDateString(undefined, { weekday: 'long' })}</div>
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => openEditModal(holiday)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-200" title="Edit">✏️</button>
                      <button onClick={() => handleDeleteHoliday(holiday._id)} className="p-3 bg-white text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-rose-100" title="Delete">🗑</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-24 rounded-3xl border border-dashed border-slate-200 text-center space-y-4">
                  <div className="text-6xl mb-4 grayscale opacity-20">📅</div>
                  <h3 className="text-xl font-bold text-slate-300 uppercase tracking-widest italic">No holidays found for {filterYear}</h3>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-950 p-10 rounded-3xl text-white shadow-xl relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-[10px] font-bold uppercase tracking-widest mb-8 text-indigo-400 italic">Upcoming Holidays</h3>
                {upcomingHolidays.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingHolidays.map(h => (
                      <div key={h._id} className="group/item flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all">
                        <div className="text-2xl grayscale group-hover/item:grayscale-0 transition-all">🎉</div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold truncate pr-2">{h.name}</div>
                          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">{new Date(h.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] font-bold text-slate-500 uppercase italic py-8 border border-dashed border-white/10 rounded-2xl text-center">No upcoming holidays</p>
                )}
              </div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
            </div>
          </div>
        </div>

        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 font-sans" onClick={(e) => e.stopPropagation()}>
              <div className="p-8 bg-slate-950 text-white flex justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold uppercase tracking-tight">{showEditModal ? 'Edit Holiday' : 'Add New Holiday'}</h3>
                  <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-1 opacity-70">Define a global operation break.</p>
                </div>
                <button onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditingHoliday(null); }} className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center text-xl hover:bg-rose-600 transition-all relative z-10">×</button>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
              </div>

              <form onSubmit={showEditModal ? handleUpdateHoliday : handleAddHoliday} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Holiday Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. New Year's Day" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date *</label>
                  <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Description (Optional)</label>
                  <textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Reason or details..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-600 outline-none focus:bg-white focus:border-indigo-400 transition-all resize-none italic" />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditingHoliday(null); }} className="flex-1 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-950 transition-all italic">Cancel</button>
                  <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg hover:bg-slate-950 transition-all active:scale-95">Save Holiday</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null, name: '' })}
        onConfirm={confirmDeleteHoliday}
        title="Delete Holiday Record"
        message={`Are you sure you want to permanently delete "${deleteModal.name}"? This will restore standard operation hours for this date.`}
        itemName={deleteModal.name}
      />
    </Layout>
  );
};

export default HolidayManagement;
