import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../context/AuthContext';
import { useAuth } from '../../context/AuthContext';
import { FiUsers, FiClock, FiCheckCircle, FiCalendar } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/doctors/dashboard-stats')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const STATS = [
    { icon: '📅', label: "Today's Appointments", value: data?.stats?.today_appointments ?? 0, color: 'var(--primary)', link: '/doctor/queue' },
    { icon: '⏳', label: 'In Queue', value: data?.stats?.queue_count ?? 0, color: 'var(--warning)', link: '/doctor/queue' },
    { icon: '✅', label: 'Completed Today', value: data?.stats?.completed_today ?? 0, color: 'var(--accent)', link: '/doctor/queue' },
    { icon: '👥', label: 'Total Patients', value: data?.stats?.total_patients ?? 0, color: 'var(--secondary)', link: '/doctor/patients' },
  ];

  if (loading) return <DashboardLayout title="Dashboard"><div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout
      title={`Welcome, Dr. ${user?.name?.split(' ').slice(-1)[0]} 👨‍⚕️`}
      subtitle="Manage your patients and queue efficiently"
    >
      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 32 }}>
        {STATS.map(s => (
          <Link key={s.label} to={s.link} style={{ textDecoration: 'none' }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: `${s.color}15` }}>
                <span style={{ fontSize: '1.3rem' }}>{s.icon}</span>
              </div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-2">
        {/* Today's Queue Preview */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1rem' }}>Today's Queue</h3>
            <Link to="/doctor/queue" className="btn btn-primary btn-sm">Manage Queue →</Link>
          </div>
          {!data?.todayQueue?.length ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <div className="empty-icon">🎉</div>
              <p>No patients in queue today</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.todayQueue.slice(0, 5).map(q => (
                <div key={q.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '10px 14px', background: 'var(--bg-card)',
                  borderRadius: 10, border: '1px solid var(--glass-border)'
                }}>
                  <div className="queue-number" style={{ width: 36, height: 36, fontSize: '0.85rem' }}>
                    {q.queue_number}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {q.patient_name}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                      {q.blood_group || 'Unknown'} • {q.gender || 'N/A'}
                    </div>
                  </div>
                  <span className={`badge ${q.status === 'in_consultation' ? 'badge-success' : 'badge-warning'}`}>
                    {q.status === 'in_consultation' ? 'In Room' : 'Waiting'}
                  </span>
                </div>
              ))}
              {data.todayQueue.length > 5 && (
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  +{data.todayQueue.length - 5} more patients
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Records + Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1rem' }}>Quick Actions</h3>
          {[
            { label: 'Open Queue Manager', icon: '📊', link: '/doctor/queue', desc: 'Call next, complete consultations', color: 'var(--primary)' },
            { label: 'My Patients', icon: '👥', link: '/doctor/patients', desc: 'View all your patients', color: 'var(--accent)' },
            { label: 'New Consultation', icon: '📝', link: '/doctor/consultation/new', desc: 'Write consultation notes', color: 'var(--secondary)' },
          ].map(a => (
            <Link key={a.label} to={a.link} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
                background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
                borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = a.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: `${a.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
                }}>
                  {a.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{a.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.desc}</div>
                </div>
              </div>
            </Link>
          ))}

          {/* Recent Records */}
          {data?.recentRecords?.length > 0 && (
            <div className="glass-card" style={{ padding: 20 }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: 14 }}>Recent Consultations</h4>
              {data.recentRecords.map(r => (
                <div key={r.id} style={{
                  padding: '10px 0',
                  borderBottom: '1px solid var(--glass-border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{r.patient_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.diagnosis || 'General Consultation'}</div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
