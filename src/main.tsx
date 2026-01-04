import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// Determine basename dynamically based on current pathname
const getBasename = (): string => {
  const pathname = window.location.pathname;
  const hostname = window.location.hostname;
  
  // If pathname starts with /alexandria, use it as basename (GitHub Pages - matches repo name)
  if (pathname.startsWith('/alexandria')) {
    return '/alexandria';
  }
  
  // If we're on GitHub Pages (github.io) and pathname is root, check if we have a redirect from 404.html
  // The 404.html redirects to /?/path, so we need to check the search params
  if (hostname.includes('github.io') && pathname === '/') {
    const searchParams = new URLSearchParams(window.location.search);
    const redirectPath = searchParams.get('/');
    if (redirectPath) {
      // We're being redirected from 404.html, use /alexandria as basename
      return '/alexandria';
    }
  }
  
  // For local development or root deployment, use empty basename
  return '';
};

const basename = getBasename();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)