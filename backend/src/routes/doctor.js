const express = require('express');
const router = express.Router();
const {
  getProfile, updateProfile, getDashboardStats,
  getMyQueue, callPatient, completeConsultation, skipPatient,
  getDoctorsList, getPatients, createRecord, orderLabTest
} = require('../controllers/doctorController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');

// Public routes (doctors list for patient booking)
router.get('/list', getDoctorsList);

// Protected doctor-only routes
router.use(authenticate, authorize('doctor'));
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/dashboard-stats', getDashboardStats);
router.get('/queue', getMyQueue);
router.post('/queue/:id/call', callPatient);
router.put('/queue/:id/complete', completeConsultation);
router.put('/queue/:id/skip', skipPatient);
router.get('/patients', getPatients);
router.post('/records', createRecord);
router.post('/lab-orders', orderLabTest);

module.exports = router;
