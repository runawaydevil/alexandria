import { 
  RandomEngine as IRandomEngine,
  Repository,
  FileContent,
  SearchFilters,
  DocumentContext,
  GitHubApiClient,
  SearchQuery
} from '../types'

export class RandomEngine implements IRandomEngine {
  constructor(private apiClient: GitHubApiClient) {}

  async getRandomRepository(filters: SearchFilters): Promise<Repository> {
    // Estratégia 1: Search API primeiro (mais eficiente)
    try {
      return await this.searchRandomRepository(filters)
    } catch (error) {
      console.warn('Search API failed, trying user-based approach:', error)
    }

    // Estratégia 2: Usuário aleatório (fallback)
    let attempts = 0
    const maxAttempts = 5 // Reduzido drasticamente

    while (attempts < maxAttempts) {
      attempts++
      
      try {
        const randomRepo = await this.getRandomUserRepository()
        // Não verificar markdown content aqui para reduzir API calls
        return randomRepo
      } catch (error) {
        console.warn(`User-based attempt ${attempts} failed:`, error)
        if (attempts < maxAttempts) {
          await this.sleep(1000) // Delay maior entre tentativas
        }
      }
    }

    throw new Error('Could not find random repository after maximum attempts')
  }

  async getRandomMarkdownFromRepo(owner: string, repo: string): Promise<FileContent> {
    try {
      // Primeiro tentar README
      const repository = await this.apiClient.getRepository(owner, repo)
      
      try {
        return await this.apiClient.getReadme(owner, repo, repository.defaultBranch)
      } catch {
        // Se não tem README, procurar qualquer .md
        return await this.findRandomMarkdownFile(owner, repo, repository.defaultBranch)
      }
    } catch (error) {
      throw new Error(`No markdown content found in ${owner}/${repo}`)
    }
  }

  async getNextFromTrail(currentDoc: DocumentContext): Promise<FileContent | null> {
    // Extract markdown links from current document
    const markdownLinks = this.extractMarkdownLinks(currentDoc.content)
    
    if (markdownLinks.length === 0) {
      return null
    }

    // Try to follow a random link
    const randomLink = markdownLinks[Math.floor(Math.random() * markdownLinks.length)]
    
    try {
      return await this.followMarkdownLink(randomLink, currentDoc)
    } catch {
      return null
    }
  }

  private async getRandomUserRepository(): Promise<Repository> {
    // Gerar ID de usuário aleatório (GitHub user IDs vão até milhões)
    const randomUserId = Math.floor(Math.random() * 1000000) + 1
    
    try {
      // Buscar usuários próximos a esse ID
      const searchQuery: SearchQuery = {
        q: `type:user id:>${randomUserId}`,
        per_page: 10 // Reduzido para economizar rate limit
      }
      
      const users = await this.apiClient.searchUsers(searchQuery)
      
      if (users.length === 0) {
        throw new Error('No users found')
      }

      // Escolher usuário aleatório
      const randomUser = users[Math.floor(Math.random() * users.length)]
      
      // Buscar repositórios públicos desse usuário
      const repos = await this.apiClient.getUserRepositories(randomUser.login)
      
      if (repos.length === 0) {
        throw new Error('User has no public repositories')
      }

      // Escolher repositório aleatório
      return repos[Math.floor(Math.random() * repos.length)]
      
    } catch (error) {
      throw new Error(`Failed to get random user repository: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async searchRandomRepository(filters: SearchFilters): Promise<Repository> {
    const query = this.buildSearchQuery(filters)
    const page = Math.floor(Math.random() * 10) + 1 // Random page 1-10
    
    const searchQuery: SearchQuery = {
      q: query,
      sort: filters.sort,
      per_page: 100,
      page
    }

    const results = await this.apiClient.searchRepositories(searchQuery)

    if (results.length === 0) {
      throw new Error('No repositories found with current filters')
    }

    // Escolher repositório aleatório dos resultados
    return results[Math.floor(Math.random() * results.length)]
  }

  private buildSearchQuery(filters: SearchFilters): string {
    const parts = [
      `pushed:${filters.startDate}..${filters.endDate}`,
      `stars:>=${filters.minStars}`,
      'archived:false',
      'is:public'
    ]

    if (filters.language) {
      parts.push(`language:${filters.language}`)
    }

    if (filters.onlyWithDocs) {
      parts.push('(in:readme OR filename:README OR filename:docs)')
    }

    return parts.join(' ')
  }

  private async findRandomMarkdownFile(owner: string, repo: string, ref: string): Promise<FileContent> {
    const tree = await this.apiClient.getTreeRecursive(owner, repo, ref)
    
    const markdownFiles = tree.filter(item => 
      item.type === 'blob' && 
      (item.path.endsWith('.md') || item.path.endsWith('.mdx'))
    )

    if (markdownFiles.length === 0) {
      throw new Error('No markdown files found in repository')
    }

    const randomFile = markdownFiles[Math.floor(Math.random() * markdownFiles.length)]
    return await this.apiClient.getFileContent(owner, repo, randomFile.path, ref)
  }

  private extractMarkdownLinks(content: string): string[] {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const links: string[] = []
    let match

    while ((match = linkRegex.exec(content)) !== null) {
      const href = match[2]
      // Only include relative markdown links
      if (!href.startsWith('http') && !href.startsWith('#') && 
          (href.endsWith('.md') || href.endsWith('.mdx'))) {
        links.push(href)
      }
    }

    return links
  }

  private async followMarkdownLink(link: string, context: DocumentContext): Promise<FileContent> {
    // Resolve relative path
    const fullPath = this.resolveRelativePath(link, context.path)
    
    return await this.apiClient.getFileContent(
      context.owner, 
      context.repo, 
      fullPath, 
      context.ref
    )
  }

  private resolveRelativePath(relativePath: string, currentPath: string): string {
    // Simple path resolution
    const currentDir = currentPath.includes('/') 
      ? currentPath.substring(0, currentPath.lastIndexOf('/'))
      : ''
    
    if (relativePath.startsWith('./')) {
      return currentDir ? `${currentDir}/${relativePath.substring(2)}` : relativePath.substring(2)
    }
    
    if (relativePath.startsWith('../')) {
      const parts = currentDir.split('/').filter(p => p)
      const relativeParts = relativePath.split('/').filter(p => p)
      
      let upCount = 0
      for (const part of relativeParts) {
        if (part === '..') {
          upCount++
        } else {
          break
        }
      }
      
      const remainingParts = relativeParts.slice(upCount)
      const baseParts = parts.slice(0, -upCount)
      
      return [...baseParts, ...remainingParts].join('/')
    }
    
    // Absolute path from repo root
    return relativePath
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Helper method to create default filters
  static createDefaultFilters(): SearchFilters {
    const currentYear = new Date().getFullYear()
    const startYear = currentYear - 3 // Last 3 years
    
    return {
      startDate: `${startYear}-01-01`,
      endDate: new Date().toISOString().split('T')[0],
      minStars: 1,
      sort: 'updated',
      onlyWithDocs: false // Mais permissivo para encontrar mais repos
    }
  }
}