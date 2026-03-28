---
title: "The IDesign Method: Taxonomy, Volatility, and Closed Architecture"
date: 2026-03-21
slug: idesign-method-taxonomy-volatility-and-closed-architecture
author: Jonathan Solarz
categories: architecture idesign design
excerpt: One place to understand IDesign: why functional decomposition breaks, the four component types, and the dependency rule that keeps change local. With pointers to deeper posts.
---

# The IDesign Method: Taxonomy, Volatility, and Closed Architecture

I've written about volatility-based decomposition and applied it to real projects (AwsViz, BMS, MiniTui). This post is the single reference: what IDesign is, why the usual alternative fails, and how the taxonomy and closed architecture work together. If you want the "why design around change" story, see [IDesign Method: Designing for Change, Not Requirements](/blog/post.html?slug=idesign-method-volatility-based-decomposition). If you want a full application example, see [Architecture for Change: Volatility-Based Decomposition](/blog/post.html?slug=architecture-for-change-volatility-based-decomposition).

## The Mistake: Decompose by Function

The natural instinct is to slice the system by what it does: an Ec2Service, an S3Service, a ShippingService, a PaymentService. Each component owns a functional area. The problem is that requirements and integrations change. When they do, change ripples across those boundaries. Add a new EC2 API surface or change how you correlate instances with security groups, and suddenly the "service" that seemed tidy is touching three others. Functional decomposition couples the architecture to the current shape of the world. When the world changes, the architecture cracks.

IDesign asks a different question: **what might change?** Not "what does the system do?" but "along which axes will this system evolve?" Each axis of change is a volatility. You give each volatility a home—one component (or a small, cohesive set). When something changes, it stays in that component. The rest of the system doesn't have to move.

## The Taxonomy: Four Component Types

IDesign defines four types, each tied to a kind of volatility:

**Managers** — Workflow and orchestration. They know *when* to do things, not *how*. A RefreshManager runs the discover → enrich → build graph → publish cycle. It doesn't know how to call the EC2 API or how to analyze security; it calls Accessors and Engines and coordinates the flow. Volatility: process and workflow (when we do steps, in what order, with what retries).

**Engines** — Business logic and algorithms. They know *how* to compute, not *where* data lives. Pure: parameters in, results out. No I/O, no Accessors, no async calls to the outside world. A SecurityEngine receives a graph and returns a list of findings. Volatility: rules, algorithms, and heuristics.

**Accessors** — Resource access. They know *where* data lives (APIs, databases, files), not *what* it means. An Ec2Accessor calls the EC2 API and returns normalized domain types. It doesn't decide whether a security group is dangerous; that's the Engine. Volatility: technology and shape of external systems.

**Clients** — Presentation and entry points. They know *how to render* and how to initiate use cases, not *what* to render (that comes from Managers/projections). TUI, web app, CLI: swap the client, the rest stays. Volatility: form factor and UX.

So: **when** (Managers), **how** (Engines), **where** (Accessors), **render** (Clients).

## Closed Architecture: The Dependency Rule

Dependencies flow one way:

- **Clients** call **Managers** (and only Managers).
- **Managers** call **Engines** and **Accessors**. They do not call other Managers (except in documented coordination cases; otherwise use an event bus or similar).
- **Engines** call nothing. They receive data as arguments and return results.
- **Accessors** call nothing in your domain. They talk to the outside world.

So: Clients → Managers → Engines and Accessors. **Never reverse.** An Engine never calls an Accessor. A Manager never calls a Client. An Accessor never calls an Engine.

Why this helps: volatility tends to decrease as you go down. Workflows change more often than business rules; business rules more often than the shape of a third-party API. By forcing dependencies downward, a change in "where" (new database, new API version) stays in Accessors. A change in "how" (new security rule) stays in an Engine. A change in "when" (new step in the refresh) stays in a Manager. You don't get "we changed the API and now we're touching seven layers."

## Contract-First and Testability

Interfaces live in a Contracts (or equivalent) project. Implementations implement those interfaces. That gives you:

- **Contract-first.** You define the shape before implementation. When using AI or a team, the contract is the spec; nobody invents a new signature.
- **Testability.** Engines are pure, so you pass data in and assert on results. No mocks. Accessors are I/O; you mock the interface in tests for Managers. The taxonomy makes it obvious what to stub and what to run for real.

## In Short

- **Decompose by volatility**, not by function. One axis of change → one (or a few) components.
- **Taxonomy:** Managers (when), Engines (how, pure), Accessors (where), Clients (render).
- **Closed architecture:** Clients → Managers → Engines and Accessors. Never reverse, never skip.
- **Contract-first** and pure Engines keep the system testable and give AI (and humans) a clear target.

I use this on every non-trivial codebase: AwsViz, BMS, the RSS reader, MiniTui (the TUI framework). The method is the same; the volatilities are different. Once you have the taxonomy and the rule, the only real work is the volatility list and sticking to it.

---

_More: [Designing for Change, Not Requirements](/blog/post.html?slug=idesign-method-volatility-based-decomposition) (concept and vault metaphor), [Architecture for Change](/blog/post.html?slug=architecture-for-change-volatility-based-decomposition) (AwsViz applied)._
