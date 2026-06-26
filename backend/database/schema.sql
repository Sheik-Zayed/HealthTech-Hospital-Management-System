-- HealthTech Hospital Management System - Database Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS healthtech_db;
USE healthtech_db;

-- Users (all roles)
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('patient', 'doctor', 'dean') NOT NULL,
  phone VARCHAR(20),
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  floor_number INT DEFAULT 1,
  head_doctor_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients
CREATE TABLE IF NOT EXISTS patients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  date_of_birth DATE,
  blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-'),
  gender ENUM('male','female','other'),
  address TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  allergies TEXT,
  chronic_conditions TEXT,
  insurance_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Doctors
CREATE TABLE IF NOT EXISTS doctors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  department_id INT,
  specialization VARCHAR(255),
  license_number VARCHAR(100),
  experience_years INT DEFAULT 0,
  consultation_fee DECIMAL(10,2) DEFAULT 500,
  available_from TIME DEFAULT '09:00:00',
  available_to TIME DEFAULT '17:00:00',
  is_available BOOLEAN DEFAULT TRUE,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  department_id INT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status ENUM('pending','confirmed','in_progress','completed','cancelled') DEFAULT 'confirmed',
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Queue
CREATE TABLE IF NOT EXISTS queue_entries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  appointment_id INT NOT NULL,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  queue_number INT NOT NULL,
  status ENUM('waiting','in_consultation','completed','skipped') DEFAULT 'waiting',
  estimated_wait_minutes INT DEFAULT 0,
  called_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id),
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- Medical Records / EHR
CREATE TABLE IF NOT EXISTS medical_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_id INT,
  diagnosis TEXT,
  symptoms TEXT,
  treatment_plan TEXT,
  notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  record_id INT NOT NULL,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  duration VARCHAR(100),
  instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES medical_records(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- Lab Reports
CREATE TABLE IF NOT EXISTS lab_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_id INT,
  test_name VARCHAR(255) NOT NULL,
  result TEXT,
  normal_range VARCHAR(255),
  status ENUM('ordered','processing','completed') DEFAULT 'ordered',
  report_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);

-- Billing
CREATE TABLE IF NOT EXISTS billing (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  appointment_id INT NOT NULL,
  consultation_fee DECIMAL(10,2) DEFAULT 0,
  lab_fee DECIMAL(10,2) DEFAULT 0,
  medicine_fee DECIMAL(10,2) DEFAULT 0,
  other_charges DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  payment_status ENUM('pending','partial','paid') DEFAULT 'pending',
  payment_method VARCHAR(100),
  invoice_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- Bed Management
CREATE TABLE IF NOT EXISTS beds (
  id INT PRIMARY KEY AUTO_INCREMENT,
  bed_number VARCHAR(20) NOT NULL,
  department_id INT,
  ward_type ENUM('general','private','icu','emergency') DEFAULT 'general',
  status ENUM('available','occupied','maintenance') DEFAULT 'available',
  patient_id INT,
  admitted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type ENUM('appointment','queue','lab','billing','general') DEFAULT 'general',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO departments (name, description, floor_number) VALUES
  ('General Medicine', 'General outpatient and primary care services', 1),
  ('Cardiology', 'Heart and cardiovascular disease treatment', 2),
  ('Orthopedics', 'Bone, joint, and musculoskeletal care', 3),
  ('Pediatrics', 'Healthcare for infants, children, and adolescents', 1),
  ('Neurology', 'Brain, spine, and nervous system disorders', 4),
  ('Dermatology', 'Skin, hair, and nail conditions', 2),
  ('Gynecology', "Women's reproductive health and obstetrics", 3),
  ('Emergency', 'Critical and emergency care unit', 0),
  ('Radiology', 'Imaging and diagnostic services', 1),
  ('Oncology', 'Cancer diagnosis and treatment', 4);

-- Seed beds (10 beds across departments)
INSERT INTO beds (bed_number, department_id, ward_type, status) VALUES
  ('G-101', 1, 'general', 'available'),
  ('G-102', 1, 'general', 'available'),
  ('G-103', 1, 'general', 'occupied'),
  ('C-201', 2, 'private', 'available'),
  ('C-202', 2, 'icu', 'occupied'),
  ('O-301', 3, 'general', 'maintenance'),
  ('P-101', 4, 'general', 'available'),
  ('N-401', 5, 'icu', 'available'),
  ('E-001', 8, 'emergency', 'available'),
  ('E-002', 8, 'emergency', 'occupied');
