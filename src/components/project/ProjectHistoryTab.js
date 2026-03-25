import React, { useState, useEffect } from 'react';
import { requirementAPI, meetingNoteAPI, sprintAPI, phaseAPI, taskAPI } from '../../services/api';

const ProjectHistoryTab = ({ projectId, project }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchProjectHistory();
  }, [projectId]);

  const fetchProjectHistory = async () => {
    try {
      setLoading(true);
      const [requirementsRes, meetingNotesRes, sprintsRes, phasesRes, tasksRes] = await Promise.all([
        requirementAPI.getAll(projectId).catch(() => ({ data: [] })),
        meetingNoteAPI.getAll(projectId).catch(() => ({ data: [] })),
        sprintAPI.getAll(projectId).catch(() => ({ data: [] })),
        phaseAPI.getAll(projectId).catch(() => ({ data: [] })),
        taskAPI.getAll(projectId).catch(() => ({ data: [] }))
      ]);

      const activities = [];

      activities.push({
        id: `project-${project._id}`,
        type: 'project',
        action: 'created',
        title: 'Project Initialized',
        description: `Project "${project.title}" was registered.`,
        date: project.createdAt,
        user: project.owner,
        icon: '🏠',
        color: 'bg-indigo-600'
      });

      requirementsRes.data.forEach(req => {
        activities.push({
          id: `req-${req._id}`,
          type: 'requirement',
          action: 'created',
          title: 'Requirement Registered',
          description: `"${req.title}" added to specifications.`,
          date: req.createdAt,
          user: req.createdBy,
          icon: '📋',
          color: 'bg-emerald-600'
        });
      });

      meetingNotesRes.data.forEach(meeting => {
        activities.push({
          id: `meet-${meeting._id}`,
          type: 'meeting',
          action: 'created',
          title: 'Meeting Logged',
          description: `"${meeting.title}" discussion recorded.`,
          date: meeting.meetingDate,
          user: meeting.organizer,
          icon: '💬',
          color: 'bg-amber-600'
        });
      });

      sprintsRes.data.forEach(sprint => {
        activities.push({
          id: `sprint-${sprint._id}`,
          type: 'sprint',
          action: 'created',
          title: 'Sprint Activated',
          description: `"${sprint.name}" timeline established.`,
          date: sprint.createdAt,
          user: sprint.createdBy,
          icon: '🏃',
          color: 'bg-rose-600'
        });
      });

      phasesRes.data.forEach(phase => {
        activities.push({
          id: `phase-${phase._id}`,
          type: 'phase',
          action: 'created',
          title: 'Phase Defined',
          description: `"${phase.name}" structure finalized.`,
          date: phase.createdAt,
          user: phase.createdBy,
          icon: '🎯',
          color: 'bg-indigo-500'
        });
      });

      const flattenTasks = (ts) => {
        let res = [];
        ts.forEach(t => {
          res.push(t);
          if (t.subtasks?.length) res = res.concat(flattenTasks(t.subtasks));
        });
        return res;
      };

      flattenTasks(tasksRes.data).forEach(task => {
        activities.push({
          id: `task-${task._id}`,
          type: 'task',
          action: 'created',
          title: 'Task Assigned',
          description: `"${task.title}" added to backlog.`,
          date: task.createdAt,
          user: task.createdBy,
          icon: '✅',
          color: 'bg-slate-700'
        });
      });

      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setHistory(activities);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = filter === 'all' ? history : history.filter(h => h.type === filter);
  const counts = history.reduce((acc, h) => { acc[h.type] = (acc[h.type] || 0) + 1; acc.all++; return acc; }, { all: 0, project: 0, requirement: 0, meeting: 0, sprint: 0, phase: 0, task: 0 });

  if (loading) return (
    <div className="p-20 text-center space-y-4">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin mx-auto" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compiling history...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Activity Log</h2>
          <p className="text-sm text-slate-500 font-medium">Timeline of all project operations and events.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All', icon: '📊' },
            { id: 'task', label: 'Tasks', icon: '✅' },
            { id: 'sprint', label: 'Sprints', icon: '🏃' },
            { id: 'phase', label: 'Phases', icon: '🎯' },
            { id: 'requirement', label: 'Reqs', icon: '📋' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${filter === t.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
            >
              {t.icon} {t.label} <span className="opacity-50 ml-1">({counts[t.id] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative pl-8 space-y-8">
        {/* Timeline Path */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />

        {filteredHistory.length === 0 ? (
          <div className="py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <div className="text-4xl mb-4">🗄️</div>
            <p className="text-sm font-bold text-slate-400">NO ACTIVITIES RECORDED</p>
          </div>
        ) : filteredHistory.map((item, idx) => (
          <div key={item.id} className="relative group">
            {/* Timeline Dot */}
            <div className={`absolute -left-8 top-1 w-8 h-8 ${item.color} text-white rounded-full border-4 border-white flex items-center justify-center text-xs shadow-md z-10 transition-transform group-hover:scale-110`}>
              {item.icon}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group-hover:border-indigo-200 group-hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">{item.title}</h4>
                  <p className="text-xs text-slate-500 font-medium">{item.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(item.date).toLocaleDateString()}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 opacity-60">{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2">
                <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center text-[10px]">👤</div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operator:</span>
                <span className="text-[10px] font-black text-slate-600 uppercase italic transition-colors group-hover:text-indigo-600">{item.user?.name || 'SYSTEM'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectHistoryTab;