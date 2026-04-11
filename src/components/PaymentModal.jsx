import { useState, useEffect } from 'react'
import { api, fmt } from '../utils/api'
import styles from './PaymentModal.module.css'

const METHODS = [
  { id: 'UPI', label: 'UPI', desc: 'Google Pay, PhonePe, Paytm' },
  { id: 'CARD', label: 'Card', desc: 'Debit or Credit card' },
  { id: 'NETBANKING', label: 'Net Banking', desc: 'All major banks' },
]

export default function PaymentModal({ plot, onClose, onDone }) {
  const [step, setStep] = useState('select')
  const [method, setMethod] = useState('UPI')
  const [outcome, setOutcome] = useState('success')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    document.body.classList.add('modal-open')
    const onKey = (e) => { if (e.key === 'Escape' && step !== 'processing') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.classList.remove('modal-open'); window.removeEventListener('keydown', onKey) }
  }, [onClose, step])

  async function processPayment() {
    setStep('processing'); setError('')
    try {
      const res = await api(`/plots/${plot.plotId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: method, simulateSuccess: outcome === 'success' }),
      })
      setResult(res); setStep('result'); onDone(res)
    } catch (err) { setError(err.message); setStep('confirm') }
  }

  const pricePerSqft = plot.areaSqft > 0 ? Math.round(plot.price / plot.areaSqft) : 0

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && step !== 'processing' && onClose()}>
      <div className={`modal-box ${styles.modal}`}>
        {step !== 'processing' && step !== 'result' && (
          <button className="modal-close" onClick={onClose}>✕</button>
        )}

        {step === 'select' && (
          <div className={styles.body}>
            <div className={styles.header}>
              <p className="section-label">Reserve Plot</p>
              <h2 className={styles.title}>Choose payment method</h2>
              <p className={styles.sub}>Demo flow — no real money is charged</p>
            </div>
            <div className={styles.plotSummary}>
              <div className={styles.plotThumb}>
                {plot.imageUrl ? <img src={plot.imageUrl} alt={plot.plotNumber} /> : <div className={styles.plotThumbFallback}>{plot.plotNumber?.slice(0,3)}</div>}
              </div>
              <div className={styles.plotInfo}>
                <p className={styles.plotNum}>Plot {plot.plotNumber}</p>
                <p className={styles.plotLoc}>{plot.location}</p>
                {pricePerSqft > 0 && <p className={styles.plotRate}>{fmt.compactCurrency(pricePerSqft)}/sqft · {plot.areaSqft} sqft</p>}
              </div>
              <div className={styles.plotPrice}>{fmt.currency(plot.price)}</div>
            </div>
            <div className={styles.methodGrid}>
              {METHODS.map(m => (
                <button key={m.id} className={`${styles.methodCard} ${method === m.id ? styles.methodActive : ''}`} onClick={() => setMethod(m.id)} type="button">
                  <span className={styles.methodLabel}>{m.label}</span>
                  <span className={styles.methodDesc}>{m.desc}</span>
                  {method === m.id && <span className={styles.methodCheck}>✓</span>}
                </button>
              ))}
            </div>
            <button className="btn-gold" style={{ width: '100%', marginTop: 8 }} onClick={() => setStep('confirm')}>
              Continue to Confirm
            </button>
          </div>
        )}

        {step === 'confirm' && (
          <div className={styles.body}>
            <div className={styles.header}>
              <p className="section-label">Confirm Payment</p>
              <h2 className={styles.title}>Review your order</h2>
            </div>
            <div className={styles.orderSummary}>
              <div className={styles.orderRow}><span>Plot</span><strong>{plot.plotNumber} — {plot.location}</strong></div>
              <div className={styles.orderRow}><span>Area</span><strong>{plot.areaSqft} sqft</strong></div>
              <div className={styles.orderRow}><span>Method</span><strong>{method}</strong></div>
              <div className={`${styles.orderRow} ${styles.orderTotal}`}><span>Total Amount</span><strong>{fmt.currency(plot.price)}</strong></div>
            </div>
            <div className={styles.simSection}>
              <p className={styles.simHeading}>Demo mode — choose your simulated outcome</p>
              <div className={styles.simRow}>
                {[{v:'success',label:'Payment Succeeds'},{v:'failure',label:'Payment Fails'}].map(o => (
                  <button key={o.v} type="button"
                    className={`${styles.simBtn} ${outcome === o.v ? styles.simBtnActive : ''}`}
                    style={outcome === o.v ? { borderColor: o.v === 'success' ? 'var(--success)' : 'var(--danger)', background: o.v === 'success' ? 'rgba(28,122,74,0.08)' : 'rgba(192,57,43,0.08)', color: o.v === 'success' ? 'var(--success)' : 'var(--danger)' } : {}}
                    onClick={() => setOutcome(o.v)}
                  >{o.label}</button>
                ))}
              </div>
            </div>
            {error && <p className="feedback error">{error}</p>}
            <div className={styles.confirmActions}>
              <button className="btn-ghost" onClick={() => setStep('select')}>← Back</button>
              <button className="btn-gold" style={{ flex: 1 }} onClick={processPayment}>Pay {fmt.currency(plot.price)}</button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className={styles.processingScreen}>
            <div className={styles.processingSpinner} />
            <p className={styles.processingText}>Processing payment…</p>
            <p className={styles.processingSub}>Please do not close this window</p>
          </div>
        )}

        {step === 'result' && result && (
          <div className={styles.resultScreen}>
            <div className={`${styles.resultIcon} ${result.paymentStatus === 'SUCCESS' ? styles.resultSuccess : styles.resultFail}`}>
              {result.paymentStatus === 'SUCCESS' ? '✓' : '✕'}
            </div>
            <h2 className={styles.resultTitle}>{result.paymentStatus === 'SUCCESS' ? 'Booking Confirmed!' : 'Payment Failed'}</h2>
            <p className={styles.resultSub}>
              {result.paymentStatus === 'SUCCESS'
                ? `Plot ${result.plotNumber || plot.plotNumber} has been reserved under your account.`
                : 'The payment could not be processed. Your booking was not confirmed.'}
            </p>
            <div className={styles.resultDetails}>
              <div className={styles.resultRow}><span>Plot</span><strong>{result.plotNumber || plot.plotNumber}</strong></div>
              <div className={styles.resultRow}><span>Amount</span><strong>{fmt.currency(result.amount || plot.price)}</strong></div>
              <div className={styles.resultRow}><span>Method</span><strong>{result.paymentMethod || method}</strong></div>
              <div className={styles.resultRow}><span>Status</span>
                <strong style={{ color: result.paymentStatus === 'SUCCESS' ? 'var(--success)' : 'var(--danger)' }}>{result.paymentStatus}</strong>
              </div>
              {result.transactionReference && (
                <div className={styles.resultRow}><span>Reference</span><strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{result.transactionReference}</strong></div>
              )}
            </div>
            <div className={styles.resultActions}>
              {result.paymentStatus !== 'SUCCESS' && <button className="btn-gold" onClick={() => { setStep('confirm'); setResult(null) }}>Try Again</button>}
              <button className={result.paymentStatus === 'SUCCESS' ? 'btn-primary' : 'btn-ghost'} onClick={onClose}>
                {result.paymentStatus === 'SUCCESS' ? 'Done' : 'Close'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
