import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../../context/CompanyContext';

const CompanySelector = ({ collapsed, isOpen, onToggle }) => {
  const navigate = useNavigate();
  const { state: companyState, selectCompany } = useCompany();

  const handleCompanySelect = async (company) => {
    if (company === 'Personal') {
      selectCompany({ id: 'personal', name: 'Personal' });
    } else if (company === 'Create Company') {
      navigate('/create-company');
    } else {
      selectCompany(company);
    }
    onToggle();
  };

  const currentCompany = companyState.selectedCompany;
  const initial = currentCompany?.name?.charAt(0)?.toUpperCase() || 'C';

  return (
    <div className="relative px-3 py-2 border-b border-slate-100">
      <div
        onClick={onToggle}
        className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors ${collapsed ? 'justify-center' : ''}`}
      >
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
          {currentCompany?.logo ? (
            <img src={currentCompany.logo} alt={currentCompany.name} className="w-full h-full object-cover rounded-lg" />
          ) : initial}
        </div>

        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
                {currentCompany?.name || 'Select Workspace'}
              </p>
              <p className="text-[11px] text-slate-400 leading-tight">
                {currentCompany?.id === 'personal' ? 'Personal' : 'Workspace'}
              </p>
            </div>
            <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </div>

      {isOpen && (
        <div className={`absolute top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden ${collapsed ? 'left-16 w-56' : 'left-3 right-3'}`}>
          {companyState.companies.length > 0 && (
            <div className="px-3 pt-2.5 pb-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Workspaces</p>
            </div>
          )}

          <div className="py-1">
            {companyState.companies.map((company) => (
              <div
                key={company.id}
                onClick={() => handleCompanySelect(company)}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${currentCompany?.id === company.id ? 'bg-indigo-50' : ''}`}
              >
                <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {company.logo ? <img src={company.logo} alt={company.name} className="w-full h-full object-cover rounded-lg" /> : company.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className={`text-sm font-medium flex-1 truncate ${currentCompany?.id === company.id ? 'text-indigo-700' : 'text-slate-700'}`}>{company.name}</span>
                {currentCompany?.id === company.id && (
                  <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100" />

          <div
            onClick={() => handleCompanySelect('Personal')}
            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${currentCompany?.id === 'personal' ? 'bg-indigo-50' : ''}`}
          >
            <div className="w-7 h-7 bg-violet-500 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className={`text-sm font-medium flex-1 ${currentCompany?.id === 'personal' ? 'text-indigo-700' : 'text-slate-700'}`}>Personal</span>
            {currentCompany?.id === 'personal' && (
              <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>

          <div className="border-t border-slate-100" />

          <div
            onClick={() => handleCompanySelect('Create Company')}
            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-600">New Workspace</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySelector;
