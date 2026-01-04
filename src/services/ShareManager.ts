export interface ShareData {
  title: string
  text: string
  url: string
}

export interface ShareOptions {
  title?: string
  text?: string
  subject?: string
}

export class ShareManager {
  /**
   * Share content using Web Share API or fallback to clipboard
   */
  async shareContent(data: ShareData): Promise<boolean> {
    // Check if Web Share API is available
    if (navigator.share && this.canUseWebShare(data)) {
      try {
        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url
        })
        return true
      } catch (error) {
        // User cancelled or error occurred, fallback to clipboard
        console.warn('Web Share API failed, falling back to clipboard:', error)
        return this.copyToClipboard(data.url)
      }
    }

    // Fallback to clipboard copy
    return this.copyToClipboard(data.url)
  }

  /**
   * Copy URL to clipboard as fallback
   */
  async copyToClipboard(url: string): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url)
        return true
      } else {
        // Fallback for older browsers
        return this.fallbackCopyToClipboard(url)
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return this.fallbackCopyToClipboard(url)
    }
  }

  /**
   * Generate mailto link for email sharing
   */
  generateMailtoLink(data: ShareData, options: ShareOptions = {}): string {
    const subject = encodeURIComponent(options.subject || `Check out: ${data.title}`)
    const body = encodeURIComponent(
      `${options.text || data.text}\n\n${data.url}\n\nShared via Alexandria - GitHub Markdown Reader`
    )
    
    return `mailto:?subject=${subject}&body=${body}`
  }

  /**
   * Generate permanent shareable URL
   */
  generateShareableUrl(owner: string, repo: string, ref: string, path: string): string {
    const baseUrl = window.location.origin
    return `${baseUrl}/r/${owner}/${repo}/blob/${ref}/${path}`
  }

  /**
   * Open email client with pre-filled content
   */
  shareViaEmail(data: ShareData, options: ShareOptions = {}): void {
    const mailtoUrl = this.generateMailtoLink(data, options)
    window.open(mailtoUrl, '_blank')
  }

  /**
   * Check if Web Share API can be used for this data
   */
  private canUseWebShare(_data: ShareData): boolean {
    // Web Share API requires HTTPS (except localhost)
    const isSecure = window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1'
    
    return isSecure && navigator.share !== undefined
  }

  /**
   * Fallback clipboard copy for older browsers
   */
  private fallbackCopyToClipboard(text: string): boolean {
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      return successful
    } catch (error) {
      console.error('Fallback copy failed:', error)
      return false
    }
  }

  /**
   * Check if sharing is supported
   */
  isSharingSupported(): boolean {
    return !!(navigator.share || navigator.clipboard || document.execCommand)
  }

  /**
   * Trigger print dialog with optimized print styles
   */
  printContent(): void {
    // Add print-specific styles if not already present
    this.addPrintStyles()
    
    // Trigger print dialog
    window.print()
  }

  /**
   * Add print-optimized CSS styles
   */
  private addPrintStyles(): void {
    const printStyleId = 'alexandria-print-styles'
    
    // Check if print styles already exist
    if (document.getElementById(printStyleId)) {
      return
    }

    const printStyles = document.createElement('style')
    printStyles.id = printStyleId
    printStyles.textContent = `
      @media print {
        /* Hide navigation and UI elements */
        .header, .footer, .reader-header, .reader-sidebar, 
        .random-button, .home-button, .back-button,
        .error-message, .toc-loading {
          display: none !important;
        }

        /* Optimize content for print */
        .reader {
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .reader-content {
          border: none !important;
          padding: 0 !important;
          display: block !important;
        }

        .markdown-content {
          font-size: 11pt !important;
          line-height: 1.4 !important;
          color: #000 !important;
          background: #fff !important;
        }

        /* Optimize typography for print */
        .md-h1 { font-size: 18pt !important; margin: 12pt 0 6pt 0 !important; }
        .md-h2 { font-size: 16pt !important; margin: 10pt 0 5pt 0 !important; }
        .md-h3 { font-size: 14pt !important; margin: 8pt 0 4pt 0 !important; }
        .md-h4 { font-size: 12pt !important; margin: 6pt 0 3pt 0 !important; }
        .md-h5 { font-size: 11pt !important; margin: 6pt 0 3pt 0 !important; }
        .md-h6 { font-size: 10pt !important; margin: 6pt 0 3pt 0 !important; }

        .md-p { margin: 6pt 0 !important; }
        .md-ul, .md-ol { margin: 6pt 0 !important; }
        .md-li { margin: 2pt 0 !important; }
        .md-blockquote { 
          margin: 6pt 0 !important; 
          padding: 6pt 12pt !important;
          border-left: 2pt solid #ccc !important;
        }

        /* Code blocks */
        .md-pre {
          background: #f5f5f5 !important;
          border: 1pt solid #ddd !important;
          padding: 6pt !important;
          font-size: 9pt !important;
          overflow: visible !important;
          white-space: pre-wrap !important;
        }

        .md-code-inline {
          background: #f5f5f5 !important;
          padding: 1pt 2pt !important;
          font-size: 9pt !important;
        }

        /* Tables */
        .md-table {
          border-collapse: collapse !important;
          width: 100% !important;
          font-size: 10pt !important;
        }

        .md-th, .md-td {
          border: 1pt solid #ddd !important;
          padding: 4pt 6pt !important;
        }

        .md-th {
          background: #f5f5f5 !important;
          font-weight: bold !important;
        }

        /* Images */
        .md-img {
          max-width: 100% !important;
          height: auto !important;
          page-break-inside: avoid !important;
        }

        /* Links - show URLs */
        .md-link:after {
          content: " (" attr(href) ")";
          font-size: 9pt;
          color: #666;
        }

        /* Page breaks */
        .md-h1, .md-h2 {
          page-break-after: avoid !important;
        }

        .md-pre, .md-table, .md-blockquote {
          page-break-inside: avoid !important;
        }

        /* Remove shadows and borders */
        * {
          box-shadow: none !important;
          text-shadow: none !important;
        }
      }
    `

    document.head.appendChild(printStyles)
  }

  /**
   * Get print capabilities
   */
  getPrintCapabilities(): {
    print: boolean
  } {
    return {
      print: typeof window.print === 'function'
    }
  }
}