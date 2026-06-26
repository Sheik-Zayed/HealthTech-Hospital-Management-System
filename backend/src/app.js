const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patient');
const doctorRoutes = require('./routes/doctor');
const deanRoutes = require('./routes/dean');
const appointmentRoutes = require('./routes/appointments');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// ─── Middleware ────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible inside controllers
app.set('io', io);

// ─── Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/dean', deanRoutes);
app.use('/api/appointments', appointmentRoutes);

// Notifications route (inline for simplicity)
const { authenticate } = require('./middleware/auth');
const pool = require('./config/db');

app.get('/api/notifications', authenticate, async (req, res) => {
  try {
    const [notifs] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
      [req.user.id]
    );
    res.json(notifs);
  } catch (e) {
    res.status(500).json({ message: 'Failed to get notifications' });
  }
});

app.put('/api/notifications/:id/read', authenticate, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Marked as read' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

app.put('/api/notifications/read-all', authenticate, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'All notifications marked as read' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update notifications' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), service: 'HealthTech API' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// ─── Socket.io ────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join:queue', (doctorId) => {
    socket.join(`queue:${doctorId}`);
    console.log(`Socket ${socket.id} joined queue room for doctor ${doctorId}`);
  });

  socket.on('join:patient', (patientId) => {
    socket.join(`patient:${patientId}`);
    console.log(`Socket ${socket.id} joined patient room ${patientId}`);
  });

  socket.on('leave:queue', (doctorId) => {
    socket.leave(`queue:${doctorId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ─── Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🏥 HealthTech API Server`);
  console.log(`   Running on: http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Ready for connections!\n`);
});

module.exports = { app, io };
