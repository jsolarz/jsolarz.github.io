---
layout: post
title: "Mostly Organised, Part 1: Why I Built a Replacement for a Dead Add-on"
date: 2026-06-17
author: Jonathan Solarz
categories: development google-workspace apps-script
image: /img/blog/mostly-organised-1.jpg
excerpt: "The Google Docs table of contents has been read-only scaffolding since approximately the time of Chaucer. The one add-on that fixed this was discontinued. So I built a replacement — and learned a great deal about the fine art of suffering."
scene: |
  The document was not going to organise itself. It had been told this many times, in many fonts,
  and had responded with characteristic equanimity by remaining entirely disorganised.
  Somewhere in the Google infrastructure, a table of contents sat in a sidebar, showing headings,
  and declining to be moved. It had been declining for years. It had a gift for it.
---

# Mostly Organised, Part 1: Why I Built a Replacement for a Dead Add-on

*First in a three-part series on building a Google Docs Editor Add-on from scratch — the problem, the tools, and the painful education in batchUpdate index arithmetic.*

---

> *"The Table of Contents was, technically, a list. It was the kind of list that gives other lists a bad name."*

There's a peculiar kind of software grief that arrives not when something breaks, but when something that worked perfectly simply stops existing. The Google Docs Marketplace entry reads "discontinued." No forwarding address. No successor. Just a void where a useful thing used to be.

