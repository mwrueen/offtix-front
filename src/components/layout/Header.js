import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';
import NotificationDropdown from './NotificationDropdown';
import { Button } from '../ui';

const Header = () => {
  const location = useLocation();
  const { unreadCount } = useSocket();
  const { unreadCounts } = useChat();
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const getPageTitle = () => {
    const titles = {
      '/dashboard': 'Dashboard',
      '/projects': 'Projects',
      '/overview': 'Overview',
      '/users': 'Users',
      '/employees': 'Employees',
      '/leaves': 'Leave Management',
      '/holidays': 'Holidays',
      '/profile': 'My Profile',
      '/workforce': 'Workforce',
      '/my-tasks': 'My Tasks',
      '/team-activity': 'Team Activity',
      '/manage-roles': 'Manage Roles',
      '/organogram': 'Organization Chart',
      '/companies': 'Companies',
      '/company-settings': 'Company Settings'
    };

    // Handle dynamic routes
    if (location.pathname.startsWith('/employees/')) {
      return 'Employee Details';
    }
    if (location.pathname.startsWith('/projects/')) {
      return 'Project Details';
    }
    if (location.pathname.startsWith('/my-tasks/')) {
      return 'Task Details';
    }
    if (location.pathname.startsWith('/companies/')) {
      return 'Company Details';
    }

    return titles[location.pathname] || 'Offtix';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {getPageTitle()}
          </h1>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-4">
          {/* Chat Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="relative"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {Object.values(unreadCounts).some(count => count > 0) && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)}
              </span>
            )}
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
              className="relative"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>

            {/* Notification Dropdown */}
            {isNotifDropdownOpen && (
              <NotificationDropdown 
                onClose={() => setIsNotifDropdownOpen(false)}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;