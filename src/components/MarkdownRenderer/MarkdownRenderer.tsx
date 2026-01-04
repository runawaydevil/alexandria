import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import { LinkRewriter } from '../../services/LinkRewriter'
import { DocumentContext } from '../../types'
import { debugImageElement, monitorImageElement, debugLog, isDebugMode } from '../../utils/cssDebugger'
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

  // Helper function to convert image paths - SIMPLIFIED AND FIXED
  const convertImagePath = (src: string): string => {
    debugLog('convertImagePath - Input src:', src)
    
    if (!src || src.startsWith('http') || src.startsWith('data:')) {
      debugLog('convertImagePath - Already absolute, returning:', src)
      return src
    }

    // FORCE PRODUCTION PATH FOR ALEXANDRIA LOGO
    if (src.includes('alexandria.png')) {
      const hostname = window.location.hostname
      debugLog('convertImagePath - Alexandria logo detected, hostname:', hostname)
      
      // Always use production path for GitHub Pages
      if (hostname.includes('github.io')) {
        const forcedPath = '/alexandria/alexandria.png'
        debugLog('convertImagePath - FORCING PRODUCTION PATH:', forcedPath)
        return forcedPath
      }
      
      // Development environment
      debugLog('convertImagePath - DEVELOPMENT: Converting to /alexandria.png')
      return '/alexandria.png'
    }

    // Handle ./public/ paths - SIMPLIFIED
    if (src.startsWith('./public/')) {
      const filename = src.replace('./public/', '')
      const hostname = window.location.hostname
      
      debugLog('convertImagePath - Public file detected:', filename)
      
      if (hostname.includes('github.io')) {
        const forcedPath = `/alexandria/${filename}`
        debugLog('convertImagePath - FORCING PRODUCTION PUBLIC PATH:', forcedPath)
        return forcedPath
      } else {
        debugLog('convertImagePath - DEVELOPMENT: Converting public file to /' + filename)
        return `/${filename}`
      }
    }

    debugLog('convertImagePath - No special handling, returning:', src)
    return src
  }

  // Helper function to get fallback paths for images - SIMPLIFIED
  const getImageFallbackPaths = (originalSrc: string): string[] => {
    const fallbacks: string[] = []
    
    // Special handling for Alexandria logo - FORCE CORRECT PATHS
    if (originalSrc.includes('alexandria.png') || originalSrc.startsWith('./public/')) {
      const hostname = window.location.hostname
      
      if (hostname.includes('github.io')) {
        // Production: try the exact paths we know work
        fallbacks.push('/alexandria/alexandria.png')
        fallbacks.push('/alexandria/public/alexandria.png')
        // GitHub raw URL as backup
        fallbacks.push('https://raw.githubusercontent.com/runawaydevil/alexandria/main/public/alexandria.png')
      } else {
        // Development: try dev paths
        fallbacks.push('/alexandria.png')
        fallbacks.push('/public/alexandria.png')
      }
      
      return fallbacks
    }

    // For other repository images, keep existing logic
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

  // Interface for div component with align attribute
  interface DivProps extends React.HTMLAttributes<HTMLDivElement> {
    align?: string
  }

  // Image component with fallback support and CSS debugging
  const ImageWithFallback: React.FC<{ src: string; alt?: string; isAlexandriaLogo: boolean }> = ({ 
    src: originalSrc, 
    alt,
    isAlexandriaLogo 
  }) => {
    debugLog('ImageWithFallback - Original src:', originalSrc)
    const imageSrc = convertImagePath(originalSrc)
    const fallbackPaths = getImageFallbackPaths(originalSrc)
    
    // Create complete list of paths to try (main + fallbacks)
    const allPaths = [imageSrc, ...fallbackPaths]
    debugLog('ImageWithFallback - All paths to try:', allPaths)
    
    const [currentPathIndex, setCurrentPathIndex] = React.useState(0)
    const [hasError, setHasError] = React.useState(false)
    const imageRef = React.useRef<HTMLImageElement>(null)
    
    // Get current src to display
    const currentSrc = allPaths[currentPathIndex] || imageSrc
    
    // Handle image load errors with fallback strategy
    const handleImageError = React.useCallback(() => {
      debugLog('ImageWithFallback - Image error for:', currentSrc)
      debugLog('ImageWithFallback - Current path index:', `${currentPathIndex} of ${allPaths.length}`)
      
      // Debug the failed image element
      if (imageRef.current && isDebugMode()) {
        debugImageElement(imageRef.current, `Failed: ${alt || 'Unknown'} - ${currentSrc}`)
      }
      
      // Try next path
      if (currentPathIndex + 1 < allPaths.length) {
        const nextIndex = currentPathIndex + 1
        debugLog('ImageWithFallback - Trying next path:', allPaths[nextIndex])
        setCurrentPathIndex(nextIndex)
      } else {
        // All paths exhausted
        setHasError(true)
        console.error('💀 ImageWithFallback - ALL PATHS FAILED for:', originalSrc)
      }
    }, [currentPathIndex, allPaths, currentSrc, originalSrc, alt])
    
    // Handle successful image load
    const handleImageLoad = React.useCallback(() => {
      debugLog('ImageWithFallback - Image loaded successfully:', currentSrc)
      console.log('🎯 ALEXANDRIA LOGO LOADED:', currentSrc) // Force log even without debug mode
      setHasError(false)
      
      // Perform CSS debugging on successful load
      if (imageRef.current) {
        const context = `${isAlexandriaLogo ? 'Alexandria Logo' : 'Image'}: ${alt || 'Unknown'}`
        
        // ALWAYS log for Alexandria logo
        if (isAlexandriaLogo) {
          console.log('🎯 ALEXANDRIA LOGO ELEMENT:', imageRef.current)
          console.log('🎯 ALEXANDRIA LOGO COMPUTED STYLES:', window.getComputedStyle(imageRef.current))
        }
        
        // Immediate debug
        if (isDebugMode()) {
          debugImageElement(imageRef.current, context)
        }
        
        // Delayed debug to catch any CSS changes
        setTimeout(() => {
          if (imageRef.current && isDebugMode()) {
            debugImageElement(imageRef.current, `${context} (Delayed Check)`)
          }
        }, 500)
      }
    }, [currentSrc, alt, isAlexandriaLogo])
    
    // Reset state when original src changes
    React.useEffect(() => {
      setCurrentPathIndex(0)
      setHasError(false)
    }, [originalSrc])
    
    // Set up monitoring when ref is available
    React.useEffect(() => {
      if (imageRef.current && isDebugMode()) {
        const context = `${isAlexandriaLogo ? 'Alexandria Logo' : 'Image'}: ${alt || 'Unknown'}`
        monitorImageElement(imageRef.current, context)
      }
    }, [alt, isAlexandriaLogo])
    
    // If all paths failed, show error state
    if (hasError) {
      debugLog('ImageWithFallback - Showing error state for:', originalSrc)
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
          {alt} (Image failed to load)
        </div>
      ) : null
    }
    
    debugLog('ImageWithFallback - Rendering img with src:', currentSrc)
    
    return (
      <img 
        ref={imageRef}
        src={currentSrc} 
        alt={alt} 
        className="md-img md-img-force-visible"
        loading="lazy"
        style={isAlexandriaLogo ? { 
          maxWidth: '200px', 
          height: 'auto',
          border: '1px solid #ccc',
          display: 'block',
          margin: '12px auto',
          visibility: 'visible',
          opacity: 1,
          position: 'static'
        } : { 
          display: 'block',
          margin: '12px auto',
          visibility: 'visible',
          opacity: 1,
          position: 'static'
        }}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    )
  }

  return (
    <div className={`markdown-renderer ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypeSanitize, {
            // Allow HTML tags needed for README
            tagNames: [
              // Default markdown tags
              'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
              'p', 'br', 'strong', 'em', 'del', 'ins',
              'ul', 'ol', 'li',
              'blockquote', 'pre', 'code',
              'table', 'thead', 'tbody', 'tr', 'th', 'td',
              'a', 'img',
              'hr',
              // Additional HTML tags for README
              'div', 'span', 'center'
            ],
            attributes: {
              // Allow all standard attributes
              '*': ['className', 'id', 'style'],
              'a': ['href', 'target', 'rel'],
              'img': ['src', 'alt', 'width', 'height', 'title'],
              'div': ['align'],
              'h1': ['id'],
              'h2': ['id'],
              'h3': ['id'],
              'h4': ['id'],
              'h5': ['id'],
              'h6': ['id']
            }
          }],
          rehypeHighlight // Syntax highlighting
        ]}
        components={{
          // Custom components for Y2K styling
          div: ({ children, align, ...props }: DivProps) => (
            <div 
              {...props}
              style={align === 'center' ? { textAlign: 'center' } : undefined}
              className="md-div"
            >
              {children}
            </div>
          ),
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
            debugLog('MarkdownRenderer - Processing image:', { src, alt })
            debugLog('MarkdownRenderer - Current location:', window.location.href)
            
            // Check if it's Alexandria logo for special styling
            const isAlexandriaLogo = alt?.toLowerCase().includes('logo') || 
                                   src?.includes('alexandria.png') ||
                                   alt?.toLowerCase().includes('alexandria')
            
            debugLog('MarkdownRenderer - Is Alexandria logo:', isAlexandriaLogo)
            debugLog(`MarkdownRenderer - Will convert src from: ${src} to: ${convertImagePath(src || '')}`)
            
            return <ImageWithFallback src={src || ''} alt={alt} isAlexandriaLogo={!!isAlexandriaLogo} />
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