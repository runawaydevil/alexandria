# Features Documentation

## Feature Overview

Alexandria provides a comprehensive set of features for discovering, reading, and navigating GitHub markdown content. Features are designed to work together seamlessly to create an infinite reading experience.

## Core Features

### Random Content Discovery

Discover random repositories and markdown files from GitHub's vast collection of public repositories.

#### Global Random Discovery

**Functionality**:
- Searches GitHub for random repositories matching criteria
- Filters for active, documented repositories
- Selects random repository from results
- Finds random markdown file in repository
- Navigates to discovered content

**Usage**:
- Click "Discover Random Content" button on Home page
- Click "Random Global" button on Reader page

**Discovery Strategy**:
1. **Primary**: Uses GitHub Search API with filters
   - Date range: Last 3 years
   - Minimum stars: 1
   - Sort by: Updated
   - Random page selection (1-10)
2. **Fallback**: User-based discovery
   - Generates random user ID
   - Searches for users near that ID
   - Gets repositories from random user
   - Selects random repository

**Filters**:
- Active repositories (pushed in last 3 years)
- Minimum 1 star
- Public repositories only
- Not archived
- Optional: Specific language
- Optional: Documentation requirement

#### Repository-Specific Random Discovery

**Functionality**:
- Discovers random markdown files within current repository
- Uses repository tree to find all markdown files
- Selects random file from available files
- Navigates to selected file

**Usage**:
- Click "Random from [repo]" button on Reader page

**Discovery Process**:
1. Get repository tree recursively
2. Filter for `.md` and `.mdx` files
3. Select random file from list
4. Load and display file content

### Intelligent Link Following

Markdown links are automatically converted to internal navigation links, enabling seamless traversal between related documents.

#### Link Types Handled

**Relative Markdown Links**:
- `./file.md` - Same directory
- `../file.md` - Parent directory
- `file.md` - Current directory
- Converted to: `/r/owner/repo/blob/ref/path`

**GitHub Blob URLs**:
- `https://github.com/owner/repo/blob/ref/path.md`
- Converted to: `/r/owner/repo/blob/ref/path`

**Anchor Links**:
- `#heading` - Document sections
- Kept as-is for smooth scrolling

**External Links**:
- `https://example.com` - External websites
- Kept with `target="_blank"` for new tab

#### Path Resolution

The system intelligently resolves relative paths:
- Handles `./` and `../` navigation
- Prevents path traversal attacks
- Validates resolved paths
- Falls back safely on errors

#### Link Rewriting Process

1. Extract link from markdown content
2. Determine link type (relative, external, anchor, GitHub URL)
3. Resolve relative paths based on current document location
4. Convert to internal route format
5. Render with appropriate attributes

### Reading History

Maintains a local history of viewed documents for quick navigation back to previously read content.

#### History Features

**Storage**:
- Stored in browser localStorage
- Maximum 50 items
- Automatically removes duplicates
- Most recent items first

**History Items**:
- Repository owner and name
- File path
- Branch/tag reference
- Document title
- Timestamp

**Display**:
- Shows last 5 viewed documents (excluding current)
- Expandable/collapsible list
- Time-ago formatting (just now, 5m ago, 2h ago, 3d ago)
- Click to navigate to previous document

**Usage**:
- Automatically added when viewing documents
- Displayed in Reader page sidebar
- Used for navigation fallback on rate limits

### Table of Contents

Two types of table of contents provide navigation aids for documents and repositories.

#### Document TOC

**Functionality**:
- Extracts headings from markdown content
- Generates hierarchical structure
- Creates anchor links for smooth scrolling
- Displays in sidebar

**Features**:
- Supports headings h1 through h6
- Visual indentation for hierarchy
- Click to scroll to section
- Highlights current section (if implemented)

**Generation**:
- Regex pattern: `^(#{1,6})\s+(.+)$`
- Anchor generation follows GitHub's rules
- Preserves heading text and structure

#### Repository TOC

**Functionality**:
- Lists all markdown files in repository
- Organized by directory structure
- Highlights current file
- Clickable links to navigate

**Features**:
- Shows all `.md` and `.mdx` files
- Includes README files
- Current file highlighted
- Quick navigation to any file

**Generation Methods**:
1. **Primary**: Git Trees API (recursive)
   - Fastest method
   - Gets complete repository structure
   - Filters for markdown files
2. **Fallback**: Contents API
   - For common directories (`docs`, `.github`)
   - Used if tree API fails
   - Less complete but functional

### Repository Navigation

Navigate to any public GitHub repository by entering owner/repo format or GitHub URL.

#### Input Formats

**Owner/Repo Format**:
- `owner/repo` - Simple format
- Validated against GitHub naming rules
- Sanitized before navigation

**GitHub URL Format**:
- `https://github.com/owner/repo` - Full URL
- Extracts owner and repo automatically
- Handles URLs with paths and query strings

#### Validation

All input is validated:
- Owner format: 1-39 chars, alphanumeric + hyphens
- Repository format: alphanumeric, dots, underscores, hyphens
- Path validation: Prevents traversal attacks
- Reference validation: Valid branch/tag format

#### Navigation Flow

1. User enters repository identifier
2. Input parsed and validated
3. Sanitized for security
4. Navigate to `/r/owner/repo` or specific file
5. Load and display content

### Content Rendering

High-quality markdown rendering with security and customization.

#### Rendering Features

**Markdown Support**:
- GitHub Flavored Markdown (GFM)
- Tables, task lists, strikethrough
- Syntax highlighting for code blocks
- Raw HTML (sanitized)

**Security**:
- HTML sanitization with whitelist
- No script execution
- Safe link protocols only
- Path traversal prevention

