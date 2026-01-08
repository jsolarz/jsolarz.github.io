# BBS-Style Website

A minimal, performant BBS-style website with template system and markdown blog engine. Designed for simplicity, speed, and easy maintenance.

## Features

-   Template system (DRY architecture)
-   Client-side markdown blog engine using md4w (WASM)
-   BBS aesthetic with Nord color theme
-   Mobile-first responsive design
-   Template caching for performance
-   GitHub Pages compatible

## Quick Start

```bash
# Install dependencies
npm install

# Generate blog posts index
npm run generate-index

# Open index.html in browser
```

## Project Structure

```
.
├── _posts/              # Markdown blog posts
│   └── manifest.json    # Post filename list (required)
├── blog/                # Blog post pages
│   └── post.html        # Single template for all posts (slug from URL)
├── css/                 # Stylesheets
├── docs/                # Documentation
├── files/               # Document files (CV, PDFs)
├── img/                 # Image assets
├── js/                  # JavaScript modules
│   ├── blog-engine.js   # Blog engine (md4w)
│   ├── md4w-loader.js   # md4w WASM loader
│   ├── template-engine.js # Template system
│   ├── scripts.js       # Core scripts
│   └── posts-index.json # Generated post index (optional)
├── scripts/             # Build scripts
├── templates/           # HTML content templates
│   ├── header.html
│   ├── footer.html
│   └── [content templates]
└── *.html               # Entry point pages (root for clean URLs)
    ├── index.html        # Home page
    ├── about.html        # About page
    ├── blog.html         # Blog listing
    ├── contact.html      # Contact page
    ├── cv.html           # CV page
    ├── portfolio.html    # Portfolio page
    └── policy.html       # Privacy policy
```

## Blog System

### Adding a Post

1. Create markdown file in `_posts/`:

```markdown
---
title: "Your Post Title"
date: 2025-01-15
categories: tech ai
excerpt: Brief description
---

# Your Content

Markdown content here...
```

2. Generate index:

```bash
npm run generate-index
```

3. Post appears automatically in blog listing

### Blog Engine

-   **Client-side markdown rendering** - No pre-conversion needed, markdown files served directly
-   md4w WASM renders markdown to HTML in the browser (similar to [pipress](https://github.com/pi0/pipress))
-   Automatic front matter parsing
-   Posts index generation (metadata only, not HTML)
-   GitHub Pages compatible - works with static hosting

See `README-blog-engine.md` for detailed documentation.

## Template System

### Creating a Page

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<title>Page Title | BBS-Style Website</title>
		<link rel="stylesheet" href="css/style.css" />
	</head>
	<body>
		<div class="container">
			<div data-template="header"></div>
			<main>
				<div data-template="your-content"></div>
			</main>
			<div data-template="footer"></div>
		</div>
		<script src="js/template-engine.js"></script>
		<script src="js/scripts.js"></script>
	</body>
</html>
```

### Template Variables

```html
<div data-template="blog-post" data-template-data='{"postTitle":"Title","postDate":"2025-01-15"}'></div>
```

## Deployment

### GitHub Pages

1. Ensure `_posts` directory is accessible
2. Run `npm run generate-index`
3. Deploy root directory
4. Site works immediately

## Documentation

-   `README-blog-engine.md` - Blog engine documentation (client-side rendering)
-   `docs/README-blog-system.md` - Blog system overview

## License

-   **Code (HTML, CSS, JavaScript):** MIT License - see `LICENSE` file
-   **Content (Blog Posts, Articles):** CC BY-NC-ND 4.0 - see `CONTENT-LICENSE.md`

This dual-license approach protects your written content while keeping the code open for learning and reuse.
