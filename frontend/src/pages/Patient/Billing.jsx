import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Billing() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);

  const fetchBills = () => {
    api.get('/patients/billing')
      .then(r => setBills(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBills(); }, []);

  const handlePay = async (billId) => {
    setPaying(billId);
    try {
      await api.put(`/patients/billing/${billId}/pay`, { payment_method: 'online' });
      toast.success('Payment successful!');
      fetchBills();
    } catch { toast.error('Payment failed'); }
    finally { setPaying(null); }
  };

  const STATUS_BADGE = {
    pending: <span className="badge badge-danger">Unpaid</span>,
    partial: <span className="badge badge-warning">Partial</span>,
    paid: <span className="badge badge-success">Paid</span>,
  };

  const total = bills.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
  const pending = bills.filter(b => b.payment_status !== 'paid').reduce((sum, b) => sum + parseFloat(b.total_amount - b.paid_amount || 0), 0);

  return (
    <DashboardLayout title="Billing & Payments" subtitle="Your invoices and payment history">
      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>💳</div>
          <div className="stat-value">₹{total.toLocaleString('en-IN')}</div>
          <div className="stat-label">Total Billed</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--danger-glow)', color: 'var(--danger)' }}>⚠️</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>₹{pending.toLocaleString('en-IN')}</div>
          <div className="stat-label">Pending Amount</div>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
      ) : bills.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💳</div>
          <h3>No Bills Yet</h3>
          <p>Your invoices will appear here after appointments</p>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <table className="ht-table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Date</th>
                <th>Consultation</th>
                <th>Lab Fees</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(bill => (
                <tr key={bill.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Dr. {bill.doctor_name}</td>
                  <td>{new Date(bill.appointment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>₹{parseFloat(bill.consultation_fee).toLocaleString('en-IN')}</td>
                  <td>₹{parseFloat(bill.lab_fee).toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    ₹{parseFloat(bill.total_amount).toLocaleString('en-IN')}
                  </td>
                  <td>{STATUS_BADGE[bill.payment_status]}</td>
                  <td>
                    {bill.payment_status !== 'paid' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handlePay(bill.id)}
                        disabled={paying === bill.id}
                      >
                        {paying === bill.id ? '...' : 'Pay Now'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
