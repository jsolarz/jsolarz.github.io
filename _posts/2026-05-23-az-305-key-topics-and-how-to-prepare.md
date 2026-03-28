---
title: "AZ-305: Key Topics and How to Prepare for Designing Azure Infrastructure"
date: 2026-05-23
slug: az-305-key-topics-and-how-to-prepare
author: Jonathan Solarz
categories: azure certification architecture
excerpt: What the AZ-305 exam actually tests: design domains, weighting, and how to study for a design-focused certification.
---

# AZ-305: Key Topics and How to Prepare for Designing Azure Infrastructure

AZ-305 (Designing Microsoft Azure Infrastructure Solutions) is the design counterpart to AZ-104. You're not asked to click through the portal—you're asked to choose and justify designs: identity, storage, continuity, infrastructure. This post covers the key topics and a practical way to prepare.

## Exam Focus

AZ-305 is scenario-based. You get situations like "Company X needs to support Y with constraint Z; which approach is best?" You need to know service capabilities, trade-offs, and when to use what. The skills measured are organized into four domains.

## Domain 1: Design identity, governance, and monitoring (25–30%)

- **Logging and monitoring:** What to log, where (Log Analytics, Diagnostic settings), retention, cost. When to use Azure Monitor vs Application Insights.
- **Authentication and authorization:** Azure AD, conditional access, MFA, hybrid identity (AD Connect, etc.), when to use app registrations vs enterprise apps.
- **Governance:** Management groups, policy (built-in and custom), initiatives, compliance. How to scope and what to use for cost, security, and compliance.

**Study tip:** Map each requirement type (audit, cost, security) to a tool. Do a small design: "How would I add governance to a new subscription?"

## Domain 2: Design data storage solutions (20–25%)

- **Relational:** Azure SQL (single, elastic pool, managed instance), when to use which. Backup, HA, geo-replication.
- **Non-relational:** Cosmos DB (consistency levels, APIs), Storage (blob, file, queue), when to use table storage or Cosmos. Trade-offs: cost, scale, consistency.
- **Data integration:** Data Factory, Synapse, when to use what for ETL and analytics.

**Study tip:** For each workload type (transactional, analytics, files, queues), know the recommended service and the main alternative. Understand RPO/RTO implications for each.

## Domain 3: Design business continuity solutions (15–20%)

- **Backup and disaster recovery:** Azure Backup, Recovery Services vault, backup policy, restore options. When to use Azure Site Recovery and what it does.
- **High availability:** Multi-AZ, multi-region, load balancing, failover. SLA implications. When "resilient in one region" is enough vs when you need DR.

**Study tip:** Tie every recommendation to RTO/RPO. Practice: "Given RTO 4 hours and RPO 1 hour, what would I design?"

## Domain 4: Design infrastructure solutions (30–35%)

- **Compute:** VM sizing, scale sets, App Service, AKS, ACI, serverless. When to use IaaS vs PaaS vs containers.
- **Networking:** VNet design, subnets, NSGs, peering, VPN, ExpressRoute. Hybrid and multi-region patterns.
- **Application architecture:** Microservices, event-driven, API management, messaging (Service Bus, Event Grid). When to use which pattern.
- **Migrations:** Assessment, lift-and-shift vs refactor, migration tools (Azure Migrate, etc.). What to consider for data and dependencies.

**Study tip:** This is the largest domain. Focus on "best fit" scenarios: given workload characteristics (latency, scale, state, compliance), which compute and storage and network? Draw simple diagrams and justify each choice.

## How to Prepare

- **Know the services.** You don't need to administer them (that's AZ-104), but you need to know what they do, their limits, and their cost/resilience profile.
- **Practice design decisions.** Take a scenario (e.g. "e-commerce app, global, must be highly available") and write down: identity, storage, compute, network, DR. Compare your answer to best-practice guidance.
- **Use the official outline.** Microsoft's "skills measured" is the source of truth. Use it as a checklist.
- **Practice exams.** Get used to the question format. Again, understand why answers are right or wrong; don't memorize.

AZ-305 builds on AZ-104. If you've passed AZ-104 and have done some design work, you're in a good position. If you're new to Azure, do AZ-104 first—the admin experience makes the design questions much easier to answer.

---

_Related: [Ace the AZ-104](/blog/post.html?slug=ace-the-az-104-azure-administrator-study-guide), [Studying for the AWS Solutions Architect Associate](/blog/post.html?slug=studying-for-the-aws-solutions-architect-associate-exam)._
