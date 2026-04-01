import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../../context/CompanyContext';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';
import { BASE_SERVER_URL } from '../../services/api';

const CompanySelector = ({ collapsed, isOpen, onToggle, dark = false }) => {
  const navigate = useNavigate();
  const { state: companyState, selectCompany } = useCompany();
  const { unreadCountsByCompany, fetchUnreadCount } = useSocket();
  const { unreadCountsByCompany: chatUnreadByCompany, fetchUnreadCounts } = useChat();

  const handleCompanySelect = async (company) => {
    if (company === 'Personal') {
      selectCompany({ id: 'personal', name: 'Personal' });
      await Promise.allSettled([
        fetchUnreadCount('personal'),
        fetchUnreadCounts('personal'),
      ]);
      navigate('/dashboard');
    } else if (company === 'Create Company') {
      navigate('/create-company');
    } else {
      selectCompany(company);
      await Promise.allSettled([
        fetchUnreadCount(company.id),
        fetchUnreadCounts(company.id),
      ]);
      navigate('/dashboard');
    }
    onToggle();
  };

  const currentCompany = companyState.selectedCompany;
  const initial = currentCompany?.name?.charAt(0)?.toUpperCase() || 'C';

  const getCompanyNotifCount = (companyId) => unreadCountsByCompany?.[companyId] || 0;
  const getCompanyMsgCount = (companyId) => chatUnreadByCompany?.[companyId]?.total || 0;

  const getLogoUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${BASE_SERVER_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  return (
    <div className={`relative px-3 py-2 ${dark ? '' : 'border-b border-slate-100 bg-slate-50/50'}`}>
      <div
        onClick={onToggle}
        className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all border 
          ${dark
            ? 'hover:bg-slate-800 border-transparent hover:border-slate-700'
            : 'hover:bg-white hover:shadow-sm border-transparent hover:border-slate-200'} 
          ${collapsed ? 'justify-center' : ''}`}
      >
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg overflow-hidden border border-indigo-500/20">
          {currentCompany?.logo ? (
            <img src={getLogoUrl(currentCompany.logo)} alt={currentCompany.name} className="w-full h-full object-cover" />
          ) : initial}
        </div>

        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate leading-tight ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
                {currentCompany?.name || 'Select Workspace'}
              </p>
              <p className={`text-[10px] font-medium leading-tight mt-0.5 ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                {currentCompany?.id === 'personal' ? 'Personal' : ''}
              </p>
            </div>
            <div className={`p-1 rounded-md transition-colors ${isOpen ? (dark ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-600') : (dark ? 'text-slate-500' : 'text-slate-400')}`}>
              <svg className={`w-3.5 h-3.5 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </>
        )}
      </div>

      {isOpen && (
        <div className={`absolute top-full mt-2 rounded-2xl shadow-2xl border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 
          ${dark ? 'bg-slate-800 border-slate-700 w-64 -left-1' : 'bg-white border-slate-200 left-3 right-3'} 
          ${collapsed && !dark ? 'left-16 w-56' : ''}`}>

          {companyState.companies.length > 0 && (
            <div className="px-4 pt-3 pb-1">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Workspaces</p>
            </div>
          )}

          <div className="py-1">
            {companyState.companies.map((company) => (
              <div
                key={company.id}
                onClick={() => handleCompanySelect(company)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors 
                  ${currentCompany?.id === company.id
                    ? (dark ? 'bg-indigo-900/40' : 'bg-indigo-50')
                    : (dark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50')}`}
              >
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm overflow-hidden">
                  {company.logo ? (
                    <img src={getLogoUrl(company.logo)} alt={company.name} className="w-full h-full object-cover" />
                  ) : (
                    company.name?.charAt(0)?.toUpperCase()
                  )}
                </div>
                <span className={`text-sm font-medium flex-1 truncate 
                  ${currentCompany?.id === company.id
                    ? (dark ? 'text-indigo-300' : 'text-indigo-700')
                    : (dark ? 'text-slate-300' : 'text-slate-700')}`}>
                  {company.name}
                </span>

                {currentCompany?.id === company.id && (
                  <div className={`w-1.5 h-1.5 rounded-full ${dark ? 'bg-indigo-400' : 'bg-indigo-500'}`} />
                )}
              </div>
            ))}
          </div>

          <div className={`border-t ${dark ? 'border-slate-700/50' : 'border-slate-100'}`} />

          <div
            onClick={() => handleCompanySelect('Personal')}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors 
              ${currentCompany?.id === 'personal'
                ? (dark ? 'bg-indigo-900/40' : 'bg-indigo-50')
                : (dark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50')}`}
          >
            <div className="w-8 h-8 bg-gradient-to-tr from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className={`text-sm font-medium flex-1 
              ${currentCompany?.id === 'personal'
                ? (dark ? 'text-indigo-300' : 'text-indigo-700')
                : (dark ? 'text-slate-300' : 'text-slate-700')}`}>
              Personal Workspace
            </span>
            {currentCompany?.id === 'personal' && (
              <div className={`w-1.5 h-1.5 rounded-full ${dark ? 'bg-indigo-400' : 'bg-indigo-500'}`} />
            )}
          </div>

          <div className={`border-t ${dark ? 'border-slate-700/50' : 'border-slate-100'}`} />

          <div
            onClick={() => handleCompanySelect('Create Company')}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${dark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border-2 border-dashed ${dark ? 'border-slate-600 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className={`text-sm font-semibold ${dark ? 'text-indigo-400' : 'text-indigo-600'}`}>Create Workspace</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySelector;
