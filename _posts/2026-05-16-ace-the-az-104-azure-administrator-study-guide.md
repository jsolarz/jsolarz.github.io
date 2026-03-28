---
title: "Ace the AZ-104: A Practical Study Guide for the Azure Administrator Exam"
date: 2026-05-16
slug: ace-the-az-104-azure-administrator-study-guide
author: Jonathan Solarz
categories: azure certification learning
excerpt: How to prepare for the Microsoft Azure Administrator (AZ-104) exam: skills measured, what to prioritize, and a study approach that sticks.
---

# Ace the AZ-104: A Practical Study Guide for the Azure Administrator Exam

The AZ-104 (Microsoft Azure Administrator) exam is the right certification for anyone who manages Azure resources day to day: identities, storage, compute, networking, and monitoring. This post is a practical study guide—what the exam covers, what to prioritize, and how to prepare so the knowledge sticks.

## Exam at a Glance

- **Format:** Multiple-choice, case studies, possibly some drag-and-drop or list-building. Timed; typically 40–60 questions.
- **Scope:** Manage Azure identities and governance, storage, compute, virtual networking, and monitoring. You're tested on doing the job, not on selling Azure.
- **Passing:** Check the official page for current passing score and duration; they update periodically.

## Skills Measured (and What to Do)

**1. Manage Azure identities and governance (20–25%)**  
Azure AD (users, groups, roles), RBAC, subscriptions, management groups, Azure Policy. You need to know how to create and assign roles, how to scope policies, and how to use Azure AD for access control. Hands-on: create a few users and groups, assign RBAC at different scopes (resource, resource group, subscription), create a custom role or policy. This area is foundational; get it solid.

**2. Implement and manage storage (15–20%)**  
Storage accounts (blob, file share, queue), replication options, access tiers, security (SAS, encryption, network rules). Know when to use which storage type and how to configure it. Hands-on: create storage accounts, upload blobs, set up a file share, try lifecycle management or replication. Understand the cost and redundancy trade-offs.

**3. Deploy and manage Azure compute (20–25%)**  
VMs, VM scale sets, App Service, containers (ACI, AKS basics). You need to know how to create and configure VMs, how to use scale sets for scaling, and how App Service fits (web apps, deployment slots, scaling). Hands-on: deploy a VM (and resize it), create an App Service app, run a container in ACI. Know the difference between IaaS and PaaS in practice.

**4. Implement and manage virtual networking (20–25%)**  
VNets, subnets, NSGs, Azure DNS, load balancers, VPN gateway basics. This is heavy on the exam. You need to know how to design a simple VNet, how NSGs work (inbound/outbound rules, service tags), and how to connect networks (VNet peering, VPN). Hands-on: create a VNet with subnets, add NSGs, deploy a VM into it, test connectivity. Understand public vs private IPs and when you need a gateway.

**5. Monitor and maintain Azure resources (10–15%)**  
Azure Monitor, Log Analytics, alerts, action groups, backup and recovery (Azure Backup, recovery services). Know how to create an alert, how to use Log Analytics workspace and basic KQL, and how backup/recovery is configured. Hands-on: set up an alert rule, run a simple KQL query, configure backup for a VM. You don't need to be a KQL expert; you need to know it exists and how to get started.

## Study Approach

- **Hands-on first.** Use a subscription (trial or work) and do the tasks. Create resources, break them, fix them. The exam is scenario-based; you'll do better if you've done the operations.
- **Use the official outline.** Microsoft publishes the skills measured. Use it as a checklist. For each bullet, either do it in the portal/CLI or read the doc and then do it.
- **Practice exams last.** Use them to get used to question style and timing. Don't memorize answers. If you can explain why the right answer is right and why the wrong ones are wrong, you're ready.
- **Rough timeline:** With some prior Azure use, 4–6 weeks of focused study (a few hours most days) is realistic. From zero, add time for concepts (subscriptions, regions, resource groups).

## Resources That Help

- **Microsoft Learn:** Free modules aligned to AZ-104. Use them as the spine; do the exercises.
- **Docs:** When you're stuck, go to the official Azure docs for the service. They're the source of truth.
- **Practice exams:** Any reputable provider. The goal is question style and pacing, not braindumps.

## After AZ-104

AZ-104 is the admin cert. If you're heading toward design (AZ-305) or specialty certs, you'll build on this. The same approach applies: hands-on, outline as checklist, practice exams for readiness. Good luck.

---

_Related: [Studying for the AWS Solutions Architect Associate](/blog/post.html?slug=studying-for-the-aws-solutions-architect-associate-exam) (same hands-on-first approach for another cloud)._
