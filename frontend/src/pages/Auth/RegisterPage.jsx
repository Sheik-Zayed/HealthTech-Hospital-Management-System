import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../context/AuthContext';
import { FiHeart, FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Auth.css';

const ROLES = [
  { id: 'patient', label: 'Patient', icon: '🏃' },
  { id: 'doctor', label: 'Doctor', icon: '👨‍⚕️' },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('patient');
  const [departments, setDepartments] = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    // Patient fields
    date_of_birth: '', blood_group: '', gender: '', address: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    // Doctor fields
    department_id: '', specialization: '', license_number: '',
    experience_years: '', consultation_fee: '',
  });

  useEffect(() => {
    api.get('/appointments/departments').then(r => setDepartments(r.data)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      return setError('Name, email, and password are required');
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    setLoading(true);
    setError('');
    try {
      const payload = { ...form, role: selectedRole };
      const data = await register(payload);
      toast.success('Account created successfully!');
      const redirects = { patient: '/patient/dashboard', doctor: '/doctor/dashboard' };
      navigate(redirects[data.user.role]);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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

      <div className="auth-container" style={{ maxWidth: 860 }}>
        <div className="auth-card" style={{ gap: 18 }}>
          <div className="auth-header">
            <h2>Create Account</h2>
            <p>Join HealthTech — free for patients and doctors</p>
          </div>

          {/* Role selector (no dean - dean is created by another dean) */}
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

          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="register-grid">
              <div className="section-title">Account Information</div>

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div className="input-wrapper">
                  <FiUser className="input-icon" />
                  <input name="name" value={form.name} onChange={handleChange}
                    className="form-control input-with-icon" placeholder="Dr. John Doe" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    className="form-control input-with-icon" placeholder="you@example.com" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password *</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange}
                    className="form-control input-with-icon input-with-action" placeholder="Min. 6 characters" />
                  <button type="button" className="input-eye" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div className="input-wrapper">
                  <FiPhone className="input-icon" />
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                    className="form-control input-with-icon" placeholder="+91 98765 43210" />
                </div>
              </div>

              {/* Patient Fields */}
              {selectedRole === 'patient' && (
                <>
                  <div className="section-title">Personal Information</div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange}
                      className="form-control" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select name="gender" value={form.gender} onChange={handleChange} className="form-control form-select">
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <select name="blood_group" value={form.blood_group} onChange={handleChange} className="form-control form-select">
                      <option value="">Select Blood Group</option>
                      {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Emergency Contact Name</label>
                    <input name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange}
                      className="form-control" placeholder="Contact person name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Emergency Contact Phone</label>
                    <input name="emergency_contact_phone" type="tel" value={form.emergency_contact_phone} onChange={handleChange}
                      className="form-control" placeholder="+91 XXXXXXXXXX" />
                  </div>
                </>
              )}

              {/* Doctor Fields */}
              {selectedRole === 'doctor' && (
                <>
                  <div className="section-title">Professional Information</div>
                  <div className="form-group">
                    <label className="form-label">Specialization *</label>
                    <input name="specialization" value={form.specialization} onChange={handleChange}
                      className="form-control" placeholder="e.g. Cardiologist" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select name="department_id" value={form.department_id} onChange={handleChange} className="form-control form-select">
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">License Number</label>
                    <input name="license_number" value={form.license_number} onChange={handleChange}
                      className="form-control" placeholder="MCI-XXXXXXXX" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Experience (Years)</label>
                    <input name="experience_years" type="number" min="0" value={form.experience_years} onChange={handleChange}
                      className="form-control" placeholder="5" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Consultation Fee (₹)</label>
                    <input name="consultation_fee" type="number" min="0" value={form.consultation_fee} onChange={handleChange}
                      className="form-control" placeholder="500" />
                  </div>
                </>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ marginTop: 20 }}>
              {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <>Create Account <FiArrowRight /></>}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account? <Link to="/login" className="auth-link">Sign in here</Link>
          </p>
          <p className="auth-footer-text" style={{ fontSize: '0.75rem' }}>
            🔒 Hospital Dean accounts are created by existing deans via the admin portal
          </p>
        </div>

        <div className="auth-info-panel">
          <div className="info-panel-content">
            <div className="info-panel-icon">{selectedRole === 'patient' ? '🏃' : '👨‍⚕️'}</div>
            <h3>{selectedRole === 'patient' ? 'Patient Portal' : 'Doctor Portal'}</h3>
            <p>Join thousands of {selectedRole === 'patient' ? 'patients' : 'healthcare professionals'} on HealthTech</p>
            <div className="info-features">
              {selectedRole === 'patient' ? [
                'Free to register',
                'Book appointments in 60 seconds',
                'Real-time queue notifications',
                'Complete health records access',
                'Transparent billing',
              ].map(f => <div key={f} className="info-feature"><span>✓</span> {f}</div>)
              : [
                'Streamlined patient management',
                'Smart queue dashboard',
                'Digital prescription writing',
                'Lab test ordering',
                'Patient history at a glance',
              ].map(f => <div key={f} className="info-feature"><span>✓</span> {f}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
