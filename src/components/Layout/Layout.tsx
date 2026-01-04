import React from 'react'
import Header from '../Header/Header'
import Footer from '../Footer/Footer'
import RateLimitBanner from '../RateLimitBanner/RateLimitBanner'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <RateLimitBanner />
      <Header />
      <main id="main-content" className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default Layout