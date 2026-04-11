import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { PlotMedia } from './PlotCard'
import { api, fmt } from '../utils/api'
import styles from './PlotDetailsModal.module.css'

export default function PlotDetailsModal({ plot: initialPlot, favIds = [], onClose, onBook, onFavorite, onEdit, onDelete, onApprove, onReject }) {
  const { isAdmin, currentUser } = useAuth()
  const admin = isAdmin()
  const [plot, setPlot] = useState(initialPlot)
  const [actionFb, setActionFb] = useState('')

  const approval = plot.approvalStatus || 'PENDING'
  const isFav = favIds.includes(plot.plotId)
  const canBook = plot.status === 'AVAILABLE' && approval === 'APPROVED' && !admin
  const pricePerSqft = plot.areaSqft > 0 ? Math.round(plot.price / plot.areaSqft) : 0

  useEffect(() => {
    document.body.classList.add('modal-open')
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.classList.remove('modal-open'); window.removeEventListener('keydown', onKey) }
  }, [onClose])

  async function doApprove() {
    setActionFb('Approving…')
    try {
      const updated = await api(`/plots/${plot.plotId}/approve`, { method: 'POST' })
      setPlot(updated); setActionFb('Approved successfully.')
      onApprove && onApprove(updated)
    } catch (e) { setActionFb(e.message) }
  }

  async function doReject() {
    setActionFb('Rejecting…')
    try {
      const updated = await api(`/plots/${plot.plotId}/reject`, { method: 'POST' })
      setPlot(updated); setActionFb('Rejected.')
      onReject && onReject(updated)
    } catch (e) { setActionFb(e.message) }
  }

  async function doFavorite() {
    await onFavorite(plot)
    setPlot(p => ({ ...p, _favToggled: !p._favToggled }))
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-box ${styles.modal}`}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Hero Image */}
        <div className={styles.hero}>
          <PlotMedia plot={plot} height={300} />
          <div className={styles.heroOverlay}>
            <div className={styles.heroContent}>
              <div className={styles.heroBadges}>
                <span className={`badge badge-${plot.status?.toLowerCase()}`}>{plot.status}</span>
                <span className={`badge badge-${approval?.toLowerCase()}`}>{approval}</span>
              </div>
              <h2 className={styles.heroTitle}>Plot {plot.plotNumber}</h2>
              <p className={styles.heroLocation}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {plot.location}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.body}>
          {/* Price + CTA row */}
          <div className={styles.priceSection}>
            <div>
              <p className="section-label">Listed Price</p>
              <p className={styles.bigPrice}>{fmt.currency(plot.price)}</p>
              {pricePerSqft > 0 && <p className={styles.rate}>{fmt.compactCurrency(pricePerSqft)} per sqft</p>}
            </div>
            <div className={styles.ctaGroup}>
              {canBook && (
                <button className="btn-gold" onClick={() => onBook(plot)}>
                  Reserve This Plot
                </button>
              )}
              {!admin && approval === 'APPROVED' && (
                <button className={isFav ? styles.savedBtn : styles.saveBtn} onClick={doFavorite}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  {isFav ? 'Saved' : 'Save Plot'}
                </button>
              )}
              {plot.status === 'RESERVED' && !admin && (
                <div className={styles.reservedNote}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  This plot is currently reserved
                </div>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className={styles.statsGrid}>
            {[
              { label: 'Plot Number', value: plot.plotNumber },
              { label: 'Area', value: `${plot.areaSqft} sqft` },
              { label: 'Owner', value: plot.ownerName },
              { label: 'Status', value: <span className={`badge badge-${plot.status?.toLowerCase()}`}>{plot.status}</span> },
              { label: 'Approval', value: <span className={`badge badge-${approval?.toLowerCase()}`}>{approval}</span> },
              { label: 'Booked By', value: plot.bookedByName || '—' },
            ].map(s => (
              <div key={s.label} className={styles.stat}>
                <span className={styles.statLabel}>{s.label}</span>
                <span className={styles.statVal}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className={styles.descSection}>
            <div className={styles.descCard}>
              <p className="section-label">Property Summary</p>
              <p className={styles.descText}>
                Plot {plot.plotNumber} is a {plot.status?.toLowerCase()} residential plot at {plot.location},
                spanning {plot.areaSqft} sqft and listed at {fmt.currency(plot.price)}
                {pricePerSqft > 0 ? ` (${fmt.compactCurrency(pricePerSqft)}/sqft)` : ''}.
                Approval status: {approval?.toLowerCase()}.
                {plot.bookedByName && ` Reserved by ${plot.bookedByName}.`}
              </p>
            </div>
            <div className={styles.descCard}>
              <p className="section-label">
                {approval === 'APPROVED' && plot.status === 'AVAILABLE' ? 'Investment Note'
                  : approval === 'PENDING' ? 'Under Review'
                  : approval === 'REJECTED' ? 'Listing Status'
                  : 'Market Note'}
              </p>
              <p className={styles.descText}>
                {approval === 'APPROVED' && plot.status === 'AVAILABLE'
                  ? `This verified listing is open for reservation at ${pricePerSqft > 0 ? fmt.compactCurrency(pricePerSqft) + '/sqft' : fmt.currency(plot.price)}. A clear entry point for buyers and investors in ${plot.location}.`
                  : approval === 'APPROVED' && plot.status === 'RESERVED'
                  ? 'This plot is currently reserved, signalling strong demand. It may become available again if the booking is cancelled.'
                  : approval === 'APPROVED' && plot.status === 'SOLD'
                  ? 'This plot has been sold and reflects recent market activity in this corridor.'
                  : approval === 'PENDING'
                  ? 'This listing is awaiting approval from the SmartPlot team. It will appear in the public catalogue once approved.'
                  : 'This listing has been rejected from the catalogue. Admin action required to reactivate it.'}
              </p>
            </div>
          </div>

          {/* Admin Controls */}
          {admin && (
            <div className={styles.adminPanel}>
              <p className="section-label">Admin Controls</p>
              <div className={styles.adminActions}>
                {approval === 'PENDING' && (
                  <button className={styles.approveBtn} onClick={doApprove}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
                    Approve Listing
                  </button>
                )}
                {approval === 'APPROVED' && (
                  <button className={styles.rejectBtn} onClick={doReject}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Reject Listing
                  </button>
                )}
                {approval === 'REJECTED' && (
                  <button className={styles.approveBtn} onClick={doApprove}>Re-approve Listing</button>
                )}
                <button className="btn-outline btn-sm" onClick={() => { onClose(); onEdit && onEdit(plot) }}>
                  Edit Details
                </button>
                <button className="btn-danger" onClick={() => { onDelete && onDelete(plot); onClose() }}>
                  Delete Listing
                </button>
              </div>
              {actionFb && (
                <p className={`feedback ${actionFb.includes('success') || actionFb.includes('Approved') || actionFb.includes('Rejected') ? 'success' : 'error'}`} style={{ marginTop: 8 }}>
                  {actionFb}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
