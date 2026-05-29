# Scripts

## generate-posts-index.js

Builds `js/posts-index.json` and `_posts/manifest.json` from `_posts/*.md` (metadata only). Markdown is still rendered in the browser.

```bash
npm run generate-index
```

Run after adding or changing posts. The GitHub Action `.github/workflows/reindex-posts.yml` does the same on pushes to `master` or `main` when `_posts/**` changes.
