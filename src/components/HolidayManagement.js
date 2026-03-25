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
      console.error('Holiday_Sync_Error', error);
      toast?.error?.('Failed to sync maintenance cycles');
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
      toast?.success?.('New maintenance cycle initialized');
    } catch (error) {
      toast?.error?.(error.response?.data?.error || 'Initialization failed');
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
      toast?.success?.('Maintenance cycle updated');
    } catch (error) {
      toast?.error?.('Protocol update failed');
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
      toast?.success?.('Cycle purged from registry');
    } catch (error) {
      toast?.error?.('Expunge protocol failed');
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
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <PageHeader
          title="Maintenance Cycles"
          subtitle={`Registry of downtime and cultural maintenance for ${company?.name || 'the entity'}.`}
          icon={<span>🎉</span>}
          stats={[
            { label: 'Planned_Cycles', value: filteredHolidays.length },
            { label: 'Target_Year', value: filterYear }
          ]}
          actions={
            <button
              onClick={() => setShowAddModal(true)}
              className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              + Initialize_Cycle
            </button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main List Column */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-4">Temporal_Filter:</span>
              <div className="flex gap-2">
                {years.map(y => (
                  <button
                    key={y}
                    onClick={() => setFilterYear(y)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterYear === y ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                Array(4).fill(0).map((_, i) => <div key={i} className="h-24 bg-white rounded-[2rem] border border-slate-50 animate-pulse" />)
              ) : filteredHolidays.length > 0 ? (
                filteredHolidays.map((holiday) => (
                  <div key={holiday._id} className={`group bg-white p-8 rounded-[2.5rem] border transition-all duration-500 flex items-center gap-8 ${isUpcoming(holiday.date) ? 'border-indigo-100 shadow-lg shadow-indigo-500/5' : 'border-slate-50 shadow-sm'}`}>
                    <div className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center text-center shadow-inner shrink-0 transition-transform group-hover:rotate-3 ${isUpcoming(holiday.date) ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-900'}`}>
                      <span className="text-2xl font-black leading-none">{new Date(holiday.date).getDate()}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-70">{new Date(holiday.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors truncate">{holiday.name}</h3>
                        {isUpcoming(holiday.date) && <span className="px-3 py-1 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest rounded-lg animate-pulse">Live_Soon</span>}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase italic tracking-widest leading-relaxed line-clamp-1">{holiday.description || 'GENERIC_DOWNTIME_PROTOCOL'}</p>
                      <div className="mt-2 text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] italic">{new Date(holiday.date).toLocaleDateString(undefined, { weekday: 'long' })}</div>
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => openEditModal(holiday)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all">✏️</button>
                      <button onClick={() => handleDeleteHoliday(holiday._id)} className="p-4 bg-red-50 text-red-400 rounded-2xl hover:bg-red-100 hover:text-red-600 transition-all">🗑</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-24 rounded-[3rem] border-4 border-dashed border-slate-50 text-center">
                  <div className="text-7xl mb-8 opacity-20 grayscale">📅</div>
                  <h3 className="text-xl font-black text-slate-300 uppercase tracking-[0.3em] italic">No Cycle Logs for {filterYear}</h3>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-24 relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-indigo-400 italic">Next_Critical_Downtime</h3>
                {upcomingHolidays.length > 0 ? (
                  <div className="space-y-6">
                    {upcomingHolidays.map(h => (
                      <div key={h._id} className="group/item flex items-center gap-6 p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 transition-all">
                        <div className="text-3xl grayscale group-hover/item:grayscale-0 transition-all">🎉</div>
                        <div className="min-w-0">
                          <div className="text-sm font-black uppercase truncate pr-4">{h.name}</div>
                          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">{new Date(h.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] font-black text-slate-500 uppercase italic py-8 border-2 border-dashed border-white/10 rounded-3xl text-center">Continuous_Operation_Mode</p>
                )}
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-[1000] p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-24 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-12 duration-500" onClick={(e) => e.stopPropagation()}>
              <div className="p-10 bg-slate-900 text-white relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-[0.15em] mb-1">{showEditModal ? 'Edit_Cycle' : 'New_Protocol'}</h3>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic opacity-60">Maintenance_Interface // SEC_ACCESS</p>
                  </div>
                  <button onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditingHoliday(null); }} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center text-xl hover:bg-white/10 transition-all">×</button>
                </div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
              </div>

              <form onSubmit={showEditModal ? handleUpdateHoliday : handleAddHoliday} className="p-10 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Cycle_Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Mission Identity" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black uppercase tracking-tight outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Activation_Date *</label>
                  <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all uppercase" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Mission_Scope</label>
                  <textarea rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Rationale for downtime..." className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-medium text-slate-600 outline-none focus:bg-white focus:border-indigo-400 transition-all resize-none italic" />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditingHoliday(null); }} className="flex-1 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">Abort_Entry</button>
                  <button type="submit" className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-24 shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Authorize_Cycle</button>
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
        title="Cycle_Expunge_Registry"
        message={`Are you sure you want to permanently delete the cycle "${deleteModal.name}"? This action will restore 100% operation status for that date.`}
        itemName={deleteModal.name}
      />
    </Layout>
  );
};

export default HolidayManagement;
