import React from 'react'
import { Link } from 'react-router-dom'
import { RepositoryTocItem } from '../../services/TocGenerator'
import './RepositoryToc.css'

interface RepositoryTocProps {
  items: RepositoryTocItem[]
  currentPath?: string
  className?: string
}

const RepositoryToc: React.FC<RepositoryTocProps> = ({ items, currentPath, className }) => {
  if (items.length === 0) {
    return null
  }

  return (
    <nav className={`repository-toc ${className || ''}`} aria-label="Repository table of contents">
      <h3 className="toc-title">📁 Repository Files</h3>
      <ul className="toc-list">
        {items.map((item) => (
          <li key={item.path} className="toc-item">
            <Link
              to={item.url}
              className={`toc-link ${currentPath === item.path ? 'toc-link-active' : ''}`}
              title={item.path}
            >
              <span className="toc-icon">
                {item.type === 'directory' ? '📁' : '📄'}
              </span>
              <span className="toc-name">{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default RepositoryToc