# BBS-Style Blog Engine

Client-side markdown blog engine using md4w (WASM). **No pre-conversion needed** - markdown files are served directly and rendered in the browser, similar to [pipress](https://github.com/pi0/pipress).

## How It Works

Unlike traditional static site generators that convert markdown to HTML at build time, this engine:

1. Serves markdown files directly from `_posts/` directory
2. Fetches markdown files via `fetch()` in the browser
3. Renders markdown to HTML client-side using md4w WASM
4. No build step required - just write markdown and deploy

This approach is ideal for GitHub Pages and other static hosting where you can't run a build process.

## Features

-   Client-side markdown rendering using md4w (WASM)
-   Automatic post index generation from `_posts` directory
-   Front matter parsing (YAML metadata)
-   BBS aesthetic preserved
-   Template system integration
-   GitHub Pages compatible

## Setup

### 1. Posts Directory

The blog engine loads markdown files directly from the `_posts` directory. No copying needed - markdown files are served as-is.

### 2. Update Manifest (Required)

After adding a new post, add its filename to `_posts/manifest.json`:

```json
["2025-05-08-new-post.md", "2025-04-18-existing-post.md"]
```

The blog engine will automatically discover and parse posts from the manifest.

### 3. (Optional) Generate Index for Performance

For faster loading, you can generate a full metadata index:

```bash
npm run generate-index
```

This creates `js/posts-index.json` with all post metadata. If this file doesn't exist, the engine falls back to reading from `_posts/manifest.json` and parsing markdown files on-the-fly.

### 3. Blog Post Pages

Individual blog posts are loaded dynamically. The URL format is:

-   `/blog/[slug].html` or `/blog/[slug]`

The slug is derived from the markdown filename (date prefix removed).

## Usage

### Adding a New Post

1. Create a markdown file in `_posts/` with front matter:

```markdown
---
title: "Your Post Title"
date: 2025-01-15
author: Jonathan Solarz
categories: tech ai
excerpt: Brief description of the post
---

# Your Post Content

Your markdown content here...
```

2. Run `npm run generate-index` to update the index
3. The post will appear in the blog listing automatically

### Blog Listing Page

The blog listing page (`blog.html`) automatically loads and displays all posts from the index, sorted by date (newest first).

### Individual Post Pages

All blog posts use a single template: `blog/post.html`. The slug is extracted from the URL (e.g., `/blog/future-of-intelligent-systems.html`) to determine which markdown file to load. The page title is updated dynamically after loading the post metadata.

## File Structure

```
.
├── _posts/                  # Markdown blog posts (source files, served directly)
│   └── manifest.json       # Simple filename list (required)
├── js/
│   ├── md4w-loader.js      # md4w WASM loader
│   ├── blog-engine.js      # Blog engine core (client-side rendering)
│   └── posts-index.json    # Generated post index (optional, for performance)
├── blog/
│   └── post.html           # Single template for all blog posts (slug extracted from URL)
└── templates/
    └── blog-post.html      # Blog post content template
```

## Technical Details

### md4w Loader

Loads md4w from jsDelivr CDN. Falls back to basic HTML escaping if md4w fails to load.

### Blog Engine

-   Fetches markdown files directly from `_posts/` directory (no pre-conversion)
-   Parses front matter from markdown files
-   Renders markdown to HTML client-side using md4w WASM
-   Integrates with template engine for consistent styling
-   Handles base path detection for GitHub Pages
-   Similar architecture to [pipress](https://github.com/pi0/pipress) but client-side instead of server-side

### Posts Index

JSON file containing post metadata:

-   title
-   date
-   slug
-   filename
-   categories (array)
-   excerpt
-   author

## GitHub Pages Deployment

1. Ensure `_posts` directory is accessible (not in .gitignore)
2. Ensure `_posts/manifest.json` exists with list of markdown filenames
3. (Optional) Run `npm run generate-index` for faster loading
4. Deploy root directory to GitHub Pages
5. Markdown files are served directly and rendered client-side - no build step required

## Troubleshooting

**Posts not loading:**

-   Check that `posts-index.json` exists and is valid JSON
-   Verify `_posts` directory is accessible
-   Check browser console for fetch errors
-   Ensure base path detection is correct for your deployment

**Markdown not rendering:**

-   Check that md4w loaded successfully (browser console)
-   Verify markdown content is valid
-   Check for front matter parsing errors

**Template not applying:**

-   Ensure `template-engine.js` loads before `blog-engine.js`
-   Check that template files exist in `templates/` directory
-   Verify template data is being passed correctly
