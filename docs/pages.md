# Pages Documentation

## Page Overview

Pages are top-level route components that represent distinct views in the application. Each page handles its own data fetching, state management, and user interactions.

## Page Components

### Home

**File**: `src/pages/Home/Home.tsx`

The landing page that displays the default repository's README and provides entry points for navigation.

#### Responsibilities

- Load and display default repository README
- Provide random content discovery
- Accept repository input for navigation
- Handle errors and rate limits gracefully

#### State Management

```typescript
const [isLoading, setIsLoading] = useState(false)
const [isLoadingReadme, setIsLoadingReadme] = useState(true)
const [error, setError] = useState<ConfigurationError | string | null>(null)
const [readmeContent, setReadmeContent] = useState<string>('')
const [repoInput, setRepoInput] = useState('')
const [rateLimitError, setRateLimitError] = useState<RateLimitError | SecondaryRateLimitError | null>(null)
```

#### Key Features

**Default README Loading**:
- Loads README from configured default repository on mount
- Handles custom configuration vs. fallback
- Attempts alternative repository names if primary fails
- Decodes base64 content with UTF-8 support

**Random Discovery**:
- Button triggers random repository discovery
- Uses RandomEngine with default filters
- Navigates to discovered content on success
- Shows rate limit warnings instead of errors

**Repository Input**:
- Accepts multiple input formats:
  - `owner/repo` format
  - Full GitHub URL (`https://github.com/owner/repo`)
- Validates and sanitizes input
- Navigates to repository on submit

#### Error Handling

**Configuration Errors**:
- Shows helpful error messages for custom config failures
- Provides retry functionality
- Displays configuration help when needed

**Rate Limit Errors**:
- Shows warning banner instead of blocking error
- Allows user to dismiss warning
- Does not prevent page interaction

**Network Errors**:
- Detects network vs. not found errors
- Provides appropriate error messages
- Offers retry functionality

#### User Flow

1. Page loads, shows loading state
2. Fetches default repository README
3. Displays README content via MarkdownRenderer
4. User can:
   - Click "Discover Random Content" to find random repository
   - Enter repository name/URL to navigate
   - Read the displayed README

#### Component Structure

```typescript
<div className="home">
  <div className="readme-content">
    <MarkdownRenderer content={readmeContent} repositoryContext={...} />
  </div>
  
  <div className="actions">
    <RateLimitWarning /> {/* if rate limited */}
    <ErrorDisplay /> {/* if error */}
    <button onClick={handleRandomClick}>Discover Random Content</button>
    <form onSubmit={handleRepoSubmit}>
      <input value={repoInput} onChange={...} />
      <button type="submit">Go to Repository</button>
    </form>
  </div>
</div>
```

### Reader

**File**: `src/pages/Reader/Reader.tsx`

The main content viewing page that displays markdown files with full navigation capabilities.

#### Responsibilities

- Load and display markdown file content
- Generate and display table of contents
- Provide navigation tools (breadcrumb, history, TOC)
- Handle random discovery within repository
- Manage reading history

#### Route Parameters

```typescript
/r/:owner/:repo                    // Shows repository README
/r/:owner/:repo/blob/:ref/*        // Shows specific file
```

#### State Management

```typescript
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [content, setContent] = useState<string>('')
const [fileInfo, setFileInfo] = useState<FileContent | null>(null)
const [repoInfo, setRepoInfo] = useState<Repository | null>(null)
const [isLoadingRandom, setIsLoadingRandom] = useState(false)
const [documentToc, setDocumentToc] = useState<DocumentTocType | null>(null)
const [repositoryToc, setRepositoryToc] = useState<RepositoryTocType | null>(null)
const [isLoadingToc, setIsLoadingToc] = useState(false)
const [rateLimitError, setRateLimitError] = useState<RateLimitError | SecondaryRateLimitError | null>(null)
```

#### Key Features

**Content Loading**:
- Validates URL parameters before loading
- Sanitizes path and ref parameters
- Loads repository information first
- Loads specific file or README based on path
- Decodes base64 content with UTF-8 support

