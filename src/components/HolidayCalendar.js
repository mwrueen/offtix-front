import React, { useState, useEffect } from 'react';
import { useCompany } from '../context/CompanyContext';
import { useToast } from '../context/ToastContext';
import { holidayAPI, companyAPI } from '../services/api';
import Layout from './Layout';
import PageHeader from './PageHeader';
import DeleteConfirmModal from './common/DeleteConfirmModal';

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
    if (selectedCompany && selectedCompany.id !== 'personal') { fetchHolidays(); fetchCompanySettings(); }
  }, [selectedCompany]);

  useEffect(() => {
    const mu = () => { if (isDragging) handleMouseUp(); };
    document.addEventListener('mouseup', mu);
    return () => document.removeEventListener('mouseup', mu);
  }, [isDragging, dragStartDate, dragEndDate]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await holidayAPI.getAll(selectedCompany.id);
      setHolidays(res.data.holidays || []);
    } catch (e) {
      console.error('Failed to fetch holidays', e);
      toast?.showToast?.('Failed to load holidays.', 'error');
    } finally { setLoading(false); }
  };

  const fetchCompanySettings = async () => {
    try {
      const res = await companyAPI.getById(selectedCompany.id);
      const c = res.data;
      setCompanySettings({ workingDays: c.settings?.workingDays || [1, 2, 3, 4, 5], weekends: c.settings?.weekends || [0, 6] });
    } catch (e) { console.error('Error fetching company settings', e); }
  };

  const handleWeekendToggle = (day) => {
    setCompanySettings(prev => {
      const w = prev.weekends.includes(day) ? prev.weekends.filter(d => d !== day) : [...prev.weekends, day].sort();
      return { ...prev, weekends: w };
    });
  };

  const saveWeekendSettings = async () => {
    try {
      setSavingSettings(true);
      await companyAPI.updateSettings(selectedCompany.id, { workingDays: companySettings.workingDays, weekends: companySettings.weekends });
      toast.showToast('Weekend settings updated successfully.', 'success');
    } catch { toast.showToast('Failed to update settings.', 'error'); }
    finally { setSavingSettings(false); }
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
      const st = new Date(h.startDate); const en = new Date(h.endDate);
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
    const dh = getHolidaysForDate(cd);
    if (dh.length > 0) {
      const h = dh[0]; setEditingHoliday(h);
      setFormData({ date: h.isRange ? '' : h.date.split('T')[0], startDate: h.isRange ? h.startDate.split('T')[0] : '', endDate: h.isRange ? h.endDate.split('T')[0] : '', name: h.name, description: h.description || '', isRange: h.isRange });
      setShowEditModal(true);
    } else { setIsDragging(true); setDragStartDate(cd); setDragEndDate(cd); }
  };

  const handleMouseEnter = (day) => { if (isDragging) setDragEndDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day)); };

  const handleMouseUp = () => {
    if (isDragging && dragStartDate && dragEndDate) {
      const st = dragStartDate < dragEndDate ? dragStartDate : dragEndDate;
      const en = dragStartDate < dragEndDate ? dragEndDate : dragStartDate;
      const f = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const isSam = st.toDateString() === en.toDateString();
      setFormData({ date: isSam ? f(st) : '', startDate: isSam ? '' : f(st), endDate: isSam ? '' : f(en), name: '', description: '', isRange: !isSam });
      setShowAddModal(true);
    }
    setIsDragging(false); setDragStartDate(null); setDragEndDate(null);
  };

  const isInDragRange = (day) => {
    if (!isDragging || !dragStartDate || !dragEndDate) return false;
    const cd = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const s = dragStartDate < dragEndDate ? dragStartDate : dragEndDate;
    const e = dragStartDate < dragEndDate ? dragEndDate : dragStartDate;
    return cd >= s && cd <= e;
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    try { await holidayAPI.create(selectedCompany.id, formData); setShowAddModal(false); fetchHolidays(); toast.showToast('Holiday created successfully.', 'success'); }
    catch { toast.showToast('Failed to create holiday.', 'error'); }
  };

  const handleUpdateHoliday = async (e) => {
    e.preventDefault();
    try { await holidayAPI.update(selectedCompany.id, editingHoliday._id, formData); setShowEditModal(false); setEditingHoliday(null); fetchHolidays(); toast.showToast('Holiday updated.', 'success'); }
    catch { toast.showToast('Update failed.', 'error'); }
  };

  const confirmDeleteHoliday = async () => {
    try { await holidayAPI.delete(selectedCompany.id, editingHoliday._id); setShowEditModal(false); setEditingHoliday(null); setDeleteModal({ isOpen: false }); fetchHolidays(); toast.showToast('Holiday deleted.', 'warning'); }
    catch { toast.showToast('Delete failed.', 'error'); }
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];
    const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(<div key={`em-${i}`} className="bg-slate-50 opacity-20" />);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dh = getHolidaysForDate(date);
      const isTod = new Date().toDateString() === date.toDateString();
      const isW = companySettings.weekends.includes(date.getDay());
      const inD = isInDragRange(day);
      days.push(
        <div key={day} onMouseDown={() => handleMouseDown(day)} onMouseEnter={() => handleMouseEnter(day)} onMouseUp={handleMouseUp} className={`relative min-h-[140px] p-4 transition-all duration-300 group cursor-pointer border border-slate-50 ${inD ? 'bg-indigo-600 ring-4 ring-indigo-500/20 z-10' : isTod ? 'bg-indigo-50 border-indigo-200' : isW ? 'bg-slate-50/50 opacity-60' : 'bg-white hover:bg-slate-50'}`}>
          <div className={`text-xl font-bold italic tracking-tighter ${inD ? 'text-white' : isTod ? 'text-indigo-600' : isW ? 'text-rose-400' : 'text-slate-300'}`}>{day.toString().padStart(2, '0')}</div>
          <div className="mt-4 space-y-2">
            {dh.map((h, idx) => <div key={idx} className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight truncate shadow-sm italic ${inD ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'}`}>🎉 {h.name}</div>)}
          </div>
          {isTod && <div className="absolute top-4 right-4 text-[8px] font-bold text-indigo-400 uppercase tracking-widest italic animate-pulse">TODAY</div>}
        </div>
      );
    }
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-700">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
          {weekDays.map((d, i) => <div key={d} className={`py-4 text-center text-[10px] font-bold uppercase tracking-widest ${companySettings.weekends.includes(i) ? 'text-rose-500 bg-rose-50' : 'text-slate-400'}`}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 italic font-sans">{days}</div>
      </div>
    );
  };

  const changeMonth = (d) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + d, 1));
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  if (loading) return (
    <Layout>
      <div className="p-40 text-center animate-pulse space-y-8">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-sm" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Syncing holiday calendar...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-12 pb-40 animate-in fade-in duration-700">
        <PageHeader
          title="Holiday Calendar"
          subtitle="Manage organizational holidays, business hours, and operational downtime."
          icon="🗓️"
          stats={[
            { label: 'Active Holidays', value: holidays.length },
            { label: 'Fiscal Year', value: currentDate.getFullYear() }
          ]}
          actions={
            <div className="flex items-center gap-4">
              <button onClick={() => changeMonth(-1)} className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all font-bold text-lg shadow-sm">←</button>
              <div className="px-8 py-2.5 bg-slate-900 text-white rounded-xl flex items-center justify-center min-w-[240px] shadow-lg">
                <span className="text-sm font-bold uppercase italic tracking-widest">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
              </div>
              <button onClick={() => changeMonth(1)} className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all font-bold text-lg shadow-sm">→</button>
            </div>
          }
        />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-8 space-y-10">
            {renderCalendar()}
            <div className="p-8 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex items-center gap-6">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-md italic">!</div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest italic leading-relaxed">
                <span className="text-indigo-600 underline underline-offset-4 mr-2">Tip:</span> Drag across calendar dates to quickly establish a holiday range or business closure.
              </p>
            </div>
          </div>

          <div className="xl:col-span-4 space-y-10">
            <div className="bg-white p-8 lg:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 italic mb-10 flex items-center gap-3"> <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Business Weekends </h3>
              <div className="grid grid-cols-2 gap-3 mb-10 relative z-10">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
                  <button key={i} onClick={() => handleWeekendToggle(i)} className={`py-4 px-2 border rounded-xl text-center transition-all text-[10px] font-bold uppercase tracking-widest italic font-sans ${companySettings.weekends.includes(i) ? 'bg-rose-600 border-rose-500 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:border-indigo-100'}`}> {d} </button>
                ))}
              </div>
              <button onClick={saveWeekendSettings} disabled={savingSettings} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-600 active:scale-95 transition-all italic">
                {savingSettings ? 'Saving Settings...' : 'Apply Weekend Protocol'}
              </button>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden font-sans">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 italic mb-10">Calendar Legend</h3>
              <div className="space-y-6 relative z-10">
                {[
                  { icon: '!', label: 'Business Weekend', val: 'Non-working Day', color: 'rose-500' },
                  { icon: '✨', label: 'Reference Anchor', val: 'Current System Date', color: 'indigo-500' },
                  { icon: '🎉', label: 'Public Holiday', val: 'Operational Downtime', color: 'amber-500' }
                ].map((leg, i) => (
                  <div key={i} className="flex items-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                    <div className={`w-12 h-12 rounded-xl bg-${leg.color} flex items-center justify-center text-white text-xl font-bold shadow-lg`}>{leg.icon}</div>
                    <div className="flex-1">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 mb-1">{leg.label}</p>
                      <p className="text-xs font-bold italic uppercase tracking-tight">{leg.val}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && <Modal title="New Holiday Record" onClose={() => setShowAddModal(false)}>
        <form onSubmit={handleAddHoliday} className="space-y-8 font-sans">
          <div className="flex items-center gap-6 p-6 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer" onClick={() => setFormData({ ...formData, isRange: !formData.isRange })}>
            <div className={`w-10 h-5 rounded-full p-1 transition-all ${formData.isRange ? 'bg-indigo-600' : 'bg-slate-300'}`}>
              <div className={`w-3 h-3 bg-white rounded-full transition-all ${formData.isRange ? 'translate-x-5' : ''}`} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-900 uppercase tracking-widest italic">Multi-Day Holiday Range</div>
              <div className="text-[8px] font-bold text-slate-400 uppercase italic mt-0.5">Define a start and end date for this marker.</div>
            </div>
          </div>
          {formData.isRange ? (
            <div className="grid grid-cols-2 gap-6 animate-in slide-in-from-top-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:bg-white focus:border-indigo-400 transition-all font-sans" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:bg-white focus:border-indigo-400 transition-all font-sans" />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Specific Date</label>
              <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:bg-white focus:border-indigo-400 transition-all font-sans" />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Holiday Identifier / Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Annual Staff Retreat" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all italic" />
          </div>
          <div className="flex gap-4 pt-6 border-t border-slate-100 italic">
            <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">Abort</button>
            <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg hover:bg-slate-950 transition-all">Create Marker</button>
          </div>
        </form>
      </Modal>}

      {showEditModal && <Modal title="Update Holiday Record" onClose={() => setShowEditModal(false)}>
        <form onSubmit={handleUpdateHoliday} className="space-y-10 font-sans">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Marker Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all italic" />
          </div>
          <div className="flex justify-between items-center gap-10 pt-8 border-t border-slate-100 italic">
            <button type="button" onClick={() => setDeleteModal({ isOpen: true })} className="text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:underline">Remove Marker</button>
            <div className="flex gap-4">
              <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">Cancel</button>
              <button type="submit" className="px-10 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-950 transition-all">Save Changes</button>
            </div>
          </div>
        </form>
      </Modal>}

      <DeleteConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false })} onConfirm={confirmDeleteHoliday} title="Delete Holiday Record" message={`Are you sure you want to permanently remove "${editingHoliday?.name}"? This action cannot be reversed and will affect operational availability logs.`} />
    </Layout>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 backdrop-blur-sm bg-slate-900/40 animate-in fade-in duration-300">
    <div className="bg-white rounded-[2.5rem] w-full max-w-xl p-8 lg:p-12 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-500 relative overflow-hidden font-sans">
      <div className="flex justify-between items-center mb-10 relative z-10">
        <h3 className="text-2xl font-bold text-slate-900 uppercase italic tracking-tight"> {title} </h3>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl text-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all font-bold">×</button>
      </div>
      <div className="relative z-10"> {children} </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
    </div>
  </div>
);

export default HolidayCalendar;
