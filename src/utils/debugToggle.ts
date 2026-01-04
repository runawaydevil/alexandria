/**
 * Debug Toggle Utility for Alexandria
 * 
 * Provides easy ways for users to enable/disable debug mode
 */

/**
 * Enable debug mode
 */
export const enableDebugMode = (): void => {
  localStorage.setItem('alexandria-debug', 'true')
  console.log('🔧 Alexandria Debug Mode ENABLED')
  console.log('🔧 Refresh the page to see detailed image debugging information')
}

/**
 * Disable debug mode
 */
export const disableDebugMode = (): void => {
  localStorage.removeItem('alexandria-debug')
  console.log('🔧 Alexandria Debug Mode DISABLED')
}

/**
 * Toggle debug mode
 */
export const toggleDebugMode = (): boolean => {
  const isCurrentlyEnabled = localStorage.getItem('alexandria-debug') === 'true'
  
  if (isCurrentlyEnabled) {
    disableDebugMode()
    return false
  } else {
    enableDebugMode()
    return true
  }
}

/**
 * Check if debug mode is enabled
 */
export const isDebugModeEnabled = (): boolean => {
  return (
    process.env.NODE_ENV === 'development' ||
    localStorage.getItem('alexandria-debug') === 'true' ||
    window.location.search.includes('debug=true')
  )
}

/**
 * Add debug functions to window for easy console access
 */
if (typeof window !== 'undefined') {
  // Make debug functions globally available
  (window as any).alexandriaDebug = {
    enable: enableDebugMode,
    disable: disableDebugMode,
    toggle: toggleDebugMode,
    isEnabled: isDebugModeEnabled
  }
  
  // Log instructions for users
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Alexandria Debug Functions Available:')
    console.log('🔧 alexandriaDebug.enable() - Enable debug mode')
    console.log('🔧 alexandriaDebug.disable() - Disable debug mode')
    console.log('🔧 alexandriaDebug.toggle() - Toggle debug mode')
    console.log('🔧 alexandriaDebug.isEnabled() - Check if debug mode is enabled')
  }
}