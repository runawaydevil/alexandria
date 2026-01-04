/**
 * Configuration Manager for Alexandria
 * Handles environment-based repository configuration with fallback support
 */

export interface RuntimeConfig {
  defaultOwner: string
  defaultRepo: string
  isCustomConfig: boolean
  configSource: 'environment' | 'fallback'
}

export interface RepositoryIdentifier {
  owner: string
  repo: string
}

export class ConfigurationManager {
  private static instance: ConfigurationManager
  private config: RuntimeConfig

  constructor() {
    this.config = this.loadConfiguration()
  }

  /**
   * Get singleton instance of Configuration Manager
   */
  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager()
    }
    return ConfigurationManager.instance
  }

  /**
   * Load configuration from environment variables with fallback
   */
  private loadConfiguration(): RuntimeConfig {
    const envOwner = import.meta.env.VITE_DEFAULT_OWNER
    const envRepo = import.meta.env.VITE_DEFAULT_REPO

    // Validate environment variables
    if (envOwner && envRepo && this.isValidRepositoryIdentifier(envOwner, envRepo)) {
      return {
        defaultOwner: envOwner,
        defaultRepo: envRepo,
        isCustomConfig: true,
        configSource: 'environment'
      }
    }

    // Fallback to default
    return {
      defaultOwner: 'runawaydevil',
      defaultRepo: 'alexandria',
      isCustomConfig: false,
      configSource: 'fallback'
    }
  }

  /**
   * Validate GitHub repository identifier
   */
  private isValidRepositoryIdentifier(owner: string, repo: string): boolean {
    return this.isValidGitHubUsername(owner) && this.isValidGitHubRepoName(repo)
  }

  /**
   * Validate GitHub username according to GitHub rules
   * - 1-39 characters
   * - Alphanumeric and hyphens only
   * - Cannot start or end with hyphen
   */
  private isValidGitHubUsername(username: string): boolean {
    if (!username || username.length === 0 || username.length > 39) {
      return false
    }

    // Single character usernames (alphanumeric only)
    if (username.length === 1) {
      return /^[a-zA-Z0-9]$/.test(username)
    }

    // Multi-character usernames
    const regex = /^[a-zA-Z0-9]([a-zA-Z0-9-])*[a-zA-Z0-9]$/
    return regex.test(username)
  }

  /**
   * Validate GitHub repository name according to GitHub rules
   * - Alphanumeric, dots, underscores, hyphens
   * - Maximum 100 characters
   */
  private isValidGitHubRepoName(repoName: string): boolean {
    if (!repoName || repoName.length === 0 || repoName.length > 100) {
      return false
    }

    const regex = /^[a-zA-Z0-9._-]+$/
    return regex.test(repoName)
  }

  /**
   * Get the default repository configuration
   */
  public getDefaultRepository(): RepositoryIdentifier {
    return {
      owner: this.config.defaultOwner,
      repo: this.config.defaultRepo
    }
  }

  /**
   * Check if using custom configuration
   */
  public isUsingCustomConfig(): boolean {
    return this.config.isCustomConfig
  }

  /**
   * Get configuration source
   */
  public getConfigSource(): string {
    return this.config.configSource
  }

  /**
   * Get full configuration for debugging
   */
  public getConfig(): RuntimeConfig {
    return { ...this.config }
  }

  /**
   * Validate a repository identifier (public method for testing)
   */
  public validateRepositoryIdentifier(owner: string, repo: string): boolean {
    return this.isValidRepositoryIdentifier(owner, repo)
  }

  /**
   * Validate GitHub username (public method for testing)
   */
  public validateGitHubUsername(username: string): boolean {
    return this.isValidGitHubUsername(username)
  }

  /**
   * Validate GitHub repository name (public method for testing)
   */
  public validateGitHubRepoName(repoName: string): boolean {
    return this.isValidGitHubRepoName(repoName)
  }
}

// Export singleton instance
export const configurationManager = ConfigurationManager.getInstance()