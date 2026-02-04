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
      className="sidebar-header"
      style={{
        padding: sidebarCollapsed ? '20px 12px' : '24px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: sidebarCollapsed ? 'center' : 'flex-start',
        justifyContent: 'space-between',
        background: isDropdownOpen
          ? 'rgba(59, 130, 246, 0.08)'
          : 'rgba(255, 255, 255, 0.02)',
        position: 'relative',
        transition: 'background 0.2s ease'
      }}>
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
        style={{
          position: 'absolute',
          right: sidebarCollapsed ? '50%' : '20px',
          top: sidebarCollapsed ? 'auto' : '24px',
          bottom: sidebarCollapsed ? '-16px' : 'auto',
          transform: sidebarCollapsed ? 'translateX(50%)' : 'none',
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          border: '2px solid #0f172a',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          zIndex: 10
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb, #1d4ed8)';
          e.currentTarget.style.transform = sidebarCollapsed ? 'translateX(50%) scale(1.05)' : 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
          e.currentTarget.style.transform = sidebarCollapsed ? 'translateX(50%)' : 'none';
        }}
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
          style={{
            transform: sidebarCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.3s ease'
          }}
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
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        cursor: 'pointer'
      }}
    >
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        background: isPersonal
          ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
          : 'linear-gradient(135deg, #3b82f6, #2563eb)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        fontWeight: '700',
        color: 'white',
        boxShadow: isPersonal
          ? '0 4px 12px rgba(139, 92, 246, 0.4)'
          : '0 4px 12px rgba(59, 130, 246, 0.4)',
        overflow: 'hidden',
        transition: 'transform 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      >
        {isPersonal ? (
          <PersonalIcon size={18} />
        ) : companyData?.logo ? (
          <img 
            src={companyData.logo} 
            alt={selectedCompany?.name || 'Company'} 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div style={{
            fontSize: '16px',
            fontWeight: '700',
            color: 'white'
          }}>
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
      style={{
        flex: 1,
        marginRight: '12px',
        cursor: 'pointer',
        borderRadius: '8px',
        padding: '4px',
        margin: '-4px',
        transition: 'background 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
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
          style={{
            transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: 0.7,
            flexShrink: 0,
            marginLeft: 'auto'
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    </div>
  );
};

const CompanyLogo = ({ isPersonal, logo, companyName }) => {
  return (
    <div style={{
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      background: isPersonal
        ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
        : 'linear-gradient(135deg, #3b82f6, #2563eb)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      fontWeight: '700',
      color: 'white',
      boxShadow: isPersonal
        ? '0 4px 12px rgba(139, 92, 246, 0.4)'
        : '0 4px 12px rgba(59, 130, 246, 0.4)',
      overflow: 'hidden'
    }}>
      {isPersonal ? (
        <PersonalIcon size={20} />
      ) : logo ? (
        <img
          src={logo}
          alt={companyName || 'Company'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      ) : (
        <div style={{
          fontSize: '18px',
          fontWeight: '700',
          color: 'white'
        }}>
          {companyName?.charAt(0)?.toUpperCase() || 'T'}
        </div>
      )}
    </div>
  );
};

const CompanyInfo = ({ companyName, isPersonal }) => {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <h2 style={{
        margin: 0,
        color: '#ffffff',
        fontSize: '20px',
        fontWeight: '700',
        letterSpacing: '-0.3px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {companyName || 'Tabredon'}
      </h2>
      <p style={{
        margin: 0,
        fontSize: '11px',
        color: '#94a3b8',
        fontWeight: '500'
      }}>
        {isPersonal ? 'Personal Workspace' : 'Project Management'}
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

