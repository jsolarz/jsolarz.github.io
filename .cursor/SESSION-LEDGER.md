# Session Ledger

This file tracks all AI interactions, decisions, and context for persistent memory across sessions.

## Format

Each entry should include:
- Timestamp
- User Request
- AI Actions
- Files Modified
- Context/Notes
- Status

---

### 2026-03-28 - Import scheduled blog articles from ajournal posts-to-publish

**Timestamp**: 2026-03-28 (session)
**User Request**: Copy missing articles from `D:\files\devel\ajournal.com\posts-to-publish` (only real articles from `blog/`), avoid duplicates with existing `_posts`, confirm scheduling, do not delete or add LinkedIn/Twitter `week-*` files.

**AI Actions**:
- Confirmed README: `week-*.md` = social only; `blog/*.md` = full posts.
- Compared filenames to `_posts`: no collisions; `2026-03-14` vs `2026-03-21` Turbo Pascal posts are a pair (intro + follow-up), not duplicates.
- Copied 19 files from `posts-to-publish/blog/*.md` into `_posts/`.
- Replaced two `./2026-03-14-....md` links in the iterating Turbo Pascal post with `/blog/post.html?slug=...` so the client-side blog resolves them.
- Ran `node scripts/generate-posts-index.js` (41 posts total; 15 with date after 2026-03-28 UTC for scheduled listing behavior).
- Did not copy root `week-*`, `README.md`, or `week-03-rss-reader-part-*.md`.

**Files Modified**:
- Created: 19 new `_posts/2026-03-14-*.md` through `_posts/2026-07-04-*.md` (from ajournal `blog/`).
- Modified: `_posts/2026-03-21-iterating-modern-turbo-pascal-theme-colors.md`, `js/posts-index.json`, `_posts/manifest.json`.

**Context/Notes**:
- Scheduling uses `#isPublished` (UTC midnight) and `publishedOnly` on the index; future-dated posts stay out of the list until their date.
- Skipped `posts-to-publish/blog` duplicates: none vs repo; skipped non-articles per user.

**Status**: Completed

---
