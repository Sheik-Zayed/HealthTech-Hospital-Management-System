import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../context/AuthContext';
import { FiPlus, FiX, FiCalendar, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  pending: <span className="badge badge-warning">Pending</span>,
  confirmed: <span className="badge badge-primary">Confirmed</span>,
  in_progress: <span className="badge badge-secondary">In Progress</span>,
  completed: <span className="badge badge-success">Completed</span>,
  cancelled: <span className="badge badge-muted">Cancelled</span>,
};

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [form, setForm] = useState({
    doctor_id: '', appointment_date: '', appointment_time: '', reason: '', department_id: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aptRes, deptRes] = await Promise.all([
        api.get('/patients/appointments'),
        api.get('/appointments/departments'),
      ]);
      setAppointments(aptRes.data);
      setDepartments(deptRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDeptChange = async (e) => {
    const deptId = e.target.value;
    setForm(prev => ({ ...prev, department_id: deptId, doctor_id: '', appointment_time: '' }));
    if (deptId) {
      const res = await api.get(`/doctors/list?department_id=${deptId}`);
      setDoctors(res.data);
    }
  };

  const handleDoctorChange = async (e) => {
    const docId = e.target.value;
    setForm(prev => ({ ...prev, doctor_id: docId, appointment_time: '' }));
    setSlots([]);
    if (docId && form.appointment_date) {
      const res = await api.get(`/appointments/slots?doctor_id=${docId}&date=${form.appointment_date}`);
      setSlots(res.data);
    }
  };

  const handleDateChange = async (e) => {
    const date = e.target.value;
    setForm(prev => ({ ...prev, appointment_date: date, appointment_time: '' }));
    if (form.doctor_id && date) {
      const res = await api.get(`/appointments/slots?doctor_id=${form.doctor_id}&date=${date}`);
      setSlots(res.data);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!form.doctor_id || !form.appointment_date || !form.appointment_time) {
      return toast.error('Please fill all required fields');
    }
    setBooking(true);
    try {
      const res = await api.post('/appointments', form);
      toast.success(`Appointment booked! Queue #${res.data.queueNumber}`);
      setShowModal(false);
      setForm({ doctor_id: '', appointment_date: '', appointment_time: '', reason: '', department_id: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally { setBooking(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await api.put(`/appointments/${id}/cancel`);
      toast.success('Appointment cancelled');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to cancel'); }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <DashboardLayout title="My Appointments" subtitle="Book and manage your appointments">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div />
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FiPlus /> Book Appointment
        </button>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div>
      ) : appointments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No Appointments Yet</h3>
          <p>Book your first appointment to get started</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
            <FiPlus /> Book Appointment
          </button>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <table className="ht-table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Department</th>
                <th>Date & Time</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(apt => (
                <tr key={apt.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm">{apt.doctor_name?.[0]}</div>
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>Dr. {apt.doctor_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{apt.specialization}</div>
                      </div>
                    </div>
                  </td>
                  <td>{apt.department_name}</td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {new Date(apt.appointment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{apt.appointment_time?.slice(0,5)}</div>
                  </td>
                  <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {apt.reason || '—'}
                  </td>
                  <td>{STATUS_BADGE[apt.status]}</td>
                  <td>
                    {['pending', 'confirmed'].includes(apt.status) && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancel(apt.id)}>
                        <FiX size={12} /> Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Book Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Book Appointment</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Department *</label>
                <select className="form-control form-select" value={form.department_id} onChange={handleDeptChange}>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Doctor *</label>
                <select className="form-control form-select" value={form.doctor_id} onChange={handleDoctorChange} disabled={!form.department_id}>
                  <option value="">Select Doctor</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>Dr. {d.name} — ₹{d.consultation_fee}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Appointment Date *</label>
                <input type="date" min={today} className="form-control" value={form.appointment_date} onChange={handleDateChange} />
              </div>
              {slots.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Select Time Slot *</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {slots.map(s => (
                      <button
                        key={s.time} type="button"
                        disabled={!s.available}
                        onClick={() => setForm(prev => ({ ...prev, appointment_time: s.time }))}
                        style={{
                          padding: '6px 14px', borderRadius: 8, border: '1px solid',
                          borderColor: form.appointment_time === s.time ? 'var(--primary)' : s.available ? 'var(--glass-border)' : 'rgba(255,77,109,0.2)',
                          background: form.appointment_time === s.time ? 'var(--primary-glow)' : !s.available ? 'rgba(255,77,109,0.05)' : 'var(--bg-card)',
                          color: !s.available ? 'var(--danger)' : 'var(--text-secondary)',
                          cursor: s.available ? 'pointer' : 'not-allowed',
                          fontSize: '0.8rem', fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Reason for Visit</label>
                <textarea className="form-control" rows={3} value={form.reason}
                  onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Describe your symptoms or reason..." style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={booking}>
                  {booking ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
