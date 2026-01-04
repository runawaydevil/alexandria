/**
 * Validation utilities for GitHub identifiers and paths
 * Prevents path traversal and ensures valid GitHub format
 */

/**
 * Validate GitHub username/owner format
 * Rules: 1-39 characters, alphanumeric and hyphens, cannot start/end with hyphen
 */
export function isValidGitHubOwner(owner: string): boolean {
  if (!owner || owner.length === 0 || owner.length > 39) {
    return false
  }

  // Single character usernames (alphanumeric only)
  if (owner.length === 1) {
    return /^[a-zA-Z0-9]$/.test(owner)
  }

  // Multi-character usernames
  const regex = /^[a-zA-Z0-9]([a-zA-Z0-9-])*[a-zA-Z0-9]$/
  return regex.test(owner)
}

/**
 * Validate GitHub repository name format
 * Rules: alphanumeric, dots, underscores, hyphens, max 100 characters
 */
export function isValidGitHubRepo(repo: string): boolean {
  if (!repo || repo.length === 0 || repo.length > 100) {
    return false
  }

  const regex = /^[a-zA-Z0-9._-]+$/
  return regex.test(repo)
}

/**
 * Validate GitHub ref (branch/tag name)
 * Rules: alphanumeric, dots, underscores, hyphens, slashes (for paths), max 255 characters
 * Must not contain path traversal sequences
 */
export function isValidGitHubRef(ref: string): boolean {
  if (!ref || ref.length === 0 || ref.length > 255) {
    return false
  }

  // Prevent path traversal
  if (ref.includes('..') || ref.includes('//')) {
    return false
  }

  // Allow alphanumeric, dots, underscores, hyphens, slashes
  const regex = /^[a-zA-Z0-9._\-\/]+$/
  return regex.test(ref)
}

/**
 * Validate file path within repository
 * Prevents path traversal attacks
 */
export function isValidRepoPath(path: string): boolean {
  if (!path || path.length === 0) {
    return false
  }

  // Prevent path traversal
  if (path.includes('..') || path.includes('//')) {
    return false
  }

  // Prevent absolute paths
  if (path.startsWith('/')) {
    return false
  }

  // Allow reasonable characters for file paths
  // This is more permissive than strict validation but prevents attacks
  const dangerousChars = /[<>:"|?*\x00-\x1f]/
  if (dangerousChars.test(path)) {
    return false
  }

  return true
}

/**
 * Sanitize and validate owner/repo from URL parameters
 */
export function validateRepositoryParams(owner: string | undefined, repo: string | undefined): {
  valid: boolean
  owner?: string
  repo?: string
  error?: string
} {
  if (!owner || !repo) {
    return { valid: false, error: 'Owner and repository are required' }
  }

  if (!isValidGitHubOwner(owner)) {
    return { valid: false, error: 'Invalid repository owner format' }
  }

  if (!isValidGitHubRepo(repo)) {
    return { valid: false, error: 'Invalid repository name format' }
  }

  return { valid: true, owner, repo }
}

/**
 * Sanitize repository path from URL
 */
export function sanitizeRepoPath(path: string | undefined): string | null {
  if (!path) {
    return null
  }

  // Remove leading/trailing slashes and normalize
  const normalized = path.trim().replace(/^\/+|\/+$/g, '')

  if (!isValidRepoPath(normalized)) {
    return null
  }

  return normalized
}

/**
 * Sanitize GitHub ref from URL
 */
export function sanitizeRef(ref: string | undefined): string | null {
  if (!ref) {
    return null
  }

  const normalized = ref.trim()

  if (!isValidGitHubRef(normalized)) {
    return null
  }

  return normalized
}

