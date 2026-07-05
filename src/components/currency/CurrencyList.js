import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../layout/Layout';
import { currencyAPI, getAssetUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const CurrencyList = () => {
  const { state: authState } = useAuth();
  const toast = useToast();
  
  const [currencies, setCurrencies] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);
  
  // Form fields
  const [code, setCode] = useState('');
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (authState.user?.role === 'superadmin') {
      fetchCurrencies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.user]);

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const res = await currencyAPI.getAll();
      setCurrencies(res.data || []);
    } catch (e) {
      toast.showToast('Failed to load currencies', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCurrency(null);
    setCode('');
    setSymbol('');
    setName('');
    setIconFile(null);
    setIconPreview('');
    setModalOpen(true);
  };

  const openEditModal = (curr) => {
    setEditingCurrency(curr);
    setCode(curr.code);
    setSymbol(curr.symbol);
    setName(curr.name);
    setIconFile(null);
    setIconPreview(curr.icon ? getAssetUrl(curr.icon) : '');
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.showToast('Please upload an image file', 'error');
        return;
      }
      setIconFile(file);
      setIconPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code || !symbol || !name) {
      toast.showToast('Please fill in all required fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let savedCurrency;
      if (editingCurrency) {
        // Update
        const res = await currencyAPI.update(editingCurrency._id || editingCurrency.id, {
          code,
          symbol,
          name
        });
        savedCurrency = res.data;
      } else {
        // Create
        const res = await currencyAPI.create({
          code,
          symbol,
          name
        });
        savedCurrency = res.data;
      }

      // Handle icon upload if present
      if (iconFile && savedCurrency) {
        const formData = new FormData();
        formData.append('icon', iconFile);
        const iconRes = await currencyAPI.uploadIcon(savedCurrency._id || savedCurrency.id, formData);
        savedCurrency = iconRes.data;
      }

      toast.showToast(
        `Currency ${editingCurrency ? 'updated' : 'created'} successfully`,
        'success'
      );
      
      setModalOpen(false);
      fetchCurrencies();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Action failed';
      toast.showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this currency?')) return;
    
    try {
      await currencyAPI.delete(id);
      toast.showToast('Currency deleted successfully', 'success');
      fetchCurrencies();
    } catch (e) {
      toast.showToast('Failed to delete currency', 'error');
    }
  };

  if (authState.user?.role !== 'superadmin') {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center py-24 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-3xl shadow-inner border border-rose-100">🔒</div>
          <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
          <p className="text-slate-500 text-sm">Only system administrators can manage global currencies.</p>
        </div>
      </Layout>
    );
  }

  const filteredCurrencies = currencies.filter(curr => 
    curr.code.toLowerCase().includes(search.toLowerCase()) ||
    curr.name.toLowerCase().includes(search.toLowerCase()) ||
    curr.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6 pb-20">
        {/* Header Section */}
        <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-indigo-100">🪙</div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Currencies</h1>
              <p className="text-xs text-slate-500 font-medium tracking-tight">Configure available dynamic currencies and custom icons across the organization</p>
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:from-slate-900 hover:to-slate-800 transition-all shadow-md active:scale-95 flex items-center gap-2"
          >
            <span className="text-sm">+</span> Add Currency
          </button>
        </div>

        {/* Filter and stats */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Search by code, symbol or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <span className="absolute left-3.5 top-2.5 text-slate-400">🔍</span>
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 shrink-0">
            Total Active Currencies: <span className="text-indigo-600 font-bold">{currencies.length}</span>
          </div>
        </div>

        {/* Currencies Grid */}
        {loading ? (
          <div className="py-24 text-center flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Synchronizing system currencies…</p>
          </div>
        ) : filteredCurrencies.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center shadow-sm">
            <div className="text-5xl mb-4 opacity-40">🪙</div>
            <h3 className="text-base font-bold text-slate-700">No Currencies Found</h3>
            <p className="text-xs text-slate-400 mt-1">Try resetting the filter or add your first system currency.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCurrencies.map((curr) => (
              <div
                key={curr._id || curr.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 transition-all duration-300 group flex flex-col relative overflow-hidden"
              >
                {/* Dynamic/fallback visual */}
                <div className="flex items-center gap-4 mb-4">
                  {curr.icon ? (
                    <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200/60 overflow-hidden flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <img
                        src={getAssetUrl(curr.icon)}
                        alt={curr.name}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-indigo-50 to-indigo-100/50 border border-indigo-100 flex items-center justify-center text-2xl font-black text-indigo-600 shadow-sm group-hover:scale-105 transition-transform">
                      {curr.symbol}
                    </div>
                  )}
                  <div>
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-[10px] uppercase tracking-wide">
                      {curr.code}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm truncate max-w-[140px] mt-1 group-hover:text-indigo-600 transition-colors">
                      {curr.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 mt-auto pt-3 border-t border-slate-100">
                  <span>Symbol: <span className="font-bold text-slate-700">{curr.symbol}</span></span>
                  <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(curr)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(curr._id || curr.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200">
              
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {editingCurrency ? 'Edit System Currency' : 'Create New Currency'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    {editingCurrency ? 'Update details' : 'Configure code, symbol & logo'}
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                      Currency Code *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. USD, BDT"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                      Symbol *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. $, ৳"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Currency Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. US Dollar, Bangladeshi Taka"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Custom Icon / Flag Image (Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      {iconPreview ? (
                        <img src={iconPreview} alt="Preview" className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="text-2xl opacity-40">🖼️</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-colors shadow-sm"
                      >
                        Choose Image
                      </button>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">
                        Supported formats: PNG, JPG, SVG. Max size: 2MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-6 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-md transition-all active:scale-95"
                  >
                    {submitting ? 'Saving…' : 'Save Currency'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CurrencyList;
