# Migration Guide: Template Version to Production

## Overview

The repository has been cleaned and reorganized. The template-version solution (now in root) is the primary implementation.

## What Changed

### Architecture
- **Before:** Inline HTML with duplicated header/footer
- **After:** Template system with shared components (DRY)

### Blog System
- **Before:** Basic JSON loader, custom markdown parser
- **After:** md4w WASM renderer, automatic index generation

### File Organization
- **Before:** Mixed structure, code duplication
- **After:** Clean, modular, template-based

## File Locations

### Active Files (Root)
- All HTML pages (index.html, about.html, blog.html, etc.)
- `templates/` - Shared HTML templates
- `js/` - JavaScript modules (blog-engine, template-engine, etc.)
- `css/` - Stylesheets
- `_posts/` - Markdown blog posts
- `blog/` - Blog post pages

### Archived Files (`_old/`)
- `_old/main-site/` - Old inline HTML site
- `_old/backups/` - Backup files
- `_old/legacy/` - Miscellaneous old files

## Key Features

### Template System
- Shared header/footer templates
- Content templates for each page
- Template caching for performance
- Variable substitution

### Blog Engine
- Client-side markdown rendering (md4w)
- Automatic post index generation
- Front matter parsing
- GitHub Pages compatible

## Usage

### Adding a Blog Post
1. Create markdown file in `_posts/` with front matter
2. Run `npm run generate-index`
3. Post appears in blog listing automatically

### Creating a New Page
1. Create HTML file using template structure
2. Create content template in `templates/`
3. Reference template in HTML file

## Performance Benefits

- Template caching (loads once, reuses)
- md4w WASM (faster markdown rendering)
- Smaller file sizes (no duplication)
- Better code organization

## Maintenance Benefits

- Update header once (affects all pages)
- Update footer once (affects all pages)
- Easy to add new pages
- Clear separation of concerns

