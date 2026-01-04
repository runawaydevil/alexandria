// Core data models
export interface Repository {
  id: number
  owner: string
  name: string
  description: string
  defaultBranch: string
  stars: number
  forks: number
  language: string
  pushedAt: string
  htmlUrl: string
}

export interface FileContent {
  name: string
  path: string
  content: string
  encoding: 'base64' | 'utf-8'
  sha: string
  size: number
  htmlUrl: string
  downloadUrl: string
}

export interface SearchFilters {
  startDate: string
  endDate: string
  minStars: number
  language?: string
  sort: 'updated' | 'stars' | 'forks'
  onlyWithDocs: boolean
}

export interface RateLimit {
  limit: number
  remaining: number
  reset: number
  used: number
}

export interface DocumentContext {
  owner: string
  repo: string
  path: string
  ref: string
  content: string
  links: MarkdownLink[]
}

export interface MarkdownLink {
  href: string
  text: string
  type: 'relative' | 'github-blob' | 'external' | 'anchor'
}

export interface TreeItem {
  path: string
  mode: string
  type: 'blob' | 'tree'
  sha: string
  size?: number
  url: string
}

export interface ReadingHistoryItem {
  owner: string
  repo: string
  path: string
  ref: string
  title: string
  timestamp: number
}

// API interfaces
export interface GitHubApiClient {
  searchRepositories(query: SearchQuery): Promise<Repository[]>
  searchUsers(query: SearchQuery): Promise<any[]>
  getRepository(owner: string, repo: string): Promise<Repository>
  getUserRepositories(username: string): Promise<Repository[]>
  getReadme(owner: string, repo: string, ref?: string): Promise<FileContent>
  getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<FileContent>
  getDirectoryContents(owner: string, repo: string, path?: string, ref?: string): Promise<any[]>
  getTreeRecursive(owner: string, repo: string, ref: string): Promise<TreeItem[]>
  getRateLimit(): Promise<RateLimit>
}

export interface CacheManager {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  invalidate(pattern: string): Promise<void>
  getReadingHistory(): Promise<ReadingHistoryItem[]>
  addToHistory(item: ReadingHistoryItem): Promise<void>
  getCacheHeaders(key: string): { 'If-None-Match'?: string; 'If-Modified-Since'?: string }
  updateCacheHeaders(key: string, etag?: string, lastModified?: string): void
}

export interface RandomEngine {
  getRandomRepository(filters: SearchFilters): Promise<Repository>
  getRandomMarkdownFromRepo(owner: string, repo: string): Promise<FileContent>
  getNextFromTrail(currentDoc: DocumentContext): Promise<FileContent | null>
}

export interface SearchQuery {
  q: string
  sort?: 'updated' | 'stars' | 'forks'
  order?: 'asc' | 'desc'
  per_page?: number
  page?: number
}

// Error types
export enum ErrorType {
  RATE_LIMITED = 'rate_limited',
  NETWORK_ERROR = 'network_error',
  NOT_FOUND = 'not_found',
  INVALID_CONTENT = 'invalid_content',
  CACHE_ERROR = 'cache_error'
}

export interface ApiError extends Error {
  type: ErrorType
  statusCode?: number
  resetTime?: number
  retryAfter?: number
}

export interface ErrorRecovery {
  canRetry: boolean
  retryAfter?: number
  fallbackContent?: any
  userMessage: string
}

// Configuration error types
export * from './ConfigurationError'

// Component props
export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error }>
}

export interface ThemeContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}