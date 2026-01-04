import { 
  GitHubApiClient as IGitHubApiClient, 
  Repository, 
  FileContent, 
  TreeItem, 
  RateLimit, 
  SearchQuery, 
  ApiError, 
  ErrorType,
  CacheManager
} from '../types'

// Request queue item interface
interface QueuedRequest<T> {
  execute: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
}

// Rate limit error class
export class RateLimitError extends Error implements ApiError {
  type = ErrorType.RATE_LIMITED as const
  statusCode: number
  resetTime: number
  retryAfter?: number

  constructor(resetTime: number, statusCode = 403, retryAfter?: number) {
    super(`Rate limit exceeded. Reset at ${new Date(resetTime * 1000).toISOString()}`)
    this.name = 'RateLimitError'
    this.resetTime = resetTime
    this.statusCode = statusCode
    this.retryAfter = retryAfter
  }
}

// Secondary rate limit error class
export class SecondaryRateLimitError extends Error implements ApiError {
  type = ErrorType.RATE_LIMITED as const
  statusCode: number
  retryAfter: number

  constructor(retryAfter: number, statusCode = 403) {
    super(`Secondary rate limit exceeded. Retry after ${retryAfter} seconds`)
    this.name = 'SecondaryRateLimitError'
    this.statusCode = statusCode
    this.retryAfter = retryAfter
  }
}

// Network error class
export class NetworkError extends Error implements ApiError {
  type = ErrorType.NETWORK_ERROR as const
  statusCode?: number

  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = 'NetworkError'
    this.statusCode = statusCode
  }
}

// Request queue implementation
class RequestQueue {
  private queue: QueuedRequest<any>[] = []
  private processing = false
  private readonly delayBetweenRequests = 100 // 100ms between requests

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute: requestFn,
        resolve,
        reject
      })
      
      this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    while (this.queue.length > 0) {
      const request = this.queue.shift()!
      
      try {
        const result = await request.execute()
        request.resolve(result)
      } catch (error) {
        request.reject(error as Error)
      }

      // Add delay between requests to prevent spam
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests))
      }
    }

    this.processing = false
  }
}

export class GitHubApiClient implements IGitHubApiClient {
  private requestQueue = new RequestQueue()
  private rateLimitState: RateLimit = {
    limit: 60,
    remaining: 60,
    reset: Math.floor(Date.now() / 1000) + 3600,
    used: 0
  }

  private readonly baseUrl = 'https://api.github.com'
  private readonly defaultHeaders = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Alexandria-GitHub-Reader/1.0'
  }

  // Retry configuration
  private readonly maxRetries = 3
  private readonly baseRetryDelay = 1000 // 1 second
  private readonly maxRetryDelay = 30000 // 30 seconds

  constructor(private cache?: CacheManager) {}

  async searchRepositories(query: SearchQuery): Promise<Repository[]> {
    const searchParams = new URLSearchParams({
      q: query.q,
      ...(query.sort && { sort: query.sort }),
      ...(query.order && { order: query.order }),
      ...(query.per_page && { per_page: query.per_page.toString() }),
      ...(query.page && { page: query.page.toString() })
    })

    const response = await this.makeRequest<{ items: any[] }>(`/search/repositories?${searchParams}`)
    
    return response.items.map(this.mapRepositoryResponse)
  }

  async getRepository(owner: string, repo: string): Promise<Repository> {
    const response = await this.makeRequest<any>(`/repos/${owner}/${repo}`)
    return this.mapRepositoryResponse(response)
  }

  async getReadme(owner: string, repo: string, ref?: string): Promise<FileContent> {
    const path = ref ? `/repos/${owner}/${repo}/readme?ref=${ref}` : `/repos/${owner}/${repo}/readme`
    const response = await this.makeRequest<any>(path)
    return this.mapFileContentResponse(response)
  }

  async getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<FileContent> {
    const endpoint = ref 
      ? `/repos/${owner}/${repo}/contents/${path}?ref=${ref}`
      : `/repos/${owner}/${repo}/contents/${path}`
    
    const response = await this.makeRequest<any>(endpoint)
    return this.mapFileContentResponse(response)
  }

  async getTreeRecursive(owner: string, repo: string, ref: string): Promise<TreeItem[]> {
    const response = await this.makeRequest<{ tree: any[] }>(`/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`)
    
    return response.tree.map(item => ({
      path: item.path,
      mode: item.mode,
      type: item.type,
      sha: item.sha,
      size: item.size,
      url: item.url
    }))
  }

  async getRateLimit(): Promise<RateLimit> {
    const response = await this.makeRequest<{ rate: any }>('/rate_limit')
    
    return {
      limit: response.rate.limit,
      remaining: response.rate.remaining,
      reset: response.rate.reset,
      used: response.rate.used
    }
  }

  async searchUsers(query: SearchQuery): Promise<any[]> {
    const searchParams = new URLSearchParams({
      q: query.q,
      ...(query.sort && { sort: query.sort }),
      ...(query.order && { order: query.order }),
      ...(query.per_page && { per_page: query.per_page.toString() }),
      ...(query.page && { page: query.page.toString() })
    })

    const response = await this.makeRequest<{ items: any[] }>(`/search/users?${searchParams}`)
    return response.items
  }

  async getUserRepositories(username: string): Promise<Repository[]> {
    const response = await this.makeRequest<any[]>(`/users/${username}/repos?type=public&sort=updated&per_page=100`)
    return response.map(this.mapRepositoryResponse)
  }

  async getDirectoryContents(owner: string, repo: string, path: string = '', ref?: string): Promise<any[]> {
    const endpoint = ref 
      ? `/repos/${owner}/${repo}/contents/${path}?ref=${ref}`
      : `/repos/${owner}/${repo}/contents/${path}`
    
    const response = await this.makeRequest<any[]>(endpoint)
    return Array.isArray(response) ? response : [response]
  }

  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // Check rate limit before queuing
    if (this.rateLimitState.remaining === 0) {
      throw new RateLimitError(this.rateLimitState.reset)
    }

    // Queue request to prevent parallel spam
    return this.requestQueue.add(() => this.executeRequestWithRetry<T>(endpoint, options))
  }

  private async executeRequestWithRetry<T>(endpoint: string, options?: RequestInit, retryCount = 0): Promise<T> {
    try {
      return await this.executeRequest<T>(endpoint, options)
    } catch (error) {
      // Handle secondary rate limits with exponential backoff
      if (error instanceof SecondaryRateLimitError && retryCount < this.maxRetries) {
        const delay = this.calculateExponentialBackoff(retryCount, error.retryAfter)
        await this.sleep(delay)
        return this.executeRequestWithRetry<T>(endpoint, options, retryCount + 1)
      }

      // Handle network errors with exponential backoff
      if (error instanceof NetworkError && retryCount < this.maxRetries && this.isRetryableError(error)) {
        const delay = this.calculateExponentialBackoff(retryCount)
        await this.sleep(delay)
        return this.executeRequestWithRetry<T>(endpoint, options, retryCount + 1)
      }

      throw error
    }
  }

  private async executeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const cacheKey = this.generateCacheKey(endpoint, options)
    
    try {
      // Check cache first
      if (this.cache) {
        const cached = await this.cache.get<T>(cacheKey)
        if (cached) {
          return cached
        }
      }

      // Add conditional headers if cache is available
      const conditionalHeaders = this.cache ? this.cache.getCacheHeaders(cacheKey) : {}
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...conditionalHeaders,
          ...options?.headers
        }
      })

      // Update rate limit state from headers
      this.updateRateLimitFromHeaders(response.headers)

      // Handle 304 Not Modified
      if (response.status === 304 && this.cache) {
        const cached = await this.cache.get<T>(cacheKey)
        if (cached) {
          return cached
        }
      }

      // Handle rate limit responses
      if (response.status === 403 || response.status === 429) {
        const retryAfter = response.headers.get('retry-after')
        
        if (retryAfter) {
          // Secondary rate limit with retry-after header
          throw new SecondaryRateLimitError(parseInt(retryAfter, 10), response.status)
        } else {
          // Primary rate limit - try to serve from cache
          if (this.cache) {
            const cached = await this.cache.get<T>(cacheKey)
            if (cached) {
              console.warn('Rate limited, serving from cache:', endpoint)
              return cached
            }
          }
          const resetTime = this.rateLimitState.reset
          throw new RateLimitError(resetTime, response.status)
        }
      }

      // Handle other HTTP errors
      if (!response.ok) {
        throw new NetworkError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        )
      }

      const data = await response.json()
      
      // Cache successful responses
      if (this.cache) {
        await this.cache.set(cacheKey, data, 6 * 60 * 60 * 1000) // 6 hours TTL
        
        // Update cache headers for conditional requests
        const etag = response.headers.get('etag')
        const lastModified = response.headers.get('last-modified')
        if (etag || lastModified) {
          this.cache.updateCacheHeaders(cacheKey, etag || undefined, lastModified || undefined)
        }
      }
      
      return data as T

    } catch (error) {
      if (error instanceof RateLimitError || error instanceof NetworkError || error instanceof SecondaryRateLimitError) {
        // If we have a rate limit or network error, try to serve from cache
        if (this.cache && (error instanceof RateLimitError || error instanceof NetworkError)) {
          const cached = await this.cache.get<T>(cacheKey)
          if (cached) {
            console.warn('Error occurred, serving from cache:', error.message)
            return cached
          }
        }
        throw error
      }
      
      // Handle network/fetch errors
      throw new NetworkError(
        error instanceof Error ? error.message : 'Unknown network error'
      )
    }
  }

  private updateRateLimitFromHeaders(headers: Headers): void {
    const limit = headers.get('x-ratelimit-limit')
    const remaining = headers.get('x-ratelimit-remaining')
    const reset = headers.get('x-ratelimit-reset')
    const used = headers.get('x-ratelimit-used')

    if (limit && remaining && reset && used) {
      this.rateLimitState = {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
        used: parseInt(used, 10)
      }
    }
  }

  private mapRepositoryResponse(item: any): Repository {
    return {
      id: item.id,
      owner: item.owner.login,
      name: item.name,
      description: item.description || '',
      defaultBranch: item.default_branch,
      stars: item.stargazers_count,
      forks: item.forks_count,
      language: item.language || '',
      pushedAt: item.pushed_at,
      htmlUrl: item.html_url
    }
  }

  private mapFileContentResponse(item: any): FileContent {
    return {
      name: item.name,
      path: item.path,
      content: item.content,
      encoding: item.encoding,
      sha: item.sha,
      size: item.size,
      htmlUrl: item.html_url,
      downloadUrl: item.download_url
    }
  }

  // Getter for current rate limit state (useful for UI)
  getCurrentRateLimit(): RateLimit {
    return { ...this.rateLimitState }
  }

  private calculateExponentialBackoff(retryCount: number, baseDelay?: number): number {
    const delay = baseDelay ? baseDelay * 1000 : this.baseRetryDelay
    const exponentialDelay = delay * Math.pow(2, retryCount)
    const jitter = Math.random() * 0.1 * exponentialDelay // Add 10% jitter
    
    return Math.min(exponentialDelay + jitter, this.maxRetryDelay)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private isRetryableError(error: NetworkError): boolean {
    // Retry on network errors and certain HTTP status codes
    if (!error.statusCode) return true // Network/fetch errors
    
    // Retry on server errors (5xx) and some client errors
    return error.statusCode >= 500 || 
           error.statusCode === 408 || // Request Timeout
           error.statusCode === 429    // Too Many Requests (if not caught as rate limit)
  }

  // Method to check if we're currently rate limited
  isRateLimited(): boolean {
    const now = Math.floor(Date.now() / 1000)
    return this.rateLimitState.remaining === 0 && now < this.rateLimitState.reset
  }

  // Method to get time until rate limit reset
  getTimeUntilReset(): number {
    const now = Math.floor(Date.now() / 1000)
    return Math.max(0, this.rateLimitState.reset - now)
  }

  private generateCacheKey(endpoint: string, options?: RequestInit): string {
    // Create a simple cache key based on endpoint and method
    const method = options?.method || 'GET'
    const body = options?.body ? JSON.stringify(options.body) : ''
    return `api-${method}-${endpoint}-${body}`.replace(/[^a-zA-Z0-9-_]/g, '-')
  }
}