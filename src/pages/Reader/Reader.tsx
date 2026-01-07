import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createServices } from '../../services'
import { RandomEngine } from '../../services/RandomEngine'
import MarkdownRenderer from '../../components/MarkdownRenderer/MarkdownRenderer'
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner'
import DocumentToc from '../../components/DocumentToc/DocumentToc'
import RepositoryToc from '../../components/RepositoryToc/RepositoryToc'
import NavigationHistory from '../../components/NavigationHistory/NavigationHistory'
import Breadcrumb from '../../components/Breadcrumb/Breadcrumb'
import { FileContent, Repository } from '../../types'
import { DocumentToc as DocumentTocType, RepositoryToc as RepositoryTocType } from '../../services/TocGenerator'
import { decodeBase64ToUTF8 } from '../../utils/base64Decoder'
import { validateRepositoryParams, sanitizeRepoPath, sanitizeRef } from '../../utils/validationUtils'
import { isRateLimitError } from '../../utils/errorUtils'
import { RateLimitError, SecondaryRateLimitError } from '../../services/GitHubApiClient'
import RateLimitWarning from '../../components/RateLimitWarning/RateLimitWarning'
import './Reader.css'

const Reader: React.FC = () => {
  const { owner, repo, ref, '*': path } = useParams()
  const navigate = useNavigate()
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
  
  const { apiClient, randomEngine, cache, tocGenerator } = createServices()

  useEffect(() => {
    if (owner && repo) {
      // Validate URL parameters before loading
      const validation = validateRepositoryParams(owner, repo)
      if (!validation.valid) {
        setError(validation.error || 'Invalid repository parameters')
        return
      }
      
      // Sanitize path and ref
      const sanitizedPath = path ? sanitizeRepoPath(path) : null
      const sanitizedRef = ref ? sanitizeRef(ref) : null
      
      // If sanitization failed, show error
      if (path && !sanitizedPath) {
        setError('Invalid file path')
        return
      }
      if (ref && !sanitizedRef) {
        setError('Invalid branch/tag reference')
        return
      }
      
      loadContent()
    }
  }, [owner, repo, ref, path])

  const loadContent = async () => {
    if (!owner || !repo) return

    // Validate parameters again before API call
    const validation = validateRepositoryParams(owner, repo)
    if (!validation.valid) {
      setError(validation.error || 'Invalid repository parameters')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setRateLimitError(null) // Clear any previous rate limit errors

      // Load repository info
      const repository = await apiClient.getRepository(owner, repo)
      setRepoInfo(repository)

      // Determine what to load
      let fileContent: FileContent
      
      if (path) {
        // Load specific file
        fileContent = await apiClient.getFileContent(owner, repo, path, ref || repository.defaultBranch)
      } else {
        // Load README
        fileContent = await apiClient.getReadme(owner, repo, ref || repository.defaultBranch)
      }

      // Decode content if base64 with UTF-8 support
      const decodedContent = fileContent.encoding === 'base64' 
        ? decodeBase64ToUTF8(fileContent.content)
        : fileContent.content

      setContent(decodedContent)
      setFileInfo(fileContent)

      // Generate document ToC from content
      const docToc = tocGenerator.generateDocumentToc(decodedContent)
      setDocumentToc(docToc)

      // Generate repository ToC
      setIsLoadingToc(true)
      try {
        const repoToc = await tocGenerator.generateRepositoryToc(owner, repo, ref || repository.defaultBranch)
        setRepositoryToc(repoToc)
      } catch (tocError) {
        console.warn('Failed to generate repository ToC:', tocError)
        setRepositoryToc({ items: [] })
      } finally {
        setIsLoadingToc(false)
      }

      // Add to reading history
      await cache.addToHistory({
        owner,
        repo,
        path: fileContent.path,
        ref: ref || repository.defaultBranch,
        title: fileContent.name,
        timestamp: Date.now()
      })

    } catch (err) {
      console.error('Failed to load content:', err)
      
      // Handle rate limit errors specially - navigate back to previous repository
      if (isRateLimitError(err)) {
        setRateLimitError(err as RateLimitError | SecondaryRateLimitError)
        
        // Try to get previous item from history
        try {
          const history = await cache.getReadingHistory()
          if (history.length > 0) {
            // Get the first item (most recent, excluding current)
            const previousItem = history[0]
            const previousPath = `/r/${previousItem.owner}/${previousItem.repo}/blob/${previousItem.ref}/${previousItem.path}`
            
            // Navigate back to previous repository
            navigate(previousPath, { replace: true })
            return // Don't set error state, let the previous page load
          } else {
            // No history, go to home
            navigate('/', { replace: true })
            return
          }
        } catch (historyError) {
          console.warn('Failed to get navigation history:', historyError)
          // Fallback to home if history fails
          navigate('/', { replace: true })
          return
        }
      }
      
      // For non-rate-limit errors, show error page
      setError(err instanceof Error ? err.message : 'Failed to load content')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRandomClick = async () => {
    setIsLoadingRandom(true)
    setError(null)
    
    try {
      const filters = RandomEngine.createDefaultFilters()
      const repository = await randomEngine.getRandomRepository(filters)
      const randomContent = await randomEngine.getRandomMarkdownFromRepo(repository.owner, repository.name)
      
      navigate(`/r/${repository.owner}/${repository.name}/blob/${repository.defaultBranch}/${randomContent.path}`)
    } catch (err) {
      console.error('Random discovery failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to discover content')
    } finally {
      setIsLoadingRandom(false)
    }
  }

  const handleRepoRandomClick = async () => {
    if (!owner || !repo) return
    
    setIsLoadingRandom(true)
    setError(null)
    
    try {
      const randomContent = await randomEngine.getRandomMarkdownFromRepo(owner, repo)
      navigate(`/r/${owner}/${repo}/blob/${repoInfo?.defaultBranch || 'main'}/${randomContent.path}`)
    } catch (err) {
      console.error('Repository random failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to find random content in this repository')
    } finally {
      setIsLoadingRandom(false)
    }
  }

  if (isLoading) {
    return (
      <div className="reader">
        <LoadingSpinner 
          message="Loading content" 
          size="medium"
        />
      </div>
    )
  }

  // Don't show error page for rate limit - it's handled by navigation fallback
  // Only show error page for other types of errors
  if (error && !rateLimitError) {
    return (
      <div className="reader">
        <div className="error">
          <h2>❌ Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="back-button">
            ← Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="reader">
      <Breadcrumb 
        owner={owner!} 
        repo={repo!} 
        path={fileInfo?.path} 
        ref={ref || repoInfo?.defaultBranch} 
      />
      
      <div className="reader-header">
        <div className="repo-info">
          <h1 className="repo-title">
            <a href={repoInfo?.htmlUrl} target="_blank" rel="noopener noreferrer">
              {owner}/{repo}
            </a>
          </h1>
          {fileInfo && (
            <p className="file-path">
              📄 {fileInfo.path}
            </p>
          )}
        </div>
        
        <div className="reader-actions">
          <button 
            onClick={handleRandomClick}
            disabled={isLoadingRandom}
            className="random-button"
          >
            {isLoadingRandom ? '🔄' : '🎲'} Random Global
          </button>
          
          <button 
            onClick={handleRepoRandomClick}
            disabled={isLoadingRandom}
            className="random-button"
          >
            {isLoadingRandom ? '🔄' : '🔀'} Random from {repo}
          </button>
          
          <button onClick={() => navigate('/')} className="home-button">
            🏠 Home
          </button>
        </div>
      </div>
      
      {rateLimitError && (
        <RateLimitWarning 
          error={rateLimitError} 
          onDismiss={() => setRateLimitError(null)}
        />
      )}
      
      {error && !rateLimitError && (
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={() => setError(null)} className="dismiss-error">
            Dismiss
          </button>
        </div>
      )}
      
      <div className="reader-content">
        <div className="reader-sidebar">
          <NavigationHistory 
            currentPath={fileInfo && repoInfo ? 
              `/r/${owner}/${repo}/blob/${ref || repoInfo.defaultBranch}/${fileInfo.path}` : 
              undefined
            } 
          />
          
          {documentToc && documentToc.items.length > 0 && (
            <DocumentToc items={documentToc.items} />
          )}
          
          {repositoryToc && repositoryToc.items.length > 0 && (
            <RepositoryToc 
              items={repositoryToc.items} 
              currentPath={fileInfo?.path}
            />
          )}
          
          {isLoadingToc && (
            <div className="toc-loading">
              <LoadingSpinner 
                message="Loading navigation" 
                size="small"
              />
            </div>
          )}
        </div>
        
        <div className="markdown-content">
          <MarkdownRenderer 
            content={content}
            repositoryContext={fileInfo && repoInfo ? {
              owner: owner!,
              repo: repo!,
              ref: ref || repoInfo.defaultBranch,
              path: fileInfo.path
            } : undefined}
          />
        </div>
      </div>
    </div>
  )
}

export default Reader