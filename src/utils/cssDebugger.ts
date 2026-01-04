/**
 * CSS Debugging Utilities for Image Visibility Issues
 * 
 * This module provides utilities to detect and diagnose CSS visibility issues
 * that prevent images from being displayed even when they load successfully.
 */

export interface VisibilityReport {
  display: string
  visibility: string
  opacity: string
  width: number
  height: number
  isInViewport: boolean
  hasVisibleStyles: boolean
  computedStyles: CSSStyleDeclaration
  boundingRect: DOMRect
  issues: string[]
}

export interface DimensionReport {
  naturalWidth: number
  naturalHeight: number
  displayWidth: number
  displayHeight: number
  hasContent: boolean
}

export interface PositionReport {
  isInViewport: boolean
  isVisible: boolean
  top: number
  left: number
  bottom: number
  right: number
}

/**
 * Comprehensive CSS visibility checker for image elements
 */
export const checkImageVisibility = (element: HTMLImageElement): VisibilityReport => {
  const computedStyles = window.getComputedStyle(element)
  const boundingRect = element.getBoundingClientRect()
  const issues: string[] = []

  // Check basic CSS visibility properties
  const display = computedStyles.display
  const visibility = computedStyles.visibility
  const opacity = computedStyles.opacity

  // Check dimensions
  const width = boundingRect.width
  const height = boundingRect.height

  // Check viewport position
  const isInViewport = (
    boundingRect.top >= 0 &&
    boundingRect.left >= 0 &&
    boundingRect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    boundingRect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )

  // Determine if styles allow visibility
  let hasVisibleStyles = true

  if (display === 'none') {
    hasVisibleStyles = false
    issues.push('Element has display: none')
  }

  if (visibility === 'hidden') {
    hasVisibleStyles = false
    issues.push('Element has visibility: hidden')
  }

  if (parseFloat(opacity) === 0) {
    hasVisibleStyles = false
    issues.push('Element has opacity: 0')
  }

  if (width === 0 || height === 0) {
    hasVisibleStyles = false
    issues.push(`Element has zero dimensions: ${width}x${height}`)
  }

  // Check for common hiding techniques
  const position = computedStyles.position
  const left = computedStyles.left
  const top = computedStyles.top
  const transform = computedStyles.transform

  if (position === 'absolute' || position === 'fixed') {
    if (left === '-9999px' || left === '-10000px' || top === '-9999px' || top === '-10000px') {
      hasVisibleStyles = false
      issues.push('Element positioned off-screen')
    }
  }

  if (transform && transform.includes('translateX(-9999') || transform.includes('translateY(-9999')) {
    hasVisibleStyles = false
    issues.push('Element transformed off-screen')
  }

  // Check for overflow hidden on parents
  let parent = element.parentElement
  while (parent && parent !== document.body) {
    const parentStyles = window.getComputedStyle(parent)
    if (parentStyles.overflow === 'hidden' && (
      parent.scrollWidth > parent.clientWidth ||
      parent.scrollHeight > parent.clientHeight
    )) {
      const parentRect = parent.getBoundingClientRect()
      if (
        boundingRect.left < parentRect.left ||
        boundingRect.right > parentRect.right ||
        boundingRect.top < parentRect.top ||
        boundingRect.bottom > parentRect.bottom
      ) {
        issues.push('Element clipped by parent overflow: hidden')
        break
      }
    }
    parent = parent.parentElement
  }

  return {
    display,
    visibility,
    opacity,
    width,
    height,
    isInViewport,
    hasVisibleStyles,
    computedStyles,
    boundingRect,
    issues
  }
}

/**
 * Check image dimensions and content
 */
export const checkImageDimensions = (element: HTMLImageElement): DimensionReport => {
  return {
    naturalWidth: element.naturalWidth,
    naturalHeight: element.naturalHeight,
    displayWidth: element.offsetWidth,
    displayHeight: element.offsetHeight,
    hasContent: element.naturalWidth > 0 && element.naturalHeight > 0
  }
}

/**
 * Check image position relative to viewport
 */
export const checkImagePosition = (element: HTMLImageElement): PositionReport => {
  const rect = element.getBoundingClientRect()
  const isInViewport = (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )

  const isVisible = (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
    rect.bottom > 0 &&
    rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
    rect.right > 0
  )

  return {
    isInViewport,
    isVisible,
    top: rect.top,
    left: rect.left,
    bottom: rect.bottom,
    right: rect.right
  }
}

/**
 * Comprehensive image debugging function
 */
export const debugImageElement = (element: HTMLImageElement, context: string = 'Unknown'): void => {
  console.group(`🔍 Image Debug Report - ${context}`)
  
  // Basic element info
  console.log('📍 Element Info:', {
    src: element.src,
    alt: element.alt,
    className: element.className,
    id: element.id
  })

  // Visibility check
  const visibilityReport = checkImageVisibility(element)
  console.log('👁️ Visibility Report:', visibilityReport)

  // Dimension check
  const dimensionReport = checkImageDimensions(element)
  console.log('📏 Dimension Report:', dimensionReport)

  // Position check
  const positionReport = checkImagePosition(element)
  console.log('📍 Position Report:', positionReport)

  // Issues summary
  if (visibilityReport.issues.length > 0) {
    console.warn('⚠️ Visibility Issues Found:', visibilityReport.issues)
  } else {
    console.log('✅ No visibility issues detected')
  }

  // Overall assessment
  const isFullyVisible = (
    visibilityReport.hasVisibleStyles &&
    dimensionReport.hasContent &&
    positionReport.isVisible
  )

  console.log(`🎯 Overall Assessment: ${isFullyVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`)
  
  console.groupEnd()
}

/**
 * Debug mode flag - can be set via environment or runtime
 */
export const isDebugMode = (): boolean => {
  return (
    process.env.NODE_ENV === 'development' ||
    localStorage.getItem('alexandria-debug') === 'true' ||
    window.location.search.includes('debug=true')
  )
}

/**
 * Conditional debug logging
 */
export const debugLog = (message: string, data?: any): void => {
  if (isDebugMode()) {
    if (data) {
      console.log(`🔧 Alexandria Debug: ${message}`, data)
    } else {
      console.log(`🔧 Alexandria Debug: ${message}`)
    }
  }
}

/**
 * Monitor image loading and visibility
 */
export const monitorImageElement = (element: HTMLImageElement, context: string): void => {
  if (!isDebugMode()) return

  debugLog(`Starting monitoring for image: ${context}`)

  // Monitor load event
  element.addEventListener('load', () => {
    debugLog(`Image loaded: ${context}`)
    setTimeout(() => {
      debugImageElement(element, context)
    }, 100) // Small delay to ensure DOM is updated
  })

  // Monitor error event
  element.addEventListener('error', () => {
    debugLog(`Image error: ${context}`)
    debugImageElement(element, context)
  })

  // Initial check if already loaded
  if (element.complete && element.naturalWidth > 0) {
    debugLog(`Image already loaded: ${context}`)
    setTimeout(() => {
      debugImageElement(element, context)
    }, 100)
  }
}