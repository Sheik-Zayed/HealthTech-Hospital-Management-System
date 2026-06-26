import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiHeart, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Auth.css';

const ROLES = [
  { id: 'patient', label: 'Patient', icon: '🏃', desc: 'Book appointments & track health' },
  { id: 'doctor', label: 'Doctor', icon: '👨‍⚕️', desc: 'Manage queue & consultations' },
  { id: 'dean', label: 'Hospital Dean', icon: '🏛️', desc: 'Full hospital management' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('patient');
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      return setError('Please enter your email and password');
    }
    setLoading(true);
    setError('');
    try {
      const data = await login(form.email, form.password);
      if (data.user.role !== selectedRole) {
        setError(`This account is registered as a ${data.user.role}, not ${selectedRole}.`);
        setLoading(false);
        return;
      }
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      const redirects = { patient: '/patient/dashboard', doctor: '/doctor/dashboard', dean: '/dean/dashboard' };
      navigate(redirects[data.user.role]);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <Link to="/" className="auth-brand">
        <div className="nav-logo"><FiHeart /></div>
        <span>HealthTech</span>
      </Link>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your HealthTech account</p>
          </div>

          {/* Role Selector */}
          <div className="role-selector">
            {ROLES.map(r => (
              <button
                key={r.id}
                type="button"
                className={`role-btn ${selectedRole === r.id ? 'active' : ''}`}
                onClick={() => setSelectedRole(r.id)}
              >
                <span className="role-btn-icon">{r.icon}</span>
                <span className="role-btn-label">{r.label}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="form-control input-with-icon"
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="form-label">Password</label>
              </div>
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="form-control input-with-icon input-with-action"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button type="button" className="input-eye" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <>Sign In <FiArrowRight /></>}
            </button>
          </form>

          <p className="auth-footer-text">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">Create one here</Link>
          </p>
        </div>

        {/* Role Info Panel */}
        <div className="auth-info-panel">
          {ROLES.filter(r => r.id === selectedRole).map(r => (
            <div key={r.id} className="info-panel-content">
              <div className="info-panel-icon">{r.icon}</div>
              <h3>{r.label} Portal</h3>
              <p>{r.desc}</p>
              <div className="info-features">
                {selectedRole === 'patient' && [
                  'Book appointments instantly',
                  'Track your queue in real-time',
                  'View medical records & prescriptions',
                  'Access lab reports and billing',
                ].map(f => <div key={f} className="info-feature"><span>✓</span> {f}</div>)}
                {selectedRole === 'doctor' && [
                  'Manage patient queue efficiently',
                  'Write consultation notes & prescriptions',
                  'Order lab tests for patients',
                  'View patient medical history',
                ].map(f => <div key={f} className="info-feature"><span>✓</span> {f}</div>)}
                {selectedRole === 'dean' && [
                  'Full hospital KPI dashboard',
                  'Manage doctors & departments',
                  'Monitor bed occupancy in real-time',
                  'Revenue analytics & billing oversight',
                ].map(f => <div key={f} className="info-feature"><span>✓</span> {f}</div>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
