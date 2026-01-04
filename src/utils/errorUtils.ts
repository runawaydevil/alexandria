import { RateLimitError, SecondaryRateLimitError } from '../services/GitHubApiClient'

/**
 * Check if an error is a rate limit error (primary or secondary)
 */
export function isRateLimitError(error: unknown): error is RateLimitError | SecondaryRateLimitError {
  return error instanceof RateLimitError || error instanceof SecondaryRateLimitError
}

/**
 * Extract rate limit reset time from error if available
 */
export function getRateLimitResetTime(error: unknown): number | null {
  if (error instanceof RateLimitError) {
    return error.resetTime
  }
  if (error instanceof SecondaryRateLimitError) {
    // Secondary rate limit: reset time is current time + retryAfter
    return Math.floor(Date.now() / 1000) + error.retryAfter
  }
  return null
}

/**
 * Get user-friendly message for rate limit error
 */
export function getRateLimitMessage(error: unknown): string {
  if (error instanceof RateLimitError) {
    const resetTime = new Date(error.resetTime * 1000)
    const minutesUntilReset = Math.ceil((error.resetTime - Math.floor(Date.now() / 1000)) / 60)
    return `Rate limit exceeded. Please wait approximately ${minutesUntilReset} minute${minutesUntilReset !== 1 ? 's' : ''} before trying again.`
  }
  if (error instanceof SecondaryRateLimitError) {
    return `Rate limit exceeded. Please wait ${error.retryAfter} second${error.retryAfter !== 1 ? 's' : ''} before trying again.`
  }
  return 'Rate limit exceeded. Please wait before trying again.'
}

