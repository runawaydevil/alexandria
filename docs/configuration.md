# Configuration Guide

## Configuration Overview

Alexandria supports environment-based configuration for customizing the default repository and GitHub API token. Configuration is validated at build time and runtime to ensure correctness.

## Environment Variables

### VITE_DEFAULT_OWNER

**Type**: String  
**Required**: No (uses fallback if not set)  
**Description**: GitHub username/owner for the default repository

**Validation Rules**:
- 1-39 characters
- Alphanumeric and hyphens only
- Cannot start or end with hyphen
- Single character must be alphanumeric

**Example**:
```bash
VITE_DEFAULT_OWNER=runawaydevil
```

### VITE_DEFAULT_REPO

**Type**: String  
**Required**: No (uses fallback if not set)  
**Description**: Repository name for the default repository

**Validation Rules**:
- Alphanumeric, dots, underscores, hyphens
- Maximum 100 characters
- Cannot be empty

**Example**:
```bash
VITE_DEFAULT_REPO=alexandria
```

**Important**: Both `VITE_DEFAULT_OWNER` and `VITE_DEFAULT_REPO` must be set together. If only one is set, the system will use the default fallback.

### VITE_GITHUB_TOKEN

**Type**: String  
**Required**: No  
**Description**: GitHub personal access token for increased API rate limits

**Benefits**:
- Increases rate limit from 60/hour to 5000/hour
- Only included in build-time bundle
- Never logged or exposed in error messages

**Security Notes**:
- Token is only available at build time via Vite env vars
- Only env vars prefixed with `VITE_` are included in client bundle
- Token is safe from exposure in error messages or logs

**Example**:
```bash
VITE_GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Creating a Token**:
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate new token (classic)
3. No scopes required (public read-only access)
4. Copy token and set as environment variable

## Configuration Files

### .env (Development)

Create a `.env` file in the project root for local development:

```bash
VITE_DEFAULT_OWNER=your-username
VITE_DEFAULT_REPO=your-repo
VITE_GITHUB_TOKEN=your-token
```

### .env.production (Production)

For production builds, set environment variables in your CI/CD pipeline or hosting platform.

**GitHub Actions Example**:
```yaml
env:
  VITE_DEFAULT_OWNER: ${{ secrets.DEFAULT_OWNER }}
  VITE_DEFAULT_REPO: ${{ secrets.DEFAULT_REPO }}
  VITE_GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**GitHub Pages Secrets**:
GitHub Pages does not support environment variables directly. Use GitHub Actions to build with environment variables before deploying.

## Default Configuration

If no environment variables are set, Alexandria uses the following defaults:

- **Owner**: `runawaydevil`
- **Repository**: `alexandria`

This default repository serves as the landing page content.

## Configuration Validation

### Build-Time Validation

The Vite configuration plugin validates environment variables during build:

```typescript
// vite.config.ts
const configurationValidationPlugin = () => {
  // Validates owner and repo format
  // Logs warnings for invalid configuration
  // Falls back to defaults if invalid
}
```

**Validation Output**:
```
🔧 Alexandria Configuration Validation
=====================================
✓ Valid repository owner: runawaydevil
✓ Valid repository name: alexandria
🎯 Alexandria configured for repository: runawaydevil/alexandria
=====================================
```

### Runtime Validation

The `ConfigurationManager` service validates configuration at runtime:

```typescript
const configManager = ConfigurationManager.getInstance()
const { owner, repo } = configManager.getDefaultRepository()
const isCustom = configManager.isUsingCustomConfig()
```

## Configuration Manager API

### Get Default Repository

```typescript
const { owner, repo } = configurationManager.getDefaultRepository()
```

Returns the configured default repository identifier.

### Check Configuration Source

```typescript
const isCustom = configurationManager.isUsingCustomConfig()
const source = configurationManager.getConfigSource() // 'environment' | 'fallback'
```

Determines if custom configuration is in use.

### Validate Repository Identifier

```typescript
const isValid = configurationManager.validateRepositoryIdentifier(owner, repo)
```

Validates a repository identifier against GitHub naming rules.

## Configuration Errors

### Invalid Owner Format

**Error**: Owner does not match GitHub username rules

**Solution**: Ensure owner is 1-39 characters, alphanumeric and hyphens only, cannot start/end with hyphen.

### Invalid Repository Format

**Error**: Repository name does not match GitHub repository rules

**Solution**: Ensure repository name is alphanumeric, dots, underscores, hyphens only, max 100 characters.

### Partial Configuration

**Warning**: Only one of owner/repo is set

**Solution**: Set both `VITE_DEFAULT_OWNER` and `VITE_DEFAULT_REPO` together, or neither (to use defaults).

### Repository Not Found

**Error**: Configured repository does not exist or is not accessible

**Solution**: Verify repository exists and is public. Check owner and repository name spelling.

## Configuration Best Practices

### Development

1. Use `.env` file for local development
2. Add `.env` to `.gitignore` to prevent committing secrets
3. Use `.env.example` to document required variables

### Production

1. Use CI/CD environment variables for secrets
2. Never commit tokens or secrets to repository
3. Use GitHub Secrets for sensitive values
4. Validate configuration in build pipeline

### Security

1. GitHub token is optional but recommended for higher rate limits
2. Token only needs public read access (no scopes required)
3. Token is never exposed in client-side code or error messages
4. Use least-privilege tokens when possible

## Testing Configuration

### Check Current Configuration

The application logs configuration on startup. Check browser console for:

```
Alexandria configured for custom repository: owner/repo
```

or

```
Alexandria using default repository: runawaydevil/alexandria
```

### Verify Configuration

1. Build application with environment variables
2. Check build output for validation messages
3. Verify default repository loads correctly
4. Test that custom repository README displays

## Troubleshooting

### Configuration Not Applied

**Issue**: Environment variables set but defaults still used

**Solutions**:
1. Ensure variables are prefixed with `VITE_`
2. Restart dev server after changing `.env`
3. Rebuild application for production
4. Check build output for validation warnings

### Invalid Configuration Warnings

**Issue**: Build shows warnings about invalid configuration

**Solutions**:
1. Review validation rules for owner and repo
2. Check for typos in environment variable names
3. Ensure both owner and repo are set together
4. Verify values match GitHub naming requirements

### Token Not Working

**Issue**: Rate limit still 60/hour despite token

**Solutions**:
1. Verify token is set with `VITE_` prefix
2. Check token has not expired
3. Ensure token is included in build (check bundle)
4. Verify token has correct format (starts with `ghp_`)

