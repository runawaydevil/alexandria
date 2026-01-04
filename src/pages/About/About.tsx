import React from 'react'
import './About.css'

const About: React.FC = () => {
  return (
    <div className="about">
      <div className="about-content">
        <h1>About Alexandria</h1>
        
        <section className="about-section">
          <h2>What is Alexandria?</h2>
          <p>
            Alexandria is a static web application that allows you to discover and read 
            Markdown files from public GitHub repositories without authentication. 
            It provides an infinite reading experience with intelligent navigation 
            between related documents.
          </p>
        </section>
        
        <section className="about-section">
          <h2>Features</h2>
          <ul>
            <li>🎲 Random content discovery from GitHub repositories</li>
            <li>🔗 Intelligent link rewriting for seamless navigation</li>
            <li>📱 Responsive design for all devices</li>
            <li>🌙 Dark and light theme support</li>
            <li>♿ Full accessibility support</li>
            <li>📤 Easy content sharing</li>
            <li>💾 Local caching for better performance</li>
          </ul>
        </section>
        
        <section className="about-section">
          <h2>Technology</h2>
          <p>
            Built with React, TypeScript, and Vite. Deployed as a static site 
            on GitHub Pages with no backend dependencies. All data comes directly 
            from GitHub's public API.
          </p>
        </section>
        
        <section className="about-section">
          <h2>Privacy</h2>
          <p>
            Alexandria respects your privacy. No user data is collected or sent 
            to external services beyond the necessary GitHub API calls. All caching 
            and preferences are stored locally in your browser.
          </p>
        </section>
      </div>
    </div>
  )
}

export default About