import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';

export default function DoctorsManagement() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    department_id: '', specialization: '', license_number: '',
    experience_years: '', consultation_fee: '', is_available: true, is_active: true,
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get('/dean/doctors'), api.get('/dean/departments')])
      .then(([d, dep]) => { setDoctors(d.data); setDepartments(dep.data); })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', phone: '', department_id: '', specialization: '', license_number: '', experience_years: '', consultation_fee: '', is_available: true, is_active: true });
    setShowModal(true);
  };

  const openEdit = (doc) => {
    setEditing(doc);
    setForm({ ...doc, password: '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/dean/doctors/${editing.id}`, form);
        toast.success('Doctor updated');
      } else {
        await api.post('/dean/doctors', form);
        toast.success('Doctor created! Default password: Doctor@123');
      }
      setShowModal(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this doctor?')) return;
    try {
      await api.delete(`/dean/doctors/${id}`);
      toast.success('Doctor deactivated');
      fetchData();
    } catch { toast.error('Failed to deactivate'); }
  };

  return (
    <DashboardLayout title="Doctors Management" subtitle="Manage your medical staff">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> Add New Doctor
        </button>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <table className="ht-table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Department</th>
                <th>Specialization</th>
                <th>Experience</th>
                <th>Fee (₹)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map(d => (
                <tr key={d.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm">{d.name?.[0]}</div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>Dr. {d.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{d.department_name || '—'}</td>
                  <td>{d.specialization || '—'}</td>
                  <td>{d.experience_years} yrs</td>
                  <td>₹{parseFloat(d.consultation_fee || 0).toLocaleString('en-IN')}</td>
                  <td>
                    {d.is_active
                      ? <span className="badge badge-success">Active</span>
                      : <span className="badge badge-muted">Inactive</span>}
                    &nbsp;
                    {d.is_available
                      ? <span className="badge badge-primary">Available</span>
                      : <span className="badge badge-warning">Unavailable</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(d)}>
                        <FiEdit2 size={12} />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id)}>
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Doctor' : 'Add New Doctor'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="grid grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-control" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" className="form-control" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required disabled={!!editing} />
                </div>
                {!editing && (
                  <div className="form-group">
                    <label className="form-label">Password (default: Doctor@123)</label>
                    <input className="form-control" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Leave blank for default" />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-control form-select" value={form.department_id || ''} onChange={e => setForm(p => ({ ...p, department_id: e.target.value }))}>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Specialization</label>
                  <input className="form-control" value={form.specialization || ''} onChange={e => setForm(p => ({ ...p, specialization: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">License No.</label>
                  <input className="form-control" value={form.license_number || ''} onChange={e => setForm(p => ({ ...p, license_number: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Experience (Years)</label>
                  <input type="number" className="form-control" value={form.experience_years || ''} onChange={e => setForm(p => ({ ...p, experience_years: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Consultation Fee (₹)</label>
                  <input type="number" className="form-control" value={form.consultation_fee || ''} onChange={e => setForm(p => ({ ...p, consultation_fee: e.target.value }))} />
                </div>
                {editing && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Available</label>
                      <select className="form-control form-select" value={form.is_available ? '1' : '0'} onChange={e => setForm(p => ({ ...p, is_available: e.target.value === '1' }))}>
                        <option value="1">Yes</option>
                        <option value="0">No</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Account Active</label>
                      <select className="form-control form-select" value={form.is_active ? '1' : '0'} onChange={e => setForm(p => ({ ...p, is_active: e.target.value === '1' }))}>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '...' : editing ? 'Update Doctor' : 'Create Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
