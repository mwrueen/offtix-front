import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { usePermissions, PERMISSIONS } from '../../context/PermissionsContext';
import CompanySelector from './CompanySelector';
import SidebarNavigation from './SidebarNavigation';
import UserProfile from './UserProfile';

const Sidebar = ({ collapsed, onToggle }) => {
  const { state } = useAuth();
  const { state: companyState } = useCompany();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);

  // Permission checks
  const canManageSettings = hasPermission(PERMISSIONS.MANAGE_COMPANY_SETTINGS);
  const canViewDesignations = hasPermission(PERMISSIONS.VIEW_DESIGNATIONS);
  const canViewEmployees = hasPermission(PERMISSIONS.VIEW_EMPLOYEE_LIST);

  // Menu items configuration
  const menuItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: 'dashboard',
      category: 'main' 
    },
    { 
      path: '/projects', 
      label: 'Projects', 
      icon: 'projects',
      category: 'main' 
    },
    ...(state.user?.role !== 'superadmin' ? [
      { 
        path: '/my-tasks', 
        label: 'My Tasks', 
        icon: 'tasks',
        category: 'main' 
      },
      { 
        path: '/team-activity', 
        label: 'Team Activity', 
        icon: 'team',
        category: 'main' 
      }
    ] : []),
    ...(companyState.selectedCompany?.id !== 'personal' ? [
      { 
        path: '/overview', 
        label: 'Overview', 
        icon: 'overview',
        category: 'main' 
      }
    ] : []),
    ...(companyState.selectedCompany?.id !== 'personal' && canViewEmployees ? [
      { 
        path: '/employees', 
        label: 'Employees', 
        icon: 'employees',
        category: 'company' 
      },
      { 
        path: '/organogram', 
        label: 'Org Chart', 
        icon: 'organogram',
        category: 'company' 
      }
    ] : []),
    ...(companyState.selectedCompany?.id !== 'personal' && canViewDesignations ? [
      { 
        path: '/manage-roles', 
        label: 'Manage Roles', 
        icon: 'roles',
        category: 'company' 
      }
    ] : []),
    ...(companyState.selectedCompany?.id !== 'personal' ? [
      { 
        path: '/leaves', 
        label: 'Leaves', 
        icon: 'leaves',
        category: 'company' 
      },
      { 
        path: '/holidays', 
        label: 'Holidays', 
        icon: 'holidays',
        category: 'company' 
      }
    ] : []),
    ...(canManageSettings && companyState.selectedCompany?.id !== 'personal' ? [
      { 
        path: '/workforce', 
        label: 'Workforce', 
        icon: 'workforce',
        category: 'company' 
      }
    ] : []),
    ...(state.user?.role === 'admin' || state.user?.role === 'superadmin' ? [
      { 
        path: '/users', 
        label: 'Users', 
        icon: 'users',
        category: 'admin' 
      },
      { 
        path: '/companies', 
        label: 'Companies', 
        icon: 'companies',
        category: 'admin' 
      }
    ] : []),
    ...(canManageSettings && companyState.selectedCompany?.id !== 'personal' ? [
      { 
        path: '/company-settings', 
        label: 'Settings', 
        icon: 'settings',
        category: 'company' 
      }
    ] : [])
  ];

  return (
    <div className={`fixed left-0 top-0 h-full bg-slate-900 text-slate-100 transition-all duration-300 z-50 ${
      collapsed ? 'w-20' : 'w-72'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <span className="font-semibold text-lg">Offtix</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d={collapsed ? "M4 6h16M4 12h16M4 18h16" : "M6 18L18 6M6 6l12 12"} />
          </svg>
        </button>
      </div>

      {/* Company Selector */}
      <CompanySelector 
        collapsed={collapsed}
        isOpen={isCompanyDropdownOpen}
        onToggle={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
      />

      {/* Navigation */}
      <SidebarNavigation 
        menuItems={menuItems}
        collapsed={collapsed}
        currentPath={location.pathname}
        onNavigate={navigate}
      />

      {/* User Profile */}
      <UserProfile 
        collapsed={collapsed}
        user={state.user}
        onNavigate={navigate}
      />
    </div>
  );
};

export default Sidebar;