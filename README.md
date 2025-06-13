# BBS-Style Website

A modern BBS-style website with Nord color theme (slightly darker variant), designed to be simple, responsive, and easy to update. This is a static website focusing on mobile-first design and using monospace text-heavy content with a BBS aesthetic.

## Features

- 🎨 Responsive, mobile-first design with BBS-style aesthetic
- 🌙 Dark mode by default with Nord color theme (darker variant)
- 📱 Mobile-friendly navigation with hamburger menu
- 🔧 Simple HTML/CSS with minimal JavaScript
- 📝 Easy to update content via HTML files
- 🖥️ Monospace text-heavy design inspired by old bulletin board systems
- ⚡ Modern retro feel with clean typography and terminal-inspired elements
- 📰 Blog system with Markdown to HTML conversion
- 📄 Dynamic CV loading system

## Project Structure

```
├── css/                      # Stylesheets
│   └── style.css             # Main CSS with Nord theme & all styling
├── js/                       # JavaScript files
│   ├── scripts.js            # Main site scripts (theme toggle, mobile menu)
│   ├── post-loader.js        # Blog post loading functionality
│   ├── cv-loader.js          # CV content loading system
│   └── posts.json            # Generated blog post index
├── pages/                    # Main website pages
│   ├── about.html            # About page
│   ├── blog.html             # Blog listing page
│   ├── cv.html               # Resume/CV page
│   └── portfolio.html        # Portfolio page
├── blog/                     # Blog post files
│   ├── *.html                # Individual blog posts
│   ├── *.md                  # Markdown blog posts
│   └── template.html         # Blog post template
├── _posts/                   # Markdown blog posts (Jekyll-style)
│   └── *.md                  # Blog posts with front matter
├── img/                      # Image assets
│   ├── blog/                 # Blog-related images
│   ├── general/              # General site images
│   └── portfolio/            # Portfolio images
├── files/                    # Document files
│   ├── cv.md                 # CV content in Markdown
│   └── *.pdf                 # Resume PDFs and documents
├── scripts/                  # Build & automation scripts
│   ├── convert-blog.js       # Markdown to HTML converter
│   ├── generate-post-json.js # Blog post index generator
│   ├── *.bat                 # Windows batch scripts
│   └── README.md             # Scripts documentation
├── docs/                     # Documentation
│   ├── cv-system.md          # CV system documentation
│   └── README-blog-system.md # Blog system documentation
├── template-version/         # Template backup/reference
├── backups/                  # Site backups
├── .github/                  # GitHub workflows and templates
├── index.html                # Homepage
├── policy.html               # Privacy policy
├── package.json              # Node.js dependencies for build tools
├── CNAME                     # Custom domain configuration
├── robots.txt                # Search engine directives
├── sitemap.xml               # Site map for SEO
└── README.md                 # This file
```

## Quick Start

1. **Clone or download** this repository
2. **Install dependencies** (for build tools): `npm install`
3. **Open `index.html`** in your browser to view the site
4. **Edit content** directly in the HTML files or use Markdown
5. **Deploy** to any static hosting service

## Content Management

### Main Pages

Each main section has its own HTML file:

- [`index.html`](index.html) - Homepage with welcome message and recent updates
- [`pages/about.html`](pages/about.html) - About information and bio
- [`pages/blog.html`](pages/blog.html) - Blog post listing with dynamic loading
- [`pages/cv.html`](pages/cv.html) - Resume/CV with dynamic content loading
- [`pages/portfolio.html`](pages/portfolio.html) - Portfolio of work and projects

### Blog System

The site features a flexible blog system supporting both HTML and Markdown:

#### Adding Blog Posts

**Method 1: Markdown Posts (Recommended)**
1. Create a new `.md` file in [`_posts/`](_posts/) directory
2. Use Jekyll-style naming: `YYYY-MM-DD-post-title.md`
3. Include front matter with title, date, and excerpt
4. Run conversion script: `npm run convert` or `scripts/convert-blog.js`

**Method 2: HTML Posts**
1. Create a new HTML file in [`blog/`](blog/) directory
2. Use [`blog/template.html`](blog/template.html) as a starting point
3. Update [`js/posts.json`](js/posts.json) manually or run `scripts/generate-post-json.js`

