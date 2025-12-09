"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { ElderEaseLogo } from "@/components/elderease-logo"
import { Menu, X } from "lucide-react"
import Image from "next/image"
import styles from "./page.module.css"
import { useEffect, useState } from "react"

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["description", "problem", "features", "about"]
      const scrollPosition = window.scrollY + 100

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }

      if (window.scrollY < 200) {
        setActiveSection("description")
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className={styles.landingPage}>
      {/* Header */}
      <header className={`${styles.header} ${styles.noSpacing}`}>
        <div className={styles.headerContent}>
          <ElderEaseLogo size="sm" />

          {/* Mobile Menu Button */}
          <button
            className={styles.mobileMenuButton}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Navigation */}
          <nav className={`${styles.nav} ${mobileMenuOpen ? styles.navMobileOpen : ""}`}>

            <a
              href="#description"
              className={`${styles.navLink} ${activeSection === "description" ? styles.navLinkActive : ""}`}
              onClick={closeMobileMenu}
            >
              Description
            </a>

            <a
              href="#problem"
              className={`${styles.navLink} ${activeSection === "problem" ? styles.navLinkActive : ""}`}
              onClick={closeMobileMenu}
            >
              Problem
            </a>

            <a
              href="#features"
              className={`${styles.navLink} ${activeSection === "features" ? styles.navLinkActive : ""}`}
              onClick={closeMobileMenu}
            >
              Features
            </a>

            <a
              href="#about"
              className={`${styles.navLink} ${activeSection === "about" ? styles.navLinkActive : ""}`}
              onClick={closeMobileMenu}
            >
              About Us
            </a>

            {/* Login Button */}
            <Link
              href="/elder/login"
              className={styles.loginButton}
              onClick={closeMobileMenu}
            >
              Login
            </Link>

            {/* Register Button */}
            <Link
              href="/elder/register"
              className={styles.registerButton}
              onClick={closeMobileMenu}
            >
              Register
            </Link>

          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className={`${styles.heroSection} ${styles.noSpacing}`}
        style={{ backgroundImage: "url('/touch.jpg')" }}
      >
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <ElderEaseLogo size="lg" />
          <h1 className={styles.heroTitle}>ElderEase Digital Platform for Elders</h1>
          <p className={styles.heroDescription}>Connecting elderly individuals with an easy-to-use platform</p>
        </div>
      </section>

      {/* Description */}
      <section id="description" className={`${styles.descriptionSection} ${styles.sectionSpacing}`}>
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>What is ElderEase?</h2>

          <div className={styles.aboutCard}>
            <p className={styles.aboutCardDescription}>
              ElderEase is a comprehensive digital platform designed to bridge the technology gap for elderly individuals.
              We understand that seniors often face challenges navigating the digital world, from social media to healthcare services.
            </p>
            <br />
            <p className={styles.aboutCardDescription}>
              With features like step-by-step social media tutorials, event discovery, 
              and secure accounts, ElderEase makes essential digital services simple and accessible.
            </p>
            <br />
            <p className={styles.aboutCardDescription}>
              Whether you're staying connected with loved ones or finding healthcare services, ElderEase is your trusted companion.
            </p>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className={`${styles.problemSection} ${styles.sectionSpacing}`}>
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>Problem & Solution</h2>

          <div className={styles.grid2Col}>
            <Card className={styles.card}>
              <div className={styles.cardImageContainer}>
                <Image src="/problem.jpg" alt="The Problem" width={400} height={200} className={styles.cardImage} />
              </div>
              <div className={styles.colorBar}></div>
              <CardContent className={styles.cardContent}>
                <h3 className={styles.cardTitle}>The Problem</h3>
                <p className={styles.cardDescription}>
                  Many seniors struggle using technology due to complex interfaces and small text, limiting communication and healthcare access.
                </p>
              </CardContent>
            </Card>

            <Card className={`${styles.card} ${styles.solutionCard}`}>
              <div className={styles.cardImageContainer}>
                <Image src="/solution.jpg" alt="Solution" width={400} height={200} className={styles.cardImage} />
              </div>
              <div className={styles.colorBar}></div>
              <CardContent className={styles.cardContent}>
                <h3 className={styles.cardTitle}>Our Solution</h3>
                <p className={styles.cardDescription}>
                  ElderEase uses simplified UI and AI tools to make digital navigation easy, featuring large text and intuitive design.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={`${styles.featuresSection} ${styles.sectionSpacing}`}>
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>Key Features</h2>

          <div className={styles.grid3Col}>
            {[
              { img: "/tutorials.jpg", title: "Social Media Tutorials", desc: "Step-by-step guides for popular apps." },
              { img: "/community.jpg", title: "Community Events", desc: "Discover events made for seniors." },
              { img: "/donation.jpg", title: "Donation & Requests", desc: "Request help or offer assistance." },
              { img: "/voice.jpg", title: "Voice Assistance", desc: "Navigate using simple voice commands." },
              { img: "/favorite.jpg", title: "Favorites & Tracking", desc: "Save favorite features for quick access." },
              { img: "/secure.jpg", title: "Secure Accounts", desc: "Simple login with QR codes." },
            ].map((item, i) => (
              <Card key={i} className={styles.card}>
                <div className={styles.cardImageContainer}>
                  <Image src={item.img} alt={item.title} width={400} height={200} className={styles.cardImage} />
                </div>
                <div className={styles.colorBar}></div>
                <CardContent className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.cardDescription}>{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className={`${styles.aboutSection} ${styles.sectionSpacing}`}>
        <div className={styles.sectionContent}>
          <h2 className={styles.sectionTitle}>About Us</h2>

          <div className={styles.developersSection}>
            <div className={styles.developersGrid}>
              {/* Developer 1 */}
              <Card className={styles.developerCard}>
                <CardContent className={styles.developerContent}>
                  <div className={styles.developerImage}>
                    <Image src="/ibasco.jpg" alt="Angela Ibasco" width={128} height={128} />
                  </div>
                  <div>
                    <h4 className={styles.developerName}>Angela Ibasco</h4>
                    <p className={styles.developerRole}>Frontend Developer</p>
                    <p className={styles.developerDescription}>Creating clean and accessible UI for seniors.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Developer 2 */}
              <Card className={styles.developerCard}>
                <CardContent className={styles.developerContent}>
                  <div className={styles.developerImage}>
                    <Image src="/formeloza.jpg" alt="Axl Denielle Ybo" width={128} height={128} />
                  </div>
                  <div>
                    <h4 className={styles.developerName}>Axl Denielle Ybo</h4>
                    <p className={styles.developerRole}>Backend Developer</p>
                    <p className={styles.developerDescription}>
                      Building secure and reliable systems for seamless user experience.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerContent}>
            <div className={styles.footerSection}>
              <h4 className={styles.footerSectionTitle}>Quick Links</h4>
              <ul className={styles.footerLinksList}>
                <li><a href="#description" className={styles.footerLink}>Description</a></li>
                <li><a href="#problem" className={styles.footerLink}>Problem</a></li>
                <li><a href="#features" className={styles.footerLink}>Features</a></li>
                <li><a href="#about" className={styles.footerLink}>About Us</a></li>
              </ul>
            </div>

            <div className={styles.footerSection}>
              <h4 className={styles.footerSectionTitle}>Connect With Us</h4>
              <div className={styles.footerContactInfo}>
                <div className={styles.contactItem}>
                  <p className={styles.contactLabel}>Email:</p>
                  <a href="mailto:team.elderease@gmail.com" className={styles.footerLink}>team.elderease@gmail.com</a>
                </div>
                <div className={styles.contactItem}>
                  <p className={styles.contactLabel}>Phone:</p>
                  <a href="tel:+639620816563" className={styles.footerLink}>+63 9620816563</a>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.footerCopyright}>
            <p className={styles.footerText}>© 2025 ElderEase. Making healthcare accessible for everyone.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
