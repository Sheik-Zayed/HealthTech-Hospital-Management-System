import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../context/AuthContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PatientProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    api.get('/patients/profile')
      .then(r => { setProfile(r.data); setForm(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/patients/profile', form);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  if (loading) return <DashboardLayout title="My Profile"><div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div></DashboardLayout>;

  return (
    <DashboardLayout title="My Profile" subtitle="Manage your personal information">
      <div style={{ maxWidth: 720 }}>
        {/* Avatar section */}
        <div className="glass-card" style={{ padding: 28, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="avatar avatar-xl">{user?.name?.[0]}</div>
          <div>
            <h2 style={{ fontSize: '1.4rem' }}>{user?.name}</h2>
            <div className="badge badge-success" style={{ marginTop: 6 }}>Patient</div>
            <p style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Member since {new Date(profile?.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="glass-card" style={{ padding: 28 }}>
            <h3 style={{ marginBottom: 20, fontSize: '1rem' }}>Personal Information</h3>
            <div className="grid grid-2" style={{ gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input name="name" value={form.name || ''} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input value={user?.email || ''} className="form-control" disabled style={{ opacity: 0.5 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input name="phone" value={form.phone || ''} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input name="date_of_birth" type="date" value={form.date_of_birth?.slice(0,10) || ''} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select name="gender" value={form.gender || ''} onChange={handleChange} className="form-control form-select">
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select name="blood_group" value={form.blood_group || ''} onChange={handleChange} className="form-control form-select">
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Address</label>
                <textarea name="address" rows={2} value={form.address || ''} onChange={handleChange} className="form-control" style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Allergies</label>
                <input name="allergies" value={form.allergies || ''} onChange={handleChange} className="form-control" placeholder="e.g. Penicillin, Dust" />
              </div>
              <div className="form-group">
                <label className="form-label">Chronic Conditions</label>
                <input name="chronic_conditions" value={form.chronic_conditions || ''} onChange={handleChange} className="form-control" placeholder="e.g. Diabetes, Hypertension" />
              </div>
              <div className="form-group">
                <label className="form-label">Emergency Contact Name</label>
                <input name="emergency_contact_name" value={form.emergency_contact_name || ''} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-group">
                <label className="form-label">Emergency Contact Phone</label>
                <input name="emergency_contact_phone" value={form.emergency_contact_phone || ''} onChange={handleChange} className="form-control" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 24 }} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
