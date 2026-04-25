import React, { useMemo, useState } from 'react';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const fmtKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

const CalendarView = ({ tasks = [], taskRoles = [], onSelectTask }) => {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; });
  const [roleFilter, setRoleFilter] = useState('');

  const today = useMemo(() => startOfDay(new Date()), []);

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const gridStart = new Date(first); gridStart.setDate(first.getDate() - first.getDay());
    const gridEnd = new Date(last); gridEnd.setDate(last.getDate() + (6 - last.getDay()));
    const arr = [];
    for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) arr.push(new Date(d));
    return arr;
  }, [cursor]);

  const events = useMemo(() => {
    const result = [];
    tasks.forEach((task) => {
      if (roleFilter) {
        const ra = task.roleAssignments?.find((r) => (r.role?._id || r.role) === roleFilter);
        if (ra?.startDate && ra?.dueDate) {
          result.push({
            task,
            start: new Date(ra.startDate),
            end: new Date(ra.dueDate),
            color: ra.role?.color || '#6366f1',
            label: task.title,
            sub: ra.role?.name,
          });
        }
      } else {
        const ras = (task.roleAssignments || []).filter((r) => r.startDate && r.dueDate);
        if (ras.length > 0) {
          ras.forEach((ra) => {
            result.push({
              task,
              start: new Date(ra.startDate),
              end: new Date(ra.dueDate),
              color: ra.role?.color || '#6366f1',
              label: task.title,
              sub: ra.role?.name,
            });
          });
        } else if (task.startDate && task.dueDate) {
          result.push({
            task,
            start: new Date(task.startDate),
            end: new Date(task.dueDate),
            color: '#6366f1',
            label: task.title,
          });
        }
      }
    });
    return result;
  }, [tasks, roleFilter]);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    days.forEach((d) => {
      const ds = startOfDay(d).getTime();
      const de = endOfDay(d).getTime();
      const evs = events.filter((ev) => ev.start.getTime() <= de && ev.end.getTime() >= ds);
      map.set(fmtKey(d), evs);
    });
    return map;
  }, [days, events]);

  const goPrev = () => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  const goNext = () => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  const goToday = () => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); setCursor(d); };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <button onClick={goPrev} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm">←</button>
          <h3 className="text-sm font-bold text-slate-900 min-w-[180px] text-center tracking-tight">{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</h3>
          <button onClick={goNext} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm">→</button>
          <button onClick={goToday} className="ml-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-indigo-600 hover:bg-slate-50 shadow-sm">Today</button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role Filter:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-indigo-400"
          >
            <option value="">All Roles</option>
            {taskRoles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-7 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
        {DOW.map((d) => (
          <div key={d} className="px-3 py-2 text-center border-r border-white/5 last:border-r-0">{d}</div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
        {days.map((day) => {
          const inMonth = day.getMonth() === cursor.getMonth();
          const isToday = day.getTime() === today.getTime();
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const evs = eventsByDay.get(fmtKey(day)) || [];
          const visible = evs.slice(0, 3);
          const more = evs.length - visible.length;
          return (
            <div
              key={fmtKey(day)}
              className={`min-h-[110px] p-1.5 flex flex-col ${inMonth ? 'bg-white' : 'bg-slate-50/40'} ${isWeekend && inMonth ? 'bg-slate-50/60' : ''}`}
            >
              <div className="flex items-center mb-1">
                <span
                  className={`text-[11px] font-bold px-1 ${isToday
                    ? 'bg-indigo-600 text-white rounded w-6 h-6 flex items-center justify-center'
                    : inMonth ? 'text-slate-700' : 'text-slate-300'}`}
                >
                  {day.getDate()}
                </span>
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {visible.map((ev, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectTask?.(ev.task)}
                    className="w-full text-left text-[9px] font-bold text-white px-1.5 py-0.5 rounded truncate hover:opacity-90 transition-opacity"
                    style={{ background: ev.color }}
                    title={ev.sub ? `${ev.label} — ${ev.sub}` : ev.label}
                  >
                    {ev.label}
                  </button>
                ))}
                {more > 0 && (
                  <div className="text-[9px] font-bold text-slate-400 px-1">+{more} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
