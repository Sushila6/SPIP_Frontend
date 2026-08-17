import { useState, useEffect } from 'react'
import { api, fmt } from '../utils/api'
import DocumentUpload from './DocumentUpload'
import styles from './DocumentsTab.module.css'

export default function DocumentsTab({ refresh }) {
  const [bookings, setBookings]   = useState([])
  const [selected, setSelected]   = useState(null) // { plotId, plotNumber }
  const [submitted, setSubmitted] = useState({})   // { plotId: true }
  const [loading, setLoading]     = useState(true)

  useEffect(() => { loadBookings() }, [refresh])

  async function loadBookings() {
    setLoading(true)
    try {
      const data = await api('/plots/my-bookings')
      setBookings(data || [])
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  function handleComplete(plotId) {
    setSubmitted(s => ({ ...s, [plotId]: true }))
    setSelected(null)
  }

  if (loading) {
    return (
      <div className={styles.loadingRow}>
        <div className={styles.spinner} />
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="empty-state">
        <h3>No bookings yet</h3>
        <p>Reserve a plot and document upload will appear here for each booking.</p>
      </div>
    )
  }

  /* If a plot is selected, show the upload UI */
  if (selected) {
    return (
      <div>
        <button
          className={styles.backBtn}
          onClick={() => setSelected(null)}
        >
          ← Back to bookings
        </button>
        <DocumentUpload
          plotId={selected.plotId}
          plotNumber={selected.plotNumber}
          onComplete={() => handleComplete(selected.plotId)}
        />
      </div>
    )
  }

  /* Booking list with upload status */
  return (
    <div className={styles.wrap}>
      <div className={styles.intro}>
        <p className="section-label">KYC &amp; Documents</p>
        <h2 className={styles.title}>Upload documents for your bookings</h2>
        <p className={styles.sub}>
          Select a reserved plot below to upload your Aadhaar, PAN, and other required documents
          to complete the verification process.
        </p>
      </div>

      <div className={styles.bookingList}>
        {bookings.map(plot => {
          const isDone = submitted[plot.plotId]
          return (
            <div key={plot.plotId} className={`${styles.bookingRow} ${isDone ? styles.bookingRowDone : ''}`}>
              <div className={styles.bookingMedia}>
                {plot.imageUrl
                  ? <img src={plot.imageUrl} alt={plot.plotNumber} />
                  : <div className={styles.bookingFallback}>{plot.plotNumber?.slice(0, 3)}</div>
                }
              </div>

              <div className={styles.bookingInfo}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span className={`badge badge-${plot.status?.toLowerCase()}`}>{plot.status}</span>
                  <span className={`badge badge-${(plot.approvalStatus || 'PENDING').toLowerCase()}`}>
                    {plot.approvalStatus || 'PENDING'}
                  </span>
                </div>
                <h3 className={styles.bookingTitle}>Plot {plot.plotNumber}</h3>
                <p className={styles.bookingMeta}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {plot.location}
                </p>
                <p className={styles.bookingSpec}>
                  {plot.areaSqft} sqft · {fmt.currency(plot.price)} · Owner: {plot.ownerName}
                </p>
              </div>

              <div className={styles.bookingAction}>
                {isDone ? (
                  <div className={styles.submittedBadge}>
                    <span>✓</span> Documents submitted
                  </div>
                ) : (
                  <>
                    <button
                      className="btn-primary btn-sm"
                      onClick={() => setSelected({ plotId: plot.plotId, plotNumber: plot.plotNumber })}
                    >
                      Upload Documents
                    </button>
                    <p className={styles.actionNote}>KYC required to proceed</p>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className={styles.helpNote}>
        <span>💡</span>
        <p>
          Required documents: <strong>Aadhaar Card</strong> and <strong>PAN Card</strong>.
          Optional: income proof, address proof, bank statement, and passport photo.
          All files must be PDF, JPG, or PNG under 5 MB.
          
        </p>
      </div>
    </div>
  )
}