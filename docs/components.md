# Component Documentation

## Component Overview

Alexandria uses a component-based architecture with reusable React components organized by functionality. All components are written in TypeScript with proper type definitions.

## Component Categories

### Layout Components

#### Layout

**File**: `src/components/Layout/Layout.tsx`

Main layout wrapper that provides consistent structure across all pages.

**Props**:
```typescript
interface LayoutProps {
  children: React.ReactNode
}
```

**Responsibilities**:
- Wraps all page content
- Includes Header and Footer
- Displays RateLimitBanner globally
- Provides main content container with proper semantic HTML

**Usage**:
```typescript
<Layout>
  <YourPageContent />
</Layout>
```

#### Header

**File**: `src/components/Header/Header.tsx`

Application header with logo and navigation.

**Features**:
- Dynamic logo path detection (handles GitHub Pages basename)
- Navigation links (Home, About)
- Fallback logo loading strategy
- Accessible navigation with ARIA labels

**No props** - renders static header content

#### Footer

**File**: `src/components/Footer/Footer.tsx`

Application footer with metadata and links.

**No props** - renders static footer content

### Content Components

#### MarkdownRenderer

**File**: `src/components/MarkdownRenderer/MarkdownRenderer.tsx`

Core component for rendering markdown content with security and customization.

**Props**:
```typescript
interface MarkdownRendererProps {
  content: string
  className?: string
  repositoryContext?: {
    owner: string
    repo: string
    ref: string
    path: string
  }
}
```

**Features**:
- Renders markdown with GitHub Flavored Markdown support
- HTML sanitization via rehype-sanitize
- Syntax highlighting for code blocks
- Custom component overrides for styling
- Link rewriting via LinkRewriter service
- Anchor generation for headings
- Special handling for Alexandria logo images

**Security**:
- Whitelist of allowed HTML tags
- Restricted attributes per tag
- Protocol whitelist (http, https, mailto, data)
- No script execution capability

**Custom Components**:
- Headings (h1-h6) with anchor IDs
- Links with automatic internal route conversion
- Images with path resolution
- Code blocks with syntax highlighting
- Tables with responsive wrapper
- Custom div alignment support

#### DocumentToc

**File**: `src/components/DocumentToc/DocumentToc.tsx`

Table of contents generated from document headings.

**Props**:
```typescript
interface DocumentTocProps {
  items: TocItem[]
}

interface TocItem {
  id: string
  text: string
  level: number
  anchor: string
}
```

**Features**:
- Displays hierarchical heading structure
- Smooth scroll to anchors
- Visual indentation for heading levels
- Collapsible/expandable sections

#### RepositoryToc

**File**: `src/components/RepositoryToc/RepositoryToc.tsx`

Table of contents listing all markdown files in a repository.

**Props**:
```typescript
interface RepositoryTocProps {
  items: RepositoryTocItem[]
  currentPath?: string
}

interface RepositoryTocItem {
  name: string
  path: string
  type: 'file' | 'directory'
  url: string
}
```

**Features**:
- Lists all markdown files in repository
- Highlights current file
- Clickable links to navigate to files
- Organized by directory structure

### Navigation Components

#### Breadcrumb

**File**: `src/components/Breadcrumb/Breadcrumb.tsx`

Hierarchical navigation breadcrumb trail.

**Props**:
```typescript
interface BreadcrumbProps {
  owner: string
  repo: string
  path?: string
  ref?: string
  className?: string
}
```

**Features**:
- Shows navigation path: Home > Owner/Repo > Path segments
- Clickable segments for navigation
- Current page indicator
- Accessible with ARIA labels

**Example Output**:
```
🏠 Alexandria / 📁 owner/repo / 📁 docs / 📄 README.md
```

#### NavigationHistory

**File**: `src/components/NavigationHistory/NavigationHistory.tsx`

Displays recent reading history with quick navigation.

**Props**:
```typescript
interface NavigationHistoryProps {
  currentPath?: string
  className?: string
}
```

