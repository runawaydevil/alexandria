import React from 'react'
import { Link } from 'react-router-dom'
import './Breadcrumb.css'

interface BreadcrumbProps {
  owner: string
  repo: string
  path?: string
  ref?: string
  className?: string
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ owner, repo, path, ref, className }) => {
  const pathParts = path ? path.split('/').filter(part => part) : []
  
  return (
    <nav className={`breadcrumb ${className || ''}`} aria-label="Breadcrumb navigation">
      <ol className="breadcrumb-list">
        <li className="breadcrumb-item">
          <Link to="/" className="breadcrumb-link">
            🏠 Alexandria
          </Link>
        </li>
        
        <li className="breadcrumb-separator" aria-hidden="true">/</li>
        
        <li className="breadcrumb-item">
          <Link to={`/r/${owner}/${repo}`} className="breadcrumb-link">
            📁 {owner}/{repo}
          </Link>
        </li>
        
        {pathParts.length > 0 && (
          <>
            <li className="breadcrumb-separator" aria-hidden="true">/</li>
            
            {pathParts.map((part, index) => {
              const isLast = index === pathParts.length - 1
              const partialPath = pathParts.slice(0, index + 1).join('/')
              const url = `/r/${owner}/${repo}/blob/${ref || 'main'}/${partialPath}`
              
              return (
                <React.Fragment key={index}>
                  <li className={`breadcrumb-item ${isLast ? 'breadcrumb-current' : ''}`}>
                    {isLast ? (
                      <span className="breadcrumb-current-text" aria-current="page">
                        📄 {part}
                      </span>
                    ) : (
                      <Link to={url} className="breadcrumb-link">
                        {index === pathParts.length - 2 ? '📄' : '📁'} {part}
                      </Link>
                    )}
                  </li>
                  {!isLast && (
                    <li className="breadcrumb-separator" aria-hidden="true">/</li>
                  )}
                </React.Fragment>
              )
            })}
          </>
        )}
      </ol>
    </nav>
  )
}

export default Breadcrumb