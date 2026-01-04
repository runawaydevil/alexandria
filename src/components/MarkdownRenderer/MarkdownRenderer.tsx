import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
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

  return (
    <div className={`markdown-renderer ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw, // Process raw HTML
          [rehypeSanitize, {
            // Allow HTML tags needed for README
            // SECURITY: Only safe tags allowed, no script, iframe, object, embed, etc.
            tagNames: [
              // Default markdown tags
              'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
              'p', 'br', 'strong', 'em', 'del', 'ins',
              'ul', 'ol', 'li',
              'blockquote', 'pre', 'code',
              'table', 'thead', 'tbody', 'tr', 'th', 'td',
              'a', 'img',
              'hr',
              // Additional HTML tags for README (limited set)
              'div', 'span'
            ],
            attributes: {
              // SECURITY: Restrictive attribute whitelist
              '*': ['className', 'id'],
              // Note: 'style' removed from whitelist for security (prevents XSS via inline styles)
              'a': ['href', 'target', 'rel', 'title'],
              'img': ['src', 'alt', 'width', 'height', 'title'],
              'div': ['align'],
              'h1': ['id'],
              'h2': ['id'],
              'h3': ['id'],
              'h4': ['id'],
              'h5': ['id'],
              'h6': ['id']
            },
            // SECURITY: Protocol whitelist for links and images
            protocols: {
              'a': {
                href: ['http', 'https', 'mailto']
              },
              'img': {
                src: ['http', 'https', 'data'] // data: URLs allowed for base64 images
              }
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
            // SECURITY: Ensure external links always have security attributes
            const finalProps = {
              ...linkProps,
              className: "md-link",
              // Add rel="noopener noreferrer" for external links if not already present
              rel: linkProps.href?.startsWith('http') && !linkProps.rel 
                ? 'noopener noreferrer' 
                : linkProps.rel
            }
            return (
              <a {...finalProps}>
                {children}
              </a>
            )
          },
          img: ({ src, alt, width, height }) => {
            // Convert relative path from README.md to correct path
            let finalSrc = src || ''
            
            // Handle ./public/alexandria.png from README.md
            if (finalSrc === './public/alexandria.png') {
              // In production (GitHub Pages)
              if (window.location.hostname.includes('github.io')) {
                finalSrc = '/alexandria/alexandria.png'
              } else {
                // Development
                finalSrc = '/alexandria.png'
              }
            }
            
            // Check if it's Alexandria logo for special container
            const isAlexandriaLogo = alt?.toLowerCase().includes('logo') || 
                                   finalSrc.includes('alexandria.png')
            
            if (isAlexandriaLogo) {
              return (
                <div className="alexandria-logo-container">
                  <img 
                    src={finalSrc}
                    alt={alt || 'Alexandria Logo'}
                    width={width}
                    height={height}
                    className="alexandria-logo"
                  />
                </div>
              )
            }
            
            return (
              <img 
                src={finalSrc}
                alt={alt || 'Image'}
                width={width}
                height={height}
                className="md-img"
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