import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';

export default function QueueStatus() {
  const { user } = useAuth();
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const fetchQueue = async () => {
    try {
      const res = await api.get('/patients/queue-status');
      setQueue(res.data);
    } catch { setQueue(null); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchQueue();
    // Connect socket
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    if (user?.profileId) {
      socketRef.current.emit('join:patient', user.profileId);
    }
    socketRef.current.on('queue:called', () => {
      fetchQueue();
    });
    socketRef.current.on('queue:update', () => {
      fetchQueue();
    });
    return () => { socketRef.current?.disconnect(); };
  }, [user]);

  const progress = queue ? Math.max(0, Math.min(100, 100 - (queue.people_before / Math.max(1, queue.people_before + 1)) * 100)) : 0;

  return (
    <DashboardLayout title="Queue Status" subtitle="Real-time position tracking">
      {loading ? (
        <div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div>
      ) : !queue ? (
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <h3>You're not in any queue</h3>
          <p>Book an appointment to join a doctor's queue</p>
        </div>
      ) : (
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Queue Card */}
          <div className="glass-card" style={{ padding: 40, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* Animated ring */}
            <div style={{
              width: 140, height: 140, borderRadius: '50%',
              background: queue.status === 'in_consultation'
                ? 'linear-gradient(135deg, #00E5A0, #00D4FF)'
                : 'var(--grad-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: queue.status === 'in_consultation'
                ? '0 0 40px rgba(0,229,160,0.4)'
                : '0 0 40px var(--primary-glow)',
              animation: 'pulse 2s ease-in-out infinite',
            }}>
              <div style={{ textAlign: 'center', color: 'white' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>{queue.queue_number}</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: 2 }}>QUEUE #</div>
              </div>
            </div>

            {queue.status === 'in_consultation' ? (
              <div>
                <div className="badge badge-success" style={{ marginBottom: 12, fontSize: '0.9rem', padding: '6px 16px' }}>
                  🎉 It's Your Turn!
                </div>
                <h2 style={{ marginBottom: 8 }}>Please proceed to the doctor</h2>
                <p>The doctor is ready to see you now. Head to the consultation room.</p>
              </div>
            ) : (
              <div>
                <h3 style={{ marginBottom: 4 }}>You're in queue</h3>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', margin: '8px 0' }}>
                  {queue.people_before} {queue.people_before === 1 ? 'person' : 'people'} ahead
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Estimated wait: ~{(queue.people_before + 1) * 15} minutes
                </p>
              </div>
            )}

            {/* Progress Bar */}
            <div style={{ marginTop: 24 }}>
              <div style={{
                height: 8, background: 'var(--bg-primary)', borderRadius: 4, overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%', width: `${progress}%`,
                  background: 'var(--grad-primary)',
                  borderRadius: 4,
                  transition: 'width 1s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Queue Start</span>
                <span>Your Turn</span>
              </div>
            </div>
          </div>

          {/* Doctor Info */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 16, fontSize: '0.95rem' }}>Doctor Information</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="avatar avatar-lg">{queue.doctor_name?.[0]}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Dr. {queue.doctor_name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{queue.department_name}</div>
              </div>
            </div>
          </div>

          <div className="alert alert-info" style={{ fontSize: '0.85rem' }}>
            🔔 You'll be notified automatically when it's your turn. Stay nearby.
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
