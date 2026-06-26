const pool = require('../config/db');

// POST /api/appointments - Book appointment (patient)
const createAppointment = async (req, res) => {
  try {
    const { doctor_id, appointment_date, appointment_time, reason } = req.body;

    const [patient] = await pool.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
    if (!patient.length) return res.status(404).json({ message: 'Patient profile not found' });
    const patientId = patient[0].id;

    // Check doctor exists and is available
    const [doc] = await pool.query(
      'SELECT id, department_id, consultation_fee FROM doctors WHERE id = ? AND is_available = TRUE',
      [doctor_id]
    );
    if (!doc.length) return res.status(404).json({ message: 'Doctor not available' });

    // Check for duplicate appointment
    const [existing] = await pool.query(
      `SELECT id FROM appointments WHERE patient_id=? AND doctor_id=? AND appointment_date=? AND appointment_time=? AND status != 'cancelled'`,
      [patientId, doctor_id, appointment_date, appointment_time]
    );
    if (existing.length) return res.status(400).json({ message: 'You already have an appointment at this time' });

    // Create appointment
    const [result] = await pool.query(
      `INSERT INTO appointments (patient_id, doctor_id, department_id, appointment_date, appointment_time, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, 'confirmed')`,
      [patientId, doctor_id, doc[0].department_id, appointment_date, appointment_time, reason || null]
    );
    const appointmentId = result.insertId;

    // Get next queue number for this doctor today
    const [[{ max_queue }]] = await pool.query(
      `SELECT COALESCE(MAX(queue_number), 0) as max_queue
       FROM queue_entries WHERE doctor_id = ? AND DATE(created_at) = ?`,
      [doctor_id, appointment_date]
    );
    const queueNumber = max_queue + 1;

    // Add to queue
    await pool.query(
      `INSERT INTO queue_entries (appointment_id, patient_id, doctor_id, queue_number, estimated_wait_minutes)
       VALUES (?, ?, ?, ?, ?)`,
      [appointmentId, patientId, doctor_id, queueNumber, queueNumber * 15]
    );

    // Create billing entry
    await pool.query(
      `INSERT INTO billing (patient_id, appointment_id, consultation_fee, total_amount, invoice_date)
       VALUES (?, ?, ?, ?, ?)`,
      [patientId, appointmentId, doc[0].consultation_fee, doc[0].consultation_fee, appointment_date]
    );

    // Notify patient
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)`,
      [req.user.id, 'Appointment Confirmed', `Your appointment is confirmed. Queue number: ${queueNumber}`, 'appointment']
    );

    // Broadcast queue update
    const io = req.app.get('io');
    if (io) {
      io.to(`queue:${doctor_id}`).emit('queue:update', { action: 'new_patient', queueNumber });
    }

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointmentId,
      queueNumber,
    });
  } catch (error) {
    console.error('createAppointment error:', error);
    res.status(500).json({ message: 'Failed to book appointment', error: error.message });
  }
};

// GET /api/appointments (role-based)
const getAppointments = async (req, res) => {
  try {
    const { status, date } = req.query;
    let query = '';
    const params = [];

    if (req.user.role === 'patient') {
      const [p] = await pool.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
      if (!p.length) return res.status(404).json({ message: 'Patient not found' });
      query = `SELECT a.*, u.name as doctor_name, d.specialization, dep.name as department_name
               FROM appointments a
               JOIN doctors d ON a.doctor_id = d.id
               JOIN users u ON d.user_id = u.id
               LEFT JOIN departments dep ON d.department_id = dep.id
               WHERE a.patient_id = ?`;
      params.push(p[0].id);
    } else if (req.user.role === 'doctor') {
      const [d] = await pool.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
      if (!d.length) return res.status(404).json({ message: 'Doctor not found' });
      query = `SELECT a.*, u.name as patient_name, p.blood_group, p.gender
               FROM appointments a
               JOIN patients p ON a.patient_id = p.id
               JOIN users u ON p.user_id = u.id
               WHERE a.doctor_id = ?`;
      params.push(d[0].id);
    }

    if (status) { query += ' AND a.status = ?'; params.push(status); }
    if (date) { query += ' AND a.appointment_date = ?'; params.push(date); }
    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

    const [appointments] = await pool.query(query, params);
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get appointments', error: error.message });
  }
};

// PUT /api/appointments/:id/cancel
const cancelAppointment = async (req, res) => {
  try {
    const [p] = await pool.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
    if (!p.length) return res.status(404).json({ message: 'Patient not found' });

    const [apt] = await pool.query(
      'SELECT * FROM appointments WHERE id = ? AND patient_id = ?',
      [req.params.id, p[0].id]
    );
    if (!apt.length) return res.status(404).json({ message: 'Appointment not found' });
    if (['completed', 'cancelled'].includes(apt[0].status)) {
      return res.status(400).json({ message: 'Cannot cancel this appointment' });
    }

    await pool.query('UPDATE appointments SET status = "cancelled" WHERE id = ?', [req.params.id]);
    await pool.query(
      'UPDATE queue_entries SET status = "skipped" WHERE appointment_id = ?', [req.params.id]
    );

    res.json({ message: 'Appointment cancelled' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel appointment', error: error.message });
  }
};

// GET /api/appointments/slots - Available time slots for a doctor on a date
const getAvailableSlots = async (req, res) => {
  try {
    const { doctor_id, date } = req.query;
    if (!doctor_id || !date) return res.status(400).json({ message: 'doctor_id and date are required' });

    const [doc] = await pool.query(
      'SELECT available_from, available_to FROM doctors WHERE id = ?', [doctor_id]
    );
    if (!doc.length) return res.status(404).json({ message: 'Doctor not found' });

    const [bookedSlots] = await pool.query(
      `SELECT appointment_time FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND status != 'cancelled'`,
      [doctor_id, date]
    );

    const bookedTimes = bookedSlots.map(s => s.appointment_time.slice(0, 5));
    const from = doc[0].available_from?.slice(0, 5) || '09:00';
    const to = doc[0].available_to?.slice(0, 5) || '17:00';

    // Generate slots every 30 minutes
    const slots = [];
    let [h, m] = from.split(':').map(Number);
    const [endH, endM] = to.split(':').map(Number);
    while (h * 60 + m < endH * 60 + endM) {
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      slots.push({ time, available: !bookedTimes.includes(time) });
      m += 30;
      if (m >= 60) { h++; m -= 60; }
    }

    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get slots', error: error.message });
  }
};

// GET /api/departments
const getDepartments = async (req, res) => {
  try {
    const [departments] = await pool.query('SELECT * FROM departments ORDER BY name ASC');
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get departments' });
  }
};

module.exports = { createAppointment, getAppointments, cancelAppointment, getAvailableSlots, getDepartments };
