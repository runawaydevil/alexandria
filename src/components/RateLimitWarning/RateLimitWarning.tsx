import React from 'react'
import { isRateLimitError, getRateLimitMessage, getRateLimitResetTime } from '../../utils/errorUtils'
import './RateLimitWarning.css'

interface RateLimitWarningProps {
  error: unknown
  onDismiss?: () => void
  className?: string
}

const RateLimitWarning: React.FC<RateLimitWarningProps> = ({ error, onDismiss, className }) => {
  if (!isRateLimitError(error)) {
    return null
  }

  const message = getRateLimitMessage(error)
  const resetTime = getRateLimitResetTime(error)

  const formatTimeUntilReset = (seconds: number): string => {
    if (seconds <= 0) return 'soon'
    
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    if (minutes > 0) {
      return `${minutes}m`
    }
    return `${seconds}s`
  }

  return (
    <div className={`rate-limit-warning ${className || ''}`} role="alert" aria-live="polite">
      <div className="rate-limit-warning-content">
        <div className="rate-limit-warning-icon" aria-hidden="true">
          ⏳
        </div>
        
        <div className="rate-limit-warning-info">
          <h3 className="rate-limit-warning-title">Rate Limit Exceeded</h3>
          <p className="rate-limit-warning-message">{message}</p>
          
          {resetTime && (
            <p className="rate-limit-warning-time">
              Reset in: {formatTimeUntilReset(resetTime - Math.floor(Date.now() / 1000))}
            </p>
          )}
          
          <p className="rate-limit-warning-help">
            You've been redirected to the previous page. Please wait before trying again.
          </p>
        </div>
        
        {onDismiss && (
          <button
            className="rate-limit-warning-dismiss"
            onClick={onDismiss}
            aria-label="Dismiss rate limit warning"
            title="Dismiss this warning"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

export default RateLimitWarning

