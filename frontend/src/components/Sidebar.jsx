import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome, FiCalendar, FiClock, FiFileText, FiActivity,
  FiDollarSign, FiUser, FiUsers, FiGrid, FiBarChart2,
  FiVolume2, FiLogOut, FiMenu, FiX, FiHeart, FiSettings
} from 'react-icons/fi';
import { MdMedicalServices, MdBedroomParent } from 'react-icons/md';

const PATIENT_NAV = [
  { path: '/patient/dashboard', icon: <FiHome />, label: 'Dashboard' },
  { path: '/patient/appointments', icon: <FiCalendar />, label: 'Appointments' },
  { path: '/patient/queue', icon: <FiClock />, label: 'Queue Status' },
  { path: '/patient/records', icon: <FiFileText />, label: 'Medical Records' },
  { path: '/patient/lab-reports', icon: <FiActivity />, label: 'Lab Reports' },
  { path: '/patient/billing', icon: <FiDollarSign />, label: 'Billing' },
  { path: '/patient/profile', icon: <FiUser />, label: 'My Profile' },
];

const DOCTOR_NAV = [
  { path: '/doctor/dashboard', icon: <FiHome />, label: 'Dashboard' },
  { path: '/doctor/queue', icon: <FiVolume2 />, label: 'Queue Manager' },
  { path: '/doctor/patients', icon: <FiUsers />, label: 'My Patients' },
  { path: '/doctor/consultation/new', icon: <MdMedicalServices />, label: 'New Consultation' },
];

const DEAN_NAV = [
  { path: '/dean/dashboard', icon: <FiHome />, label: 'Overview' },
  { path: '/dean/doctors', icon: <FiUsers />, label: 'Doctors' },
  { path: '/dean/departments', icon: <FiGrid />, label: 'Departments' },
  { path: '/dean/beds', icon: <MdBedroomParent />, label: 'Bed Management' },
  { path: '/dean/analytics', icon: <FiBarChart2 />, label: 'Analytics' },
  { path: '/dean/billing', icon: <FiDollarSign />, label: 'Billing' },
];

const ROLE_NAV = { patient: PATIENT_NAV, doctor: DOCTOR_NAV, dean: DEAN_NAV };

const ROLE_META = {
  patient: { label: 'Patient Portal', color: 'var(--accent)' },
  doctor: { label: 'Doctor Portal', color: 'var(--primary)' },
  dean: { label: 'Hospital Dean', color: 'var(--secondary)' },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const navItems = ROLE_NAV[user.role] || [];
  const meta = ROLE_META[user.role] || {};

  const initials = user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Sidebar */}
      <aside style={{
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        width: collapsed ? '72px' : 'var(--sidebar-width)',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        zIndex: 100,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: collapsed ? '20px 12px' : '20px 20px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 12,
          minHeight: 72,
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36,
                background: 'var(--grad-primary)',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <FiHeart style={{ color: 'white', fontSize: 18 }} />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>HealthTech</div>
                <div style={{ fontSize: '0.65rem', color: meta.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {meta.label}
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--glass-border)',
              borderRadius: 8,
              padding: 6,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            {collapsed ? <FiMenu size={16} /> : <FiX size={16} />}
          </button>
        </div>

        {/* User Card */}
        {!collapsed && (
          <div style={{
            margin: '12px 16px',
            padding: '12px',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div className="avatar avatar-md" style={{ fontSize: '0.82rem' }}>{initials}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: meta.color, fontWeight: 600, textTransform: 'capitalize' }}>
                {user.role === 'dean' ? 'Hospital Dean' : user.role}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, padding: collapsed ? '8px 8px' : '8px 12px', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '12px' : '10px 12px',
                borderRadius: 'var(--radius-md)',
                marginBottom: 4,
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'white' : 'var(--text-secondary)',
                background: isActive ? 'var(--grad-primary)' : 'transparent',
                boxShadow: isActive ? '0 4px 12px var(--primary-glow)' : 'none',
                transition: 'all 0.2s ease',
                justifyContent: collapsed ? 'center' : 'flex-start',
                textDecoration: 'none',
              })}
              title={collapsed ? item.label : undefined}
            >
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: collapsed ? '12px 8px' : '12px', borderTop: '1px solid var(--glass-border)' }}>
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-block"
            style={{ justifyContent: collapsed ? 'center' : 'flex-start', gap: 12, padding: '10px 12px' }}
            title={collapsed ? 'Logout' : undefined}
          >
            <FiLogOut size={16} />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>
    </>
  );
}
