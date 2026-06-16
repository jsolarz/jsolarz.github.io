---
title: "Entra ID AWS Application: OIDC, BFF, and the Failures Nobody Warns You About"
date: 2026-08-25
slug: entra-id-aws-application-oidc
excerpt: Microsoft login works until the callback hits nginx, ALB never sees /signin-oidc, or Entra rejects a redirect URI that matched last week's stack. On Fargate, Entra is a BFF and routing problem dressed as identity.
author: Jonathan Solarz
categories: aws azure security architecture dotnet
image: /img/blog/entra-aws-oidc-bff.jpg
series: entra-aws-app-auth
series_part: 1
---

# Entra ID AWS Application: OIDC, BFF, and the Failures Nobody Warns You About

You shipped the SPA. You shipped the API. Bedrock extraction runs. Aurora holds metadata. OpenSearch answers semantic queries. Then someone says: “Production needs **Microsoft Entra** login.” Fine. You register an app. You add `Microsoft.Identity.Web`. You deploy to Fargate behind CloudFront.

The login button sends you to Microsoft. Microsoft sends you back. And then—nothing. Or worse, a loop. Or a 404 on `/signin-oidc` that nginx serves with a cheerful React shell.

**Entra ID AWS application** integration is not “drop in OIDC middleware.” It is identity **plus** edge routing **plus** outbound networking **plus** a BFF contract your frontend did not have in dev. This post is what we learned wiring Entra into a document-management platform on AWS—genericized, no customer names, scars included.

![Entra ID OIDC BFF flow: browser, CloudFront, ALB, API on Fargate, Microsoft Entra](/img/blog/entra-aws-oidc-bff.png)

