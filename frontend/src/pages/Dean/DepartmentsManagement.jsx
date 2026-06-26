import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

export default function DepartmentsManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', floor_number: 1 });
  const [saving, setSaving] = useState(false);

  const fetchDepts = () => {
    setLoading(true);
    api.get('/dean/departments')
      .then(r => setDepartments(r.data))
      .catch(() => toast.error('Failed to load departments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDepts(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', floor_number: 1 });
    setShowModal(true);
  };

  const openEdit = (dept) => {
    setEditing(dept);
    setForm(dept);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Department name is required');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/dean/departments/${editing.id}`, form);
        toast.success('Department updated');
      } else {
        await api.post('/dean/departments', form);
        toast.success('Department created');
      }
      setShowModal(false);
      fetchDepts();
    } catch { toast.error('Failed to save department'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      await api.delete(`/dean/departments/${id}`);
      toast.success('Department deleted');
      fetchDepts();
    } catch (err) { toast.error(err.response?.data?.message || 'Cannot delete — may have linked data'); }
  };

  return (
    <DashboardLayout title="Departments" subtitle="Manage hospital departments">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> Add Department
        </button>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div>
      ) : (
        <div className="grid grid-3">
          {departments.map(dept => (
            <div key={dept.id} className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'var(--grad-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem',
                }}>🏥</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(dept)}><FiEdit2 size={12} /></button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(dept.id)}><FiTrash2 size={12} /></button>
                </div>
              </div>
              <h3 style={{ marginBottom: 6, fontSize: '1rem' }}>{dept.name}</h3>
              <p style={{ fontSize: '0.82rem', marginBottom: 16, color: 'var(--text-muted)' }}>
                {dept.description || 'No description'}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <span className="badge badge-primary">Floor {dept.floor_number}</span>
                <span className="badge badge-muted">{dept.doctor_count || 0} Doctors</span>
                <span className="badge badge-muted">{dept.bed_count || 0} Beds</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Department' : 'New Department'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Department Name *</label>
                <input className="form-control" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={3} value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Floor Number</label>
                <input type="number" min={0} className="form-control" value={form.floor_number} onChange={e => setForm(p => ({ ...p, floor_number: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
