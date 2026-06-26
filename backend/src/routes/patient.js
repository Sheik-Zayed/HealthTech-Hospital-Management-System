const express = require('express');
const router = express.Router();
const {
  getProfile, updateProfile, getDashboardStats,
  getAppointments, getQueueStatus, getMedicalRecords,
  getLabReports, getBilling, payBill
} = require('../controllers/patientController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');

router.use(authenticate, authorize('patient'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/dashboard-stats', getDashboardStats);
router.get('/appointments', getAppointments);
router.get('/queue-status', getQueueStatus);
router.get('/medical-records', getMedicalRecords);
router.get('/lab-reports', getLabReports);
router.get('/billing', getBilling);
router.put('/billing/:id/pay', payBill);

module.exports = router;
