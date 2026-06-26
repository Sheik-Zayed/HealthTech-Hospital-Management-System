import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_COLOR = {
  available: { badge: 'badge-success', label: 'Available' },
  occupied: { badge: 'badge-danger', label: 'Occupied' },
  maintenance: { badge: 'badge-warning', label: 'Maintenance' },
};

export default function BedManagement() {
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchBeds = () => {
    setLoading(true);
    api.get('/dean/beds')
      .then(r => setBeds(r.data))
      .catch(() => toast.error('Failed to load beds'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBeds(); }, []);

  const updateBed = async (id, status) => {
    try {
      await api.put(`/dean/beds/${id}`, { status });
      toast.success('Bed status updated');
      fetchBeds();
    } catch { toast.error('Failed to update bed'); }
  };

  const filtered = filter === 'all' ? beds : beds.filter(b => b.status === filter);

  const stats = {
    total: beds.length,
    available: beds.filter(b => b.status === 'available').length,
    occupied: beds.filter(b => b.status === 'occupied').length,
    maintenance: beds.filter(b => b.status === 'maintenance').length,
  };

  return (
    <DashboardLayout title="Bed Management" subtitle="Real-time hospital bed allocation">
      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Beds', value: stats.total, color: 'var(--primary)' },
          { label: 'Available', value: stats.available, color: 'var(--accent)' },
          { label: 'Occupied', value: stats.occupied, color: 'var(--danger)' },
          { label: 'Maintenance', value: stats.maintenance, color: 'var(--warning)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'available', 'occupied', 'maintenance'].map(f => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div>
      ) : (
        <div className="grid grid-3">
          {filtered.map(bed => (
            <div key={bed.id} className="glass-card" style={{ padding: 20, borderLeft: `3px solid ${bed.status === 'available' ? 'var(--accent)' : bed.status === 'occupied' ? 'var(--danger)' : 'var(--warning)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    Bed {bed.bed_number}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {bed.department_name} • {bed.ward_type?.charAt(0).toUpperCase() + bed.ward_type?.slice(1)} Ward
                  </div>
                </div>
                <span className={`badge ${STATUS_COLOR[bed.status]?.badge}`}>
                  {STATUS_COLOR[bed.status]?.label}
                </span>
              </div>

              {bed.status === 'occupied' && bed.patient_name && (
                <div style={{ padding: '8px 12px', background: 'rgba(255,77,109,0.08)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--danger)', marginBottom: 12 }}>
                  👤 Patient: {bed.patient_name}
                  {bed.admitted_at && (
                    <div style={{ fontSize: '0.72rem', marginTop: 2 }}>
                      Admitted: {new Date(bed.admitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {bed.status !== 'available' && (
                  <button className="btn btn-sm" style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid rgba(0,229,160,0.3)', fontSize: '0.72rem' }}
                    onClick={() => updateBed(bed.id, 'available')}>
                    ✓ Mark Available
                  </button>
                )}
                {bed.status !== 'maintenance' && (
                  <button className="btn btn-sm" style={{ background: 'var(--warning-glow)', color: 'var(--warning)', border: '1px solid rgba(255,181,71,0.3)', fontSize: '0.72rem' }}
                    onClick={() => updateBed(bed.id, 'maintenance')}>
                    🔧 Maintenance
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
