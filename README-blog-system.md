# BBS-Style Website: Blog Post System

This updated version of the website includes a complete blog post system using Markdown files. Here's how it works:

## Overview

1. Blog posts are written in Markdown format with front matter metadata
2. Posts are stored in the `_posts` directory with a date-prefixed filename
3. The `convert_markdown.bat` script converts these Markdown files to HTML
4. The converted HTML files are placed in the `blog` directory

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

- `#`, `##`, `###` etc. for headings
- `*italic*` or `_italic_` for italic text
- `**bold**` or `__bold__` for bold text
- `[link text](url)` for links
- `![alt text](image-url)` for images
- ```code blocks``` with backticks
- > Blockquotes with >

## Converting Posts to HTML

1. Make sure you have Node.js installed on your system
2. Place your markdown files in the `_posts` directory
3. Run the `convert_markdown.bat` script
4. Your converted HTML files will be in the `blog` directory

The first time you run the script, it will:
- Create a package.json file if one doesn't exist
- Install required dependencies (markdown-it, front-matter, fs-extra)
- Create the conversion script if it doesn't exist
- Create a template file in blog/template.html if it doesn't exist

## Blog Template

The system uses a template file from `blog/template.html`. This template contains variables that will be replaced with content from your Markdown files:

- `{{title}}` - The post title from front matter
- `{{date}}` - The formatted date from front matter
- `{{author}}` - The author from front matter
- `{{categories}}` - The categories from front matter
- `{{content}}` - The converted HTML content from your Markdown

You can customize this template to change the appearance of your blog posts.

## Updating the Blog Listing

After converting your posts, you'll need to update the main blog listing page (`blog.html`) to include links to your new posts.

## Notes

1. Images referenced in your blog posts should use paths relative to the root of the website
2. If you want to update the template, edit `blog/template.html`
3. For custom styling of Markdown elements, add CSS rules to `css/style.css`

---

Happy blogging!
