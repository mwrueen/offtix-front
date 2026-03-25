import React, { useState, useEffect, useRef, useMemo } from 'react';

const GanttView = ({ tasks, onEditTask, project, company, taskRoles = [] }) => {
  const ganttRef = useRef(null);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [expandedTasks, setExpandedTasks] = useState(new Set());

  const DAY_WIDTH = 48;
  const SIDEBAR_WIDTH = 320;

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  const { startDate, totalDays, dateHeaders } = useMemo(() => {
    let min = project?.startDate ? new Date(project.startDate) : new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    let max = project?.endDate ? new Date(project.endDate) : new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
    const paddedStart = new Date(min.getTime() - 7 * 24 * 60 * 60 * 1000);
    const paddedEnd = new Date(max.getTime() + 30 * 24 * 60 * 60 * 1000);
    paddedStart.setHours(0, 0, 0, 0); paddedEnd.setHours(0, 0, 0, 0);
    const days = Math.ceil((paddedEnd - paddedStart) / (1000 * 60 * 60 * 24));
    const headers = [];
    for (let i = 0; i < days; i++) { const d = new Date(paddedStart); d.setDate(d.getDate() + i); headers.push(d); }
    return { startDate: paddedStart, totalDays: days, dateHeaders: headers };
  }, [project, today]);

  const monthHeaders = useMemo(() => {
    const groups = [];
    dateHeaders.forEach(date => {
      const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (groups.length === 0 || groups[groups.length - 1].label !== label) groups.push({ label, count: 1 });
      else groups[groups.length - 1].count++;
    });
    return groups;
  }, [dateHeaders]);

  const todayPosition = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) * DAY_WIDTH;
  const filteredTasks = selectedRoleFilter ? tasks.filter(t => t.roleAssignments?.some(ra => (ra.role?._id || ra.role) === selectedRoleFilter)) : tasks;

  const getBarPosition = (s, e) => {
    let start = s ? new Date(s) : null; let end = e ? new Date(e) : null;
    if (!start || !end) return null;
    start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999);
    const offset = (start - startDate) / (1000 * 60 * 60 * 24);
    const duration = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    return { left: offset * DAY_WIDTH, width: duration * DAY_WIDTH };
  };

  useEffect(() => {
    if (ganttRef.current) {
      const scroll = ganttRef.current.querySelector('.gantt-scroll');
      if (scroll) scroll.scrollLeft = Math.max(0, todayPosition - 200);
    }
  }, [todayPosition]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-slate-200" ref={ganttRef}>
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Project Timeline</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Visual schedule of tasks and roles</p>
          </div>
          <button
            onClick={() => { const s = ganttRef.current.querySelector('.gantt-scroll'); s.scrollLeft = todayPosition - 200; }}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-indigo-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Jump to Today
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role Filter:</span>
          <select value={selectedRoleFilter} onChange={e => setSelectedRoleFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-indigo-400">
            <option value="">All Roles</option>
            {taskRoles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative">
        <div className="flex border-b border-slate-200 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider shrink-0">
          <div className="w-[320px] p-4 border-r border-white/10 flex items-center">Mission Outline</div>
          <div className="flex-1 overflow-hidden">
            <div className="flex border-b border-white/5">
              {monthHeaders.map((m, i) => (
                <div key={i} className="p-3 border-r border-white/5 whitespace-nowrap" style={{ width: m.count * DAY_WIDTH }}>{m.label}</div>
              ))}
            </div>
            <div className="flex bg-slate-800">
              {dateHeaders.map((d, i) => {
                const isToday = d.toDateString() === today.toDateString();
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div key={i} className={`h-10 flex flex-col items-center justify-center text-[9px] border-r border-white/5 shrink-0 ${isToday ? 'bg-indigo-600 text-white' : isWeekend ? 'bg-white/5 opacity-50' : 'opacity-70'}`} style={{ width: DAY_WIDTH }}>
                    <span className="font-bold">{d.getDate()}</span>
                    <span className="text-[7px] font-medium opacity-60 uppercase">{d.toLocaleDateString('en', { weekday: 'short' }).charAt(0)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="gantt-scroll flex-1 overflow-auto relative">
          <div className="relative min-w-max">
            <div className="absolute inset-0 flex pointer-events-none" style={{ marginLeft: SIDEBAR_WIDTH }}>
              {dateHeaders.map((d, i) => (
                <div key={i} className={`h-full border-r shrink-0 ${d.toDateString() === today.toDateString() ? 'border-indigo-500/20 bg-indigo-50/10' : 'border-slate-100'}`} style={{ width: DAY_WIDTH }} />
              ))}
            </div>

            <div className="absolute top-0 bottom-0 w-px bg-indigo-500 z-30 pointer-events-none shadow-sm" style={{ left: SIDEBAR_WIDTH + todayPosition + DAY_WIDTH / 2 }} />

            <div className="divide-y divide-slate-100">
              {filteredTasks.map(task => {
                const bar = getBarPosition(task.startDate, task.dueDate);
                const isExpanded = expandedTasks.has(task._id);
                return (
                  <div key={task._id} className="relative">
                    <div className="flex items-center min-h-[60px] group transition-colors bg-white hover:bg-slate-50/50">
                      <div className="w-[320px] px-6 py-4 shrink-0 border-r border-slate-100 flex items-center gap-4">
                        {task.roleAssignments?.length > 0 && (
                          <button onClick={() => { const next = new Set(expandedTasks); if (next.has(task._id)) next.delete(task._id); else next.add(task._id); setExpandedTasks(next); }} className={`w-5 h-5 rounded flex items-center justify-center transition-all ${isExpanded ? 'bg-indigo-600 text-white rotate-90' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                            <span className="text-[8px]">▶</span>
                          </button>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors uppercase">{task.title}</h4>
                          <p className="text-[9px] text-slate-500 mt-0.5 truncate">{task.description}</p>
                        </div>
                      </div>
                      <div className="flex-1 relative h-12">
                        {bar && (
                          <div onClick={() => onEditTask(task)} className="absolute top-1/2 -translate-y-1/2 h-6 rounded-lg bg-indigo-500 shadow-sm cursor-pointer hover:bg-indigo-600 transition-all flex items-center px-3 overflow-hidden group/bar" style={{ left: bar.left, width: bar.width }}>
                            <span className="text-[8px] font-bold text-white truncate uppercase">{task.title}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isExpanded && task.roleAssignments?.map((ra, idx) => {
                      const raBar = getBarPosition(ra.startDate, ra.dueDate);
                      return (
                        <div key={idx} className="flex items-center min-h-[44px] bg-slate-50/50 border-b border-slate-100">
                          <div className="w-[320px] pl-16 pr-6 py-3 shrink-0 border-r border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              <span className="text-[10px] font-bold text-slate-500 uppercase truncate">{ra.role?.name || 'Assigned Role'}</span>
                            </div>
                          </div>
                          <div className="flex-1 relative h-10">
                            {raBar && (
                              <div className="absolute top-1/2 -translate-y-1/2 h-4 rounded-md bg-slate-300/40 border border-slate-200" style={{ left: raBar.left, width: raBar.width }} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttView;
