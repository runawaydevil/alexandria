import { DocumentContext, MarkdownLink } from '../types'

/**
 * LinkRewriter handles intelligent transformation of markdown links
 * based on their type and context within the Alexandria system.
 */
export class LinkRewriter {
  /**
   * Rewrite all markdown links in content based on document context
   */
  rewriteMarkdownLinks(content: string, context: DocumentContext): string {
    // Replace markdown links [text](href)
    return content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
      const rewrittenHref = this.rewriteHref(href, context)
      return `[${text}](${rewrittenHref})`
    })
  }

  /**
   * Rewrite a single href based on its type and context
   */
  rewriteHref(href: string, context: DocumentContext): string {
    if (!href) return href

    // Anchor links - keep as is for smooth scrolling
    if (href.startsWith('#')) {
      return href
    }

    // External links - keep as is (will be handled by component for target="_blank")
    if (href.startsWith('http')) {
      // Check if it's a GitHub blob URL that should be converted
      const githubMatch = href.match(/https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+\.mdx?)/)
      if (githubMatch) {
        const [, owner, repo, ref, path] = githubMatch
        return `/r/${owner}/${repo}/blob/${ref}/${path}`
      }
      return href
    }

    // Relative markdown links in same repo
    if (this.isRelativeMarkdownLink(href)) {
      const fullPath = this.resolveRelativePath(href, context.path)
      return `/r/${context.owner}/${context.repo}/blob/${context.ref}/${fullPath}`
    }

    // Other relative links (non-markdown) - keep as is
    return href
  }

  /**
   * Determine if a link is a relative markdown link
   */
  private isRelativeMarkdownLink(href: string): boolean {
    return !href.startsWith('http') && 
           !href.startsWith('#') && 
           !href.startsWith('/') &&
           (href.endsWith('.md') || href.endsWith('.mdx'))
  }

  /**
   * Resolve relative path based on current document path
   */
  private resolveRelativePath(href: string, currentPath: string): string {
    // Handle different types of relative paths
    if (href.startsWith('./')) {
      // Same directory
      const currentDir = currentPath.includes('/') ? 
        currentPath.substring(0, currentPath.lastIndexOf('/')) : ''
      return currentDir ? `${currentDir}/${href.substring(2)}` : href.substring(2)
    } else if (href.startsWith('../')) {
      // Parent directory navigation
      const pathParts = currentPath.split('/').slice(0, -1) // Remove filename
      const hrefParts = href.split('/')
      
      let upCount = 0
      for (const part of hrefParts) {
        if (part === '..') {
          upCount++
        } else {
          break
        }
      }
      
      const remainingParts = hrefParts.slice(upCount)
      const baseParts = pathParts.slice(0, Math.max(0, pathParts.length - upCount))
      return [...baseParts, ...remainingParts].join('/')
    } else {
      // Relative to current directory (no ./ prefix)
      const currentDir = currentPath.includes('/') ? 
        currentPath.substring(0, currentPath.lastIndexOf('/')) : ''
      return currentDir ? `${currentDir}/${href}` : href
    }
  }

  /**
   * Analyze markdown content to extract all links with their types
   */
  extractMarkdownLinks(content: string, context: DocumentContext): MarkdownLink[] {
    const links: MarkdownLink[] = []
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    let match

    while ((match = linkRegex.exec(content)) !== null) {
      const [, text, href] = match
      const type = this.determineLinkType(href, context)
      
      links.push({
        href,
        text,
        type
      })
    }

    return links
  }

  /**
   * Determine the type of a markdown link
   */
  private determineLinkType(href: string, _context: DocumentContext): MarkdownLink['type'] {
    if (href.startsWith('#')) {
      return 'anchor'
    }

    if (href.startsWith('http')) {
      // Check if it's a GitHub blob URL
      const githubMatch = href.match(/https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+\.mdx?)/)
      if (githubMatch) {
        return 'github-blob'
      }
      return 'external'
    }

    if (this.isRelativeMarkdownLink(href)) {
      return 'relative'
    }

    return 'external'
  }

  /**
   * Get link processing properties for React components
   */
  getLinkProps(href: string, context: DocumentContext): { 
    href: string
    target?: string
    rel?: string 
  } {
    const rewrittenHref = this.rewriteHref(href, context)
    
    // External links should open in new tab with security attributes
    if (href.startsWith('http') && !href.match(/https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+\.mdx?)/)) {
      return {
        href: rewrittenHref,
        target: '_blank',
        rel: 'noopener noreferrer'
      }
    }

    return { href: rewrittenHref }
  }
}