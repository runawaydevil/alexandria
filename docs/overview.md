# System Overview

## What is Alexandria

Alexandria is a static web application designed to provide an infinite reading experience through GitHub's public markdown content. It allows users to navigate seamlessly between documents, discover random content, and explore the vast landscape of open source documentation without requiring authentication or server-side infrastructure.

## Purpose and Objectives

### Primary Purpose

The system serves as a universal library interface for GitHub markdown content, transforming the traditional repository browsing experience into a focused reading and discovery platform.

### Core Objectives

1. **Content Discovery**: Enable users to discover interesting documentation and markdown content across millions of repositories
2. **Seamless Navigation**: Provide intuitive navigation between related documents and repositories
3. **Zero Infrastructure**: Operate entirely as a client-side application with no backend requirements
4. **Privacy First**: No user tracking, no analytics, no data collection
5. **Performance**: Optimize for fast loading and efficient API usage through intelligent caching

## Key Characteristics

### Static Application

Alexandria is built as a single-page application (SPA) that runs entirely in the browser. All content is fetched on-demand from GitHub's public API and rendered client-side.

### No Authentication Required

The system only accesses public repositories and public API endpoints. No GitHub authentication is required, making it accessible to anyone without account setup.

### Offline Capable

Through IndexedDB and localStorage caching, the application can serve previously viewed content even when offline or when rate limits are encountered.

### Rate Limit Aware

The system intelligently handles GitHub API rate limits by:
- Monitoring rate limit state
- Serving cached content when rate limited
- Providing clear user feedback about rate limit status
- Automatically navigating to cached content when possible

## Main Features

### Random Content Discovery

Users can discover random repositories and markdown files through intelligent search algorithms that filter for active, documented repositories.

### Intelligent Link Following

Markdown links within documents are automatically converted to internal navigation links, enabling seamless traversal between related documents.

### Reading History

The system maintains a local reading history, allowing users to quickly return to previously viewed documents.

### Table of Contents

Both document-level and repository-level table of contents are generated automatically, providing navigation aids for long documents and multi-file repositories.

### Repository Navigation

Users can navigate to any public repository by entering `owner/repo` format or a GitHub URL, with automatic validation and sanitization.

## Use Cases

### Documentation Exploration

Developers exploring documentation across multiple projects can use Alexandria to read and navigate between related documentation files without context switching.

### Content Discovery

Users interested in discovering interesting technical content can use the random discovery feature to explore diverse repositories and documentation.

### Offline Reading

Previously viewed content is cached locally, allowing users to read cached documentation even when offline or when API access is limited.

### Research and Learning

The system facilitates research by enabling quick navigation between related documents and repositories, making it easier to follow documentation trails and understand interconnected projects.

## Technical Foundation

### Technology Stack

- **React 19.2.3**: Modern UI framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **react-markdown**: Markdown rendering with security
- **IndexedDB**: Persistent local storage

### Architecture Principles

1. **Separation of Concerns**: Clear separation between UI components, business logic (services), and data access
2. **Type Safety**: Comprehensive TypeScript types for all data structures
3. **Error Handling**: Robust error handling with user-friendly messages
4. **Security First**: Input validation, HTML sanitization, and path traversal prevention
5. **Performance**: Caching strategies and efficient API usage

## System Boundaries

### What Alexandria Does

- Fetches and renders public GitHub markdown content
- Provides navigation between markdown files
- Caches content locally for offline access
- Handles rate limits gracefully
- Validates and sanitizes all user input

### What Alexandria Does Not Do

- Does not store content on external servers
- Does not track user behavior
- Does not require user authentication
- Does not modify GitHub repositories
- Does not access private repositories
- Does not provide editing capabilities

## Design Philosophy

Alexandria is designed around the concept of an "incomplete, infinite, and alive" library. The content is always changing as repositories are updated, and the system provides tools to explore this ever-evolving landscape of documentation.

The system prioritizes:
- **Simplicity**: Clean, focused interface without unnecessary features
- **Reliability**: Graceful degradation and error handling
- **Privacy**: No tracking, no data collection
- **Performance**: Fast loading and efficient resource usage
- **Accessibility**: Works for all users regardless of technical expertise

