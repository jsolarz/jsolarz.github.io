---
title: "Modern Turbo Pascal: Why I Still Care About Editor Colors"
date: 2026-03-14
slug: modern-turbo-pascal-why-i-still-care-about-editor-colors
author: Jonathan Solarz
categories: tools design nostalgia
excerpt: The Borland Turbo Pascal IDE had one job—get out of the way and let you code. I ported that ethic to a Nord-inspired theme for VS Code, JetBrains, and terminals. Here's why it matters.
---

# Modern Turbo Pascal: Why I Still Care About Editor Colors

I learned to code in Borland Turbo Pascal. Blue background. Cyan strings. Green comments. White keywords. The IDE did one thing: it got out of the way. No tabs, no sidebar, no "welcome experience." You opened a file and you were in the code. The colors were not decoration. They were information. Keywords looked different from identifiers. Strings looked different from comments. Your eye learned the map in an afternoon.

Thirty years later I still want that. So I built a theme that gives it to me.

## The Problem with Modern Themes

Most editor themes fall into two camps. The first is the "dark mode gray" camp: low contrast, lots of gray-on-gray, syntax colors so muted you need to squint to tell a type from a variable. Easy on the eyes, they say. Also easy to miss a bug because everything blurs together.

The second is the "rainbow carnival" camp: every token type gets a different hue. Beautiful in a screenshot. Exhausting after four hours. Your brain spends cycles decoding color instead of reading structure.

Turbo Pascal was neither. It had six or seven colors, each with a job. Background: dark blue. Not black—blue. So the screen had a tint, a mood. Text: high contrast. Keywords popped. Comments receded. Strings were unmistakable. The palette was small enough to memorize and bold enough to parse at a glance.

## What I Built

I have a repo called [Modern Turbo UI Color Scheme](https://github.com/jsolarz/Modern-Turbo-UI-Color-Scheme). Two variants:

**Borland Turbo Pascal Original.** As close as I could get to the real thing. Dark blue (#0000AA), bright cyan strings, green comments, white keywords. Nostalgia with a purpose: when I'm in that theme, I'm in "focus mode." No distractions. Just the code and the palette I learned on.

**Nord Turbo Pascal Modern.** The same idea, updated. Nord's palette—dark navy background, Frost blues for accents, Snow Storm for text—with the same semantic discipline. Keywords, identifiers, strings, comments, numbers: each has a role. High contrast. Readable for long sessions. Available for VS Code, JetBrains, Visual Studio, Vim, Sublime, Windows Terminal, and Linux terminals.

The point was never "make it pretty." The point was "make it legible and consistent." When I switch machines or editors, I install the same theme. My brain doesn't have to re-learn the map.

## Why This Is an Exercise in Coding

Building a color theme is coding. You're defining a mapping from semantic token types to visual output. VS Code uses a JSON schema. JetBrains uses XML. Terminals use escape sequences or config files. Each platform has different tokens, different keys, different quirks. I had to read the docs, run the parsers, and test across languages. JavaScript, Python, Pascal, TypeScript, HTML, CSS—each language exposes different scopes. A theme that looks right in one file can look wrong in another. So you iterate. You add a rule for "variable.parameter", you tweak the comment opacity, you check contrast ratios. It's engineering. Small scope, but real.

I also use it as a forcing function for my other projects. My personal site uses a Nord-inspired BBS palette (Polar Night, Frost, Aurora). My AWS visualization tool uses a TUI with green/yellow/red for state. The same principle everywhere: color as information, not decoration. If I'm going to stare at a screen for most of my waking hours, I want the palette to work.

## The Broader Takeaway

This is part of a pattern. I'm building tools I wanted for years—an AWS dashboard that actually shows the full picture, a building management system, an RSS reader in the terminal, a delivery-as-code SDK—and I'm doing it with AI-assisted development. The AI writes the boilerplate and follows the architecture. I make the decisions and enforce the constraints. The themes, the TUIs, the color choices: those are mine. They're the part that says "I still have opinions about how things should look and work."

Caring about editor colors is caring about the craft. It's not superficial. It's the same instinct that makes you refactor a function until the control flow is obvious, or document a component so the next person doesn't have to guess. The medium is different. The standard is the same: get out of the way, convey information, don't waste the user's attention.

If you want to try it: [VS Code extension](https://marketplace.visualstudio.com/items?itemName=jonathansolarz.modern-turbo-pascal-ui), [repo with all ports](https://github.com/jsolarz/Modern-Turbo-UI-Color-Scheme). Use the original for nostalgia. Use the Nord variant for long-term readability. Or use something else. The point is to choose deliberately.

---

_Part of a series of side projects: AWS visualization, building management, RSS reader, delivery-as-code, and the tools that make the work bearable._
