import React from 'react';
import { getIcon } from './icons';

const categoryLabels = {
  main: 'Menu',
  company: 'Company',
  admin: 'Administration'
};

const SidebarNavigation = ({ menuItems, collapsed, currentPath, onNavigate, dark = false }) => {
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <nav className="px-3 space-y-6">
      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category} className="space-y-1">
          {!collapsed && (
            <p className={`text-[10px] font-bold uppercase tracking-[2px] px-3 mb-2 
              ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
              {categoryLabels[category] || category}
            </p>
          )}
          <div className="space-y-0.5">
            {items.map((item) => {
              const isActive =
                currentPath === item.path ||
                (item.path === '/employees' && currentPath.startsWith('/employees/')) ||
                (item.path === '/projects' && currentPath.startsWith('/projects/')) ||
                (item.path === '/my-tasks' && currentPath.startsWith('/my-tasks/')) ||
                (item.path === '/companies' && currentPath.startsWith('/companies/'));

              const IconComponent = getIcon(item.icon);

              return (
                <div
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  title={collapsed ? item.label : undefined}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 
                    ${collapsed ? 'justify-center mx-1' : ''}
                    ${isActive
                      ? (dark ? 'bg-indigo-600 shadow-lg shadow-indigo-900/20 text-white' : 'bg-indigo-50 text-indigo-700')
                      : (dark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')
                    }`}
                >
                  <div className={`shrink-0 transition-transform duration-200 group-hover:scale-110 
                    ${isActive ? (dark ? 'text-white' : 'text-indigo-600') : (dark ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-600')}`}>
                    <IconComponent className="w-[18px] h-[18px]" />
                  </div>
                  {!collapsed && (
                    <span className="text-sm font-semibold flex-1 tracking-tight">
                      {item.label}
                    </span>
                  )}
                  {!collapsed && isActive && !dark && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 shadow-sm" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
};

export default SidebarNavigation;
