import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// #region agent log
const logDebug = (location: string, message: string, data: any) => {
  fetch('http://127.0.0.1:7244/ingest/ffe240a7-73ad-4ea1-b95d-1a483e823c50', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location,
      message,
      data,
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A'
    })
  }).catch(() => {});
};

// Determine basename dynamically based on current pathname
const getBasename = (): string => {
  const pathname = window.location.pathname;
  const hostname = window.location.hostname;
  
  // If pathname starts with /Alexandria, use it as basename (GitHub Pages)
  if (pathname.startsWith('/Alexandria')) {
    return '/Alexandria';
  }
  
  // If we're on GitHub Pages (github.io) and pathname is root, check if we have a redirect from 404.html
  // The 404.html redirects to /?/path, so we need to check the search params
  if (hostname.includes('github.io') && pathname === '/') {
    const searchParams = new URLSearchParams(window.location.search);
    const redirectPath = searchParams.get('/');
    if (redirectPath) {
      // We're being redirected from 404.html, use /Alexandria as basename
      return '/Alexandria';
    }
  }
  
  // For local development or root deployment, use empty basename
  return '';
};

const basename = getBasename();

logDebug('main.tsx:init', 'Application initialization', {
  currentUrl: window.location.href,
  pathname: window.location.pathname,
  basename: basename,
  baseHref: document.querySelector('base')?.href || 'none',
  assetsLoading: document.querySelectorAll('script[type="module"]').length
});

// Check for asset loading errors
window.addEventListener('error', (event) => {
  logDebug('main.tsx:error', 'Asset loading error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error?.toString()
  });
}, true);

// Check for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  logDebug('main.tsx:unhandledRejection', 'Unhandled promise rejection', {
    reason: event.reason?.toString(),
    promise: event.promise?.toString()
  });
});
// #endregion

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)