# Service Layer Documentation

## Service Overview

The service layer contains all business logic and external API communication. Services are organized as classes with clear responsibilities and are instantiated through a factory function.

## Service Architecture

Services are created through the `createServices()` function in `src/services/index.ts`, which provides a centralized way to instantiate and configure all services with proper dependencies.

```typescript
export const createServices = () => {
  const cache = new CacheManager()
  const apiClient = new GitHubApiClient(cache)
  const randomEngine = new RandomEngine(apiClient)
  const linkRewriter = new LinkRewriter()
  const tocGenerator = new TocGenerator(apiClient)
  const shareManager = new ShareManager()
  const configManager = ConfigurationManager.getInstance()
  
  return {
    apiClient,
    randomEngine,
    cache,
    linkRewriter,
    tocGenerator,
    shareManager,
    configManager
  }
}
```

## Core Services

### GitHubApiClient

**File**: `src/services/GitHubApiClient.ts`

Primary service for communicating with GitHub's REST API v3.

#### Responsibilities

- HTTP requests to GitHub API endpoints
- Rate limit monitoring and management
- Request retry logic for network errors
- Response caching coordination
- Error handling and transformation

#### Key Methods

**Repository Operations**:
```typescript
getRepository(owner: string, repo: string): Promise<Repository>
getReadme(owner: string, repo: string, ref?: string): Promise<FileContent>
getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<FileContent>
getDirectoryContents(owner: string, repo: string, path?: string, ref?: string): Promise<any[]>
getTreeRecursive(owner: string, repo: string, ref: string): Promise<TreeItem[]>
```

**Search Operations**:
```typescript
searchRepositories(query: SearchQuery): Promise<Repository[]>
searchUsers(query: SearchQuery): Promise<any[]>
getUserRepositories(username: string): Promise<Repository[]>
```

**Rate Limit Management**:
```typescript
getRateLimit(): Promise<RateLimit>
getCurrentRateLimit(): RateLimit
isRateLimited(): boolean
getTimeUntilReset(): number
```

#### Rate Limit Handling

The client tracks rate limit state from response headers:
- `x-ratelimit-limit`: Total requests allowed
- `x-ratelimit-remaining`: Requests remaining
- `x-ratelimit-reset`: Unix timestamp when limit resets
- `x-ratelimit-used`: Requests used

**Rate Limit Strategies**:
1. Check cache before making request if rate limited
2. Throw `RateLimitError` if no cache available
3. Support secondary rate limits with `retry-after` header
4. Provide user feedback through rate limit state

#### Error Types

**RateLimitError**: Primary rate limit exceeded (403/429)
```typescript
class RateLimitError extends Error {
  type: ErrorType.RATE_LIMITED
  statusCode: number
  resetTime: number
  retryAfter?: number
}
```

**SecondaryRateLimitError**: Secondary rate limit with retry-after
```typescript
class SecondaryRateLimitError extends Error {
  type: ErrorType.RATE_LIMITED
  statusCode: number
  retryAfter: number
}
```

**NetworkError**: Network failures and HTTP errors
```typescript
class NetworkError extends Error {
  type: ErrorType.NETWORK_ERROR
  statusCode?: number
}
```

#### Retry Logic

Network errors (5xx, timeouts) are retried up to 2 times with a 2-second delay. Rate limit errors are not retried.

#### Authentication

Optional GitHub token via `VITE_GITHUB_TOKEN` environment variable:
- Increases rate limit from 60/hour to 5000/hour
- Only included in build-time bundle
- Never logged or exposed in error messages

#### Conditional Requests

Supports HTTP conditional requests:
- `If-None-Match` header with ETag
- `If-Modified-Since` header with Last-Modified
- Returns 304 Not Modified when content unchanged
- Serves from cache on 304 responses

### CacheManager

**File**: `src/services/CacheManager.ts`

Manages local storage for API responses and reading history.

#### Storage Strategy

**Hybrid Storage**:
- **localStorage**: Items < 100KB (fast access)
- **IndexedDB**: Items > 100KB (large capacity)
- **Metadata**: Stored in localStorage for quick lookup

#### Key Methods

**Cache Operations**:
```typescript
get<T>(key: string): Promise<T | null>
set<T>(key: string, value: T, ttl?: number): Promise<void>
invalidate(pattern: string): Promise<void>
```

**Reading History**:
```typescript
getReadingHistory(): Promise<ReadingHistoryItem[]>
addToHistory(item: ReadingHistoryItem): Promise<void>
```

**Conditional Requests**:
```typescript
getCacheHeaders(key: string): { 'If-None-Match'?: string; 'If-Modified-Since'?: string }
updateCacheHeaders(key: string, etag?: string, lastModified?: string): void
```

#### Cache Item Structure

```typescript
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
  etag?: string
  lastModified?: string
}
```

#### TTL and Expiration

- Default TTL: 6 hours
- Expired items are automatically removed on access
- Metadata tracks expiration for quick checks

#### Reading History

- Stored in localStorage as JSON
- Maximum 50 items
- Automatically removes duplicates
- Most recent items first

#### Cache Key Generation

Cache keys are generated from API endpoint and method:
```typescript
`api-${method}-${endpoint}-${body}`
```

### RandomEngine

**File**: `src/services/RandomEngine.ts`

Implements random repository and content discovery algorithms.

#### Discovery Strategies

**Strategy 1: Search API** (Primary)
- Uses GitHub Search API with filters
- Random page selection (1-10)
- Filters: date range, minimum stars, language, documentation presence

**Strategy 2: User-Based** (Fallback)
- Generates random user ID
- Searches for users near that ID
- Gets public repositories from random user
- Selects random repository

#### Key Methods

```typescript
getRandomRepository(filters: SearchFilters): Promise<Repository>
getRandomMarkdownFromRepo(owner: string, repo: string): Promise<FileContent>
getNextFromTrail(currentDoc: DocumentContext): Promise<FileContent | null>
```

#### Default Filters

```typescript
{
  startDate: `${currentYear - 3}-01-01`,  // Last 3 years
  endDate: currentDate,
  minStars: 1,
  sort: 'updated',
  onlyWithDocs: false
}
```

#### Markdown Discovery

1. Try README first
2. If no README, get repository tree recursively
3. Filter for `.md` and `.mdx` files
4. Select random file

#### Link Following

Extracts markdown links from content and follows random relative links to discover related content.

### LinkRewriter

**File**: `src/services/LinkRewriter.ts`

Transforms markdown links into internal navigation routes.

#### Link Types

1. **Anchor Links** (`#heading`): Kept as-is for smooth scrolling
2. **Relative Markdown Links** (`./file.md`): Converted to internal routes
3. **GitHub Blob URLs**: Converted to internal routes
4. **External Links**: Kept with `target="_blank"`

#### Key Methods

```typescript
rewriteHref(href: string, context: DocumentContext): string
rewriteMarkdownLinks(content: string, context: DocumentContext): string
getLinkProps(href: string, context: DocumentContext): { href: string; target?: string; rel?: string }
extractMarkdownLinks(content: string, context: DocumentContext): MarkdownLink[]
```

#### Path Resolution

Handles relative path resolution:
- `./file.md`: Same directory
- `../file.md`: Parent directory
- `file.md`: Current directory
- Prevents path traversal attacks

#### Security

- Validates resolved paths
- Prevents going above repository root
- Sanitizes path components

### TocGenerator

**File**: `src/services/TocGenerator.ts`

Generates table of contents for documents and repositories.

#### Document TOC

Extracts headings from markdown content:
- Regex pattern: `^(#{1,6})\s+(.+)$`
- Generates anchor IDs following GitHub's rules
- Returns hierarchical structure with levels

#### Repository TOC

Discovers all markdown files in repository:
1. **Primary**: Uses Git Trees API (recursive)
2. **Fallback**: Uses Contents API for common directories (`docs`, `.github`)

#### Key Methods

```typescript
generateDocumentToc(markdownContent: string): DocumentToc
generateRepositoryToc(owner: string, repo: string, ref: string): Promise<RepositoryToc>
```

#### Anchor Generation

Follows GitHub's anchor generation rules:
- Lowercase conversion
- Special characters removed
- Spaces to hyphens
- Multiple hyphens collapsed
- Leading/trailing hyphens removed

### ConfigurationManager

**File**: `src/services/ConfigurationManager.ts`

Manages environment-based configuration with validation.

#### Configuration Source

1. **Environment Variables**: `VITE_DEFAULT_OWNER` and `VITE_DEFAULT_REPO`
2. **Fallback**: `runawaydevil/alexandria`

#### Validation

- GitHub username format: 1-39 chars, alphanumeric + hyphens
- Repository name format: alphanumeric, dots, underscores, hyphens, max 100 chars
- Both must be set together for custom config

#### Key Methods

```typescript
getDefaultRepository(): RepositoryIdentifier
isUsingCustomConfig(): boolean
getConfigSource(): string
validateRepositoryIdentifier(owner: string, repo: string): boolean
```

#### Singleton Pattern

Uses singleton pattern to ensure single configuration instance across application.

### ShareManager

**File**: `src/services/ShareManager.ts`

Handles content sharing via Web Share API and clipboard fallback.

#### Sharing Methods

1. **Web Share API**: Native sharing on supported platforms
2. **Clipboard**: Fallback for unsupported platforms
3. **Email**: Mailto link generation

#### Key Methods

```typescript
shareContent(data: ShareData): Promise<boolean>
copyToClipboard(url: string): Promise<boolean>
generateMailtoLink(data: ShareData, options?: ShareOptions): string
generateShareableUrl(owner: string, repo: string, ref: string, path: string): string
printContent(): void
```

#### Print Support

Adds print-optimized CSS styles:
- Hides navigation and UI elements
- Optimizes typography for print
- Shows URLs for links
- Page break controls

## Service Dependencies

```
GitHubApiClient
  └── CacheManager

RandomEngine
  └── GitHubApiClient

TocGenerator
  └── GitHubApiClient

LinkRewriter
  └── (standalone)

ConfigurationManager
  └── (singleton)

ShareManager
  └── (standalone)
```

## Error Handling

All services implement consistent error handling:
- Type-safe error classes
- User-friendly error messages
- Graceful degradation
- Cache fallbacks where applicable

## Service Lifecycle

Services are created once per application lifecycle through `createServices()`. They maintain internal state (rate limits, cache) but are stateless in terms of user sessions.

## Testing Considerations

Services are designed for testability:
- Clear interfaces
- Dependency injection
- Minimal side effects
- Predictable behavior

