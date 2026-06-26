import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth, api } from '../../context/AuthContext';
import { FiCalendar, FiClock, FiFileText, FiDollarSign,
         FiArrowRight, FiActivity, FiBell } from 'react-icons/fi';

const STATUS_BADGE = {
  pending: <span className="badge badge-warning">Pending</span>,
  confirmed: <span className="badge badge-primary">Confirmed</span>,
  in_progress: <span className="badge badge-secondary">In Progress</span>,
  completed: <span className="badge badge-success">Completed</span>,
  cancelled: <span className="badge badge-danger">Cancelled</span>,
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/patients/dashboard-stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const STAT_CARDS = [
    { icon: '📅', label: 'Total Appointments', value: stats?.stats?.total_appointments ?? 0, color: 'var(--primary)', bg: 'var(--primary-glow)', link: '/patient/appointments' },
    { icon: '🗓️', label: 'Upcoming', value: stats?.stats?.upcoming_appointments ?? 0, color: 'var(--accent)', bg: 'var(--accent-glow)', link: '/patient/appointments' },
    { icon: '📋', label: 'Medical Records', value: stats?.stats?.medical_records ?? 0, color: 'var(--secondary)', bg: 'var(--secondary-glow)', link: '/patient/records' },
    { icon: '💳', label: 'Pending Bills', value: stats?.stats?.pending_bills ?? 0, color: 'var(--warning)', bg: 'var(--warning-glow)', link: '/patient/billing' },
  ];

  if (loading) return (
    <DashboardLayout title="Dashboard">
      <div className="loading-screen" style={{ minHeight: 300 }}>
        <div className="spinner" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout
      title={`Good morning, ${user?.name?.split(' ')[0]} 👋`}
      subtitle="Here's your health summary for today"
    >
      {/* Queue Alert */}
      {stats?.currentQueue && (
        <div className="alert alert-info" style={{ marginBottom: 24, fontSize: '0.9rem' }}>
          🔔 <strong>You're in queue!</strong> Queue #{stats.currentQueue.queue_number} for Dr. {stats.currentQueue.doctor_name}.
          &nbsp; <Link to="/patient/queue" style={{ color: 'var(--primary)', fontWeight: 700 }}>Track your position →</Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-4" style={{ marginBottom: 32 }}>
        {STAT_CARDS.map(s => (
          <Link key={s.label} to={s.link} style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor: 'pointer' }}>
              <div className="stat-icon" style={{ background: s.bg }}>
                <span style={{ fontSize: '1.3rem' }}>{s.icon}</span>
              </div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-2">
        {/* Recent Appointments */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1rem' }}>Recent Appointments</h3>
            <Link to="/patient/appointments" className="btn btn-ghost btn-sm">View All <FiArrowRight size={12} /></Link>
          </div>
          {!stats?.recentAppointments?.length ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <div className="empty-icon">📅</div>
              <p>No appointments yet</p>
              <Link to="/patient/appointments" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                Book First Appointment
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.recentAppointments.map(apt => (
                <div key={apt.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px', background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)'
                }}>
                  <div style={{
                    width: 44, height: 44,
                    background: 'var(--grad-primary)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0
                  }}>
                    {apt.doctor_name?.[0]}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Dr. {apt.doctor_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {apt.department_name} • {new Date(apt.appointment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} {apt.appointment_time?.slice(0,5)}
                    </div>
                  </div>
                  {STATUS_BADGE[apt.status]}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1rem' }}>Quick Actions</h3>
          {[
            { label: 'Book Appointment', icon: <FiCalendar />, link: '/patient/appointments', color: 'var(--primary)', desc: 'Schedule with any doctor' },
            { label: 'Track Queue', icon: <FiClock />, link: '/patient/queue', color: 'var(--accent)', desc: 'Real-time queue position' },
            { label: 'Medical Records', icon: <FiFileText />, link: '/patient/records', color: 'var(--secondary)', desc: 'View your health history' },
            { label: 'Lab Reports', icon: <FiActivity />, link: '/patient/lab-reports', color: 'var(--warning)', desc: 'Check test results' },
            { label: 'View Billing', icon: <FiDollarSign />, link: '/patient/billing', color: 'var(--danger)', desc: 'Invoices & payments' },
          ].map(a => (
            <Link key={a.label} to={a.link} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = a.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: `${a.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: a.color, fontSize: '1rem', flexShrink: 0
                }}>
                  {a.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{a.label}</div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{a.desc}</div>
                </div>
                <FiArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
