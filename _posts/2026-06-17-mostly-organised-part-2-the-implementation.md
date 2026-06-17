---
layout: post
title: "Mostly Organised, Part 2: headingId Lifecycle, Index Arithmetic, and the Perils of batchUpdate"
date: 2026-06-17
author: Jonathan Solarz
categories: development google-workspace apps-script
image: /img/blog/mostly-organised-2.jpg
excerpt: "Google assigns internal IDs to heading paragraphs. Google resets those IDs when you move sections. The Docs API processes mutations sequentially, and indices shift as you go. These things are related, and they would like a word."
scene: |
  The API documentation, if you read it carefully, did not lie. It was simply economical with context.
  Like a treasure map that marks the X but declines to mention the quicksand.
  The requests array processed in document order. The indices shifted as each operation ran.
  This was specified. It was also, in practice, the kind of thing you discovered at 11pm.
---

# Mostly Organised, Part 2: headingId Lifecycle, Index Arithmetic, and the Perils of batchUpdate

*Second in a three-part series. [Part 1](/blog) established what Mostly Organised is and why it exists. This post covers the implementation — specifically the parts that required the most thought.*

---

> *"The first test passed. This was not reassuring. In the author's experience, tests that pass at the beginning are simply gathering confidence for a more spectacular failure later."*

Building a Google Docs add-on that modifies document structure turns out to involve an interesting number of moving parts. Some are documented well. Some are documented technically-accurately-but-incompletely. A few you discover by writing code that almost works and then reading the results carefully.

This post covers three of the harder problems, the approaches that don't work, and the approaches that do.

---

## Problem 1: The Two-API Situation

Apps Script gives you two ways to read a Google Doc.

**`DocumentApp`** — the native Apps Script API. Nice object model, easy traversal, zero boilerplate. `body.getChild(i).asParagraph().getHeading()` reads cleanly. This is what you use first.

**`Docs.Documents.get()`** — the REST API. JSON response, character-index-based positions, the whole document as a tree of `StructuralElement` objects.

I needed both. Here's why.

DocumentApp is excellent for reading heading text, heading level, and document structure. It is not excellent for two things:

1. **`headingId`** — Google assigns an internal identifier to each heading paragraph. You need this for stable cross-session identity. DocumentApp does not expose it. The Docs REST API does.

2. **Character indices** — To move a section, you need to know the exact character positions where it starts and ends. DocumentApp abstracts these away. The REST API gives you `startIndex` and `endIndex` per element.

So the sync pipeline reads with DocumentApp for structure, makes one REST API call upfront to fetch headingIds:

```javascript
function _fetchHeadingIds(docId) {
  var map = {};
  var docData = Docs.Documents.get(docId, { fields: 'body.content' });
  var content = (docData.body && docData.body.content) || [];

  content.forEach(function (element) {
    if (!element.paragraph) return;
    var para = element.paragraph;
    var style = para.paragraphStyle && para.paragraphStyle.namedStyleType;
    if (!style || style.indexOf('HEADING_') !== 0) return;

    var level = parseInt(style.replace('HEADING_', ''), 10);
    var headingId = para.paragraphStyle.headingId;
    var text = _extractRestText(para);

    var key = text + '::' + level;
    if (!map[key]) map[key] = headingId;
  });

  return map;
}
```

One REST call at parse time. Returns a `"title::level" → headingId` map. The DocumentApp traversal then uses this to assign headingIds to each `TocNode` as it builds the tree.

```
TWO-API READ PIPELINE
────────────────────────────────────

  parse() call
     │
     ├──► DocumentApp (native)
     │      body.getChild(i) × N
     │      → para text, heading level, element index
     │      [fast, clean, no headingId]
     │
     └──► Docs REST API (one call)
            Documents.get(docId, {fields: 'body.content'})
            → full content with headingIds, char indices
            → build { "title::level" → headingId } map
                 │
                 └──► merge: assign headingId to each TocNode
```

The mutation side (section moves, renames) reads the full REST response again to get character indices, since those are required to build the `batchUpdate` request. This is a second REST call per mutation — acceptable given mutation frequency.

---

## Problem 2: headingId Doesn't Survive Section Moves

Here is something the Docs API documentation says, accurate and entirely alarming if you think about its implications:

> When content is deleted and then reinserted, paragraph identifiers including headingId are reset.

A section move is, at the API level, a copy-insert-delete. You copy the source content, insert it at the destination, delete it from the source. After this operation, the heading paragraphs that were moved have *new headingIds*.

