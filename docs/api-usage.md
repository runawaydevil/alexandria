# GitHub API Usage

## API Overview

Alexandria uses GitHub's REST API v3 to fetch repository content, search for repositories, and retrieve file contents. All API interactions are performed client-side without requiring user authentication for public repositories.

## API Endpoints Used

### Repository Information

**GET /repos/:owner/:repo**

Retrieves repository metadata including default branch, description, and statistics.

**Usage**:
```typescript
const repository = await apiClient.getRepository(owner, repo)
```

**Response Fields Used**:
- `id`: Repository ID
- `owner.login`: Repository owner username
- `name`: Repository name
- `description`: Repository description
- `default_branch`: Default branch name
- `stargazers_count`: Number of stars
- `forks_count`: Number of forks
- `language`: Primary programming language
- `pushed_at`: Last push timestamp
- `html_url`: Repository URL

### File Content

**GET /repos/:owner/:repo/contents/:path**

Retrieves file content from repository. Supports optional `ref` parameter for specific branch/tag.

**Usage**:
```typescript
const fileContent = await apiClient.getFileContent(owner, repo, path, ref)
```

**Response Fields Used**:
- `name`: File name
- `path`: File path in repository
- `content`: Base64-encoded file content
- `encoding`: Content encoding (usually "base64")
- `sha`: File SHA hash
- `size`: File size in bytes
- `html_url`: File URL on GitHub
- `download_url`: Direct download URL

**Content Decoding**:
Base64 content is decoded with UTF-8 support to handle international characters correctly.

### README Files

**GET /repos/:owner/:repo/readme**

Retrieves repository README file. Supports optional `ref` parameter.

**Usage**:
```typescript
const readme = await apiClient.getReadme(owner, repo, ref)
```

**Response**: Same structure as file content endpoint.

**Fallback Strategy**:
If README not found, system attempts alternative names:
1. Primary repository name
2. "Alexandria" (capitalized)
3. "alexandria" (lowercase)

### Directory Contents

**GET /repos/:owner/:repo/contents/:path**

When path points to directory, returns array of directory entries.

**Usage**:
```typescript
const contents = await apiClient.getDirectoryContents(owner, repo, path, ref)
```

**Response**: Array of file and directory objects.

**Used For**:
- Repository TOC generation (fallback method)
- Directory browsing

### Git Trees (Recursive)

**GET /repos/:owner/:repo/git/trees/:sha?recursive=1**

Retrieves complete repository tree structure recursively.

**Usage**:
```typescript
const tree = await apiClient.getTreeRecursive(owner, repo, ref)
```

**Response Fields Used**:
- `tree`: Array of tree items
  - `path`: File/directory path
  - `mode`: File mode
  - `type`: "blob" or "tree"
  - `sha`: Object SHA
  - `size`: File size (for blobs)
  - `url`: API URL for object

**Used For**:
- Repository TOC generation (primary method)
- Finding all markdown files in repository
- Random file discovery

### Search Repositories

**GET /search/repositories**

Searches for repositories matching query criteria.

**Usage**:
```typescript
const repositories = await apiClient.searchRepositories({
  q: 'pushed:2023-01-01..2024-01-01 stars:>=1',
  sort: 'updated',
  per_page: 100,
  page: 1
})
```

**Query Parameters**:
- `q`: Search query (GitHub search syntax)
- `sort`: Sort order (updated, stars, forks)
- `order`: Sort direction (asc, desc)
- `per_page`: Results per page (max 100)
- `page`: Page number

**Search Query Syntax**:
- Date ranges: `pushed:2023-01-01..2024-01-01`
- Star counts: `stars:>=1`
- Language: `language:typescript`
- Documentation: `in:readme OR filename:README`
- Public only: `is:public`
- Not archived: `archived:false`

**Used For**:
- Random repository discovery
- Filtering repositories by criteria

### Search Users

**GET /search/users**

Searches for GitHub users.

**Usage**:
```typescript
const users = await apiClient.searchUsers({
  q: 'type:user id:>1000',
  per_page: 10
})
```

**Query Parameters**:
- `q`: Search query
- `per_page`: Results per page
- `page`: Page number

**Used For**:
- Random repository discovery (fallback strategy)
- Finding users for repository discovery

### User Repositories

**GET /users/:username/repos**

Retrieves public repositories for a user.

**Usage**:
```typescript
const repos = await apiClient.getUserRepositories(username)
```

**Query Parameters** (defaults):
- `type`: "public"
- `sort`: "updated"
- `per_page`: 100

**Used For**:
- Random repository discovery
- Getting repositories from discovered users

### Rate Limit Status

**GET /rate_limit**

Retrieves current rate limit status.

**Usage**:
```typescript
const rateLimit = await apiClient.getRateLimit()
```

**Response Fields**:
- `rate.limit`: Total requests allowed
- `rate.remaining`: Requests remaining
- `rate.reset`: Unix timestamp when limit resets
- `rate.used`: Requests used

