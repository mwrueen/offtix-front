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
    } catch (e) { console.error('Holiday_Registry_Sync_Failure', e); }
    finally { setLoading(false); }
  };

  const fetchCompanySettings = async () => {
    try {
      const res = await companyAPI.getById(selectedCompany.id);
      const c = res.data;
      setCompanySettings({ workingDays: c.settings?.workingDays || [1, 2, 3, 4, 5], weekends: c.settings?.weekends || [0, 6] });
    } catch (e) { console.error('Settings_Uplink_Error', e); }
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
      toast.showToast('TEMPORAL_SECTOR_BOUNDS_LOCKED', 'success');
    } catch { toast.showToast('RECALIBRATION_FAILED', 'error'); }
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
    try { await holidayAPI.create(selectedCompany.id, formData); setShowAddModal(false); fetchHolidays(); toast.showToast('TEMPORAL_MARKER_ESTABLISHED', 'success'); }
    catch { toast.showToast('INJECTION_REJECTED', 'error'); }
  };

  const handleUpdateHoliday = async (e) => {
    e.preventDefault();
    try { await holidayAPI.update(selectedCompany.id, editingHoliday._id, formData); setShowEditModal(false); setEditingHoliday(null); fetchHolidays(); toast.showToast('PROTOCOL_SYNCHRONIZED', 'success'); }
    catch { toast.showToast('LOG_SYNC_FAILURE', 'error'); }
  };

  const confirmDeleteHoliday = async () => {
    try { await holidayAPI.delete(selectedCompany.id, editingHoliday._id); setShowEditModal(false); setEditingHoliday(null); setDeleteModal({ isOpen: false }); fetchHolidays(); toast.showToast('MARKER_EXCISED_SUCCESSFULLY', 'warning'); }
    catch { toast.showToast('PURGE_DIRECTIVE_FAILURE', 'error'); }
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
        <div key={day} onMouseDown={() => handleMouseDown(day)} onMouseEnter={() => handleMouseEnter(day)} onMouseUp={handleMouseUp} className={`relative min-h-[160px] p-6 transition-all duration-300 group cursor-pointer border border-slate-50 ${inD ? 'bg-indigo-600 ring-8 ring-indigo-500/10 z-10' : isTod ? 'bg-indigo-50 border-indigo-200' : isW ? 'bg-slate-50/50 grayscale-[0.5] opacity-60' : 'bg-white hover:bg-slate-50'}`}>
          <div className={`text-2xl font-black italic tracking-tighter ${inD ? 'text-white' : isTod ? 'text-indigo-600' : isW ? 'text-rose-400' : 'text-slate-200'}`}>{day.toString().padStart(2, '0')}</div>
          <div className="mt-6 space-y-3">
            {dh.map((h, idx) => <div key={idx} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest truncate shadow-sm italic ${inD ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'}`}>🎉 {h.name}</div>)}
          </div>
          {isTod && <div className="absolute top-6 right-6 text-[8px] font-black text-indigo-400 uppercase tracking-widest italic animate-pulse">ACTIVE_NODE</div>}
        </div>
      );
    }
    return (
      <div className="bg-white rounded-[5rem] border border-slate-100 shadow-24 overflow-hidden animate-in fade-in duration-1000">
        <div className="grid grid-cols-7 border-b border-slate-50 bg-slate-50/30">
          {weekDays.map((d, i) => <div key={d} className={`py-8 text-center text-[10px] font-black uppercase tracking-[0.5em] ${companySettings.weekends.includes(i) ? 'text-rose-500 bg-rose-50/40' : 'text-slate-400'}`}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 italic">{days}</div>
      </div>
    );
  };

  const changeMonth = (d) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + d, 1));
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  if (loading) return (
    <Layout>
      <div className="max-w-[1600px] mx-auto px-10 py-40 text-center animate-pulse space-y-12">
        <div className="w-24 h-24 border-8 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-24" />
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em] italic">SYNCHRONIZING_TEMPORAL_SECTOR_DATA...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto px-10 py-16 space-y-20 animate-in fade-in duration-1000">
        <PageHeader
          title="TEMPORAL_MARKER_REGISTRY"
          subtitle="Define organizational downtime protocols and weekend sector parameters."
          icon={<div className="w-16 h-16 bg-slate-950 text-white rounded-full flex items-center justify-center text-3xl shadow-24 border-4 border-white/10 italic">🌍</div>}
          stats={[{ label: 'MARKERS_ACTIVE', value: holidays.length }, { label: 'CURRENT_CYCLE', value: currentDate.getFullYear() }]}
          actions={
            <div className="flex items-center gap-6">
              <button onClick={() => changeMonth(-1)} className="w-16 h-16 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm hover:shadow-24 active:scale-90 italic font-black text-2xl">←</button>
              <div className="px-16 py-5 bg-slate-950 text-white rounded-[2.5rem] flex items-center justify-center min-w-[300px] shadow-24 border border-white/5">
                <span className="text-2xl font-black uppercase italic tracking-tighter">{monthNames[currentDate.getMonth()].toUpperCase()} {currentDate.getFullYear()}</span>
              </div>
              <button onClick={() => changeMonth(1)} className="w-16 h-16 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm hover:shadow-24 active:scale-90 italic font-black text-2xl">→</button>
            </div>
          }
        />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">
          <div className="xl:col-span-8 space-y-12">
            {renderCalendar()}
            <div className="p-10 bg-slate-950/5 rounded-[3rem] border-l-[10px] border-indigo-600 flex items-center gap-8">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl shadow-24 italic">!</div>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic leading-relaxed"> <span className="text-indigo-600 underline underline-offset-8 mr-4">RECALIBRATION_PROTOCOL:</span> Drag across temporal units to establish range markers. Interaction with existing nodes initiates protocol modification or expulsion. </p>
            </div>
          </div>

          <div className="xl:col-span-4 space-y-16">
            <div className="bg-white p-12 rounded-[4.5rem] border border-slate-100 shadow-24 relative overflow-hidden group">
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400 italic mb-12 flex items-center gap-4"> <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> WEEKEND_SECTOR_PROTOCOL </h3>
              <div className="grid grid-cols-2 gap-4 mb-12 relative z-10">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
                  <button key={i} onClick={() => handleWeekendToggle(i)} className={`py-5 px-4 border-2 rounded-[1.5rem] text-center transition-all duration-700 text-[10px] font-black uppercase tracking-[0.2em] italic ${companySettings.weekends.includes(i) ? 'bg-rose-500 border-rose-400 text-white shadow-24 shadow-rose-500/20' : 'bg-slate-50 border-slate-50 text-slate-400 hover:bg-white hover:border-indigo-100'}`}> {d} </button>
                ))}
              </div>
              <button onClick={saveWeekendSettings} disabled={savingSettings} className="w-full py-7 bg-slate-950 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-24 hover:bg-indigo-600 active:scale-95 transition-all group overflow-hidden relative italic">
                <span className="relative z-10">{savingSettings ? 'SYNCING_PROTOCOL...' : 'LOCK_SECTOR_BOUNDS'}</span>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_3s_infinite]" />
              </button>
              <div className="absolute top-0 right-0 p-12 text-7xl font-black italic opacity-5 pointer-events-none">SEC_DEF</div>
            </div>

            <div className="bg-slate-950 p-12 rounded-[5rem] text-white shadow-24 relative overflow-hidden animate-in slide-in-from-bottom-20 duration-1000 delay-300">
              <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-white/30 italic mb-12 text-center">MISSION_LOG_LEGEND</h3>
              <div className="space-y-8 relative z-10">
                {[{ icon: '!', label: 'RESERVED_SECTOR', val: 'DEFINED_WEEKEND', color: 'rose-500' }, { icon: '✨', label: 'NODE_CURRENT', val: 'ACTIVE_TODAY', color: 'indigo-500' }, { icon: '🎉', label: 'DOWNTIME_MARKER', val: 'PUBLIC_HOLIDAY', color: 'amber-500' }].map((leg, i) => (
                  <div key={i} className="flex items-center gap-8 p-6 bg-white/5 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-all group/leg">
                    <div className={`w-16 h-16 rounded-2xl bg-${leg.color} flex items-center justify-center text-white text-3xl font-black italic border-4 border-white/10 shadow-24`}>{leg.icon}</div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mb-1">{leg.label}</p>
                      <p className="text-sm font-black italic uppercase tracking-tighter">{leg.val}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && <Modal title="ESTABLISH_TEMPORAL_MARKER" onClose={() => setShowAddModal(false)}>
        <form onSubmit={handleAddHoliday} className="space-y-10">
          <div className="flex items-center gap-10 p-8 bg-slate-50 border border-slate-50 rounded-[3rem] transition-all hover:border-indigo-100" onClick={() => setFormData({ ...formData, isRange: !formData.isRange })}>
            <div className={`w-16 h-8 rounded-full p-1.5 transition-all cursor-pointer ${formData.isRange ? 'bg-indigo-600' : 'bg-slate-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full transition-all ${formData.isRange ? 'translate-x-8' : ''}`} />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-950 uppercase tracking-[0.4em] italic">RANGE_SEQUENCE_ACTIVE</div>
              <div className="text-[8px] font-black text-slate-400 uppercase italic mt-1">ENABLE_MULTI_UNIT_INJECTION</div>
            </div>
          </div>
          {formData.isRange ? (
            <div className="grid grid-cols-2 gap-8 animate-in slide-in-from-top-12">
              <div className="space-y-2 px-4">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">ORIGIN_DATE</label>
                <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} required className="w-full px-8 py-5 bg-slate-50 rounded-[1.5rem] border-2 border-transparent font-black text-sm italic outline-none focus:border-indigo-400 transition-all" />
              </div>
              <div className="space-y-2 px-4">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">TERMINUS_DATE</label>
                <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} required className="w-full px-8 py-5 bg-slate-50 rounded-[1.5rem] border-2 border-transparent font-black text-sm italic outline-none focus:border-indigo-400 transition-all" />
              </div>
            </div>
          ) : (
            <div className="space-y-2 px-4 animate-in slide-in-from-top-12">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">TEMPORAL_NODE_ID</label>
              <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required className="w-full px-10 py-6 bg-slate-50 rounded-[2.5rem] border-2 border-transparent font-black text-lg italic outline-none focus:border-indigo-400 transition-all" />
            </div>
          )}
          <div className="space-y-2 px-4">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">MARKER_IDENTIFIER</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="E.G. GLOBAL_SYNCHRONIZATION_VACATION" className="w-full px-10 py-6 bg-slate-50 rounded-[2.5rem] border-2 border-transparent font-black text-sm uppercase italic tracking-[0.1em] outline-none focus:bg-white focus:border-indigo-400 focus:shadow-24 transition-all" />
          </div>
          <div className="flex gap-6 pt-10 border-t border-slate-50">
            <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-slate-950 transition-all italic">ABORT</button>
            <button type="submit" className="flex-[2] py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-24 hover:bg-slate-950 transition-all italic">ESTABLISH_MARKER</button>
          </div>
        </form>
      </Modal>}

      {showEditModal && <Modal title="RECALIBRATE_MARKER_LOG" onClose={() => setShowEditModal(false)}>
        <form onSubmit={handleUpdateHoliday} className="space-y-12">
          <div className="space-y-2 px-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">CURRENT_MARKER_IDENT</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="w-full px-10 py-7 bg-slate-50 rounded-[2.5rem] border-2 border-transparent font-black text-sm uppercase italic tracking-[0.1em] outline-none focus:bg-white focus:border-indigo-400 focus:shadow-24 transition-all" />
          </div>
          <div className="flex justify-between items-center gap-10 pt-10 border-t border-slate-50 px-4">
            <button type="button" onClick={() => setDeleteModal({ isOpen: true })} className="py-3 text-[10px] font-black uppercase tracking-[0.5em] text-rose-500 border-b-4 border-rose-500/20 hover:border-rose-500 transition-all italic">PURGE_REGISTRY</button>
            <div className="flex gap-6">
              <button type="button" onClick={() => setShowEditModal(false)} className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-950 transition-all italic">CANCEL</button>
              <button type="submit" className="px-12 py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-24 hover:bg-slate-950 transition-all italic">COMMIT_PROTOCOL</button>
            </div>
          </div>
        </form>
      </Modal>}

      <DeleteConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false })} onConfirm={confirmDeleteHoliday} title="PURGE_REGISTRY_MARKER" message={`Confirmation required for permanent excision of ${editingHoliday?.name} from organogram organic registry. Protocol status: IRREVERSIBLE.`} />
    </Layout>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center p-10 backdrop-blur-2xl bg-slate-900/60 animate-in fade-in duration-500">
    <div className="bg-white rounded-[5rem] w-full max-w-2xl p-16 shadow-24 border border-slate-100 animate-in zoom-in-95 duration-300 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-16 text-7xl font-black italic opacity-5 grayscale pointer-events-none">TEMPORAL</div>
      <div className="flex justify-between items-center mb-16 relative z-10">
        <h3 className="text-2xl font-black text-slate-950 uppercase italic tracking-tighter"> {title} </h3>
        <button onClick={onClose} className="w-16 h-16 flex items-center justify-center bg-slate-50 rounded-[2rem] text-3xl text-slate-400 hover:text-slate-950 hover:bg-white hover:shadow-24 transition-all">×</button>
      </div>
      <div className="relative z-10"> {children} </div>
    </div>
  </div>
);

export default HolidayCalendar;
