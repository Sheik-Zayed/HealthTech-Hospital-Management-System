import React from 'react';
import Sidebar from './Sidebar';
import { FiBell } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout({ children, title, subtitle }) {
  const { user } = useAuth();

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main" style={{ marginLeft: 'var(--sidebar-width)' }}>
        {/* Top Bar */}
        <header style={{
          padding: '16px 32px',
          borderBottom: '1px solid var(--glass-border)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <div>
            {title && <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{title}</h1>}
            {subtitle && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>{subtitle}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--glass-border)',
              borderRadius: '10px',
              padding: '8px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
            }}>
              <FiBell size={18} />
            </button>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Welcome, <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
