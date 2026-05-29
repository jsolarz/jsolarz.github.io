# Contributing

This repository is the source for [ioni.solarz.me](https://ioni.solarz.me)—a personal site (portfolio, CV, journal, contact), not an open-source product with a public roadmap.

**Code** (HTML, CSS, JavaScript) is [MIT](LICENSE). **Journal text and articles** are [CC BY-NC-ND 4.0](CONTENT-LICENSE.md).

## Who this is for

| Audience | What to do |
|----------|------------|
| **Jonathan (site owner)** | Use the workflows below when adding content or changing the site. |
| **Everyone else** | You may report broken links or rendering bugs; do not expect drive-by PRs to be merged. Suggestions and typo reports are welcome via [hello@solarz.me](mailto:hello@solarz.me). |

Forks for learning or local mirrors are fine. Copying journal posts into derivative works is not permitted under the content license without permission.

## Site owner workflow

### Prerequisites

```bash
npm install
```

Serve the repo root with any static server (Live Server, `npx serve`, GitHub Pages locally). Open `index.html` or `journal.html`.

### Add or edit a journal entry

1. Create or edit `_posts/YYYY-MM-DD-slug.md` with YAML front matter (`title`, `date`, `slug`, `excerpt`, optional `scene`, `tldr`, `categories`).
2. Put images under `img/blog/` and reference them as `/img/blog/...` in markdown.
3. Regenerate the listing index:

   ```bash
   npm run generate-index
   ```

4. Commit `_posts/...`, `js/posts-index.json`, and `_posts/manifest.json` together.
5. Verify in the browser:
   - `journal.html` lists the entry
   - `journal/post.html?slug=your-slug` renders DM block, TL;DR, body, prev/next
   - Old URLs `blog/post.html?slug=...` still redirect

Scheduled posts: set a future `date` in front matter; they stay hidden until that date (UTC). See [docs/README-blog-system.md](docs/README-blog-system.md).

### Change layout, theme, or engine

- **Styles:** `css/style.css` (Turbo Logic tokens—no per-page CSS bundles).
- **Chrome:** `templates/header.html`, `templates/footer.html`.
- **Pages:** root `*.html` + matching `templates/*-content.html`.
- **Journal rendering:** `js/blog-engine.js`, `templates/blog-post.html`, `js/markdown-loader.js`.

After JS or template changes, smoke-test:

- `journal.html` and one long post (code blocks, TOC)
- `portfolio.html` (images/SVGs in card media)
- `tests/integration/navigation.test.html` in a browser if you touched nav

### Portfolio or static pages

- Portfolio cards: `templates/portfolio-content.html`, assets in `img/portfolio/`.
- Dev project media uses dark `#0d141e` frames; client photos use `portfolio-card__media--light`.

### Deploy

Hosted on **GitHub Pages** (`CNAME` → `ioni.solarz.me`). Push to the branch GitHub Pages uses (typically `master`).

The workflow [`.github/workflows/reindex-posts.yml`](.github/workflows/reindex-posts.yml) runs `npm run generate-index` when `_posts/**` changes on `master` or `main` and commits index updates if needed. Still run `generate-index` locally before pushing so your branch is consistent.

## Project layout

```
_posts/              Journal markdown (source of truth)
journal/             Entry viewer (post.html?slug=)
blog/                Legacy redirects → journal/
js/                  blog-engine.js, template-engine.js, posts-index.json
templates/           Page fragments loaded by template-engine
css/style.css        Global Turbo Logic theme
img/blog/            Journal images
img/portfolio/       Portfolio thumbnails
docs/                Maintainer docs (start with README-blog-system.md)
scripts/             generate-posts-index.js
```

## Conventions

### Commits

- Present tense, one logical change per commit when possible.
- Journal-only: `journal: add post on …` or `journal: fix typos in …`
- Site chrome: `ui: …`, `fix: journal base path …`, `chore: regenerate posts index`

### JavaScript

- ES modules (`import` / `export`); no new global `window.*` unless required for templates.
- Match existing style in `js/blog-engine.js` and `js/template-engine.js`.
- Keep `journal` in `BASE_PATH_EXCLUDE_SEGMENTS` in `blog-engine.js` and `keyboard-navigation.js` so `/journal/post.html` resolves assets from the site root.

### Content

- Internal links: `/journal/post.html?slug=...` (not `/blog/...`).
- Excerpt: used in the index and meta tags; optional `tldr` for the on-page summary box.
- `scene`: optional DM intro; keep it short and on-topic.

### What not to commit

- `.cursor/`, `.kiro/`, `.idea/`, `node_modules/`, `SESSION-LEDGER.md` (local notes; gitignored)
- Duplicate images under `_posts/img/`—use `img/blog/` only

## External contributions

**Issues and PRs** on GitHub are not the primary channel. Email is preferred for:

- Broken links or 404s on the live site
- Accessibility or mobile layout problems
- Factual corrections (with source)

**Pull requests** are unlikely to be accepted unless discussed first (typo fixes in code/docs may be an exception). Large drive-by refactors, dependency upgrades, or design overhauls will be closed.

## Documentation

| Doc | Purpose |
|-----|---------|
| [README.md](README.md) | Overview and quick start |
| [docs/README-blog-system.md](docs/README-blog-system.md) | Journal engine, front matter, index |
| [CONTENT-LICENSE.md](CONTENT-LICENSE.md) | Article licensing |
| [SECURITY.md](SECURITY.md) | Security reporting |

## Questions

[hello@solarz.me](mailto:hello@solarz.me)
