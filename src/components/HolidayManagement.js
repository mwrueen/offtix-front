import React, { useState, useEffect } from 'react';
import { holidayAPI } from '../services/api';
import { useCompany } from '../context/CompanyContext';
import Layout from './Layout';

const HolidayManagement = () => {
  const { state } = useCompany();
  const selectedCompany = state.selectedCompany;
  const [holidays, setHolidays] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    name: '',
    description: ''
  });
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (selectedCompany && selectedCompany.id !== 'personal') {
      fetchHolidays();
    }
  }, [selectedCompany]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const response = await holidayAPI.getAll(selectedCompany.id);
      setHolidays(response.data.holidays || []);
      setCompany(response.data.company);
    } catch (error) {
      console.error('Error fetching holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    try {
      await holidayAPI.create(selectedCompany.id, formData);
      setShowAddModal(false);
      setFormData({ date: '', name: '', description: '' });
      fetchHolidays();
    } catch (error) {
      console.error('Error adding holiday:', error);
      alert(error.response?.data?.error || 'Failed to add holiday');
    }
  };

  const handleUpdateHoliday = async (e) => {
    e.preventDefault();
    try {
      await holidayAPI.update(selectedCompany.id, editingHoliday._id, formData);
      setShowEditModal(false);
      setEditingHoliday(null);
      setFormData({ date: '', name: '', description: '' });
      fetchHolidays();
    } catch (error) {
      console.error('Error updating holiday:', error);
      alert('Failed to update holiday');
    }
  };

  const handleDeleteHoliday = async (holidayId) => {
    if (window.confirm('Are you sure you want to delete this holiday?')) {
      try {
        await holidayAPI.delete(selectedCompany.id, holidayId);
        fetchHolidays();
      } catch (error) {
        console.error('Error deleting holiday:', error);
        alert('Failed to delete holiday');
      }
    }
  };

  const openEditModal = (holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      date: new Date(holiday.date).toISOString().split('T')[0],
      name: holiday.name,
      description: holiday.description || ''
    });
    setShowEditModal(true);
  };

  const filteredHolidays = holidays.filter(h => 
    new Date(h.date).getFullYear() === filterYear
  );

  const upcomingHolidays = holidays.filter(h => {
    const holidayDate = new Date(h.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return holidayDate >= today;
  }).slice(0, 5);

  const years = [...new Set(holidays.map(h => new Date(h.date).getFullYear()))].sort((a, b) => b - a);
  if (!years.includes(new Date().getFullYear())) {
    years.unshift(new Date().getFullYear());
  }

  const getMonthName = (date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'long' });
  };

  const getDayOfWeek = (date) => {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  };

  const isUpcoming = (date) => {
    const holidayDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return holidayDate >= today;
  };

  return (
    <Layout>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h2 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '28px' }}>
              🎉 Holiday Management
            </h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
              {company?.name} • {filteredHolidays.length} holidays in {filterYear}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>➕</span> Add Holiday
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
          {/* Main Content */}
          <div>
            {/* Year Filter */}
            <div style={{
              backgroundColor: 'white',
              padding: '16px 20px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Filter by Year:</span>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(parseInt(e.target.value))}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Holidays List */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Array(5).fill(0).map((_, index) => (
                  <div key={index} style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ width: '150px', height: '16px', backgroundColor: '#f1f5f9', borderRadius: '4px', marginBottom: '8px' }} />
                    <div style={{ width: '100px', height: '14px', backgroundColor: '#f1f5f9', borderRadius: '4px' }} />
                  </div>
                ))}
              </div>
            ) : filteredHolidays.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredHolidays.map((holiday) => (
                  <div
                    key={holiday._id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      border: isUpcoming(holiday.date) ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1 }}>
                      {/* Date Box */}
                      <div style={{
                        backgroundColor: isUpcoming(holiday.date) ? '#3b82f6' : '#f1f5f9',
                        color: isUpcoming(holiday.date) ? 'white' : '#1e293b',
                        padding: '12px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        minWidth: '70px'
                      }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', lineHeight: 1 }}>
                          {new Date(holiday.date).getDate()}
                        </div>
                        <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                          {getMonthName(holiday.date).substring(0, 3)}
                        </div>
                      </div>

                      {/* Holiday Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                            {holiday.name}
                          </h3>
                          {isUpcoming(holiday.date) && (
                            <span style={{
                              padding: '2px 8px',
                              backgroundColor: '#3b82f615',
                              color: '#3b82f6',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}>
                              UPCOMING
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                          {getDayOfWeek(holiday.date)} • {new Date(holiday.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        {holiday.description && (
                          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                            {holiday.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => openEditModal(holiday)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteHoliday(holiday._id)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#fef2f2',
                          color: '#ef4444',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '60px 20px',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#374151' }}>No holidays found</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                  Add holidays for {filterYear} to get started
                </p>
              </div>
            )}
          </div>

          {/* Sidebar - Upcoming Holidays */}
          <div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              position: 'sticky',
              top: '20px'
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                🔔 Upcoming Holidays
              </h3>
              {upcomingHolidays.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {upcomingHolidays.map((holiday) => (
                    <div
                      key={holiday._id}
                      style={{
                        padding: '12px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                        {holiday.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {new Date(holiday.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
                  <p style={{ margin: 0, fontSize: '13px' }}>No upcoming holidays</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Holiday Modal */}
        {showAddModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
                Add New Holiday
              </h3>
              <form onSubmit={handleAddHoliday}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Holiday Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., New Year's Day"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add a description..."
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData({ date: '', name: '', description: '' });
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: 'white',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Add Holiday
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Holiday Modal */}
        {showEditModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
                Edit Holiday
              </h3>
              <form onSubmit={handleUpdateHoliday}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Holiday Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingHoliday(null);
                      setFormData({ date: '', name: '', description: '' });
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: 'white',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Update Holiday
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

export default HolidayManagement;

