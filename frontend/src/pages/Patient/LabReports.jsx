import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../context/AuthContext';

const STATUS = {
  ordered: <span className="badge badge-warning">Ordered</span>,
  processing: <span className="badge badge-secondary">Processing</span>,
  completed: <span className="badge badge-success">Completed</span>,
};

export default function LabReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/patients/lab-reports')
      .then(r => setReports(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Lab Reports" subtitle="Your diagnostic test results">
      {loading ? (
        <div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔬</div>
          <h3>No Lab Reports</h3>
          <p>Lab test reports ordered by your doctor will appear here</p>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <table className="ht-table">
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Ordered By</th>
                <th>Ordered On</th>
                <th>Result</th>
                <th>Normal Range</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.test_name}</td>
                  <td>Dr. {r.doctor_name}</td>
                  <td>{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td style={{ color: r.result ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {r.result || '—'}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{r.normal_range || '—'}</td>
                  <td>{STATUS[r.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
