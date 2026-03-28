---
title: "Iterating on the Turbo Pascal Theme: When the Palette Fights Back"
date: 2026-03-21
slug: iterating-modern-turbo-pascal-theme-colors
author: Jonathan Solarz
categories: tools design nostalgia
excerpt: A theme is never done. After shipping the Borland and modern VS Code variants, I filled every workbench token, fixed menu and chrome contrast, split the grays, and darkened the blues. Here's what that iteration looked like.
---

# Iterating on the Turbo Pascal Theme: When the Palette Fights Back

In [the post from March](/blog/post.html?slug=modern-turbo-pascal-why-i-still-care-about-editor-colors) I argued that editor colors are information, not decoration. I shipped **Modern Turbo UI Color Scheme** with two VS Code faces: **Borland Turbo Pascal Original** and a modern variant, plus ports to other editors and terminals.

Then I sat in the theme for real work—and the gaps showed up.

## Skeleton Keys

VS Code's theme JSON lets you define hundreds of `workbench.colorCustomizations` keys, plus TextMate scopes and semantic token colors. I had listed almost all of them so I could tune the UI systematically. Many entries were still empty strings.

Empty does not mean "inherit sensibly" in every case. It means "whatever the default is," which breaks the illusion of a single designed palette. The first pass was mechanical: every key gets an explicit hex from the Turbo vocabulary—blue surfaces, gray chrome, yellow accents, cyan strings, green comments—or a deliberate alpha for overlays.

That alone made the IDE feel *owned* instead of *the default theme with a blue editor.*

## The Menu That Wasn't There

The worst bug was usability, not aesthetics. The **File / Edit / …** menu and its dropdown used the **same mid-gray** as the **file explorer** (`#808080` everywhere). Open a menu and the panel visually merged with the sidebar. You could not tell where the menu ended and the tree began. Hover and selection states barely read.

Workbench colors are separate concerns: `sideBar.background`, `menu.background`, `menubar.selectionBackground`, `titleBar.activeBackground`. I split them:

- **Menu surfaces** moved to a darker blue-gray (`#000088` family) so popups read as layers above the chrome.
- **Borders** on the menu (`menu.border`) and **selection** (`menu.selectionBackground`, `menu.selectionBorder`) so the active row and the open menu label don't disappear into the gray.

Same idea as Turbo Pascal itself: the eye needs edges, not a slab of uniform gray.

## Too Much Gray, Too Bright

Once the blues and menus behaved, another problem appeared: **uniform bright gray** across the activity bar (icons), the explorer, the bottom panel (terminal, **debug console**), and half the tabs. Everything was "fine" and nothing had priority. It was distracting.

I stopped using one gray for all chrome. Roughly:

- **Activity bar** (Explorer, Search, Extensions, …): darker—recedes.
- **Sidebar** (tree): a distinct mid tone so files read clearly.
- **Panel** (output, terminal, debug console): its own shade so the bottom band isn't a clone of the sides.

Tab strips and status bar got pulled into the same system so nothing sat at the old loud `#808080` default by accident.

## Darkening the Blues Without Losing Turbo

The signature editor blue was always in the **`#0000AA`** neighborhood—classic EGA/CGA energy. On a modern LCD, that much saturated blue for hours can feel loud.

I didn't want pastel. I wanted **one or two steps darker** on the whole blue stack: the deep chrome blues, the editor background, the selection mid-tones (`#5555AA` style purple-blues), the bright ANSI blue in the terminal. Shift the ladder down a notch so the screen softens without turning the theme into "generic dark."

Iteration here is mostly: change a hex, reload the window, read code for twenty minutes, notice what feels wrong, repeat.

## Why Bother

This is the same loop as refactoring. You ship something that expresses an idea. You use it. The edge cases find you. You tighten until the structure holds.

A color theme is a small surface. It's also the thing you stare at while doing everything else. Making it consistent—menus that read, chrome that separates, blues that don't shout—is part of **getting out of the way**, which was the whole point of Turbo Pascal in the first place.

If you already use the extension, pull the latest. If not: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=jonathansolarz.modern-turbo-pascal-ui), [GitHub](https://github.com/jsolarz/Modern-Turbo-UI-Color-Scheme).

---

_Follow-up to [Modern Turbo Pascal: Why I Still Care About Editor Colors](/blog/post.html?slug=modern-turbo-pascal-why-i-still-care-about-editor-colors)._
