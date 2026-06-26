const pool = require('../config/db');

// GET /api/doctors/profile
const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id as user_id, u.name, u.email, u.phone, u.avatar_url,
              d.id, d.department_id, d.specialization, d.license_number,
              d.experience_years, d.consultation_fee, d.available_from, d.available_to,
              d.is_available, d.bio, dep.name as department_name
       FROM users u
       JOIN doctors d ON u.id = d.user_id
       LEFT JOIN departments dep ON d.department_id = dep.id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Doctor profile not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
};

// PUT /api/doctors/profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, specialization, experience_years, consultation_fee,
            available_from, available_to, bio, is_available } = req.body;

    await pool.query('UPDATE users SET name=?, phone=? WHERE id=?', [name, phone, req.user.id]);
    await pool.query(
      `UPDATE doctors SET specialization=?, experience_years=?, consultation_fee=?,
       available_from=?, available_to=?, bio=?, is_available=? WHERE user_id=?`,
      [specialization, experience_years, consultation_fee, available_from, available_to, bio, is_available, req.user.id]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

// GET /api/doctors/dashboard-stats
const getDashboardStats = async (req, res) => {
  try {
    const [doc] = await pool.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
    if (!doc.length) return res.status(404).json({ message: 'Doctor not found' });
    const doctorId = doc[0].id;

    const [[{ today_appointments }]] = await pool.query(
      `SELECT COUNT(*) as today_appointments FROM appointments WHERE doctor_id = ? AND appointment_date = CURDATE()`,
      [doctorId]
    );
    const [[{ queue_count }]] = await pool.query(
      `SELECT COUNT(*) as queue_count FROM queue_entries WHERE doctor_id = ? AND status = 'waiting'`,
      [doctorId]
    );
    const [[{ total_patients }]] = await pool.query(
      `SELECT COUNT(DISTINCT patient_id) as total_patients FROM appointments WHERE doctor_id = ?`,
      [doctorId]
    );
    const [[{ completed_today }]] = await pool.query(
      `SELECT COUNT(*) as completed_today FROM appointments WHERE doctor_id = ? 
       AND appointment_date = CURDATE() AND status = 'completed'`,
      [doctorId]
    );

    // Today's queue
    const [todayQueue] = await pool.query(
      `SELECT q.*, u.name as patient_name, p.blood_group, p.gender
       FROM queue_entries q
       JOIN patients pat ON q.patient_id = pat.id
       JOIN users u ON pat.user_id = u.id
       LEFT JOIN patients p ON q.patient_id = p.id
       WHERE q.doctor_id = ? AND DATE(q.created_at) = CURDATE()
       ORDER BY q.queue_number ASC LIMIT 10`,
      [doctorId]
    );

    // Recent medical records
    const [recentRecords] = await pool.query(
      `SELECT mr.*, u.name as patient_name
       FROM medical_records mr
       JOIN patients pat ON mr.patient_id = pat.id
       JOIN users u ON pat.user_id = u.id
       WHERE mr.doctor_id = ?
       ORDER BY mr.created_at DESC LIMIT 5`,
      [doctorId]
    );

    res.json({
      stats: { today_appointments, queue_count, total_patients, completed_today },
      todayQueue,
      recentRecords,
    });
  } catch (error) {
    console.error('Doctor getDashboardStats error:', error);
    res.status(500).json({ message: 'Failed to get stats', error: error.message });
  }
};

// GET /api/doctors/queue - Doctor sees their queue
const getMyQueue = async (req, res) => {
  try {
    const [doc] = await pool.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
    if (!doc.length) return res.status(404).json({ message: 'Doctor not found' });

    const [queue] = await pool.query(
      `SELECT q.*, u.name as patient_name, p.blood_group, p.gender, p.date_of_birth,
              p.allergies, p.chronic_conditions, a.reason
       FROM queue_entries q
       JOIN patients p ON q.patient_id = p.id
       JOIN users u ON p.user_id = u.id
       LEFT JOIN appointments a ON q.appointment_id = a.id
       WHERE q.doctor_id = ? AND q.status IN ('waiting','in_consultation')
       ORDER BY q.queue_number ASC`,
      [doc[0].id]
    );
    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get queue', error: error.message });
  }
};

// POST /api/doctors/queue/:id/call-next - Call a specific queue entry
const callPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const [doc] = await pool.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
    if (!doc.length) return res.status(404).json({ message: 'Doctor not found' });

    // Set any currently in_consultation to waiting first
    await pool.query(
      `UPDATE queue_entries SET status='waiting' WHERE doctor_id = ? AND status='in_consultation'`,
      [doc[0].id]
    );

    const [entry] = await pool.query('SELECT * FROM queue_entries WHERE id = ? AND doctor_id = ?', [id, doc[0].id]);
    if (!entry.length) return res.status(404).json({ message: 'Queue entry not found' });

    await pool.query(
      `UPDATE queue_entries SET status='in_consultation', called_at=NOW() WHERE id=?`, [id]
    );
    await pool.query(
      `UPDATE appointments SET status='in_progress' WHERE id=?`, [entry[0].appointment_id]
    );

    // Notify via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`queue:${doc[0].id}`).emit('queue:update', { action: 'called', entryId: id });
      io.to(`patient:${entry[0].patient_id}`).emit('queue:called', {
        message: "It's your turn! Please proceed to the doctor's room.",
        queueId: id
      });
    }

    // Create notification for patient
    const [[pat]] = await pool.query('SELECT user_id FROM patients WHERE id=?', [entry[0].patient_id]);
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)`,
      [pat.user_id, "It's your turn!", "The doctor is ready to see you. Please proceed.", 'queue']
    );

    res.json({ message: 'Patient called successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to call patient', error: error.message });
  }
};

// PUT /api/doctors/queue/:id/complete
const completeConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const [doc] = await pool.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
    if (!doc.length) return res.status(404).json({ message: 'Doctor not found' });

    const [entry] = await pool.query('SELECT * FROM queue_entries WHERE id = ? AND doctor_id = ?', [id, doc[0].id]);
    if (!entry.length) return res.status(404).json({ message: 'Queue entry not found' });

    await pool.query(
      `UPDATE queue_entries SET status='completed', completed_at=NOW() WHERE id=?`, [id]
    );
    await pool.query(
      `UPDATE appointments SET status='completed' WHERE id=?`, [entry[0].appointment_id]
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`queue:${doc[0].id}`).emit('queue:update', { action: 'completed', entryId: id });
    }

    res.json({ message: 'Consultation completed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to complete', error: error.message });
  }
};

// PUT /api/doctors/queue/:id/skip
const skipPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const [doc] = await pool.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
    if (!doc.length) return res.status(404).json({ message: 'Doctor not found' });

    await pool.query(`UPDATE queue_entries SET status='skipped' WHERE id=? AND doctor_id=?`, [id, doc[0].id]);

    const io = req.app.get('io');
    if (io) {
      io.to(`queue:${doc[0].id}`).emit('queue:update', { action: 'skipped', entryId: id });
    }

    res.json({ message: 'Patient skipped' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to skip', error: error.message });
  }
};

// GET /api/doctors/list - Get all available doctors (for patient booking)
const getDoctorsList = async (req, res) => {
  try {
    const { department_id } = req.query;
    let query = `SELECT d.id, u.name, u.phone, d.specialization, d.experience_years,
                        d.consultation_fee, d.is_available, d.available_from, d.available_to, d.bio,
                        dep.name as department_name, dep.id as department_id
                 FROM doctors d
                 JOIN users u ON d.user_id = u.id
                 LEFT JOIN departments dep ON d.department_id = dep.id
                 WHERE u.is_active = TRUE`;
    const params = [];
    if (department_id) {
      query += ' AND d.department_id = ?';
      params.push(department_id);
    }
    query += ' ORDER BY u.name ASC';

    const [doctors] = await pool.query(query, params);
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get doctors', error: error.message });
  }
};

// GET /api/doctors/patients - Search patients
const getPatients = async (req, res) => {
  try {
    const [doc] = await pool.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
    if (!doc.length) return res.status(404).json({ message: 'Doctor not found' });

    const { search } = req.query;
    let query = `SELECT DISTINCT p.id, u.name, u.email, u.phone, p.blood_group, p.gender,
                        p.date_of_birth, p.allergies, p.chronic_conditions
                 FROM patients p
                 JOIN users u ON p.user_id = u.id
                 JOIN appointments a ON p.id = a.patient_id
                 WHERE a.doctor_id = ?`;
    const params = [doc[0].id];

    if (search) {
      query += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY u.name ASC';

    const [patients] = await pool.query(query, params);
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get patients', error: error.message });
  }
};

// POST /api/doctors/records - Create medical record
const createRecord = async (req, res) => {
  try {
    const [doc] = await pool.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
    if (!doc.length) return res.status(404).json({ message: 'Doctor not found' });

    const { patient_id, appointment_id, diagnosis, symptoms, treatment_plan, notes, follow_up_date, prescriptions } = req.body;

    const [result] = await pool.query(
      `INSERT INTO medical_records (patient_id, doctor_id, appointment_id, diagnosis, symptoms, treatment_plan, notes, follow_up_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, doc[0].id, appointment_id || null, diagnosis, symptoms, treatment_plan, notes, follow_up_date || null]
    );

    const recordId = result.insertId;

    if (prescriptions && prescriptions.length > 0) {
      for (const p of prescriptions) {
        await pool.query(
          `INSERT INTO prescriptions (record_id, patient_id, doctor_id, medication_name, dosage, frequency, duration, instructions)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [recordId, patient_id, doc[0].id, p.medication_name, p.dosage, p.frequency, p.duration, p.instructions]
        );
      }
    }

    // Notify patient
    const [[pat]] = await pool.query('SELECT user_id FROM patients WHERE id=?', [patient_id]);
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)`,
      [pat.user_id, 'Consultation record updated', 'Your doctor has added a new medical record.', 'general']
    );

    res.status(201).json({ message: 'Medical record created', recordId });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create record', error: error.message });
  }
};

// POST /api/doctors/lab-orders - Order lab tests
const orderLabTest = async (req, res) => {
  try {
    const [doc] = await pool.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
    if (!doc.length) return res.status(404).json({ message: 'Doctor not found' });

    const { patient_id, appointment_id, test_name, normal_range } = req.body;

    const [result] = await pool.query(
      `INSERT INTO lab_reports (patient_id, doctor_id, appointment_id, test_name, normal_range, status)
       VALUES (?, ?, ?, ?, ?, 'ordered')`,
      [patient_id, doc[0].id, appointment_id, test_name, normal_range]
    );

    const [[pat]] = await pool.query('SELECT user_id FROM patients WHERE id=?', [patient_id]);
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)`,
      [pat.user_id, 'Lab Test Ordered', `A lab test for "${test_name}" has been ordered.`, 'lab']
    );

    res.status(201).json({ message: 'Lab test ordered', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Failed to order lab test', error: error.message });
  }
};

module.exports = {
  getProfile, updateProfile, getDashboardStats,
  getMyQueue, callPatient, completeConsultation, skipPatient,
  getDoctorsList, getPatients, createRecord, orderLabTest
};
