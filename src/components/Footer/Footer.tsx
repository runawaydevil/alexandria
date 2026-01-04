import React from 'react'
import './Footer.css'

interface FooterProps {
  className?: string
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className={`footer ${className || ''}`}>
      <div className="footer-content">
        <p className="footer-text">
          © {currentYear} Developed by{' '}
          <a 
            href="https://github.com/runawaydevil" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-link"
            aria-label="Visit runawaydevil's GitHub profile"
          >
            runawaydevil
          </a>
        </p>
      </div>
    </footer>
  )
}

export default Footer