import React from 'react';
import { getIcon } from './icons';

const SidebarNavigation = ({ menuItems, collapsed, currentPath, onNavigate }) => {
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const categoryLabels = {
    main: 'Main Menu',
    company: 'Company',
    admin: 'Administration'
  };

  return (
    <nav className="flex-1 px-4 py-4 overflow-y-auto">
      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category} className="mb-6">
          {/* Category Label */}
          {!collapsed && (
            <div className="px-3 mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {categoryLabels[category] || category}
              </p>
            </div>
          )}

          {/* Menu Items */}
          <div className="space-y-1">
            {items.map((item) => {
              const isActive = currentPath === item.path ||
                (item.path === '/employees' && currentPath.startsWith('/employees/')) ||
                (item.path === '/projects' && currentPath.startsWith('/projects/')) ||
                (item.path === '/my-tasks' && currentPath.startsWith('/my-tasks/')) ||
                (item.path === '/companies' && currentPath.startsWith('/companies/'));

              const IconComponent = getIcon(item.icon);

              return (
                <div
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`
                    flex items-center px-3 py-2 rounded-lg cursor-pointer transition-all duration-200
                    ${collapsed ? 'justify-center' : 'justify-start space-x-3'}
                    ${isActive 
                      ? 'bg-primary-600 text-white shadow-lg' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <div className="flex-shrink-0">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  {!collapsed && (
                    <span className="text-sm font-medium">
                      {item.label}
                    </span>
                  )}
                  {!collapsed && isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
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