import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
import Navbar from '../components/Navbar'
import styles from './AuthPage.module.css'

const ROLES = [
  { value: 'USER',     label: 'Home Buyer' },
  { value: 'ADMIN',    label: 'SmartPlot Team' },
  { value: 'INVESTOR', label: 'Investor' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, login } = useAuth()
  const [activeTab, setActiveTab] = useState('password')

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.layout}>

        {/* ── Left panel ── */}
        <div className={styles.leftPanel}>
          <div className={styles.leftContent}>
            <p className="section-label" style={{ color: 'var(--gold-light)' }}>Welcome Back</p>
            <h1 className={styles.leftH1}>Sign in to SmartPlot</h1>
            <p className={styles.leftSub}>
              Continue your property search, manage saved plots, and review your bookings.
            </p>
            <div className={styles.leftBenefits}>
              {[
                'Access your saved shortlist',
                'Track all reservations',
                'View payment history',
                'Manage your profile',
              ].map(b => (
                <div key={b} className={styles.benefit}>
                  <span className={styles.benefitDot} />
                  {b}
                </div>
              ))}
            </div>
            <p className={styles.switchPrompt}>
              Don't have an account?{' '}
              <button type="button" onClick={() => navigate('/signup')}>
                Create one free →
              </button>
            </p>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className={styles.rightPanel}>
          <div className={styles.formBox}>

            {/* Tabs */}
            <div className={styles.tabRow}>
              {[
                { id: 'password', label: 'Password' },
                { id: 'otp',      label: 'OTP Login' },
              ].map(t => (
                <button
                  key={t.id}
                  className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {activeTab === 'password' && (
              <PasswordForm onSuccess={data => { login(data); navigate('/dashboard', { replace: true }) }} />
            )}
            {activeTab === 'otp' && (
              <OtpForm onSuccess={data => { login(data); navigate('/dashboard', { replace: true }) }} />
            )}

            {/* ── Forgot password → dedicated page ── */}
            <div className={styles.dividerRow}><span>Trouble signing in?</span></div>
            <button
              type="button"
              className={styles.forgotLink}
              onClick={() => navigate('/reset-password')}
            >
              Forgot your password? Reset it →
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Password login form ── */
function PasswordForm({ onSuccess }) {
  const [f, setF]         = useState({ role: 'USER', email: '', password: '' })
  const [fb, setFb]       = useState({ text: '', type: '' })
  const [loading, setLoading] = useState(false)
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault(); setLoading(true); setFb({ text: '', type: '' })
    try {
      const res = await api('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      })
      onSuccess(res)
    } catch (err) {
      setFb({ text: err.message, type: 'error' })
    } finally { setLoading(false) }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.formHead}>
        <h2>Welcome back</h2>
        <p>Enter your credentials to continue.</p>
      </div>
      <div className="field">
        <label>Continue as</label>
        <select value={f.role} onChange={set('role')}>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Email</label>
        <input type="email" placeholder="john@email.com" value={f.email} onChange={set('email')} required />
      </div>
      <div className="field">
        <label>Password</label>
        <input type="password" placeholder="Your password" value={f.password} onChange={set('password')} required />
      </div>
      {fb.text && <p className={`feedback ${fb.type}`}>{fb.text}</p>}
      <button className="btn-primary" type="submit" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  )
}

/* ── OTP login form ── */
function OtpForm({ onSuccess }) {
  const [f, setF]         = useState({ role: 'USER', email: '', otpCode: '' })
  const [fb, setFb]       = useState({ text: '', type: '' })
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))

  async function sendOtp() {
    setFb({ text: 'Sending OTP…', type: '' })
    try {
      const r = await api('/login/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: f.role, email: f.email }),
      })
      setFb({ text: r.message, type: 'success' })
      setOtpSent(true)
    } catch (err) {
      setFb({ text: err.message, type: 'error' })
    }
  }

  async function submit(e) {
    e.preventDefault(); setLoading(true); setFb({ text: '', type: '' })
    try {
      const res = await api('/login/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      })
      onSuccess(res)
    } catch (err) {
      setFb({ text: err.message, type: 'error' })
    } finally { setLoading(false) }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.formHead}>
        <h2>OTP login</h2>
        <p>Sign in without a password using a one-time code.</p>
      </div>
      <div className="field">
        <label>Continue as</label>
        <select value={f.role} onChange={set('role')}>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Email</label>
        <input type="email" placeholder="john@email.com" value={f.email} onChange={set('email')} required />
      </div>
      {otpSent && (
        <div className="field">
          <label>OTP Code</label>
          <input
            type="text"
            placeholder="6-digit OTP"
            value={f.otpCode}
            onChange={set('otpCode')}
            style={{ letterSpacing: '0.1em' }}
          />
        </div>
      )}
      {fb.text && <p className={`feedback ${fb.type}`}>{fb.text}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className="btn-ghost" style={{ flex: otpSent ? 'none' : 1 }} onClick={sendOtp}>
          {otpSent ? 'Resend' : 'Send OTP'}
        </button>
        {otpSent && (
          <button type="submit" className="btn-primary" style={{ flex: 1, margin: 0 }} disabled={loading}>
            {loading ? 'Verifying…' : 'Verify & Sign In'}
          </button>
        )}
      </div>
    </form>
  )
}