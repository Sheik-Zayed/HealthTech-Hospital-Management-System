import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../context/AuthContext';
import { FiSearch } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchPatients = (q = '') => {
    setLoading(true);
    api.get(`/doctors/patients${q ? `?search=${q}` : ''}`)
      .then(r => setPatients(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPatients(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPatients(search);
  };

  return (
    <DashboardLayout title="My Patients" subtitle="View and manage your patient records">
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div className="input-wrapper" style={{ flex: 1 }}>
          <FiSearch className="input-icon" />
          <input
            className="form-control input-with-icon"
            placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div>
      ) : patients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No Patients Found</h3>
          <p>Patients who have appointments with you will appear here</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {patients.map(p => (
            <div key={p.id} className="glass-card" style={{ padding: 24, cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => navigate(`/doctor/consultation/${p.id}`)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div className="avatar avatar-lg">{p.name?.[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {p.blood_group && <span className="badge badge-danger">{p.blood_group}</span>}
                {p.gender && <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>{p.gender}</span>}
              </div>
              {p.allergies && (
                <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--danger)' }}>
                  ⚠️ Allergies: {p.allergies}
                </div>
              )}
              {p.chronic_conditions && (
                <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--warning)' }}>
                  📋 {p.chronic_conditions}
                </div>
              )}
              <div style={{ marginTop: 16 }}>
                <button className="btn btn-secondary btn-sm btn-block">View & Write Record</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
