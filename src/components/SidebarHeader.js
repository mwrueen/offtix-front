import React from 'react';
import { BASE_SERVER_URL } from '../services/api';

const SidebarHeader = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  selectedCompany,
  companyData,
  onClick,
  isDropdownOpen
}) => {
  return (
    <div
      className={`sidebar-header border-b border-slate-100 flex relative transition-all duration-300 ${sidebarCollapsed
        ? 'p-5 px-3 items-center justify-between'
        : 'p-6 px-5 items-start justify-between'
        } ${isDropdownOpen
          ? 'bg-slate-100 shadow-inner'
          : 'bg-transparent hover:bg-slate-50/80 shadow-none'
        }`}
    >
      {sidebarCollapsed ? (
        <CollapsedLogo
          selectedCompany={selectedCompany}
          companyData={companyData}
          onClick={onClick}
        />
      ) : (
        <ExpandedHeader
          selectedCompany={selectedCompany}
          companyData={companyData}
          setSidebarCollapsed={setSidebarCollapsed}
          onClick={onClick}
          isDropdownOpen={isDropdownOpen}
        />
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={`absolute w-8 h-8 rounded-lg bg-indigo-600 border-2 border-white text-white cursor-pointer flex items-center justify-center transition-all duration-300 shadow-[0_4px_12px_rgba(79,70,229,0.3)] z-10 hover:bg-indigo-700 hover:scale-110 active:scale-95 ${sidebarCollapsed
          ? 'right-1/2 -bottom-4 translate-x-1/2'
          : 'right-5 top-6'
          }`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-300 ${sidebarCollapsed ? 'rotate-0' : 'rotate-180'
            }`}
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  );
};

const getLogoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${BASE_SERVER_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const CollapsedLogo = ({ selectedCompany, companyData, onClick }) => {
  const isPersonal = selectedCompany?.id === 'personal';
  const logo = selectedCompany?.logo || companyData?.logo;

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-center w-full cursor-pointer"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold text-white overflow-hidden transition-all duration-300 shadow-md ring-2 ring-transparent hover:ring-indigo-200 hover:scale-105 ${isPersonal
        ? 'bg-gradient-to-tr from-indigo-500 to-violet-600'
        : 'bg-indigo-600'
        }`}>
        {isPersonal ? (
          <PersonalIcon size={20} />
        ) : logo ? (
          <img
            src={getLogoUrl(logo)}
            alt={selectedCompany?.name || 'Company'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-lg font-bold text-white">
            {selectedCompany?.name?.charAt(0)?.toUpperCase() || 'O'}
          </div>
        )}
      </div>
    </div>
  );
};

const ExpandedHeader = ({ selectedCompany, companyData, setSidebarCollapsed, onClick, isDropdownOpen }) => {
  const isPersonal = selectedCompany?.id === 'personal';
  const logo = selectedCompany?.logo || companyData?.logo;

  return (
    <div
      onClick={onClick}
      className="flex-1 mr-3 cursor-pointer rounded-lg p-1 -m-1 transition-all duration-200"
    >
      <div className="flex items-center gap-3.5 mb-2">
        <CompanyLogo
          isPersonal={isPersonal}
          logo={logo}
          companyName={selectedCompany?.name}
        />
        <CompanyInfo
          companyName={selectedCompany?.name}
          isPersonal={isPersonal}
        />
        {/* Dropdown indicator */}
        <div className={`p-1 rounded-md transition-colors ${isDropdownOpen ? 'bg-slate-200 text-slate-700' : 'text-slate-400 group-hover:text-slate-600'}`}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-300 ease-out flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : 'rotate-0'
              }`}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
    </div>
  );
};

const CompanyLogo = ({ isPersonal, logo, companyName }) => {
  return (
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold text-white overflow-hidden transition-all shadow-[0_4px_10px_rgba(0,0,0,0.1)] ${isPersonal
      ? 'bg-gradient-to-tr from-indigo-500 to-violet-600'
      : 'bg-indigo-600'
      }`}>
      {isPersonal ? (
        <PersonalIcon size={24} />
      ) : logo ? (
        <img
          src={getLogoUrl(logo)}
          alt={companyName || 'Company'}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="text-xl font-bold text-white">
          {companyName?.charAt(0)?.toUpperCase() || 'O'}
        </div>
      )}
    </div>
  );
};

const CompanyInfo = ({ companyName, isPersonal }) => {
  return (
    <div className="flex-1 min-w-0">
      <h2 className="m-0 text-slate-800 text-[15px] font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
        {companyName || 'Offtix'}
      </h2>
      <p className={`m-0 text-[10px] font-bold uppercase tracking-widest mt-1 ${isPersonal ? 'text-violet-500' : 'text-slate-400'}`}>
        {isPersonal ? 'Personal Account' : ''}
      </p>
    </div>
  );
};

const PersonalIcon = ({ size = 18 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
};

export default SidebarHeader;

