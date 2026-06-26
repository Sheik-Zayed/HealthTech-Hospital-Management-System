const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getDoctors, createDoctor, updateDoctor, deleteDoctor,
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getBeds, updateBed, getAllAppointments, getAnalytics, getAllBilling
} = require('../controllers/deanController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleGuard');

router.use(authenticate, authorize('dean'));

router.get('/dashboard-stats', getDashboardStats);

// Doctors management
router.get('/doctors', getDoctors);
router.post('/doctors', createDoctor);
router.put('/doctors/:id', updateDoctor);
router.delete('/doctors/:id', deleteDoctor);

// Departments management
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

// Beds
router.get('/beds', getBeds);
router.put('/beds/:id', updateBed);

// Appointments
router.get('/appointments', getAllAppointments);

// Analytics & Billing
router.get('/analytics', getAnalytics);
router.get('/billing', getAllBilling);

module.exports = router;
