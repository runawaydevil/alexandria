# Development Guide

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher (comes with Node.js)
- Git for version control

### Initial Setup

1. Clone the repository:
```bash
git clone https://github.com/runawaydevil/alexandria.git
cd alexandria
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file (optional):
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
alexandria/
├── public/                 # Static assets
│   ├── 404.html          # SPA redirect for GitHub Pages
│   └── alexandria.png    # Logo
├── src/
│   ├── components/        # Reusable React components
│   ├── pages/            # Page-level components
│   ├── services/         # Business logic layer
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Root component with routing
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── docs/                 # Documentation
├── index.html            # HTML template
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts       # Vite build configuration
└── README.md             # Project readme
```

## Available Scripts

### Development

**`npm run dev`**
- Starts Vite development server
- Enables hot module replacement (HMR)
- Opens browser automatically
- Runs on `http://localhost:3000`

### Build

**`npm run build`**
- Type checks with TypeScript
- Builds production bundle
- Outputs to `dist/` directory
- Generates source maps

### Preview

**`npm run preview`**
- Serves production build locally
- Useful for testing production build
- Runs on `http://localhost:4173`

### Linting

**`npm run lint`**
- Runs ESLint on TypeScript files
- Reports unused disable directives
- Fails on warnings (max-warnings: 0)

## Code Organization

### Components

Components are organized by feature in `src/components/`. Each component has:
- Component file (`.tsx`)
- Styles file (`.css`)
- Optional types file (if complex)

**Naming Convention**:
- Component files: PascalCase (e.g., `MarkdownRenderer.tsx`)
- CSS files: Match component name (e.g., `MarkdownRenderer.css`)
- Component names: Match file name

### Services

Services are in `src/services/` and follow class-based architecture:

```typescript
export class ServiceName {
  constructor(dependencies) {
    // Initialize
  }
  
  async publicMethod(): Promise<ReturnType> {
    // Implementation
  }
}
```

**Service Dependencies**:
- Services are created through `createServices()` factory
- Dependencies injected through constructor
- Singleton pattern for ConfigurationManager

### Types

Type definitions are in `src/types/`:
- `index.ts`: Core types and interfaces
- `ConfigurationError.ts`: Configuration error types

**Type Organization**:
- Group related types together
- Export from index for easy imports
- Use interfaces for object shapes
- Use types for unions and intersections

### Utilities

Utility functions are in `src/utils/`:
- Pure functions when possible
- Single responsibility
- Well-documented with JSDoc
- Type-safe

## Development Workflow

### Adding a New Component

1. Create component directory:
```bash
mkdir src/components/NewComponent
```

2. Create component file:
```typescript
// src/components/NewComponent/NewComponent.tsx
import React from 'react'
import './NewComponent.css'

interface NewComponentProps {
  // Define props
}

const NewComponent: React.FC<NewComponentProps> = ({ ...props }) => {
  return (
    <div className="new-component">
      {/* Component content */}
    </div>
  )
}

export default NewComponent
```

3. Create styles file:
```css
/* src/components/NewComponent/NewComponent.css */
.new-component {
  /* Styles */
}
```

4. Export from components (if needed):
```typescript
// src/components/index.ts (if exists)
export { default as NewComponent } from './NewComponent/NewComponent'
```

### Adding a New Service

1. Create service file:
```typescript
// src/services/NewService.ts
import { Dependencies } from '../types'

export class NewService {
  constructor(private dependencies: Dependencies) {}
  
  async method(): Promise<ReturnType> {
    // Implementation
  }
}
```

2. Add to services index:
```typescript
// src/services/index.ts
import { NewService } from './NewService'

export { NewService } from './NewService'

export const createServices = () => {
  // ... existing services
  const newService = new NewService(dependencies)
  
  return {
    // ... existing services
    newService
  }
}
```

### Adding a New Page

1. Create page directory:
```bash
mkdir src/pages/NewPage
```

2. Create page component:
```typescript
// src/pages/NewPage/NewPage.tsx
import React from 'react'
import './NewPage.css'

const NewPage: React.FC = () => {
  return (
    <div className="new-page">
      {/* Page content */}
    </div>
  )
}

export default NewPage
```

