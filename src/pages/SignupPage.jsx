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

export default function SignupPage() {
  const navigate = useNavigate()
  const { isAuthenticated, login } = useAuth()

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.layout}>

        {/* ── Left info panel ── */}
        <div className={styles.leftPanel}>
          <div className={styles.leftContent}>
            <p className="section-label" style={{ color: 'var(--gold-light)' }}>New Account</p>
            <h1 className={styles.leftH1}>Join SmartPlot Estates</h1>
            <p className={styles.leftSub}>
              Create your account and start exploring verified plots in just a few steps.
            </p>
            <div className={styles.leftBenefits}>
              {[
                'Browse approved plot listings',
                'Save and compare your favourites',
                'Reserve plots with one click',
                'Track bookings and payments',
              ].map(b => (
                <div key={b} className={styles.benefit}>
                  <span className={styles.benefitDot} />
                  {b}
                </div>
              ))}
            </div>

            {/* ── FIX: use button + navigate instead of <a href> ── */}
            <p className={styles.switchPrompt}>
              Already have an account?{' '}
              <button type="button" onClick={() => navigate('/login')}>
                Sign in instead →
              </button>
            </p>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className={styles.rightPanel}>
          <div className={styles.formBox}>
            <SignupForm onSuccess={data => { login(data); navigate('/dashboard', { replace: true }) }} />

            {/* ── Reset password link ── */}
            <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--muted)', marginTop: 16 }}>
              Forgot your password?{' '}
              <button
                type="button"
                onClick={() => navigate('/reset-password')}
                style={{
                  background: 'none', border: 'none', color: 'var(--gold)',
                  fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem',
                  padding: 0,
                }}
              >
                Reset it here →
              </button>
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

/* ── Signup form with 2-step OTP flow ── */
function SignupForm({ onSuccess }) {
  const [f, setF] = useState({
    role: 'USER', name: '', email: '',
    password: '', phone: '', otpCode: '',
  })
  const [fb, setFb]         = useState({ text: '', type: '' })
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)

  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))

  async function sendOtp() {
    if (!f.name || !f.email || !f.password || !f.phone) {
      setFb({ text: 'Please fill in all fields before requesting an OTP.', type: 'error' })
      return
    }
    setFb({ text: 'Sending OTP…', type: '' })
    try {
      const res = await api('/signup/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: f.role, name: f.name.trim(),
          email: f.email.trim(), password: f.password,
          phone: f.phone.trim(),
        }),
      })
      setFb({ text: res.message, type: 'success' })
      setOtpSent(true)
    } catch (err) {
      setFb({ text: err.message, type: 'error' })
    }
  }

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setFb({ text: '', type: '' })
    try {
      const res = await api('/signup/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: f.role,
          email: f.email.trim(),
          otpCode: f.otpCode.trim(),
        }),
      })
      onSuccess(res)
    } catch (err) {
      setFb({ text: err.message, type: 'error' })
    } finally { setLoading(false) }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.formHead}>
        <h2>Create your account</h2>
        <p>Fill in your details. We'll send a 6-digit OTP to verify your email.</p>
      </div>

      <div className="field">
        <label>I am joining as</label>
        <select value={f.role} onChange={set('role')}>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      <div className="field">
        <label>Full name</label>
        <input type="text" placeholder="John Carter" value={f.name} onChange={set('name')} required />
      </div>

      <div className="field">
        <label>Email address</label>
        <input type="email" placeholder="john@email.com" value={f.email} onChange={set('email')} required />
      </div>

      <div className="field">
        <label>Create password</label>
        <input type="password" placeholder="Minimum 6 characters" value={f.password} onChange={set('password')} required />
      </div>

      <div className="field">
        <label>Phone number</label>
        <input type="text" placeholder="9876543210" value={f.phone} onChange={set('phone')} required />
      </div>

      {fb.text && <p className={`feedback ${fb.type}`}>{fb.text}</p>}

      {!otpSent ? (
        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%' }}
          onClick={sendOtp}
        >
          Send OTP to Email
        </button>
      ) : (
        <>
          <div className="field">
            <label>Email OTP</label>
            <input
              type="text"
              placeholder="Enter 6-digit OTP from your email"
              value={f.otpCode}
              onChange={set('otpCode')}
              required
              style={{ letterSpacing: '0.1em' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-ghost" onClick={sendOtp}>
              Resend OTP
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 1, margin: 0 }}
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Verify & Create Account'}
            </button>
          </div>
        </>
      )}

      {/* ── FIX: button instead of <a href> ── */}
      <SignInLink />
    </form>
  )
}

function SignInLink() {
  const navigate = useNavigate()
  return (
    <p style={{ fontSize: '0.82rem', color: 'var(--muted)', textAlign: 'center', marginTop: 4 }}>
      Already have an account?{' '}
      <button
        type="button"
        onClick={() => navigate('/login')}
        style={{
          background: 'none', border: 'none',
          color: 'var(--forest)', fontWeight: 600,
          cursor: 'pointer', padding: 0, fontSize: 'inherit',
        }}
      >
        Sign in
      </button>
    </p>
  )
}