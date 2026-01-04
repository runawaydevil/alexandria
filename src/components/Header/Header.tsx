import React from 'react'
import { Link } from 'react-router-dom'
import './Header.css'

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo-link" aria-label="Alexandria - Home">
          <img 
            src="/alexandria.png" 
            alt="Alexandria" 
            className="logo"
            width="32"
            height="32"
            onError={(e) => {
              console.log('Header logo failed to load:', (e.target as HTMLImageElement).src)
              // Fallback strategy for logo
              const img = e.target as HTMLImageElement
              const fallbacks = [
                '/public/alexandria.png',
                '/alexandria/alexandria.png', 
                'alexandria.png'
              ]
              
              const currentSrc = img.src
              const currentIndex = fallbacks.findIndex(path => currentSrc.endsWith(path))
              
              if (currentIndex < fallbacks.length - 1) {
                const nextFallback = fallbacks[currentIndex + 1]
                console.log('Trying fallback:', nextFallback)
                img.src = nextFallback
              } else {
                // All fallbacks failed, hide the image
                console.log('All fallbacks failed, hiding image')
                img.style.display = 'none'
              }
            }}
            onLoad={() => {
              console.log('Header logo loaded successfully')
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