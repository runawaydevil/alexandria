# Deployment Guide

## Deployment Overview

Alexandria is designed as a static web application that can be deployed to any static hosting service. The primary deployment target is GitHub Pages, but the application works on any static host.

## Build Process

### Prerequisites

- Node.js 18+ and npm
- Environment variables configured (optional)

### Build Command

```bash
npm run build
```

This command:
1. Runs TypeScript type checking (`tsc`)
2. Builds the application with Vite (`vite build`)
3. Outputs production files to `dist/` directory

### Build Output

The build process creates:
- `dist/index.html` - Entry HTML file
- `dist/assets/` - JavaScript, CSS, and other assets
- `dist/alexandria.png` - Static assets (if copied)

### Build Configuration

Build configuration is in `vite.config.ts`:

```typescript
export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? '/alexandria/' : '/'
  
  return {
    base,
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true
    }
  }
})
```

**Key Settings**:
- **Base path**: `/alexandria/` for production (GitHub Pages)
- **Output directory**: `dist/`
- **Assets directory**: `assets/`
- **Source maps**: Enabled for debugging

## GitHub Pages Deployment

### Repository Setup

1. Repository name should match the base path (e.g., `alexandria`)
2. Enable GitHub Pages in repository settings
3. Select source branch (typically `main` or `gh-pages`)

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_DEFAULT_OWNER: ${{ secrets.DEFAULT_OWNER }}
          VITE_DEFAULT_REPO: ${{ secrets.DEFAULT_REPO }}
          VITE_GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 404.html Handling

GitHub Pages requires a `404.html` file for SPA routing. The file should redirect to the SPA:

**File**: `public/404.html`

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Alexandria</title>
    <script>
      // Single Page Apps for GitHub Pages
      // https://github.com/rafgraph/spa-github-pages
      var pathSegmentsToKeep = 1;
      var l = window.location;
      l.replace(
        l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
        l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
        l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
        (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
        l.hash
      );
    </script>
  </head>
  <body>
  </body>
</html>
```

This file is copied to `dist/404.html` during build.

### Basename Configuration

The application automatically detects the deployment environment:

**Development** (`npm run dev`):
- Basename: `/`
- Base URL: `http://localhost:3000/`

**Production** (GitHub Pages):
- Basename: `/alexandria/`
- Base URL: `https://username.github.io/alexandria/`

The basename is determined in `src/main.tsx`:

```typescript
const getBasename = (): string => {
  const pathname = window.location.pathname
  const hostname = window.location.hostname
  
  if (pathname.startsWith('/alexandria')) {
    return '/alexandria'
  }
  
  if (hostname.includes('github.io') && pathname === '/') {
    const searchParams = new URLSearchParams(window.location.search)
    const redirectPath = searchParams.get('/')
    if (redirectPath) {
      return '/alexandria'
    }
  }
  
  return ''
}
```

## Custom Domain Deployment

For custom domain deployment:

1. Update `vite.config.ts` base path to `/`
2. Configure domain in GitHub Pages settings
3. Update DNS records as required
4. Rebuild and deploy

## Other Static Hosts

### Netlify

**netlify.toml**:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Vercel

**vercel.json**:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Cloudflare Pages

1. Connect repository
2. Build command: `npm run build`
3. Build output: `dist`
4. Add redirect rule: `/*` → `/index.html` (200)

## Environment Variables in Production

### GitHub Actions

Set secrets in repository settings:
- `DEFAULT_OWNER`: GitHub username
- `DEFAULT_REPO`: Repository name
- `GITHUB_TOKEN`: Personal access token

Reference in workflow:
```yaml
env:
  VITE_DEFAULT_OWNER: ${{ secrets.DEFAULT_OWNER }}
  VITE_DEFAULT_REPO: ${{ secrets.DEFAULT_REPO }}
  VITE_GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Other Platforms

Configure environment variables in platform settings before build. Variables prefixed with `VITE_` will be included in the client bundle.

## Build Optimization

### Code Splitting

Vite automatically code-splits the application:
- Route-based splitting
- Dynamic imports
- Vendor chunk separation

### Asset Optimization

- Images optimized automatically
- CSS minified
- JavaScript minified and tree-shaken
- Unused code eliminated

### Source Maps

Source maps are generated for production debugging. Remove `sourcemap: true` in `vite.config.ts` for smaller builds if not needed.

## Deployment Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Build completes without errors
- [ ] TypeScript compilation succeeds
- [ ] All tests pass (if applicable)
- [ ] 404.html file present in public/

### Deployment

- [ ] Build artifacts generated in dist/
- [ ] Static files copied correctly
- [ ] Base path configured for hosting environment
- [ ] GitHub Actions workflow runs successfully (if using)

### Post-Deployment

- [ ] Application loads correctly
- [ ] Default repository README displays
- [ ] Navigation works (test all routes)
- [ ] 404 redirects work correctly
- [ ] Assets load (images, CSS, JS)
- [ ] API calls function correctly
- [ ] Rate limit handling works

## Troubleshooting

### 404 Errors on Routes

**Issue**: Routes return 404 after deployment

**Solution**: Ensure 404.html is configured correctly and redirects to SPA. Verify base path matches repository name.

### Assets Not Loading

**Issue**: Images, CSS, or JS files return 404

**Solution**: Check base path configuration. Verify assets are in correct directory structure. Check browser console for failed requests.

### Basename Mismatch

**Issue**: Application tries to load from wrong base path

**Solution**: Verify `vite.config.ts` base path matches deployment environment. Check `src/main.tsx` basename detection logic.

### Environment Variables Not Applied

**Issue**: Default repository not using custom configuration

**Solution**: Verify environment variables are set in build process. Check build logs for validation messages. Ensure variables are prefixed with `VITE_`.

### Build Fails

**Issue**: Build process errors

**Solutions**:
1. Check Node.js version (18+ required)
2. Verify all dependencies installed (`npm ci`)
3. Check TypeScript errors (`npm run build` shows them)
4. Review build logs for specific errors

## Continuous Deployment

### GitHub Actions

The provided workflow automatically deploys on push to main branch. No manual deployment needed.

### Manual Deployment

1. Build locally: `npm run build`
2. Commit dist/ directory (if not using GitHub Actions)
3. Push to gh-pages branch (if using branch-based deployment)

## Performance Considerations

### Build Size

Typical build sizes:
- JavaScript: ~200-300 KB (gzipped)
- CSS: ~10-20 KB (gzipped)
- Assets: Varies by included images

### Loading Performance

- Code splitting reduces initial load
- Assets are cached by browsers
- API responses cached locally

### CDN Considerations

For better performance, consider:
- Using CDN for static assets
- Enabling compression (gzip/brotli)
- Setting appropriate cache headers

