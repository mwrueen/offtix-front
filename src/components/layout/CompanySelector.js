import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../../context/CompanyContext';
import { usePermissions } from '../../context/PermissionsContext';

const CompanySelector = ({ collapsed, isOpen, onToggle }) => {
  const navigate = useNavigate();
  const { state: companyState, selectCompany } = useCompany();
  const { companyData } = usePermissions();

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

  return (
    <div className="relative">
      {/* Company Selector Button */}
      <div 
        onClick={onToggle}
        className="mx-4 my-3 p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {/* Company Logo/Avatar */}
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            {currentCompany?.logo ? (
              <img
                src={currentCompany.logo}
                alt={currentCompany.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <span className="text-white font-semibold text-sm">
                {currentCompany?.name?.charAt(0)?.toUpperCase() || 'C'}
              </span>
            )}
          </div>
          
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {currentCompany?.name || 'Select Company'}
                </p>
                <p className="text-xs text-slate-400">
                  {currentCompany?.id === 'personal' ? 'Personal Workspace' : 'Company Workspace'}
                </p>
              </div>
              <svg 
                className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute top-full ${collapsed ? 'left-20' : 'left-4 right-4'} mt-2 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-50 ${collapsed ? 'w-64' : ''}`}>
          {/* Header */}
          {companyState.companies.length > 0 && (
            <div className="px-4 py-2 border-b border-slate-700">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Your Workspaces
              </p>
            </div>
          )}

          {/* Company List */}
          <div className="py-2">
            {companyState.companies.map((company) => (
              <div
                key={company.id}
                onClick={() => handleCompanySelect(company)}
                className={`px-4 py-3 cursor-pointer hover:bg-slate-700 transition-colors flex items-center space-x-3 ${
                  currentCompany?.id === company.id ? 'bg-slate-700' : ''
                }`}
              >
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  {company.logo ? (
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-white font-semibold text-sm">
                      {company.name?.charAt(0)?.toUpperCase() || 'C'}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-white flex-1">
                  {company.name}
                </span>
                {currentCompany?.id === company.id && (
                  <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* Separator */}
          <div className="border-t border-slate-700"></div>

          {/* Personal Option */}
          <div
            onClick={() => handleCompanySelect('Personal')}
            className={`px-4 py-3 cursor-pointer hover:bg-slate-700 transition-colors flex items-center space-x-3 ${
              currentCompany?.id === 'personal' ? 'bg-slate-700' : ''
            }`}
          >
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-white flex-1">
              Personal
            </span>
            {currentCompany?.id === 'personal' && (
              <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>

          {/* Separator */}
          <div className="border-t border-slate-700"></div>

          {/* Create Company Option */}
          <div
            onClick={() => handleCompanySelect('Create Company')}
            className="px-4 py-3 cursor-pointer hover:bg-slate-700 transition-colors flex items-center space-x-3"
          >
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-white">
              Create New Workspace
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySelector;