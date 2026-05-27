---
title: "Azure DevOps Pipeline AWS: Parallel CI, Coverage, and Deploy Guardrails"
date: 2026-08-04
slug: ado-aws-parallel-ci-coverage
excerpt: Pattern A only works if ADO CI is fast and honest—parallel dotnet and client jobs, one merged coverage number, path filters that skip doc-only deploys, and packaging that matches what CodePipeline expects.
author: Jonathan Solarz
categories: aws azure devops dotnet testing
image: /img/blog/ado-aws-parallel-ci.jpg
series: hybrid-cicd-ado-aws
series_part: 3
---

# Azure DevOps Pipeline AWS: Parallel CI, Coverage, and Deploy Guardrails

Parts [1](https://ioni.solarz.me/blog/post.html?slug=azure-devops-aws-hybrid-cicd) and [2](https://ioni.solarz.me/blog/post.html?slug=ado-aws-oidc-iam-scp) split **who deploys**. This post is **how ADO should behave** before the zip hits S3: parallel jobs, artifacts, coverage that means something, triggers that respect `main`, and a source archive CodeBuild can actually synth.

**Azure DevOps pipeline AWS** handoff fails in boring ways—a 40-minute serial pipeline, 2% coverage dashboards, or a `docs/` commit that ships Bedrock config to production.

![Parallel ADO CI jobs, merged coverage, package artifact, then AWS upload stage](/img/blog/ado-aws-parallel-ci.png)

## In Brief

- **Parallel jobs** for .NET and web client; package source only after both succeed.
- **Caches** on NuGet and npm paths—restore keys scoped to lockfiles and csproj graphs.
- **One Cobertura publish** via ReportGenerator merging backend + client artifacts.
- **Narrow instrumentation**: Coverlet `Include`/`Exclude`; Vitest `coverage.include` on `services/**` only.
- **Path triggers** on `src/**` and `infra/**`; upload stage `condition` on `refs/heads/main` only.
- **Optional multi-remote git**: sandbox mirror vs production ADO—same Pattern A, different remotes.

---

## Stage Graph

```
  stage: CI (parallel)
  ┌──────────────┐  ┌──────────────┐
  │ job: DotNet  │  │ job: WebClient│
  │ restore/build│  │ npm ci/build │
  │ dotnet test  │  │ vitest       │
  │ publish trx  │  │ publish trx  │
  │ cobertura    │  │ cobertura    │
  └──────┬───────┘  └──────┬───────┘
         │                 │
         └────────┬────────┘
                  ▼
         ┌────────────────┐
         │ job: Coverage  │  dependsOn: both
         │ ReportGenerator│
         │ single publish │
         └────────┬───────┘
                  ▼
         ┌────────────────┐
         │ job: Package   │  dependsOn: both
         │ ris-source.zip │
         └────────┬───────┘
                  ▼
  stage: TriggerAWS (main only)
         S3 upload + start-pipeline
```

Serial “build everything in one job” is simpler YAML and worse wall-clock. On a document platform with gRPC backend and a Vite SPA, **25 + 15 minutes** parallel beats **45 minutes** stacked.

---

## Parallel .NET Job

**Goals:** restore once, build Release, test with TRX + Cobertura, publish results even on partial failure.

Patterns that matter:

| Practice | Why |
|----------|-----|
| `Cache@2` on `NUGET_PACKAGES` under `$(Pipeline.Workspace)` | Agents are ephemeral; cache is the speed win |
| Cache key includes `**/*.csproj` and `packages.lock.json` | Invalidates when dependencies change |
| `dotnet test` with `--collect:"XPlat Code Coverage"` | Standard Cobertura for ADO |
| `coverlet.runsettings` | Stops counting migrations, protos, test assemblies |
| `PublishTestResults@2` + `condition: succeededOrFailed()` | PR shows failures without hiding flaky history |

Example Coverlet scope (product assemblies only):

```xml
<Include>[Adama.Ris.Backend]*,[Adama.Ris.Infrastructure]*,[Adama.Ris.Backend.Data]*</Include>
<Exclude>[*]*.Tests*,[*]*.Protos*,[*]*.Migrations*,[*]*Program</Exclude>
<ExcludeByFile>**/Migrations/**/*.cs,**/obj/**,**/bin/**</ExcludeByFile>
```

Without `Include`, you instrument the universe and wonder why coverage “improved” to 4%.

Publish Cobertura as a **pipeline artifact** (`coverage-backend`)—not `PublishCodeCoverageResults` in this job. One publish at the end.

---

## Parallel Web Client Job

**Goals:** `npm ci`, production build, Vitest unit tests, Cobertura artifact for merge.

Vitest defaults will instrument every shadcn page and route if you let them. That drove **~2% line coverage** on dashboards while service-layer tests were fine.

Tighten `vitest.config.ts`:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text-summary', 'cobertura'],
  include: ['src/services/**/*.ts'],
  exclude: [
    'e2e/**',
    'src/components/ui/**',
    'src/pages/**',
    'src/main.tsx',
    'src/router.tsx',
    '**/*.{test,spec}.{ts,tsx}',
  ],
},
```

**Rule:** measure what you unit-test today; widen `include` when you add component tests on purpose—not by accident.

Artifact: `coverage-webclient` with `cobertura-coverage.xml` (Vitest) or equivalent.

---

## Merged Coverage (One Tab, One Truth)

Two `PublishCodeCoverageResults@2` tasks → two tabs, conflicting totals, management asks which number is real.

**Fix:** a small downstream job:

1. `dependsOn: [DotNet, WebClient]` with `condition: succeededOrFailed()` so you still merge when one side failed (optional policy choice).
2. Download both artifacts.
3. Run **ReportGenerator** on all `coverage.cobertura.xml` / `cobertura-coverage.xml` files found.
4. Single `PublishCodeCoverageResults@2` with `pathToSources` listing both roots (backend + client `src`).

```bash
reportgenerator \
  -reports:"$REPORTS_JOINED" \
  -targetdir:"$COVERAGE_MERGE_DIR" \
  -reporttypes:Cobertura
```

Fail the job if zero reports—silent “green with no data” is worse than red.

**Do not** fail on empty coverage for the whole repo if you only instrument subsets (`failIfCoverageEmpty: false` is reasonable until thresholds are real).

---

## Package Source (What CodePipeline Consumes)

After CI passes, a **PackageSource** job depends on DotNet + WebClient—not on Coverage (coverage should not block shipping fixes unless you want it to).

Script responsibilities:

- `git archive` or filtered zip of `src/`, `infra/cdk/`, Dockerfiles, pipeline scripts
- Exclude `.git`, local `node_modules`, `bin/`, `obj/`
- Embed `Build.SourceVersion` in metadata or a small manifest inside the zip

Publish **`ris-source`** pipeline artifact. The upload stage downloads it—no second full checkout build.

Mismatch symptom: CodeBuild synth succeeds locally but fails in pipeline because the zip omitted `infra/cdk/cdk.json`. Treat the zip manifest as part of the contract; review it when adding new top-level folders.

---

## Upload Stage Guardrails

```yaml
trigger:
  paths:
    include:
      - src/**
      - infra/**
      - infra/ado-pipelines/**

stages:
  - stage: TriggerAWS
    dependsOn: CI
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
```

| Guard | Prevents |
|-------|----------|
| Path filters | README-only commit → production deploy |
| `main` condition on upload | Feature branch experiments hitting S3 |
| Explicit `risEnv` + `awsRegion` parameters | Wrong bucket / wrong pipeline name |
| S3 object metadata `git-sha`, `ado-build-id` | “Which commit is in prod?” archaeology |

Upload task uses OIDC connection + inline script: `aws s3 cp` then `aws codepipeline start-pipeline-execution`—see [part 2](https://ioni.solarz.me/blog/post.html?slug=ado-aws-oidc-iam-scp).

---

## Duplicate Work: ADO vs CodeBuild

Hybrid Pattern A often runs **tests in ADO** and still has a **BuildAndTest** wave in CodePipeline during migration.

| Phase | Action |
|-------|--------|
| Now | Accept duplicate minutes while proving ADO parity |
| Next | Slim CodeBuild to synth-only or smoke-only |
| Target | ADO = quality gate; AWS = deploy + integration smoke |

Document the intent in your ADR so nobody “optimizes” by removing ADO tests and wonders why PRs stop catching breaks.

---

## Multi-Remote Git (Optional Pattern)

Some teams keep:

- **Production remote** → Azure DevOps (Pattern A upload to prod account)
- **Sandbox remote** → CodeCommit or second ADO project (faster iteration)

Same repo, different push URLs. Rules:

- Never assume `git push` goes to the environment you think—check `git remote -v`.
- Sandbox pipeline names and buckets use `ris-sandbox-*`, not prod prefixes.
- OIDC subjects differ per service connection—do not reuse prod connection in sandbox YAML.

No customer names required; it is a **workflow** post, not a case study.

---

## PR vs Main Behavior

| Event | CI jobs | Upload to AWS |
|-------|---------|---------------|
| PR to `main` | Run | Skip (no upload stage) |
| Merge to `main` | Run | Upload + start pipeline |

Optional: require merged coverage trend on PR without publishing to AWS. Keep **deploy side effects** on `main` only unless you enjoy sandbox pollution.

---

## Checklist Before Calling Hybrid “Done”

- [ ] DotNet and WebClient jobs run in parallel with caches.
- [ ] One merged Cobertura publish; plausible percentages.
- [ ] `ris-source.zip` artifact matches CodePipeline synth inputs.
- [ ] Path filters + `main`-only upload.
- [ ] Upload uses OIDC upload role (part 2).
- [ ] CodePipeline started exactly once per zip.
- [ ] Plan to dedupe CodeBuild tests after ADO stabilizes.

---

## Series

**Series:** [Part 1 — Pattern A](https://ioni.solarz.me/blog/post.html?slug=azure-devops-aws-hybrid-cicd) · [Part 2 — OIDC & SCP](https://ioni.solarz.me/blog/post.html?slug=ado-aws-oidc-iam-scp) · **Part 3** (this)

From here, jump back to the **CDK series** for what happens after the zip lands: [layered stacks](https://ioni.solarz.me/blog/post.html?slug=aws-cdk-layered-stacks-pipeline), [document pipeline deploy](https://ioni.solarz.me/blog/post.html?slug=document-pipeline-event-driven-deploy).

---

*Tuning ADO pipelines or merging coverage without the theater? [Connect with me](/contact.html).*
