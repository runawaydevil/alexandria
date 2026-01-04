/**
 * Configuration Error Types and Handlers for Alexandria
 */

export enum ConfigurationErrorType {
  INVALID_OWNER = 'invalid_owner',
  INVALID_REPO = 'invalid_repo',
  REPOSITORY_NOT_FOUND = 'repository_not_found',
  NO_README_FOUND = 'no_readme_found',
  NETWORK_ERROR = 'network_error',
  BUILD_VALIDATION_ERROR = 'build_validation_error'
}

export interface ConfigurationError extends Error {
  type: ConfigurationErrorType
  title: string
  suggestion?: string
  owner?: string
  repo?: string
  originalError?: Error
}

export class ConfigurationErrorHandler {
  private static readonly ERROR_MESSAGES = {
    [ConfigurationErrorType.INVALID_OWNER]: {
      title: "Invalid Repository Owner",
      message: "The repository owner '{owner}' is not a valid GitHub username.",
      suggestion: "GitHub usernames can contain letters, numbers, and hyphens, and must be 1-39 characters long."
    },
    [ConfigurationErrorType.INVALID_REPO]: {
      title: "Invalid Repository Name",
      message: "The repository name '{repo}' is not valid.",
      suggestion: "Repository names can contain letters, numbers, dots, underscores, and hyphens."
    },
    [ConfigurationErrorType.REPOSITORY_NOT_FOUND]: {
      title: "Repository Not Found",
      message: "The repository '{owner}/{repo}' could not be found or is not public.",
      suggestion: "Please check that the repository exists and is publicly accessible."
    },
    [ConfigurationErrorType.NO_README_FOUND]: {
      title: "No README Found",
      message: "The repository '{owner}/{repo}' exists but doesn't have a README file.",
      suggestion: "Consider adding a README.md file to your repository for the best Alexandria experience."
    },
    [ConfigurationErrorType.NETWORK_ERROR]: {
      title: "Network Error",
      message: "Unable to connect to GitHub. Please check your internet connection.",
      suggestion: "Try refreshing the page or check your network connection."
    },
    [ConfigurationErrorType.BUILD_VALIDATION_ERROR]: {
      title: "Build Configuration Error",
      message: "Invalid configuration detected during build process.",
      suggestion: "Check your environment variables and ensure they follow GitHub naming conventions."
    }
  }

  static createError(
    type: ConfigurationErrorType,
    owner?: string,
    repo?: string,
    originalError?: Error
  ): ConfigurationError {
    const template = this.ERROR_MESSAGES[type]
    
    let message = template.message
    if (owner) {
      message = message.replace('{owner}', owner)
    }
    if (repo) {
      message = message.replace('{repo}', repo)
    }
    if (owner && repo) {
      message = message.replace('{owner}/{repo}', `${owner}/${repo}`)
    }

    const error = new Error(message) as ConfigurationError
    error.type = type
    error.title = template.title
    error.suggestion = template.suggestion
    error.owner = owner
    error.repo = repo
    error.originalError = originalError

    return error
  }

  static handleInvalidOwner(owner: string): ConfigurationError {
    return this.createError(ConfigurationErrorType.INVALID_OWNER, owner)
  }

  static handleInvalidRepo(repo: string): ConfigurationError {
    return this.createError(ConfigurationErrorType.INVALID_REPO, undefined, repo)
  }

  static handleRepositoryNotFound(owner: string, repo: string): ConfigurationError {
    return this.createError(ConfigurationErrorType.REPOSITORY_NOT_FOUND, owner, repo)
  }

  static handleNoReadme(owner: string, repo: string): ConfigurationError {
    return this.createError(ConfigurationErrorType.NO_README_FOUND, owner, repo)
  }

  static handleNetworkError(originalError?: Error): ConfigurationError {
    return this.createError(ConfigurationErrorType.NETWORK_ERROR, undefined, undefined, originalError)
  }

  static handleBuildValidationError(originalError?: Error): ConfigurationError {
    return this.createError(ConfigurationErrorType.BUILD_VALIDATION_ERROR, undefined, undefined, originalError)
  }

  static isConfigurationError(error: any): error is ConfigurationError {
    return error && typeof error === 'object' && 'type' in error && Object.values(ConfigurationErrorType).includes(error.type)
  }

  static getErrorRecoveryStrategy(error: ConfigurationError): string[] {
    switch (error.type) {
      case ConfigurationErrorType.INVALID_OWNER:
      case ConfigurationErrorType.INVALID_REPO:
        return [
          'Check your environment variables',
          'Ensure names follow GitHub conventions',
          'Verify both VITE_DEFAULT_OWNER and VITE_DEFAULT_REPO are set'
        ]
      
      case ConfigurationErrorType.REPOSITORY_NOT_FOUND:
        return [
          'Verify the repository exists and is public',
          'Check the spelling of owner and repository name',
          'Ensure you have access to the repository'
        ]
      
      case ConfigurationErrorType.NO_README_FOUND:
        return [
          'Add a README.md file to your repository',
          'Check if README exists in a subdirectory',
          'Verify the file is named exactly "README.md"'
        ]
      
      case ConfigurationErrorType.NETWORK_ERROR:
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Wait a moment and try again'
        ]
      
      case ConfigurationErrorType.BUILD_VALIDATION_ERROR:
        return [
          'Review your environment variable configuration',
          'Check build logs for specific validation errors',
          'Ensure all required variables are properly set'
        ]
      
      default:
        return ['Try refreshing the page', 'Check your configuration']
    }
  }
}