import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeAPI } from '../services/api';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';
import { usePermissions, PERMISSIONS } from '../context/PermissionsContext';
import Layout from './Layout';
import PageHeader from './PageHeader';

const EmployeeList = () => {
  const { state: companyState } = useCompany();
  const { selectedCompany } = companyState;
  const { state: authState } = useAuth();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [employees, setEmployees] = useState([]);
  const [company, setCompany] = useState(null);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDesignation, setFilterDesignation] = useState('all');
  const canAddEmployee = hasPermission(PERMISSIONS.ADD_EMPLOYEE);

  useEffect(() => {
    if (authState.loading || companyState.loading) return;
    
    if (selectedCompany && selectedCompany.id !== 'personal') {
      fetchEmployees();
    } else if (!authState.loading && !companyState.loading && (selectedCompany === null || selectedCompany?.id === 'personal')) {
      navigate('/overview');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany, authState.loading, companyState.loading]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await employeeAPI.getAll(selectedCompany.id);
      setEmployees(res.data.employees || []);
      setCompany(res.data.company);
      setDesignations(res.data.designations || []);
    } catch (e) {
      console.error('Failed to fetch employees', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const ms = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const md = filterDesignation === 'all' || emp.designation === filterDesignation;
    return ms && md;
  });

  const getDColor = (d) => {
    const map = { 'Owner': 'rose', 'Managing Director': 'amber', 'HR Manager': 'emerald', 'Project Manager': 'indigo' };
    return map[d] || 'slate';
  };

  if (loading) return (
    <Layout>
      <div className="space-y-8 pb-12">
        <div className="h-40 bg-slate-100 rounded-2xl w-full animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-50 rounded w-3/4" />
                  <div className="h-3 bg-slate-50 rounded w-1/2" />
                </div>
              </div>
              <div className="h-20 bg-slate-50 rounded-xl w-full" />
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        <PageHeader
          title="Employee Directory"
          subtitle={`Manage personnel for ${company?.name || 'your company'}. View profiles and roles.`}
          icon={<div className="w-12 h-12 bg-white text-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-slate-100">👥</div>}
          stats={[
            { label: 'Total Employees', value: employees.length },
            { label: 'Matching Results', value: filteredEmployees.length }
          ]}
          actions={canAddEmployee && (
            <button
              onClick={() => navigate('/add-employee')}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2"
            >
              <span>+</span>
              <span>Add Employee</span>
            </button>
          )}
        />

        {/* Search & Filter */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[300px] relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-400 transition-all"
            />
          </div>
          <div className="min-w-[200px] relative">
            <select
              value={filterDesignation}
              onChange={(e) => setFilterDesignation(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-indigo-400 cursor-pointer appearance-none transition-all"
            >
              <option value="all">All Designations</option>
              {designations.map(des => <option key={des._id} value={des.name}>{des.name}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
          </div>
        </div>

        {filteredEmployees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEmployees.map((e) => {
              const dColor = getDColor(e.designation);
              return (
                <div
                  key={e._id}
                  onClick={() => navigate(`/employees/${e._id}`)}
                  className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer relative flex flex-col"
                >
                  <div className="flex flex-col items-center mb-6 text-center space-y-3">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-2xl border border-slate-200 overflow-hidden shrink-0">
                      {e.profile?.profilePicture ? (
                        <img src={e.profile.profilePicture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-700">{e.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-800 truncate transition-colors group-hover:text-indigo-600"> {e.name} </h3>
                      <p className="text-xs font-medium text-slate-500 truncate"> {e.email} </p>
                    </div>
                  </div>

                  <div className="space-y-4 mt-auto">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border bg-${dColor}-50 text-${dColor}-700 border-${dColor}-100`}>
                          {e.designation || 'Staff'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Joined</span>
                        <span className="text-xs font-bold text-slate-700">
                          {new Date(e.joinedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all pt-2">
                      <button
                        onClick={(ev) => { ev.stopPropagation(); navigate(`/profile/view/${e._id}`); }}
                        className="text-[10px] font-bold text-slate-900 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                      >
                        📄 View CV
                      </button>
                      <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 uppercase tracking-widest">
                        Manage <span>→</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-16 rounded-3xl border-2 border-dashed border-slate-100 text-center space-y-6">
            <div className="text-8xl grayscale opacity-10">🗂️</div>
            <div className="space-y-2">
              <h3 className="text-3xl font-bold text-slate-800">No Employees Found</h3>
              <p className="text-slate-500 max-w-sm mx-auto">No employees match your search criteria. Try adjusting your filters or search terms.</p>
            </div>
            <button
              onClick={() => { setSearchTerm(''); setFilterDesignation('all'); }}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all shadow-md"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EmployeeList;
