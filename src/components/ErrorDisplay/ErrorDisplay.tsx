import React from 'react'
import { ConfigurationError, ConfigurationErrorHandler, ConfigurationErrorType } from '../../types/ConfigurationError'
import './ErrorDisplay.css'

interface ErrorDisplayProps {
  error: ConfigurationError | string
  onRetry?: () => void
  onDismiss?: () => void
  showConfigHelp?: boolean
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  onRetry, 
  onDismiss, 
  showConfigHelp = false 
}) => {
  const isConfigError = typeof error === 'object' && ConfigurationErrorHandler.isConfigurationError(error)
  const configError = isConfigError ? error as ConfigurationError : null
  
  const title = configError?.title || 'Error'
  const message = configError?.message || (typeof error === 'string' ? error : 'An unexpected error occurred')
  const suggestion = configError?.suggestion
  const recoveryStrategies = configError ? ConfigurationErrorHandler.getErrorRecoveryStrategy(configError) : []

  const renderConfigurationHelp = () => {
    if (!showConfigHelp || !configError) return null

    return (
      <div className="config-help">
        <h4>Configuration Help</h4>
        <div className="help-section">
          <h5>Environment Variables</h5>
          <ul>
            <li>Set <code>VITE_DEFAULT_OWNER</code> to your GitHub username or organization</li>
            <li>Set <code>VITE_DEFAULT_REPO</code> to your repository name</li>
            <li>Both variables must be set together</li>
          </ul>
        </div>
        
        <div className="help-section">
          <h5>GitHub Actions Deployment</h5>
          <ul>
            <li>Add repository secrets in Settings → Secrets and variables → Actions</li>
            <li>Use the same variable names: <code>VITE_DEFAULT_OWNER</code> and <code>VITE_DEFAULT_REPO</code></li>
            <li>Ensure your repository is public or you have appropriate permissions</li>
          </ul>
        </div>

        {configError.owner && configError.repo && (
          <div className="help-section">
            <h5>Repository Link</h5>
            <a 
              href={`https://github.com/${configError.owner}/${configError.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="repo-link"
            >
              Visit {configError.owner}/{configError.repo} on GitHub
            </a>
          </div>
        )}
      </div>
    )
  }

  const renderRecoveryStrategies = () => {
    if (recoveryStrategies.length === 0) return null

    return (
      <div className="recovery-strategies">
        <h4>How to Fix This</h4>
        <ul>
          {recoveryStrategies.map((strategy, index) => (
            <li key={index}>{strategy}</li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="error-display" role="alert" aria-live="polite">
      <div className="error-header">
        <span className="error-icon" aria-hidden="true">
          {configError?.type === ConfigurationErrorType.NETWORK_ERROR ? '🌐' : '❌'}
        </span>
        <h3 className="error-title">{title}</h3>
      </div>
      
      <div className="error-content">
        <p className="error-message">{message}</p>
        
        {suggestion && (
          <p className="error-suggestion">
            <strong>Suggestion:</strong> {suggestion}
          </p>
        )}

        {renderRecoveryStrategies()}
        {renderConfigurationHelp()}
      </div>
      
      <div className="error-actions">
        {onRetry && (
          <button 
            onClick={onRetry} 
            className="retry-button"
            aria-label="Retry loading the repository"
          >
            🔄 Retry
          </button>
        )}
        
        {onDismiss && (
          <button 
            onClick={onDismiss} 
            className="dismiss-button"
            aria-label="Dismiss this error message"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}

export default ErrorDisplay