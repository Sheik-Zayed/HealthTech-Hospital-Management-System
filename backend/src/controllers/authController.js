const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register
const register = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { name, email, password, role, phone, ...profileData } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password and role are required' });
    }

    if (!['patient', 'doctor', 'dean'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be patient, doctor, or dean' });
    }

    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'This email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [userResult] = await conn.query(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), passwordHash, role, phone || null]
    );
    const userId = userResult.insertId;

    let profileId = null;

    if (role === 'patient') {
      const [pResult] = await conn.query(
        `INSERT INTO patients 
         (user_id, date_of_birth, blood_group, gender, address, emergency_contact_name, emergency_contact_phone)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          profileData.date_of_birth || null,
          profileData.blood_group || null,
          profileData.gender || null,
          profileData.address || null,
          profileData.emergency_contact_name || null,
          profileData.emergency_contact_phone || null,
        ]
      );
      profileId = pResult.insertId;
    } else if (role === 'doctor') {
      const [dResult] = await conn.query(
        `INSERT INTO doctors 
         (user_id, department_id, specialization, license_number, experience_years, consultation_fee)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          profileData.department_id || null,
          profileData.specialization || null,
          profileData.license_number || null,
          profileData.experience_years || 0,
          profileData.consultation_fee || 500,
        ]
      );
      profileId = dResult.insertId;
    }

    await conn.commit();

    const token = generateToken({ id: userId, email, role, name });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: userId, name, email, role, phone: phone || null, profileId },
    });
  } catch (error) {
    await conn.rollback();
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  } finally {
    conn.release();
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    let profileId = null;
    let extraInfo = {};

    if (user.role === 'patient') {
      const [p] = await pool.query('SELECT id FROM patients WHERE user_id = ?', [user.id]);
      if (p.length) profileId = p[0].id;
    } else if (user.role === 'doctor') {
      const [d] = await pool.query(
        `SELECT d.id, d.department_id, d.specialization, dep.name as department_name
         FROM doctors d LEFT JOIN departments dep ON d.department_id = dep.id
         WHERE d.user_id = ?`,
        [user.id]
      );
      if (d.length) {
        profileId = d[0].id;
        extraInfo = { department: d[0].department_name, specialization: d[0].specialization };
      }
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profileId,
        ...extraInfo,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, role, phone, avatar_url, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!users.length) return res.status(404).json({ message: 'User not found' });

    const user = users[0];
    let profile = null;

    if (user.role === 'patient') {
      const [p] = await pool.query('SELECT * FROM patients WHERE user_id = ?', [user.id]);
      if (p.length) profile = p[0];
    } else if (user.role === 'doctor') {
      const [d] = await pool.query(
        `SELECT d.*, dep.name as department_name FROM doctors d
         LEFT JOIN departments dep ON d.department_id = dep.id
         WHERE d.user_id = ?`,
        [user.id]
      );
      if (d.length) profile = d[0];
    }

    res.json({ user, profile });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Failed to get user info' });
  }
};

module.exports = { register, login, getMe };
