import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Pages
import LandingPage from "./pages/Landing/LandingPage";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";

// Patient Pages
import PatientDashboard from "./pages/Patient/PatientDashboard";
import PatientAppointments from "./pages/Patient/Appointments";
import PatientQueueStatus from "./pages/Patient/QueueStatus";
import PatientMedicalRecords from "./pages/Patient/MedicalRecords";
import PatientLabReports from "./pages/Patient/LabReports";
import PatientBilling from "./pages/Patient/Billing";
import PatientProfile from "./pages/Patient/Profile";

// Doctor Pages
import DoctorDashboard from "./pages/Doctor/DoctorDashboard";
import DoctorQueueManager from "./pages/Doctor/QueueManager";
import DoctorPatients from "./pages/Doctor/Patients";
import DoctorConsultation from "./pages/Doctor/Consultation";

// Dean Pages
import DeanDashboard from "./pages/Dean/DeanDashboard";
import DeanDoctors from "./pages/Dean/DoctorsManagement";
import DeanDepartments from "./pages/Dean/DepartmentsManagement";
import DeanAnalytics from "./pages/Dean/Analytics";
import DeanBeds from "./pages/Dean/BedManagement";
import DeanBilling from "./pages/Dean/BillingManagement";

// Loading Screen
const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="spinner" />
    <p style={{ color: "var(--text-secondary)" }}>Loading HealthTech...</p>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirects = {
      patient: "/patient/dashboard",
      doctor: "/doctor/dashboard",
      dean: "/dean/dashboard",
    };
    return <Navigate to={redirects[user.role] || "/login"} replace />;
  }
  return children;
};

// Auto redirect based on role
const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const redirects = {
    patient: "/patient/dashboard",
    doctor: "/doctor/dashboard",
    dean: "/dean/dashboard",
  };
  return <Navigate to={redirects[user.role] || "/login"} replace />;
};

export default function App() {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<RoleRedirect />} />

        {/* Patient Routes */}
        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/appointments"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/queue"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientQueueStatus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/records"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientMedicalRecords />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/lab-reports"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientLabReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/billing"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientBilling />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/profile"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientProfile />
            </ProtectedRoute>
          }
        />

        {/* Doctor Routes */}
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/queue"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <DoctorQueueManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/patients"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <DoctorPatients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/consultation/:patientId"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <DoctorConsultation />
            </ProtectedRoute>
          }
        />

        {/* Dean Routes */}
        <Route
          path="/dean/dashboard"
          element={
            <ProtectedRoute allowedRoles={["dean"]}>
              <DeanDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dean/doctors"
          element={
            <ProtectedRoute allowedRoles={["dean"]}>
              <DeanDoctors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dean/departments"
          element={
            <ProtectedRoute allowedRoles={["dean"]}>
              <DeanDepartments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dean/analytics"
          element={
            <ProtectedRoute allowedRoles={["dean"]}>
              <DeanAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dean/beds"
          element={
            <ProtectedRoute allowedRoles={["dean"]}>
              <DeanBeds />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dean/billing"
          element={
            <ProtectedRoute allowedRoles={["dean"]}>
              <DeanBilling />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
