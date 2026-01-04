import React from 'react'
import { TocItem } from '../../services/TocGenerator'
import './DocumentToc.css'

interface DocumentTocProps {
  items: TocItem[]
  className?: string
}

const DocumentToc: React.FC<DocumentTocProps> = ({ items, className }) => {
  const handleTocClick = (anchor: string) => {
    const element = document.getElementById(anchor)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (items.length === 0) {
    return null
  }

  return (
    <nav className={`document-toc ${className || ''}`} aria-label="Document table of contents">
      <h3 className="toc-title">📄 Contents</h3>
      <ul className="toc-list">
        {items.map((item) => (
          <li key={item.id} className={`toc-item toc-level-${item.level}`}>
            <button
              className="toc-link"
              onClick={() => handleTocClick(item.anchor)}
              title={item.text}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default DocumentToc