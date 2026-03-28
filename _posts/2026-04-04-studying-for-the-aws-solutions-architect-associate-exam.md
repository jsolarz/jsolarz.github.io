---
title: "Studying for the AWS Solutions Architect Associate Exam: What Actually Worked"
date: 2026-04-04
slug: studying-for-the-aws-solutions-architect-associate-exam
author: Jonathan Solarz
categories: aws certification learning
excerpt: How I prepared for (and passed) the SAA: domains to prioritize, why hands-on beats passive learning, and how to use practice exams without memorizing answers.
---

# Studying for the AWS Solutions Architect Associate Exam: What Actually Worked

The AWS Solutions Architect Associate (SAA-C03) is the right first AWS cert for most people building or designing on AWS. It tests whether you can design resilient, high-performing, secure, and cost-optimized architectures—not whether you can recite service names. I passed it. This post is what I’d tell someone asking how to study without wasting time.

## What the Exam Actually Tests

The exam is domain-weighted. Design for resilience (multi-AZ, RTO/RPO, backup, DR), performance (caching, scaling, database choice), security (IAM, encryption, network isolation), and cost (right-sizing, Reserved vs Spot, cost allocation). You get scenario questions: “Company X has this constraint; which option is best?” and “Which combination of services meets these requirements?” You need to know service boundaries (when to use Lambda vs EC2, RDS vs DynamoDB, S3 vs EBS), networking (VPC, subnets, security groups, NACLs), and how services integrate (e.g. SQS + Lambda, CloudFront + S3, API Gateway + Lambda). Memorizing every API call won’t help. Understanding *when* and *why* to use a service will.

## Study Strategy: Hands-On First, Theory to Fill Gaps

I don’t retain much from video courses or whitepapers unless I’ve already touched the thing. So the order that worked for me:

1. **Use the services.** Create a VPC, put EC2 in it, lock it down with security groups. Put a Lambda behind API Gateway. Store objects in S3 and serve them via CloudFront. Run a small RDS instance and connect from an app. You don’t need a production system—you need enough to form a mental model. Free tier and a single account are enough.
2. **Map the exam domains to what you built.** For each domain (resilience, performance, security, cost), ask: “What would I change in my mini-architecture to improve this?” That forces you to read the docs for multi-AZ, read‑replicas, encryption, and pricing—with a concrete context.
3. **Use a course or a book as a checklist.** Don’t treat it as the main event. Use it to find gaps: “I’ve never touched X; the course says it’s on the exam; I’ll build something small with X.” Fill the gaps with hands-on, not with more passive watching.
4. **Practice exams last.** Do them to get used to question style and time pressure. If you’re only memorizing answers, you’re not ready. If you can explain *why* the right answer is right and why the wrong ones are wrong, you’re in good shape.

## What to Prioritize

- **Networking (VPC, subnets, public vs private, NAT, security groups, NACLs).** Many questions assume you understand this. Build one VPC with public and private subnets and get traffic flowing.
- **Compute and storage fit.** When to use EC2, Lambda, Fargate; when S3 vs EBS vs EFS; when RDS vs DynamoDB. The exam loves “best fit for this workload.”
- **High availability and DR.** Multi-AZ, multi-region, RTO/RPO, backup and restore. Know the difference between “same AZ,” “multi-AZ,” and “multi-region” and what each service supports.
- **Security.** IAM (roles, policies, least privilege), encryption at rest and in transit, shared responsibility. Don’t skip IAM; it’s everywhere.
- **Cost.** Reserved vs Spot vs On-Demand, cost allocation tags, Cost Explorer. At least know the *concepts* so you can answer “which option is most cost-effective?”

I didn’t try to know every service in depth. I made sure I knew the ones that show up in design scenarios and could reason about the rest from first principles (scaling, durability, consistency, cost).

## How Long It Took (Roughly)

With prior AWS usage (Console and CLI), about 4–6 weeks of focused study: a few hours most days—some building, some course or docs, practice exams in the last 1–2 weeks. If you’re starting from zero AWS, expect longer; the concepts (regions, AZs, IAM, networking) need to settle first. Don’t rush. The goal is to pass because you understand, not because you memorized question banks.

## After the Associate

The Associate is the foundation. The Professional (SAP) goes deeper: hybrid, migration, multi-account, more complex trade-offs. I used the same approach for the Professional: build something that forces you to use the APIs and services (in my case, [AwsViz](https://github.com/jsolarz/aws-account-visualization-tool)—every Accessor I implemented taught me that service at the SDK level). If you passed the Associate with a hands-on approach, you already have a pattern that scales to the next cert.

## Summary

- **Domains:** Design for resilience, performance, security, cost. Scenario-based “best fit” questions.
- **Order:** Hands-on first, then use courses/docs to find gaps, then practice exams for pacing and question style.
- **Focus:** VPC/networking, compute and storage fit, HA/DR, IAM and security, cost concepts.
- **Don’t:** Rely only on videos, or memorize practice exam answers without understanding why.

The Associate is passable with consistent, hands-on study. Build small, map to the domains, fill gaps deliberately, and use practice exams to validate—not to replace—understanding.

---

_Related: [Building on AWS to Learn AWS: A Professional Study Project](/blog/post.html?slug=building-on-aws-to-learn-aws) (using a real project to study for the Professional)._
