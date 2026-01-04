# Alexandria

![Alexandria Logo](/Alexandria/alexandria.png)

**Discover and read GitHub content infinitely**

Alexandria is a static web application that allows you to navigate and read Markdown files from public GitHub repositories without authentication. Experience infinite content discovery with intelligent navigation and a clean, responsive interface.

## ✨ Features

🎲 **Random Discovery**: Find interesting content from millions of public GitHub repositories

🔗 **Intelligent Navigation**: Follow links between documents seamlessly within the Alexandria interface

📱 **Responsive Design**: Read comfortably on any device with optimized typography

⚡ **Fast & Static**: No backend required - runs entirely in your browser

🔒 **Secure**: All content is sanitized and safe to view

🎨 **Clean Interface**: Fixed black and white theme for distraction-free reading

⚙️ **Configurable**: Customize the default repository through environment variables

## 🚀 Usage

### 🎲 Random Content Discovery

Click the **"Discover Random Content"** button to start exploring random repositories and their documentation. Alexandria will find repositories with Markdown content and take you directly to interesting documentation.

### 📂 Direct Repository Navigation

Enter a repository in the format `owner/repo` or paste a GitHub URL to navigate directly to any public repository's documentation.

### 🧭 Navigation Features

- **Random Button**: Discover new content anytime with one click
- **Internal Links**: Navigate between related documents seamlessly  
- **Repository Input**: Jump to specific repositories instantly
- **Permanent URLs**: Share and bookmark any content you find

## ⚙️ Configuration

Alexandria can be configured to display any public GitHub repository as the home page instead of the default `runawaydevil/alexandria`.

### 🏠 Local Development Setup

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your repository configuration:**
   ```bash
   # Your GitHub repository configuration
   VITE_DEFAULT_OWNER=yourusername
   VITE_DEFAULT_REPO=your-docs-repo
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

### 🚀 GitHub Actions Deployment

For automatic deployment with custom configuration:

1. **Fork this repository**

2. **Configure repository secrets** in your GitHub repository settings:
   - Go to `Settings` → `Secrets and variables` → `Actions`
   - Add these repository secrets:
     - `VITE_DEFAULT_OWNER`: Your GitHub username or organization
     - `VITE_DEFAULT_REPO`: Your repository name

3. **Enable GitHub Pages:**
   - Go to `Settings` → `Pages`
   - Set source to "GitHub Actions"

4. **Push to main branch** - deployment will happen automatically

### � Confieguration Examples

**Personal Documentation:**
```bash
VITE_DEFAULT_OWNER=johndoe
VITE_DEFAULT_REPO=my-docs
```

**Organization Knowledge Base:**
```bash
VITE_DEFAULT_OWNER=mycompany
VITE_DEFAULT_REPO=knowledge-base
```

**Project Documentation:**
```bash
VITE_DEFAULT_OWNER=myteam
VITE_DEFAULT_REPO=project-docs
```

### ✅ Configuration Validation

Alexandria validates your configuration during build:

- **GitHub Username Rules**: 1-39 characters, alphanumeric and hyphens only
- **Repository Name Rules**: Alphanumeric, dots, underscores, hyphens only
- **Both Required**: Owner and repository must be set together

Invalid configurations will show warnings but won't break the build - Alexandria will use default values instead.

### 🔧 Troubleshooting

**Configuration not working?**

1. **Check repository exists**: Verify `https://github.com/owner/repo` is accessible
2. **Verify README file**: Ensure your repository has a `README.md` file
3. **Check environment variables**: Both `VITE_DEFAULT_OWNER` and `VITE_DEFAULT_REPO` must be set
4. **Validate names**: Follow GitHub naming conventions for usernames and repositories
5. **Repository is public**: Alexandria can only access public repositories

**Build warnings about configuration?**

- Check that your username follows GitHub rules (no spaces, special characters)
- Ensure repository name doesn't contain spaces or invalid characters
- Verify both environment variables are set together

**GitHub Actions deployment issues?**

- Ensure secrets are set in repository settings, not environment variables
- Check that the workflow has permissions to deploy to GitHub Pages
- Verify the repository is public or you have GitHub Pro for private repos

### 🔄 Backward Compatibility

Alexandria maintains full backward compatibility:

- **No configuration needed**: Works out of the box with default settings
- **Existing deployments**: Continue working without any changes
- **All features preserved**: Random discovery and navigation work with any configuration

## 🎯 Live Demo

**Try Alexandria now**: [https://runawaydevil.github.io/Alexandria/](https://runawaydevil.github.io/Alexandria/)

Click the random button and start exploring!

## 🛠 Technology

Alexandria is built with:

- **React 18** + **TypeScript** for robust UI development
- **Vite** for fast development and optimized builds
- **GitHub API** for content discovery and retrieval
- **React Router** for client-side navigation
- **CSS Modules** for responsive styling

## 🎯 Philosophy

Alexandria embraces the concept of **infinite content discovery**. Instead of searching for specific documentation, let serendipity guide you to interesting projects, learning opportunities, and well-documented codebases you might never have found otherwise.

The application demonstrates **dogfooding** - this very README you're reading is served through Alexandria itself, showcasing the system's capabilities.

## 🔧 Development

```bash
# Clone the repository
git clone https://github.com/runawaydevil/alexandria.git
cd alexandria

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your configuration (optional)
# VITE_DEFAULT_OWNER=yourusername
# VITE_DEFAULT_REPO=your-repo

# Start development server
npm run dev

# Build for production
npm run build
```

### 🧪 Testing Configuration

Test your configuration locally:

```bash
# Set environment variables and build
VITE_DEFAULT_OWNER=yourusername VITE_DEFAULT_REPO=your-repo npm run build

# Check build output for configuration validation
```

## 📝 License

MIT License - feel free to use, modify, and distribute.

## 👨‍💻 Developer

Developed by [runawaydevil](https://github.com/runawaydevil)

---

**Ready to explore?** Use the discovery tools below to start your journey through GitHub's vast documentation landscape.