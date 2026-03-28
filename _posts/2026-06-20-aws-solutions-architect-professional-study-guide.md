---
title: "AWS Solutions Architect Professional: The AZ-305 Equivalent Study Guide"
date: 2026-06-20
slug: aws-solutions-architect-professional-study-guide
author: Jonathan Solarz
categories: aws certification architecture
excerpt: The AWS Solutions Architect Professional (SAP-C02) is the design-focused advanced cert—the closest equivalent to AZ-305. What it tests and how to prepare.
---

# AWS Solutions Architect Professional: The AZ-305 Equivalent Study Guide

If you've done **AZ-305 (Designing Microsoft Azure Infrastructure Solutions)**, the **AWS Certified Solutions Architect – Professional (SAP-C02)** is the closest equivalent. Both are design-focused: you're choosing and justifying architectures for identity, storage, business continuity, and infrastructure across complex, multi-account or hybrid scenarios. This post covers what SAP-C02 tests and how to study for it.

## AZ-305 vs SAP-C02: Rough Mapping

| AZ-305 domain | SAP-C02 equivalent |
|---------------|---------------------|
| Design identity, governance, monitoring | IAM, Organizations, SCPs, Config, CloudTrail, monitoring strategy |
| Design data storage solutions | S3, EBS, EFS, RDS, DynamoDB, Aurora, storage architecture and trade-offs |
| Design business continuity solutions | RTO/RPO, backup (AWS Backup), DR (multi-AZ, multi-region), HA patterns |
| Design infrastructure solutions | Compute (EC2, Lambda, ECS, etc.), networking (VPC, hybrid), migration, cost |

SAP-C02 goes deeper than the Associate (SAA-C03). You get multi-account and hybrid scenarios, migration, and more emphasis on trade-offs and cost optimization. Passing SAA first is recommended.

## What SAP-C02 Emphasizes

- **Design for complex requirements.** Multi-account (Organizations, SCPs), hybrid (Direct Connect, VPN, Outposts), compliance (Config, GuardDuty, security best practices). You're not just picking a service; you're designing a system that meets constraints.
- **Design for new solutions and migration.** Lifting and shifting vs refactoring, migration tools (Migration Hub, DMS, SMS), and how to phase a migration. You need to know when to recommend what.
- **Design for organizational complexity.** Multiple accounts, centralized logging and security, cross-account access. The exam assumes you're designing for enterprises, not a single account.
- **Cost and performance.** Right-sizing, Reserved vs Spot vs On-Demand, cost allocation, and performance trade-offs. Design decisions must consider cost.

## Study Approach

- **SAA first.** If you haven't passed Solutions Architect Associate, do that. SAP builds on it. AZ-305 experience helps because the design mindset is the same; the services are different.
- **Know the services in depth.** For each major service (VPC, IAM, S3, RDS, Lambda, etc.), know limits, pricing model, HA/DR options, and when to use it vs an alternative. Scenarios will ask "best" or "most cost-effective" or "most secure."
- **Practice design decisions.** Take scenarios (e.g. "global e-commerce, compliance in EU and US, multi-account") and write down: identity, network, storage, compute, DR, cost. Compare to AWS well-architected guidance and exam-style answers.
- **Practice exams.** SAP questions are long and scenario-heavy. Get used to reading carefully and eliminating wrong answers. Understand why each distractor is wrong.

## Rough Timeline

With AZ-305 or SAA under your belt, 6–10 weeks of focused study is typical. SAP is harder than SAA; expect more scenarios and more depth. Hands-on design work (even in a lab account) helps more than passive video consumption.

---

_Related: [AZ-305 key topics](/blog/post.html?slug=az-305-key-topics-and-how-to-prepare), [Studying for the AWS Solutions Architect Associate](/blog/post.html?slug=studying-for-the-aws-solutions-architect-associate-exam), [AWS SysOps Associate](/blog/post.html?slug=aws-sysops-administrator-associate-study-guide)._