3. Add route in `App.tsx`:
```typescript
import NewPage from './pages/NewPage/NewPage'

// In Routes:
<Route path="/new-page" element={<NewPage />} />
```

## Code Conventions

### TypeScript

- Use TypeScript for all new code
- Define interfaces for object shapes
- Use type unions for limited value sets
- Avoid `any` type (use `unknown` if needed)
- Export types from appropriate files

### React

- Use functional components with hooks
- Use TypeScript for component props
- Keep components focused and small
- Extract reusable logic to custom hooks if needed
- Use meaningful component and variable names

### Naming

- **Components**: PascalCase (`MarkdownRenderer`)
- **Files**: Match component/class name
- **Functions**: camelCase (`getRepository`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_HISTORY_ITEMS`)
- **Types/Interfaces**: PascalCase (`Repository`, `FileContent`)

### File Organization

- One component per file
- Co-locate related files (component + styles)
- Group related exports
- Use index files for clean imports

### Error Handling

- Use try-catch for async operations
- Provide user-friendly error messages
- Log errors to console for debugging
- Handle errors at appropriate level

### Comments

- Document complex logic
- Explain "why" not "what"
- Use JSDoc for public APIs
- Keep comments up to date

## Testing Considerations

### Manual Testing

Test the following scenarios:
- Navigation between pages
- Random content discovery
- Repository input validation
- Error handling (network errors, rate limits)
- Cache behavior
- Link rewriting

### Browser Testing

Test in multiple browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari (if available)

### Responsive Testing

Test on different screen sizes:
- Mobile (320px - 768px)
- Tablet (768px - 1024px)
- Desktop (1024px+)

## Debugging

### Development Tools

- **React DevTools**: Inspect component tree and state
- **Browser DevTools**: Network, console, storage
- **Vite DevTools**: HMR status, build info

### Common Issues

**HMR Not Working**:
- Check browser console for errors
- Restart dev server
- Clear browser cache

**Type Errors**:
- Run `npm run build` to see all TypeScript errors
- Check `tsconfig.json` settings
- Verify type definitions

**API Errors**:
- Check network tab for failed requests
- Verify rate limit status
- Check GitHub API status

### Logging

Use `console.log` for debugging (removed in production builds):
```typescript
console.log('Debug info:', data)
console.warn('Warning:', message)
console.error('Error:', error)
```

## Performance Optimization

### Code Splitting

Vite automatically code-splits. For manual splitting:
```typescript
const Component = React.lazy(() => import('./Component'))
```

### Memoization

Use `React.memo` for expensive components:
```typescript
export default React.memo(ExpensiveComponent)
```

### Dependency Optimization

- Keep dependencies up to date
- Remove unused dependencies
- Use specific imports when possible

## Git Workflow

### Branching

- `main`: Production-ready code
- Feature branches: `feature/description`
- Bug fixes: `fix/description`

### Commits

- Use clear, descriptive commit messages
- Reference issues if applicable
- Keep commits focused and atomic

### Code Review

Before submitting:
- Run `npm run lint` and fix issues
- Run `npm run build` and verify no errors
- Test functionality manually
- Update documentation if needed

## Dependencies

### Adding Dependencies

```bash
npm install package-name
```

For dev dependencies:
```bash
npm install -D package-name
```

### Updating Dependencies

```bash
npm update
```

Check for security vulnerabilities:
```bash
npm audit
```

Fix vulnerabilities:
```bash
npm audit fix
```

## Troubleshooting

### Build Errors

**TypeScript Errors**:
- Check `tsconfig.json` configuration
- Verify all types are imported correctly
- Run `tsc --noEmit` to see all errors

**Vite Errors**:
- Clear `node_modules` and reinstall
- Check Vite version compatibility
- Review `vite.config.ts` settings

### Runtime Errors

**Component Errors**:
- Check React DevTools for component state
- Verify props are passed correctly
- Check for undefined/null values

**Service Errors**:
- Verify service dependencies
- Check API responses in network tab
- Review error handling logic

## Resources

### Documentation

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [GitHub API Documentation](https://docs.github.com/en/rest)

### Tools

- [React DevTools](https://react.dev/learn/react-developer-tools)
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Vite DevTools](https://github.com/webfansplz/vite-plugin-vue-devtools)

