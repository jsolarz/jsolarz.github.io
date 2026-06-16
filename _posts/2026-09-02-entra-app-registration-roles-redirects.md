---
title: "Microsoft Entra App Roles: Registration Checklist and Redirect URI Drift"
date: 2026-09-02
slug: entra-app-registration-roles-redirects
excerpt: App registration is five fields until CloudFront changes and AADSTS50011 comes back. Microsoft Entra app roles live in the token as roles—not role—and nobody assigns them until Access Denied after a perfect login.
author: Jonathan Solarz
categories: azure security architecture dotnet
image: /img/blog/entra-app-roles.jpg
series: entra-aws-app-auth
series_part: 2
---

# Microsoft Entra App Roles: Registration Checklist and Redirect URI Drift

Part 1 was the edge: ALB paths, NAT, BFF cookies, `ExternalUrl`. The login flow can be wired correctly on AWS and still fail in the tenant—or fail **after** a green deploy because nobody updated redirect URIs.

**Microsoft Entra app roles** are where authorization actually lives for a line-of-business app. Not “user is in the Azure AD group.” Not API permissions to Microsoft Graph. **App roles** you define on the registration, assign in Enterprise applications, and read from the `roles` claim in the ID token.

This post is the checklist we send customer IT before go-live, the claim mapping that bites .NET developers, and the redirect URI lifecycle that breaks when you recreate CloudFront or swap domains.

![App registration, app roles assignment, and redirect URI lifecycle](/img/blog/entra-app-roles.png)

