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
  // Helper function to convert relative paths with comprehensive fallback strategies
  const convertImagePath = (src: string): string => {
    if (!src || src.startsWith('http') || src.startsWith('data:')) {
      return src
    }

    // Special handling for Alexandria logo with multiple fallback paths
    if (src.includes('alexandria.png')) {
      // For local Alexandria README, use the public path directly
      if (!repositoryContext || (repositoryContext.owner === 'runawaydevil' && repositoryContext.repo === 'alexandria')) {
        return '/alexandria.png' // Primary path in public directory
      }
      // For other repositories, try GitHub raw URL first
      return `https://raw.githubusercontent.com/${repositoryContext.owner}/${repositoryContext.repo}/${repositoryContext.ref}/public/alexandria.png`
    }

    // If we have repository context, convert relative paths
    if (repositoryContext && !src.startsWith('/')) {
      const { owner, repo, ref, path } = repositoryContext
      
      // Handle relative paths with improved resolution
      let resolvedPath = src
      if (src.startsWith('./')) {
        // Same directory - handle ./public/alexandria.png case
        if (src === './public/alexandria.png') {
          resolvedPath = 'public/alexandria.png'
        } else {
          const currentDir = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : ''
          resolvedPath = currentDir ? `${currentDir}/${src.substring(2)}` : src.substring(2)
        }
      } else if (src.startsWith('../')) {
        // Parent directory - improved handling
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
        const baseParts = pathParts.slice(0, Math.max(0, pathParts.length - upCount))
        resolvedPath = [...baseParts, ...remainingParts].join('/')
      } else if (!src.startsWith('/')) {
        // Relative to current directory
        const currentDir = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : ''
        resolvedPath = currentDir ? `${currentDir}/${src}` : src
      }
      
      // Convert to GitHub raw URL
      return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${resolvedPath}`
    }

    // For absolute paths starting with '/', try as-is first
    return src
  }

  // Helper function to get fallback paths for images
  const getImageFallbackPaths = (originalSrc: string): string[] => {
    const fallbacks: string[] = []
    
    // Special handling for Alexandria logo
    if (originalSrc.includes('alexandria.png')) {
      fallbacks.push('/alexandria.png')
      fallbacks.push('/public/alexandria.png')
      fallbacks.push('./public/alexandria.png')
      fallbacks.push('alexandria.png')
      
      // If we have repository context, also try GitHub raw URLs
      if (repositoryContext) {
        const { owner, repo, ref } = repositoryContext
        fallbacks.push(`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/public/alexandria.png`)
        fallbacks.push(`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/alexandria.png`)
      }
      
      return fallbacks
    }

    // For repository images, try different path variations
    if (repositoryContext && originalSrc && !originalSrc.startsWith('http')) {
      const { owner, repo, ref } = repositoryContext
      
      // Try root of repository
      const filename = originalSrc.split('/').pop()
      if (filename) {
        fallbacks.push(`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${filename}`)
      }
      
      // Try common directories
      const commonDirs = ['assets', 'images', 'img', 'docs', '.github', 'public']
      for (const dir of commonDirs) {
        if (filename) {
          fallbacks.push(`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${dir}/${filename}`)
        }
      }
    }

    return fallbacks
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
            const fallbackPaths = getImageFallbackPaths(src || '')
            
            // Check if it's Alexandria logo for special styling
            const isAlexandriaLogo = alt?.toLowerCase().includes('logo') || 
                                   src?.includes('alexandria.png') ||
                                   alt?.toLowerCase().includes('alexandria')
            
            // State to track current fallback index
            const [currentSrcIndex, setCurrentSrcIndex] = React.useState(0)
            const [currentSrc, setCurrentSrc] = React.useState(imageSrc)
            const [hasError, setHasError] = React.useState(false)
            
            // Handle image load errors with fallback strategy
            const handleImageError = React.useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
              const target = e.target as HTMLImageElement
              
              // Try next fallback path
              if (currentSrcIndex < fallbackPaths.length) {
                const nextSrc = fallbackPaths[currentSrcIndex]
                setCurrentSrc(nextSrc)
                setCurrentSrcIndex(prev => prev + 1)
                target.src = nextSrc
              } else {
                // All fallbacks exhausted
                setHasError(true)
                console.warn(`Failed to load image: ${src}. All fallback paths exhausted.`)
              }
            }, [currentSrcIndex, fallbackPaths, src])
            
            // Reset state when src changes
            React.useEffect(() => {
              setCurrentSrcIndex(0)
              setCurrentSrc(imageSrc)
              setHasError(false)
            }, [imageSrc])
            
            // If all fallbacks failed, show alt text or hide
            if (hasError) {
              return alt ? (
                <div 
                  className="md-img-error"
                  style={{
                    display: 'block',
                    margin: '12px auto',
                    padding: '8px',
                    border: '1px dashed #ccc',
                    textAlign: 'center',
                    color: '#666',
                    fontStyle: 'italic'
                  }}
                >
                  {alt}
                </div>
              ) : null
            }
            
            return (
              <img 
                src={currentSrc} 
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
                onError={handleImageError}
                onLoad={() => {
                  // Reset error state on successful load
                  setHasError(false)
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