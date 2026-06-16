---
title: "Entra ID BFF Pattern: Mock Dev, Production Cookies, and Automation JWT"
date: 2026-09-09
slug: entra-aws-dual-auth-scripts-bff
excerpt: Production runs Entra cookies; local dev runs mock JWT; bulk import still posts with Bearer. One Auth:Provider flag does not merge those worlds—you route, register endpoints, and test each path on purpose.
author: Jonathan Solarz
categories: aws azure security architecture dotnet
image: /img/blog/entra-dual-auth.jpg
series: entra-aws-app-auth
series_part: 3
---

# Entra ID BFF Pattern: Mock Dev, Production Cookies, and Automation JWT

You finished part 1 (edge routing) and part 2 (tenant registration). Production users click **Sign in with Microsoft**, get a cookie, never see a JWT. Developers on Docker Compose pick a role from a dropdown and stash a token in `localStorage`. The data migration team has a Python script that calls `/api/studies` with `Authorization: Bearer`.

All three are “logged in.” All three must work without opening a hole that lets the browser skip Entra in production.

The **Entra ID BFF pattern** in our stack is not a single middleware—it is a **mode switch**, a **frontend contract**, and a **secondary authentication scheme** for automation. This post is how we kept one codebase and three entry paths from fighting each other.

![Mock JWT vs Entra BFF vs script Bearer — dual auth decision flow](/img/blog/entra-dual-auth.png)

