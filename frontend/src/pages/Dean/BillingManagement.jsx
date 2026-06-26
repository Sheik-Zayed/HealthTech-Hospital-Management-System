import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  pending: <span className="badge badge-danger">Unpaid</span>,
  partial: <span className="badge badge-warning">Partial</span>,
  paid: <span className="badge badge-success">Paid</span>,
};

export default function BillingManagement() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dean/billing')
      .then(r => setBills(r.data))
      .catch(() => toast.error('Failed to load billing'))
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = bills.filter(b => b.payment_status === 'paid').reduce((s, b) => s + parseFloat(b.paid_amount || 0), 0);
  const totalPending = bills.filter(b => b.payment_status !== 'paid').reduce((s, b) => s + parseFloat(b.total_amount - b.paid_amount || 0), 0);

  return (
    <DashboardLayout title="Billing Management" subtitle="Hospital-wide revenue and payment tracking">
      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-glow)' }}>💰</div>
          <div className="stat-value" style={{ color: 'var(--accent)', fontSize: '1.5rem' }}>
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="stat-label">Total Revenue Collected</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--danger-glow)' }}>⚠️</div>
          <div className="stat-value" style={{ color: 'var(--danger)', fontSize: '1.5rem' }}>
            ₹{totalPending.toLocaleString('en-IN')}
          </div>
          <div className="stat-label">Outstanding Dues</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-glow)' }}>📋</div>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{bills.length}</div>
          <div className="stat-label">Total Invoices</div>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <table className="ht-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Consultation</th>
                <th>Lab/Medicine</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.patient_name}</td>
                  <td>{new Date(b.appointment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>₹{parseFloat(b.consultation_fee || 0).toLocaleString('en-IN')}</td>
                  <td>₹{(parseFloat(b.lab_fee || 0) + parseFloat(b.medicine_fee || 0)).toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{parseFloat(b.total_amount || 0).toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--accent)' }}>₹{parseFloat(b.paid_amount || 0).toLocaleString('en-IN')}</td>
                  <td>{STATUS_BADGE[b.payment_status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
