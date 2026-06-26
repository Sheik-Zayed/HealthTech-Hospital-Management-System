import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

const COLORS = ['var(--primary)', 'var(--accent)', 'var(--secondary)', 'var(--warning)', 'var(--danger)', '#FF6B9D'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: 12, fontSize: '0.82rem' }}>
        <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{label}</p>
        {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dean/analytics')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout title="Analytics"><div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Analytics & Reports" subtitle="Hospital performance insights and trends">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Monthly Revenue */}
        <div className="glass-card" style={{ padding: 28 }}>
          <h3 style={{ marginBottom: 20, fontSize: '1rem' }}>📈 Monthly Revenue (Last 6 Months)</h3>
          {data?.monthlyRevenue?.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#8B9EC5', fontSize: 11 }} />
                <YAxis tick={{ fill: '#8B9EC5', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip content={<CustomTooltip />} formatter={v => `₹${parseFloat(v).toLocaleString('en-IN')}`} />
                <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]}>
                  {data.monthlyRevenue.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? 'var(--primary)' : 'var(--secondary)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: 40 }}><p>No revenue data yet</p></div>}
        </div>

        <div className="grid grid-2">
          {/* Appointment Status */}
          <div className="glass-card" style={{ padding: 28 }}>
            <h3 style={{ marginBottom: 20, fontSize: '1rem' }}>📊 Appointment Status Distribution</h3>
            {data?.appointmentStatus?.length ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={data.appointmentStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                      {data.appointmentStatus.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1 }}>
                  {data.appointmentStatus.map((s, i) => (
                    <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <div style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{s.status}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{s.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div className="empty-state" style={{ padding: 40 }}><p>No data yet</p></div>}
          </div>

          {/* Patient Trend */}
          <div className="glass-card" style={{ padding: 28 }}>
            <h3 style={{ marginBottom: 20, fontSize: '1rem' }}>👥 Patient Registrations Trend</h3>
            {data?.patientTrend?.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.patientTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#8B9EC5', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#8B9EC5', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="count" name="New Patients" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="empty-state" style={{ padding: 40 }}><p>No data yet</p></div>}
          </div>
        </div>

        {/* Department Appointments */}
        <div className="glass-card" style={{ padding: 28 }}>
          <h3 style={{ marginBottom: 20, fontSize: '1rem' }}>🏥 Appointments by Department</h3>
          {data?.deptAppointments?.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.deptAppointments} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: '#8B9EC5', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#8B9EC5', fontSize: 11 }} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="appointments" name="Appointments" radius={[0, 6, 6, 0]}>
                  {data.deptAppointments.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: 40 }}><p>No data yet</p></div>}
        </div>
      </div>
    </DashboardLayout>
  );
}
