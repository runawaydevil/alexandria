import { GitHubApiClient } from './GitHubApiClient'
import { RandomEngine } from './RandomEngine'
import { CacheManager } from './CacheManager'
import { LinkRewriter } from './LinkRewriter'
import { TocGenerator } from './TocGenerator'
import { ShareManager } from './ShareManager'
import { ConfigurationManager } from './ConfigurationManager'

// Export all services
export { GitHubApiClient, RateLimitError, NetworkError, SecondaryRateLimitError } from './GitHubApiClient'
export { RandomEngine } from './RandomEngine'
export { CacheManager } from './CacheManager'
export { LinkRewriter } from './LinkRewriter'
export { TocGenerator, type TocItem, type DocumentToc, type RepositoryToc, type RepositoryTocItem } from './TocGenerator'
export { ShareManager, type ShareData, type ShareOptions } from './ShareManager'
export { ConfigurationManager, configurationManager, type RuntimeConfig, type RepositoryIdentifier } from './ConfigurationManager'

// Create service instances
export const createServices = () => {
  const cache = new CacheManager()
  const apiClient = new GitHubApiClient(cache)
  const randomEngine = new RandomEngine(apiClient)
  const linkRewriter = new LinkRewriter()
  const tocGenerator = new TocGenerator(apiClient)
  const shareManager = new ShareManager()
  const configManager = ConfigurationManager.getInstance()
  
  return {
    apiClient,
    randomEngine,
    cache,
    linkRewriter,
    tocGenerator,
    shareManager,
    configManager
  }
}