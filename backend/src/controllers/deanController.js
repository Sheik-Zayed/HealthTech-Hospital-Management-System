const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /api/dean/dashboard-stats
const getDashboardStats = async (req, res) => {
  try {
    const [[{ total_patients }]] = await pool.query('SELECT COUNT(*) as total_patients FROM patients');
    const [[{ total_doctors }]] = await pool.query('SELECT COUNT(*) as total_doctors FROM doctors');
    const [[{ today_appointments }]] = await pool.query(
      `SELECT COUNT(*) as today_appointments FROM appointments WHERE appointment_date = CURDATE()`
    );
    const [[{ available_beds }]] = await pool.query(
      `SELECT COUNT(*) as available_beds FROM beds WHERE status = 'available'`
    );
    const [[{ total_beds }]] = await pool.query('SELECT COUNT(*) as total_beds FROM beds');
    const [[{ pending_bills }]] = await pool.query(
      `SELECT COALESCE(SUM(total_amount - paid_amount), 0) as pending_bills FROM billing WHERE payment_status != 'paid'`
    );
    const [[{ monthly_revenue }]] = await pool.query(
      `SELECT COALESCE(SUM(paid_amount), 0) as monthly_revenue FROM billing 
       WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())`
    );
    const [[{ active_queues }]] = await pool.query(
      `SELECT COUNT(*) as active_queues FROM queue_entries WHERE status = 'waiting'`
    );

    // Department-wise patient distribution
    const [deptStats] = await pool.query(
      `SELECT dep.name, COUNT(a.id) as appointments
       FROM departments dep
       LEFT JOIN appointments a ON dep.id = a.department_id AND a.appointment_date = CURDATE()
       GROUP BY dep.id, dep.name ORDER BY appointments DESC`
    );

    // Weekly appointment trend (last 7 days)
    const [weeklyTrend] = await pool.query(
      `SELECT DATE(appointment_date) as date, COUNT(*) as count
       FROM appointments
       WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(appointment_date)
       ORDER BY date ASC`
    );

    // Top doctors by patient count
    const [topDoctors] = await pool.query(
      `SELECT u.name, d.specialization, COUNT(a.id) as total_appointments
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN appointments a ON d.id = a.doctor_id
       GROUP BY d.id, u.name, d.specialization
       ORDER BY total_appointments DESC LIMIT 5`
    );

    res.json({
      stats: {
        total_patients, total_doctors, today_appointments,
        available_beds, total_beds, pending_bills,
        monthly_revenue, active_queues,
        bed_occupancy: total_beds > 0 ? Math.round(((total_beds - available_beds) / total_beds) * 100) : 0
      },
      deptStats,
      weeklyTrend,
      topDoctors,
    });
  } catch (error) {
    console.error('Dean getDashboardStats error:', error);
    res.status(500).json({ message: 'Failed to get stats', error: error.message });
  }
};

// GET /api/dean/doctors
const getDoctors = async (req, res) => {
  try {
    const [doctors] = await pool.query(
      `SELECT d.id, u.id as user_id, u.name, u.email, u.phone, u.is_active,
              d.specialization, d.license_number, d.experience_years,
              d.consultation_fee, d.is_available, dep.name as department_name, dep.id as department_id
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN departments dep ON d.department_id = dep.id
       ORDER BY u.name ASC`
    );
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get doctors', error: error.message });
  }
};

// POST /api/dean/doctors - Dean creates doctor account
const createDoctor = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { name, email, password, phone, department_id, specialization,
            license_number, experience_years, consultation_fee } = req.body;

    // Check email
    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password || 'Doctor@123', 12);

    const [userResult] = await conn.query(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, "doctor", ?)',
      [name, email.toLowerCase(), passwordHash, phone || null]
    );

    await conn.query(
      `INSERT INTO doctors (user_id, department_id, specialization, license_number, experience_years, consultation_fee)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userResult.insertId, department_id || null, specialization || null,
       license_number || null, experience_years || 0, consultation_fee || 500]
    );

    await conn.commit();
    res.status(201).json({ message: 'Doctor created successfully. Default password: Doctor@123' });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ message: 'Failed to create doctor', error: error.message });
  } finally {
    conn.release();
  }
};

// PUT /api/dean/doctors/:id
const updateDoctor = async (req, res) => {
  try {
    const { name, phone, department_id, specialization, experience_years,
            consultation_fee, is_available, is_active } = req.body;
    const { id } = req.params;

    const [doc] = await pool.query('SELECT user_id FROM doctors WHERE id = ?', [id]);
    if (!doc.length) return res.status(404).json({ message: 'Doctor not found' });

    await pool.query('UPDATE users SET name=?, phone=?, is_active=? WHERE id=?',
      [name, phone, is_active !== undefined ? is_active : 1, doc[0].user_id]);
    await pool.query(
      `UPDATE doctors SET department_id=?, specialization=?, experience_years=?,
       consultation_fee=?, is_available=? WHERE id=?`,
      [department_id, specialization, experience_years, consultation_fee, is_available !== undefined ? is_available : 1, id]
    );

    res.json({ message: 'Doctor updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update doctor', error: error.message });
  }
};

// DELETE /api/dean/doctors/:id
const deleteDoctor = async (req, res) => {
  try {
    const [doc] = await pool.query('SELECT user_id FROM doctors WHERE id = ?', [req.params.id]);
    if (!doc.length) return res.status(404).json({ message: 'Doctor not found' });

    await pool.query('UPDATE users SET is_active = FALSE WHERE id = ?', [doc[0].user_id]);
    res.json({ message: 'Doctor deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to deactivate doctor', error: error.message });
  }
};

// GET /api/dean/departments
const getDepartments = async (req, res) => {
  try {
    const [deps] = await pool.query(
      `SELECT dep.*, 
              COUNT(DISTINCT d.id) as doctor_count,
              COUNT(DISTINCT b.id) as bed_count
       FROM departments dep
       LEFT JOIN doctors d ON dep.id = d.department_id
       LEFT JOIN beds b ON dep.id = b.department_id
       GROUP BY dep.id
       ORDER BY dep.name ASC`
    );
    res.json(deps);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get departments', error: error.message });
  }
};

// POST /api/dean/departments
const createDepartment = async (req, res) => {
  try {
    const { name, description, floor_number } = req.body;
    const [result] = await pool.query(
      'INSERT INTO departments (name, description, floor_number) VALUES (?, ?, ?)',
      [name, description, floor_number || 1]
    );
    res.status(201).json({ message: 'Department created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create department', error: error.message });
  }
};

// PUT /api/dean/departments/:id
const updateDepartment = async (req, res) => {
  try {
    const { name, description, floor_number } = req.body;
    await pool.query(
      'UPDATE departments SET name=?, description=?, floor_number=? WHERE id=?',
      [name, description, floor_number, req.params.id]
    );
    res.json({ message: 'Department updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update department', error: error.message });
  }
};

// DELETE /api/dean/departments/:id
const deleteDepartment = async (req, res) => {
  try {
    await pool.query('DELETE FROM departments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Department deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Cannot delete department (may have linked data)', error: error.message });
  }
};

// GET /api/dean/beds
const getBeds = async (req, res) => {
  try {
    const [beds] = await pool.query(
      `SELECT b.*, dep.name as department_name, u.name as patient_name
       FROM beds b
       LEFT JOIN departments dep ON b.department_id = dep.id
       LEFT JOIN patients p ON b.patient_id = p.id
       LEFT JOIN users u ON p.user_id = u.id
       ORDER BY b.department_id, b.bed_number`
    );
    res.json(beds);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get beds', error: error.message });
  }
};

// PUT /api/dean/beds/:id
const updateBed = async (req, res) => {
  try {
    const { status, patient_id } = req.body;
    await pool.query(
      `UPDATE beds SET status=?, patient_id=?, admitted_at=IF(? IS NOT NULL, NOW(), NULL) WHERE id=?`,
      [status, patient_id || null, patient_id, req.params.id]
    );
    res.json({ message: 'Bed updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update bed', error: error.message });
  }
};

// GET /api/dean/appointments
const getAllAppointments = async (req, res) => {
  try {
    const { date, status, department_id } = req.query;
    let query = `SELECT a.*, u_p.name as patient_name, u_d.name as doctor_name,
                        doc.specialization, dep.name as department_name
                 FROM appointments a
                 JOIN patients p ON a.patient_id = p.id
                 JOIN users u_p ON p.user_id = u_p.id
                 JOIN doctors doc ON a.doctor_id = doc.id
                 JOIN users u_d ON doc.user_id = u_d.id
                 LEFT JOIN departments dep ON doc.department_id = dep.id
                 WHERE 1=1`;
    const params = [];
    if (date) { query += ' AND a.appointment_date = ?'; params.push(date); }
    if (status) { query += ' AND a.status = ?'; params.push(status); }
    if (department_id) { query += ' AND doc.department_id = ?'; params.push(department_id); }
    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT 100';

    const [appointments] = await pool.query(query, params);
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get appointments', error: error.message });
  }
};

// GET /api/dean/analytics
const getAnalytics = async (req, res) => {
  try {
    // Monthly revenue (last 6 months)
    const [monthlyRevenue] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(paid_amount) as revenue
       FROM billing
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month ASC`
    );

    // Appointment status distribution
    const [appointmentStatus] = await pool.query(
      `SELECT status, COUNT(*) as count FROM appointments GROUP BY status`
    );

    // Patient registrations trend (last 6 months)
    const [patientTrend] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
       FROM patients
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month ASC`
    );

    // Department appointment distribution
    const [deptAppointments] = await pool.query(
      `SELECT dep.name, COUNT(a.id) as appointments
       FROM departments dep
       LEFT JOIN appointments a ON dep.id = a.department_id
       GROUP BY dep.id, dep.name
       ORDER BY appointments DESC`
    );

    res.json({ monthlyRevenue, appointmentStatus, patientTrend, deptAppointments });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get analytics', error: error.message });
  }
};

// GET /api/dean/billing
const getAllBilling = async (req, res) => {
  try {
    const [bills] = await pool.query(
      `SELECT b.*, u.name as patient_name, a.appointment_date
       FROM billing b
       JOIN patients p ON b.patient_id = p.id
       JOIN users u ON p.user_id = u.id
       JOIN appointments a ON b.appointment_id = a.id
       ORDER BY b.created_at DESC LIMIT 100`
    );
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get billing', error: error.message });
  }
};

module.exports = {
  getDashboardStats, getDoctors, createDoctor, updateDoctor, deleteDoctor,
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getBeds, updateBed, getAllAppointments, getAnalytics, getAllBilling
};