The add-on in question was [Table of Contents](https://workspace.google.com/marketplace/app/table_of_contents/975727178255). If you're reading this before the listing disappears entirely: yes, that one. It let you reorder document sections by dragging them. It numbered your headings without polluting the document text. It was, in the blunt assessment of everyone who used it, *good*.

It is now gone.

And so, as one does when faced with the absence of a tool one relies on, I decided to build a replacement. This is the story of how that went.

---

## The Problem With Google Docs' Native TOC

Google Docs has a built-in Table of Contents. It appears in the Insert menu. It shows your headings. You can click them.

That is genuinely the complete list of things it does.

You cannot:
- Reorder sections (you must cut, paste, scroll, hope, undo, repeat)
- Number sections in any way that survives editing (manual numbering breaks the instant you insert a new section above 3.2)
- Promote or demote a heading without hunting through the paragraph style dropdown
- See your document structure as a surface you can *work on*, rather than a map of a territory you must navigate to manually

For a two-page document, this is fine. For a 40-section architecture specification, a legal brief, a technical manual, a thesis — it is the kind of limitation that slowly convinces you that Google Docs was designed by people who have never written anything longer than a memo.

```
NATIVE GOOGLE DOCS TOC
────────────────────────────────────

  ┌─────────────────────────────┐
  │ Table of Contents           │
  │                             │
  │  Introduction               │  ← can click
  │    Overview                 │  ← can click
  │    Scope                    │  ← can click
  │  Architecture               │  ← can click
  │    Components               │  ← can click
  │                             │
  │  [cannot drag]              │
  │  [cannot number]            │
  │  [cannot demote]            │
  │  [cannot rename]            │
  └─────────────────────────────┘

Features: clicking.
```

The missing add-on solved all of this. Now it's gone. The gap it left is real, and I use Google Docs for exactly the kind of work that needs exactly the features it had.

---

## The Decision to Build Instead of Find

The responsible thing, before building, was to look for alternatives. I did this. The alternatives were:

1. **Other TOC add-ons** — none with drag-to-reorder section moves that actually move document content (not just TOC display order)
2. **Microsoft Word** — technically superior document editor but that's a different problem
3. **Notion / Confluence** — not a document I can share with a client in a standard format
4. **Accepting the situation** — briefly considered, immediately rejected

And so: build.

---

## What "Mostly Organised" Actually Does

The add-on I built is called *Mostly Organised* — a name chosen in the spirit of Douglas Adams and Terry Pratchett, who understood that software, like the universe, tends toward a state that is technically functional but perpetually slightly short of ideal.

```
MOSTLY ORGANISED SIDEBAR
────────────────────────────────────

  ┌─────────────────────────────┐
  │ Mostly Organised      ⟳  ⚙ │
  │ Synced just now             │
  ├─────────────────────────────┤
  │ Numeric ▾  [Search…]        │
  ├─────────────────────────────┤
  │ ▼ 1 Introduction        ⋮  │
  │    1.1 Overview         ⋮  │
  │    1.2 Scope            ⋮  │
  │ ▶ 2 Architecture        ⋮  │  ← drag me
  │ ▼ 3 Implementation      ⋮  │
  │    3.1 API Layer        ⋮  │
  │ ⚠ 4 Appendix (renamed)  ⋮  │  ← stale
  │ ~~5 Deleted Section~~       │  ← orphaned
  └─────────────────────────────┘

Features: dragging, numbering, demoting, renaming, detecting drift.
```

In practice, it does six things the native TOC does not:

**Drag-to-reorder** — drop a node and the actual document section moves with it: heading plus every paragraph beneath it until the next peer or ancestor heading. One undo step.

**Display-only numbering** — choose `1.1.1`, `I.A.1`, or `A.1.a`. Numbers appear in the sidebar. The document headings stay clean. Collaborators who haven't installed the add-on see no changes to the document.

**Promote and demote** — right-click a heading, shift it up or down a level. Children cascade. A single operation, a single Ctrl+Z.

**Inline rename** — double-click a label, type, press Enter. The heading in the document changes. No scrolling to find it.

**Drift detection** — if a collaborator renames a heading while you have the sidebar open, you get a warning. The add-on noticed. It offers you a choice. It does not decide on your behalf.

**Label overrides** — the sidebar can show different text than what's in the document heading. Useful for long headings you want abbreviated in the TOC without shortening the actual heading.

---

## The Technical Shape of the Problem

Before writing the first line of code, I spent time understanding what kind of thing I was actually building. The answer turned out to be more constrained than I expected.

Google offers two extensibility models for Docs:

**Workspace Add-ons** — modern, uses CardService, renders JSON cards. Good for read-only integrations, panels with buttons. Not designed for custom drag-and-drop tree UIs.

**Editor Add-ons** — the older model, uses HtmlService to serve a custom HTML page in a sidebar. Full HTML/CSS/JS in an iframe. This is the thing that lets you build an actual interactive tree.

The discontinued add-on was an Editor Add-on. Mostly Organised is an Editor Add-on. There's no path to building what I needed with CardService.

```
PLATFORM CHOICE
────────────────────────────────────

  CardService (Workspace Add-ons)
  ┌─────────────────────────┐
  │ [Card]                  │
  │   [TextParagraph]       │  ← JSON cards, limited UI
  │   [ButtonSet]           │
  │     [Button: Action]    │
  └─────────────────────────┘
  Result: not enough control for a drag-drop tree

  HtmlService (Editor Add-ons)
  ┌─────────────────────────┐
  │ <div class="tree">      │
  │   <div draggable=true>  │  ← full HTML, full CSS
  │     <!-- your UI -->    │
  │   </div>                │
  │ </div>                  │
  └─────────────────────────┘
  Result: full control, iframe sandbox, CSP restrictions
```

The tradeoffs of HtmlService become apparent quickly:

- The sidebar is an iframe. Communication with the Apps Script backend goes through `google.script.run`, which is callback-based and cannot return promises natively.
- The CSP (Content Security Policy) blocks all external script sources. No CDN imports. No `type="module"`. Bundle everything or use nothing.
- Each call to `google.script.run` is a round trip to Google's servers. Apps Script execution is per-call stateless — no shared memory between requests.

These constraints shaped every subsequent decision.

---

## The Project Structure

```
mostly-organised/
├── src/
│   ├── Code.js        — menus, sidebar host, RPC dispatch
│   ├── sync.js        — parse document → TOC tree; drift detection
│   ├── mutations.js   — all document writes: move, rename, promote
│   ├── storage.js     — DocumentProperties, UserProperties, ScriptCache
│   ├── numbering.js   — display-only section number computation
│   └── sidebar.html   — the sidebar UI (Preact, inlined)
├── docs/
│   ├── requirements/  — PRD
│   ├── architecture/  — system design, data model, sync engine, ADRs
│   └── design/        — UX design
├── appsscript.json    — manifest (scopes, advanced services)
├── package.json       — clasp, eslint
└── .clasp.json        — script ID
```

The code splits cleanly across concerns. The sync engine handles reading. The mutation executor handles writing. Storage wraps Google's three persistence layers (ScriptCache, DocumentProperties, UserProperties) with sensible defaults and namespaced keys.

---

## What's Coming in the Next Posts

Building this turned out to be an education in the specific ways that Google's APIs are surprising. Some of the surprises were pleasant. Most were instructive.

**Part 2** covers the technical implementation: the two-API problem (why you need both `DocumentApp` and the Docs REST API), the headingId lifecycle, section boundary arithmetic, and why the order of operations in a `batchUpdate` request array is not a detail you can ignore.

**Part 3** covers the practical lessons: everything I'd tell someone starting an Apps Script project today, from CSP gotchas to undo history hygiene to why you want all your mutations in a single API call.

If you want to see the code, it's at [github.com/your-org/mostly-organised](https://github.com/your-org/mostly-organised). If you want to use the add-on, it's in the Google Workspace Marketplace under *Mostly Organised*.

And if you, like me, spent years relying on the discontinued add-on and found its absence a genuine inconvenience — I hope this is useful.

---

*Jonathan Solarz is a software architect who occasionally builds the tools he wishes other people had already built. He maintains that the best software names are the ones that manage expectations appropriately.*

*[Connect](/contact.html) · [All posts](/blog)*
