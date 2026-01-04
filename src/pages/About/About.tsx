import React from 'react'
import './About.css'

const About: React.FC = () => {
  return (
    <div className="about">
      <div className="about-content">
        <h1>About Alexandria</h1>
        
        <section className="about-section">
          <p>
            Alexandria is an endless library built from the public knowledge of GitHub.
          </p>
          
          <p>
            It is a place to read, explore, and get lost in documentation, READMEs, and Markdown files created by people all over the world. Every page you open comes directly from a public repository and is rendered as a readable document, with its structure, links, and context preserved.
          </p>
          
          <p>
            Alexandria is designed for discovery. You can jump into a random document, follow links across projects, or open any repository by simply typing owner/repository. There is always something to read—when one text ends, another begins.
          </p>
          
          <p>
            The project does not store content, track users, or require authentication. Everything you see is fetched on demand from GitHub's public API and rendered in your browser. What you read today may be different tomorrow, as the library continuously evolves with the work of millions of developers and writers.
          </p>
          
          <p>
            Alexandria is inspired by the idea of a universal library: incomplete, infinite, and alive.
          </p>
        </section>
      </div>
    </div>
  )
}

export default About