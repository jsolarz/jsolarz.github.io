# BBS-Style Website: Blog Post System

Client-side markdown blog system - no pre-conversion needed.

## Overview

1. Blog posts are written in Markdown format with front matter metadata
2. Posts are stored in the `_posts` directory with a date-prefixed filename
3. Markdown files are served directly and rendered client-side using md4w WASM
4. No build step or HTML conversion required

## Writing Blog Posts

### File Structure

Create your blog posts in the `_posts` directory using this naming convention:

```
YYYY-MM-DD-post-title.md
```

For example:

```
2025-05-08-future-of-intelligent-systems.md
```

### Front Matter

Each blog post should start with front matter - metadata about your post enclosed in triple dashes:

```markdown
---
layout: post
title: "Your Post Title Here"
date: 2025-05-08
author: Your Name
categories: category1 category2
image: /img/blog/image-name.jpg
excerpt: A brief summary of your post that will appear in listings.
---

# Your Post Content Starts Here

The rest of your file is regular Markdown content.
```

### Markdown Content

After the front matter, write your blog post using standard Markdown syntax:

-   `#`, `##`, `###` etc. for headings
-   `*italic*` or `_italic_` for italic text
-   `**bold**` or `__bold__` for bold text
-   `[link text](url)` for links
-   `![alt text](image-url)` for images
-   `code blocks` with backticks
-   > Blockquotes with >

## How It Works

The blog engine uses **client-side rendering** — no build-time copy of content:

1. **Single source of truth:** Markdown lives in `_posts/`. No pre-rendered HTML.
2. **Index vs manifest:** The engine first loads `js/posts-index.json` (title, date, slug, excerpt, etc.). If that fetch fails, it falls back to `_posts/manifest.json` (list of filenames), then fetches each `.md` file to build the list.
3. **Rendering a post:** The client fetches `_posts/<filename>.md`, parses front matter, renders markdown to HTML (e.g. [marked](https://github.com/markedjs/marked)), and injects into the page.
4. **`.nojekyll`:** Used so GitHub Pages serves `_posts/*.md` as static files instead of running Jekyll.

**Keeping the list up to date:** After adding or changing posts, run `npm run generate-index`. This updates `js/posts-index.json` and `_posts/manifest.json` so the blog list and metadata stay correct. See the blog post [How This Blog Engine Works](/blog/post.html?slug=how-this-blog-engine-works) for a fuller narrative.

## Adding Posts

1. Create markdown file in `_posts/` with front matter
2. Run `npm run generate-index` to update the posts index (metadata only)
3. Post appears automatically in blog listing
4. No HTML conversion needed

## Blog Template

The system uses templates in `templates/blog-post.html` for consistent styling. The blog engine:

-   Loads markdown from `_posts/` directory
-   Renders to HTML using md4w
-   Injects into template with post metadata

## Notes

1. Images referenced in your blog posts should use paths relative to the root of the website
2. If you want to update the template, edit `blog/template.html`
3. For custom styling of Markdown elements, add CSS rules to `css/style.css`

---

Happy blogging!
