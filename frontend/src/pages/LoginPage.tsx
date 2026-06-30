import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../store/AuthContext';

/**
 * LoginPage — Professional login page matching the existing TalentAI design system.
 * Uses the same glassmorphism, colors, typography, animations, and button styles.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login, error, clearError, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    clearError();

    // Client-side validation
    if (!email.trim()) {
      setValidationError('Email is required');
      return;
    }
    if (!email.includes('@')) {
      setValidationError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setValidationError('Password is required');
      return;
    }
    if (password.length < 4) {
      setValidationError('Password must be at least 4 characters');
      return;
    }

    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch {
      // Error is handled by AuthContext and displayed below
    }
  };

  const displayError = validationError || error;

  return (
    <div className="login-page">
      {/* Decorative background elements */}
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />
      <div className="login-bg-orb login-bg-orb-3" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="login-card"
      >
        {/* Brand Header */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--emerald)' }}>
              psychology
            </span>
          </div>
          <div className="login-brand-title">TalentAI</div>
          <div className="login-brand-subtitle">Visual Intelligence</div>
        </div>

        {/* Welcome Text */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <h1 className="font-title-md" style={{ color: 'var(--on-surface)', marginBottom: '4px' }}>
            Welcome back
          </h1>
          <p className="font-label-sm" style={{ color: 'var(--on-surface-variant)' }}>
            Sign in to your recruitment dashboard
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Email Field */}
          <div className="login-field-group">
            <label className="login-field-label">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>mail</span>
              Email
            </label>
            <div className="login-input-wrapper">
              <input
                type="email"
                className="input-field"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setValidationError(''); }}
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="login-field-group">
            <label className="login-field-label">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>lock</span>
              Password
            </label>
            <div className="login-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setValidationError(''); }}
                autoComplete="current-password"
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {displayError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="login-error"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
              {displayError}
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-lg login-submit-btn"
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? (
              <>
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                Signing in...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>login</span>
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="login-footer">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>shield</span>
          Secured with JWT authentication
        </div>
      </motion.div>
    </div>
  );
}
