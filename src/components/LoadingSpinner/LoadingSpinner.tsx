import React from 'react'
import './LoadingSpinner.css'

interface LoadingSpinnerProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading', 
  size = 'medium',
  className = '' 
}) => {
  // Determine logo path based on environment
  const getLogoPath = () => {
    // In production (GitHub Pages)
    if (window.location.hostname.includes('github.io')) {
      return '/alexandria/alexandria.png'
    } else {
      // Development
      return '/alexandria.png'
    }
  }

  return (
    <div className={`loading-spinner ${size} ${className}`}>
      <div className="loading-logo-container">
        <img 
          src={getLogoPath()}
          alt="Alexandria Logo"
          className="loading-logo"
        />
      </div>
      <div className="loading-text">
        <span className="loading-message">{message}</span>
        <span className="loading-dots">
          <span className="dot">.</span>
          <span className="dot">.</span>
          <span className="dot">.</span>
        </span>
      </div>
    </div>
  )
}

export default LoadingSpinner