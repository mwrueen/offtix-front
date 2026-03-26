import React from 'react';

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
      className={`sidebar-header border-b border-slate-100 flex relative transition-colors duration-200 ${sidebarCollapsed
        ? 'p-5 px-3 items-center justify-between'
        : 'p-6 px-5 items-start justify-between'
        } ${isDropdownOpen
          ? 'bg-slate-100'
          : 'bg-transparent hover:bg-slate-50'
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
        className={`absolute w-8 h-8 rounded-lg bg-indigo-600 border border-slate-200 text-white cursor-pointer flex items-center justify-center transition-all duration-300 shadow-md z-10 hover:bg-indigo-700 ${sidebarCollapsed
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
          strokeWidth="2.5"
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

const CollapsedLogo = ({ selectedCompany, companyData, onClick }) => {
  const isPersonal = selectedCompany?.id === 'personal';

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-center w-full cursor-pointer"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base font-bold text-white overflow-hidden transition-transform duration-200 hover:scale-105 ${isPersonal
        ? 'bg-indigo-600 shadow-sm'
        : 'bg-indigo-600 shadow-sm'
        }`}>
        {isPersonal ? (
          <PersonalIcon size={18} />
        ) : companyData?.logo ? (
          <img
            src={companyData.logo}
            alt={selectedCompany?.name || 'Company'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-base font-bold text-white">
            {selectedCompany?.name?.charAt(0)?.toUpperCase() || 'T'}
          </div>
        )}
      </div>
    </div>
  );
};

const ExpandedHeader = ({ selectedCompany, companyData, setSidebarCollapsed, onClick, isDropdownOpen }) => {
  const isPersonal = selectedCompany?.id === 'personal';

  return (
    <div
      onClick={onClick}
      className="flex-1 mr-3 cursor-pointer rounded-lg p-1 -m-1 transition-colors duration-200"
    >
      <div className="flex items-center gap-3 mb-4">
        <CompanyLogo
          isPersonal={isPersonal}
          logo={companyData?.logo}
          companyName={selectedCompany?.name}
        />
        <CompanyInfo
          companyName={selectedCompany?.name}
          isPersonal={isPersonal}
        />
        {/* Dropdown indicator */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-300 ease-out opacity-70 flex-shrink-0 ml-auto ${isDropdownOpen ? 'rotate-180' : 'rotate-0'
            }`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    </div>
  );
};

const CompanyLogo = ({ isPersonal, logo, companyName }) => {
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white overflow-hidden ${isPersonal
      ? 'bg-indigo-600 shadow-sm'
      : 'bg-indigo-600 shadow-sm'
      }`}>
      {isPersonal ? (
        <PersonalIcon size={20} />
      ) : logo ? (
        <img
          src={logo}
          alt={companyName || 'Company'}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="text-lg font-bold text-white">
          {companyName?.charAt(0)?.toUpperCase() || 'T'}
        </div>
      )}
    </div>
  );
};

const CompanyInfo = ({ companyName, isPersonal }) => {
  return (
    <div className="flex-1 min-w-0">
      <h2 className="m-0 text-slate-800 text-lg font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
        {companyName || 'Offtix'}
      </h2>
      <p className="m-0 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        {isPersonal ? 'Personal Account' : 'Workspace'}
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

