import React from 'react'
import { Link } from 'react-router-dom'
import './Header.css'

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo-link" aria-label="Alexandria - Home">
          <img 
            src="/alexandria/alexandria.png" 
            alt="Alexandria" 
            className="logo"
            width="32"
            height="32"
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