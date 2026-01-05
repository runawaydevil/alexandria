# Security Documentation

## Security Overview

Alexandria implements multiple layers of security to protect users and prevent common web vulnerabilities. Security is considered at every level of the application, from input validation to content sanitization.

## Input Validation

### URL Parameter Validation

All URL parameters are validated before processing to prevent injection attacks and ensure data integrity.

#### Repository Owner Validation

**Rules**:
- 1-39 characters
- Alphanumeric and hyphens only
- Cannot start or end with hyphen
- Single character must be alphanumeric

**Implementation**: `src/utils/validationUtils.ts`

```typescript
export function isValidGitHubOwner(owner: string): boolean {
  if (!owner || owner.length === 0 || owner.length > 39) {
    return false
  }
  
  if (owner.length === 1) {
    return /^[a-zA-Z0-9]$/.test(owner)
  }
  
  const regex = /^[a-zA-Z0-9]([a-zA-Z0-9-])*[a-zA-Z0-9]$/
  return regex.test(owner)
}
```

#### Repository Name Validation

**Rules**:
- Alphanumeric, dots, underscores, hyphens
- Maximum 100 characters
- Cannot be empty

**Implementation**: `src/utils/validationUtils.ts`

```typescript
export function isValidGitHubRepo(repo: string): boolean {
  if (!repo || repo.length === 0 || repo.length > 100) {
    return false
  }
  
  const regex = /^[a-zA-Z0-9._-]+$/
  return regex.test(repo)
}
```

#### Path Validation

**Rules**:
- Prevents path traversal (`..`, `//`)
- Prevents absolute paths (starting with `/`)
- Blocks dangerous characters (`<`, `>`, `:`, `|`, `?`, `*`, control characters)

**Implementation**: `src/utils/validationUtils.ts`

```typescript
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
  
  // Block dangerous characters
  const dangerousChars = /[<>:"|?*\x00-\x1f]/
  if (dangerousChars.test(path)) {
    return false
  }
  
  return true
}
```

#### Reference (Branch/Tag) Validation

**Rules**:
- Alphanumeric, dots, underscores, hyphens, slashes
- Maximum 255 characters
- Prevents path traversal sequences

**Implementation**: `src/utils/validationUtils.ts`

```typescript
export function isValidGitHubRef(ref: string): boolean {
  if (!ref || ref.length === 0 || ref.length > 255) {
    return false
  }
  
  // Prevent path traversal
  if (ref.includes('..') || ref.includes('//')) {
    return false
  }
  
  const regex = /^[a-zA-Z0-9._\-\/]+$/
  return regex.test(ref)
}
```

### Path Traversal Prevention

The system prevents path traversal attacks through multiple mechanisms:

1. **Validation**: All paths validated before use
2. **Sanitization**: Paths sanitized to remove dangerous sequences
3. **Resolution Limits**: Relative path resolution prevents going above repository root

**Implementation**: `src/services/LinkRewriter.ts`

```typescript
private resolveRelativePath(href: string, currentPath: string): string {
  // ... resolution logic ...
  
  // Prevent going above repository root
  if (upCount > pathParts.length) {
    resolvedPath = hrefParts.slice(upCount).join('/')
  }
  
  // Validate resolved path
  if (!isValidRepoPath(resolvedPath)) {
    return href // Return original if invalid
  }
  
  return resolvedPath
}
```

## Content Sanitization

### HTML Sanitization

All markdown content is sanitized before rendering to prevent XSS attacks.

**Implementation**: `src/components/MarkdownRenderer/MarkdownRenderer.tsx`

#### Allowed Tags

