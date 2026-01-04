import React from 'react'
import { Link } from 'react-router-dom'
import './Header.css'

const Header: React.FC = () => {
  // Get the base path from the document base element or use fallback logic
  const getLogoPath = () => {
    // Try to get base from document
    const baseElement = document.querySelector('base')
    const basePath = baseElement?.getAttribute('href') || '/'
    
    console.log('Header - Base path:', basePath)
    
    // In development, base is '/', in production it's '/alexandria/'
    if (basePath === '/') {
      console.log('Header - Using development path: /alexandria.png')
      return '/alexandria.png'  // Development
    } else {
      const prodPath = `${basePath}alexandria.png`
      console.log('Header - Using production path:', prodPath)
      return prodPath  // Production: /alexandria/alexandria.png
    }
  }

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo-link" aria-label="Alexandria - Home">
          <img 
            src={getLogoPath()} 
            alt="Alexandria" 
            className="logo"
            width="32"
            height="32"
            onError={(e) => {
              // Fallback strategy for logo
              const img = e.target as HTMLImageElement
              const fallbacks = [
                '/alexandria.png',
                '/alexandria/alexandria.png', 
                '/public/alexandria.png',
                'alexandria.png'
              ]
              
              const currentSrc = img.src
              const currentIndex = fallbacks.findIndex(path => currentSrc.endsWith(path))
              
              if (currentIndex < fallbacks.length - 1) {
                const nextFallback = fallbacks[currentIndex + 1]
                const baseUrl = window.location.origin
                img.src = baseUrl + nextFallback
              } else {
                // All fallbacks failed, hide the image
                img.style.display = 'none'
              }
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