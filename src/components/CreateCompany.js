import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { useToast } from '../context/ToastContext';
import Layout from './Layout';
import Input from './common/Input';

const CreateCompany = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { createCompany } = useCompany();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    phone: '',
    email: '',
    foundedYear: '',
    companySize: '',
    founderRole: 'Founder/Owner'
  });

  const [additionalRoles, setAdditionalRoles] = useState([]);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleAddRole = () => {
    if (!newRole.name.trim()) {
      toast?.showToast?.('ROLE_NAME_EMPTY_IDENTIFICATION_REQUIRED', 'error');
      return;
    }
    setAdditionalRoles(prev => [...prev, { ...newRole, id: Date.now() }]);
    setNewRole({ name: '', description: '' });
  };

  const handleRemoveRole = (roleId) => {
    setAdditionalRoles(prev => prev.filter(role => role.id !== roleId));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'ENTITY_NAME_REQUIRED_FOR_REGISTRY';
    if (!formData.description.trim()) newErrors.description = 'MISSION_DESCRIPTION_AWAITING_INPUT';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'INVALID_COMMUNICATION_ADDRESS';
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) newErrors.website = 'URL_PROTOCOL_ERROR_HTTPS_REQUIRED';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast?.showToast?.('FORM_ENCRYPTION_ERRORS_DETECTED', 'error');
      return;
    }
    setLoading(true);
    try {
      const companyData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        additionalRoles: additionalRoles.map(role => ({ name: role.name, description: role.description }))
      };
      await createCompany(companyData);
      toast?.showToast?.('CLUSTER_INITIALIZED_SUCCESSFULLY_LINK_ESTABLISHED', 'success');
      navigate('/overview');
    } catch (error) {
      console.error('Error creating company:', error);
      toast?.showToast?.(error.response?.data?.message || 'CLUSTER_INITIALIZATION_FAILURE_RETRY_PROTOCOL', 'error');
    } finally {
      setLoading(false);
    }
  };

  const companySizeOptions = [
    { value: '', label: 'IDENTIFY_ENTITY_SCALE' },
    { value: '1-10', label: '1-10_NODES' },
    { value: '11-50', label: '11-50_NODES' },
    { value: '51-200', label: '51-200_NODES' },
    { value: '201-500', label: '201-500_NODES' },
    { value: '501-1000', label: '501-1000_NODES' },
    { value: '1000+', label: '1000+_NODES' }
  ];

  const industryOptions = [
    { value: '', label: 'IDENTIFY_SECTOR_CLUSTER' },
    { value: 'Technology', label: 'TECH_MATRIX' },
    { value: 'Finance', label: 'FINANCIAL_GRID' },
    { value: 'Healthcare', label: 'BIO_SYSTEMS' },
    { value: 'Education', label: 'KNOWLEDGE_CORE' },
    { value: 'Retail', label: 'COMMERCE_UPLINK' },
    { value: 'Manufacturing', label: 'PRODUCTION_LINE' },
    { value: 'Consulting', label: 'ADVISORY_NODE' },
    { value: 'Real Estate', label: 'GEO_ASSETS' },
    { value: 'Other', label: 'X_UNKNOWN_SECTOR' }
  ];

  return (
    <Layout>
      <div className="max-w-[1200px] mx-auto py-24 px-10 italic pb-60">
        {/* Modern Tactical Header */}
        <div className="mb-24 text-center lg:text-left relative group">
          <div className="absolute -left-10 top-0 w-2 h-full bg-indigo-600 rounded-full animate-pulse group-hover:w-4 transition-all" />
          <h1 className="text-7xl lg:text-8xl font-black text-slate-950 tracking-tighter mb-6 uppercase italic leading-none drop-shadow-sm group-hover:text-indigo-600 transition-colors">
            ESTABLISH_NEW_CLUSTER
          </h1>
          <p className="text-xl font-black text-slate-400 italic uppercase tracking-[0.4em] underline underline-offset-[16px] decoration-slate-100">
            Define organizational parameters and mission-critical objectives.
          </p>
        </div>

        {/* Form Matrix */}
        <form onSubmit={handleSubmit} className="space-y-20 animate-in fade-in slide-in-from-bottom-12 duration-1200">

          {/* Core Specs Section */}
          <section className="bg-white rounded-[6rem] p-16 shadow-24 border-8 border-slate-50 relative overflow-hidden group/sec">
            <div className="absolute top-0 right-0 p-24 text-[240px] font-black italic opacity-[0.03] grayscale pointer-events-none select-none text-slate-900 leading-none">CORE</div>
            <div className="flex items-center gap-8 mb-16 border-b-4 border-slate-100 pb-10 relative z-10 italic">
              <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-600 text-white flex items-center justify-center text-4xl shadow-24 group-hover/sec:rotate-12 transition-transform duration-700 border-4 border-white">
                📋
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-slate-950 tracking-tighter uppercase italic leading-none text-indigo-600">
                  CORE_SPECIFICATIONS_MATRIX
                </h2>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em] italic opacity-60 underline underline-offset-8 decoration-slate-50">Primary_Entity_Neural_Data_Sync</p>
              </div>
            </div>

            <div className="space-y-12 relative z-10 max-w-5xl">
              <Input
                label="ENTITY_CLUSTER_NAME"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="E.G., NEURAL_DYNAMICS_CORP_ALPHA"
                required
                error={errors.name}
              />

              <Input
                label="MISSION_OBJECTIVE_SUMMARY"
                name="description"
                type="textarea"
                value={formData.description}
                onChange={handleChange}
                placeholder="DEFINE_PRIMARY_OPERATIONAL_OBJECTIVES_FOR_THIS_CLUSTER..."
                required
                rows={4}
                error={errors.description}
                helperText="OPERATIONAL_SCOPE_AND_ARCHITECTURAL_MAPPING_ID_..."
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <Input
                  label="SECTOR_IDENT"
                  name="industry"
                  type="select"
                  value={formData.industry}
                  onChange={handleChange}
                  options={industryOptions}
                />

                <Input
                  label="ENTITY_SCALE_RANK"
                  name="companySize"
                  type="select"
                  value={formData.companySize}
                  onChange={handleChange}
                  options={companySizeOptions}
                />

                <Input
                  label="ORIGIN_CYCLE_Y"
                  name="foundedYear"
                  type="number"
                  value={formData.foundedYear}
                  onChange={handleChange}
                  placeholder="202X_CYCLE"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[160px] -translate-y-1/2 translate-x-1/2 -z-0 pointer-events-none group-hover/sec:scale-125 transition-transform duration-2000"></div>
          </section>

          {/* Contact & Geo Grid Omega */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Comms Network Input */}
            <section className="bg-white rounded-[5rem] p-14 shadow-24 border-8 border-slate-50 group/comms relative overflow-hidden italic">
              <div className="absolute top-0 right-0 p-16 text-[180px] font-black italic opacity-[0.02] grayscale pointer-events-none select-none text-slate-900 leading-none">COMMS</div>
              <div className="flex items-center gap-8 mb-12 border-b-4 border-slate-50 pb-8 relative z-10">
                <div className="w-16 h-16 rounded-[2rem] bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl shadow-inner group-hover/comms:scale-110 group-hover/comms:rotate-12 transition-all duration-700">
                  🌐
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tighter leading-none mb-3"> COMMS_CHANNEL_ID </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-40">EXTERNAL_UPLINK_SIGNATURES</p>
                </div>
              </div>

              <div className="space-y-10 relative z-10">
                <Input
                  label="SECURE_EMAIL_PROTOCOL"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="OPS_CENTER@ENTITY.IO"
                  error={errors.email}
                />

                <Input
                  label="DIRECT_VOICE_UPLINK"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+X_CHANNEL_IDENT"
                />

                <Input
                  label="WEB_TERMINAL_INTERFACE"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="HTTPS://TERMINAL_NODE.NET"
                  error={errors.website}
                />
              </div>
            </section>

            {/* Geo Matrix Input */}
            <section className="bg-white rounded-[5rem] p-14 shadow-24 border-8 border-slate-50 group/geo relative overflow-hidden italic">
              <div className="absolute top-0 right-0 p-16 text-[180px] font-black italic opacity-[0.02] grayscale pointer-events-none select-none text-slate-900 leading-none">GEO</div>
              <div className="flex items-center gap-8 mb-12 border-b-4 border-slate-50 pb-8 relative z-10">
                <div className="w-16 h-16 rounded-[2rem] bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl shadow-inner group-hover/geo:scale-110 group-hover/geo:rotate-12 transition-all duration-700">
                  📍
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tighter leading-none mb-3"> GEOSPATIAL_COORDS </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-40">PHYSICAL_SECTOR_IDENTIFICATION</p>
                </div>
              </div>

              <div className="space-y-10 relative z-10">
                <Input
                  label="HQ_PRIMARY_COORD"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="PHYSICAL_LOCATION_DATA..."
                />

                <div className="grid grid-cols-2 gap-8">
                  <Input
                    label="METRO_CORE"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="TERMINAL_CITY"
                  />

                  <Input
                    label="SECTOR_DISTRICT"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="SECTOR_7_DELTA"
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <Input
                    label="TERRITORY_IDENT"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="NEUTRAL_ZONE_X"
                  />

                  <Input
                    label="ZIP_INDEX_HASH"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="SIG_XXXXX"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Root Command Designation Zeta */}
          <section className="bg-slate-950 rounded-[6rem] p-16 shadow-24 border-8 border-slate-900 relative overflow-hidden group/root italic">
            <div className="absolute top-0 right-0 p-24 text-[240px] font-black italic opacity-[0.03] grayscale pointer-events-none select-none text-white leading-none">ROOT</div>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none group-hover/root:opacity-20 transition-opacity duration-1000" />
            <div className="flex items-center gap-10 mb-16 border-b-8 border-white/5 pb-12 relative z-10">
              <div className="w-24 h-24 rounded-[3.5rem] bg-indigo-600 text-white flex items-center justify-center text-5xl shadow-24 group-hover/root:rotate-12 group-hover/root:scale-110 transition-all duration-1000 border-4 border-white animate-pulse">
                👑
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-sm">
                  ROOT_COMMAND_DESIGNATION
                </h2>
                <p className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.6em] italic opacity-60 underline underline-offset-8 decoration-white/5">Primary_Sector_Identity_Lock</p>
              </div>
            </div>

            <div className="relative z-10 bg-white/5 border-4 border-white/5 rounded-[3.5rem] p-10 mb-16 backdrop-blur-3xl group-hover/root:bg-white/10 transition-all duration-1000">
              <div className="flex gap-10 items-start">
                <span className="text-5xl bg-white/10 w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-24 border-2 border-white/5 grayscale group-hover/root:grayscale-0 group-hover/root:rotate-12 transition-all">🛡️</span>
                <div className="space-y-6 flex-1">
                  <p className="text-2xl font-black text-indigo-400 uppercase tracking-tighter"> AUTHORIZATION_ROOT_GRANTED </p>
                  <p className="text-sm text-white/40 font-black leading-relaxed italic uppercase tracking-widest max-w-2xl group-hover/root:text-white/60 transition-colors">
                    Initializing this cluster grants permanent ROOT administrative privileges over all entities, mission logs, and financial resource allocation streams linked to this sector. Confirm your tactical designation.
                  </p>
                </div>
              </div>
            </div>

            <Input
              label="OPERATIONAL_ROOT_TITLE"
              name="founderRole"
              value={formData.founderRole}
              onChange={handleChange}
              placeholder="E.G., FOUNDER_COMMAND_DIRECTOR"
              required
              helperText="SPECIFY_YOUR_DESIGNATION_RANK_WITHIN_THE_PRIMARY_COMMAND_STRUCTURE_..."
              inputClassName="bg-white/5 border-white/10 focus:bg-white/10 text-white font-black tracking-tight uppercase placeholder:text-slate-800 text-2xl py-8 pl-10"
            />
            <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[180px] -z-0 pointer-events-none group-hover/root:scale-125 transition-transform duration-2000"></div>
          </section>

          {/* Subsidiary Operational Nodes Eta */}
          <section className="bg-white rounded-[6rem] p-16 shadow-24 border-8 border-slate-50 relative overflow-hidden italic group/subs animate-in zoom-in-95">
            <div className="absolute bottom-0 right-0 p-24 text-[240px] font-black italic opacity-[0.02] grayscale pointer-events-none select-none text-slate-950 leading-none">NODES</div>
            <div className="flex items-center justify-between gap-8 mb-16 border-b-4 border-slate-50 pb-12">
              <div className="flex items-center gap-10">
                <div className="w-20 h-20 rounded-[2.5rem] bg-slate-950 text-white flex items-center justify-center text-4xl shadow-24 group-hover/subs:rotate-12 transition-all duration-700 border-4 border-white">
                  👥
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-black text-slate-950 tracking-tighter uppercase italic leading-none group-hover/subs:text-indigo-600 transition-colors">
                    SUBSIDIARY_OPERATIONAL_NODES
                  </h2>
                  <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.6em] italic opacity-60 underline underline-offset-8 decoration-slate-50">Authorized_Hierarchy_Designations</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
              <div className="space-y-10">
                <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.8em] mb-8 border-b-4 border-slate-50 pb-6 italic underline underline-offset-8"> CURRENT_REGISTRY_STATE </h3>
                {additionalRoles.length === 0 ? (
                  <div className="py-24 text-center bg-slate-50/50 rounded-[4.5rem] border-8 border-dashed border-slate-100 flex flex-col items-center gap-10 grayscale opacity-20">
                    <div className="text-9xl mb-4">🗂️</div>
                    <p className="text-[14px] font-black text-slate-300 uppercase tracking-[0.8em] italic"> NO_SUBSIDIARY_ROLES_DETECTED </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {additionalRoles.map((role, i) => (
                      <div
                        key={role.id}
                        className="group flex items-center justify-between p-8 bg-slate-50/50 hover:bg-white border-4 border-slate-50 hover:border-indigo-100 rounded-[3rem] transition-all duration-1000 hover:shadow-24 relative overflow-hidden animate-in slide-in-from-left-8" style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full translate-x-12 -translate-y-12 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-1000" />
                        <div className="flex-1 min-w-0 pr-6 relative z-10">
                          <div className="text-xl font-black text-slate-950 uppercase italic tracking-tighter mb-2 leading-none group-hover:text-indigo-600 transition-colors">{role.name}</div>
                          <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic truncate opacity-60 underline underline-offset-4 decoration-slate-100">{role.description || 'MISSION_BRIEF_NEGATIVE'}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRole(role.id)}
                          className="w-14 h-14 bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white rounded-[1.5rem] transition-all duration-500 flex items-center justify-center shadow-sm hover:shadow-24 hover:rotate-90 active:scale-90 shrink-0 border-2 border-transparent hover:border-white relative z-10 text-xl font-black"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-12 bg-slate-950 rounded-[5rem] shadow-24 border-8 border-slate-900 group/form-role relative overflow-hidden italic animate-in slide-in-from-right-12 duration-1200 transition-all hover:scale-[1.02]">
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-indigo-500/10 to-transparent pointer-events-none" />
                <div className="space-y-10 relative z-10">
                  <div className="flex items-center gap-6 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border-2 border-white/10 flex items-center justify-center text-xl shadow-inner text-indigo-400">⚡</div>
                    <h4 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.8em] italic"> INITIALIZE_NODE_MODULE </h4>
                  </div>

                  <Input
                    label="NODE_DESIGNATION_RANK"
                    name="roleName"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    placeholder="E.G., PROJECT_COORD_7"
                    inputClassName="bg-white/5 border-white/10 focus:bg-white/10 text-white font-black tracking-tight uppercase text-lg py-6"
                  />

                  <Input
                    label="MISSION_BRIEF_ID"
                    name="roleDescription"
                    type="textarea"
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    placeholder="SPECIFY_SECTOR_RESPONSIBILITIES_LOGS..."
                    rows={3}
                    inputClassName="bg-white/5 border-white/10 focus:bg-white/10 text-white text-sm italic py-6 leading-loose"
                  />

                  <button
                    type="button"
                    onClick={handleAddRole}
                    className="w-full h-24 bg-white text-slate-950 rounded-[2.5rem] font-black text-base uppercase tracking-[0.6em] transition-all hover:bg-indigo-400 hover:text-white shadow-24 active:scale-95 group/btn-add relative overflow-hidden border-8 border-white/10 shrink-0"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-6">
                      <span className="text-3xl group-hover/btn-add:rotate-90 transition-transform duration-700">＋</span>
                      REGISTER_NODE_SIG
                    </span>
                    <div className="absolute top-0 left-0 w-full h-full bg-white/20 -translate-x-full group-hover/btn-add:animate-[shimmer_3s_infinite]" />
                  </button>
                </div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover/form-role:scale-150 transition-transform duration-2000"></div>
              </div>
            </div>
          </section>

          {/* Action Sequencer Omega */}
          <div className="flex flex-col sm:flex-row gap-10 justify-center lg:justify-end pt-20 border-t-8 border-slate-50 pb-40">
            <button
              type="button"
              onClick={() => navigate('/overview')}
              disabled={loading}
              className="px-16 py-8 bg-white border-4 border-slate-100 hover:border-slate-300 text-slate-400 rounded-[3.5rem] text-[13px] font-black uppercase tracking-[0.6em] transition-all hover:text-rose-600 active:scale-95 disabled:opacity-50 italic underline underline-offset-[16px] decoration-slate-50"
            >
              ABORT_CLUSTER_ID_INIT
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`px-24 py-8 rounded-[3.5rem] font-black text-[14px] uppercase tracking-[0.8em] text-white shadow-24 transition-all hover:scale-110 active:scale-95 group/submit relative overflow-hidden border-8 border-white min-w-[360px] italic ${loading ? 'bg-slate-300 text-slate-500 grayscale' : 'bg-slate-950 shadow-indigo-950/20 hover:bg-indigo-600'}`}
            >
              <span className="relative z-10 flex items-center justify-center gap-8">
                {loading ? (
                  <>
                    <div className="w-10 h-10 border-8 border-white/20 border-t-white rounded-full animate-spin"></div>
                    SYNCHRONIZING_CORE_PULSE...
                  </>
                ) : (
                  <>
                    <span className="text-3xl group-hover:rotate-12 transition-transform duration-700">🏢</span>
                    CONFIRM_DEPLOYMENT_LINK
                    <span className="text-3xl group-hover:translate-x-4 transition-transform duration-700">➜</span>
                  </>
                )}
              </span>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_3s_infinite] -z-0"></div>
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateCompany;