**Features**:
- Shows last 5 viewed documents (excluding current)
- Expandable/collapsible list
- Time-ago formatting (just now, 5m ago, 2h ago, 3d ago)
- Click to navigate to previous documents
- Filters out current page automatically

**Data Source**: Reading history from CacheManager

### Error Components

#### ErrorDisplay

**File**: `src/components/ErrorDisplay/ErrorDisplay.tsx`

Displays error messages with retry and dismiss options.

**Props**:
```typescript
interface ErrorDisplayProps {
  error: ConfigurationError | string | null
  onRetry?: () => void
  onDismiss?: () => void
  showConfigHelp?: boolean
}
```

**Features**:
- Handles both ConfigurationError and string errors
- Retry button for recoverable errors
- Dismiss button to clear error
- Configuration help for custom config errors
- User-friendly error messages

#### RateLimitWarning

**File**: `src/components/RateLimitWarning/RateLimitWarning.tsx`

Displays rate limit warnings with reset time information.

**Props**:
```typescript
interface RateLimitWarningProps {
  error: RateLimitError | SecondaryRateLimitError
  onDismiss?: () => void
}
```

**Features**:
- Shows rate limit reset time
- Displays retry-after information for secondary limits
- Dismissible warning
- Non-blocking UI element

#### RateLimitBanner

**File**: `src/components/RateLimitBanner/RateLimitBanner.tsx`

Global banner showing current rate limit status.

**Features**:
- Displays remaining API calls
- Shows reset time
- Updates in real-time
- Only visible when rate limit is low

**No props** - reads rate limit from GitHubApiClient

### Utility Components

#### ConfigurationBanner

**File**: `src/components/ConfigurationBanner/ConfigurationBanner.tsx`

Banner indicating custom configuration is in use.

**Note**: Currently not used in the application but kept for potential future use.

## Component Patterns

### Props Interface

All components use TypeScript interfaces for props with optional properties clearly marked:

```typescript
interface ComponentProps {
  required: string
  optional?: string
  withDefault?: string
}
```

### Error Boundaries

Components handle errors gracefully:
- Try-catch blocks for async operations
- Fallback UI for error states
- User-friendly error messages

### Accessibility

Components follow accessibility best practices:
- Semantic HTML elements
- ARIA labels where appropriate
- Keyboard navigation support
- Screen reader friendly

### Styling

Each component has its own CSS file:
- Scoped styles to prevent conflicts
- CSS classes follow BEM-like naming
- Responsive design considerations

## Component Communication

### Parent-Child Communication

Components communicate through props (down) and callbacks (up):

```typescript
<ParentComponent
  data={data}
  onAction={handleAction}
/>
```

### Service Integration

Components use services through the `createServices()` function:

```typescript
const { apiClient, cache } = createServices()
```

### State Management

Components manage local state with React hooks:
- `useState` for component state
- `useEffect` for side effects
- `useNavigate` for routing
- `useParams` for route parameters

## Component Lifecycle

### Mounting

1. Component renders with initial state
2. `useEffect` hooks run for data fetching
3. Services are initialized
4. Content is loaded and displayed

### Updating

1. Props or state changes trigger re-render
2. `useEffect` dependencies checked
3. Conditional re-fetching if needed
4. UI updates with new data

### Unmounting

1. Cleanup functions in `useEffect` run
2. Event listeners removed
3. Timers cleared
4. Component removed from DOM

## Best Practices

### Component Design

1. **Single Responsibility**: Each component has one clear purpose
2. **Reusability**: Components are designed for reuse across pages
3. **Composition**: Complex components are built from simpler ones
4. **Type Safety**: All props and state are properly typed

### Performance

1. **Memoization**: Expensive computations are memoized
2. **Lazy Loading**: Large components loaded on demand
3. **Conditional Rendering**: Components only render when needed
4. **Efficient Re-renders**: Dependencies carefully managed

### Code Organization

1. **Co-location**: Component files include TSX, CSS, and types together
2. **Clear Naming**: Component names reflect their purpose
3. **Documentation**: Complex logic is commented
4. **Consistency**: Similar components follow similar patterns

