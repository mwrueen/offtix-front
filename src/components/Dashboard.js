import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCompanyFilter } from '../hooks/useCompanyFilter';
import { useNavigate } from 'react-router-dom';
import { holidayAPI, myTasksAPI } from '../services/api';
import apiService from '../services/apiService';
import Layout from './Layout';

const Dashboard = () => {
  const { state } = useAuth();
  const { selectedCompany, companyFilter } = useCompanyFilter();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ activeProjects: 0, completedTasks: 0, totalTasks: 0, pendingTasks: 0 });
  const [adminStats, setAdminStats] = useState({ totalCompanies: 0, totalUsers: 0, activeUsers: 0, adminUsers: 0 });
  const [myTasks, setMyTasks] = useState({ completed: [], upcoming: [] });
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedCompany) fetchDashboardData();
    if (state.user?.role === 'superadmin') fetchAdminStats();
  }, [selectedCompany, state.user?.role]);

  const fetchDashboardData = async () => {
    if (!state.token) return;
    setLoading(true);
    try {
      const projectsData = await apiService.getProjects(state.token, companyFilter.companyId);
      setProjects(projectsData);

      let totalTasks = 0, completedTasks = 0, pendingTasks = 0;
      for (const project of projectsData) {
        try {
          const tasks = await apiService.getTasks(state.token, companyFilter.companyId, { projectId: project._id });
          totalTasks += tasks.length;
          completedTasks += tasks.filter(t => t.status?.name?.toLowerCase().includes('done') || t.status?.name?.toLowerCase().includes('complete')).length;
          pendingTasks += tasks.filter(t => !t.status?.name?.toLowerCase().includes('done') && !t.status?.name?.toLowerCase().includes('complete')).length;
        } catch (e) { }
      }

      setStats({ activeProjects: projectsData.filter(p => p.status === 'running' || p.status === 'active').length, completedTasks, totalTasks, pendingTasks });

      const tasksRes = await myTasksAPI.getAll(selectedCompany?.id || 'personal');
      const allMyTasks = tasksRes.data || [];
      const upcoming = allMyTasks.filter(t => t.userStep?.status !== 'completed' && !t.status?.name?.toLowerCase().includes('done'));
      const completed = allMyTasks.filter(t => !upcoming.includes(t));

      setMyTasks({ completed: completed.slice(0, 5), upcoming: upcoming.slice(0, 5) });

      if (companyFilter.companyId && companyFilter.companyId !== 'personal') {
        const hRes = await holidayAPI.getUpcoming(companyFilter.companyId, 3);
        setUpcomingHolidays(hRes.data?.holidays || hRes.data || []);
      }
    } catch (error) { console.error('Dashboard fetch error', error); }
    finally { setLoading(false); }
  };

  const fetchAdminStats = async () => {
    try {
      const stats = await apiService.getAdminStats(state.token);
      setAdminStats(stats);
    } catch (e) { console.error('Admin stats fetch error', e); }
  };

  const overviewStats = [
    { title: 'Active Projects', value: stats.activeProjects, icon: '📁', color: 'indigo' },
    { title: 'Completed Tasks', value: stats.completedTasks, icon: '✅', color: 'emerald' },
    { title: 'Total Tasks', value: stats.totalTasks, icon: '📋', color: 'slate' },
    { title: 'Pending Tasks', value: stats.pendingTasks, icon: '⏳', color: 'amber' },
  ];

  return (
    <Layout>
      <div className="space-y-6 pb-20">
        {/* Header Section */}
        <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-indigo-100">👋</div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome, {state.user?.name}</h1>
              <p className="text-xs text-slate-500 font-medium tracking-tight">Overview for <span className="text-indigo-600 font-bold decoration-indigo-200">{selectedCompany?.name || 'All Organizations'}</span></p>
            </div>
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md flex items-center gap-2"
          >
            <span className="text-lg">+</span> New Project
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewStats.map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.title}</p>
                <span className="text-xl group-hover:scale-125 transition-transform duration-300">{stat.icon}</span>
              </div>
              <p className="text-4xl font-bold text-slate-800 mt-2 tracking-tighter">
                {loading ? <span className="text-slate-200 animate-pulse">---</span> : stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* System Administration (SuperAdmin Only) */}
        {state.user?.role === 'superadmin' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 px-1 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-rose-500 rounded-full" />
              System Administration
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Companies', value: adminStats.totalCompanies, icon: '🏢' },
                { label: 'Total Users', value: adminStats.totalUsers, icon: '👥' },
                { label: 'Active Users', value: adminStats.activeUsers, icon: '🟢' },
                { label: 'Administrators', value: adminStats.adminUsers, icon: '🛡️' }
              ].map((as, i) => (
                <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm group hover:bg-white transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{as.label}</p>
                    <span className="text-xs grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all">{as.icon}</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-800 tracking-tight">{as.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Projects Card */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Recent Projects</h3>
              <button onClick={() => navigate('/projects')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-4 decoration-indigo-100">View All</button>
            </div>
            <div className="space-y-3">
              {projects.slice(0, 5).map((p) => (
                <div
                  key={p._id}
                  onClick={() => navigate(`/projects/${p._id}`)}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-400 hover:bg-white cursor-pointer transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-slate-800 truncate text-sm group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{p.title}</p>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-slate-500 font-bold uppercase">{p.status}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000 w-[60%]" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">60%</span>
                  </div>
                </div>
              ))}
              {projects.length === 0 && !loading && (
                <div className="py-12 text-center text-slate-400 font-medium text-sm">
                  <div className="text-4xl mb-3 opacity-30">📁</div>
                  No active projects found.
                </div>
              )}
            </div>
          </div>

          {/* My Tasks Card */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">My Priority Tasks</h3>
              <button onClick={() => navigate('/my-tasks')} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-4 decoration-indigo-100">View All Tasks</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Upcoming Tasks Column */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">To Do</p>
                <div className="space-y-3">
                  {myTasks.upcoming.map((t) => (
                    <div
                      key={t._id}
                      onClick={() => navigate(`/my-tasks/${t._id}`)}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-400 hover:bg-white cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 truncate text-sm group-hover:text-indigo-600 mb-0.5">{t.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{t.project?.title || 'Personal'}</p>
                      </div>
                      <span className={`ml-3 px-2 py-1 rounded-lg text-[9px] font-bold uppercase border ${t.priority === 'urgent' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        t.priority === 'high' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-indigo-50 text-indigo-600 border-indigo-100'
                        }`}>
                        {t.priority}
                      </span>
                    </div>
                  ))}
                  {myTasks.upcoming.length === 0 && <p className="text-center py-12 text-slate-300 font-medium text-sm italic">You're all caught up! ✨</p>}
                </div>
              </div>

              {/* Completed Tasks Column */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Recently Completed</p>
                <div className="space-y-3">
                  {myTasks.completed.map((t) => (
                    <div key={t._id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-3 opacity-60">
                      <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold shadow-sm">✓</div>
                      <p className="text-xs font-bold text-slate-700 truncate line-through">{t.title}</p>
                    </div>
                  ))}
                  {myTasks.completed.length === 0 && <p className="text-center py-12 text-slate-300 font-medium text-sm italic">No recent activity.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Holidays Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Upcoming Holidays & Events</h3>
            <button onClick={() => navigate('/holidays')} className="text-xs font-bold text-indigo-600 underline underline-offset-4 decoration-indigo-100">Full Calendar</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingHolidays.map((h, i) => (
              <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 hover:bg-white transition-colors cursor-default">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-2xl">📅</div>
                <div>
                  <p className="font-bold text-slate-800 tracking-tight leading-tight">{h.name}</p>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                    {new Date(h.date || h.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
            {upcomingHolidays.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 font-medium text-sm">
                <div className="text-4xl mb-3 opacity-30">🎈</div>
                No upcoming events found.
              </div>
            )}
          </div>
        </div>

        {/* Global Navigation Hub */}
        <div className="flex flex-wrap gap-3 pt-6 border-t border-slate-200">
          {[
            { label: 'Role Management', path: '/manage-roles', icon: '🛡️' },
            { label: 'Organization Units', path: '/organogram', icon: '📁' },
            { label: 'Audit Logs', path: '/profile', icon: '📜' },
            { label: 'Company Settings', path: '/company-settings', icon: '⚙️' }
          ].map((nav, i) => (
            <button
              key={i}
              onClick={() => navigate(nav.path)}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-3 border border-slate-200"
            >
              <span>{nav.icon}</span>
              {nav.label}
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;