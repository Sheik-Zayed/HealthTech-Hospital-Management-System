import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../context/AuthContext';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { FiCheck, FiSkipForward, FiPhoneCall } from 'react-icons/fi';

export default function QueueManager() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState(null);
  const socketRef = useRef(null);

  const fetchQueue = async () => {
    try {
      const res = await api.get('/doctors/queue');
      setQueue(res.data);
    } catch { toast.error('Failed to load queue'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    // Get doctor profile ID
    api.get('/doctors/profile').then(r => {
      const did = r.data.id;
      setDoctorId(did);
      fetchQueue();
      // Socket
      socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
      socketRef.current.emit('join:queue', did);
      socketRef.current.on('queue:update', () => fetchQueue());
    }).catch(() => setLoading(false));

    return () => socketRef.current?.disconnect();
  }, []);

  const callPatient = async (id) => {
    try {
      await api.post(`/doctors/queue/${id}/call`);
      toast.success('Patient called!');
      fetchQueue();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to call'); }
  };

  const complete = async (id) => {
    try {
      await api.put(`/doctors/queue/${id}/complete`);
      toast.success('Consultation completed');
      fetchQueue();
    } catch (err) { toast.error('Failed to complete'); }
  };

  const skip = async (id) => {
    try {
      await api.put(`/doctors/queue/${id}/skip`);
      toast('Patient skipped');
      fetchQueue();
    } catch { toast.error('Failed to skip'); }
  };

  const waiting = queue.filter(q => q.status === 'waiting');
  const inConsultation = queue.filter(q => q.status === 'in_consultation');

  return (
    <DashboardLayout title="Queue Manager" subtitle="Manage your patient queue in real-time">
      <div style={{ display: 'flex', gap: 24 }}>
        {/* Current Patient */}
        <div style={{ flex: 1 }}>
          {inConsultation.length > 0 && (
            <div className="glass-card" style={{ padding: 28, marginBottom: 24, border: '1px solid rgba(0,229,160,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div className="status-dot online" />
                <h3 style={{ fontSize: '1rem', color: 'var(--accent)' }}>Currently In Consultation</h3>
              </div>
              {inConsultation.map(patient => (
                <div key={patient.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div className="avatar avatar-xl">{patient.patient_name?.[0]}</div>
                    <div>
                      <h2 style={{ fontSize: '1.4rem' }}>{patient.patient_name}</h2>
                      <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                        {patient.blood_group && <span className="badge badge-danger">{patient.blood_group}</span>}
                        {patient.gender && <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>{patient.gender}</span>}
                        <span className="badge badge-primary">Queue #{patient.queue_number}</span>
                      </div>
                    </div>
                  </div>
                  {patient.reason && (
                    <div style={{ padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 10, marginBottom: 16, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Reason: </strong>{patient.reason}
                    </div>
                  )}
                  {patient.allergies && (
                    <div className="alert alert-error" style={{ marginBottom: 16, fontSize: '0.82rem' }}>
                      ⚠️ <strong>Allergies:</strong> {patient.allergies}
                    </div>
                  )}
                  {patient.chronic_conditions && (
                    <div className="alert alert-warning" style={{ marginBottom: 16, fontSize: '0.82rem' }}>
                      📋 <strong>Chronic Conditions:</strong> {patient.chronic_conditions}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-accent flex-1" onClick={() => complete(patient.id)}>
                      <FiCheck /> Complete Consultation
                    </button>
                    <button className="btn btn-ghost" onClick={() => skip(patient.id)}>
                      <FiSkipForward /> Skip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Waiting Queue */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1rem' }}>
                Waiting Patients
                <span className="badge badge-warning" style={{ marginLeft: 10 }}>{waiting.length}</span>
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={fetchQueue}>↻ Refresh</button>
            </div>

            {loading ? (
              <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
            ) : waiting.length === 0 ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <div className="empty-icon">🎉</div>
                <h3>Queue is Empty</h3>
                <p>No patients currently waiting</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {waiting.map((patient, i) => (
                  <div key={patient.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    background: i === 0 ? 'rgba(0,212,255,0.05)' : 'var(--bg-card)',
                    borderRadius: 12,
                    border: `1px solid ${i === 0 ? 'rgba(0,212,255,0.25)' : 'var(--glass-border)'}`,
                  }}>
                    <div className="queue-number">{patient.queue_number}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {patient.patient_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {patient.blood_group && `${patient.blood_group}`}
                        {patient.gender && ` • ${patient.gender}`}
                        {patient.reason && ` • ${patient.reason?.slice(0, 40)}...`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {i === 0 && !inConsultation.length && (
                        <button className="btn btn-primary btn-sm" onClick={() => callPatient(patient.id)}>
                          <FiPhoneCall size={12} /> Call
                        </button>
                      )}
                      <button className="btn btn-ghost btn-sm" onClick={() => skip(patient.id)}>Skip</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar stats */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Queue Stats</div>
            {[
              { label: 'Waiting', value: waiting.length, color: 'var(--warning)' },
              { label: 'In Consultation', value: inConsultation.length, color: 'var(--accent)' },
              { label: 'Total Today', value: queue.length, color: 'var(--primary)' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{s.label}</span>
                <span style={{ fontWeight: 700, color: s.color, fontSize: '1.1rem' }}>{s.value}</span>
              </div>
            ))}
          </div>
          <div className="alert alert-info" style={{ fontSize: '0.78rem' }}>
            🔴 Socket connected — Updates are live
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
