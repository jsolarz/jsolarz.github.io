---
title: "GCP Associate Cloud Engineer: The AZ-104 Equivalent Study Guide"
date: 2026-06-27
slug: gcp-associate-cloud-engineer-study-guide
author: Jonathan Solarz
categories: gcp certification learning
excerpt: The Google Cloud Associate Cloud Engineer (ACE) exam is the operations-focused cert—the closest equivalent to AZ-104. What it covers and how to prepare.
---

# GCP Associate Cloud Engineer: The AZ-104 Equivalent Study Guide

If you've done **AZ-104 (Azure Administrator)** or **AWS SysOps Administrator Associate**, the **Google Cloud Associate Cloud Engineer (ACE)** is the GCP equivalent. It tests your ability to deploy, monitor, and maintain applications and infrastructure on Google Cloud. This post is a practical study guide—what the exam covers and how to prepare.

## AZ-104 / SOA vs ACE: Rough Mapping

| AZ-104 / SysOps area | GCP Associate Cloud Engineer equivalent |
|----------------------|----------------------------------------|
| Identity and access | IAM (roles, service accounts, policy), Resource Manager (folders, projects) |
| Storage | Cloud Storage (buckets, lifecycle), Persistent Disk, Filestore |
| Compute | Compute Engine (VMs), GKE basics, Cloud Run, App Engine basics |
| Networking | VPC, subnets, firewall rules, Cloud Load Balancing, Cloud DNS |
| Monitoring and operations | Cloud Monitoring (Metrics, Logs), Cloud Logging, alerting, deployment (Cloud Build, Deployment Manager / Terraform) |

The job is the same across clouds: operate and support workloads. The services and names differ. GCP emphasizes APIs and automation; the exam expects you to know both console and gcloud (and sometimes Terraform).

## What the ACE Exam Emphasizes

- **Setting up and managing solutions.** Provisioning resources, configuring IAM, setting up VPCs and connectivity. You're expected to know how to do it, not just what to do.
- **Deploying and implementing.** Deploying to Compute Engine, GKE, Cloud Run, or App Engine. Using Cloud Build, Deployment Manager, or Terraform. The exam is practical; you need to have run deployments.
- **Monitoring and logging.** Cloud Monitoring (formerly Stackdriver), Cloud Logging, log-based metrics, alerts. Troubleshooting and ensuring availability.
- **Security and compliance.** IAM best practices, service accounts, encryption, organization policies. Shared responsibility and how to implement controls in GCP.

## Study Approach

- **Hands-on first.** Use Google Cloud Free Tier or a lab account. Create projects, VPCs, VMs, GCS buckets, deploy to Cloud Run, set up monitoring and alerts. The exam is scenario-based; experience matters.
- **Use the exam guide.** Google publishes the exam outline. Use it as a checklist. For each topic, do it in the console or with gcloud (and optionally Terraform).
- **gcloud and console.** You'll see questions that assume you know both. Practice common tasks via gcloud so you're not only dependent on the console.
- **Practice exams.** Get used to question style and length. Don't memorize; understand why answers are right or wrong.
- **Rough timeline.** With AZ-104 or SOA experience, 4–6 weeks of focused study is realistic. You're learning GCP's map; the concepts are familiar.

## After ACE

The next step on GCP is **Professional Cloud Architect** (design-focused, equivalent to AZ-305 / SAP). ACE is the operations track; PCA is the design track. If you're building a multi-cloud profile, AZ-104 + SOA + ACE gives you "I can operate all three" major clouds.

---

_Related: [Ace the AZ-104](/blog/post.html?slug=ace-the-az-104-azure-administrator-study-guide), [AWS SysOps Associate](/blog/post.html?slug=aws-sysops-administrator-associate-study-guide), [GCP Professional Cloud Architect](/blog/post.html?slug=gcp-professional-cloud-architect-study-guide)._