**Previous:** [Entra ID AWS application — OIDC and BFF](https://ioni.solarz.me/blog/post.html?slug=entra-id-aws-application-oidc)

## In Brief

- Register a **Web** platform app with redirect `https://{public-host}/signin-oidc` and front-channel logout `/signout-oidc`—paths matter, trailing slashes matter.
- Define **app roles** on the registration; assign users in **Enterprise applications → Users and groups**—sign-in without assignment = authenticated but unauthorized.
- Map **`roles`** (array) in `OnTokenValidated`; set `TokenValidationParameters.RoleClaimType = "roles"`—do not assume `role` singular.
- Treat redirect URIs as **infrastructure**: stack recreate, new CloudFront domain, or missing `ExternalUrl` → update Entra **before** users test.
- Hand IT a one-page “values we need” (tenant ID, client ID, secret) plus exact URIs—secrets in Secrets Manager on your side only.

---

## What IT Configures vs What You Configure

Split the work early. Fights start when both sides think the other owns redirect URIs.

| Owner | Responsibility |
|-------|----------------|
| **Customer IT** | App registration, client secret, app role definitions, user→role assignments, optional conditional access |
| **You (AWS)** | Store secret in Secrets Manager, inject tenant/client IDs into ECS task env, set `Auth:EntraId:ExternalUrl`, deploy BFF with OIDC middleware |

Users should never paste a client secret into your UI. They send it through your secure channel once; you rotate on your schedule.

---

## App Registration Checklist

Work through this in order. Skip a step and you will debug it in production.

### 1. Create the registration

- **Name:** something operators recognize in the portal (environment in the name helps: `DocumentPlatform-Prod`).
- **Supported account types:** single tenant for a corporate LOB app.
- **Platform:** Web—not SPA, not mobile—for authorization code + server-side token exchange.

Microsoft documents redirect URI restrictions here: [Redirect URI (reply URL) outline](https://learn.microsoft.com/en-us/entra/identity-platform/reply-url).

### 2. Redirect and logout URLs

Add **exactly** what the BFF exposes:

```text
https://{public-host}/signin-oidc
https://{public-host}/signout-oidc   (front-channel logout URL)
```

`{public-host}` is what the **browser** sees—CloudFront alternate domain, custom DNS, not the internal ALB DNS name.

Enable **ID tokens** under Authentication if your stack still expects them in hybrid flows (many Microsoft.Identity.Web setups do).

### 3. Client secret

Certificates & secrets → new client secret → copy the **value** once. Store in AWS Secrets Manager; reference from CDK/ECS. Set a calendar reminder before expiry—expired secret looks like “login broke overnight” with no code change.

### 4. App roles (not API permissions)

App roles → Create app role for each application role string your code enforces.

Example shape for a document platform:

| Display name | Value (claim) | Who |
|--------------|---------------|-----|
| Admin | `admin` | Reference data, tags, full document lifecycle |
| Contributor | `grm` | Upload, edit, validate |
| Regional reader | `regional_pm` | Search, metadata, download |
| Country reader | `country_pm` | Metadata only |

**Values must match your authorization policies exactly**—case and underscores included. `Admin` and `admin` are different claims.

Official reference: [Add app roles and get them from tokens](https://learn.microsoft.com/en-us/entra/identity-platform/howto-add-app-roles-in-apps).

### 5. Assign users

Enterprise applications → your app → **Users and groups** → assign each user **one** role.

Login without assignment: Microsoft succeeds, your app shows Access Denied. That is correct behavior, not a bug.

---

## Microsoft Entra App Roles in the Token

Entra emits app roles in the **`roles` claim**—usually an array. ASP.NET Core’s role authorization expects `ClaimTypes.Role` unless you configure otherwise.

We bind Entra like this (conceptually):

```csharp
options.TokenValidationParameters.RoleClaimType = "roles";
options.MapInboundClaims = false;

options.Events.OnTokenValidated = context =>
{
    var roles = context.Principal?.FindAll("roles").Select(c => c.Value);
    if (context.Principal?.Identity is ClaimsIdentity identity)
        foreach (var role in roles ?? [])
            identity.AddClaim(new Claim(identity.RoleClaimType, role));
    return Task.CompletedTask;
};
```

**Failure modes:**

| Symptom | Likely cause |
|---------|----------------|
| `[Authorize(Roles = "admin")]` never passes | Role claim type still `role` or WS-Fed mapped names |
| User “has Admin” in portal but API sees nothing | Assignment on wrong enterprise app (duplicate registration) |
| Multiple roles in token, policy expects one | `RequireRole` passes if **any** matches—design policies accordingly |

Your `/api/auth/me` endpoint should return the role the UI uses for menu gating—same source as server policies.

---

## Redirect URI Drift (The Recreate Problem)

`AADSTS50011` is the error everyone screenshots. The message is honest: the `redirect_uri` in the authorize request is not on the app registration list.

What changes the public host without a code deploy:

1. **New CloudFront distribution** → new `*.cloudfront.net` hostname unless you use a stable custom domain.
2. **Forgot `Auth:EntraId:ExternalUrl`** → middleware sends internal ALB host in `redirect_uri`.
3. **HTTP vs HTTPS** or **trailing slash** mismatch.
4. **Sandbox vs prod** sharing one registration with incomplete URI list.

### Lifecycle runbook

```
  Deploy / DNS change
        │
        ▼
  Confirm browser URL (what users type or bookmark)
        │
        ▼
  Set ExternalUrl in app config to that origin
        │
        ▼
  Add BOTH signin + signout URIs in Entra if host changed
        │
        ▼
  Smoke: private window → /auth/login → complete MFA → land on app
```

Keep a **table per environment** in your internal runbook:

| Environment | Public URL | signin-oidc | Updated in Entra (date) |
|-------------|------------|-------------|-------------------------|
| Sandbox | `https://…` | `https://…/signin-oidc` | |
| Production | `https://…` | `https://…/signin-oidc` | |

When IT asks “why did login break after your deploy?”—90% of the time this table is missing a row.

![Redirect URI lifecycle when CloudFront or ExternalUrl changes](/img/blog/entra-redirect-lifecycle.png)

---

## Customer Handoff Template

Send this before go-live. One page. No surprises.

**We need from you**

| Item | Where |
|------|--------|
| Directory (tenant) ID | App registration → Overview |
| Application (client) ID | App registration → Overview |
| Client secret value | Created under Certificates & secrets (send securely) |

**You must configure**

- Redirect URI: `https://{agreed-host}/signin-oidc`
- Front-channel logout: `https://{agreed-host}/signout-oidc`
- App roles created with values: `{list exact strings}`
- Every production user assigned exactly one role

**We configure**

- Secret in Secrets Manager, ECS env vars, `ExternalUrl`, ALB rules (part 1)

**Smoke test (both sides on a call)**

1. User with `regional_pm` can search and download.
2. User with `country_pm` cannot open PDF preview.
3. User with no assignment gets denied after Microsoft login.

---

## API Permissions vs App Roles

Teams new to Entra conflate these.

- **Microsoft Graph API permissions** — your app calling Microsoft APIs on behalf of the user or as itself. Not what you need for “is this person allowed to delete a study in our database.”
- **App roles** — your application’s RBAC, embedded in tokens, enforced by **your** BFF and policies.

For a self-contained LOB app on AWS, you typically need **no** Graph application permissions for login. If you later read group membership from Graph, that is a different design—groups in tokens vs app roles. Pick one model; mixing without documentation confuses auditors.

---

## Troubleshooting Quick Reference

| Error / behavior | Fix |
|------------------|-----|
| `AADSTS50011` | Add exact redirect URI; fix `ExternalUrl`; check https |
| Login OK, instant 403 | Assign app role in Enterprise applications |
| Wrong menu / wrong downloads | Wrong role assignment or claim mapping |
| `AADSTS7000215` invalid secret | Rotate secret, update Secrets Manager, redeploy tasks |
| Works in prod, not sandbox | Separate registrations or full URI list per host |

---

## Series Next

**Part 3** covers **Entra ID BFF pattern** dual mode: `Auth:Provider` Mock vs EntraId, why the React app checks `localStorage` for token absence, secondary JWT for import scripts, and gRPC `user-id` forwarding—without weakening production cookies.

| Part | Topic |
|------|--------|
| **1** | BFF, ALB, NAT, OIDC callbacks |
| **2** | App registration, app roles, redirect drift ← you are here |
| **3** | Dual auth, scripts, claim propagation |

**Related:** [AWS OIDC Azure DevOps](https://ioni.solarz.me/blog/post.html?slug=ado-aws-oidc-iam-scp) (machine identity, not user SSO)

---

If your org uses **group claims** instead of app roles for the same platform, I am curious whether you regret it—especially when external auditors ask who can download regulated documents.
