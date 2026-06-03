---
title: "Your CDK Deploy Succeeded. Your App Is Still Broken."
date: 2026-08-11
slug: cdk-deploy-succeeded-app-still-broken
excerpt: CloudFormation says CREATE_COMPLETE. The user sees a blank page. The gap between a green stack and a working feature is wider than you think—CORS on imported buckets, MIME types nginx forgot, presigned URLs that work in curl but die in the browser.
author: Jonathan Solarz
categories: aws cdk architecture devops
image: /img/blog/cdk-deploy-succeeded-broken.jpg
series: aws-cdk-complex-deployments
series_part: 5
scene: |
  The pipeline finished. Green checkmarks everywhere. You open the app and the PDF viewer is blank, the download button 403s, the worker module refuses to load. None of these failures show up in CloudFormation events. They live in the space between infrastructure and runtime—the operational tail that IaC frameworks pretend does not exist.
---

# Your CDK Deploy Succeeded. Your App Is Still Broken.

The pipeline ran. Every stack updated. ECS services stabilized. The smoke test hit the health endpoint and got a 200.

Then someone opened the app.

Blank PDF viewer. CORS error in the console. A module script rejected because nginx served it as `application/octet-stream`. The presigned URL worked in curl. It failed in the browser. Three separate bugs, all invisible to CloudFormation, all blocking the feature the deploy was supposed to ship.

This post is about that gap. The space between `CREATE_COMPLETE` and "the user can actually do the thing." It is narrower than a distributed systems problem and wider than a typo. It is operational config that IaC frameworks do not model—and that you discover only when a human clicks a button your pipeline never clicked.

## The Shape of the Problem

Picture a document platform on AWS. ECS Fargate runs three containers behind an ALB: a .NET backend, a REST gateway, and a React SPA served by nginx. Documents live in S3. Users preview PDFs inline. Presigned URLs give the browser temporary read access.

CDK owns the infrastructure. The pipeline builds images, pushes to ECR, runs migrations, and deploys. Everything is code. No console clicks. No manual steps.

And yet.

The PDF viewer broke after a library migration. Not because the deploy failed. Because the deploy succeeded with a config gap nobody modeled.

## Failure 1: The MIME Type That nginx Forgot

We replaced an iframe-based PDF viewer with react-pdf. Good library. Renders to canvas instead of relying on the browser's native renderer. Uses a web worker written as an ES module—a `.mjs` file that Vite emits into `/assets/`.

The deploy went fine. The worker file existed. The presigned URL was valid. The PDF never rendered.

Browser console: `Failed to load module script: Expected a JavaScript module but the server responded with a MIME type of "application/octet-stream".`

nginx serves static files. Its `mime.types` file maps extensions to content types. `.js` maps to `application/javascript`. `.mjs` does not—at least not in the Alpine base image we used. Without a mapping, nginx falls back to `default_type`, which is `application/octet-stream`. We had `X-Content-Type-Options: nosniff` set (security header, non-negotiable). The browser refused to execute the module.

The fix was three lines in `nginx.conf`:

```nginx
location ~* \.mjs$ {
    root /usr/share/nginx/html;
    default_type text/javascript;
    add_header Cache-Control "public, max-age=31536000, immutable" always;
}
```

**Why CDK never caught it:** CDK owns the ECS task definition, the container image reference, the ALB target group. It does not own what happens inside the container. nginx config lives in the Docker image. The image built successfully. The file was served. Just with the wrong content type.

**Detection window:** Zero CloudFormation events. Zero ECS health check failures (the container was healthy). Zero ALB 5xx. The failure only manifested when a browser tried to import a module script from a path that nginx served with the wrong header.

## Failure 2: CORS on Buckets CDK Does Not Own

react-pdf fetches PDF bytes via XHR. The old iframe loaded the presigned URL directly—the browser's native PDF renderer made the request, no JavaScript involved, no CORS required.

After the library switch, the browser's fetch API made the request. Cross-origin. The S3 bucket had no CORS configuration. The browser blocked it.

Two buckets were involved:
- A results bucket (where the extraction pipeline leaves processed PDFs)
- A knowledge-base bucket (where validated documents get published)

The upload bucket had CORS. We configured it months ago because the frontend uploads directly via presigned PUT. The other two buckets never needed CORS before. Now they did.

Here is where it gets interesting from a CDK perspective.

The results bucket is a `new s3.Bucket(...)` in sandbox. CDK creates it, owns it, and can set its `cors` property. Done.

The knowledge-base bucket is imported: `s3.Bucket.fromBucketName(this, "KbBucket", name)`. CDK gets a reference for IAM grants. It cannot set properties on an imported bucket. No `cors`. No `versioned`. No `encryption`. The L2 construct hands you a read-only handle.

For production, all platform buckets are imported (pre-provisioned by the landing zone team). So the `cors` property on `makeBucket()` only works in greenfield environments. Production would deploy green and stay broken.

**The CDK-native fix:** An `AwsCustomResource` that calls `s3:PutBucketCors` at deploy time.

```typescript
const putBucketCors = (id: string, bucketName: string, bucketArn: string) =>
  new cr.AwsCustomResource(this, id, {
    onUpdate: {
      service: "S3",
      action: "putBucketCors",
      parameters: {
        Bucket: bucketName,
        CORSConfiguration: {
          CORSRules: [{
            AllowedMethods: ["GET", "HEAD"],
            AllowedOrigins: corsOrigins,
            AllowedHeaders: ["*"],
            ExposeHeaders: ["ETag", "Content-Range", "Content-Length", "Accept-Ranges"],
            MaxAgeSeconds: 3600,
          }],
        },
      },
      physicalResourceId: cr.PhysicalResourceId.of(`${id}-cors`),
    },
    policy: cr.AwsCustomResourcePolicy.fromStatements([
      new iam.PolicyStatement({ actions: ["s3:PutBucketCors"], resources: [bucketArn] }),
    ]),
  });
```

Applied to the KB bucket in every environment. Applied to results and processed buckets only when `importPlatformData` is true (production). Greenfield buckets get CORS natively through the L2 construct's `cors` prop.

**Why this matters beyond CORS:** Any time your CDK stack imports a pre-existing resource, you lose declarative control over its configuration. Custom resources bridge that gap. They run at deploy time, inside CloudFormation's lifecycle, with proper rollback semantics. They are the CDK-native answer to "we cannot own this bucket but we need to configure it."

## Failure 3: The Presigned URL That Worked Everywhere Except the Browser

This one is subtle. A presigned GET URL from S3 works in curl. It works in Postman. Paste it in the browser address bar—works. Pass it to `fetch()` from a different origin—CORS blocks it.

The URL is valid. The signature is valid. The file exists. But the browser adds an `Origin` header to the request. S3 sees that header and checks its CORS configuration. No CORS? No `Access-Control-Allow-Origin` in the response. Browser drops the body.

curl does not send an `Origin` header. Neither does Postman. That is why they work and the browser does not.

The presigned URL is a red herring. The real issue is always CORS on the source bucket. Debugging presigned URLs by testing them in curl will never reproduce a browser CORS failure.

**Lesson:** If your presigned URLs work in curl but fail in the app, stop looking at the URL. Look at the bucket's CORS configuration and the request's `Origin` header.

## Failure 4: Two React-PDF Documents on One Source

This one is pure frontend, no AWS involved. But it appeared during the same deploy cycle and has the same signature: the infrastructure is correct, the data is available, the feature does not work.

react-pdf's `<Document>` component loads and parses a PDF. We had two `<Document>` components pointing at the same presigned URL—one for thumbnails, one for the main page view. Two instances compete for the same pdf.js worker state. When one re-renders, it tears down shared internal structures. The main page renders for a frame, then goes blank.

The fix: one `<Document>` wrapping both the thumbnail strip and the main page. The PDF loads once. Pages render from a shared parse tree.

**Why it belongs in this post:** The deploy succeeded. The image was correct. The data was available. The feature was broken because of a rendering race inside a library, invisible to any health check or smoke test that does not click through the actual UI.

## The Pattern

All four failures share a shape:

1. Infrastructure is correct (stacks deployed, services healthy, data reachable)
2. The failure is a runtime configuration gap (MIME type, CORS, library behavior)
3. No CloudFormation event, ECS alarm, or ALB metric detects it
4. Only a human (or a browser-level E2E test) surfaces the problem

This is the operational tail. It lives outside the IaC model. CDK does not know what nginx serves. CloudFormation does not know what `fetch()` needs. ECS health checks do not render PDFs.

## How to Close the Gap

You cannot eliminate these failures through better CDK alone. You need runtime verification that exercises the feature the way a user does.

**Post-deploy smoke tests that actually click:**
- Hit the upload presigned URL path (PUT, not just GET on the health endpoint)
- Load the PDF viewer route in a headless browser
- Verify the response includes `Access-Control-Allow-Origin` on a cross-origin S3 GET
- Check that `.mjs` assets return `text/javascript`, not `application/octet-stream`

**CORS as IaC, not an afterthought:**
- Every bucket that serves content to a browser via presigned URL needs CORS
- Imported buckets need custom resources—there is no shortcut
- `allowedCorsOrigins` belongs in your environment config, not hardcoded per bucket

**Container config as a tested artifact:**
- `nginx.conf` changes are invisible to CDK. Test them in the Docker build or in a post-deploy curl against the actual served assets
- Any new file extension your build emits (`.mjs`, `.wasm`, `.avif`) needs a MIME mapping

**Library migrations are infrastructure changes:**
- Switching from an iframe to react-pdf changed the fetch model (no-CORS native request to CORS XHR)
- Switching from a `.js` worker to a `.mjs` module changed the MIME requirement
- Neither change touched a CDK file. Both broke the deployed feature.

## The Uncomfortable Truth

CDK is an executable architecture document. It models resources, permissions, and relationships. It does not model what the user experiences after the deploy completes.

The gap between `CREATE_COMPLETE` and "it works" is filled with:
- HTTP headers that containers serve
- Browser security policies that enforce CORS and MIME checks
- Library internals that assume certain runtime conditions
- S3 bucket config on resources your stack does not own

You close it with runtime verification, custom resources for imported infrastructure, and the discipline to treat library upgrades as deployment-relevant changes—not just code changes.

Your pipeline should not finish when CloudFormation finishes. It should finish when the feature works in a browser.

---

**Series: AWS CDK on Complex Workloads**

| Part | Topic |
|------|-------|
| [1](https://ioni.solarz.me/journal/post.html?slug=aws-cdk-complex-deployment-postmortem) | Post-mortem: when simple services break the stack |
| [2](https://ioni.solarz.me/journal/post.html?slug=aws-cdk-layered-stacks-pipeline) | CloudFormation stack layers + pipeline |
| [3](https://ioni.solarz.me/journal/post.html?slug=bedrock-opensearch-guardduty-iac-checklist) | Bedrock, OpenSearch Serverless, GuardDuty IaC |
| [4](https://ioni.solarz.me/journal/post.html?slug=document-pipeline-event-driven-deploy) | Step Functions, EventBridge, UI events |
| **5 (this post)** | **Deploy succeeded. App still broken.** |

**Related:** [AWS FinOps: Cost Observability](https://ioni.solarz.me/journal/post.html?slug=aws-finops-cost-observability-complex-workload), [Why the AWS Console Is Not Enough](https://ioni.solarz.me/journal/post.html?slug=why-the-aws-console-is-not-enough).

---

*Feel free to share your thoughts by emailing me or reaching out on social media.*
