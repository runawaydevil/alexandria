import { GitHubApiClient } from './GitHubApiClient'

export interface TocItem {
  id: string
  text: string
  level: number
  anchor: string
}

export interface DocumentToc {
  items: TocItem[]
}

export interface RepositoryTocItem {
  name: string
  path: string
  type: 'file' | 'directory'
  url: string
}

export interface RepositoryToc {
  items: RepositoryTocItem[]
}

export class TocGenerator {
  constructor(private apiClient: GitHubApiClient) {}

  /**
   * Generate table of contents from markdown content
   * Extracts headings and creates anchor links for smooth scrolling
   */
  generateDocumentToc(markdownContent: string): DocumentToc {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm
    const items: TocItem[] = []
    let match

    while ((match = headingRegex.exec(markdownContent)) !== null) {
      const level = match[1].length
      const text = match[2].trim()
      const anchor = this.generateAnchor(text)
      
      items.push({
        id: `heading-${items.length}`,
        text,
        level,
        anchor
      })
    }

    return { items }
  }

  /**
   * Generate repository table of contents by discovering markdown files
   * Uses git trees API recursively with fallback to contents API
   */
  async generateRepositoryToc(
    owner: string, 
    repo: string, 
    ref: string = 'main'
  ): Promise<RepositoryToc> {
    try {
      // Try git trees API first for recursive discovery
      const treeItems = await this.apiClient.getTreeRecursive(owner, repo, ref)
      const markdownFiles = this.filterMarkdownFiles(treeItems)
      
      return {
        items: markdownFiles.map(item => ({
          name: this.getFileName(item.path),
          path: item.path,
          type: 'file' as const,
          url: `/r/${owner}/${repo}/blob/${ref}/${item.path}`
        }))
      }
    } catch (error) {
      // Fallback to contents API for common directories
      return this.generateTocFromContents(owner, repo, ref)
    }
  }

  /**
   * Generate anchor ID from heading text
   * Follows GitHub's anchor generation rules
   */
  private generateAnchor(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  }

  /**
   * Filter tree items to only include markdown files
   */
  private filterMarkdownFiles(treeItems: any[]): any[] {
    const markdownExtensions = ['.md', '.mdx']
    const readmePatterns = ['readme', 'README']
    
    return treeItems.filter(item => {
      if (item.type !== 'blob') return false
      
      const path = item.path.toLowerCase()
      const hasMarkdownExtension = markdownExtensions.some(ext => 
        path.endsWith(ext.toLowerCase())
      )
      
      const isReadme = readmePatterns.some(pattern => 
        path.includes(pattern.toLowerCase())
      )
      
      return hasMarkdownExtension || isReadme
    })
  }

  /**
   * Fallback ToC generation using contents API for common directories
   */
  private async generateTocFromContents(
    owner: string, 
    repo: string, 
    ref: string
  ): Promise<RepositoryToc> {
    const commonDirectories = ['', 'docs', '.github']
    const items: RepositoryTocItem[] = []
    
    for (const dir of commonDirectories) {
      try {
        const contents = await this.apiClient.getDirectoryContents(owner, repo, dir, ref)
        const markdownFiles = contents.filter((item: any) => 
          item.type === 'file' && this.isMarkdownFile(item.name)
        )
        
        items.push(...markdownFiles.map((file: any) => ({
          name: file.name,
          path: dir ? `${dir}/${file.name}` : file.name,
          type: 'file' as const,
          url: `/r/${owner}/${repo}/blob/${ref}/${dir ? `${dir}/${file.name}` : file.name}`
        })))
      } catch (error) {
        // Continue with other directories if one fails
        continue
      }
    }
    
    return { items }
  }

  /**
   * Check if a filename is a markdown file
   */
  private isMarkdownFile(filename: string): boolean {
    const markdownExtensions = ['.md', '.mdx']
    const readmePatterns = ['readme', 'README']
    
    const lowerName = filename.toLowerCase()
    
    return markdownExtensions.some(ext => lowerName.endsWith(ext)) ||
           readmePatterns.some(pattern => lowerName.startsWith(pattern.toLowerCase()))
  }

  /**
   * Extract filename from path
   */
  private getFileName(path: string): string {
    return path.split('/').pop() || path
  }
}