**Note**: Rate limit is also tracked from response headers on every request, so this endpoint is rarely needed.

## Rate Limits

### Unauthenticated Requests

- **Limit**: 60 requests per hour
- **Reset**: Hourly window
- **Headers**: Rate limit info in every response

### Authenticated Requests

- **Limit**: 5,000 requests per hour
- **Reset**: Hourly window
- **Token**: Set via `VITE_GITHUB_TOKEN` environment variable

### Rate Limit Headers

Every API response includes rate limit information:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704067200
X-RateLimit-Used: 15
```

### Secondary Rate Limits

GitHub may apply secondary rate limits for abuse detection:
- **Status**: 403 or 429
- **Header**: `Retry-After` (seconds to wait)
- **Cause**: Too many requests in short time

## Request Headers

### Standard Headers

All requests include:

```typescript
{
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'Alexandria-GitHub-Reader/1.0'
}
```

### Authentication Header

If token is configured:

```typescript
{
  'Authorization': 'token ghp_xxxxxxxxxxxx'
}
```

### Conditional Request Headers

For cached content:

```typescript
{
  'If-None-Match': 'etag-value',
  'If-Modified-Since': 'Wed, 21 Oct 2015 07:28:00 GMT'
}
```

## Response Handling

### Success Responses

- **200 OK**: Content returned successfully
- **304 Not Modified**: Content unchanged, served from cache

### Error Responses

- **403 Forbidden**: Rate limit exceeded or access denied
- **404 Not Found**: Repository or file not found
- **429 Too Many Requests**: Secondary rate limit
- **5xx Server Error**: GitHub API error (retried)

### Error Handling Strategy

1. **Rate Limit Errors**: Try cache fallback, then throw error
2. **Not Found Errors**: Return user-friendly message
3. **Network Errors**: Retry up to 2 times with backoff
4. **Server Errors**: Retry with exponential backoff

## Caching Strategy

### Cache Keys

Cache keys are generated from endpoint and method:

```typescript
`api-${method}-${endpoint}-${body}`
```

### Cache Duration

- **Default TTL**: 6 hours
- **Conditional Requests**: Uses ETag/Last-Modified for 304 responses
- **Cache Headers**: Stored for conditional requests

### Cache Storage

- **Small Items** (< 100KB): localStorage
- **Large Items** (> 100KB): IndexedDB
- **Metadata**: localStorage for quick lookup

## API Optimization Techniques

### Conditional Requests

Uses HTTP conditional requests to avoid re-downloading unchanged content:

1. Store ETag/Last-Modified from previous response
2. Include in next request headers
3. Receive 304 Not Modified if unchanged
4. Serve from cache

### Request Batching

While not implemented, potential optimization:
- Batch multiple file requests
- Use GraphQL API for complex queries
- Reduce total API calls

### Cache-First Strategy

Always check cache before making API request:
1. Check cache for existing data
2. If found and not expired, return cached data
3. If not found or expired, make API request
4. Store response in cache

## API Usage Patterns

### Random Discovery Pattern

1. Search repositories with filters
2. Select random page (1-10)
3. Select random repository from results
4. Get repository tree recursively
5. Filter markdown files
6. Select random file

### Content Loading Pattern

1. Validate repository parameters
2. Get repository info (for default branch)
3. Check cache for content
4. If cache miss, make API request
5. Decode base64 content
6. Store in cache with headers
7. Return content

### TOC Generation Pattern

1. Try Git Trees API (recursive) - fastest
2. If fails, use Contents API for common directories
3. Filter for markdown files
4. Generate TOC structure
5. Cache results

## Best Practices

### Rate Limit Management

1. Monitor rate limit state from headers
2. Use cache to reduce API calls
3. Show user warnings when rate limited
4. Navigate to cached content when possible

### Error Handling

1. Distinguish error types (rate limit, not found, network)
2. Provide appropriate user feedback
3. Retry network errors automatically
4. Don't retry rate limit errors

### Performance

1. Cache all API responses
2. Use conditional requests
3. Minimize unnecessary requests
4. Batch operations when possible

## API Limitations

### Search API Limitations

- **Rate Limit**: 30 requests per minute (authenticated)
- **Results**: Maximum 1,000 results per query
- **Complexity**: Some queries may timeout

### Content API Limitations

- **File Size**: Maximum 100MB per file
- **Base64 Encoding**: All file content is base64-encoded
- **Large Files**: May cause performance issues

### Tree API Limitations

- **Recursive Trees**: May be slow for large repositories
- **Size Limits**: Very large trees may fail
- **Rate Limits**: Counts against API rate limit

## Future Considerations

### GraphQL API

Potential migration to GraphQL API for:
- More efficient data fetching
- Reduced number of requests
- Better type safety
- More flexible queries

### Webhooks

Not applicable for client-side application, but could be used for:
- Cache invalidation
- Real-time updates
- Event-driven architecture

### API Versioning

Currently using API version `2022-11-28`. Should monitor for:
- New API versions
- Deprecated endpoints
- Breaking changes

