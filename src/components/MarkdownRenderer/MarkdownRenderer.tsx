import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import { LinkRewriter } from '../../services/LinkRewriter'
import { DocumentContext } from '../../types'
import './MarkdownRenderer.css'

interface MarkdownRendererProps {
  content: string
  className?: string
  repositoryContext?: {
    owner: string
    repo: string
    ref: string
    path: string
  }
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className = '',
  repositoryContext 
}) => {
  // Create LinkRewriter instance
  const linkRewriter = new LinkRewriter()
  
  // Create document context for link rewriting
  const documentContext: DocumentContext | undefined = repositoryContext ? {
    owner: repositoryContext.owner,
    repo: repositoryContext.repo,
    ref: repositoryContext.ref,
    path: repositoryContext.path,
    content,
    links: [] // Will be populated by LinkRewriter if needed
  } : undefined
  // Helper function to convert relative paths to GitHub raw URLs
  const convertImagePath = (src: string): string => {
    if (!src || src.startsWith('http') || src.startsWith('data:')) {
      return src
    }

    // Special handling for Alexandria logo
    if (src.includes('alexandria.png')) {
      return '/Alexandria/alexandria.png'
    }

    // If we have repository context, convert relative paths
    if (repositoryContext && !src.startsWith('/')) {
      const { owner, repo, ref, path } = repositoryContext
      
      // Handle relative paths
      let resolvedPath = src
      if (src.startsWith('./')) {
        // Same directory
        const currentDir = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : ''
        resolvedPath = currentDir ? `${currentDir}/${src.substring(2)}` : src.substring(2)
      } else if (src.startsWith('../')) {
        // Parent directory
        const pathParts = path.split('/').slice(0, -1) // Remove filename
        const srcParts = src.split('/')
        
        let upCount = 0
        for (const part of srcParts) {
          if (part === '..') {
            upCount++
          } else {
            break
          }
        }
        
        const remainingParts = srcParts.slice(upCount)
        const baseParts = pathParts.slice(0, -upCount)
        resolvedPath = [...baseParts, ...remainingParts].join('/')
      } else if (!src.startsWith('/')) {
        // Relative to current directory
        const currentDir = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : ''
        resolvedPath = currentDir ? `${currentDir}/${src}` : src
      }
      
      // Convert to GitHub raw URL
      return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${resolvedPath}`
    }

    return src
  }

  // Helper function to process markdown links using LinkRewriter
  const processMarkdownLink = (href: string): { href: string; target?: string; rel?: string } => {
    if (!href || !documentContext) {
      // Fallback for external links without context
      if (href && href.startsWith('http')) {
        return {
          href,
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      }
      return { href: href || '' }
    }

    return linkRewriter.getLinkProps(href, documentContext)
  }

  // Helper function to generate anchor ID from heading text
  const generateAnchor = (text: string): string => {
    return text
      .toString()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  }

  return (
    <div className={`markdown-renderer ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSanitize, // XSS protection
          rehypeHighlight // Syntax highlighting
        ]}
        components={{
          // Custom components for Y2K styling
          h1: ({ children }) => {
            // Se é "Alexandria", centralizar
            const isMainTitle = children?.toString().toLowerCase().includes('alexandria')
            const anchor = generateAnchor(children?.toString() || '')
            return (
              <h1 
                id={anchor}
                className="md-h1" 
                style={isMainTitle ? { textAlign: 'center' } : undefined}
              >
                {children}
              </h1>
            )
          },
          h2: ({ children }) => {
            const anchor = generateAnchor(children?.toString() || '')
            return <h2 id={anchor} className="md-h2">{children}</h2>
          },
          h3: ({ children }) => {
            const anchor = generateAnchor(children?.toString() || '')
            return <h3 id={anchor} className="md-h3">{children}</h3>
          },
          h4: ({ children }) => {
            const anchor = generateAnchor(children?.toString() || '')
            return <h4 id={anchor} className="md-h4">{children}</h4>
          },
          h5: ({ children }) => {
            const anchor = generateAnchor(children?.toString() || '')
            return <h5 id={anchor} className="md-h5">{children}</h5>
          },
          h6: ({ children }) => {
            const anchor = generateAnchor(children?.toString() || '')
            return <h6 id={anchor} className="md-h6">{children}</h6>
          },
          p: ({ children }) => <p className="md-p">{children}</p>,
          ul: ({ children }) => <ul className="md-ul">{children}</ul>,
          ol: ({ children }) => <ol className="md-ol">{children}</ol>,
          li: ({ children }) => <li className="md-li">{children}</li>,
          blockquote: ({ children }) => <blockquote className="md-blockquote">{children}</blockquote>,
          code: ({ children, className }) => {
            const isInline = !className
            return isInline ? (
              <code className="md-code-inline">{children}</code>
            ) : (
              <code className={`md-code-block ${className || ''}`}>{children}</code>
            )
          },
          pre: ({ children }) => <pre className="md-pre">{children}</pre>,
          a: ({ href, children }) => {
            const linkProps = processMarkdownLink(href || '')
            return (
              <a 
                {...linkProps}
                className="md-link"
              >
                {children}
              </a>
            )
          },
          img: ({ src, alt }) => {
            // Convert image path
            const imageSrc = convertImagePath(src || '')
            
            // Se é a logo da Alexandria, centralizar e ajustar tamanho
            const isAlexandriaLogo = alt?.toLowerCase().includes('logo') || src?.includes('alexandria.png')
            
            return (
              <img 
                src={imageSrc} 
                alt={alt} 
                className="md-img"
                loading="lazy"
                style={isAlexandriaLogo ? { 
                  maxWidth: '259px', 
                  height: 'auto',
                  border: '1px solid #ccc',
                  display: 'block',
                  margin: '12px auto'
                } : { 
                  display: 'block',
                  margin: '12px auto'
                }}
                onError={(e) => {
                  // Tentar caminho alternativo para Alexandria logo
                  const target = e.target as HTMLImageElement
                  if (target.src.includes('alexandria.png')) {
                    target.src = '/alexandria.png'
                  }
                }}
              />
            )
          },
          table: ({ children }) => (
            <div className="md-table-wrapper">
              <table className="md-table">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="md-thead">{children}</thead>,
          tbody: ({ children }) => <tbody className="md-tbody">{children}</tbody>,
          tr: ({ children }) => <tr className="md-tr">{children}</tr>,
          th: ({ children }) => <th className="md-th">{children}</th>,
          td: ({ children }) => <td className="md-td">{children}</td>,
          hr: () => <hr className="md-hr" />,
          strong: ({ children }) => <strong className="md-strong">{children}</strong>,
          em: ({ children }) => <em className="md-em">{children}</em>,
          del: ({ children }) => <del className="md-del">{children}</del>
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer