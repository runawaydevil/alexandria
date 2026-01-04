import React, { useState, useEffect } from 'react'
import { createServices } from '../../services'
import { RateLimit } from '../../types'
import './RateLimitBanner.css'

interface RateLimitBannerProps {
  className?: string
}

const RateLimitBanner: React.FC<RateLimitBannerProps> = ({ className }) => {
  const [rateLimit, setRateLimit] = useState<RateLimit | null>(null)
  const [timeUntilReset, setTimeUntilReset] = useState<number>(0)
  const [isVisible, setIsVisible] = useState(false)
  const { apiClient } = createServices()

  useEffect(() => {
    checkRateLimit()
    const interval = setInterval(checkRateLimit, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (rateLimit && rateLimit.remaining <= 10) {
      setIsVisible(true)
      const countdownInterval = setInterval(updateCountdown, 1000)
      
      return () => clearInterval(countdownInterval)
    } else {
      setIsVisible(false)
    }
  }, [rateLimit])

  const checkRateLimit = async () => {
    try {
      const currentRateLimit = apiClient.getCurrentRateLimit()
      setRateLimit(currentRateLimit)
      
      if (currentRateLimit.remaining <= 10) {
        const timeLeft = apiClient.getTimeUntilReset()
        setTimeUntilReset(timeLeft)
      }
    } catch (error) {
      console.warn('Failed to check rate limit:', error)
    }
  }

  const updateCountdown = () => {
    if (rateLimit) {
      const timeLeft = apiClient.getTimeUntilReset()
      setTimeUntilReset(timeLeft)
      
      if (timeLeft <= 0) {
        // Rate limit has reset, check again
        checkRateLimit()
      }
    }
  }

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '0s'
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  const getRateLimitStatus = (): 'good' | 'warning' | 'critical' => {
    if (!rateLimit) return 'good'
    
    const percentage = (rateLimit.remaining / rateLimit.limit) * 100
    
    if (percentage <= 5) return 'critical'
    if (percentage <= 20) return 'warning'
    return 'good'
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  if (!isVisible || !rateLimit) {
    return null
  }

  const status = getRateLimitStatus()

  return (
    <div className={`rate-limit-banner rate-limit-${status} ${className || ''}`}>
      <div className="rate-limit-content">
        <div className="rate-limit-icon">
          {status === 'critical' ? '🚨' : status === 'warning' ? '⚠️' : 'ℹ️'}
        </div>
        
        <div className="rate-limit-info">
          <div className="rate-limit-title">
            {status === 'critical' ? 'Rate Limit Critical' : 'Rate Limit Warning'}
          </div>
          
          <div className="rate-limit-details">
            <span className="rate-limit-remaining">
              {rateLimit.remaining} of {rateLimit.limit} requests remaining
            </span>
            
            {rateLimit.remaining === 0 ? (
              <span className="rate-limit-reset">
                Resets in {formatTime(timeUntilReset)}
              </span>
            ) : (
              <span className="rate-limit-reset">
                Resets in {formatTime(timeUntilReset)}
              </span>
            )}
          </div>
          
          {rateLimit.remaining === 0 && (
            <div className="rate-limit-message">
              Using cached content while waiting for rate limit reset
            </div>
          )}
        </div>
        
        <button
          className="rate-limit-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss rate limit banner"
          title="Dismiss this notification"
        >
          ✕
        </button>
      </div>
      
      <div className="rate-limit-progress">
        <div 
          className="rate-limit-progress-bar"
          style={{ 
            width: `${(rateLimit.remaining / rateLimit.limit) * 100}%` 
          }}
        />
      </div>
    </div>
  )
}

export default RateLimitBanner