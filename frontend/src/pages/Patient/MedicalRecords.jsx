import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../context/AuthContext';
import { FiFileText } from 'react-icons/fi';

export default function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/patients/medical-records')
      .then(r => setRecords(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Medical Records" subtitle="Your complete health history">
      {loading ? (
        <div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Medical Records</h3>
          <p>Your consultation notes and prescriptions will appear here</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {records.map(record => (
            <div key={record.id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '20px 24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                onClick={() => setExpanded(expanded === record.id ? null : record.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'var(--secondary-glow)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#B06EE8', fontSize: '1.1rem',
                  }}>
                    <FiFileText />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      {record.diagnosis || 'Consultation Record'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Dr. {record.doctor_name} — {new Date(record.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
                  {expanded === record.id ? '▲' : '▼'}
                </div>
              </div>

              {expanded === record.id && (
                <div style={{ padding: '0 24px 24px', borderTop: '1px solid var(--glass-border)' }}>
                  <div className="grid grid-2" style={{ marginTop: 20, gap: 16 }}>
                    {record.symptoms && (
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>Symptoms</div>
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{record.symptoms}</div>
                      </div>
                    )}
                    {record.diagnosis && (
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>Diagnosis</div>
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{record.diagnosis}</div>
                      </div>
                    )}
                    {record.treatment_plan && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>Treatment Plan</div>
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{record.treatment_plan}</div>
                      </div>
                    )}
                    {record.follow_up_date && (
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>Follow-up Date</div>
                        <div style={{ fontSize: '0.88rem', color: 'var(--accent)' }}>
                          {new Date(record.follow_up_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    )}
                  </div>

                  {record.prescriptions?.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)', marginBottom: 12 }}>
                        💊 Prescriptions ({record.prescriptions.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {record.prescriptions.map(p => (
                          <div key={p.id} style={{
                            padding: '12px 16px',
                            background: 'var(--bg-card)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--glass-border)',
                          }}>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                              {p.medication_name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {p.dosage} • {p.frequency} • {p.duration}
                              {p.instructions && ` • ${p.instructions}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