Only safe HTML tags are allowed:
- Headings: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`
- Text: `p`, `br`, `strong`, `em`, `del`, `ins`
- Lists: `ul`, `ol`, `li`
- Code: `pre`, `code`
- Tables: `table`, `thead`, `tbody`, `tr`, `th`, `td`
- Links: `a`
- Images: `img`
- Other: `blockquote`, `hr`, `div`, `span`

#### Blocked Tags

The following dangerous tags are explicitly blocked:
- `script` - Prevents JavaScript execution
- `iframe` - Prevents embedded content
- `object` - Prevents plugin execution
- `embed` - Prevents plugin execution
- `form` - Prevents form submission
- `input` - Prevents form input
- Event handlers - All event attributes blocked

#### Attribute Whitelist

Attributes are restricted per tag:

```typescript
attributes: {
  '*': ['className', 'id'],
  'a': ['href', 'target', 'rel', 'title'],
  'img': ['src', 'alt', 'width', 'height', 'title'],
  'div': ['align'],
  'h1': ['id'],
  // ... other headings with id
}
```

**Note**: `style` attribute is explicitly excluded to prevent CSS injection attacks.

#### Protocol Whitelist

Only safe protocols are allowed:

```typescript
protocols: {
  'a': {
    href: ['http', 'https', 'mailto']
  },
  'img': {
    src: ['http', 'https', 'data'] // data: URLs for base64 images
  }
}
```

**Blocked Protocols**:
- `javascript:` - Prevents script execution
- `vbscript:` - Prevents script execution
- `data:text/html` - Prevents HTML injection via data URLs (except images)

### Markdown Processing Security

The markdown processing pipeline includes:

1. **remark-gfm**: Processes GitHub Flavored Markdown safely
2. **rehype-raw**: Processes raw HTML (then sanitized)
3. **rehype-sanitize**: Sanitizes HTML with whitelist
4. **rehype-highlight**: Syntax highlighting (safe, no execution)

## API Security

### Token Security

GitHub tokens are handled securely:

1. **Build-time Only**: Tokens only available at build time via environment variables
2. **No Exposure**: Tokens never logged or included in error messages
3. **Client Bundle**: Only `VITE_` prefixed variables included in bundle
4. **Read-only**: Tokens only need public read access (no write scopes)

**Implementation**: `src/services/GitHubApiClient.ts`

```typescript
constructor(private cache?: CacheManager) {
  const token = import.meta.env.VITE_GITHUB_TOKEN
  if (token) {
    this.defaultHeaders['Authorization'] = `token ${token}`
    // Token is safe - only in build-time bundle
  }
}
```

### Request Security

All API requests include:
- Proper headers (User-Agent, API version)
- Input validation before requests
- Error handling without exposing sensitive data
- Rate limit protection

### Response Validation

API responses are validated:
- Type checking with TypeScript
- Null/undefined checks
- Expected structure validation
- Error response handling

## Rate Limit Protection

### Rate Limit Handling

The system protects against rate limit exhaustion:

1. **Monitoring**: Tracks rate limit state from response headers
2. **Cache Fallback**: Serves cached content when rate limited
3. **User Feedback**: Clear warnings about rate limit status
4. **Automatic Recovery**: Navigates to cached content when possible

**Implementation**: `src/services/GitHubApiClient.ts`

```typescript
private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Check rate limit before making request
  if (this.rateLimitState.remaining === 0) {
    // Try to serve from cache if available
    const cacheKey = this.generateCacheKey(endpoint, options)
    if (this.cache) {
      const cached = await this.cache.get<T>(cacheKey)
      if (cached) {
        console.warn('Rate limited, serving from cache:', endpoint)
        return cached
      }
    }
    throw new RateLimitError(this.rateLimitState.reset)
  }
  
  // ... make request ...
}
```

### Secondary Rate Limits

Handles GitHub's secondary rate limits (abuse detection):

```typescript
if (response.status === 403 || response.status === 429) {
  const retryAfter = response.headers.get('retry-after')
  
  if (retryAfter) {
    // Secondary rate limit with retry-after header
    throw new SecondaryRateLimitError(parseInt(retryAfter, 10), response.status)
  }
}
```

## Local Storage Security

### Data Isolation

- Cache keys are namespaced to prevent conflicts
- Reading history is isolated to application
- No sensitive data stored locally

### Storage Limits

- localStorage: Used for small items (< 100KB) and metadata
- IndexedDB: Used for large items (> 100KB)
- Reading history: Limited to 50 items

### Cache Expiration

All cached data has TTL (Time To Live):
- Default: 6 hours
- Expired items automatically removed
- Prevents stale data accumulation

## Content Security Policy

### Recommended CSP Headers

For deployments, consider adding Content Security Policy headers:

```
Content-Security-Policy: default-src 'self'; 
  script-src 'self' 'unsafe-inline'; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: https:; 
  connect-src 'self' https://api.github.com;
  font-src 'self';
```

**Note**: `unsafe-inline` may be needed for Vite's HMR in development. Consider nonce-based CSP for production.

## Security Best Practices Implemented

### Defense in Depth

Multiple security layers:
1. Input validation
2. Content sanitization
3. Path traversal prevention
4. Rate limit protection
5. Error handling without information leakage

### Principle of Least Privilege

- GitHub tokens only have read access
- No write or admin scopes
- Minimal required permissions

### Fail Secure

- Invalid input rejected
- Errors don't expose sensitive information
- Fallback to safe defaults

### Input Validation

- Validate early
- Validate on client and server (if applicable)
- Sanitize before processing
- Validate output format

### Error Handling

- Generic error messages for users
- Detailed errors only in development
- No stack traces in production
- No sensitive data in error messages

## Security Considerations

### Known Limitations

1. **Client-Side Only**: All security is client-side. Malicious users can bypass client-side checks, but this doesn't affect other users.

2. **GitHub API Dependency**: Security depends on GitHub API security. The application trusts GitHub API responses.

3. **CORS**: Relies on GitHub API CORS policy. GitHub allows requests from any origin for public endpoints.

4. **Content Trust**: Markdown content from repositories is trusted after sanitization. Repository owners control content.

### Recommendations

1. **HTTPS Only**: Always deploy over HTTPS to prevent man-in-the-middle attacks.

2. **CSP Headers**: Implement Content Security Policy headers for additional protection.

3. **Regular Updates**: Keep dependencies updated to patch security vulnerabilities.

4. **Security Audits**: Regularly audit dependencies with `npm audit`.

5. **Token Rotation**: Rotate GitHub tokens periodically if used.

## Reporting Security Issues

If you discover a security vulnerability:

1. Do not open a public issue
2. Contact the maintainer privately
3. Provide detailed information about the vulnerability
4. Allow time for fix before public disclosure

## Security Checklist

When adding new features:

- [ ] Validate all user input
- [ ] Sanitize all rendered content
- [ ] Prevent path traversal
- [ ] Handle errors securely
- [ ] Test with malicious input
- [ ] Review dependency security
- [ ] Update documentation
- [ ] Consider rate limit impact

