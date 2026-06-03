---
title: "The Work Changed Shape"
date: 2026-08-18
slug: the-work-changed-shape
excerpt: AI coding agents did not replace the developer. They replaced the parts of the job that were never the job. The thinking stayed. The overhead compressed. What changed is how much of your day you spend deciding versus executing.
author: Jonathan Solarz
categories: ai development architecture
image: /img/blog/work-changed-shape.jpg
scene: |
  The craft was never the typing. It was the thinking between the keystrokes. AI agents absorbed the mechanical cycle—the reading, writing, building, testing loop—and handed back hours. The question now is what you do with those hours. The answer reveals whether you were a developer or a typist.
---

# The Work Changed Shape

I did not wake up one morning and decide to work differently. It happened the way most real shifts happen: gradually, then all at once. One day I noticed I had not opened a browser tab to search for an API signature in weeks. I had not manually run a test suite in longer than that. The build-check-fix cycle that used to punctuate my afternoons had compressed into something I barely noticed anymore.

Nothing dramatic happened. I still architect systems. Still debug production issues. Still write CDK stacks and review pull requests and argue about data models. The work is the same work. But it changed shape.

## The Job Was Never the Typing

Here is something I believed for years without examining it: the developer's job is to write code. It sounds obvious. It is also wrong.

The job is to make decisions. What to build. How to structure it. Where to put the boundary. When to say no. Code is the artifact those decisions produce. Important, yes. But secondary to the judgment that shaped it.

Most of what I did on a daily basis was not deciding. It was executing. Read four files to understand a flow. Grep for callers. Write the change. Run the build. Fix the type error. Run it again. Write a test. Run it again. Commit. That mechanical loop—read, understand, change, verify—consumed hours. The actual decision that preceded it took minutes.

AI agents compressed the loop. The decision still takes the same amount of thought. The execution takes a fraction of the time.

## What a Day Looks Like Now

I describe what I want. Not in pseudocode. Not in formal specs. In the same language I would use to explain it to a senior colleague sitting next to me.

"The PDF viewer is broken. Here is the error from CloudWatch. Fix it."

"Add CORS to these S3 buckets. The KB bucket is imported, so CDK cannot set the property directly. Use a custom resource."

"Write a change request for a mailbox ingestion feature. Here is the architecture context."

The agent reads the code I would have read. It proposes the change I would have written. It runs the build. It finds the test that broke and updates it. It commits with a message that matches the project's conventions.

I review. I steer. I catch the thing it missed. Sometimes I reject the approach entirely and explain why. Sometimes I accept it and move on in thirty seconds.

The feedback loop is identical to working with a fast, competent colleague. The difference is latency. What used to be a morning is now a conversation.

## The Skills That Got More Valuable

When execution compresses, judgment expands to fill the space. The skills that differentiate good engineers from fast typists become the entire job.

**System thinking.** Understanding how a change in the nginx config affects the PDF viewer, which affects the presigned URL flow, which depends on S3 CORS, which CDK cannot set on an imported bucket. That chain of reasoning is the work. The agent can execute each step. It cannot see the chain without you drawing it.

**Knowing what to ask.** The agent responds to intent. Vague intent produces vague output. Precise intent—"the problem is the MIME type on .mjs assets, not the presigned URL"—produces precise solutions. The quality of the output tracks the quality of your diagnosis.

**Recognizing wrong answers.** The agent will confidently produce code that compiles, passes tests, and solves the wrong problem. If you cannot read its output critically—the way you read a junior developer's PR—you ship bugs faster than before. Speed without judgment is not a feature.

**Architectural taste.** When to split a file. When a custom resource is the right pattern versus a hack. When the "quick fix" creates drift that bites you next quarter. Taste is not teachable to an agent. It is the thing you bring that the agent cannot generate on its own.

These were always the skills that mattered. The difference now is they are the only ones that matter. The mechanical skills—fast typing, memorized APIs, knowing grep flags by heart—got commoditized overnight.

## The IDE Analogy

Nobody introduces themselves as "a developer who uses an IDE." Nobody writes blog posts about whether IntelliSense is cheating. The IDE absorbed into the practice so completely that we forgot it was ever a separate tool. It is just how development works.

AI agents are on that trajectory.

Today, using one feels like a choice. A tool you adopt or reject. A workflow you justify to your manager. Give it three years. Maybe less. It will be as unremarkable as syntax highlighting. The developers who rejected it will not have moral high ground. They will have slower feedback loops.

This is not hype. It is the same absorption pattern that happened with version control, with CI/CD, with containerization, with cloud itself. Each one started as "a tool some teams use." Each one became "how things are done." The transition period always feels more dramatic than it looks in retrospect.

## What Did Not Change

I still own the outcome. The agent does not understand the customer. It does not know that this particular field matters to the regulatory team and that one does not. It does not make trade-offs between delivery speed and technical debt. It does not push back on a bad requirement.

It does not know when to say no.

That remains human work. Judgment about priorities. Empathy for users. The political awareness to know which shortcuts will haunt you and which are acceptable. The willingness to argue for the right approach even when the shortcut is easier to explain.

The agent is not a replacement for the architect. It is an amplifier. It makes the architect's decisions manifest faster. But if the decisions are bad, they manifest faster too. Garbage in, garbage out—just with better formatting and a passing test suite.

## The Honest Version

I ship more in a day than I used to ship in a week. That is not an exaggeration. The constraints moved. The bottleneck used to be mechanical execution. Now it is my own capacity to make decisions, review output, and maintain context across a complex system.

Some days that capacity runs out by 3 PM. The agent can keep going. I cannot. The ceiling moved from "how fast can I type" to "how much judgment do I have in a day." That is a different kind of exhaustion, and a different kind of limitation.

But it is the right limitation. I would rather be exhausted from making decisions than from running test suites.

## What This Means for the Profession

The role is not disappearing. It is narrowing to its essence. The parts that were always the real job—design, diagnosis, trade-offs, system thinking—are now most of the job instead of a fraction of it. The parts that were overhead—reading, writing, building, testing, committing—still happen. They just happen at conversation speed instead of keyboard speed.

If your value was always in the thinking, nothing threatens you. Your leverage just increased.

If your value was in typing speed and memorized syntax, the ground shifted under you. Not because an agent took your job. Because the job stopped being what you thought it was.

The work changed shape. The craft did not.

---

*Feel free to share your thoughts by emailing me or reaching out on social media.*
