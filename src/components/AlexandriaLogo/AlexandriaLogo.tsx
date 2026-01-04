import React from 'react'
import './AlexandriaLogo.css'

interface AlexandriaLogoProps {
  alt?: string
  width?: string | number
}

const AlexandriaLogo: React.FC<AlexandriaLogoProps> = ({ 
  alt = 'Alexandria Logo', 
  width = '200' 
}) => {
  // Simple and robust path resolution
  const getLogoPath = (): string => {
    // Check if we're in GitHub Pages production
    if (window.location.hostname.includes('github.io')) {
      return 'https://runawaydevil.github.io/alexandria/alexandria.png'
    }
    // Development or other environments
    return '/alexandria.png'
  }

  const logoPath = getLogoPath()

  return (
    <div className="alexandria-logo-container">
      <img 
        src={logoPath}
        alt={alt}
        width={width}
        className="alexandria-logo"
        onLoad={() => console.log('✅ Alexandria logo loaded successfully:', logoPath)}
        onError={(e) => {
          console.error('❌ Alexandria logo failed to load:', logoPath)
          console.error('Error details:', e)
        }}
      />
    </div>
  )
}

export default AlexandriaLogo