**Previous:** [Microsoft Entra app roles and redirect URIs](https://ioni.solarz.me/blog/post.html?slug=entra-app-registration-roles-redirects)

## In Brief

- **`Auth:Provider`**: `Mock` → default JWT Bearer; `EntraId` → Cookie + OpenIdConnect challenge, with JWT Bearer as **secondary** scheme for scripts.
- **Frontend BFF detection:** no `token` in `localStorage` → treat as cookie session; 401 → redirect to `/auth/login`, not `/login`.
- **Entra mode still exposes** `POST /api/auth/login` for mock-style JWT issuance to trusted automation—do not document it as a user login path.
- **Register Entra-only routes** (`/auth/login`, `/auth/logout`, `/api/auth/me`) conditionally; avoid duplicate route names that throw `AmbiguousMatchException` at startup.
- **gRPC to backend:** forward `user-id` metadata from the authenticated principal on every outbound call—authorization policies run on the BFF, audit identity still flows.

---

## Why Dual Auth Exists

A document platform is not only a SPA:

- Engineers need **fast local loops** without corporate MFA on every hot reload.
- **E2E tests** want predictable users and roles.
- **Import and migration scripts** batch-create studies overnight—no browser, no OIDC redirect dance.

Rip out mock auth when Entra ships and you lose velocity. Run Entra in dev and you become help desk for MFA lockouts. The compromise: **one provider flag per environment**, shared authorization policies, different **authentication schemes** per caller type.

---

## Server: `Auth:Provider` Switch

Configuration drives which world you are in:

```text
Auth:Provider = Mock      → local, CI, some sandboxes
Auth:Provider = EntraId   → customer-facing environments
```

**Mock mode** — single scheme, JWT Bearer:

- Dev login page posts credentials (or role picker) to `/api/auth/login`.
- API returns signed HS256 JWT; client stores in `localStorage`.
- Every `/api/*` call sends `Authorization: Bearer`.

**Entra mode** — cookie primary, JWT secondary:

- Default scheme: **Cookie** session after OIDC code exchange.
- Challenge scheme: **OpenIdConnect** → Microsoft authorize endpoint.
- **Additional** `AddJwtBearer` using the same dev signing key (`Auth:JwtSecret`) for automation.

Conceptual registration:

```csharp
if (provider == "EntraId")
{
    AddMicrosoftIdentityWebApp(/* cookie + OIDC */);
    authBuilder.AddJwtBearer(/* secondary — scripts */);
}
else
    AddMockAuth(/* JWT only */);
```

Authorization policies (`Admin`, `AdminOrGrm`, …) stay **identical** in both modes—only authentication mechanics differ.

Microsoft’s overview of the server-side web app flow: [Microsoft identity platform and OAuth 2.0 authorization code flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow).

---

## Entra Routes (BFF Surface)

When `EntraId` is active, map explicit BFF endpoints:

| Route | Purpose |
|-------|---------|
| `GET /auth/login?returnUrl=` | Challenge → Microsoft |
| `GET /auth/logout` | Sign out cookie + OIDC session |
| `GET /api/auth/me` | JSON user + role for SPA bootstrap |

`/api/auth/me` reads `roles` from the cookie principal—the same claims Entra issued after part 2’s mapping.

**Conditional mock login in Entra mode:**

```csharp
if (Auth:Provider == EntraId)
{
    MapAuthEntraRoutes();
    MapPost("/api/auth/login", AuthRoutes.LoginAsync).AllowAnonymous(); // scripts only
}
else
    MapPost("/api/auth/login", ...); // primary dev login
```

That `POST /api/auth/login` in production is deliberate: import tooling obtains a short-lived JWT without disabling Entra for humans. Lock it down with network policy, secret rotation, and monitoring—not by removing it and breaking migrations at 2 a.m.

---

## Frontend: Detecting BFF Mode

The React app must not assume JWT everywhere.

```typescript
function isBffMode(): boolean {
  return !localStorage.getItem('token');
}
```

**Router guard:** if BFF mode and no session, redirect to `/auth/login?returnUrl=…`—not the mock `/login` page.

**Auth bootstrap:** call `/api/auth/me` with `credentials: 'include'` (cookies). On 401 in BFF mode → full redirect to `/auth/login`.

**Logout:** BFF mode navigates to `/auth/logout`; mock mode clears `localStorage` and routes to `/login`.

The failure we hit in testing: developers who once logged in via mock still had `token` in storage after switching to Entra locally. The app thought it was still in JWT mode and never sent cookies. **Document “clear site data”** when flipping providers—or namespace the storage key per environment.

---

## Secondary JWT for Scripts

Import scripts do not run OIDC. Pattern:

1. `POST /api/auth/login` with service credentials (or dev-only shared secret body—tighten for your threat model).
2. Receive JWT with `role` claim matching mock claim shape.
3. Call APIs with `Authorization: Bearer`.

In Entra mode the secondary bearer uses **`role`** (singular) in token validation parameters—mock tokens—not Entra’s `roles` array. Humans never see this path; their roles come from Microsoft.

**Do not** weaken cookie `Secure` / `HttpOnly` / `SameSite` because scripts exist. Two schemes, two audiences.

---

## Route Collisions and Startup Crashes

ASP.NET Core will throw **`AmbiguousMatchException`** if two endpoints register the same pattern—easy when copying mock route maps into Entra startup.

Rules we follow:

- Entra-specific paths live in `MapAuthEntraRoutes()` only when provider is EntraId.
- Mock `/login` **page** stays a client route; server challenge is `/auth/login` in Entra mode.
- One registration for `POST /api/auth/login` per provider branch—never both unconditionally.

If the app fails at startup after a merge, search for duplicate `MapGet`/`MapPost` on auth paths before debugging OIDC.

---

## gRPC: Propagating Identity to the Backend

The BFF enforces `[Authorize]` on minimal APIs. gRPC services run on a private backend with a separate API key on the channel—but **audit** still needs the human’s directory ID.

An outbound interceptor attaches metadata on every call:

```csharp
// Header: user-id = NameIdentifier from HttpContext.User
metadata.Add("user-id", userId);
```

Backend managers use that for activity logs (“who validated this document”). It is not a substitute for re-checking authorization on the BFF—defense in depth means backend trusts the BFF network boundary, not anonymous callers.

Streaming calls (Bedrock extraction progress) get the same header on server-streaming RPCs—easy to forget when you only tested unary routes.

---

## Testing Matrix

| Scenario | Provider | How to authenticate | Assert |
|----------|----------|---------------------|--------|
| Local dev UI | Mock | `/login` → JWT in storage | Role-gated menus |
| Sandbox Entra | EntraId | `/auth/login` → Microsoft | Cookie session, `/api/auth/me` |
| Playwright E2E | Mock | API login helper | No Entra dependency in CI |
| Bulk import | EntraId | `POST /api/auth/login` → Bearer | Writes attributed in audit log |
| Wrong role | Either | User with `country_pm` | 403 on download routes |

Run at least one Entra smoke test after **every** deploy that touches CloudFront, `ExternalUrl`, or auth config—not only on “identity releases.”

---

## ASCII: Three Callers, One BFF

```
  Human browser (prod)          Human browser (dev)           Import script
        │                              │                            │
        │ GET /auth/login              │ POST /api/auth/login         │ POST /api/auth/login
        ▼                              ▼                            ▼
   Microsoft OIDC                   Mock JWT issuer                  Mock JWT issuer
        │                              │                            │
        │ code → token                 │ HS256 token                  │ HS256 token
        ▼                              ▼                            ▼
   Cookie session                   Bearer header                  Bearer header
        │                              │                            │
        └──────────────────────────────┴────────────────────────────┘
                                       │
                              WebApi BFF [Authorize]
                                       │
                              gRPC + user-id metadata
                                       ▼
                              Backend / Aurora / S3 / Bedrock
```

---

## What We Would Not Do Again

1. **Teach the SPA two login URLs** without a single `isBffMode()` helper—every new screen reintroduces `/login` bugs.
2. **Share one Entra app registration** across sandbox and prod without maintaining the redirect URI table from part 2.
3. **Assume E2E coverage of mock auth** covers Entra—it does not; schedule a manual smoke or dedicated Entra test tenant job.
4. **Remove secondary JWT** to “simplify security” and break migrations the week before cutover.

---

## Series Close

| Part | Topic |
|------|--------|
| **1** | [Entra ID AWS application — OIDC, BFF, edge failures](https://ioni.solarz.me/blog/post.html?slug=entra-id-aws-application-oidc) |
| **2** | [Microsoft Entra app roles and redirect URIs](https://ioni.solarz.me/blog/post.html?slug=entra-app-registration-roles-redirects) |
| **3** | Dual auth, scripts, propagation ← you are here |

**Different problem, same acronym:** [Hybrid CI/CD — ADO OIDC to AWS](https://ioni.solarz.me/blog/post.html?slug=ado-aws-oidc-iam-scp) is **machine** identity for deploy pipelines. This series is **human** identity for the application.

**Platform context:** [Document pipeline event-driven deploy](https://ioni.solarz.me/blog/post.html?slug=document-pipeline-event-driven-deploy) · [AWS CDK layered stacks](https://ioni.solarz.me/blog/post.html?slug=aws-cdk-layered-stacks-pipeline)

---

If you standardized on **Entra-only** in dev and made it work without rage-quitting, I want to know what you changed in the inner loop—my team chose dual mode for a reason, not because we love complexity.
