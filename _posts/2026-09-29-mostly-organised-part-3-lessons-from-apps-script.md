---
layout: post
title: "Mostly Organised, Part 3: What I'd Tell Someone Starting an Apps Script Project"
date: 2026-09-29
author: Jonathan Solarz
categories: development google-workspace apps-script best-practices
image: /img/blog/mostly-organised-3.jpg
excerpt: "After building a full Google Docs Editor Add-on, I have opinions. Specifically: about manifests, Content Security Policy, undo history, the difference between Workspace Add-ons and Editor Add-ons, and why you must use a single batchUpdate call for everything."
scene: |
  The documentation was not wrong, exactly. It was like a map of a city drawn by someone
  who had heard about cities but never visited one. The streets were mostly in the right places.
  The landmarks existed. It was only when you arrived that you noticed the map had
  enthusiastically omitted the one-way system, the construction works, and the moat.
---

# Mostly Organised, Part 3: What I'd Tell Someone Starting an Apps Script Project

*Third in a three-part series. [Part 1](/blog) explains what Mostly Organised is. [Part 2](/blog) covers the technical implementation. This post is the distilled lessons — things I wish the documentation had said more clearly.*

---

> *"The software was, in most respects, correct. The respects in which it was not correct were educational."*

Building *Mostly Organised* took longer than it should have. Not because Google's APIs are poorly designed — for the most part, they're well-designed for what they do. It took longer because the documentation covers several overlapping systems that look similar, are often described together, but behave differently in ways that only become visible when you try to build something real.

Here are the eleven things I'd tell someone starting a Google Docs add-on project.

---

## 1. Know Which Platform You're Actually Building On

There are two different extensibility platforms for Google Docs. They look similar in the docs. They are not the same thing.

```
PLATFORM COMPARISON
────────────────────────────────────

  Workspace Add-ons (modern)
  ─────────────────────────
  manifest: appsscript.json with "addOns" block
  UI: CardService — JSON card widgets
  good for: panels, forms, info displays
  not good for: custom drag-drop trees, complex UI

  Editor Add-ons (older, still fully supported)
  ─────────────────────────────────────────────
  manifest: appsscript.json WITHOUT "addOns" block
  UI: HtmlService — full HTML/CSS/JS in iframe
  good for: custom interactive UI
  not good for: being well-documented
```

If your manifest has an `addOns` block, you're building a Workspace Add-on. If it doesn't, you're building an Editor Add-on. These are not interchangeable. An `addOns` block in a project that uses `HtmlService` sidebar produces a broken add-on — the Workspace Add-on framework tries to handle events that the Editor Add-on machinery is handling, and the result is silent failures.

I discovered this after implementing the whole thing. The fix was deleting the `addOns` block and a handful of entry points that only make sense in the Workspace model (`onDocsHomepage`, `onFileScopeGranted`, `showSidebarCard`).