**Customization**:
- Custom component overrides
- Special handling for Alexandria logo
- Responsive design
- Print-optimized styles

#### Rendering Process

1. Receive markdown content
2. Process with remark-gfm
3. Sanitize HTML with rehype-sanitize
4. Apply syntax highlighting
5. Rewrite links for internal navigation
6. Render with React components

### Cache and Offline Support

Intelligent caching enables offline reading and reduces API calls.

#### Cache Features

**Storage Strategy**:
- Hybrid storage (localStorage + IndexedDB)
- Small items (< 100KB): localStorage
- Large items (> 100KB): IndexedDB
- Metadata in localStorage

**Cache Duration**:
- Default TTL: 6 hours
- Conditional requests (ETag/Last-Modified)
- Automatic expiration
- Manual invalidation support

**Cache Benefits**:
- Offline reading of cached content
- Reduced API calls
- Faster page loads
- Rate limit protection

#### Offline Capabilities

**Available Offline**:
- Previously viewed documents
- Reading history
- Repository TOC (if cached)
- Navigation between cached documents

**Limitations**:
- Cannot discover new content
- Cannot load uncached repositories
- API-dependent features unavailable

### Rate Limit Handling

Intelligent handling of GitHub API rate limits with user-friendly feedback.

#### Rate Limit Features

**Monitoring**:
- Tracks rate limit state from headers
- Displays remaining requests
- Shows reset time
- Global banner when low

**Protection**:
- Cache-first strategy
- Serves cached content when rate limited
- Automatic navigation to cached content
- User warnings instead of errors

**Recovery**:
- Navigates to previous item from history
- Falls back to home if no history
- Clear user feedback
- Non-blocking UI

#### Rate Limit States

**Normal**:
- Rate limit banner hidden
- All features available
- Standard API usage

**Low** (< 10 remaining):
- Rate limit banner visible
- Shows remaining count
- Warns user of approaching limit

**Exceeded**:
- Warning banner displayed
- Cache fallback attempted
- Navigation to cached content
- Clear reset time information

### Error Handling

Comprehensive error handling with user-friendly messages and recovery options.

#### Error Types

**Rate Limit Errors**:
- Primary rate limit (403)
- Secondary rate limit (429 with retry-after)
- Cache fallback attempted
- Navigation to cached content

**Network Errors**:
- Connection failures
- Timeout errors
- Server errors (5xx)
- Automatic retry with backoff

**Not Found Errors**:
- Repository not found (404)
- File not found (404)
- User-friendly messages
- Retry options

**Configuration Errors**:
- Invalid repository configuration
- Helpful error messages
- Configuration guidance
- Fallback to defaults

#### Error Recovery

**Automatic Recovery**:
- Retry network errors
- Cache fallback for rate limits
- Navigation to cached content
- Graceful degradation

**User Recovery**:
- Retry buttons
- Dismiss errors
- Navigate away
- Clear error state

### Breadcrumb Navigation

Hierarchical breadcrumb trail showing navigation path.

#### Breadcrumb Features

**Path Display**:
- Home link
- Repository link (owner/repo)
- Directory path segments
- Current file

**Navigation**:
- Clickable segments
- Current page indicator
- Accessible with ARIA labels
- Visual hierarchy

**Format**:
```
🏠 Alexandria / 📁 owner/repo / 📁 docs / 📄 README.md
```

### Share Functionality

Share content via Web Share API or clipboard fallback.

#### Sharing Methods

**Web Share API**:
- Native sharing on supported platforms
- Shares title, text, and URL
- Platform-specific sharing options

**Clipboard Fallback**:
- Copies URL to clipboard
- Works on all platforms
- User feedback on success

**Email Sharing**:
- Generates mailto links
- Pre-filled subject and body
- Includes shareable URL

#### Shareable URLs

Generated URLs are permanent and shareable:
- Format: `/r/owner/repo/blob/ref/path`
- Works across deployments
- Preserves repository context

### Print Support

Optimized printing with custom print styles.

#### Print Features

**Optimized Layout**:
- Hides navigation and UI elements
- Optimizes typography for print
- Shows URLs for links
- Page break controls

**Print Styles**:
- Removes backgrounds and shadows
- Optimizes font sizes
- Proper margins and spacing
- Code block formatting

**Usage**:
- Browser print dialog
- Print-optimized CSS
- Clean, readable output

## Feature Integration

Features work together to create a seamless experience:

1. **Discovery** → **Reading**: Random discovery leads to content reading
2. **Reading** → **Navigation**: Links enable document traversal
3. **Navigation** → **History**: All navigation tracked in history
4. **History** → **Recovery**: History used for rate limit recovery
5. **Cache** → **Offline**: Cached content enables offline reading
6. **TOC** → **Navigation**: TOC provides quick navigation
7. **Breadcrumb** → **Context**: Breadcrumb shows current location

## Feature Roadmap

### Potential Enhancements

**Search**:
- Full-text search within repositories
- Search across multiple repositories
- Search history

**Bookmarks**:
- Save favorite documents
- Organize bookmarks
- Sync across devices (if backend added)

**Themes**:
- Light/dark theme toggle
- Custom color schemes
- Font size adjustment

**Export**:
- Export documents as PDF
- Export as Markdown
- Print to file

**Analytics** (Privacy-preserving):
- Reading statistics
- Most viewed documents
- Discovery patterns

## Feature Usage Statistics

Features are designed to be discoverable and intuitive:
- Random discovery: Primary entry point for exploration
- Link following: Natural document navigation
- History: Quick return to previous content
- TOC: Efficient navigation within documents
- Cache: Transparent performance optimization

