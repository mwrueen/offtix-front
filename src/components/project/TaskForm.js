import React from 'react';
import TaskStatusManager from './TaskStatusManager';

const TaskForm = ({
  taskForm,
  setTaskForm,
  onSubmit,
  onCancel,
  taskStatuses,
  editingTask,
  parentTask,
  projectId,
  onStatusesUpdate,
  availableTasks = [],
  error,
  isProjectOwner = false,
  users = [],
  sprints = [],
  phases = []
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500 mb-8 font-sans">
      <div className="px-8 py-6 bg-slate-900 border-b border-white/10 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">
            {editingTask ? 'Edit Task Directive' : parentTask ? 'Initialize Subtask' : 'Create New Task'}
          </h3>
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1 opacity-70">Define operational requirements and personnel allocation.</p>
        </div>
        <button onClick={onCancel} className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-rose-600 transition-all font-bold text-xl">✕</button>
      </div>

      <div className="p-8 lg:p-10">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl mb-8 text-xs font-bold text-rose-600 flex items-center gap-3 animate-bounce">
            <span className="text-xl">!</span> {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Main Content Area */}
            <div className="lg:col-span-8 space-y-8">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Task Summary / Title *</label>
                <input
                  type="text"
                  placeholder="What needs to be accomplished?"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  required
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-400 transition-all font-sans italic"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Task Description & Requirements</label>
                <textarea
                  placeholder="Detail the procedural steps and expected outcomes..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows="8"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-600 outline-none focus:bg-white focus:border-indigo-400 transition-all resize-none leading-relaxed italic"
                />
              </div>
            </div>

            {/* Metadata Sidebar */}
            <div className="lg:col-span-4 bg-slate-50 p-8 rounded-[2rem] border border-slate-200 space-y-6">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-4 mb-2 italic">Assignment Detail</h4>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Operational Status</label>
                  <TaskStatusManager
                    projectId={projectId}
                    taskStatuses={taskStatuses}
                    onStatusesUpdate={onStatusesUpdate}
                    selectedStatus={taskForm.status}
                    onStatusChange={(value) => setTaskForm({ ...taskForm, status: value })}
                    isProjectOwner={isProjectOwner}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Assigned Personnel</label>
                  <select
                    multiple
                    value={taskForm.assignees}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setTaskForm({ ...taskForm, assignees: values });
                    }}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-indigo-400 shadow-sm min-h-[100px]"
                  >
                    {users.map(user => (
                      <option key={user._id} value={user._id} className="p-2 border-b border-slate-50 last:border-0">{user.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-900 outline-none shadow-sm uppercase tracking-widest italic"
                    >
                      <option value="">None</option>
                      <option value="low">Low -</option>
                      <option value="medium">Medium =</option>
                      <option value="high">High +</option>
                      <option value="urgent">Urgent !</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Est. Hours</label>
                    <input
                      type="number"
                      placeholder="0h"
                      value={taskForm.duration}
                      onChange={(e) => setTaskForm({ ...taskForm, duration: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Project Phase</label>
                  <select
                    value={taskForm.phase || ''}
                    onChange={(e) => setTaskForm({ ...taskForm, phase: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-900 outline-none shadow-sm uppercase italic tracking-widest"
                  >
                    <option value="">Standalone</option>
                    {phases.map(phase => <option key={phase._id} value={phase._id}>{phase.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sprint Hub</label>
                  <select
                    value={taskForm.sprint || ''}
                    onChange={(e) => setTaskForm({ ...taskForm, sprint: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-900 outline-none shadow-sm uppercase italic tracking-widest"
                  >
                    <option value="">Backlog</option>
                    {sprints.map(sprint => <option key={sprint._id} value={sprint._id}>{sprint.name} (#{sprint.sprintNumber})</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Final Deadline</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-600 outline-none shadow-sm text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-10 border-t border-slate-100 mt-10 italic">
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-all underline underline-offset-8"
            >
              Abort Protocol
            </button>
            <button
              type="submit"
              className="px-12 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-slate-950 transition-all active:scale-95"
            >
              {editingTask ? 'Commit Changes' : 'Authorize Task Node'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;