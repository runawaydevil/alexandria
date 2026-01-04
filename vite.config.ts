import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration validation helper
const validateGitHubIdentifier = (value: string, type: 'owner' | 'repo'): boolean => {
  if (type === 'owner') {
    // GitHub username rules: 1-39 characters, alphanumeric and hyphens, cannot start/end with hyphen
    if (!value || value.length === 0 || value.length > 39) {
      return false
    }
    
    // Single character usernames (alphanumeric only)
    if (value.length === 1) {
      return /^[a-zA-Z0-9]$/.test(value)
    }
    
    // Multi-character usernames
    const regex = /^[a-zA-Z0-9]([a-zA-Z0-9-])*[a-zA-Z0-9]$/
    return regex.test(value)
  } else {
    // GitHub repository name rules: alphanumeric, dots, underscores, hyphens
    if (!value || value.length === 0 || value.length > 100) {
      return false
    }
    
    const regex = /^[a-zA-Z0-9._-]+$/
    return regex.test(value)
  }
}

// Build-time configuration validation plugin
const configurationValidationPlugin = () => {
  return {
    name: 'validate-config',
    configResolved(config: any) {
      const owner = config.env.VITE_DEFAULT_OWNER
      const repo = config.env.VITE_DEFAULT_REPO
      
      console.log('\n🔧 Alexandria Configuration Validation')
      console.log('=====================================')
      
      // Validate owner
      if (owner) {
        if (!validateGitHubIdentifier(owner, 'owner')) {
          console.warn(`⚠️  Warning: VITE_DEFAULT_OWNER "${owner}" is not a valid GitHub username.`)
          console.warn('   GitHub usernames must be 1-39 characters, alphanumeric and hyphens only.')
          console.warn('   Cannot start or end with hyphen. Using default instead.')
        } else {
          console.log(`✓ Valid repository owner: ${owner}`)
        }
      }
      
      // Validate repo
      if (repo) {
        if (!validateGitHubIdentifier(repo, 'repo')) {
          console.warn(`⚠️  Warning: VITE_DEFAULT_REPO "${repo}" is not a valid GitHub repository name.`)
          console.warn('   Repository names must be alphanumeric, dots, underscores, hyphens only.')
          console.warn('   Maximum 100 characters. Using default instead.')
        } else {
          console.log(`✓ Valid repository name: ${repo}`)
        }
      }
      
      // Check if both are set together
      if ((owner && !repo) || (!owner && repo)) {
        console.warn('⚠️  Warning: Both VITE_DEFAULT_OWNER and VITE_DEFAULT_REPO must be set together.')
        console.warn('   Using default configuration instead.')
      }
      
      // Log final configuration
      if (owner && repo && validateGitHubIdentifier(owner, 'owner') && validateGitHubIdentifier(repo, 'repo')) {
        console.log(`🎯 Alexandria configured for repository: ${owner}/${repo}`)
      } else {
        console.log('🎯 Alexandria using default repository: runawaydevil/alexandria')
      }
      
      console.log('=====================================\n')
    },
    buildStart() {
      // Additional validation during build start
      const owner = process.env.VITE_DEFAULT_OWNER
      const repo = process.env.VITE_DEFAULT_REPO
      
      if (owner && repo) {
        if (!validateGitHubIdentifier(owner, 'owner') || !validateGitHubIdentifier(repo, 'repo')) {
          console.warn('\n⚠️  Build Warning: Invalid repository configuration detected.')
          console.warn('   The build will continue with default values.')
          console.warn('   Please check your environment variables.\n')
        }
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    configurationValidationPlugin()
  ],
  base: '/Alexandria/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  server: {
    port: 3000,
    open: true
  }
})