import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api, apiBlob, fmt } from '../utils/api'
import Navbar from '../components/Navbar'
import PlotCard from '../components/PlotCard'
import PlotDetailsModal from '../components/PlotDetailsModal'
import PaymentModal from '../components/PaymentModal'
import styles from './DashboardPage.module.css'

/* ── Nav config per role ── */
const NAV = {
  USER:     [{ id:'overview',label:'Overview'}, {id:'plots',label:'Browse Plots'}, {id:'bookings',label:'My Bookings'}, {id:'favorites',label:'Saved Plots'}, {id:'payments',label:'Payments'}, {id:'notifications',label:'Notifications'}, {id:'profile',label:'Profile'}],
  INVESTOR: [{ id:'overview',label:'Overview'}, {id:'plots',label:'Browse Plots'}, {id:'favorites',label:'Watchlist'}, {id:'bookings',label:'Reservations'}, {id:'payments',label:'Payments'}, {id:'notifications',label:'Notifications'}, {id:'profile',label:'Profile'}],
  ADMIN:    [{ id:'overview',label:'Overview'}, {id:'plots',label:'All Listings'}, {id:'manage',label:'Add / Edit Plot'}, {id:'analytics',label:'Analytics'}, {id:'users',label:'Users'}, {id:'notifications',label:'Notifications'}, {id:'profile',label:'Profile'}],
}

/* ── Icon map ── */
const ICON_PATHS = {
  overview:      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>,
  plots:         <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>,
  manage:        <><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></>,
  analytics:     <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  users:         <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  bookings:      <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
  payments:      <><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
  favorites:     <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
  notifications: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
  profile:       <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
}

function Icon({ id, size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      {ICON_PATHS[id] || ICON_PATHS.overview}
    </svg>
  )
}

