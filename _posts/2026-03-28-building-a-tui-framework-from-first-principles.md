---
title: "Building a TUI Framework from First Principles"
date: 2026-03-28
slug: building-a-tui-framework-from-first-principles
author: Jonathan Solarz
categories: architecture tools dotnet
excerpt: Why I built a minimal TUI framework instead of using Terminal.Gui or ncurses: virtual buffer, diff-based renderer, view tree, and the same volatility-based architecture I use everywhere. No black box.
---

# Building a TUI Framework from First Principles

I needed a TUI for an RSS reader. I could have used Terminal.Gui, or wrapped ncurses, or picked another .NET TUI library. I built my own instead. Not because the existing ones are bad—they're not—but because I wanted a stack I could **explain**. Every idea—virtual buffer, diff, focus chain, run loop—visible in one codebase. No "because the framework does it." Someone reads the code and the docs and understands how a TUI works from the ground up. That's js.MiniTui.

This post is about what that actually means: the core ideas, how they're split into components, and why the same IDesign rules apply to a framework as to an app.

## What a TUI Framework Has to Do

The job is simple to state. Read input from the terminal. Decode keys (and one day, mouse). Route input to the focused control. Lay out a tree of views. Draw the tree into an in-memory buffer. Compare this buffer to the previous frame. Write only the changed cells to the terminal. Repeat until quit. On exit, restore the terminal so the shell doesn't look broken.

The hard part is doing it without flicker, without "why did that key do that?", and without a mess of global state. That means: a **virtual buffer** (you never draw straight to the console), a **diff engine** (only send changes), a **view tree** (hierarchy and coordinates), and a **run loop** that does read → decode → route → layout → render → diff → write in a fixed order.

## Virtual Buffer and Diff

You don't write character-by-character to the terminal from every widget. You have a 2D buffer (width × height, one cell = character + foreground + background). Every frame, you clear the current buffer, walk the view tree, and each view draws into the buffer in its local coordinates. The run loop applies parent origin and clipping so child views don't draw outside their bounds. When the walk is done, you have the "current" buffer. You compare it to the "previous" buffer and produce a list of segments: (row, start column, text, colors). Only those segments get written to the terminal. Result: no full-screen redraw, no flicker, minimal escape sequences. The diff strategy (e.g. run-length per row, or dirty regions) is one component—an Engine. Swap the strategy without changing the rest of the loop.

## View Tree and Run Loop

Views form a tree. Root, windows, panels, labels, buttons. Each view has bounds (X, Y, Width, Height), children, and two hooks: **Render(buffer, context)** and **ProcessKey(key)**. The run loop (a Manager) owns the order of operations: read from terminal (Accessor), decode with an InputDecoder (Engine), resolve focus with a FocusChainEngine (Engine), optionally run a LayoutEngine (Engine), walk the tree and call Render, diff with BufferDiffEngine (Engine), write segments via Terminal (Accessor). Views don't know about the terminal or the diff. They just draw into the buffer and handle keys. The Manager orchestrates. So: one Accessor (terminal), four Engines (input decode, buffer diff, layout, focus chain), one Manager (run loop), and the view tree as Client code. Same taxonomy as the rest of my projects.

## Volatility in a Framework

What might change in a TUI framework? Terminal backend (Console vs ANSI vs future). Input encoding (raw ConsoleKeyInfo vs ANSI sequences, Escape vs Alt+key). Diff strategy (full buffer vs dirty regions). Layout policy (manual vs vertical stack vs grid). Focus policy (tab order, who's focusable). Run loop order (when to layout, when to redraw). Widget set (which controls exist). Each of those is a volatility. So we have ITerminal (Accessor), IInputDecoder, IBufferDiffEngine, ILayoutEngine, IFocusChainEngine (Engines), ITuiLoopManager (Manager), and View/widgets (Clients). Add a new terminal backend? New ITerminal implementation. Add dirty-region diff? New or updated IBufferDiffEngine. The architecture absorbs it.

## Why Build Our Own

Existing frameworks are full-featured and battle-tested. The trade-off is opacity. With MiniTui, the entire pipeline is in one repo: models, terminal, input decoder, buffer diff, layout engines, focus chain, renderer, loop manager, widgets. You can read from Program.cs to the last Write() to the terminal and understand every step. That's valuable for teaching, for debugging, and for tailoring (e.g. AOT, trimming, no reflection in hot paths). The design doc and the code stay in sync because we own both. IDesign and volatility-based decomposition aren't just for "business" apps—they work for infrastructure and frameworks too. The same closed architecture (Clients → Managers → Engines → Accessors) keeps the TUI maintainable as we add widgets and backends.

MiniTui is used by the RSS reader TUI and is packaged as a NuGet library. If you're building a .NET console UI and want a stack you can explain and extend, it's there: [js.MiniTui](https://github.com/jsolarz/js.rssreader) (inside the js.rssreader repo). No black box.

---

_Related: [The IDesign Method: Taxonomy, Volatility, and Closed Architecture](/blog/post.html?slug=idesign-method-taxonomy-volatility-and-closed-architecture), [The One-Page Dashboard: Why TUI Apps Still Matter](/blog/post.html?slug=the-one-page-dashboard-why-tui-apps-still-matter)._
