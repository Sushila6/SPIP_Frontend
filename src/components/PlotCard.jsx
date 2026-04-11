import { fmt } from '../utils/api'
import styles from './PlotCard.module.css'

function PlotMedia({ plot, height = 220 }) {
  if (plot.imageUrl) {
    return <img className="plot-img" src={plot.imageUrl} alt={plot.plotNumber} style={{ height }} />
  }
  const initials = plot.plotNumber?.replace(/[^A-Za-z0-9]/g, '').slice(0, 4) || 'PLOT'
  return (
    <div className="plot-img-fallback" style={{ height }}>
      {initials}
    </div>
  )
}

export { PlotMedia }

export default function PlotCard({ plot, favIds = [], onDetails, onBook, onFavorite, onApprove, onReject, onEdit, onDelete, isAdmin, style }) {
  const approval = plot.approvalStatus || 'PENDING'
  const isFav = favIds.includes(plot.plotId)
  const canBook = plot.status === 'AVAILABLE' && approval === 'APPROVED' && !isAdmin
  const pricePerSqft = plot.areaSqft > 0 ? Math.round(plot.price / plot.areaSqft) : 0

  return (
    <article className={styles.card} style={style}>
      <div className={styles.media} onClick={() => onDetails(plot)}>
        <PlotMedia plot={plot} height={220} />
        <div className={styles.mediaOverlay}>
          <span className={`badge badge-${plot.status?.toLowerCase()}`}>{plot.status}</span>
          <span className={`badge badge-${approval?.toLowerCase()}`}>{approval}</span>
        </div>
        <div className={styles.viewHint}>View Details</div>
      </div>

      <div className={styles.body}>
        <div className={styles.location}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          {plot.location}
        </div>

        <h3 className={styles.title} onClick={() => onDetails(plot)}>
          Plot {plot.plotNumber}
        </h3>

        <div className={styles.specs}>
          <div className={styles.spec}>
            <span className={styles.specLabel}>Area</span>
            <span className={styles.specVal}>{plot.areaSqft} sqft</span>
          </div>
          <div className={styles.specDiv}></div>
          <div className={styles.spec}>
            <span className={styles.specLabel}>Owner</span>
            <span className={styles.specVal}>{plot.ownerName}</span>
          </div>
          {pricePerSqft > 0 && (
            <>
              <div className={styles.specDiv}></div>
              <div className={styles.spec}>
                <span className={styles.specLabel}>Rate</span>
                <span className={styles.specVal}>{fmt.compactCurrency(pricePerSqft)}/sqft</span>
              </div>
            </>
          )}
        </div>

        <div className={styles.priceRow}>
          <span className={styles.price}>{fmt.currency(plot.price)}</span>
          {plot.bookedByName && (
            <span className={styles.bookedBy}>Booked by {plot.bookedByName}</span>
          )}
        </div>

        <div className={styles.actions}>
          <button className="btn-outline btn-sm" onClick={() => onDetails(plot)}>Details</button>
          {canBook && (
            <button className="btn-gold btn-sm" onClick={() => onBook(plot)}>Reserve</button>
          )}
          {!isAdmin && approval === 'APPROVED' && (
            <button className={`${styles.favBtn} ${isFav ? styles.favActive : ''}`} onClick={() => onFavorite(plot)} title={isFav ? 'Remove from saved' : 'Save plot'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          )}
          {isAdmin && approval === 'PENDING' && (
            <button className="btn-ghost btn-sm" style={{ color: 'var(--success)' }} onClick={() => onApprove(plot)}>Approve</button>
          )}
          {isAdmin && approval !== 'REJECTED' && plot.status === 'AVAILABLE' && (
            <button className="btn-danger btn-sm" onClick={() => onReject(plot)}>Reject</button>
          )}
          {isAdmin && (
            <>
              <button className="btn-ghost btn-sm" onClick={() => onEdit(plot)}>Edit</button>
              <button className="btn-danger btn-sm" onClick={() => onDelete(plot)}>Delete</button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
