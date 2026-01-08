# BBS-Style Website

A minimal, performant BBS-style website with template system and markdown blog engine. Designed for simplicity, speed, and easy maintenance.

## Features

- Template system (DRY architecture)
- Client-side markdown blog engine using md4w (WASM)
- BBS aesthetic with Nord color theme
- Mobile-first responsive design
- Template caching for performance
- GitHub Pages compatible

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
├── blog/                # Blog post pages
│   └── post.html        # Dynamic post template
├── css/                 # Stylesheets
├── docs/                # Documentation
├── files/               # Document files (CV, PDFs)
├── img/                 # Image assets
├── js/                  # JavaScript modules
│   ├── blog-engine.js   # Blog engine (md4w)
│   ├── md4w-loader.js   # md4w WASM loader
│   ├── template-engine.js # Template system
│   ├── scripts.js       # Core scripts
│   └── posts-index.json # Generated post index
├── scripts/             # Build scripts
└── templates/           # HTML templates
    ├── header.html
    ├── footer.html
    └── [content templates]
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

- Client-side markdown rendering (md4w WASM)
- Automatic front matter parsing
- Posts index generation
- GitHub Pages compatible

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
<div
    data-template="blog-post"
    data-template-data='{"postTitle":"Title","postDate":"2025-01-15"}'
></div>
```

## Deployment

### GitHub Pages

1. Ensure `_posts` directory is accessible
2. Run `npm run generate-index`
3. Deploy root directory
4. Site works immediately

## Documentation

- `README-blog-engine.md` - Blog engine documentation
- `docs/SOLUTION-ANALYSIS.md` - Architecture decisions
- `docs/CLEANUP-SUMMARY.md` - Repository cleanup details

## License

- **Code (HTML, CSS, JavaScript):** MIT License - see `LICENSE` file
- **Content (Blog Posts, Articles):** CC BY-NC-ND 4.0 - see `CONTENT-LICENSE.md`

This dual-license approach protects your written content while keeping the code open for learning and reuse.
