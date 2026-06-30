import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider } from './store/store';
import { AuthProvider, useAuth } from './store/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import JDAnalysisPage from './pages/JDAnalysisPage';
import CandidateUploadPage from './pages/CandidateUploadPage';
import ResultsDashboardPage from './pages/ResultsDashboardPage';
import FilterExportPage from './pages/FilterExportPage';

function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Derive initials from user name
  const initials = user
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'JD';

  return (
    <nav className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-title">TalentAI</div>
        <div className="sidebar-brand-subtitle">Visual Intelligence</div>
      </div>

      {/* Navigation Links */}
      <div className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="material-symbols-outlined">analytics</span>
          JD Analysis
        </NavLink>

        <NavLink to="/candidates" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="material-symbols-outlined">cloud_upload</span>
          Candidate Upload
        </NavLink>

        <NavLink to="/results" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="material-symbols-outlined">dashboard</span>
          Ranking Dashboard
        </NavLink>

        <NavLink to="/filter" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="material-symbols-outlined">filter_list</span>
          Filter & Export
        </NavLink>

        <NavLink to="/jd" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="material-symbols-outlined">settings</span>
          Settings
        </NavLink>
      </div>

      {/* CTA Button */}
      <button className="sidebar-cta" onClick={() => navigate('/')}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
        Analyze New JD
      </button>

      {/* User Profile + Logout */}
      <div className="sidebar-profile">
        <div className="sidebar-profile-avatar">{initials}</div>
        <div style={{ flex: 1 }}>
          <div className="sidebar-profile-name">{user?.name || 'User'}</div>
          <div className="sidebar-profile-role">{user?.role || 'Recruiter'}</div>
        </div>
        <button
          className="sidebar-logout-btn"
          onClick={handleLogout}
          title="Logout"
          aria-label="Logout"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
        </button>
      </div>
    </nav>
  );
}

function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-search">
        <span className="material-symbols-outlined">search</span>
        <input type="text" placeholder="Search candidates..." />
      </div>
      <div className="topbar-actions">
        <button className="topbar-icon-btn">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
        </button>
        <button className="topbar-icon-btn">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>help</span>
        </button>
        <button className="topbar-text-btn">Support</button>
        <button className="topbar-invite-btn">Invite Team</button>
        <div className="topbar-avatar">JD</div>
      </div>
    </header>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <HomePage />
          </motion.div>
        } />
        <Route path="/jd" element={
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <JDAnalysisPage />
          </motion.div>
        } />
        <Route path="/candidates" element={
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <CandidateUploadPage />
          </motion.div>
        } />
        <Route path="/results" element={
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <ResultsDashboardPage />
          </motion.div>
        } />
        <Route path="/filter" element={
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <FilterExportPage />
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function AuthenticatedApp() {
  return (
    <ProtectedRoute>
      <div className="app-layout">
        <Sidebar />
        <TopBar />
        <main className="main-content">
          <AnimatedRoutes />
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Login route — no sidebar/topbar */}
            <Route path="/login" element={<LoginPage />} />
            {/* All other routes — protected with sidebar/topbar */}
            <Route path="/*" element={<AuthenticatedApp />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
