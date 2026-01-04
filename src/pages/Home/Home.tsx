import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createServices } from '../../services'
import { configurationManager } from '../../services'
import { RandomEngine } from '../../services/RandomEngine'
import MarkdownRenderer from '../../components/MarkdownRenderer/MarkdownRenderer'
// ConfigurationBanner import removed - component kept for potential future use
// import ConfigurationBanner from '../../components/ConfigurationBanner/ConfigurationBanner'
import ErrorDisplay from '../../components/ErrorDisplay/ErrorDisplay'
import { ConfigurationError, ConfigurationErrorHandler, ConfigurationErrorType } from '../../types/ConfigurationError'
import { decodeBase64ToUTF8 } from '../../utils/base64Decoder'
import { validateRepositoryParams } from '../../utils/validationUtils'
import './Home.css'

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingReadme, setIsLoadingReadme] = useState(true)
  const [error, setError] = useState<ConfigurationError | string | null>(null)
  const [readmeContent, setReadmeContent] = useState<string>('')
  const [repoInput, setRepoInput] = useState('')
  const [rateLimitError, setRateLimitError] = useState<RateLimitError | SecondaryRateLimitError | null>(null)
  
  const { randomEngine, apiClient } = createServices()

  // Load configured default repository README on component mount
  useEffect(() => {
    loadDefaultRepositoryReadme()
  }, [])

  const loadDefaultRepositoryReadme = async () => {
    try {
      setIsLoadingReadme(true)
      setError(null)
      
      const { owner, repo } = configurationManager.getDefaultRepository()
      
      // Log configuration for debugging (without exposing sensitive data)
      if (configurationManager.isUsingCustomConfig()) {
        console.log(`Alexandria configured for custom repository: ${owner}/${repo}`)
      } else {
        console.log(`Alexandria using default repository: ${owner}/${repo}`)
      }
      
      // Try to load README from configured repository
      let readme
      try {
        readme = await apiClient.getReadme(owner, repo)
      } catch (primaryError) {
        // If custom config fails, show helpful error
        if (configurationManager.isUsingCustomConfig()) {
          const configError = ConfigurationErrorHandler.createError(
            ConfigurationErrorType.REPOSITORY_NOT_FOUND,
            owner,
            repo,
            primaryError as Error
          )
          throw configError
        }
        
        // For default config, try alternative repository names
        try {
          readme = await apiClient.getReadme(owner, 'Alexandria')
        } catch {
          try {
            readme = await apiClient.getReadme(owner, 'alexandria')
          } catch {
            const configError = ConfigurationErrorHandler.createError(
              ConfigurationErrorType.REPOSITORY_NOT_FOUND,
              owner,
              repo
            )
            throw configError
          }
        }
      }
      
      // Decode base64 content with UTF-8 support
      const decodedContent = readme.encoding === 'base64' 
        ? decodeBase64ToUTF8(readme.content)
        : readme.content
      
      console.log('README content loaded:', decodedContent.substring(0, 200)) // Debug log
      setReadmeContent(decodedContent)
      
    } catch (err) {
      console.error('Failed to load default repository README:', err)
      
      if (err instanceof Error && 'type' in err) {
        // Handle ConfigurationError
        setError(err as ConfigurationError)
      } else {
        // Handle generic errors
        const errorMessage = err instanceof Error ? err.message : 'Failed to load repository content'
        
        // Determine error type based on message content
        if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          setError(ConfigurationErrorHandler.createError(ConfigurationErrorType.NETWORK_ERROR))
        } else if (errorMessage.includes('not found') || errorMessage.includes('404')) {
          const { owner, repo } = configurationManager.getDefaultRepository()
          setError(ConfigurationErrorHandler.createError(
            ConfigurationErrorType.REPOSITORY_NOT_FOUND,
            owner,
            repo
          ))
        } else {
          setError(errorMessage)
        }
      }
    } finally {
      setIsLoadingReadme(false)
    }
  }

  const handleRandomClick = async () => {
    setIsLoading(true)
    setError(null)
    setRateLimitError(null)
    
    try {
      // Get default filters for random discovery
      const filters = RandomEngine.createDefaultFilters()
      
      // Discover random repository
      const repository = await randomEngine.getRandomRepository(filters)
      
      // Get random markdown content from the repository
      const content = await randomEngine.getRandomMarkdownFromRepo(repository.owner, repository.name)
      
      // Navigate to the reader page with the discovered content
      navigate(`/r/${repository.owner}/${repository.name}/blob/${repository.defaultBranch}/${content.path}`)
      
    } catch (err) {
      console.error('Random discovery failed:', err)
      
      // Handle rate limit errors specially - show warning instead of error
      if (isRateLimitError(err)) {
        setRateLimitError(err as RateLimitError | SecondaryRateLimitError)
        // Don't set error state, just show the warning banner
      } else {
        setError(err instanceof Error ? err.message : 'Failed to discover content')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetryLoad = () => {
    setError(null)
    loadDefaultRepositoryReadme()
  }

  const handleRepoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoInput.trim()) return

    // Parse different input formats
    let owner: string, repo: string

    if (repoInput.includes('github.com/')) {
      // GitHub URL format
      const match = repoInput.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/)
      if (match) {
        owner = match[1]
        repo = match[2]
      } else {
        setError('Invalid GitHub URL format')
        return
      }
    } else if (repoInput.includes('/')) {
      // owner/repo format
      const parts = repoInput.split('/')
      if (parts.length === 2) {
        owner = parts[0]
        repo = parts[1]
      } else {
        setError('Invalid repository format. Use: owner/repo')
        return
      }
    } else {
      setError('Invalid format. Use: owner/repo or GitHub URL')
      return
    }

    // Validate and sanitize input before navigation
    const validation = validateRepositoryParams(owner, repo)
    if (!validation.valid) {
      setError(validation.error || 'Invalid repository format')
      return
    }

    // Navigate to repository
    navigate(`/r/${validation.owner}/${validation.repo}`)
  }

  if (isLoadingReadme) {
    return (
      <div className="home">
        <div className="loading">
          <h2>🔄 Loading Alexandria...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="home">
      {/* Configuration Banner removed per requirements 1.1, 1.2, 1.3 */}
      {/* ConfigurationBanner component kept for potential future use */}

      <div className="readme-content">
        <MarkdownRenderer 
          content={readmeContent} 
          repositoryContext={{
            owner: 'runawaydevil',
            repo: 'alexandria',
            ref: 'main',
            path: 'README.md'
          }}
        />
      </div>
      
      <div className="actions">
        {rateLimitError && (
          <RateLimitWarning 
            error={rateLimitError} 
            onDismiss={() => setRateLimitError(null)}
          />
        )}
        
        {error && !rateLimitError && (
          <ErrorDisplay
            error={error}
            onRetry={handleRetryLoad}
            onDismiss={() => setError(null)}
            showConfigHelp={configurationManager.isUsingCustomConfig()}
          />
        )}
        
        <button 
          className="random-button" 
          onClick={handleRandomClick}
          disabled={isLoading}
        >
          {isLoading ? '🔄 Discovering...' : '🎲 Discover Random Content'}
        </button>
        
        <form onSubmit={handleRepoSubmit} className="repo-input-form">
          <input
            type="text"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="Enter repository (owner/repo) or GitHub URL"
            className="repo-input"
          />
          <button type="submit" className="repo-submit">
            Go to Repository
          </button>
        </form>
      </div>
    </div>
  )
}

export default Home