```
headingId LIFECYCLE
────────────────────────────────────

  Before move:
    H1 "Introduction"    headingId: "h.abc123"
    H2 "Overview"        headingId: "h.def456"
    H1 "Architecture"    headingId: "h.ghi789"

  Move "Introduction" after "Architecture"

  After move:
    H1 "Architecture"    headingId: "h.ghi789"  ← unchanged
    H1 "Introduction"    headingId: "h.NEW001"  ← reset
    H2 "Overview"        headingId: "h.NEW002"  ← reset

  The section moved. Its identifiers did not survive.
```

If headingId is your sole identity key, every section move silently orphans every node in the moved subtree. They disappear from the cached tree because their old IDs no longer match anything in the document.

The solution is a two-level identity scheme:

**Primary identity: headingId** — stable across edits, renames, and collaborator modifications. Survives everything except deletion and move.

**Fallback identity: title+level slug** — position-free, survives moves. `_slugify("Introduction-h1")` returns the same string regardless of where in the document "Introduction" lives.

```javascript
// Stable ID: headingId preferred; fallback is title+level (position-free)
var stableId = headingId || _slugify(title + '-h' + level);
```

After a section move, the sync engine's reconcile pass reattaches stored configuration (label overrides, exclusions, expand state) using this fallback. If the document has "Introduction" at H1 before and after the move, reconciliation finds it by the slug and reattaches everything.

The limitation: if two sections share identical text at the same heading level, the slug collides. The code resolves this first-match-wins. Documentation explicitly warns about this in the README. It's the kind of edge case that's annoying but rare.

---

## Problem 3: batchUpdate and the Index Problem

This is the subtlest piece of the implementation, and the one that caused the most debugging time.

Google Docs' `batchUpdate` API accepts a list of operations in a single call. It processes them *sequentially*, in document order. Each operation changes the document, which changes the character indices of everything that comes after it.

If you insert 500 characters at position 100, then everything that was at position 200 is now at position 700. Your original index 200 is now wrong.

This becomes critical when moving a section. A section move is:
1. Insert the source section content at the target location
2. Delete the source section content from its original location

Or in reverse order — which you choose depends on the relative positions of source and target.

```
batchUpdate INDEX PROBLEM
────────────────────────────────────

  Document (before):
    pos 0-200:   Introduction section  ← SOURCE (200 chars)
    pos 200-400: Architecture section  ← TARGET (move SOURCE after this)

  CASE A: Target is AFTER source → delete first, then insert
    ┌── delete pos 0-200 (source)
    │   → Architecture shifts: was 200-400, now 0-200
    └── insert at pos 200 (was "after Architecture", still correct)
                                       ✓ correct

  CASE B: Target is BEFORE source → insert first, then delete
    ┌── insert at pos 0 (200 chars)
    │   → source shifts: was 0-200, now 200-400
    │   → deletion index must be adjusted: +200
    └── delete pos 200-400 (adjusted)
                                       ✓ correct

  WRONG in CASE B: insert first, then delete at original positions
    ┌── insert at pos 0 (200 chars)
    │   → source shifts to 200-400
    └── delete pos 0-200 ← NOW DELETES THE THING WE JUST INSERTED
                                       ✗ catastrophic
```

The pre-computation logic:

```javascript
// target is after source in document: delete first, then insert
// target is before source: insert first, then delete (adjust deletion by +insertedLength)

var insertFirst = (insertionPoint < srcStart);

if (insertFirst) {
  // insert first; source's position shifts by insertedLength
  var adjustedSrcStart = srcStart + insertedLength;
  var adjustedSrcEnd   = srcEnd   + insertedLength;
  requests = insertRequests.concat([deleteRequest(adjustedSrcStart, adjustedSrcEnd)]);
} else {
  // delete first; insertion point doesn't shift
  requests = [deleteRequest(srcStart, srcEnd)].concat(insertRequests);
}
```

One `batchUpdate` call. One undo step. Either you get both operations atomically or you get neither.

---

## Problem 4: The Delete-Everything Bug in Rename

Renaming a heading sounds simple: delete the old text, insert the new text. The bug is in the deletion boundary.

The Docs API gives each paragraph an `endIndex`. This `endIndex` includes the paragraph's trailing newline character `\n`. That character is the *paragraph separator* — it's what makes the heading its own paragraph. If you delete it, the heading merges into the next paragraph.

```
HEADING PARAGRAPH ANATOMY
────────────────────────────────────

  "Architecture\n"
   ↑            ↑
   startIndex   endIndex
                (includes \n)

  deleteContentRange(start, endIndex)
  → deletes "Architecture" AND the paragraph separator
  → paragraph merges with next paragraph
  → your heading is now part of the paragraph beneath it

  deleteContentRange(start, endIndex - 1)
  → deletes "Architecture" only
  → paragraph separator preserved
  → heading remains its own paragraph       ✓
```

