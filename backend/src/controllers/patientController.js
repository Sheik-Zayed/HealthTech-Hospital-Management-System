const pool = require('../config/db');

// GET /api/patients/profile
const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id as user_id, u.name, u.email, u.phone, u.avatar_url, u.created_at,
              p.id, p.date_of_birth, p.blood_group, p.gender, p.address,
              p.emergency_contact_name, p.emergency_contact_phone,
              p.allergies, p.chronic_conditions, p.insurance_number
       FROM users u
       JOIN patients p ON u.id = p.user_id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Patient profile not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
};

// PUT /api/patients/profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, date_of_birth, blood_group, gender, address,
            emergency_contact_name, emergency_contact_phone, allergies, chronic_conditions } = req.body;

    await pool.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone, req.user.id]);

    await pool.query(
      `UPDATE patients SET date_of_birth=?, blood_group=?, gender=?, address=?,
       emergency_contact_name=?, emergency_contact_phone=?, allergies=?, chronic_conditions=?
       WHERE user_id=?`,
      [date_of_birth, blood_group, gender, address, emergency_contact_name,
       emergency_contact_phone, allergies, chronic_conditions, req.user.id]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// GET /api/patients/dashboard-stats
const getDashboardStats = async (req, res) => {
  try {
    const [patient] = await pool.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
    if (!patient.length) return res.status(404).json({ message: 'Patient not found' });
    const patientId = patient[0].id;

    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM appointments WHERE patient_id = ?', [patientId]
    );
    const [[{ upcoming }]] = await pool.query(
      `SELECT COUNT(*) as upcoming FROM appointments WHERE patient_id = ? 
       AND appointment_date >= CURDATE() AND status IN ('confirmed','pending')`, [patientId]
    );
    const [[{ records }]] = await pool.query(
      'SELECT COUNT(*) as records FROM medical_records WHERE patient_id = ?', [patientId]
    );
    const [[{ pending_bills }]] = await pool.query(
      `SELECT COUNT(*) as pending_bills FROM billing WHERE patient_id = ? AND payment_status != 'paid'`, [patientId]
    );

    // Recent appointments
    const [recentAppointments] = await pool.query(
      `SELECT a.*, u.name as doctor_name, d.specialization, dep.name as department_name
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       LEFT JOIN departments dep ON d.department_id = dep.id
       WHERE a.patient_id = ?
       ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT 5`,
      [patientId]
    );

    // Queue status
    const [queueEntry] = await pool.query(
      `SELECT q.*, u.name as doctor_name FROM queue_entries q
       JOIN doctors d ON q.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE q.patient_id = ? AND q.status = 'waiting'
       ORDER BY q.created_at DESC LIMIT 1`,
      [patientId]
    );

    // Unread notifications
    const [[{ notifications }]] = await pool.query(
      'SELECT COUNT(*) as notifications FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );

    res.json({
      stats: { total_appointments: total, upcoming_appointments: upcoming, medical_records: records, pending_bills },
      notifications,
      recentAppointments,
      currentQueue: queueEntry[0] || null,
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ message: 'Failed to get dashboard stats' });
  }
};

// GET /api/patients/appointments
const getAppointments = async (req, res) => {
  try {
    const [patient] = await pool.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
    if (!patient.length) return res.status(404).json({ message: 'Patient not found' });

    const [appointments] = await pool.query(
      `SELECT a.*, u.name as doctor_name, doc.specialization, dep.name as department_name
       FROM appointments a
       JOIN doctors doc ON a.doctor_id = doc.id
       JOIN users u ON doc.user_id = u.id
       LEFT JOIN departments dep ON doc.department_id = dep.id
       WHERE a.patient_id = ?
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [patient[0].id]
    );
    res.json(appointments);
  } catch (error) {
    console.error('getAppointments error:', error);
    res.status(500).json({ message: 'Failed to get appointments' });
  }
};

// GET /api/patients/queue-status
const getQueueStatus = async (req, res) => {
  try {
    const [patient] = await pool.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
    if (!patient.length) return res.status(404).json({ message: 'Patient not found' });
    const patientId = patient[0].id;

    const [queue] = await pool.query(
      `SELECT q.*, u.name as doctor_name, doc.specialization, dep.name as department_name,
       (SELECT COUNT(*) FROM queue_entries q2 WHERE q2.doctor_id = q.doctor_id 
        AND q2.status = 'waiting' AND q2.queue_number < q.queue_number) as people_before
       FROM queue_entries q
       JOIN doctors doc ON q.doctor_id = doc.id
       JOIN users u ON doc.user_id = u.id
       LEFT JOIN departments dep ON doc.department_id = dep.id
       WHERE q.patient_id = ? AND q.status IN ('waiting','in_consultation')
       ORDER BY q.created_at DESC LIMIT 1`,
      [patientId]
    );

    res.json(queue[0] || null);
  } catch (error) {
    console.error('getQueueStatus error:', error);
    res.status(500).json({ message: 'Failed to get queue status' });
  }
};

// GET /api/patients/medical-records
const getMedicalRecords = async (req, res) => {
  try {
    const [patient] = await pool.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
    if (!patient.length) return res.status(404).json({ message: 'Patient not found' });
    const patientId = patient[0].id;

    const [records] = await pool.query(
      `SELECT mr.*, u.name as doctor_name, doc.specialization
       FROM medical_records mr
       JOIN doctors doc ON mr.doctor_id = doc.id
       JOIN users u ON doc.user_id = u.id
       WHERE mr.patient_id = ?
       ORDER BY mr.created_at DESC`,
      [patientId]
    );

    // Get prescriptions for each record
    for (const record of records) {
      const [prescriptions] = await pool.query(
        'SELECT * FROM prescriptions WHERE record_id = ?',
        [record.id]
      );
      record.prescriptions = prescriptions;
    }

    res.json(records);
  } catch (error) {
    console.error('getMedicalRecords error:', error);
    res.status(500).json({ message: 'Failed to get medical records' });
  }
};

// GET /api/patients/lab-reports
const getLabReports = async (req, res) => {
  try {
    const [patient] = await pool.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
    if (!patient.length) return res.status(404).json({ message: 'Patient not found' });

    const [reports] = await pool.query(
      `SELECT lr.*, u.name as doctor_name
       FROM lab_reports lr
       JOIN doctors d ON lr.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE lr.patient_id = ?
       ORDER BY lr.created_at DESC`,
      [patient[0].id]
    );
    res.json(reports);
  } catch (error) {
    console.error('getLabReports error:', error);
    res.status(500).json({ message: 'Failed to get lab reports' });
  }
};

// GET /api/patients/billing
const getBilling = async (req, res) => {
  try {
    const [patient] = await pool.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
    if (!patient.length) return res.status(404).json({ message: 'Patient not found' });

    const [bills] = await pool.query(
      `SELECT b.*, a.appointment_date, a.appointment_time, u.name as doctor_name
       FROM billing b
       JOIN appointments a ON b.appointment_id = a.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE b.patient_id = ?
       ORDER BY b.created_at DESC`,
      [patient[0].id]
    );
    res.json(bills);
  } catch (error) {
    console.error('getBilling error:', error);
    res.status(500).json({ message: 'Failed to get billing info' });
  }
};

// PUT /api/patients/billing/:id/pay
const payBill = async (req, res) => {
  try {
    const { payment_method } = req.body;
    const [patient] = await pool.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
    if (!patient.length) return res.status(404).json({ message: 'Patient not found' });

    const [bill] = await pool.query(
      'SELECT * FROM billing WHERE id = ? AND patient_id = ?',
      [req.params.id, patient[0].id]
    );
    if (!bill.length) return res.status(404).json({ message: 'Bill not found' });

    await pool.query(
      `UPDATE billing SET paid_amount = total_amount, payment_status = 'paid', 
       payment_method = ? WHERE id = ?`,
      [payment_method || 'online', req.params.id]
    );

    res.json({ message: 'Payment successful' });
  } catch (error) {
    console.error('payBill error:', error);
    res.status(500).json({ message: 'Payment failed' });
  }
};

module.exports = {
  getProfile, updateProfile, getDashboardStats,
  getAppointments, getQueueStatus, getMedicalRecords,
  getLabReports, getBilling, payBill
};
