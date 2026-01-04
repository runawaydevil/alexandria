import React from 'react'
import { Link } from 'react-router-dom'
import './Header.css'

const Header: React.FC = () => {
  // Get base path dynamically for production (GitHub Pages)
  const getLogoPath = (): string => {
    const pathname = window.location.pathname
    const hostname = window.location.hostname
    
    // If we're on GitHub Pages (github.io), always use base path
    if (hostname.includes('github.io')) {
      return '/alexandria/alexandria.png'
    }
    
    // If pathname starts with /alexandria, use base path
    if (pathname.startsWith('/alexandria')) {
      return '/alexandria/alexandria.png'
    }
    
    // For local development, use root path
    return '/alexandria.png'
  }

  const logoPath = getLogoPath()

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo-link" aria-label="Alexandria - Home">
          <img 
            src={logoPath} 
            alt="Alexandria" 
            className="logo"
            width="32"
            height="32"
            onError={(e) => {
              console.log('Header logo failed to load:', (e.target as HTMLImageElement).src)
              // Fallback strategy for logo
              const img = e.target as HTMLImageElement
              const hostname = window.location.hostname
              const pathname = window.location.pathname
              const isProduction = hostname.includes('github.io') || pathname.startsWith('/alexandria')
              
              // Determine fallbacks based on environment
              const fallbacks = isProduction
                ? [
                    '/alexandria/alexandria.png',  // Production path (try first)
                    '/alexandria.png'  // Fallback to root
                  ]
                : [
                    '/alexandria.png',  // Development path
                    '/alexandria/alexandria.png'  // Fallback to production path
                  ]
              
              const currentSrc = img.src
              const url = new URL(currentSrc)
              const currentPath = url.pathname
              const currentIndex = fallbacks.findIndex(path => currentPath === path || currentPath.endsWith(path))
              
              if (currentIndex < fallbacks.length - 1) {
                const nextFallback = fallbacks[currentIndex + 1]
                console.log('Trying fallback:', nextFallback)
                // Resolve relative to current origin
                img.src = nextFallback.startsWith('/') 
                  ? `${url.origin}${nextFallback}`
                  : `${url.origin}/${nextFallback}`
              } else {
                // All fallbacks failed, hide the image
                console.log('All fallbacks failed, hiding image')
                img.style.display = 'none'
              }
            }}
            onLoad={() => {
              console.log('Header logo loaded successfully:', logoPath)
            }}
          />
          <span className="logo-text">Alexandria</span>
        </Link>
        
        <nav className="nav" aria-label="Main navigation">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/about" className="nav-link">About</Link>
        </nav>
      </div>
    </header>
  )
}

export default Header