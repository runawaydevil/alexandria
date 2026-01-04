import React from 'react'
import './ConfigurationBanner.css'

interface ConfigurationBannerProps {
  owner: string
  repo: string
}

const ConfigurationBanner: React.FC<ConfigurationBannerProps> = ({ owner, repo }) => {
  return (
    <div className="configuration-banner" role="banner" aria-label="Custom configuration notice">
      <div className="banner-content">
        <span className="banner-icon" aria-hidden="true">⚙️</span>
        <span className="banner-text">
          Alexandria is configured to display{' '}
          <strong>{owner}/{repo}</strong>{' '}
          as the home page.
        </span>
        <a 
          href={`https://github.com/${owner}/${repo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="banner-link"
          aria-label={`Visit ${owner}/${repo} on GitHub (opens in new tab)`}
        >
          View Repository
        </a>
      </div>
    </div>
  )
}

export default ConfigurationBanner