The fix is one character:

```javascript
// Delete only heading text, not the paragraph separator
{ deleteContentRange: { range: { startIndex: start, endIndex: end - 1 } } },
// Insert new heading text
{ insertText: { location: { index: start }, text: newTitle } },
// Reapply heading style (insertText uses NORMAL_TEXT by default)
{ updateParagraphStyle: {
    range: { startIndex: start, endIndex: start + newTitle.length + 1 },
    paragraphStyle: { namedStyleType: 'HEADING_' + node.level },
    fields: 'namedStyleType'
}}
```

The `updateParagraphStyle` after `insertText` is also required. When you insert text at a position, it takes on the default style (`NORMAL_TEXT`). Without explicitly reapplying the heading style, your renamed heading becomes body text. The document looks unchanged because the text is right; the heading is not a heading anymore.

---

## Problem 5: V8 Enum Key Lookup

This one is small but instructive. Apps Script uses Google's V8 engine. The `DocumentApp.ParagraphHeading` object is an enum-like object where the values are internal implementation objects.

Writing `HEADING_LEVEL[para.getHeading()]` — using the enum value as an object key — relies on V8 coercing the enum value to a string. The coercion is implementation-defined. It works sometimes. It doesn't work other times. The behavior can change across V8 versions.

Wrong:
```javascript
var HEADING_LEVEL = {
  [DocumentApp.ParagraphHeading.HEADING1]: 1,
  [DocumentApp.ParagraphHeading.HEADING2]: 2,
  // ...
};
return HEADING_LEVEL[para.getHeading()]; // unreliable
```

Right:
```javascript
function _getHeadingLevel(para) {
  var h = para.getHeading();
  var ph = DocumentApp.ParagraphHeading;
  if (h === ph.HEADING1) return 1;
  if (h === ph.HEADING2) return 2;
  if (h === ph.HEADING3) return 3;
  if (h === ph.HEADING4) return 4;
  if (h === ph.HEADING5) return 5;
  if (h === ph.HEADING6) return 6;
  return 0;
}
```

Explicit comparisons. Boring. Reliable.

---

## The Resulting Architecture

```
SYSTEM OVERVIEW
────────────────────────────────────

  Google Docs (browser)
  ┌────────────────────────────────────────────────────┐
  │                                                    │
  │  Document Canvas          Sidebar (HTML iframe)   │
  │  ┌──────────────┐         ┌──────────────────────┐ │
  │  │ H1 Intro     │◄────────│ ▼ 1 Introduction    │ │
  │  │   H2 Scope   │         │    1.1 Scope        │ │
  │  │ H1 Arch      │─────────│ ▶ 2 Architecture    │ │
  │  └──────────────┘         └────────┬─────────────┘ │
  │                                    │ google.script  │
  └────────────────────────────────────┼───────────────┘
                                       │ .run.*()
                     ┌─────────────────▼────────────────┐
                     │  Apps Script V8 Server           │
                     │                                  │
                     │  SyncEngine        Mutations     │
                     │  parse()           moveSection() │
                     │  reconcile()       rename()      │
                     │  detectDrift()     changeLevel() │
                     │         │               │        │
                     │  ┌──────▼───────────────▼──────┐ │
                     │  │         Storage              │ │
                     │  │  ScriptCache (tree, 6h TTL) │ │
                     │  │  DocumentProperties (config)│ │
                     │  │  UserProperties (prefs)     │ │
                     │  └──────────────┬──────────────┘ │
                     └─────────────────┼────────────────┘
                                       │
                     ┌─────────────────▼────────────────┐
                     │  Google APIs                     │
                     │  DocumentApp  (read structure)   │
                     │  Docs REST v1 (write, headingId) │
                     └──────────────────────────────────┘
```

Each sidebar interaction is:
1. `google.script.run` call (async, callback-based)
2. Server function fetches fresh state (or reads from cache)
3. If mutation: builds `batchUpdate` requests, makes one API call, invalidates cache
4. Returns fresh `TocNode[]` to sidebar
5. Sidebar re-renders the tree

No persistent server. No database. Everything in Google's own infrastructure. Your document never leaves Google.

---

## Up Next

[Part 3](/blog) covers the practical lessons — the things I'd tell someone starting an Apps Script project, from the CSP constraints that killed my first UI framework choice to the specific ways the Workspace Add-on documentation will lead you astray if you're building an Editor Add-on.

---

*Jonathan Solarz is a software architect who considers the Docs API documentation technically accurate and somewhat economical with context.*

*[Part 1: Why I built it](/blog) · [Part 3: Lessons](/blog) · [Connect](/contact.html)*
