import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../../context/CompanyContext';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';
import { getAssetUrl } from '../../services/api';

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

  const getLogoUrl = getAssetUrl;

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
          ${dark ? 'bg-slate-900 border-slate-700/80 w-64 -left-1 ring-1 ring-slate-800' : 'bg-white border-slate-200/90 left-3 right-3 shadow-slate-900/10 ring-1 ring-slate-900/5'} 
          ${collapsed && !dark ? 'left-16 w-60' : ''}`}>

          {/* Header */}
          <div className={`px-4 py-2.5 border-b flex items-center justify-between ${dark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50/80 border-slate-100'}`}>
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-400'}`}>Workspaces</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200/60 text-slate-500'}`}>
              {(companyState.companies?.length || 0) + 1}
            </span>
          </div>

          <div className="p-1.5 space-y-1 max-h-[280px] overflow-y-auto scrollbar-thin">
            {/* Personal Workspace */}
            <div
              onClick={() => handleCompanySelect('Personal')}
              className={`group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 border ${
                currentCompany?.id === 'personal'
                  ? (dark ? 'bg-indigo-950/80 border-indigo-500/40 text-white font-bold' : 'bg-indigo-50/90 border-indigo-200/80 text-indigo-900 font-bold shadow-xs')
                  : (dark ? 'border-transparent hover:bg-slate-800 text-slate-300' : 'border-transparent hover:bg-slate-50 text-slate-700')
              }`}
            >
              <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-xs font-black text-white group-hover:scale-105 transition-transform">
                P
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate leading-tight">Personal Workspace</p>
                <p className={`text-[10px] font-semibold uppercase tracking-tight mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-400'}`}>Private Projects</p>
              </div>
              {currentCompany?.id === 'personal' && (
                <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>

            {/* Organization Workspaces */}
            {companyState.companies.map((company) => {
              const isSelected = currentCompany?.id === company.id;
              return (
                <div
                  key={company.id}
                  onClick={() => handleCompanySelect(company)}
                  className={`group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 border ${
                    isSelected
                      ? (dark ? 'bg-indigo-950/80 border-indigo-500/40 text-white font-bold' : 'bg-indigo-50/90 border-indigo-200/80 text-indigo-900 font-bold shadow-xs')
                      : (dark ? 'border-transparent hover:bg-slate-800 text-slate-300' : 'border-transparent hover:bg-slate-50 text-slate-700')
                  }`}
                >
                  <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs overflow-hidden group-hover:scale-105 transition-transform">
                    {company.logo ? (
                      <img src={getLogoUrl(company.logo)} alt={company.name} className="w-full h-full object-cover" />
                    ) : (
                      company.name?.charAt(0)?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate leading-tight">{company.name}</p>
                    <p className={`text-[10px] font-semibold uppercase tracking-tight mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-400'}`}>Organization</p>
                  </div>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add New Organization CTA */}
          <div className={`p-2 border-t ${dark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50/80 border-slate-100'}`}>
            <button
              onClick={() => handleCompanySelect('Create Company')}
              className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add New Organization</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default CompanySelector;
