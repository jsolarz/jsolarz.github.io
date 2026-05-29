# BBS-Style Website

A minimal, performant BBS-style website with template system and markdown blog engine. Designed for simplicity, speed, and easy maintenance.

## Features

-   Template system (DRY architecture)
-   Client-side journal (markdown) engine
-   Turbo Logic terminal aesthetic
-   Mobile-first responsive design
-   Template caching for performance
-   GitHub Pages compatible

## Quick Start

```bash
# Install dependencies
npm install

# (Optional) Generate blog posts index for faster loading
npm run generate-index

# Open index.html in browser
# To test: Open browser console and run blogEngineTests.runTests()
```

## Project Structure

```
.
├── _posts/              # Markdown blog posts
│   └── manifest.json    # Post filename list (required)
├── journal/             # Journal entry pages
│   └── post.html        # Single template for all entries (slug from URL)
├── blog/                # Legacy redirects to journal/
│   └── post.html
├── css/                 # Stylesheets
├── docs/                # Documentation
├── files/               # Document files (CV, PDFs)
├── img/                 # Image assets
├── js/                  # JavaScript modules
│   ├── blog-engine.js   # Journal engine
│   ├── markdown-loader.js
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
    ├── journal.html      # Journal listing
    ├── blog.html         # Redirects to journal.html
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

3. Post appears automatically in the journal listing

### Journal engine

-   **Client-side markdown rendering** — Markdown in `_posts/` is fetched and rendered in the browser (marked). No build-time HTML.
-   **Index + manifest:** Listing uses `js/posts-index.json`; if that fails, fallback is `_posts/manifest.json` plus per-file fetch.
-   **Run `npm run generate-index`** after adding or changing posts so the index (and manifest) stay up to date.
-   GitHub Pages compatible (`.nojekyll` keeps `_posts` served as static files).

See `docs/README-blog-system.md` and the post [How This Blog Engine Works](/journal/post.html?slug=how-this-blog-engine-works) for details.

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

-   `docs/README-blog-system.md` - Journal system overview (front matter, index, scenes)

## License

-   **Code (HTML, CSS, JavaScript):** MIT License - see `LICENSE` file
-   **Content (Blog Posts, Articles):** CC BY-NC-ND 4.0 - see `CONTENT-LICENSE.md`

This dual-license approach protects your written content while keeping the code open for learning and reuse.
