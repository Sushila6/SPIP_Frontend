import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Navbar.module.css'

export default function Navbar({ transparent = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, currentUser, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  const isHome = location.pathname === '/'

  return (
    <nav className={`${styles.nav} ${transparent && isHome ? styles.transparent : styles.solid}`}>
      <div className={styles.inner}>
        <button className={styles.logo} onClick={() => navigate('/')}>
          <span className={styles.logoMark}>SP</span>
          <span className={styles.logoText}>SmartPlot<em>Estates</em></span>
        </button>

        <div className={styles.links}>
          {!isAuthenticated ? (
            <>
              <a href="#listings" className={styles.link}>Listings</a>
              <a href="#why" className={styles.link}>Why Us</a>
              <button className={styles.linkBtn} onClick={() => navigate('/login')}>Sign In</button>
              <button className="btn-primary btn-sm" onClick={() => navigate('/signup')}>Get Started</button>
            </>
          ) : (
            <>
              <button className={styles.linkBtn} onClick={() => navigate('/dashboard')}>Dashboard</button>
              <div className={styles.userChip}>
                <span className={styles.userDot}></span>
                <span>{currentUser?.name?.split(' ')[0]}</span>
                <span className={`badge badge-${currentUser?.role?.toLowerCase()}`}>{currentUser?.role}</span>
              </div>
              <button className={styles.logoutBtn} onClick={handleLogout}>Sign Out</button>
            </>
          )}
        </div>

        <button className={styles.menuToggle} onClick={() => setMenuOpen(o => !o)}>
          <span></span><span></span><span></span>
        </button>
      </div>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          {!isAuthenticated ? (
            <>
              <button onClick={() => { navigate('/login'); setMenuOpen(false) }}>Sign In</button>
              <button onClick={() => { navigate('/signup'); setMenuOpen(false) }}>Get Started</button>
            </>
          ) : (
            <>
              <button onClick={() => { navigate('/dashboard'); setMenuOpen(false) }}>Dashboard</button>
              <button onClick={() => { handleLogout(); setMenuOpen(false) }}>Sign Out</button>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
