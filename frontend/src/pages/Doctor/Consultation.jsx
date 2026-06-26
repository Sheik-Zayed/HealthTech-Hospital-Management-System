import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { api } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

export default function Consultation() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(patientId !== 'new' ? patientId : '');
  const [appointments, setAppointments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    patient_id: '', appointment_id: '',
    diagnosis: '', symptoms: '', treatment_plan: '', notes: '', follow_up_date: ''
  });
  const [prescriptions, setPrescriptions] = useState([{ medication_name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);

  useEffect(() => {
    api.get('/doctors/patients').then(r => setPatients(r.data)).catch(() => {});
    if (patientId !== 'new') {
      setForm(prev => ({ ...prev, patient_id: patientId }));
      api.get(`/appointments?status=in_progress`).then(r => setAppointments(r.data)).catch(() => {});
    }
  }, [patientId]);

  const handlePatientChange = (e) => {
    const pid = e.target.value;
    setSelectedPatient(pid);
    setForm(prev => ({ ...prev, patient_id: pid, appointment_id: '' }));
    if (pid) {
      api.get('/appointments?status=in_progress').then(r => setAppointments(r.data)).catch(() => {});
    }
  };

  const addPrescription = () => {
    setPrescriptions(prev => [...prev, { medication_name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removePrescription = (index) => {
    setPrescriptions(prev => prev.filter((_, i) => i !== index));
  };

  const updatePrescription = (index, field, value) => {
    setPrescriptions(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patient_id || !form.diagnosis) {
      return toast.error('Patient and diagnosis are required');
    }
    setSaving(true);
    try {
      const validPrescriptions = prescriptions.filter(p => p.medication_name);
      await api.post('/doctors/records', { ...form, prescriptions: validPrescriptions });
      toast.success('Consultation record saved!');
      setPrescriptions([{ medication_name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
      setForm({ patient_id: '', appointment_id: '', diagnosis: '', symptoms: '', treatment_plan: '', notes: '', follow_up_date: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <DashboardLayout title="Consultation Notes" subtitle="Write diagnosis, treatment plan, and prescriptions">
      <div style={{ maxWidth: 800 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Patient & Appointment Selection */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>Consultation Details</h3>
            <div className="grid grid-2" style={{ gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Patient *</label>
                <select className="form-control form-select" value={selectedPatient} onChange={handlePatientChange}>
                  <option value="">Select Patient</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Appointment (Optional)</label>
                <select className="form-control form-select" value={form.appointment_id}
                  onChange={e => setForm(prev => ({ ...prev, appointment_id: e.target.value }))}>
                  <option value="">Select Appointment</option>
                  {appointments.filter(a => a.patient_id === parseInt(selectedPatient)).map(a => (
                    <option key={a.id} value={a.id}>
                      {new Date(a.appointment_date).toLocaleDateString('en-IN')} - {a.appointment_time?.slice(0,5)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Clinical Notes */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>Clinical Notes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Symptoms</label>
                <textarea className="form-control" rows={2} value={form.symptoms}
                  onChange={e => setForm(prev => ({ ...prev, symptoms: e.target.value }))}
                  placeholder="Patient's presenting symptoms..." style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Diagnosis *</label>
                <textarea className="form-control" rows={2} value={form.diagnosis}
                  onChange={e => setForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                  placeholder="Clinical diagnosis..." style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Treatment Plan</label>
                <textarea className="form-control" rows={3} value={form.treatment_plan}
                  onChange={e => setForm(prev => ({ ...prev, treatment_plan: e.target.value }))}
                  placeholder="Recommended treatment course..." style={{ resize: 'vertical' }} />
              </div>
              <div className="grid grid-2" style={{ gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input className="form-control" value={form.notes}
                    onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Follow-up Date</label>
                  <input type="date" className="form-control" value={form.follow_up_date}
                    onChange={e => setForm(prev => ({ ...prev, follow_up_date: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          {/* Prescriptions */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1rem' }}>💊 Prescriptions</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addPrescription}>
                <FiPlus size={14} /> Add Medicine
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {prescriptions.map((p, i) => (
                <div key={i} style={{
                  padding: 16, background: 'var(--bg-card)',
                  borderRadius: 10, border: '1px solid var(--glass-border)',
                  position: 'relative'
                }}>
                  {prescriptions.length > 1 && (
                    <button type="button" onClick={() => removePrescription(i)}
                      style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '1rem' }}>
                      <FiTrash2 />
                    </button>
                  )}
                  <div className="grid grid-2" style={{ gap: 10 }}>
                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Medicine Name</label>
                      <input className="form-control" value={p.medication_name} placeholder="e.g. Paracetamol 500mg"
                        onChange={e => updatePrescription(i, 'medication_name', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Dosage</label>
                      <input className="form-control" value={p.dosage} placeholder="e.g. 1 tablet"
                        onChange={e => updatePrescription(i, 'dosage', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Frequency</label>
                      <input className="form-control" value={p.frequency} placeholder="e.g. Twice daily"
                        onChange={e => updatePrescription(i, 'frequency', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Duration</label>
                      <input className="form-control" value={p.duration} placeholder="e.g. 5 days"
                        onChange={e => updatePrescription(i, 'duration', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Instructions</label>
                      <input className="form-control" value={p.instructions} placeholder="e.g. After meals"
                        onChange={e => updatePrescription(i, 'instructions', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '...' : '💾 Save Consultation Record'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
