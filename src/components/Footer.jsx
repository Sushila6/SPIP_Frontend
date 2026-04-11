import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logoMark}>SP</div>
          <div>
            <p className={styles.name}>SmartPlot Estates</p>
            <p className={styles.tagline}>A premium property marketplace for verified plots</p>
          </div>
        </div>
        <div className={styles.cols}>
          <div className={styles.col}>
            <p className={styles.colHead}>Explore</p>
            <a>Residential Plots</a>
            <a>Investment Plots</a>
            <a>Featured Layouts</a>
          </div>
          <div className={styles.col}>
            <p className={styles.colHead}>Company</p>
            <a>About Us</a>
            <a>Careers</a>
            <a>Press</a>
          </div>
          <div className={styles.col}>
            <p className={styles.colHead}>Contact</p>
            <a>support@smartplot.com</a>
            <a>+91 98765 00000</a>
            <a>SmartPlot Estates, Hyderabad</a>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>© {new Date().getFullYear()} SmartPlot Estates. All rights reserved.</p>
        <p>Mon – Sat · 9 AM – 6 PM IST</p>
      </div>
    </footer>
  )
}
