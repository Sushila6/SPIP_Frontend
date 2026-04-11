import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
import Navbar from '../components/Navbar'
import styles from './AuthPage.module.css'
import rpStyles from './ResetPasswordPage.module.css'

const ROLES = [
  { value: 'USER',     label: 'Home Buyer' },
  { value: 'ADMIN',    label: 'SmartPlot Team' },
  { value: 'INVESTOR', label: 'Investor' },
]

const STEPS = ['Email', 'OTP', 'New Password', 'Done']

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const [step, setStep] = useState(0) // 0=email, 1=otp, 2=newpwd, 3=done
  const [role, setRole]       = useState('USER')
  const [email, setEmail]     = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPwd, setNewPwd]   = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [loading, setLoading] = useState(false)
  const [fb, setFb]           = useState({ text: '', type: '' })

  /* Step 0 → send OTP */
  async function handleSendOtp(e) {
    e.preventDefault()
    if (!email.trim()) { setFb({ text: 'Please enter your email address.', type: 'error' }); return }
    setLoading(true); setFb({ text: '', type: '' })
    try {
      const res = await api('/login/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, email: email.trim() }),
      })
      setFb({ text: res.message, type: 'success' })
      setTimeout(() => { setFb({ text: '', type: '' }); setStep(1) }, 1200)
    } catch (err) {
      setFb({ text: err.message, type: 'error' })
    } finally { setLoading(false) }
  }

  /* Step 1 → verify OTP (just advance, actual reset happens at step 2) */
  function handleVerifyOtp(e) {
    e.preventDefault()
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setFb({ text: 'Please enter the 6-digit OTP from your email.', type: 'error' })
      return
    }
    setFb({ text: '', type: '' })
    setStep(2)
  }

  /* Step 2 → reset password */
  async function handleReset(e) {
    e.preventDefault()
    if (newPwd.length < 6) { setFb({ text: 'Password must be at least 6 characters.', type: 'error' }); return }
    if (newPwd !== confirmPwd) { setFb({ text: 'Passwords do not match.', type: 'error' }); return }
    setLoading(true); setFb({ text: '', type: '' })
    try {
      await api('/login/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, email: email.trim(), otpCode: otpCode.trim(), newPassword: newPwd }),
      })
      setStep(3)
    } catch (err) {
      setFb({ text: err.message, type: 'error' })
      /* if OTP invalid, go back to OTP step */
      if (err.message.toLowerCase().includes('otp')) setStep(1)
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={rpStyles.layout}>

        {/* ── Left panel ── */}
        <div className={rpStyles.left}>
          <div className={rpStyles.leftContent}>
            <p className="section-label" style={{ color: 'var(--gold-light)' }}>Account Security</p>
            <h1 className={rpStyles.leftH1}>Reset your password</h1>
            <p className={rpStyles.leftSub}>
              We'll send a one-time code to your registered email. Use it to set a new password in just a few steps.
            </p>

            {/* Steps indicator */}
            <div className={rpStyles.stepsList}>
              {STEPS.map((s, i) => (
                <div key={s} className={`${rpStyles.stepItem} ${i === step ? rpStyles.stepActive : ''} ${i < step ? rpStyles.stepDone : ''}`}>
                  <div className={rpStyles.stepBubble}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span>{s}</span>
                </div>
              ))}
            </div>

            <div className={rpStyles.leftLinks}>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem' }}>
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  style={{ background: 'none', border: 'none', color: 'var(--gold-light)', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
                >
                  Sign in →
                </button>
              </p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem', marginTop: 10 }}>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  style={{ background: 'none', border: 'none', color: 'var(--gold-light)', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
                >
                  Create one →
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className={rpStyles.right}>
          <div className={rpStyles.formBox}>

            {/* Progress bar */}
            <div className={rpStyles.progressBar}>
              <div className={rpStyles.progressFill} style={{ width: `${((step) / (STEPS.length - 1)) * 100}%` }} />
            </div>
            <p className={rpStyles.stepLabel}>Step {Math.min(step + 1, STEPS.length)} of {STEPS.length} — {STEPS[step]}</p>

            {/* ── Step 0: Email ── */}
            {step === 0 && (
              <form className={rpStyles.form} onSubmit={handleSendOtp}>
                <div className={rpStyles.formHead}>
                  <h2>Enter your email</h2>
                  <p>We'll send a reset code to your registered email address.</p>
                </div>

                <div className="field">
                  <label>Account type</label>
                  <select value={role} onChange={e => setRole(e.target.value)}>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>

                <div className="field">
                  <label>Email address</label>
                  <input
                    type="email"
                    placeholder="john@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {fb.text && <p className={`feedback ${fb.type}`}>{fb.text}</p>}

                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
                  {loading ? 'Sending OTP…' : 'Send Reset Code'}
                </button>
              </form>
            )}

            {/* ── Step 1: OTP ── */}
            {step === 1 && (
              <form className={rpStyles.form} onSubmit={handleVerifyOtp}>
                <div className={rpStyles.formHead}>
                  <h2>Enter the OTP</h2>
                  <p>Check your inbox at <strong style={{ color: 'var(--forest)' }}>{email}</strong> for the 6-digit code.</p>
                </div>

                <div className={rpStyles.otpNote}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Code sent to {email}
                </div>

                <div className="field">
                  <label>6-digit OTP code</label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                    autoFocus
                    style={{ fontSize: '1.2rem', letterSpacing: '0.2em', textAlign: 'center' }}
                  />
                </div>

                {fb.text && <p className={`feedback ${fb.type}`}>{fb.text}</p>}

                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 4 }}>
                  Verify Code
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => { setStep(0); setFb({ text: '', type: '' }) }}>
                    ← Change email
                  </button>
                  <button type="button" className="btn-ghost btn-sm" onClick={handleSendOtp} disabled={loading}>
                    {loading ? 'Sending…' : 'Resend OTP'}
                  </button>
                </div>
              </form>
            )}

            {/* ── Step 2: New Password ── */}
            {step === 2 && (
              <form className={rpStyles.form} onSubmit={handleReset}>
                <div className={rpStyles.formHead}>
                  <h2>Set new password</h2>
                  <p>Choose a strong password with at least 6 characters.</p>
                </div>

                <div className="field">
                  <label>New password</label>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="field">
                  <label>Confirm new password</label>
                  <input
                    type="password"
                    placeholder="Repeat your new password"
                    value={confirmPwd}
                    onChange={e => setConfirmPwd(e.target.value)}
                    required
                  />
                </div>

                {/* Password strength indicator */}
                {newPwd.length > 0 && (
                  <div className={rpStyles.strengthRow}>
                    <div className={rpStyles.strengthBars}>
                      {[1, 2, 3, 4].map(n => (
                        <div
                          key={n}
                          className={rpStyles.strengthBar}
                          style={{
                            background: newPwd.length >= n * 3
                              ? n <= 1 ? 'var(--danger)'
                              : n <= 2 ? '#C4870A'
                              : n <= 3 ? 'var(--gold)'
                              : 'var(--success)'
                              : 'var(--sand)'
                          }}
                        />
                      ))}
                    </div>
                    <span className={rpStyles.strengthLabel}>
                      {newPwd.length < 4 ? 'Too short' : newPwd.length < 7 ? 'Weak' : newPwd.length < 10 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                )}

                {confirmPwd && newPwd !== confirmPwd && (
                  <p className="feedback error">Passwords do not match</p>
                )}
                {confirmPwd && newPwd === confirmPwd && (
                  <p className="feedback success">Passwords match ✓</p>
                )}
                {fb.text && <p className={`feedback ${fb.type}`}>{fb.text}</p>}

                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
                  {loading ? 'Resetting…' : 'Reset Password'}
                </button>

                <button type="button" className="btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => { setStep(1); setFb({ text: '', type: '' }) }}>
                  ← Back to OTP
                </button>
              </form>
            )}

            {/* ── Step 3: Done ── */}
            {step === 3 && (
              <div className={rpStyles.successScreen}>
                <div className={rpStyles.successIcon}>✓</div>
                <h2 className={rpStyles.successTitle}>Password reset!</h2>
                <p className={rpStyles.successSub}>
                  Your password has been updated successfully. You can now sign in with your new password.
                </p>
                <button
                  className="btn-primary"
                  style={{ width: '100%', marginTop: 8 }}
                  onClick={() => navigate('/login')}
                >
                  Sign In Now
                </button>
                <button
                  className="btn-ghost"
                  style={{ width: '100%', marginTop: 8 }}
                  onClick={() => navigate('/')}
                >
                  Back to Home
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}