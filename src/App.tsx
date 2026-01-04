import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './pages/Home/Home'
import Reader from './pages/Reader/Reader'
import About from './pages/About/About'
import './App.css'

function App() {
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

export default App