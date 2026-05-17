import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { usePermissions, PERMISSIONS } from '../../context/PermissionsContext';
import { BASE_SERVER_URL } from '../../services/api';
import CompanySelector from './CompanySelector';
import SidebarNavigation from './SidebarNavigation';

const Sidebar = ({ collapsed, onToggle }) => {
  const { state } = useAuth();
  const { state: companyState } = useCompany();
  const { hasPermission, designationName } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);

  const getUserImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `${BASE_SERVER_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const canManageSettings = hasPermission(PERMISSIONS.MANAGE_COMPANY_SETTINGS);
  const canViewDesignations = hasPermission(PERMISSIONS.VIEW_DESIGNATIONS);
  const canViewEmployees = hasPermission(PERMISSIONS.VIEW_EMPLOYEE_LIST);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard', category: 'main' },
    { path: '/projects', label: 'Projects', icon: 'projects', category: 'main' },
    { path: '/careers', label: 'Careers Portal', icon: 'careers', category: 'main' },
    ...(state.user?.role !== 'superadmin' ? [
      { path: '/my-tasks', label: 'My Tasks', icon: 'tasks', category: 'main' },
      { path: '/team-activity', label: 'Team Activity', icon: 'team', category: 'main' }
    ] : []),
    ...(companyState.selectedCompany?.id !== 'personal' ? [
      { path: '/overview', label: 'Overview', icon: 'overview', category: 'main' }
    ] : []),
    ...(companyState.selectedCompany?.id !== 'personal' && canViewEmployees ? [
      { path: '/employees', label: 'Employees', icon: 'employees', category: 'company' },
      { path: '/organogram', label: 'Org Chart', icon: 'organogram', category: 'company' }
    ] : []),
    ...(companyState.selectedCompany?.id !== 'personal' && canViewDesignations ? [
      { path: '/manage-roles', label: 'Manage Roles', icon: 'roles', category: 'company' }
    ] : []),
    ...(companyState.selectedCompany?.id !== 'personal' ? [
      { path: '/leaves', label: 'Leaves', icon: 'leaves', category: 'company' },
      { path: '/holidays', label: 'Holidays', icon: 'holidays', category: 'company' }
    ] : []),
    ...(canManageSettings && companyState.selectedCompany?.id !== 'personal' ? [
      { path: '/workforce', label: 'Workforce', icon: 'workforce', category: 'company' }
    ] : []),
    ...(state.user?.role === 'admin' || state.user?.role === 'superadmin' ? [
      { path: '/users', label: 'Users', icon: 'users', category: 'admin' },
      { path: '/companies', label: 'Companies', icon: 'companies', category: 'admin' }
    ] : []),
    ...(canManageSettings && companyState.selectedCompany?.id !== 'personal' ? [
      { path: '/company-settings', label: 'Settings', icon: 'settings', category: 'company' }
    ] : [])
  ];

  const user = state.user;
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

  return (
    <div className={`fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 z-50 shadow-2xl ${collapsed ? 'w-[70px]' : 'w-64'}`}>

      {/* Top Header with Toggle */}
      <div className={`flex items-center h-16 px-4 shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity cursor-default">
            <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center text-white font-bold text-[10px]">OT</div>
            <span className="font-bold text-slate-400 text-xs tracking-widest uppercase">Offtix Platform</span>
          </div>
        )}

        {!collapsed ? (
          <button
            onClick={onToggle}
            className="group p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-all border border-transparent hover:border-slate-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onToggle}
            className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-indigo-600 transition-all shadow-lg border border-slate-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M6 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Company Selector - Primary Branding */}
      <div className="px-1 shadow-sm">
        <CompanySelector
          collapsed={collapsed}
          isOpen={isCompanyDropdownOpen}
          onToggle={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
          dark={true}
        />
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <SidebarNavigation
          menuItems={menuItems}
          collapsed={collapsed}
          currentPath={location.pathname}
          onNavigate={navigate}
          dark={true}
        />
      </div>

      {/* User profile at bottom */}
      <div className="shrink-0 p-4 bg-slate-900/50 backdrop-blur-sm border-t border-slate-800">
        <div
          onClick={() => navigate('/profile')}
          className={`flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-800 cursor-pointer transition-all group border border-transparent hover:border-slate-700 ${collapsed ? 'justify-center' : ''}`}
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
              {(user?.profilePicture || user?.profile?.profilePicture) ? (
                <img src={getUserImageUrl(user.profilePicture || user.profile?.profilePicture)} alt="" className="w-full h-full object-cover" />
              ) : initials}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-white transition-colors">{user?.name || 'User'}</p>
              <p className="text-[11px] text-slate-500 truncate group-hover:text-slate-400 transition-colors uppercase tracking-tight font-medium">
                {designationName || (companyState.selectedCompany?.id === 'personal' ? (user?.role || 'User') : (user?.role || 'User'))}
              </p>
            </div>
          )}
          {!collapsed && (
            <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
