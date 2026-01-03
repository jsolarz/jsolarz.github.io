# BBS-Style Blog Engine

Simple markdown blog engine using md4w for client-side rendering. Compatible with GitHub Pages static hosting.

## Features

- Client-side markdown rendering using md4w (WASM)
- Automatic post index generation from `_posts` directory
- Front matter parsing (YAML metadata)
- BBS aesthetic preserved
- Template system integration
- GitHub Pages compatible

## Setup

### 1. Posts Directory

The blog engine loads markdown files from the `_posts` directory. You have two options:

**Option A: Copy _posts to template-version**
```bash
# Copy _posts directory to template-version
cp -r _posts template-version/_posts
```

**Option B: Reference root _posts (for development)**
The blog engine will try `template-version/_posts` first, then fall back to root `_posts`.

### 2. Generate Posts Index

After adding or updating markdown posts, generate the index:

```bash
npm run generate-index
```

This creates `template-version/js/posts-index.json` with post metadata.

### 3. Blog Post Pages

Individual blog posts are loaded dynamically. The URL format is:
- `/blog/[slug].html` or `/blog/[slug]`

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

Create individual post pages by copying `blog/post.html` and updating the slug in the URL, or use a URL routing system.

For GitHub Pages, you can:
- Use a 404.html redirect to handle dynamic routes
- Generate static HTML files for each post during build
- Use the existing `blog/post.html` as a template

## File Structure

```
template-version/
├── js/
│   ├── md4w-loader.js      # md4w WASM loader
│   ├── blog-engine.js      # Blog engine core
│   └── posts-index.json    # Generated post index
├── blog/
│   └── post.html           # Blog post page template
├── templates/
│   └── blog-post.html      # Blog post content template
└── _posts/                  # Markdown blog posts (copy from root)
```

## Technical Details

### md4w Loader

Loads md4w from jsDelivr CDN. Falls back to basic HTML escaping if md4w fails to load.

### Blog Engine

- Parses front matter from markdown files
- Renders markdown to HTML using md4w
- Integrates with template engine for consistent styling
- Handles base path detection for GitHub Pages

### Posts Index

JSON file containing post metadata:
- title
- date
- slug
- filename
- categories (array)
- excerpt
- author

## GitHub Pages Deployment

1. Copy `_posts` directory to `template-version/_posts`
2. Run `npm run generate-index` to create posts index
3. Deploy `template-version/` directory to GitHub Pages
4. Ensure `_posts` directory is accessible (not in .gitignore)

## Troubleshooting

**Posts not loading:**
- Check that `posts-index.json` exists and is valid JSON
- Verify `_posts` directory is accessible
- Check browser console for fetch errors
- Ensure base path detection is correct for your deployment

**Markdown not rendering:**
- Check that md4w loaded successfully (browser console)
- Verify markdown content is valid
- Check for front matter parsing errors

**Template not applying:**
- Ensure `template-engine.js` loads before `blog-engine.js`
- Check that template files exist in `templates/` directory
- Verify template data is being passed correctly

