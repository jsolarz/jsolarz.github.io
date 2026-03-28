---
title: "Designing Resilient Cloud Architectures"
date: 2026-04-11
slug: designing-resilient-cloud-architectures
author: Jonathan Solarz
categories: architecture cloud azure
excerpt: Principles and patterns for building cloud systems that absorb failure: redundancy, boundaries, and designing for the things that will go wrong.
---

# Designing Resilient Cloud Architectures

Resilience is not "we have a backup." It's "when a component fails, the system degrades in a known way and recovers without manual heroics." That requires design. This post is about the principles I use when designing for resilience in the cloud.

## Define What "Resilient" Means

Start with requirements. What is the acceptable window of unavailability? What is the maximum acceptable data loss (RPO)? How quickly must the system recover (RTO)? Without those, "resilient" is a vibe. With them, you have a target. Multi-AZ might be enough. Multi-region might be overkill or non-negotiable depending on the answer. Same for backup frequency, replication lag, and failover strategy.

## Redundancy at the Right Layer

Redundancy everywhere is expensive and often unnecessary. Redundancy in the wrong place is useless. Identify single points of failure: one AZ, one instance, one database, one queue. Then add redundancy where failure would violate your RTO/RPO. Databases: multi-AZ deployment, read replicas, or cross-region if you need disaster recovery. Compute: scale sets or multiple instances behind a load balancer. Queues and caches: consider what happens when they're unavailable—do you need a DLQ, a fallback path, or is "degraded" acceptable for a while? Design the failure mode. "We have two of everything" is not a strategy if you haven't decided what happens when one of them dies.

## Boundaries and Blast Radius

A failure in one component should not take down the whole system. That means boundaries: failure containment. Use availability zones so a single AZ outage doesn't kill the app. Use separate queues, storage accounts, or subscriptions for workloads that must not affect each other. Design so that the blast radius of a misconfiguration or a bad deploy is limited. Circuit breakers and bulkheads are not just microservice buzzwords—they're how you stop one failing dependency from cascading.

## Stateless Where Possible

State is the enemy of easy recovery. Where you can, make compute stateless: scale-out instances that don't hold unique data, so any instance can serve any request. Put state in a store that's designed for durability and replication (database, queue, blob storage). When an instance dies, you don't lose anything; you just have one fewer instance until the orchestrator replaces it. This doesn't apply to every workload, but the more stateless you are, the simpler resilience becomes.

## Observability Before You Need It

You can't recover what you can't see. Logging, metrics, and alerts need to be in place before an incident. Know what "healthy" looks like and what "degraded" or "failed" looks like. Alerts should fire when something is wrong, not when a user reports it. Post-mortems depend on data. Design observability into the architecture, not as an afterthought.

## Summary

- **Define RTO/RPO** so you know what you're designing for.
- **Redundancy at the right layer**—eliminate single points of failure that matter.
- **Boundaries and blast radius**—contain failure so one fault doesn't cascade.
- **Stateless compute** where possible so recovery is "replace and reroute."
- **Observability first** so you can detect, diagnose, and recover.

Resilience is a property of the design, not a feature you add at the end. Get the requirements clear, then build the architecture to meet them.
