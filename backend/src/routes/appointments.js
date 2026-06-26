const express = require('express');
const router = express.Router();
const {
  createAppointment, getAppointments, cancelAppointment, getAvailableSlots, getDepartments
} = require('../controllers/appointmentController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');

// Public
router.get('/departments', getDepartments);
router.get('/slots', getAvailableSlots);

// Protected
router.use(authenticate);
router.post('/', authorize('patient'), createAppointment);
router.get('/', authorize('patient', 'doctor'), getAppointments);
router.put('/:id/cancel', authorize('patient'), cancelAppointment);

module.exports = router;
