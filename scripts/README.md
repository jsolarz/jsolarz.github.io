# Scripts Directory

Build scripts for the blog website.

## Files

-   `generate-posts-index.js` - Generates posts index (metadata only) from `_posts/` directory

## Usage

Generate posts index:

```bash
npm run generate-index
```

This creates `js/posts-index.json` with post metadata. No HTML conversion needed - markdown is rendered client-side.
