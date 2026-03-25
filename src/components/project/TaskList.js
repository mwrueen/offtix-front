import React from 'react';
import TaskCard from './TaskCard';

const TaskList = ({ tasks, onEditTask, onDeleteTask, onAddSubtask }) => {
  const totalTasks = tasks.reduce((count, task) => count + 1 + (task.subtasks?.length || 0), 0);

  return (
    <div className="bg-white rounded-[4rem] border-4 border-slate-50 shadow-24 overflow-hidden italic animate-in fade-in duration-1000">
      <div className="px-12 py-10 bg-slate-950 text-white relative overflow-hidden group/header">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none group-hover/header:scale-125 transition-transform duration-1000" />
        <div className="relative z-10 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-white/5 group-hover/header:rotate-12 transition-transform">📋</div>
            <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none"> MISSION_ISSUES_QUEUE </h3>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mt-2 opacity-60"> DATA_NODES_DETECTED: {totalTasks} </p>
            </div>
          </div>

          <div className="flex items-center gap-8 no-print">
            <div className="flex items-center gap-4 group/select">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic group-hover/select:text-indigo-400 transition-colors">GROUP_BY:</span>
              <select className="bg-white/5 border border-white/10 rounded-xl px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:bg-white/10 focus:border-indigo-400 cursor-pointer shadow-inner">
                <option className="bg-slate-950 text-white">NULL_INDEX</option>
                <option className="bg-slate-950 text-white">STATUS_STRATA</option>
                <option className="bg-slate-950 text-white">ENTITY_ASSIGN</option>
                <option className="bg-slate-950 text-white">PRIORITY_LEVEL</option>
              </select>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex items-center gap-4 group/select">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic group-hover/select:text-indigo-400 transition-colors">SORT_BY:</span>
              <select className="bg-white/5 border border-white/10 rounded-xl px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:bg-white/10 focus:border-indigo-400 cursor-pointer shadow-inner">
                <option className="bg-slate-950 text-white">SYNC_TIME</option>
                <option className="bg-slate-950 text-white">UPLINK_UPDATE</option>
                <option className="bg-slate-950 text-white">THREAT_LEVEL</option>
                <option className="bg-slate-950 text-white">TERMINUS_LIMIT</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {tasks.length === 0 ? (
          <div className="text-center py-40 bg-slate-50/50 rounded-[4rem] border-4 border-dashed border-slate-100 group/empty opacity-40 hover:opacity-100 transition-opacity duration-1000">
            <div className="text-9xl mb-12 grayscale opacity-10 group-hover/empty:scale-125 group-hover/empty:rotate-12 transition-all duration-2000 pointer-events-none select-none">📭</div>
            <h4 className="text-4xl font-black text-slate-950 uppercase italic tracking-tighter drop-shadow-sm group-hover/empty:text-indigo-600 transition-colors">ISSUE_REGISTRY_NEGATIVE</h4>
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] mt-8 italic max-w-sm mx-auto leading-relaxed underline underline-offset-8 decoration-slate-100">Establish mission directives to begin tactical synchronization and project tracking sequences in this sector.</p>
            <button className="mt-16 px-16 py-6 bg-slate-950 text-white rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.5em] shadow-24 hover:bg-indigo-600 transition-all active:scale-95 italic">AUTHORIZE_FIRST_ISSUE</button>
          </div>
        ) : (
          <div className="space-y-6">
            {tasks.map((task, index) => (
              <div key={task._id} className="animate-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${index * 100}ms` }}>
                <TaskCard task={task} onEdit={onEditTask} onDelete={onDeleteTask} onAddSubtask={onAddSubtask} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;