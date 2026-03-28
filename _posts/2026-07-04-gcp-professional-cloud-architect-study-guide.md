---
title: "GCP Professional Cloud Architect: The AZ-305 Equivalent Study Guide"
date: 2026-07-04
slug: gcp-professional-cloud-architect-study-guide
author: Jonathan Solarz
categories: gcp certification architecture
excerpt: The Google Cloud Professional Cloud Architect (PCA) exam is the design-focused cert—the closest equivalent to AZ-305. What it tests and how to prepare.
---

# GCP Professional Cloud Architect: The AZ-305 Equivalent Study Guide

If you've done **AZ-305 (Designing Microsoft Azure Infrastructure Solutions)** or **AWS Solutions Architect Professional**, the **Google Cloud Professional Cloud Architect (PCA)** is the GCP equivalent. It tests your ability to design, plan, and manage cloud solutions that are secure, scalable, and aligned with business requirements. This post covers what the exam emphasizes and how to study.

## AZ-305 / SAP vs PCA: Rough Mapping

| AZ-305 / SAP domain | GCP Professional Cloud Architect equivalent |
|---------------------|---------------------------------------------|
| Design identity, governance, monitoring | IAM, Resource Manager, organization policies, Cloud Audit Logs, Cloud Monitoring strategy |
| Design data storage solutions | Cloud Storage, BigQuery, Cloud SQL, Spanner, Firestore, Pub/Sub—when to use which, trade-offs |
| Design business continuity | RTO/RPO, backup and DR patterns, multi-region, HA design |
| Design infrastructure and migration | Compute (GCE, GKE, Cloud Run, App Engine), networking (VPC, hybrid), migration (Migrate for Compute, etc.) |

PCA is design- and scenario-heavy. You're choosing architectures, justifying trade-offs, and considering cost, security, and compliance. Passing Associate Cloud Engineer first is recommended.

## What the PCA Exam Emphasizes

- **Designing and planning.** Solution architecture that meets business and technical requirements. You need to translate requirements into GCP services and patterns. Multi-project structure, networking, identity, and data flow.
- **Managing and provisioning.** Not just design on paper—you're expected to know how to implement and manage (IAM, Resource Manager, automation). The line between "design" and "implement" is blurrier than on some Azure/AWS exams.
- **Designing for security and compliance.** IAM best practices, VPC Service Controls, organization policies, encryption, compliance (e.g. shared fate, shared responsibility). Security is woven into every domain.
- **Analyzing and optimizing.** Performance, cost, reliability. Right-sizing, committed use, cost allocation. You're expected to recommend improvements and justify trade-offs.
- **Managing implementation.** Migration strategies, hybrid and multi-cloud, DevOps (CI/CD, IaC). The exam assumes you're guiding implementation, not just drawing diagrams.

## Study Approach

- **ACE first.** If you haven't passed Associate Cloud Engineer, do that. PCA assumes you can operate GCP; it adds design and strategy.
- **Know GCP services in depth.** For each major service, know: what it's for, limits, pricing model, HA/DR options, and when to choose it over alternatives. Scenarios will ask for "best" or "most cost-effective" or "most secure."
- **Practice design scenarios.** Take a scenario (e.g. "global app, data residency in EU, need analytics and ML") and design: projects/folders, IAM, network, storage, compute, data pipeline, monitoring. Compare to Google's architecture framework and exam-style answers.
- **Case studies.** The exam has case studies. Read them carefully; questions refer back to them. Practice under time pressure.
- **Rough timeline.** With AZ-305 or SAP experience, 6–10 weeks of focused study is typical. PCA is demanding; hands-on design work in a lab account helps.

## After PCA

You'll have a design-focused cert on GCP. Combined with AZ-305 and SAP (or SAA), you have a multi-cloud design profile. Many roles value "I can design on more than one cloud" for migration, hybrid, or vendor-neutral architecture work.

---

_Related: [AZ-305 key topics](/blog/post.html?slug=az-305-key-topics-and-how-to-prepare), [AWS Solutions Architect Professional](/blog/post.html?slug=aws-solutions-architect-professional-study-guide), [GCP Associate Cloud Engineer](/blog/post.html?slug=gcp-associate-cloud-engineer-study-guide)._