Lesson: read the [Editor Add-on guide](https://developers.google.com/apps-script/add-ons/editors) and the [Workspace Add-on guide](https://developers.google.com/workspace/add-ons/how-tos/building-workspace-addons) back-to-back before writing a line of code. Note which guide your requirements match. Use only that guide.

---

## 2. The Content Security Policy Will End Your Dependency Choices

HtmlService serves your HTML in an iframe. That iframe has a strict Content Security Policy set by Google. It does not allow:

- External script sources (`<script src="https://cdn.jsdelivr.net/...">` — blocked)
- ES modules (`<script type="module">` — blocked)
- Inline event handlers in some forms

Everything you use must be:
- Inlined directly into the HTML file (as a `<script>` tag with the code inside it)
- Or bundled into the HTML at build time

This kills most modern JS frameworks. React's CDN bundle is 50KB+ minified. Bundling a full React project into a single HTML file within Apps Script's 500KB script limit is technically possible but painful. Vue is similarly sized.

What works: **Preact**. The UMD build of Preact 10 is ~3KB. The hooks UMD is another ~1KB. Both inline cleanly:

```html
<!-- inlined Preact 10 UMD — no CDN, CSP compliant -->
<script>
  // ...contents of preact.umd.js...
  var { h, render, Component } = preact;
</script>
<script>
  // ...contents of preact-hooks.umd.js...
  var { useState, useEffect, useRef, useCallback } = preactHooks;
</script>
```

The API is ~95% compatible with React. Components look like React components. If you know React, Preact costs nothing to learn.

Alternatively: vanilla JS. For a tree with drag-and-drop, state management, and multiple node states, I wouldn't recommend it — the component model is worth having — but it's a valid option.

---

## 3. `google.script.run` Is Callback-Based. Wrap It.

The Apps Script sidebar communication API is callback-based. It does not return promises. In 2026, this is the kind of API that produces code that reads like it was written in 2012.

```javascript
// What you have to write
google.script.run
  .withSuccessHandler(function(result) {
    doSomethingWith(result);
  })
  .withFailureHandler(function(error) {
    handleError(error);
  })
  .getTree();
```

Wrap it in a Promise:

```javascript
function rpc(fnName, params) {
  return new Promise(function(resolve, reject) {
    var runner = google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject);
    runner[fnName](params);
  });
}

// Now you can write:
rpc('getTree').then(function(tree) {
  setState({ nodes: tree.nodes });
}).catch(function(err) {
  setState({ error: err.message });
});
```

This is not clever. It's the minimum sanity wrapper that lets you write async code that reads like async code.

---

## 4. Every API Call Is a New Execution Context

Apps Script execution is stateless per call. When the sidebar calls `google.script.run.getTree()`, Apps Script spins up a fresh V8 context, runs the function, and terminates. When the sidebar calls `google.script.run.moveSection(...)`, that's a completely separate context. Nothing from the first call persists in memory for the second.

```
EXECUTION MODEL
────────────────────────────────────

  sidebar                  Apps Script server

  rpc('getTree')  ─────►  [context A starts]
                           run getTree()
                           [context A terminates]
                  ◄─────  { nodes: [...] }

  rpc('moveSection')  ──►  [context B starts]
                            run moveSection()
                            [context B terminates]
                  ◄──────  { ok: true, nodes: [...] }

  Context A and B share nothing in memory.
  All state must come from storage.
```

Every piece of state your server functions need — parsed tree, document config, user preferences — must be read from storage on every call. This sounds expensive. It isn't, because:

- **ScriptCache** is fast (~50ms read) for the parsed tree
- **DocumentProperties** and **UserProperties** are fast for config objects
- The parsed tree is relatively stable between mutations; cache hit rate is high

Design accordingly: parse once, cache aggressively, invalidate after every mutation.

---

## 5. All Mutations in a Single `batchUpdate`

Google Docs maintains an undo history. Every time you make an API call that modifies the document, it creates a new entry. If your "rename heading" operation makes three API calls, Ctrl+Z undoes them one at a time, leaving the document in intermediate states.

Users expect Ctrl+Z to undo one thing. "Rename heading" is one thing. "Move section" is one thing.

The solution is `batchUpdate`: pass all your operations in a single call.

```javascript
// All of this is one undo step:
Docs.Documents.batchUpdate(docId, {
  requests: [
    { deleteContentRange: { range: { startIndex: 45, endIndex: 57 } } },
    { insertText: { location: { index: 45 }, text: 'New Heading Title' } },
    { updateParagraphStyle: {
        range: { startIndex: 45, endIndex: 63 },
        paragraphStyle: { namedStyleType: 'HEADING_1' },
        fields: 'namedStyleType'
    }}
  ]
});
```

One API call, one undo step, atomic success or failure.

The constraint: you must pre-compute all character indices before building the request array, because the indices shift as operations execute (see [Part 2](/blog) for the full walkthrough). Pre-computation is more work upfront; the alternative is undefined behavior.

---

## 6. Scopes: Less Is More

The OAuth consent screen shows users exactly which permissions your add-on requests. Broad scopes look alarming. `https://www.googleapis.com/auth/drive` — which grants full Drive access — will make users hesitate. And it's almost never what you need.

Minimum viable scopes for a Docs Editor Add-on:

```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/script.container.ui"
  ]
}
```

`documents` — read and write the active document. Required for everything.
`script.container.ui` — required to show the sidebar UI. Without this, `HtmlService` calls fail.

`drive.file` is often recommended in tutorials because it's in the Workspace Add-on template. For a pure Editor Add-on that only touches the active document, you don't need it. Removing it makes the consent screen less alarming.

---

## 7. `onInstall` Is Not Optional

When a user installs your add-on from the Marketplace and opens a document, `onOpen` does not fire. The first event is `onInstall`.

```javascript
function onOpen(e) {
  DocumentApp.getUi()
    .createMenu('Mostly Organised')
    .addItem('Open TOC panel', 'showSidebar')
    .addToUi();
}

function onInstall(e) {
  onOpen(e); // Without this, the menu never appears on first install
}
```

Without `onInstall`, new users open a document, don't see the add-on menu, and assume the installation failed. Add this. It's two lines.

---

## 8. DocumentProperties Are Shared; UserProperties Are Per-User

Apps Script offers three property stores:

| Store | Scope | Shared with? |
|-------|-------|--------------|
| ScriptProperties | The script | All users |
| DocumentProperties | The document | All editors of that document |
| UserProperties | The user | Only the current user |

TOC configuration (numbering scheme, excluded headings, label overrides) should live in **DocumentProperties**. If one editor changes the numbering scheme, all editors see the updated numbering.

UI preferences (expand/collapse state, panel width, user preferences) should live in **UserProperties**. Editor A collapsing a section shouldn't collapse it for Editor B.

The mistake I see in sample add-ons: putting everything in DocumentProperties because it's the obvious "per-document" store. Then User A collapses the entire tree and User B opens the sidebar to find every section collapsed with no obvious way to expand them all.

---

## 9. Cache Invalidation Timing Matters

ScriptCache has a 6-hour TTL. Between mutations, it returns the pre-mutation tree. This is fine — the cache is a performance optimization, not a source of truth.

The rule: **invalidate the cache at the start of every mutation, not after**. If you invalidate after, a failed mutation leaves valid cached data. If you invalidate before, a failed mutation leaves no cache — the next call does a fresh parse, which is slightly slower but always correct.

```javascript
function moveSection(sourceId, targetId, position) {
  // Invalidate first, before touching the document
  StorageService.invalidateTreeCache();

  // ... do the mutation ...

  // Re-parse and re-cache after success
  return SyncEngine.parse();
}
```

Also: the stale detection logic compares the current parse against cached node titles. If the cache is stale (from a collaborator edit), the stale detection fires. Good. That's the point.

---

## 10. `clasp` Is Good. Use It.

Google's [clasp CLI](https://github.com/google/clasp) lets you develop locally, push to Apps Script, and maintain the project in git. The alternative is editing directly in the Apps Script web editor, which has no git integration, a limited editor, and will make you feel like it's 2009.

```bash
npm install -g @google/clasp
clasp login          # OAuth auth
clasp create         # or clasp clone if project exists
clasp push           # local → Apps Script
clasp pull           # Apps Script → local
```

The development loop:
1. Edit `src/*.js` and `src/sidebar.html` locally
2. `npm run push` (build script copies to `dist/`, clasp pushes `dist/`)
3. Refresh the Google Doc
4. Reopen the sidebar

Combined with watching for file changes (`chokidar`), this is a fast enough loop. It will never be as fast as a local dev server, because every change requires a push to Google's servers and a browser refresh. Accept this. There's no way around it.

---

## 11. The Manifest Must Match Your Platform

This is the most important item on this list. The `appsscript.json` manifest has different required fields for different platform types. The biggest trap:

```json
// THIS BREAKS AN EDITOR ADD-ON
{
  "addOns": {
    "common": { "name": "My Add-on" },
    "docs": {
      "homepageTrigger": { "runFunction": "onDocsHomepage" }
    }
  }
}
```

The `addOns` block tells Google this is a Workspace Add-on. If you're using `HtmlService` for a sidebar, this block should not exist.

```json
// CORRECT for an Editor Add-on
{
  "timeZone": "America/New_York",
  "dependencies": {
    "enabledAdvancedServices": [{
      "userSymbol": "Docs",
      "serviceId": "docs",
      "version": "v1"
    }]
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/script.container.ui"
  ]
}
```

No `addOns` block. No `homepageTrigger`. No `onFileScopeGranted`. The advanced service entry is required if you're using the Docs REST API (`Docs.Documents.get`, `Docs.Documents.batchUpdate`).

---

## Summary

```
GOOGLE DOCS EDITOR ADD-ON: WHAT TO KNOW
────────────────────────────────────────

  Platform       Use HtmlService, not CardService
                 No "addOns" block in manifest

  CSP            Inline all JS (Preact UMD ~3KB works)
                 No CDN, no type="module"

  Communication  Wrap google.script.run in Promises
                 Each call is a new execution context

  Mutations      One batchUpdate per user action
                 Pre-compute indices, mind the ordering

  State          DocumentProperties for shared config
                 UserProperties for per-user prefs
                 ScriptCache for parsed tree (6h TTL)

  Identity       headingId primary (resets on move)
                 title+level slug as fallback

  Scopes         Minimum: documents + script.container.ui

  Dev tooling    clasp for local development and git
```

The Docs API is capable of everything you'd want from a document editor extension. The gap between "capable" and "immediately obvious" is wider in some places than others. These lessons are my attempt to close that gap for the next person who builds something in this space.

The code for Mostly Organised is at [github.com/your-org/mostly-organised](https://github.com/your-org/mostly-organised). MIT licensed. Read it, use it, steal the useful bits.

Your document is not going to organise itself. Somebody has to.

---

*[Part 1: Why I built it](/blog) · [Part 2: The implementation](/blog) · [Connect](/contact.html)*

*Jonathan Solarz is a software architect. He believes that the best systems documentation includes the things that surprised the author.*
