import React from 'react';
import { getIcon } from './icons';

const categoryLabels = {
  main: 'Menu',
  company: 'Company',
  admin: 'Administration'
};

const SidebarNavigation = ({ menuItems, collapsed, currentPath, onNavigate }) => {
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <nav className="px-3 py-3 space-y-5">
      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category}>
          {!collapsed && (
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 mb-1.5">
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
                  className={`flex items-center gap-3 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150 ${collapsed ? 'justify-center' : ''}
                    ${isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                >
                  <div className={`shrink-0 ${isActive ? 'text-indigo-600' : ''}`}>
                    <IconComponent className="w-[18px] h-[18px]" />
                  </div>
                  {!collapsed && (
                    <span className={`text-sm font-medium flex-1 ${isActive ? 'text-indigo-700' : ''}`}>
                      {item.label}
                    </span>
                  )}
                  {!collapsed && isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
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
