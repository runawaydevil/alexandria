import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import { LinkRewriter } from '../../services/LinkRewriter'
import { DocumentContext } from '../../types'
import { debugLog } from '../../utils/cssDebugger'
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

    // EMERGENCY FIX: Force absolute path for Alexandria logo
    if (src.includes('alexandria.png')) {
      const hostname = window.location.hostname
      debugLog('convertImagePath - Alexandria logo detected, hostname:', hostname)
      
      // ALWAYS use the absolute path that we know works
      if (hostname.includes('github.io')) {
        const absolutePath = 'https://runawaydevil.github.io/alexandria/alexandria.png'
        debugLog('convertImagePath - EMERGENCY: Using absolute URL:', absolutePath)
        return absolutePath
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

  // EMERGENCY SIMPLE IMAGE COMPONENT
  const ImageWithFallback: React.FC<{ src: string; alt?: string; isAlexandriaLogo: boolean }> = ({ 
    src: originalSrc, 
    alt,
    isAlexandriaLogo 
  }) => {
    console.log('🚨 EMERGENCY IMAGE COMPONENT:', { originalSrc, alt, isAlexandriaLogo })
    
    // FORCE ABSOLUTE URL FOR ALEXANDRIA
    let finalSrc = originalSrc
    if (originalSrc.includes('alexandria.png')) {
      finalSrc = 'https://runawaydevil.github.io/alexandria/alexandria.png'
      console.log('🚨 FORCED ABSOLUTE URL:', finalSrc)
    }
    
    return (
      <div style={{
        border: '2px solid green',
        padding: '10px',
        margin: '10px',
        backgroundColor: 'lightgreen'
      }}>
        <p style={{ color: 'black', fontSize: '12px' }}>
          EMERGENCY IMAGE CONTAINER - SRC: {finalSrc}
        </p>
        <img 
          src={finalSrc}
          alt={alt || 'Emergency Image'}
          style={{
            display: 'block',
            margin: '0 auto',
            maxWidth: '200px',
            border: '2px solid red',
            backgroundColor: 'white'
          }}
          onLoad={() => console.log('🚨 EMERGENCY FALLBACK IMAGE LOADED:', finalSrc)}
          onError={() => console.log('🚨 EMERGENCY FALLBACK IMAGE ERROR:', finalSrc)}
        />
      </div>
    )
  }

  return (
    <div className={`markdown-renderer ${className}`}>
      {/* EMERGENCY TEST: Direct image rendering for Alexandria logo */}
      {content.includes('alexandria.png') && (
        <div style={{
          textAlign: 'center',
          margin: '20px 0',
          padding: '20px',
          border: '2px solid red',
          backgroundColor: 'yellow'
        }}>
          <h3 style={{ color: 'red' }}>EMERGENCY TEST - DIRECT IMAGE</h3>
          <img 
            src="https://runawaydevil.github.io/alexandria/alexandria.png"
            alt="Direct Alexandria Logo Test"
            style={{
              display: 'block',
              margin: '0 auto',
              maxWidth: '200px',
              border: '3px solid blue',
              backgroundColor: 'white'
            }}
            onLoad={() => console.log('🚨 DIRECT IMAGE LOADED!')}
            onError={() => console.log('🚨 DIRECT IMAGE ERROR!')}
          />
        </div>
      )}
      
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
              style={align === 'center' ? { 
                textAlign: 'center',
                display: 'block',
                width: '100%',
                margin: '0 auto'
              } : undefined}
              className={`md-div ${align === 'center' ? 'md-div-center' : ''}`}
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
            
            // FORCE LOG FOR ALEXANDRIA LOGO
            if (src?.includes('alexandria.png')) {
              console.log('🎯 PROCESSING ALEXANDRIA LOGO:', { src, alt })
              console.log('🎯 CURRENT LOCATION:', window.location.href)
            }
            
            // Check if it's Alexandria logo for special styling
            const isAlexandriaLogo = alt?.toLowerCase().includes('logo') || 
                                   src?.includes('alexandria.png') ||
                                   alt?.toLowerCase().includes('alexandria')
            
            debugLog('MarkdownRenderer - Is Alexandria logo:', isAlexandriaLogo)
            debugLog(`MarkdownRenderer - Will convert src from: ${src} to: ${convertImagePath(src || '')}`)
            
            // FORCE LOG CONVERTED PATH FOR ALEXANDRIA
            if (isAlexandriaLogo) {
              const convertedPath = convertImagePath(src || '')
              console.log('🎯 ALEXANDRIA LOGO CONVERTED PATH:', convertedPath)
            }
            
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