import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import styles from './HomePage.module.css'

const FEATURES = [
  { icon: '◈', title: 'Verified Listings Only', desc: 'Every plot goes through admin approval before it appears. No clutter, no guesswork.' },
  { icon: '◇', title: 'Transparent Pricing', desc: 'Area, rate per sqft, total price and booking status — all visible upfront.' },
  { icon: '◉', title: 'Reserve in One Step', desc: 'Available plots can be booked instantly via a secure mock payment flow.' },
]

const TESTIMONIALS = [
  { quote: 'The shortlist made it easy to compare a few options with my family before taking the next step.', name: 'Riya Sharma', role: 'Home Buyer' },
  { quote: 'I liked how clearly the location, area, and price were shown. It felt much easier to evaluate where to invest.', name: 'Arjun Mehta', role: 'Investor' },
  { quote: 'The website feels simple to use and the listing details are clear enough that you do not feel lost while browsing.', name: 'Neha Reddy', role: 'First-Time Buyer' },
]

const STATS = [
  { num: '100+', label: 'Verified Plots' },
  { num: '3', label: 'Account Roles' },
  { num: '100%', label: 'Approved Listings' },
  { num: '24/7', label: 'Portal Access' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  return (
    <div className={styles.page}>
      <Navbar transparent />

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.heroBgGradient} />
          <div className={styles.heroBgPattern} />
        </div>
        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <p className={`section-label anim-fade-up stagger-1 ${styles.eyebrow}`}>
              Verified Plot Marketplace
            </p>
            <h1 className={`anim-fade-up stagger-2 ${styles.heroH1}`}>
              Find your <em>perfect</em><br />plot.
            </h1>
            <p className={`anim-fade-up stagger-3 ${styles.heroSub}`}>
              Explore handpicked layouts, compare locations, review prices,
              and reserve approved plots — all in one place.
            </p>
            <div className={`anim-fade-up stagger-4 ${styles.heroCta}`}>
              <button className="btn-gold" onClick={() => navigate('/signup')}>
                Start Exploring
              </button>
              <button className="btn-outline" onClick={() => navigate('/login')}>
                Sign In
              </button>
            </div>
            <div className={`anim-fade-up stagger-5 ${styles.statsRow}`}>
              {STATS.map(s => (
                <div key={s.label} className={styles.statItem}>
                  <span className={styles.statNum}>{s.num}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`anim-fade-up stagger-3 ${styles.heroRight}`}>
            <div className={styles.heroCard}>
              <div className={styles.heroCardTop}>
                <p className={styles.heroCardLabel}>Featured Community</p>
                <span className="badge badge-available">Live</span>
              </div>
              <h3 className={styles.heroCardTitle}>North Ridge Phase I</h3>
              <p className={styles.heroCardDesc}>Wide roads, growing surroundings, ready-to-explore plots for families and long-term buyers.</p>
              <div className={styles.heroCardImg}>
                <div className={styles.heroCardImgInner} />
              </div>
              <div className={styles.heroCardMeta}>
                <div className={styles.heroCardMetaItem}>
                  <span>From</span>
                  <strong>₹12 Lakh</strong>
                </div>
                <div className={styles.heroCardMetaItem}>
                  <span>Area</span>
                  <strong>1200+ sqft</strong>
                </div>
                <div className={styles.heroCardMetaItem}>
                  <span>Status</span>
                  <strong>Available</strong>
                </div>
              </div>
            </div>
            <div className={styles.floatingBadge}>
              <span>✦</span> Approved listing
            </div>
          </div>
        </div>
      </section>

      {/* ── Listings preview strip ── */}
      <section id="listings" className={styles.listingsStrip}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <p className="section-label">Featured Listings</p>
            <h2>Communities worth exploring</h2>
            <p>A few standout destinations to help you understand the quality and range of plots available.</p>
          </div>
          <div className={styles.previewGrid}>
            {[
              { label: 'Coastal View', name: 'Marina Crest Plots', desc: 'Premium residential plots near fast-growing corridors with open surroundings.', chips: ['1200–2400 sqft', 'Approved Layout'], color: '#1C3A2F' },
              { label: 'Green Township', name: 'Cedar Valley Extension', desc: 'Balanced pricing, clean road access, and a calm layout suited for families.', chips: ['Family Ready', 'Live Availability'], color: '#2D5A47' },
              { label: 'Urban Access', name: 'Skyline Edge Phase II', desc: 'Proximity to roads, services, and future appreciation without losing convenience.', chips: ['Growth Corridor', 'Investor Focus'], color: '#3D7A61' },
            ].map((p, i) => (
              <div key={i} className={`${styles.previewCard} anim-fade-up`} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.previewMedia} style={{ background: `linear-gradient(135deg, ${p.color} 0%, ${p.color}99 100%)` }}>
                  <span className={styles.previewInitial}>{p.name[0]}</span>
                </div>
                <div className={styles.previewBody}>
                  <span className={styles.previewLabel}>{p.label}</span>
                  <h3>{p.name}</h3>
                  <p>{p.desc}</p>
                  <div className={styles.previewChips}>
                    {p.chips.map(c => <span key={c} className={styles.chip}>{c}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.sectionCta}>
            <button className="btn-primary" onClick={() => navigate('/signup')}>
              View All Listings
            </button>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="why" className={styles.features}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <p className="section-label">Why SmartPlot</p>
            <h2>Built for confident decisions</h2>
            <p>The experience is designed to reduce confusion and help you move forward with clarity.</p>
          </div>
          <div className={styles.featGrid}>
            {FEATURES.map((f, i) => (
              <div key={i} className={`${styles.featCard} anim-fade-up`} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.featIcon}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section className={styles.roles}>
        <div className={styles.sectionInner}>
          <div className={styles.rolesGrid}>
            <div className={styles.rolesLeft}>
              <p className="section-label">Who Uses SmartPlot</p>
              <h2>Built for buyers, investors, and trusted teams</h2>
              <p>From shortlisting your first plot to reviewing premium opportunities, the experience stays simple.</p>
              <button className="btn-outline" onClick={() => navigate('/signup')} style={{ marginTop: 24 }}>
                Create Account
              </button>
            </div>
            <div className={styles.rolesRight}>
              {[
                { badge: 'Home Buyers', title: 'Search with clarity', desc: 'Compare price, area, and location details before reserving a plot that fits your family or budget.' },
                { badge: 'Investors', title: 'Review growth corridors', desc: 'Explore high-potential layouts, study live availability, and shortlist promising plots for long-term value.' },
                { badge: 'SmartPlot Team', title: 'Keep listings trustworthy', desc: 'Review listings, maintain quality, and support a smooth booking experience.' },
              ].map((r, i) => (
                <div key={i} className={styles.roleCard}>
                  <span className={`badge badge-${i === 0 ? 'user' : i === 1 ? 'investor' : 'admin'}`}>{r.badge}</span>
                  <h3>{r.title}</h3>
                  <p>{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className={styles.testimonials}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <p className="section-label">Customer Stories</p>
            <h2>What people value about the experience</h2>
          </div>
          <div className={styles.testGrid}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className={`${styles.testCard} anim-fade-up`} style={{ animationDelay: `${i * 0.1}s` }}>
                <p className={styles.testQuote}>"{t.quote}"</p>
                <div className={styles.testAuthor}>
                  <div className={styles.testAvatar}>{t.name[0]}</div>
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Band ── */}
      <section className={styles.ctaBand}>
        <div className={styles.ctaBandInner}>
          <h2>Your next plot is waiting.</h2>
          <p>Create a free account and start exploring verified plots, comparing prices, and reserving properties.</p>
          <div className={styles.ctaBandBtns}>
            <button className="btn-gold" onClick={() => navigate('/signup')}>Create Free Account</button>
            <button className="btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'var(--white)' }} onClick={() => navigate('/login')}>Sign In Instead</button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