/* ═══════════════════════════════════════════════ MAIN PAGE ══ */
export default function DashboardPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin, currentUser, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [detailsPlot, setDetailsPlot] = useState(null)
  const [paymentPlot, setPaymentPlot] = useState(null)
  const [favIds, setFavIds] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const bump = useCallback(() => setRefresh(r => r + 1), [])

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true })
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (!isAuthenticated) return
    if (!isAdmin()) loadFavs()
    else loadAnalytics()
  }, [isAuthenticated, refresh])

  async function loadFavs() {
    try { setFavIds(((await api('/plots/favorites')) || []).map(p => p.plotId)) }
    catch { setFavIds([]) }
  }
  async function loadAnalytics() {
    try { setAnalytics(await api('/admin/analytics')) } catch {}
  }

  /* plot actions */
  async function handleFavorite(plot) {
    const isFav = favIds.includes(plot.plotId)
    try { await api(`/plots/${plot.plotId}/favorite`, { method: isFav ? 'DELETE' : 'POST' }); bump() } catch {}
  }
  async function handleApprove(plot) {
    try { await api(`/plots/${plot.plotId}/approve`, { method: 'POST' }); bump() } catch {}
  }
  async function handleReject(plot) {
    try { await api(`/plots/${plot.plotId}/reject`, { method: 'POST' }); bump() } catch {}
  }
  async function handleDelete(plot) {
    if (!window.confirm(`Delete plot ${plot.plotNumber}? This cannot be undone.`)) return
    try { await api(`/plots/${plot.plotId}`, { method: 'DELETE' }); bump() } catch {}
  }
  function handleEdit(plot) { setActiveTab('manage') }

  if (!isAuthenticated || !currentUser) return null
  const role = currentUser.role
  const navItems = NAV[role] || NAV.USER

  const sharedProps = {
    favIds, refresh, isAdmin: isAdmin(), role,
    onDetails: setDetailsPlot,
    onBook: setPaymentPlot,
    onFavorite: handleFavorite,
    onApprove: handleApprove,
    onReject: handleReject,
    onEdit: handleEdit,
    onDelete: handleDelete,
    bump,
  }

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sideHeader}>
          <button className={styles.sideLogo} onClick={() => navigate('/')}>
            <span className={styles.sideLogoMark}>SP</span>
            <span className={styles.sideLogoText}>SmartPlot</span>
          </button>
        </div>

        <div className={styles.sideUser}>
          <div className={styles.sideAvatar}>{currentUser.name?.[0]}</div>
          <div className={styles.sideUserInfo}>
            <p className={styles.sideName}>{currentUser.name}</p>
            <p className={styles.sideEmail}>{currentUser.email}</p>
            <span className={`badge badge-${role?.toLowerCase()}`}>{role}</span>
          </div>
        </div>

        <nav className={styles.sideNav}>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`${styles.sideLink} ${activeTab === item.id ? styles.sideLinkActive : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon id={item.id} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button className={styles.sideLogout} onClick={() => { logout(); navigate('/') }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16,17 21,12 16,7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign Out
        </button>
      </aside>

      <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <h1 className={styles.topbarTitle}>
              {navItems.find(n => n.id === activeTab)?.label || 'Dashboard'}
            </h1>
            <p className={styles.topbarSub}>
              {role === 'ADMIN'
                ? 'Managing the SmartPlot marketplace'
                : role === 'INVESTOR'
                ? 'Your investment portfolio view'
                : 'Your personal property journey'}
            </p>
          </div>
          <div className={styles.topbarRight}>
            <span className={styles.topbarUser}>
              <span className={styles.onlineDot}></span>
              {currentUser.name?.split(' ')[0]}
            </span>
          </div>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'overview'      && <OverviewTab analytics={analytics} {...sharedProps} onTabChange={setActiveTab} />}
          {activeTab === 'plots'         && <PlotsTab {...sharedProps} />}
          {activeTab === 'manage'        && isAdmin() && <ManagePlotTab bump={bump} />}
          {activeTab === 'analytics'     && isAdmin() && <AnalyticsTab analytics={analytics} onRefresh={() => { loadAnalytics(); bump() }} />}
          {activeTab === 'users'         && isAdmin() && <UsersTab refresh={refresh} />}
          {activeTab === 'bookings'      && !isAdmin() && <BookingsTab {...sharedProps} />}
          {activeTab === 'payments'      && !isAdmin() && <PaymentsTab refresh={refresh} />}
          {activeTab === 'favorites'     && !isAdmin() && <FavoritesTab {...sharedProps} />}
          {activeTab === 'notifications' && <NotificationsTab refresh={refresh} />}
          {activeTab === 'profile'       && <ProfileTab />}
        </div>
      </main>

      {detailsPlot && (
        <PlotDetailsModal
          plot={detailsPlot} favIds={favIds}
          onClose={() => setDetailsPlot(null)}
          onBook={p => { setDetailsPlot(null); setPaymentPlot(p) }}
          onFavorite={handleFavorite}
          onEdit={p => { setDetailsPlot(null); handleEdit(p) }}
          onDelete={p => { handleDelete(p); setDetailsPlot(null) }}
          onApprove={p => { handleApprove(p); setDetailsPlot({ ...p, approvalStatus: 'APPROVED' }) }}
          onReject={p => { handleReject(p); setDetailsPlot({ ...p, approvalStatus: 'REJECTED' }) }}
        />
      )}
      {paymentPlot && (
        <PaymentModal
          plot={paymentPlot}
          onClose={() => setPaymentPlot(null)}
          onDone={(res) => { bump(); if (res?.paymentStatus === 'SUCCESS') setActiveTab('bookings') }}
        />
      )}
    </div>
  )
}

/* ═══════════════════════ OVERVIEW TAB ══ */
function OverviewTab({ analytics, isAdmin, role, favIds, onTabChange, bump }) {
  const { currentUser } = useAuth()
  const [recentPlots, setRecentPlots] = useState([])

  useEffect(() => {
    api('/plots?status=AVAILABLE').then(d => setRecentPlots((d || []).slice(0,3))).catch(() => {})
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (isAdmin) return <AdminOverview analytics={analytics} onTabChange={onTabChange} />
  if (role === 'INVESTOR') return <InvestorOverview recentPlots={recentPlots} favIds={favIds} onTabChange={onTabChange} analytics={analytics} />
  return <BuyerOverview recentPlots={recentPlots} favIds={favIds} onTabChange={onTabChange} greeting={greeting} user={currentUser} bump={bump} />
}

function BuyerOverview({ recentPlots, favIds, onTabChange, greeting, user, bump }) {
  const [counts, setCounts] = useState({ bookings: 0, favs: 0, payments: 0, notifications: 0 })
  useEffect(() => {
    Promise.all([
      api('/plots/my-bookings').catch(() => []),
      api('/plots/favorites').catch(() => []),
      api('/payments/my').catch(() => []),
      api('/notifications/my').catch(() => []),
    ]).then(([b,f,p,n]) => setCounts({ bookings: b?.length||0, favs: f?.length||0, payments: p?.length||0, notifications: n?.filter(x=>!x.read)?.length||0 }))
  }, [])

  return (
    <div className={styles.tab}>
      <div className={styles.overviewGreeting}>
        <div>
          <p className={styles.greetText}>{greeting}, {user?.name?.split(' ')[0]} 👋</p>
          <p className="text-muted">Here's your property journey at a glance.</p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => onTabChange('plots')}>Browse Plots</button>
      </div>

      <div className={styles.statsRow}>
        {[
          { label: 'Active Bookings', val: counts.bookings, tab: 'bookings', color: 'var(--forest)' },
          { label: 'Saved Plots',     val: counts.favs,     tab: 'favorites', color: 'var(--gold)' },
          { label: 'Payments Made',   val: counts.payments, tab: 'payments',  color: 'var(--forest-mid)' },
          { label: 'Unread Alerts',   val: counts.notifications, tab:'notifications', color: 'var(--gold)' },
        ].map(s => (
          <button key={s.label} className={styles.statCard} onClick={() => onTabChange(s.tab)}>
            <span className={styles.statNum} style={{ color: s.color }}>{s.val}</span>
            <span className={styles.statLabel}>{s.label}</span>
            <span className={styles.statArrow}>→</span>
          </button>
        ))}
      </div>

      <div className={styles.overviewSection}>
        <div className={styles.sectionRowHead}>
          <p className="section-label">Recent Available Plots</p>
          <button className={styles.seeAll} onClick={() => onTabChange('plots')}>See all →</button>
        </div>
        {recentPlots.length === 0
          ? <div className="empty-state"><h3>No available plots right now</h3><p>Check back soon for new listings.</p></div>
          : <div className={styles.miniPlotGrid}>
              {recentPlots.map(p => <MiniPlotCard key={p.plotId} plot={p} isFav={favIds.includes(p.plotId)} onTabChange={onTabChange} />)}
            </div>
        }
      </div>

      <div className={styles.overviewTips}>
        <p className="section-label">How to get started</p>
        <div className={styles.tipsGrid}>
          {[
            { step:'1', title:'Browse Listings', desc:'Filter by status, search by location or plot number, and open any plot for full details.', tab:'plots' },
            { step:'2', title:'Save Favourites', desc:'Tap the heart icon on any approved plot to build your personal shortlist for comparison.', tab:'favorites' },
            { step:'3', title:'Reserve a Plot', desc:'On any available approved listing, click "Reserve" to complete the demo payment and confirm your booking.', tab:'plots' },
          ].map(t => (
            <button key={t.step} className={styles.tipCard} onClick={() => onTabChange(t.tab)}>
              <span className={styles.tipStep}>{t.step}</span>
              <h3 className={styles.tipTitle}>{t.title}</h3>
              <p className={styles.tipDesc}>{t.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function InvestorOverview({ recentPlots, favIds, onTabChange }) {
  const [counts, setCounts] = useState({ bookings:0, favs:0, payments:0 })
  useEffect(() => {
    Promise.all([
      api('/plots/my-bookings').catch(()=>[]),
      api('/plots/favorites').catch(()=>[]),
      api('/payments/my').catch(()=>[]),
    ]).then(([b,f,p]) => setCounts({ bookings:b?.length||0, favs:f?.length||0, payments:p?.length||0 }))
  }, [])

  return (
    <div className={styles.tab}>
      <div className={styles.investorBanner}>
        <div>
          <p className="section-label" style={{ color:'var(--gold-light)' }}>Investor Dashboard</p>
          <h2 style={{ color:'var(--white)', fontFamily:'var(--font-display)', marginTop:8 }}>Your investment overview</h2>
          <p style={{ color:'rgba(255,255,255,0.6)', marginTop:8, fontSize:'0.9rem' }}>Track reservations, compare plots, and monitor your portfolio.</p>
        </div>
      </div>

      <div className={styles.statsRow}>
        {[
          { label:'Reservations', val:counts.bookings, tab:'bookings', color:'var(--forest)' },
          { label:'Watchlist',    val:counts.favs,     tab:'favorites', color:'var(--gold)' },
          { label:'Transactions', val:counts.payments, tab:'payments',  color:'var(--forest-mid)' },
        ].map(s => (
          <button key={s.label} className={styles.statCard} onClick={() => onTabChange(s.tab)}>
            <span className={styles.statNum} style={{ color:s.color }}>{s.val}</span>
            <span className={styles.statLabel}>{s.label}</span>
            <span className={styles.statArrow}>→</span>
          </button>
        ))}
        <button className={`${styles.statCard} ${styles.statCardAccent}`} onClick={() => onTabChange('plots')}>
          <span className={styles.statNum}>Browse</span>
          <span className={styles.statLabel}>View All Plots</span>
          <span className={styles.statArrow}>→</span>
        </button>
      </div>

      <div className={styles.overviewSection}>
        <div className={styles.sectionRowHead}>
          <p className="section-label">Available Opportunities</p>
          <button className={styles.seeAll} onClick={() => onTabChange('plots')}>See all →</button>
        </div>
        {recentPlots.length === 0
          ? <div className="empty-state"><h3>No available plots</h3><p>New listings will appear here.</p></div>
          : <div className={styles.miniPlotGrid}>
              {recentPlots.map(p => <MiniPlotCard key={p.plotId} plot={p} isFav={favIds.includes(p.plotId)} onTabChange={onTabChange} />)}
            </div>
        }
      </div>
    </div>
  )
}

function AdminOverview({ analytics, onTabChange }) {
  const a = analytics || {}
  const [pendingPlots, setPendingPlots] = useState([])
  useEffect(() => {
    api('/plots').then(d => setPendingPlots((d||[]).filter(p=>(p.approvalStatus||'PENDING')==='PENDING').slice(0,4))).catch(()=>{})
  }, [])

  return (
    <div className={styles.tab}>
      <div className={styles.adminBanner}>
        <div>
          <p className="section-label" style={{ color:'var(--gold-light)' }}>Admin Dashboard</p>
          <h2 style={{ color:'var(--white)', fontFamily:'var(--font-display)', marginTop:8 }}>Platform overview</h2>
          <p style={{ color:'rgba(255,255,255,0.6)', marginTop:8, fontSize:'0.9rem' }}>Manage listings, review approvals, and monitor marketplace health.</p>
        </div>
        <div className={styles.adminBannerActions}>
          <button className="btn-gold btn-sm" onClick={() => onTabChange('manage')}>Add New Plot</button>
          <button className="btn-outline btn-sm" style={{ borderColor:'rgba(255,255,255,0.3)', color:'var(--white)' }} onClick={() => onTabChange('analytics')}>View Analytics</button>
        </div>
      </div>

      <div className={styles.statsRow}>
        {[
          { label:'Total Users',    val:a.totalUsers??'—',      color:'var(--forest)', tab:'users' },
          { label:'Approved Plots', val:a.approvedPlots??'—',   color:'var(--gold)', tab:'plots' },
          { label:'Pending Review', val:a.pendingPlots??'—',    color:'#C4870A', tab:'plots' },
          { label:'Total Bookings', val:a.totalBookings??'—',   color:'var(--forest)', tab:'analytics' },
        ].map(s => (
          <button key={s.label} className={styles.statCard} onClick={() => onTabChange(s.tab)}>
            <span className={styles.statNum} style={{ color:s.color }}>{s.val}</span>
            <span className={styles.statLabel}>{s.label}</span>
            <span className={styles.statArrow}>→</span>
          </button>
        ))}
      </div>

      <div className={styles.adminGrid}>
        <div className={styles.overviewSection}>
          <div className={styles.sectionRowHead}>
            <p className="section-label">Pending Approvals</p>
            <button className={styles.seeAll} onClick={() => onTabChange('plots')}>See all →</button>
          </div>
          {pendingPlots.length === 0
            ? <div className="empty-state" style={{ padding:24 }}><h3>All caught up!</h3><p>No plots pending review.</p></div>
            : <div className={styles.pendingList}>
                {pendingPlots.map(p => <PendingPlotRow key={p.plotId} plot={p} onTabChange={onTabChange} />)}
              </div>
          }
        </div>

        <div className={styles.overviewSection}>
          <p className="section-label" style={{ marginBottom:16 }}>Quick Actions</p>
          <div className={styles.quickActions}>
            {[
              { label:'Add New Listing', tab:'manage', icon:'manage', desc:'Publish a new plot to the marketplace' },
              { label:'Review All Plots', tab:'plots', icon:'plots', desc:'Approve, reject, or edit existing listings' },
              { label:'View Analytics',  tab:'analytics', icon:'analytics', desc:'Platform stats and reports' },
              { label:'Manage Users',    tab:'users', icon:'users', desc:'View all registered accounts' },
            ].map(a => (
              <button key={a.tab} className={styles.quickActionCard} onClick={() => onTabChange(a.tab)}>
                <span className={styles.qaIcon}><Icon id={a.icon} size={20} /></span>
                <div>
                  <p className={styles.qaLabel}>{a.label}</p>
                  <p className={styles.qaDesc}>{a.desc}</p>
                </div>
                <span className={styles.qaArrow}>→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniPlotCard({ plot, isFav, onTabChange }) {
  const pricePerSqft = plot.areaSqft > 0 ? Math.round(plot.price / plot.areaSqft) : 0
  return (
    <div className={styles.miniCard}>
      <div className={styles.miniCardImg}>
        {plot.imageUrl
          ? <img src={plot.imageUrl} alt={plot.plotNumber} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <div className="plot-img-fallback" style={{ height:'100%' }}>{plot.plotNumber?.slice(0,3)}</div>
        }
      </div>
      <div className={styles.miniCardBody}>
        <p className={styles.miniCardTitle}>Plot {plot.plotNumber}</p>
        <p className={styles.miniCardLoc}>{plot.location}</p>
        <div className={styles.miniCardRow}>
          <span className={styles.miniCardPrice}>{fmt.currency(plot.price)}</span>
          {pricePerSqft > 0 && <span className={styles.miniCardRate}>{fmt.compactCurrency(pricePerSqft)}/sqft</span>}
        </div>
        <span className={`badge badge-available`}>{plot.areaSqft} sqft</span>
      </div>
    </div>
  )
}

function PendingPlotRow({ plot }) {
  return (
    <div className={styles.pendingRow}>
      <div className={styles.pendingInfo}>
        <p className={styles.pendingNum}>Plot {plot.plotNumber}</p>
        <p className={styles.pendingMeta}>{plot.location} · {plot.areaSqft} sqft · {fmt.currency(plot.price)}</p>
      </div>
      <span className="badge badge-pending">Pending</span>
    </div>
  )
}

/* ═══════════════════════ PLOTS TAB ══ */
function PlotsTab({ favIds, refresh, isAdmin, role, onDetails, onBook, onFavorite, onApprove, onReject, onEdit, onDelete }) {
  const [plots, setPlots] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(false)

  useEffect(() => { load() }, [search, statusFilter, refresh])

  async function load() {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (search) p.set('search', search)
      if (statusFilter !== 'ALL') p.set('status', statusFilter)
      const q = p.toString()
      setPlots(await api(q ? `/plots?${q}` : '/plots') || [])
    } catch { setPlots([]) }
    finally { setLoading(false) }
  }

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.searchIcon}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className={styles.searchInput} type="text" placeholder="Search by location, owner, plot number…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ALL">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="RESERVED">Reserved</option>
          <option value="SOLD">Sold</option>
        </select>
        {(search || statusFilter !== 'ALL') && (
          <button className="btn-ghost btn-sm" onClick={() => { setSearch(''); setStatusFilter('ALL') }}>Clear</button>
        )}
        <span className={styles.resultCount}>{plots.length} result{plots.length !== 1 ? 's' : ''}</span>
      </div>

      {loading && <div className={styles.loadingRow}><div className={styles.spinner}/></div>}
      {!loading && plots.length === 0 && (
        <div className="empty-state"><h3>No plots found</h3><p>Try different filters or {isAdmin ? 'add a new listing.' : 'check back later.'}</p></div>
      )}
      <div className={styles.plotGrid}>
        {plots.map((p, i) => (
          <PlotCard key={p.plotId} plot={p} favIds={favIds} isAdmin={isAdmin}
            onDetails={onDetails} onBook={onBook} onFavorite={onFavorite}
            onApprove={onApprove} onReject={onReject} onEdit={onEdit} onDelete={onDelete}
            style={{ animationDelay: `${i * 0.04}s` }}
          />
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════ MANAGE PLOT TAB (admin) ══ */
function ManagePlotTab({ bump }) {
  const init = { plotNumber:'', ownerName:'', location:'', areaSqft:'', price:'', status:'AVAILABLE', imageUrl:'' }
  const [f, setF] = useState(init)
  const [editingId, setEditingId] = useState(null)
  const [fb, setFb] = useState({ text:'', type:'' })
  const [loading, setLoading] = useState(false)
  const [plots, setPlots] = useState([])
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }))

  useEffect(() => {
    api('/plots').then(d => setPlots(d||[])).catch(()=>{})
  }, [bump])

  function startEdit(plot) {
    setF({ plotNumber:plot.plotNumber, ownerName:plot.ownerName, location:plot.location, areaSqft:String(plot.areaSqft), price:String(plot.price), status:plot.status, imageUrl:plot.imageUrl||'' })
    setEditingId(plot.plotId)
    setFb({ text:'', type:'' })
    window.scrollTo({ top:0, behavior:'smooth' })
  }

  function cancelEdit() { setF(init); setEditingId(null); setFb({ text:'', type:'' }) }

  async function handleUpload(e) {
    const file = e.target.files?.[0]; if (!file) return
    setFb({ text:'Uploading…', type:'' })
    try {
      const form = new FormData(); form.append('file', file)
      const r = await api('/uploads/images', { method:'POST', body:form })
      setF(p => ({ ...p, imageUrl:r.imageUrl }))
      setFb({ text:'Image uploaded successfully.', type:'success' })
    } catch (err) { setFb({ text:err.message, type:'error' }) }
  }

  async function submit(e) {
    e.preventDefault(); setLoading(true); setFb({ text:'', type:'' })
    const payload = { ...f, areaSqft:Number(f.areaSqft), price:Number(f.price) }
    try {
      await api(editingId ? `/plots/${editingId}` : '/plots', {
        method: editingId ? 'PUT' : 'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(payload),
      })
      setFb({ text: editingId ? 'Plot updated successfully.' : 'Plot created successfully.', type:'success' })
      setF(init); setEditingId(null); bump()
      api('/plots').then(d => setPlots(d||[])).catch(()=>{})
    } catch (err) { setFb({ text:err.message, type:'error' }) }
    finally { setLoading(false) }
  }

  async function deletePlot(plot) {
    if (!window.confirm(`Delete ${plot.plotNumber}?`)) return
    try { await api(`/plots/${plot.plotId}`, { method:'DELETE' }); bump(); api('/plots').then(d=>setPlots(d||[])).catch(()=>{}) }
    catch {}
  }

  return (
    <div className={styles.tab}>
      <div className={`card ${styles.manageForm}`}>
        <div className={styles.manageHead}>
          <p className="section-label">{editingId ? 'Edit Listing' : 'New Listing'}</p>
          <h2 style={{ fontFamily:'var(--font-display)', marginTop:6 }}>{editingId ? `Editing plot` : 'Publish a new plot'}</h2>
        </div>
        <form onSubmit={submit} style={{ display:'grid', gap:20 }}>
          <div className={styles.formRow2}>
            <div className="field"><label>Plot Number</label><input type="text" placeholder="SP-101" value={f.plotNumber} onChange={set('plotNumber')} required /></div>
            <div className="field"><label>Owner Name</label><input type="text" placeholder="Aarav Mehta" value={f.ownerName} onChange={set('ownerName')} required /></div>
          </div>
          <div className="field"><label>Location</label><input type="text" placeholder="Phase 1, North Block, Hyderabad" value={f.location} onChange={set('location')} required /></div>
          <div className={styles.formRow3}>
            <div className="field"><label>Area (sqft)</label><input type="number" placeholder="2400" value={f.areaSqft} onChange={set('areaSqft')} required /></div>
            <div className="field"><label>Price (₹)</label><input type="number" placeholder="1250000" value={f.price} onChange={set('price')} required /></div>
            <div className="field"><label>Status</label>
              <select value={f.status} onChange={set('status')}>
                <option value="AVAILABLE">Available</option>
                <option value="RESERVED">Reserved</option>
                <option value="SOLD">Sold</option>
              </select>
            </div>
          </div>
          <div className="field"><label>Image URL (optional)</label><input type="text" placeholder="https://images.unsplash.com/…" value={f.imageUrl} onChange={set('imageUrl')} /></div>
          <div className={styles.uploadRow}>
            <div className="field" style={{ flex:1 }}><label>Or upload image</label><input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleUpload} /></div>
            {f.imageUrl && <div className={styles.imgPreview}><img src={f.imageUrl} alt="preview" /></div>}
          </div>
          {fb.text && <p className={`feedback ${fb.type}`}>{fb.text}</p>}
          <div style={{ display:'flex', gap:12 }}>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving…' : editingId ? 'Save Changes' : 'Create Plot'}</button>
            {editingId && <button type="button" className="btn-ghost" onClick={cancelEdit}>Cancel</button>}
          </div>
        </form>
      </div>

      {plots.length > 0 && (
        <div style={{ marginTop:24 }}>
          <div className={styles.sectionRowHead} style={{ marginBottom:16 }}>
            <p className="section-label">All Listings ({plots.length})</p>
          </div>
          <div className={styles.manageTable}>
            <div className={styles.tableHead}>
              <span>Plot</span><span>Location</span><span>Price</span><span>Status</span><span>Approval</span><span>Actions</span>
            </div>
            {plots.map(p => (
              <div key={p.plotId} className={styles.tableRow}>
                <span className={styles.tablePlot}>{p.plotNumber}</span>
                <span className={styles.tableLoc}>{p.location}</span>
                <span className={styles.tablePrice}>{fmt.currency(p.price)}</span>
                <span><span className={`badge badge-${p.status?.toLowerCase()}`}>{p.status}</span></span>
                <span><span className={`badge badge-${(p.approvalStatus||'PENDING')?.toLowerCase()}`}>{p.approvalStatus||'PENDING'}</span></span>
                <span className={styles.tableActions}>
                  <button className="btn-ghost btn-sm" onClick={() => startEdit(p)}>Edit</button>
                  <button className="btn-danger btn-sm" onClick={() => deletePlot(p)}>Delete</button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════ ANALYTICS TAB (admin) ══ */
function AnalyticsTab({ analytics, onRefresh }) {
  const a = analytics || {}
  const metrics = [
    { label:'Total Users', value:a.totalUsers, color:'var(--forest)' },
    { label:'Admins', value:a.totalAdmins, color:'var(--forest-mid)' },
    { label:'Investors', value:a.totalInvestors, color:'var(--gold)' },
    { label:'Home Buyers', value:a.totalRegularUsers, color:'var(--forest)' },
    { label:'Approved Plots', value:a.approvedPlots, color:'var(--success)' },
    { label:'Pending Plots', value:a.pendingPlots, color:'#C4870A' },
    { label:'Rejected Plots', value:a.rejectedPlots, color:'var(--danger)' },
    { label:'Reserved Plots', value:a.reservedPlots, color:'var(--gold)' },
    { label:'Total Bookings', value:a.totalBookings, color:'var(--forest)' },
    { label:'Total Payments', value:a.totalPayments, color:'var(--forest-mid)' },
    { label:'Successful Payments', value:a.successfulPayments, color:'var(--success)' },
    { label:'Failed Payments', value:a.failedPayments, color:'var(--danger)' },
  ]

  async function download() {
    try {
      const blob = await apiBlob('/admin/reports/summary.csv')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'smartplot-summary.csv'
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
    } catch {}
  }

  return (
    <div className={styles.tab}>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:12, marginBottom:24 }}>
        <button className="btn-ghost" onClick={onRefresh}>↻ Refresh</button>
        <button className="btn-outline" onClick={download}>Download CSV</button>
      </div>
      <div className={styles.analyticsGrid}>
        {metrics.map(m => (
          <div key={m.label} className={`card ${styles.metricCard}`}>
            <span className={styles.metricVal} style={{ color:m.color }}>{m.value ?? '—'}</span>
            <span className={styles.metricLabel}>{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════ USERS TAB (admin) ══ */
function UsersTab({ refresh }) {
  const [users, setUsers] = useState([])
  useEffect(() => { api('/users').then(d => setUsers(d||[])).catch(()=>{}) }, [refresh])

  return (
    <div className={styles.tab}>
      <p style={{ marginBottom:20, color:'var(--muted)', fontSize:'0.9rem' }}>{users.length} registered account{users.length !== 1 ? 's' : ''}</p>
      {users.length === 0
        ? <div className="empty-state"><h3>No users yet</h3></div>
        : <div className={styles.usersGrid}>
            {users.map((u,i) => (
              <div key={u.userId||i} className={`card ${styles.userCard}`}>
                <div className={styles.userAvatar}>{u.name?.[0]}</div>
                <div className={styles.userInfo}>
                  <p className={styles.userName}>{u.name}</p>
                  <p className={styles.userEmail}>{u.email}</p>
                  {u.phone && <p className={styles.userPhone}>{u.phone}</p>}
                </div>
                <span className={`badge badge-${u.role?.toLowerCase()}`}>{u.role}</span>
              </div>
            ))}
          </div>
      }
    </div>
  )
}

/* ═══════════════════════ BOOKINGS TAB ══ */
function BookingsTab({ refresh, bump }) {
  const [bookings, setBookings] = useState([])
  useEffect(() => { api('/plots/my-bookings').then(d => setBookings(d||[])).catch(()=>{}) }, [refresh])

  async function cancel(plot) {
    if (!window.confirm(`Cancel booking for ${plot.plotNumber}?`)) return
    try { await api(`/plots/${plot.plotId}/cancel-booking`, { method:'POST' }); bump() } catch {}
  }

  return (
    <div className={styles.tab}>
      {bookings.length === 0
        ? <div className="empty-state"><h3>No bookings yet</h3><p>Reserve an available plot and it will appear here instantly.</p></div>
        : <div className={styles.bookingGrid}>
            {bookings.map(p => (
              <div key={p.plotId} className={`card ${styles.bookingCard}`}>
                <div className={styles.bookingMedia}>
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.plotNumber} />
                    : <div className="plot-img-fallback" style={{ height:'100%' }}>{p.plotNumber?.slice(0,3)}</div>
                  }
                </div>
                <div className={styles.bookingBody}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span className={`badge badge-${p.status?.toLowerCase()}`}>{p.status}</span>
                    <span className={`badge badge-${(p.approvalStatus||'PENDING')?.toLowerCase()}`}>{p.approvalStatus||'PENDING'}</span>
                  </div>
                  <h3 className={styles.bookingTitle}>Plot {p.plotNumber}</h3>
                  <p className={styles.bookingMeta}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {p.location}
                  </p>
                  <div className={styles.bookingSpecs}>
                    <span>{p.areaSqft} sqft</span>
                    <span>·</span>
                    <span>{fmt.currency(p.price)}</span>
                    <span>·</span>
                    <span>Owner: {p.ownerName}</span>
                  </div>
                  <div className={styles.bookingNote}>Reserved under your account</div>
                </div>
                <div className={styles.bookingActions}>
                  <div className={styles.bookingPrice}>{fmt.currency(p.price)}</div>
                  <button className="btn-danger btn-sm" onClick={() => cancel(p)}>Cancel Booking</button>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  )
}

/* ═══════════════════════ PAYMENTS TAB ══ */
function PaymentsTab({ refresh }) {
  const [payments, setPayments] = useState([])
  useEffect(() => { api('/payments/my').then(d => setPayments(d||[])).catch(()=>{}) }, [refresh])

  const total = payments.reduce((sum,p) => p.paymentStatus === 'SUCCESS' ? sum + Number(p.amount||0) : sum, 0)
  const successCount = payments.filter(p => p.paymentStatus === 'SUCCESS').length

  return (
    <div className={styles.tab}>
      {payments.length > 0 && (
        <div className={styles.paymentSummary}>
          <div className={styles.paymentStat}>
            <span className={styles.paymentStatNum}>{payments.length}</span>
            <span className={styles.paymentStatLabel}>Total Transactions</span>
          </div>
          <div className={styles.paymentStat}>
            <span className={styles.paymentStatNum} style={{ color:'var(--success)' }}>{successCount}</span>
            <span className={styles.paymentStatLabel}>Successful</span>
          </div>
          <div className={styles.paymentStat}>
            <span className={styles.paymentStatNum} style={{ color:'var(--danger)' }}>{payments.length - successCount}</span>
            <span className={styles.paymentStatLabel}>Failed</span>
          </div>
          <div className={styles.paymentStat}>
            <span className={styles.paymentStatNum} style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem' }}>{fmt.currency(total)}</span>
            <span className={styles.paymentStatLabel}>Total Paid</span>
          </div>
        </div>
      )}
      {payments.length === 0
        ? <div className="empty-state"><h3>No payments yet</h3><p>Complete a reservation to see transaction history here.</p></div>
        : <div className={styles.paymentList}>
            {payments.map((p,i) => (
              <div key={i} className={`card ${styles.paymentCard}`}>
                <div className={`${styles.paymentStatusBar} ${p.paymentStatus === 'SUCCESS' ? styles.paymentSuccess : styles.paymentFail}`} />
                <div className={styles.paymentCardBody}>
                  <div>
                    <p className={styles.paymentPlot}>Plot {p.plotNumber}</p>
                    <p className={styles.paymentMeta}>{p.paymentMethod} · {fmt.datetime(p.createdAt)}</p>
                    <p className={styles.paymentRef}>Ref: <span>{p.transactionReference}</span></p>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <p className={styles.paymentAmount}>{fmt.currency(p.amount)}</p>
                    <span className={`badge ${p.paymentStatus === 'SUCCESS' ? 'badge-approved' : 'badge-rejected'}`}>{p.paymentStatus}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  )
}

/* ═══════════════════════ FAVORITES TAB ══ */
function FavoritesTab({ favIds, refresh, onDetails, onBook, onFavorite, isAdmin }) {
  const [favs, setFavs] = useState([])
  useEffect(() => { api('/plots/favorites').then(d => setFavs(d||[])).catch(()=>{}) }, [refresh])

  return (
    <div className={styles.tab}>
      {favs.length === 0
        ? <div className="empty-state"><h3>No saved plots yet</h3><p>Tap the heart on any approved plot to add it to your shortlist.</p></div>
        : <div className={styles.plotGrid}>
            {favs.map((p,i) => (
              <PlotCard key={p.plotId} plot={p} favIds={favIds} isAdmin={false}
                onDetails={onDetails} onBook={onBook} onFavorite={onFavorite}
                onApprove={()=>{}} onReject={()=>{}} onEdit={()=>{}} onDelete={()=>{}}
                style={{ animationDelay:`${i*0.04}s` }}
              />
            ))}
          </div>
      }
    </div>
  )
}

/* ═══════════════════════ NOTIFICATIONS TAB ══ */
function NotificationsTab({ refresh }) {
  const [notifs, setNotifs] = useState([])
  useEffect(() => { api('/notifications/my').then(d => setNotifs(d||[])).catch(()=>{}) }, [refresh])

  async function markRead(id) {
    try {
      await api(`/notifications/${id}/read`, { method:'POST' })
      setNotifs(n => n.map(x => x.notificationId === id ? { ...x, read:true } : x))
    } catch {}
  }

  async function markAllRead() {
    const unread = notifs.filter(n => !n.read)
    await Promise.all(unread.map(n => api(`/notifications/${n.notificationId}/read`, { method:'POST' }).catch(()=>{})))
    setNotifs(n => n.map(x => ({ ...x, read:true })))
  }

  const unreadCount = notifs.filter(n => !n.read).length

  return (
    <div className={styles.tab}>
      {unreadCount > 0 && (
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
          <button className="btn-ghost btn-sm" onClick={markAllRead}>Mark all as read ({unreadCount})</button>
        </div>
      )}
      {notifs.length === 0
        ? <div className="empty-state"><h3>No notifications yet</h3><p>Account and plot events will appear here automatically.</p></div>
        : <div className={styles.notifList}>
            {notifs.map((n,i) => {
              const typeColor = { ACCOUNT:'var(--forest)', SECURITY:'var(--danger)', BOOKING:'var(--gold)', PAYMENT:'var(--gold)', APPROVAL:'var(--forest)' }
              return (
                <div key={i} className={`card ${styles.notifCard} ${n.read ? styles.notifRead : ''}`}>
                  <div className={styles.notifLeft}>
                    <div className={styles.notifDot} style={{ background: n.read ? 'var(--sand-dark)' : (typeColor[n.type]||'var(--forest)') }} />
                  </div>
                  <div className={styles.notifBody}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
                      <div>
                        <p className={styles.notifTitle}>{n.title}</p>
                        <p className={styles.notifMsg}>{n.message}</p>
                        <p className={styles.notifTime}>{fmt.datetime(n.createdAt)} · {n.type}</p>
                      </div>
                      {!n.read && (
                        <button className="btn-ghost btn-sm" style={{ flexShrink:0 }} onClick={() => markRead(n.notificationId)}>
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
      }
    </div>
  )
}

/* ═══════════════════════ PROFILE TAB ══ */
function ProfileTab() {
  const { currentUser, updateUser } = useAuth()
  const [f, setF] = useState({ name:currentUser?.name||'', phone:currentUser?.phone||'' })
  const [pwf, setPwf] = useState({ currentPassword:'', newPassword:'' })
  const [profFb, setProfFb] = useState({ text:'', type:'' })
  const [pwFb, setPwFb] = useState({ text:'', type:'' })

  async function saveProfile(e) {
    e.preventDefault(); setProfFb({ text:'Saving…', type:'' })
    try {
      const r = await api('/me', { method:'PUT', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(f) })
      updateUser(r); setProfFb({ text:'Profile updated successfully.', type:'success' })
    } catch (err) { setProfFb({ text:err.message, type:'error' }) }
  }

  async function changePassword(e) {
    e.preventDefault(); setPwFb({ text:'Changing…', type:'' })
    try {
      const r = await api('/me/change-password', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(pwf) })
      setPwFb({ text:r.message, type:'success' }); setPwf({ currentPassword:'', newPassword:'' })
    } catch (err) { setPwFb({ text:err.message, type:'error' }) }
  }

  const joinDate = 'SmartPlot Member'

  return (
    <div className={styles.tab}>
      <div className={styles.profileLayout}>
        <div className={`card ${styles.profileCard}`}>
          <div className={styles.profileAvatarLg}>{currentUser?.name?.[0]}</div>
          <h3 className={styles.profileName}>{currentUser?.name}</h3>
          <p className={styles.profileEmail}>{currentUser?.email}</p>
          {currentUser?.phone && <p className={styles.profilePhone}>{currentUser?.phone}</p>}
          <span className={`badge badge-${currentUser?.role?.toLowerCase()}`} style={{ marginTop:8 }}>{currentUser?.role}</span>
          <p className={styles.profileJoin}>{joinDate}</p>
        </div>

        <div className={styles.profileForms}>
          <div className={`card ${styles.formCard}`}>
            <h3 className={styles.formCardTitle}>Update Profile</h3>
            <form onSubmit={saveProfile} style={{ display:'grid', gap:16, marginTop:20 }}>
              <div className="field"><label>Full Name</label><input type="text" value={f.name} onChange={e => setF(p => ({ ...p, name:e.target.value }))} /></div>
              <div className="field"><label>Phone Number</label><input type="text" placeholder="9876543210" value={f.phone} onChange={e => setF(p => ({ ...p, phone:e.target.value }))} /></div>
              {profFb.text && <p className={`feedback ${profFb.type}`}>{profFb.text}</p>}
              <button type="submit" className="btn-primary" style={{ justifySelf:'start' }}>Save Changes</button>
            </form>
          </div>

          <div className={`card ${styles.formCard}`}>
            <h3 className={styles.formCardTitle}>Change Password</h3>
            <form onSubmit={changePassword} style={{ display:'grid', gap:16, marginTop:20 }}>
              <div className="field"><label>Current Password</label><input type="password" placeholder="Current password" value={pwf.currentPassword} onChange={e => setPwf(p => ({ ...p, currentPassword:e.target.value }))} /></div>
              <div className="field"><label>New Password</label><input type="password" placeholder="Minimum 6 characters" value={pwf.newPassword} onChange={e => setPwf(p => ({ ...p, newPassword:e.target.value }))} /></div>
              {pwFb.text && <p className={`feedback ${pwFb.type}`}>{pwFb.text}</p>}
              <button type="submit" className="btn-outline" style={{ justifySelf:'start' }}>Update Password</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