**Not this post:** federating **Azure DevOps** into AWS for deploys. That is pipeline OIDC (IAM roles, `AssumeRoleWithWebIdentity`). See [AWS OIDC Azure DevOps](https://ioni.solarz.me/blog/post.html?slug=ado-aws-oidc-iam-scp). Here we mean **humans** signing into the app.

## In Brief

- Use the **BFF pattern**: Entra authorization code flow on the **API**; session cookie to the browser; no access tokens in `localStorage`.
- Set **`ExternalUrl`** when CloudFront (or a custom domain) is the public host—`redirect_uri` must not point at the internal ALB hostname.
- Route **`/auth/*`, `/signin-oidc`, `/signout-oidc`** to the API service on the ALB—not the static client target group.
- Enable **NAT** (or equivalent egress) so Fargate can reach `login.microsoftonline.com` for metadata and token exchange.
- Keep **Mock JWT** and a **secondary Bearer scheme** for local dev and import scripts; register routes **conditionally** so endpoints do not collide.

---

## The Platform Shape (Why Auth Hurts Here)

Picture a research document system:

- React SPA for search, validation queues, uploads.
- .NET **WebApi** BFF in front of a gRPC backend.
- PDFs in S3 → GuardDuty → Step Functions → **Amazon Bedrock** extraction → PostgreSQL + OpenSearch Serverless.
- Deployed on **ECS Fargate** in private subnets, public entry via **ALB** and **CloudFront**.

In sandbox you mocked login: pick a role, get a JWT, store it, call `/api/*` with `Authorization: Bearer`. Fast. Convenient. Completely unlike production Entra.

Production wants **OpenID Connect** with **app roles** from the tenant directory. The browser should never hold a Microsoft access token. The server exchanges the code, validates the ID token, and issues an **HttpOnly cookie**. That is the **Entra ID BFF pattern**—and it changes routing, config, and how your React router decides “am I logged in?”

---

## Target Architecture (ASCII)

```
  Browser                    Edge                         AWS VPC (private)
  ───────                    ────                         ─────────────────

  GET /studies  ──►  CloudFront  ──►  ALB listener
                                           │
                         ┌─────────────────┼─────────────────┐
                         │                 │                 │
                    /api/*  /auth/*   /signin-oidc      /* (SPA)
                         │    /signout-oidc                │
                         ▼                 ▼                 ▼
                    WebApi BFF         WebApi BFF         nginx + static
                    (Fargate)          (Fargate)          (Fargate)
                         │                 │
                         │  HTTPS outbound │ (NAT Gateway)
                         └────────┬────────┘
                                  ▼
                         login.microsoftonline.com
                         (authorize + token endpoints)
```

Three ideas in one diagram:

1. **OIDC callbacks hit the API**, not the SPA container.
2. **Egress** from private tasks to Microsoft is mandatory.
3. **CloudFront** is what Entra must see in redirect URIs—not the ALB DNS name.

---

## The Happy Path (Authorization Code + Cookie)

1. User opens the app → SPA calls `/api/auth/me` → 401.
2. SPA sets `window.location = '/auth/login'` (full page navigation—not client-side routing).
3. API issues **OIDC challenge** → redirect to Microsoft.
4. User signs in; Microsoft redirects to `https://{public-host}/signin-oidc?code=...`.
5. API exchanges code server-side, validates token, maps **`roles`** claims to role principals.
6. API sets **encrypted session cookie** (`HttpOnly`, `Secure`, `SameSite=Lax`).
7. Redirect to `/`; subsequent `/api/*` calls authenticate via cookie.

Logout: `GET /auth/logout` clears the cookie and hits Entra sign-out.

Microsoft documents the web app flow in [Microsoft identity platform and OpenID Connect](https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc). For ASP.NET Core, [Microsoft.Identity.Web](https://learn.microsoft.com/en-us/entra/msal/dotnet/microsoft-identity-web/) is the practical default.

---

## Configuration That Actually Matters

| Setting | Where | Why |
|---------|--------|-----|
| `Auth:Provider` | `EntraId` vs `Mock` | One switch for entire stack behavior |
| `Auth:EntraId:TenantId` / `ClientId` | CDK → ECS env | Issuer and audience validation |
| `Auth:EntraId:ClientSecret` | **Secrets Manager** → ECS secret | Never in git or plain env files |
| `Auth:EntraId:ExternalUrl` | CloudFront or custom domain | Overrides `redirect_uri` on challenge |
| `CallbackPath` | `/signin-oidc` | Must match Entra app registration **exactly** |
| `enableNatGateway` | CDK L1 when Entra on | Outbound HTTPS to Microsoft |

The **`ExternalUrl`** override is the one line that saves you from `AADSTS50011`:

```csharp
options.Events.OnRedirectToIdentityProvider = context =>
{
    if (!string.IsNullOrEmpty(externalUrl))
        context.ProtocolMessage.RedirectUri =
            $"{externalUrl.TrimEnd('/')}{options.CallbackPath}";
    return Task.CompletedTask;
};
```

Without it, the middleware may build `redirect_uri` from the **internal** host the container sees—fine behind a single hostname in dev, fatal behind CloudFront.

---

## Issues We Hit (And Fixes)

![Entra AWS application issues matrix](/img/blog/entra-aws-issues-matrix.png)

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| `AADSTS50011` redirect URI mismatch | Entra registered `https://d123.cloudfront.net/signin-oidc` but challenge used ALB host | `ExternalUrl` + re-register URI in Entra |
| `404` on `/signin-oidc` with SPA HTML | ALB default action sends all paths to client TG | Listener rules: OIDC paths → **API** target group |
| `AmbiguousMatchException` on `/api/auth/me` | Mock **and** Entra route tables both registered | Register **one** mode in `Program.cs` |
| Login loop / instant 401 after success | Cookie `Secure` on HTTP, or wrong site | HTTPS end-to-end; `SameSite=Lax` for top-level redirects |
| API task healthy but auth middleware fails at startup | No route to `login.microsoftonline.com` | NAT on private subnets (`enableNatGateway`) |
| User lands in app with **no role** | Entra sends `roles` array; policies expect `role` | `OnTokenValidated`: explode array into role claims |
| Import scripts fail after Entra cutover | Scripts used mock `POST /api/auth/login` | Keep mock login **or** secondary **JWT Bearer** scheme for automation |
| SPA still navigates to `/login` | Router not BFF-aware | If no `localStorage` token → redirect `/auth/login` |

Most of these are **infrastructure** or **routing** bugs wearing an auth costume. You will grep JWT code for hours before noticing the ALB sent `/signin-oidc` to nginx.

---

## ALB Rules (Concrete)

When API and SPA share one hostname, path-based routing is non-negotiable:

```
Priority 10:  /api/*           → api-target-group
Priority 20:  /auth/*         → api-target-group
Priority 21:  /signin-oidc    → api-target-group
Priority 22:  /signout-oidc   → api-target-group
Priority 23:  /scalar/*       → api-target-group   (optional: OpenAPI UI)
Default:      /*             → client-target-group
```

Miss one OIDC path and Microsoft’s redirect lands in the wrong container. The failure mode looks like “Entra is broken.” It is not. Your listener is.

AWS documents listener rules in [Listener rules for your Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-rules.html).

---

## Dual Mode: Mock vs Entra (Best Practice)

Do not fork the codebase per environment. Use one **`Auth:Provider`** flag:

| Mode | Default scheme | Frontend signal | Good for |
|------|----------------|-----------------|----------|
| `Mock` | JWT Bearer | Token in `localStorage` | Local dev, fast UI work |
| `EntraId` | Cookie + OIDC challenge | No token; cookie session | Production SSO |

Downstream authorization stays identical: same policy names (`Admin`, `Researcher`, …), same role strings (`admin`, `grm`, …). Only the **front door** changes.

**Best practice:** keep a **secondary JWT Bearer** handler in Entra mode for batch importers and integration tests—humans use cookies, machines use scoped secrets. Document which endpoints accept which scheme. Do not disable mock login in Entra mode if operations still depend on scripted imports; gate it with config instead.

---

## Infrastructure Checklist (CDK / ECS)

- [ ] Secrets Manager secret for client secret; execution role can read it.
- [ ] `enableNatGateway: true` when `authProvider: EntraId` (token exchange + OIDC metadata).
- [ ] Task env: `Auth__EntraId__*` double-underscore mapping for .NET config.
- [ ] `externalUrl` in environment config matches **public** URL users type in the browser.
- [ ] CloudFront → ALB origin; forward cookies on `/api` and auth paths.
- [ ] Document that **stack recreate may change CloudFront domain** → Entra redirect URI must be updated (Part 2 of this series).

---

## Security Posture (Short)

- Authorization **code** flow only—not implicit. Tokens stay server-side.
- Cookie: **HttpOnly**, **Secure**, **SameSite=Lax**.
- Client secret only in Secrets Manager; rotate on customer IT schedule.
- App roles in Entra—not group overloading unless you have a clear mapping story.
- Least privilege on ECS task role unrelated to Entra; user identity rides the cookie into the BFF, then gRPC metadata to backend.

For AWS-hosted apps, also review [Security best practices for Amazon ECS](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/security.html)—auth is one layer; task IAM and secrets handling are the rest.

---

## What We Would Do Differently

1. **Draw the ALB rule table before writing OIDC middleware.** Saves a day.
2. **Set `ExternalUrl` in the first deploy**, not after the first `AADSTS50011` screenshot.
3. **Give customer IT a redirect URI checklist** with exact paths (`/signin-oidc`, `/signout-oidc`) before they register the app.
4. **Plan NAT cost** when enabling Entra in a sandbox VPC that previously had no egress.
5. **Teach the frontend one rule:** BFF mode never uses `/login` as the primary gate.

---

## Series Next

This is **part 1** of **Entra ID on AWS** (user SSO):

| Part | Topic |
|------|--------|
| **2** | App registration, app roles, redirect URI lifecycle when CloudFront changes |
| **3** | Dual auth for scripts, claim propagation, testing matrix |

Pipeline federation (ADO → AWS) stays in the [Hybrid CI/CD series](https://ioni.solarz.me/blog/post.html?slug=azure-devops-aws-hybrid-cicd). Same acronym family. Different threat model.

---

**Related:** [Azure DevOps AWS integration](https://ioni.solarz.me/blog/post.html?slug=azure-devops-aws-hybrid-cicd) · [Document pipeline event-driven deploy](https://ioni.solarz.me/blog/post.html?slug=document-pipeline-event-driven-deploy)

If you have war stories from Entra behind CloudFront—or you routed OIDC through API Gateway instead of ALB—I would like to hear them.
