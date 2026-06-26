import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';

export default function DeanDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dean/dashboard-stats')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const STATS = [
    { icon: '👥', label: 'Total Patients', value: data?.stats?.total_patients ?? 0, color: 'var(--primary)', link: '/dean/doctors' },
    { icon: '👨‍⚕️', label: 'Active Doctors', value: data?.stats?.total_doctors ?? 0, color: 'var(--accent)', link: '/dean/doctors' },
    { icon: '📅', label: "Today's Appointments", value: data?.stats?.today_appointments ?? 0, color: 'var(--secondary)', link: '/dean/appointments' },
    { icon: '🛏️', label: 'Available Beds', value: `${data?.stats?.available_beds ?? 0}/${data?.stats?.total_beds ?? 0}`, color: 'var(--warning)', link: '/dean/beds' },
    { icon: '💰', label: 'Monthly Revenue', value: `₹${parseFloat(data?.stats?.monthly_revenue ?? 0).toLocaleString('en-IN')}`, color: 'var(--accent)', link: '/dean/billing' },
    { icon: '⏳', label: 'Active Queues', value: data?.stats?.active_queues ?? 0, color: 'var(--warning)', link: '/dean/doctors' },
    { icon: '💳', label: 'Pending Bills', value: `₹${parseFloat(data?.stats?.pending_bills ?? 0).toLocaleString('en-IN')}`, color: 'var(--danger)', link: '/dean/billing' },
    { icon: '🛏️', label: 'Bed Occupancy', value: `${data?.stats?.bed_occupancy ?? 0}%`, color: 'var(--primary)', link: '/dean/beds' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: 12, fontSize: '0.82rem' }}>
          <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{label}</p>
          <p style={{ color: 'var(--primary)' }}>{payload[0]?.value}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) return <DashboardLayout title="Hospital Dean Dashboard"><div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Hospital Dean Dashboard" subtitle="Real-time hospital performance overview">
      {/* Stats Grid */}
      <div className="grid grid-4" style={{ marginBottom: 32 }}>
        {STATS.map(s => (
          <Link key={s.label} to={s.link} style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor: 'pointer' }}>
              <div className="stat-icon" style={{ background: `${s.color}15` }}>
                <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
              </div>
              <div className="stat-value" style={{ color: s.color, fontSize: typeof s.value === 'string' && s.value.length > 8 ? '1.4rem' : '2rem' }}>
                {s.value}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        {/* Weekly Appointment Trend */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 20 }}>Weekly Appointment Trend</h3>
          {data?.weeklyTrend?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#8B9EC5', fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fill: '#8B9EC5', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} dot={{ fill: 'var(--primary)' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: 40 }}><p>No data yet</p></div>}
        </div>

        {/* Department Distribution */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 20 }}>Department Activity (Today)</h3>
          {data?.deptStats?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.deptStats.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#8B9EC5', fontSize: 9 }} tickFormatter={n => n?.slice(0, 6)} />
                <YAxis tick={{ fill: '#8B9EC5', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="appointments" fill="url(#grad)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="var(--secondary)" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: 40 }}><p>No data yet</p></div>}
        </div>
      </div>

      <div className="grid grid-2">
        {/* Top Doctors */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1rem' }}>Top Doctors by Patients</h3>
            <Link to="/dean/doctors" className="btn btn-ghost btn-sm">View All →</Link>
          </div>
          {data?.topDoctors?.length ? data.topDoctors.map((d, i) => (
            <div key={d.name} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0',
              borderBottom: '1px solid var(--glass-border)',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: i === 0 ? 'var(--grad-primary)' : 'var(--bg-card)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700,
                color: i === 0 ? 'white' : 'var(--text-muted)',
                flexShrink: 0,
              }}>{i + 1}</div>
              <div className="avatar avatar-sm">{d.name?.[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Dr. {d.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.specialization}</div>
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary)' }}>{d.total_appointments}</div>
            </div>
          )) : <div className="empty-state" style={{ padding: 20 }}><p>No data</p></div>}
        </div>

        {/* Quick Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: '1rem' }}>Hospital Management</h3>
          {[
            { label: 'Manage Doctors', icon: '👨‍⚕️', link: '/dean/doctors', desc: 'Add, edit, and manage medical staff', color: 'var(--primary)' },
            { label: 'Departments', icon: '🏥', link: '/dean/departments', desc: 'Manage hospital departments', color: 'var(--accent)' },
            { label: 'Bed Management', icon: '🛏️', link: '/dean/beds', desc: 'Real-time bed allocation tracking', color: 'var(--warning)' },
            { label: 'Revenue & Billing', icon: '💰', link: '/dean/billing', desc: 'Track payments and outstanding dues', color: 'var(--secondary)' },
            { label: 'Analytics', icon: '📊', link: '/dean/analytics', desc: 'Deep-dive hospital performance insights', color: 'var(--danger)' },
          ].map(a => (
            <Link key={a.label} to={a.link} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
                borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = a.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
              >
                <div style={{ fontSize: '1.3rem', width: 36 }}>{a.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{a.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.desc}</div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