**Table of Contents**:
- Generates document TOC from headings
- Generates repository TOC from markdown files
- Displays both in sidebar
- Highlights current file in repository TOC

**Navigation**:
- Breadcrumb shows full path
- Navigation history shows recent documents
- Repository TOC for file navigation
- Document TOC for section navigation

**Random Discovery**:
- "Random Global": Discovers random content from any repository
- "Random from [repo]": Discovers random content within current repository
- Navigates to discovered content on success

**Reading History**:
- Automatically adds viewed content to history
- History used for navigation fallback on rate limits
- Maximum 50 items stored

#### Error Handling

**Rate Limit Errors**:
- Attempts to navigate to previous item from history
- Falls back to home if no history
- Shows warning banner instead of error page
- Does not set error state (allows previous page to load)

**Other Errors**:
- Shows error page with message
- Provides navigation back to home
- Allows error dismissal

#### User Flow

1. User navigates to `/r/owner/repo/blob/ref/path`
2. Page validates parameters
3. Loads repository information
4. Loads file content
5. Generates TOCs
6. Adds to reading history
7. Renders content with navigation tools
8. User can:
   - Navigate via breadcrumb
   - Navigate via TOC
   - Navigate via history
   - Discover random content
   - Return home

#### Component Structure

```typescript
<div className="reader">
  <Breadcrumb owner={owner} repo={repo} path={fileInfo?.path} ref={ref} />
  
  <div className="reader-header">
    <div className="repo-info">
      <h1>{owner}/{repo}</h1>
      <p>📄 {fileInfo.path}</p>
    </div>
    
    <div className="reader-actions">
      <button onClick={handleRandomClick}>Random Global</button>
      <button onClick={handleRepoRandomClick}>Random from {repo}</button>
      <button onClick={() => navigate('/')}>Home</button>
    </div>
  </div>
  
  <RateLimitWarning /> {/* if rate limited */}
  
  <div className="reader-content">
    <div className="reader-sidebar">
      <NavigationHistory currentPath={...} />
      <DocumentToc items={documentToc.items} />
      <RepositoryToc items={repositoryToc.items} currentPath={fileInfo?.path} />
    </div>
    
    <div className="markdown-content">
      <MarkdownRenderer content={content} repositoryContext={...} />
    </div>
  </div>
</div>
```

### About

**File**: `src/pages/About/About.tsx`

Static informational page about the Alexandria project.

#### Content

- Project description
- Philosophy and purpose
- Key characteristics
- Privacy and data handling information

#### Structure

Simple static page with no dynamic content or state management. Displays information about:
- What Alexandria is
- How it works
- Privacy considerations
- Design philosophy

## Page Patterns

### Data Fetching Pattern

All pages follow a consistent data fetching pattern:

1. Validate inputs/parameters
2. Set loading state
3. Clear previous errors
4. Fetch data from services
5. Update state with results
6. Handle errors appropriately
7. Clear loading state

### Error Handling Pattern

Pages implement consistent error handling:

1. Distinguish error types (rate limit, network, not found)
2. Show appropriate UI for each error type
3. Provide recovery options (retry, navigate away)
4. Allow error dismissal when appropriate

### Loading States

Pages manage multiple loading states:
- Initial page load
- Content loading
- Random discovery loading
- TOC generation loading

Each loading state is independent and provides appropriate feedback.

## Navigation Flow

### Home to Reader

1. User enters repository name or clicks random
2. Navigate to `/r/owner/repo` or `/r/owner/repo/blob/ref/path`
3. Reader page loads and displays content

### Reader to Reader

1. User clicks link in markdown content
2. LinkRewriter converts to internal route
3. Navigate to new route
4. New Reader instance loads content

### Reader to Home

1. User clicks "Home" button or breadcrumb
2. Navigate to `/`
3. Home page loads default README

## Performance Considerations

### Lazy Loading

Pages are loaded on-demand through React Router's code splitting.

### Caching

All API responses are cached, reducing redundant requests when navigating between pages.

### Conditional Rendering

Components only render when data is available, preventing unnecessary re-renders.

## Accessibility

All pages follow accessibility best practices:
- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- Screen reader friendly content

