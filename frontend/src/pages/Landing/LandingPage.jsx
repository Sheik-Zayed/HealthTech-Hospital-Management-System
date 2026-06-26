import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiArrowRight, FiCheckCircle, FiUsers, FiActivity,
         FiClock, FiShield, FiHeart, FiStar, FiMenu } from 'react-icons/fi';
import { MdMedicalServices, MdOutlineAnalytics } from 'react-icons/md';
import './LandingPage.css';

const STATS = [
  { value: '50K+', label: 'Patients Served' },
  { value: '500+', label: 'Expert Doctors' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '24/7', label: 'Emergency Care' },
];

const FEATURES = [
  {
    icon: <FiClock size={28} />,
    title: 'Smart Queue Intelligence',
    desc: 'Real-time queue tracking eliminates waiting room anxiety. Know your exact position and estimated wait time.',
    color: 'var(--primary)',
  },
  {
    icon: <MdMedicalServices size={28} />,
    title: 'Intelligent Appointment Booking',
    desc: 'AI-powered scheduling matches you with the right doctor instantly, auto-assigning time slots based on availability.',
    color: 'var(--accent)',
  },
  {
    icon: <FiActivity size={28} />,
    title: 'Complete EHR Access',
    desc: 'Full electronic health records at your fingertips — history, prescriptions, lab reports, all in one place.',
    color: 'var(--secondary)',
  },
  {
    icon: <FiShield size={28} />,
    title: 'Role-Based Security',
    desc: 'Military-grade JWT authentication ensures patient data stays private. Each role sees only what they should.',
    color: 'var(--danger)',
  },
  {
    icon: <MdOutlineAnalytics size={28} />,
    title: 'Hospital Dean Analytics',
    desc: 'Real-time KPIs for hospital administrators — bed occupancy, revenue, staff performance, all visualized.',
    color: 'var(--warning)',
  },
  {
    icon: <FiHeart size={28} />,
    title: 'Transparent Billing',
    desc: 'Itemized invoices and instant payment updates. No surprises — patients always know what they owe.',
    color: '#FF6B9D',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    role: 'Patient',
    title: 'Register & Book',
    desc: 'Create your patient profile, choose your doctor and specialty, pick a time slot, and confirm your appointment instantly.',
  },
  {
    step: '02',
    role: 'Doctor',
    title: 'Manage Your Queue',
    desc: 'Doctors get a real-time smart queue dashboard. Call next patient, write consultation notes, and prescribe — all in one click.',
  },
  {
    step: '03',
    role: 'Dean',
    title: 'Oversee Everything',
    desc: 'The Hospital Dean gets full control — manage doctors, departments, bed allocation, and view live analytics and revenue.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Dr. Priya Sharma',
    role: 'Cardiologist',
    text: 'HealthTech has transformed my workflow completely. I can manage 40+ patients a day with zero confusion thanks to the smart queue.',
    rating: 5,
  },
  {
    name: 'Arjun Mehta',
    role: 'Patient',
    text: 'I can track exactly when my turn comes up and get notified on my phone. No more waiting blindly in crowded waiting rooms.',
    rating: 5,
  },
  {
    name: 'Dr. R. Krishnamurthy',
    role: 'Hospital Dean',
    text: 'The analytics dashboard gives me everything I need to run a world-class hospital. Bed management, revenue, staff — all in one view.',
    rating: 5,
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  useEffect(() => {
    if (user) {
      const redirects = { patient: '/patient/dashboard', doctor: '/doctor/dashboard', dean: '/dean/dashboard' };
      navigate(redirects[user.role] || '/login');
    }
  }, [user]);

  return (
    <div className="landing">
      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            <div className="nav-logo"><FiHeart /></div>
            <span>HealthTech</span>
          </Link>

          <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#testimonials">Testimonials</a>
          </div>

          <div className="nav-actions">
            <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>

          <button className="nav-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <FiMenu />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-bg-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="pulse-dot" />
            Live Queue Tracking · Real-time Updates
          </div>
          <h1 className="hero-title">
            Patient Care Made <br />
            <span className="gradient-text">Effortlessly Efficient</span>
          </h1>
          <p className="hero-subtitle">
            HealthTech is the all-in-one hospital management platform that eliminates
            fragmentation, slashes wait times, and empowers every stakeholder —
            patient, doctor, or dean — with the right tools.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              Start Your Journey <FiArrowRight />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Sign In
            </Link>
          </div>

          {/* Mini role cards */}
          <div className="hero-roles">
            {[
              { role: 'Patient', desc: 'Book, track & manage your health', icon: '🏃', color: 'var(--accent)' },
              { role: 'Doctor', desc: 'Smart queue & EHR management', icon: '👨‍⚕️', color: 'var(--primary)' },
              { role: 'Hospital Dean', desc: 'Full hospital oversight & KPIs', icon: '🏛️', color: '#B06EE8' },
            ].map(r => (
              <div key={r.role} className="role-card">
                <div className="role-icon">{r.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: r.color }}>{r.role}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats-section">
        <div className="stats-grid">
          {STATS.map(s => (
            <div key={s.label} className="stat-pill">
              <div className="stat-pill-value">{s.value}</div>
              <div className="stat-pill-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="section">
        <div className="section-header">
          <div className="section-badge">Core Features</div>
          <h2>Built for Every Healthcare Stakeholder</h2>
          <p>From first appointment to final billing — HealthTech handles the complete hospital lifecycle with intelligence.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon" style={{ color: f.color, background: `${f.color}15` }}>
                {f.icon}
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="section section-dark">
        <div className="section-header">
          <div className="section-badge">How It Works</div>
          <h2>Three Roles. One Platform.</h2>
          <p>Seamlessly connecting patients, doctors, and hospital administrators in a single unified ecosystem.</p>
        </div>
        <div className="how-grid">
          {HOW_IT_WORKS.map((s, i) => (
            <div key={s.step} className="how-card">
              <div className="how-step">{s.step}</div>
              <div className="how-role">{s.role}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              {i < HOW_IT_WORKS.length - 1 && <div className="how-arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="section">
        <div className="section-header">
          <div className="section-badge">Testimonials</div>
          <h2>Trusted by Healthcare Professionals</h2>
        </div>
        <div className="testimonials-grid">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="testimonial-card">
              <div className="testimonial-stars">
                {Array(t.rating).fill(0).map((_, i) => (
                  <FiStar key={i} size={14} fill="var(--warning)" color="var(--warning)" />
                ))}
              </div>
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">
                <div className="avatar avatar-sm">{t.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{t.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-inner">
          <div className="orb orb-cta-1" />
          <div className="orb orb-cta-2" />
          <div className="cta-content">
            <h2>Ready to Transform Patient Care?</h2>
            <p>Join thousands of healthcare professionals who use HealthTech to deliver better outcomes, faster.</p>
            <div className="hero-cta" style={{ justifyContent: 'center' }}>
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started Free <FiArrowRight />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="nav-brand">
            <div className="nav-logo"><FiHeart /></div>
            <span>HealthTech</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            © 2024 HealthTech. Transforming hospital efficiency through intelligent technology.
          </p>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
