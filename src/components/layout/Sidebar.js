import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { usePermissions, PERMISSIONS } from '../../context/PermissionsContext';
import CompanySelector from './CompanySelector';
import SidebarNavigation from './SidebarNavigation';

const Sidebar = ({ collapsed, onToggle }) => {
  const { state } = useAuth();
  const { state: companyState } = useCompany();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);

  const canManageSettings = hasPermission(PERMISSIONS.MANAGE_COMPANY_SETTINGS);
  const canViewDesignations = hasPermission(PERMISSIONS.VIEW_DESIGNATIONS);
  const canViewEmployees = hasPermission(PERMISSIONS.VIEW_EMPLOYEE_LIST);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard', category: 'main' },
    { path: '/projects', label: 'Projects', icon: 'projects', category: 'main' },
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
    <div className={`fixed left-0 top-0 h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-50 ${collapsed ? 'w-[70px]' : 'w-64'}`}>

      {/* Logo */}
      <div className={`flex items-center h-16 border-b border-slate-100 px-4 shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div onClick={() => navigate('/')} className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">O</div>
            <span className="font-semibold text-slate-900 text-base">Offtix</span>
          </div>
        )}
        {collapsed && (
          <div onClick={() => navigate('/')} className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm cursor-pointer">O</div>
        )}
        {!collapsed && (
          <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {collapsed && (
          <button onClick={onToggle} className="absolute -right-3 top-[72px] w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm transition-colors">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Company Selector */}
      <CompanySelector
        collapsed={collapsed}
        isOpen={isCompanyDropdownOpen}
        onToggle={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
      />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <SidebarNavigation
          menuItems={menuItems}
          collapsed={collapsed}
          currentPath={location.pathname}
          onNavigate={navigate}
        />
      </div>

      {/* User profile at bottom */}
      <div className={`shrink-0 border-t border-slate-100 p-3`}>
        <div
          onClick={() => navigate('/profile')}
          className={`flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group ${collapsed ? 'justify-center' : ''}`}
        >
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
            </div>
          )}
          {!collapsed && (
            <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
