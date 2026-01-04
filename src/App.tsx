import React from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './pages/Home/Home'
import Reader from './pages/Reader/Reader'
import About from './pages/About/About'
import './App.css'

function AppWithLocation() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Handle 404.html redirect from GitHub Pages
  React.useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const redirectPath = searchParams.get('/');
    if (redirectPath) {
      // We're being redirected from 404.html
      // Convert the redirect path to a proper route
      const cleanPath = redirectPath.replace(/~and~/g, '&').replace(/\?/g, '?');
      const newPath = cleanPath.split('?')[0]; // Remove query string for now
      const newSearch = cleanPath.includes('?') ? '?' + cleanPath.split('?')[1] : '';
      
      // Navigate to the correct path
      navigate(newPath + newSearch + location.hash, { replace: true });
    }
  }, [location.search, navigate, location.hash]);
  
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/r/:owner/:repo" element={<Reader />} />
        <Route path="/r/:owner/:repo/blob/:ref/*" element={<Reader />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return <AppWithLocation />
}

export default App