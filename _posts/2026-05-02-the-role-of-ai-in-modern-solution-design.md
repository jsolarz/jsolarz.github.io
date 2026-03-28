---
title: "The Role of AI in Modern Solution Design"
date: 2026-05-02
slug: the-role-of-ai-in-modern-solution-design
author: Jonathan Solarz
categories: ai architecture design
excerpt: AI is changing how we design systems—not by replacing the architect but by accelerating research, checking assumptions, and filling in boilerplate. Where it helps and where it doesn't.
---

# The Role of AI in Modern Solution Design

AI is transforming how we design solutions. Not by replacing the architect—by changing what we spend time on. This post is about where AI actually helps in solution design and where it doesn't.

## What AI Is Good For

**Research and summarization.** Need a comparison of two services, or a summary of best practices for a pattern? AI can pull from documentation and common knowledge and give you a starting point. You still validate against the actual docs and your constraints, but you get to "good enough draft" faster.

**Checking assumptions.** "Does this service support multi-region replication?" "What's the rate limit on this API?" Asking the model can surface answers you'd otherwise hunt for. Again, verify—models hallucinate. Use it as a pointer, not a source of truth.

**Boilerplate and structure.** Architecture decision records, RFC outlines, checklist templates, even stub code for a known pattern. The repetitive part of documentation and implementation is where AI saves time. You edit and own the result; the model does the first pass.

**Exploring alternatives.** "What are three ways to solve this?" can generate options you hadn't considered. The architect's job is then to evaluate them against requirements, cost, and risk—not to accept the first answer.

## What AI Doesn't Replace

**Judgment.** Trade-offs—cost vs. resilience, simplicity vs. flexibility—depend on context the model doesn't have. Your organization's risk tolerance, existing commitments, and political constraints are yours. AI can't make those calls.

**Ownership of the design.** The design has to be coherent with the rest of the system and with the team's capabilities. That coherence comes from a human who holds the picture. AI suggests; you decide.

**Stakeholder conversation.** Understanding what the business actually needs, negotiating scope, and building trust happen in conversation. AI doesn't sit in those meetings. It can help you prepare or document; it can't replace the dialogue.

**Accountability.** When a design fails or a requirement was missed, someone is accountable. That's the architect and the team, not the model.

## How I Use It

I use AI as a research and drafting partner. I define the constraints (volatility, taxonomy, interfaces) and use the model to fill in options, summarize docs, and generate first drafts. I review everything. The output that ships has my name on it and reflects my decisions. That's the role of AI in my solution design: accelerate and augment, not replace.

---

_Summary: AI helps with research, checking assumptions, boilerplate, and exploring options. It doesn't replace judgment, ownership, stakeholder dialogue, or accountability. Use it to go faster; own the result._
