import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { createServices } from '../../services'
import { ReadingHistoryItem } from '../../types'
import './NavigationHistory.css'

interface NavigationHistoryProps {
  currentPath?: string
  className?: string
}

const NavigationHistory: React.FC<NavigationHistoryProps> = ({ currentPath, className }) => {
  const [history, setHistory] = useState<ReadingHistoryItem[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const { cache } = createServices()

  useEffect(() => {
    loadHistory()
  }, [currentPath])

  const loadHistory = async () => {
    try {
      const historyItems = await cache.getReadingHistory()
      // Filter out current item and limit to 5 recent items
      const filtered = historyItems
        .filter(item => {
          const itemPath = `/r/${item.owner}/${item.repo}/blob/${item.ref}/${item.path}`
          return itemPath !== currentPath
        })
        .slice(0, 5)
      
      setHistory(filtered)
    } catch (error) {
      console.warn('Failed to load navigation history:', error)
    }
  }

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  if (history.length === 0) {
    return null
  }

  return (
    <nav className={`navigation-history ${className || ''}`} aria-label="Recent reading history">
      <div className="history-header">
        <button
          className="history-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Hide' : 'Show'} recent reading history`}
        >
          📚 Recent ({history.length})
          <span className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
        </button>
      </div>
      
      {isExpanded && (
        <ul className="history-list">
          {history.map((item, index) => (
            <li key={`${item.owner}-${item.repo}-${item.path}-${index}`} className="history-item">
              <Link
                to={`/r/${item.owner}/${item.repo}/blob/${item.ref}/${item.path}`}
                className="history-link"
                title={`${item.owner}/${item.repo} - ${item.title}`}
              >
                <div className="history-content">
                  <div className="history-title">{item.title}</div>
                  <div className="history-meta">
                    <span className="history-repo">{item.owner}/{item.repo}</span>
                    <span className="history-time">{formatTimeAgo(item.timestamp)}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}

export default NavigationHistory