#### Blog Post Structure
```markdown
---
title: "Your Post Title"
date: 2025-06-13
excerpt: "Brief description of the post"
---

Your markdown content here...
```

### CV/Resume System

The CV page uses a dynamic loading system:

1. **Edit CV content** in [`files/cv.md`](files/cv.md)
2. **PDF versions** are stored in [`files/`](files/) directory
3. **Dynamic loading** handled by [`js/cv-loader.js`](js/cv-loader.js)

### Navigation

The site uses inline navigation in each page for simplicity:

- Navigation is embedded in each HTML file's header
- Active page highlighting is handled via CSS classes
- Mobile menu toggle functionality in [`js/scripts.js`](js/scripts.js)

## Build Tools & Scripts

### Available Scripts

```bash
# Convert Markdown posts to HTML
npm run convert

# Or run individual scripts:
node scripts/convert-blog.js
node scripts/generate-post-json.js
```

### Windows Batch Files
- [`scripts/convert-and-preview.bat`](scripts/convert-and-preview.bat) - Convert and open in browser
- [`scripts/deploy.bat`](scripts/deploy.bat) - Deployment script
- [`scripts/preview.bat`](scripts/preview.bat) - Quick preview script

### Dependencies
- `markdown-it` - Markdown parsing
- `front-matter` - YAML front matter parsing
- `fs-extra` - Enhanced file system operations

## Customization

### Color Scheme
The Nord-inspired color scheme is defined in CSS variables in [`css/style.css`](css/style.css):

```css
:root {
  --bg-primary: #1e2128;      /* Main background */
  --bg-secondary: #242933;    /* Secondary background */
  --text-primary: #e5e9f0;    /* Primary text */
  --accent: #88c0d0;          /* Links and accents */
  --accent-hover: #81a1c1;    /* Hover states */
}
```

### Typography
- Primary font: `JetBrains Mono, Consolas, Monaco, 'Courier New', monospace`
- All typography settings in the `--font-mono` CSS variable

### Site Title
Current site title: **"Behind You, a Syntax Error..."**
- Change in each page's header section
- Or update the template files for consistency

## Development Workflow

### Local Development
1. **Start local server**: `python -m http.server` or `npx serve`
2. **Open browser**: `http://localhost:8000`
3. **Edit files** and refresh to see changes

### Content Updates
1. **Pages**: Edit HTML files directly
2. **Blog**: Add Markdown files and run conversion scripts
3. **CV**: Update [`files/cv.md`](files/cv.md)
4. **Styling**: Modify [`css/style.css`](css/style.css)

### Publishing
1. **GitHub Pages**: Push to `main` branch (configured via [`CNAME`](CNAME))
2. **Manual deployment**: Use [`scripts/deploy.bat`](scripts/deploy.bat)
3. **Other hosts**: Upload all files to web directory

## Site Configuration

### SEO & Metadata
- [`robots.txt`](robots.txt) - Search engine directives
- [`sitemap.xml`](sitemap.xml) - Site structure for search engines
- [`policy.html`](policy.html) - Privacy policy page
- Meta tags configured in each page's `<head>`

### Domain & Hosting
- [`CNAME`](CNAME) - Custom domain configuration for GitHub Pages
- [`.htaccess`](.htaccess) - Apache server configuration
- Compatible with all static hosting services

## Browser Compatibility

- ✅ Chrome/Edge (latest versions)
- ✅ Firefox (latest versions) 
- ✅ Safari (latest versions)
- ✅ Mobile browsers (iOS/Android)
- ✅ Progressive enhancement (works without JavaScript)

## Documentation

Additional documentation available in [`docs/`](docs/):
- [`docs/cv-system.md`](docs/cv-system.md) - CV loading system details
- [`docs/README-blog-system.md`](docs/README-blog-system.md) - Blog system documentation
- [`scripts/README.md`](scripts/README.md) - Build scripts documentation

## Contributing

Feel free to fork this project and customize it for your own use. The code is designed to be simple and readable for easy modification.

## License

This template is free to use and modify for personal or commercial projects. See [`LICENSE`](LICENSE) for details.

---

**"Behind You, a Syntax Error..."** - A nostalgic journey through the digital frontier 🚀
