import React, { useState, useEffect } from 'react';
import { useCompany } from '../../context/CompanyContext';
import { useToast } from '../../context/ToastContext';
import { holidayAPI, companyAPI } from '../../services/api';
import Layout from '../layout/Layout';
import PageHeader from '../layout/PageHeader';
import DeleteConfirmModal from '../common/DeleteConfirmModal';

const HolidayCalendar = () => {
  const { state } = useCompany();
  const selectedCompany = state.selectedCompany;
  const toast = useToast();
  const [holidays, setHolidays] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [formData, setFormData] = useState({ date: '', startDate: '', endDate: '', name: '', description: '', isRange: false });
  const [loading, setLoading] = useState(true);
  const [companySettings, setCompanySettings] = useState({ workingDays: [1, 2, 3, 4, 5], weekends: [0, 6] });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false });
  const [savingSettings, setSavingSettings] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState(null);
  const [dragEndDate, setDragEndDate] = useState(null);

  useEffect(() => {
    if (selectedCompany && selectedCompany.id !== 'personal') {
      fetchHolidays();
      fetchCompanySettings();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany]);

  useEffect(() => {
    const handleMouseUpGlobal = () => {
      if (isDragging) handleMouseUp();
    };
    document.addEventListener('mouseup', handleMouseUpGlobal);
    return () => document.removeEventListener('mouseup', handleMouseUpGlobal);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, dragStartDate, dragEndDate]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await holidayAPI.getAll(selectedCompany.id);
      setHolidays(res.data.holidays || []);
    } catch (e) {
      console.error('Failed to fetch holidays', e);
      toast?.showToast?.('Failed to load holidays.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const res = await companyAPI.getById(selectedCompany.id);
      const c = res.data;
      setCompanySettings({
        workingDays: c.settings?.workingDays || [1, 2, 3, 4, 5],
        weekends: c.settings?.weekends || [0, 6]
      });
    } catch (e) {
      console.error('Error fetching company settings', e);
    }
  };

  const handleWeekendToggle = (day) => {
    setCompanySettings(prev => {
      const weekends = prev.weekends.includes(day)
        ? prev.weekends.filter(d => d !== day)
        : [...prev.weekends, day].sort();
      return { ...prev, weekends };
    });
  };

  const saveWeekendSettings = async () => {
    try {
      setSavingSettings(true);
      await companyAPI.updateSettings(selectedCompany.id, {
        workingDays: companySettings.workingDays,
        weekends: companySettings.weekends
      });
      toast.showToast('Weekend settings updated successfully.', 'success');
    } catch {
      toast.showToast('Failed to update settings.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const getDaysInMonth = (date) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const fd = new Date(y, m, 1);
    const ld = new Date(y, m + 1, 0);
    return { daysInMonth: ld.getDate(), startingDayOfWeek: fd.getDay(), year: y, month: m };
  };

  const getHolidaysForDate = (date) => holidays.filter(h => {
    const cd = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (h.isRange) {
      const st = new Date(h.startDate);
      const en = new Date(h.endDate);
      const sck = new Date(st.getUTCFullYear(), st.getUTCMonth(), st.getUTCDate());
      const eck = new Date(en.getUTCFullYear(), en.getUTCMonth(), en.getUTCDate());
      return cd >= sck && cd <= eck;
    }
    if (!h.date) return false;
    const hd = new Date(h.date);
    return hd.getUTCDate() === date.getDate() && hd.getUTCMonth() === date.getMonth() && hd.getUTCFullYear() === date.getFullYear();
  });

  const handleMouseDown = (day) => {
    const cd = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayHolidays = getHolidaysForDate(cd);
    if (dayHolidays.length > 0) {
      const h = dayHolidays[0];
      setEditingHoliday(h);
      setFormData({
        date: h.isRange ? '' : h.date.split('T')[0],
        startDate: h.isRange ? h.startDate.split('T')[0] : '',
        endDate: h.isRange ? h.endDate.split('T')[0] : '',
        name: h.name,
        description: h.description || '',
        isRange: h.isRange
      });
      setShowEditModal(true);
    } else {
      setIsDragging(true);
      setDragStartDate(cd);
      setDragEndDate(cd);
    }
  };

  const handleMouseEnterDay = (day) => {
    if (isDragging) {
      setDragEndDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStartDate && dragEndDate) {
      const start = dragStartDate < dragEndDate ? dragStartDate : dragEndDate;
      const end = dragStartDate < dragEndDate ? dragEndDate : dragStartDate;
      const formatDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const isSameDay = start.toDateString() === end.toDateString();

      setFormData({
        date: isSameDay ? formatDateStr(start) : '',
        startDate: isSameDay ? '' : formatDateStr(start),
        endDate: isSameDay ? '' : formatDateStr(end),
        name: '',
        description: '',
        isRange: !isSameDay
      });
      setShowAddModal(true);
    }
    setIsDragging(false);
    setDragStartDate(null);
    setDragEndDate(null);
  };

  const isInDragRange = (day) => {
    if (!isDragging || !dragStartDate || !dragEndDate) return false;
    const cd = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const start = dragStartDate < dragEndDate ? dragStartDate : dragEndDate;
    const end = dragStartDate < dragEndDate ? dragEndDate : dragStartDate;
    return cd >= start && cd <= end;
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    try {
      await holidayAPI.create(selectedCompany.id, formData);
      setShowAddModal(false);
      fetchHolidays();
      toast.showToast('Holiday successfully added.', 'success');
    } catch {
      toast.showToast('Could not register holiday.', 'error');
    }
  };

  const handleUpdateHoliday = async (e) => {
    e.preventDefault();
    try {
      await holidayAPI.update(selectedCompany.id, editingHoliday._id, formData);
      setShowEditModal(false);
      setEditingHoliday(null);
      fetchHolidays();
      toast.showToast('Holiday updated.', 'success');
    } catch {
      toast.showToast('Update failed.', 'error');
    }
  };

  const confirmDeleteHoliday = async () => {
    try {
      await holidayAPI.delete(selectedCompany.id, editingHoliday._id);
      setShowEditModal(false);
      setEditingHoliday(null);
      setDeleteModal({ isOpen: false });
      fetchHolidays();
      toast.showToast('Holiday removed.', 'warning');
    } catch {
      toast.showToast('Removal failed.', 'error');
    }
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];
    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Fill empty cells
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="bg-slate-50/30" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayHolidays = getHolidaysForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();
      const isWeekend = companySettings.weekends.includes(date.getDay());
      const inDrag = isInDragRange(day);

      days.push(
        <div
          key={day}
          onMouseDown={() => handleMouseDown(day)}
          onMouseEnter={() => handleMouseEnterDay(day)}
          onMouseUp={handleMouseUp}
          className={`relative min-h-[120px] p-3 transition-all group cursor-pointer border border-slate-100/50 
            ${inDrag ? 'bg-indigo-600 z-10' :
              isToday ? 'bg-indigo-50/50 border-indigo-200' :
                isWeekend ? 'bg-slate-50/50' : 'bg-white hover:bg-slate-50'}`}
        >
          <div className="flex justify-between items-start mb-4">
            <span className={`text-xl font-bold tracking-tight ${inDrag ? 'text-white' : isToday ? 'text-indigo-600' : isWeekend ? 'text-slate-400' : 'text-slate-300'}`}>
              {day}
            </span>
            {isToday && (
              <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-100 px-1.5 py-0.5 rounded">Today</span>
            )}
          </div>
          <div className="space-y-1.5">
            {dayHolidays.map((h, idx) => (
              <div
                key={idx}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight truncate shadow-sm 
                  ${inDrag ? 'bg-white/20 text-white' : 'bg-rose-500 text-white flex items-center gap-1.5'}`}
              >
                {!inDrag && <span className="opacity-70">🎊</span>}
                {h.name}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
          {weekDays.map((d, i) => (
            <div key={d} className={`py-4 text-center text-[10px] font-bold uppercase tracking-widest ${companySettings.weekends.includes(i) ? 'text-rose-500 bg-rose-50/30' : 'text-slate-400'}`}>
              {d.slice(0, 3)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">{days}</div>
      </div>
    );
  };

  const changeMonth = (delta) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  if (loading) return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-40 space-y-6">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-sm" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Refreshing agenda...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-8 pb-40">
        <PageHeader
          title="Holiday Agenda"
          subtitle="Visualize and manage statutory holidays, corporate closures, and regional observations."
          icon="🗓️"
          stats={[
            { label: 'Public Holidays', value: holidays.length },
            { label: 'Fiscal Year', value: currentDate.getFullYear() }
          ]}
          actions={
            <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
              <button onClick={() => changeMonth(-1)} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <div className="px-6 py-2 min-w-[200px] text-center">
                <span className="text-sm font-bold text-slate-900 tracking-tight">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
              </div>
              <button onClick={() => changeMonth(1)} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
          }
        />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8 space-y-8">
            {renderCalendar()}
            <div className="p-5 bg-slate-900 rounded-2xl text-white flex items-center gap-4 border border-white/5 shadow-md">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white text-lg font-bold">💡</div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                <span className="text-white mr-2">Configuration Tip:</span> Click and drag across multiple dates to quickly register a contiguous holiday range or office closure.
              </p>
            </div>
          </div>

          <div className="xl:col-span-4 space-y-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Regular Weekends</h3>
              </div>
              <div className="grid grid-cols-2 gap-2.5 mb-8">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                  <button
                    key={i}
                    onClick={() => handleWeekendToggle(i)}
                    className={`py-3.5 border rounded-xl text-center transition-all text-[11px] font-extrabold uppercase tracking-widest 
                      ${companySettings.weekends.includes(i) ? 'bg-rose-600 border-rose-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:border-slate-300'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <button
                onClick={saveWeekendSettings}
                disabled={savingSettings}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg hover:bg-indigo-600 active:scale-95 transition-all"
              >
                {savingSettings ? 'Synchronizing...' : 'Save Weekend Settings'}
              </button>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-fit">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8">Calendar Key</h3>
              <div className="space-y-4">
                {[
                  { icon: '!', label: 'Regional Weekend', val: 'Non-Operational Day', color: 'rose-500' },
                  { icon: '🗓️', label: 'Current Date', val: 'Reference Point', color: 'indigo-600' },
                  { icon: '🎊', label: 'Public Holiday', val: 'Global/Office Closure', color: 'emerald-500' }
                ].map((leg, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50 group hover:border-indigo-100 transition-all">
                    <div className={`w-10 h-10 rounded-xl bg-${leg.color} flex items-center justify-center text-white text-lg font-bold shadow-sm`}>
                      {leg.icon}
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-500 mb-0.5">{leg.label}</p>
                      <p className="text-xs font-bold text-slate-900 tracking-tight">{leg.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <Modal title="Register Holiday" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddHoliday} className="space-y-6">
            <div
              className="flex items-center gap-5 p-5 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-white transition-all"
              onClick={() => setFormData({ ...formData, isRange: !formData.isRange })}
            >
              <div className={`w-10 h-5 rounded-full p-0.5 transition-all flex items-center ${formData.isRange ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-all ${formData.isRange ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Contiguous Date Range</div>
                <div className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Toggle to define multiple sequential days.</div>
              </div>
            </div>

            {formData.isRange ? (
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Commencement Date</label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:bg-white focus:border-indigo-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Conclusion Date</label>
                  <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:bg-white focus:border-indigo-500 transition-all" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Observance Date</label>
                <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:bg-white focus:border-indigo-500 transition-all" />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Holiday Designation</label>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Regional Cultural Festival" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all" />
            </div>

            <div className="flex gap-3 pt-6">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">Cancel</button>
              <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all active:scale-95">Register Holiday</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <Modal title="Update Holiday" onClose={() => setShowEditModal(false)}>
          <form onSubmit={handleUpdateHoliday} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Holiday Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all" />
            </div>

            <div className="flex justify-between items-center gap-10 pt-6">
              <button type="button" onClick={() => setDeleteModal({ isOpen: true })} className="text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:underline">Remove Entry</button>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">Cancel</button>
                <button type="submit" className="px-10 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all active:scale-95">Update Record</button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={confirmDeleteHoliday}
        title="Delete Holiday Record"
        message={`Are you sure you want to permanently remove "${editingHoliday?.name}"? This action will affect attendance logs and operational records.`}
      />
    </Layout>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 backdrop-blur-sm bg-slate-900/40">
    <div className="bg-white rounded-2xl w-full max-w-xl p-8 lg:p-10 shadow-xl border border-slate-200 relative overflow-hidden">
      <div className="flex justify-between items-center mb-10 relative z-10">
        <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{title}</h3>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl text-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="relative z-10">{children}</div>
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
    </div>
  </div>
);

export default HolidayCalendar;

