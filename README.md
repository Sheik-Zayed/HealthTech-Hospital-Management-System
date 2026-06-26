# 🏥 HealthTech — Hospital Management System

> **A production-style Full Stack Hospital Management System built with React, Node.js, Express.js, MySQL, JWT Authentication, and Socket.io.**

---

## 📌 Overview

HealthTech is a **production-inspired Hospital Management System** that digitizes hospital operations by connecting **Patients, Doctors, and Hospital Administrators** through a unified platform.

The application streamlines the complete patient journey—from appointment booking and queue management to consultation, medical records, billing, and analytics—while providing real-time communication using Socket.io.

---

# ✨ Key Features

## 👨‍⚕️ Patient Portal

- User Registration & Login
- Book Appointments
- Live Queue Tracking
- Medical Records (EHR)
- Lab Reports
- Billing & Payments
- Profile Management

---

## 🩺 Doctor Portal

- Dashboard
- Queue Management
- Call Next Patient
- Complete Consultation
- Electronic Medical Records
- Prescription Management
- Patient History

---

## 🏥 Hospital Admin Portal

- Dashboard Analytics
- Doctor Management
- Department Management
- Bed Management
- Revenue Analytics
- Billing Management
- Hospital Statistics

---

# 🚀 Major Highlights

- 🔐 JWT Authentication
- 🛡️ Role-Based Access Control (RBAC)
- ⚡ Real-Time Queue System using Socket.io
- 📊 Analytics Dashboard
- 💊 Electronic Health Records (EHR)
- 💳 Billing Management
- 🛏️ Bed Management
- 📱 Responsive UI
- 🌙 Modern Glassmorphism Design

---

# 🏗️ System Architecture

```
React + Vite
       │
       ▼
Express.js REST API
       │
JWT Authentication
       │
Socket.io
       │
MySQL Database
```

---

# 🛠️ Tech Stack

### Frontend

- React.js
- Vite
- React Router
- Axios
- Socket.io Client
- Recharts
- React Icons
- Vanilla CSS

### Backend

- Node.js
- Express.js
- Socket.io
- JWT
- bcrypt
- MySQL2

### Database

- MySQL

---

# 📂 Project Structure

```
HealthTech-Hospital-Management-System
│
├── frontend
│   ├── src
│   ├── public
│   ├── package.json
│   └── vite.config.js
│
├── backend
│   ├── src
│   ├── database
│   │   └── schema.sql
│   ├── package.json
│   └── .env.example
│
├── README.md
└── .gitignore
```

---

# 📸 Screenshots

> Add screenshots here after completing the project.

| Landing Page | Patient Dashboard |
|---------------|-------------------|
| Image | Image |

| Doctor Dashboard | Admin Dashboard |
|-----------------|----------------|
| Image | Image |

---

# ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/HealthTech-Hospital-Management-System.git
```

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 🔑 Environment Variables

### Backend

```env
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=

PORT=5000
```

### Frontend

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

# 📊 Database

The system uses **MySQL** with relational tables including:

- Users
- Patients
- Doctors
- Departments
- Appointments
- Queue Entries
- Medical Records
- Prescriptions
- Billing
- Beds
- Notifications

---

# 🎯 Future Enhancements

- AI Symptom Checker
- PDF Prescription Generation
- Mobile Application
- Push Notifications
- Video Consultation
- Multi-Hospital Support
- Two-Factor Authentication
- Pharmacy Integration
- Laboratory Integration

---

# 👨‍💻 Author

**Sheik Zayed**

- LinkedIn: https://www.linkedin.com/in/sheikzayed06/
- GitHub: https://github.com/Sheik-Zayed

---

# ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.

---

## 📄 License

This project is intended for educational and portfolio purposes.
