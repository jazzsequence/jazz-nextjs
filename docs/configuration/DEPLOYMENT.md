# Deployment Guide

This document describes how to deploy the jazz-nextjs application to test and live environments on Pantheon.

## Pantheon Next.js Architecture

The jazz-nextjs site runs on Pantheon's Next.js infrastructure:
- **Hosting**: Node.js containers behind global CDN
- **Build process**: Triggered by GitHub pushes/tags
- **Environments**: Dev, Test, Live, plus PR-specific environments
- **Reference**: [Pantheon documentation site](https://github.com/pantheon-systems/documentation) uses the same architecture

## Environment Pattern

All environments generate unique subdomains:
```
https://<environment>-<site_machine_name>.pantheonsite.io
```

- **Dev**: `dev-jazz-nextjs15.pantheonsite.io`
- **Test**: `test-jazz-nextjs15.pantheonsite.io`
- **Live**: `live-jazz-nextjs15.pantheonsite.io`
- **PRs**: `pr-42-jazz-nextjs15.pantheonsite.io` (PR #42)

## Next.js Configuration Requirements

The `next.config.js` must include:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // REQUIRED for Pantheon deployment
  // ... other config
};

module.exports = nextConfig;
```

## Pantheon Cache Handler

As of February 2026, Pantheon provides `@pantheon-systems/nextjs-cache-handler` for persistent caching that survives deployments.

### Version — 0.11.0, with a bounded initialise

**Runs 0.11.0.** `cacheHandler.mjs` subclasses `GcsCacheHandler` to bound
`ensureInitialized()`, because 0.11.0 makes `get()`/`set()` await it and none of the GCS I/O
in `initialize()` has a timeout. 0.11.0 took the live site down on 2026-09-04; rolling back to
0.9.0 restored service.

**The live pin is separate and still in force.** Live remains on 0.9.0 until the bounded
handler has taken several real deploys on Dev and Test with `INIT_BOUND_EXCEEDED` watched —
see **LIFT WHEN** below. A single-instance PR environment cannot validate multi-instance
behaviour or a deploy-time CDN purge against a large edge cache.

**Verified by code inspection.** 0.9.0 initialised fire-and-forget
(`this.initialize().catch(() => {})`). 0.11.0 made it blocking — `setInitPromise()` /
`ensureInitialized()` in `dist/handlers/base.js`, awaited by `get()` and `set()`. A slow
or failing `initialize()` therefore stops being a cache miss and becomes unavailability.

**Verified by measurement.** Live's bucket holds tens of thousands of objects under
`fetch-cache/` but only tens under `route-cache/`. The build-invalidation sweep
(`invalidateRouteCache()`, `gcs.js:166`) enumerates `route-cache/`, so it deletes tens
of objects — not thousands. That sweep is byte-identical in 0.9.0; the only difference
is that 0.9.0 does not make requests wait for it.

**Verified by reading the runtime log** (this replaces the earlier "not explained" entry;
the log was available throughout and the gap was that nobody had read it). Every error in
the captured window falls into exactly two headlines, `[GcsCacheHandler] Error reading tags
mapping` and `Error writing tags mapping`, and every one is against the single object
`cache/tags/tags.json`. No other GCS object appears in any error. Alongside them:
`TeenyStatisticsWarning: Possible excessive concurrent requests detected`, plus ECONNRESET,
`Client network socket disconnected before secure TLS connection was established`, EPIPE and
socket hang-ups.

**Do not read that warning as a measured peak.** The figure it prints is
`TeenyStatistics.DEFAULT_WARN_CONCURRENT_REQUESTS`, the library's default threshold, and
`requestStarting()` latches `_didConcurrentRequestWarn` on first emission — so it fires
**once per process, ever**, and never reports a maximum. N occurrences means N processes each
crossed the threshold once; the true ceiling is unknown and unbounded above. It also means the
warning's timing tracks *process starts*, not load, so its distribution across the incident
window says nothing about when contention began.

So the TLS failures are **client-side connection exhaustion, not GCS refusing us** — a
rate limit returns 429/503, an actual HTTP response, not a handshake torn down before it
completes. Write errors begin a minute *before* read errors, so this is not only an
init/read-path problem.

**The bottleneck predates 0.11.0.** Unpacking 0.9.0 confirms `TagsBuffer` is byte-identical:
same single `cache/tags/tags.json`, same 1s flush, same `// GCS rate limit is 1 write/second
per object` comment. That budget is per object across **all** writers while the flush
interval is per process, so one instance complies and autoscaled instances cannot. On
failure `doFlush()` re-queues every pending update and retries with no queue cap, so the
payload grows monotonically once failures start. The only delta in 0.11.0 is `gcs.js:37`
`this.initialize().catch(...)` becoming `gcs.js:39` `setInitPromise(this.initialize().catch(...))`
plus the awaits at `base.js:237`/`:323`.

**Init is a victim of the contention, not a participant — the obvious reading is wrong.**
`initialize()` is `initializeTagsMapping()` + `checkBuildInvalidation()`: an `exists()`
metadata check on `tags.json` (its `.save()` branch fires only when the object is absent,
which it is not on live), a `build-meta.json` download, and on a new buildId the route sweep.
`readTagsMapping()` → `tagsBuffer.flush()` has exactly two callers, `base.js:92` and
`base.js:365`, and neither is reachable from init — `gcs.js:105` overrides
`updateTagsMapping()` to be buffer-only, so the base version never runs on the GCS path. What
0.11.0 moves onto the request path is init's **unbounded reads**, any of which can hang under
the connection failures the buffer's write contention produces.

This has a practical consequence: because init does not perform the contended write, bounding
it **cannot relieve contention** — it only stops requests waiting on a hung read.

**Why the platform never noticed.** `STARTUP TCP probe succeeded ... port 3000` logged on
every restart, always succeeding — Next binds the port before any cache code runs. Restart
reason was always `AUTOSCALING`, never a failed health check. Stalled requests read as
demand, so the platform added instances, i.e. added writers to the one contended object.

**Still not demonstrated.** Whether the first domino was GCS pushing back on write
contention or something degrading outbound connections generally. Failures being confined
to `tags.json` points hard at object contention, but the causal direction is not proven.

Three earlier explanations were investigated and are **wrong** — an unreachable bucket,
0.11.0's new image cache, and a large route-cache sweep. Do not repeat them. A fourth,
"the health probe killed the process", is also wrong: the probe never failed.

**LIFT WHEN** a release survives a deploy on an environment carrying a cache comparable
to live's, across both prefixes, since which one matters is unresolved. A green CI run
does **not** qualify: the handler is inert unless `NODE_ENV=production` and
`PANTHEON_ENVIRONMENT` are both set (`next.config.ts:9`), so local build and E2E never
instantiate it. Nor does a PR environment, which carries roughly a hundred objects.

**Related defect, separate from the pin.** The tag manifest is never pruned of
references to evicted entries — `invalidateRouteCache()` deletes route-cache objects but
never calls `tagsBuffer.deleteKeys()`. Dev references thousands of keys against hundreds of
real objects, and its manifest is far larger than live's despite holding much less
cache. It inflates the very object every instance contends on, so the cost of each buffered
flush grows with an environment's age regardless of traffic. (It is **not** read and rewritten
inside init — see above; init only does an `exists()` check against it.)

**Known trade-off in the bounded init — read before interpreting multidev results.**
Past the bound, `get()` falls through to `readCacheEntry()` (`gcs.js:123`) and reads
route-cache entries that `checkBuildInvalidation()` has not wiped yet. So the timeout does
**not** degrade to "uncached"; it degrades to **the previous build's cache**. That knowingly
re-opens the cross-build staleness race `initPromise` was added to close (documented upstream
at `base.js:44-50` and `base.js:233-237`). Concretely, previous-build HTML/RSC can reference
`/_next/static/<old-buildId>/…` assets absent from the deployed image, presenting as static
assets 404ing — the same symptom as the original outage. **If 404s appear on the multidev
after a deploy, the bounded init is a candidate cause, not only the thing under test.**
`readCacheEntry()` is also unbounded in its own right, and `Promise.race` does not cancel
the loser, so init I/O continues after the bound expires: if the mechanism is socket
exhaustion, the bound relocates where requests queue rather than reducing contention.

**Installation**:
```bash
npm install @pantheon-systems/nextjs-cache-handler
```

**Configuration**:

1. Create `cacheHandler.mjs` in project root:
```javascript
import { createCacheHandler } from '@pantheon-systems/nextjs-cache-handler'

const CacheHandler = createCacheHandler({
  type: 'auto', // Auto-detect: GCS if CACHE_BUCKET exists, else file-based
})

export default CacheHandler
```

2. Update `next.config.ts`:
```typescript
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  cacheHandler: path.resolve(__dirname, "./cacheHandler.mjs"),
  cacheMaxMemorySize: 0, // Disable in-memory caching
  output: "standalone",
};
```

**Environment Variables** (set in Pantheon dashboard):
- `CACHE_BUCKET`: GCS bucket name (automatically set by Pantheon in production)
- `OUTBOUND_PROXY_ENDPOINT`: Edge cache proxy (automatically set by Pantheon)
- `CACHE_DEBUG`: Set to `true` or `1` for debug logging (optional)

**Features**:
- Persistent caching across deployments
- Automatic GCS storage in production, file-based in development
- Full support for `revalidateTag()`, `revalidatePath()`, and ISR
- Automatic CDN cache invalidation on content updates
- Smart build deploys: page caches refresh, data caches preserved

**v0.9.0 behavior change**: `revalidateTag()` no longer deletes the cache entries it
revalidates. It marks them stale via the shared `tagsManifest` (matching Next's own
`FileSystemCache.revalidateTag`), so the last-good value stays servable while Next
revalidates in the background.

This matters for high-cardinality tags. Before 0.9.0, revalidating `posts` — which is
attached to the homepage, every archive, and every post — triggered a synchronous
delete-sweep that held the webhook connection open past the client timeout, failing
three `/api/revalidate` E2E tests against Dev. Confirmed fixed on the PR-78 environment.

**Next.js version pin**: `next` is pinned to exactly `16.2.12` (no caret). The 16.3.x
line fails the Pantheon buildpack at "Finalizing page optimization" with
`ENOENT: .next/next-server.js.nft.json`, the file-tracing manifest that
`output: 'standalone'` requires. It does **not** reproduce locally — only in Pantheon's
Linux buildpack under Turbopack, so a green local build is not sufficient evidence.
Re-validate on a PR environment before moving to 16.3.x rather than assuming it is still
broken. The pin stays exact so npm cannot re-resolve into 16.3.x on its own.

**Dependabot**: `16.3.x` is in the `ignore` block of `.github/dependabot.yml`, so it no
longer opens PRs — including **security** PRs, since a `versions:` ignore suppresses
those too. Dependabot alerts still fire and are the signal to watch. The review protocol
that keeps this from going stale is "Ignored Dependency Updates" in `@AGENTS.md`; remove
the ignore entry when a lift succeeds.

**Re-validation log**:

| Date | Version | Result |
|---|---|---|
| 2026-08-17 | 16.3.1 | FAIL — pr-78 build `6c1e9cf6`, `ENOENT next-server.js.nft.json` |
| 2026-08-31 | 16.3.3 | FAIL — pr-88 build `1fe23cd4`, byte-identical `ENOENT` |
| 2026-08-31 | 16.2.12 | **Adopted** — current pin; lint/unit/build/E2E green locally, buildpack confirmed on pr-90 |
| 2026-09-01 | 16.3.4 | FAIL — pr-94 build `1fe6a733`, byte-identical `ENOENT`. Surfaced by Dependabot security PR #94, which proposed 16.3.4 to fix the vendored `sharp` HIGH |

The 16.3.x line has now failed on **16.3.1, 16.3.3 and 16.3.4** with the same error, so
treat it as broken rather than flaky. The next candidate is 16.4.x — though as of
2026-09-01 only `16.4.0-canary.*` exists, so there is nothing stable to test yet.
Note the failure is not visible in GitHub Actions, which reports only
`BUILD_FAILURE` — and Pantheon's API
was returning 503 when pr-94 first failed, so the log had to be re-fetched once the
platform recovered. A CI failure alone is not evidence of *which* failure.

**Security status of the pin** (as of 2026-09-01 — re-check before acting, advisories move):

**Resolved by the move to 16.2.12.** 16.2.7 carried nine open advisories (4 HIGH:
middleware/proxy bypass, DoS in Server Actions, SSRF in Server Actions on custom servers,
SSRF in rewrites; 5 MODERATE, including cache confusion). All nine list
`firstPatchedVersion: 16.2.11` in the GitHub advisory database — the *same minor line* —
so a patch bump cleared them without touching the 16.3.x line that has failed the
buildpack three times. `npm audit` still reports a `next` finding, but not for any
Next.js advisory — see below.

**What remains, and the fix that is available.** Dependabot alerts (enabled 2026-09-01)
report five open alerts against the copies `next` vendors — `postcss@8.4.31` (two HIGH,
two MEDIUM) and `sharp@0.34.5` (one HIGH). *Dependabot's* only remedy is bumping `next`
into 16.3.x —
it opened security PR #94 proposing 16.3.4 for precisely this, and that build failed with
the same `ENOENT`.

But Dependabot's remedy is not the only one. An npm `overrides` block collapses the
vendored copies onto the already-patched top-level versions, **without touching the `next`
pin**:

```json
"overrides": { "postcss": "$postcss", "sharp": "$sharp" }
```

Verified 2026-09-01: both nested copies disappear from the tree and `npm audit` stops
flagging `next`, `postcss` and `sharp` entirely — total findings 16 → 13, HIGH 8 → 5.
That is those three packages and nothing else. In Dependabot's units it clears **five
alerts** (#11, #12 HIGH postcss; #10 HIGH sharp; #3, #17 MEDIUM postcss) — the counts
differ because `npm audit` groups per package while Dependabot lists per advisory. The
full local gate passes: lint, unit tests, build, E2E.

**Keep the lockfile in place** when testing this. The change should be a clean ~590-line
deletion of the nested entries. Deleting `package-lock.json` and re-resolving instead
floats unrelated packages and produced 30 spurious failures
(`Cannot assign to read only property 'fetch'`, from a drifted happy-dom) — that is not a
signal about the override.

**Not yet validated on Pantheon**, which is the part that matters: `sharp` is a native
binary, and `next@16.2.12` declares `sharp: ^0.34.5`, so 0.35.4 is outside its stated
range. Runtime image optimization is the risk to watch. Local green is not sufficient
evidence here — that is the whole lesson of the version pin above. Test on a PR
environment before adopting.

Until then these five alerts are **untested-but-fixable**, not unfixable.

Two CRITICAL RCEs are named in the 16.3.3 release notes (Windows-hosted servers; the
Image Optimization API with AVIF). Their advisories are not published in the global
database, so their affected ranges could not be confirmed — it is **unknown** whether
they reach 16.2.x. What is known: 16.2.12's release notes contain no security fixes, so
neither has been backported to the 16.2.x line as of 16.2.12. Treat that as a genuinely
open question, not as a reason to jump straight to 16.3.x.

**Don't read `npm audit`'s summary as a verdict on `next`.** It reports one severity and
one `range` per package, merged across every advisory that touches it — direct *and*
transitive. Two ways that misleads:

- **`range` is not a fix boundary.** It spans every version affected by anything, so a
  version that fixes all of the package's own advisories can still appear inside it. At
  16.2.7 the merged range read `9.3.4-canary.0 - 16.3.0-preview.10`, which invites the
  conclusion that the fix lives in 16.3.x. It does not — it is 16.2.11.
- **The finding may not be about `next` at all.** Worked example from this repo: `next`
  *was* flagged HIGH, with `via: ["postcss","sharp"]` and **zero direct Next.js
  advisories**. The top-level `postcss` (8.5.26) and `sharp` (0.35.4) were both patched;
  the finding *came* from copies `next` vendored inside its own tree —
  `next/node_modules/postcss@8.4.31` and
  `next/node_modules/sharp@0.34.5`. `next` pins `postcss` exactly (`8.4.31`) and
  constrains `sharp` to `^0.34.5`; neither top-level version satisfies those ranges, so
  npm nested a second copy of each. **This repo now overrides both** — see "Vendored
  dependency overrides" below. Check each finding's `nodes` array, not just `via`, to see
  which copy is implicated.
- **`fixAvailable` can point somewhere dangerous.** For this finding npm reports
  `next@16.3.4` — precisely the line the pin exists to avoid. **Do not run
  `npm audit fix` here**; it would break the Pantheon build.

Read the `via` array — advisory objects are direct, bare strings are transitive — check
`nodes` to locate the offending copy, and check `firstPatchedVersion` on the individual
advisories rather than trusting `fixAvailable`:

```bash
gh api graphql -f query='{securityVulnerabilities(package:"next",ecosystem:NPM,first:30)
  {nodes{severity vulnerableVersionRange firstPatchedVersion{identifier}}}}'
```

**Vendored dependency overrides**: `package.json` carries

```json
"overrides": { "postcss": "$postcss", "sharp": "$sharp" }
```

`next` vendored its own `postcss@8.4.31` and `sharp@0.34.5`, which carried five Dependabot
alerts (2 HIGH + 2 MEDIUM postcss, 1 HIGH sharp). Dependabot's only remedy was bumping
`next` into 16.3.x, which fails the buildpack — so the override collapses the nested copies
onto the already-patched top-level versions instead, without touching the pin. The `$name`
form resolves to *this project's declared range*, so it tracks the direct dependency rather
than duplicating a version that would silently desynchronize.

Effect: `npm audit` 16 → 13 findings, HIGH 8 → 5, and all five Dependabot alerts clear.
The lockfile change is a pure deletion of 27 nested entries.

**Re-check this override on every `next` bump.** It is unconditional: if a future `next`
requires `postcss@9.x` or `sharp@0.36+`, `$postcss`/`$sharp` will silently force the older
major and can fail in ways that are hard to attribute back to here. Nothing in
`package.json` signals that coupling.

Risk notes, from validating it:
- **`sharp` is the override that carries risk** — a native binary, and 0.35.4 is outside
  `next`'s declared `^0.34.5`. All eleven sharp APIs Next's image optimizer calls
  (`concurrency`, `timeout`, `resize`, `rotate`, `trim`, `webp`, `avif`, `jpeg`, `png`,
  `toBuffer`, `metadata`) were smoke-tested green on 0.35.4 / libvips 8.18.6, and
  `/_next/image?…&w=640` produced a real WebP transcode.
- **`postcss` is lower risk than the exact pin suggests** — a semver-minor bump inside 8.x,
  pure JS, no native binary. The CSS pipeline (`@tailwindcss/postcss`, `autoprefixer`)
  already resolved to top-level 8.5.26; the nested copy was reachable only via Next's own
  webpack CSS path.
- **The AVIF path is not covered by E2E.** The optimizer returns WebP even when sent
  `Accept: image/avif`. AVIF is the surface one of the unconfirmed CRITICAL RCEs above
  concerns, so it is worth manual checking if that ever becomes relevant.
- `tests/e2e/images.spec.ts` fetches through `/_next/image`, so the E2E run against a
  `pr-N` environment does exercise Linux sharp — that run is the real verdict, not local
  green. Note its assertions are wrapped in `if (imageCount > 0)`, so the spec cannot fail
  if images ever stop rendering entirely.

To read the real build log (GitHub Actions only reports `BUILD_FAILURE`):

```bash
terminus auth:login --email=<you>@pantheon.io
SESSION=$(cat ~/.terminus/cache/session | python3 -c "import json,sys; print(json.load(sys.stdin)['session'])")
# List builds to get the build ID:
curl -s -H "X-Pantheon-Session: $SESSION" \
  "https://terminus.pantheon.io/api/sites/$SITE_UUID/environment/$ENV/build/list?limit=5"
# Fetch the log — note this path is site-level, NOT environment-scoped:
curl -s -H "X-Pantheon-Session: $SESSION" \
  "https://terminus.pantheon.io/api/sites/$SITE_UUID/build/$BUILD_ID/log"
```

**References**:
- [Release Notes](https://docs.pantheon.io/release-notes/2026/02/nextjs-cache-handler)
- [GitHub Repository](https://github.com/pantheon-systems/nextjs-cache-handler)

## Deployment Methods

### Automatic Deployments

#### Dev Environment
- **Trigger**: Push to `main` branch
- **Process**:
  1. GitHub push triggers Pantheon GitHub Application
  2. Pantheon runs build: `npm ci && npm run build`
  3. Deploys to Dev environment
- **No manual action required**

#### Pull Request Environments
- **Trigger**: Open pull request, and each subsequent push
- **URL Pattern**: `pr-<number>-<site>.pantheonsite.io`
- **Process**: Same as Dev, but creates temporary environment
- **Cleanup**: Environment deleted when PR closes

**If no build appears for a pushed commit, check whether builds are running at all before
theorising about the commit.** A build record normally appears within seconds of the push
(~2s on one observed push), so a gap of several minutes is meaningful while a gap of one
minute is not. Once enough time has passed, compare across environments:

```bash
# dev, plus any currently-open PR environment
for ENV in dev pr-<number>; do terminus node:builds:list jazz-nextjs15.$ENV | head -5; done
```

If `dev` is *also* missing a build for a recent `main` merge, the stall is **not specific
to your branch or your push** — look for a platform-side problem rather than anything
about the commit. `terminus node:builds:rebuild` returns exit 0 and produces nothing in
that state; exit 0 means the request was accepted, never that a build was created, so
always confirm with `node:builds:list`.

### Deploying to Test & Live (Branch-Based)

Test and Live deployments are triggered by merging into the `test` or `live` branches. The [promote-pantheon](.github/workflows/promote-pantheon.yml) GitHub Actions workflow automatically creates the required Pantheon tag (`pantheon_test_N` or `pantheon_live_N`) when a push is detected on either branch.

**To deploy to Test**, merge `main` into `test`:
```bash
git checkout test
git merge main
git push origin test
# CI creates pantheon_test_N and pushes the tag — Pantheon builds Test automatically
```

**To deploy to Live**, merge `test` into `live`:
```bash
git checkout live
git merge test
git push origin live
# CI creates pantheon_live_N and pushes the tag — Pantheon builds Live automatically
```

**Monitor the deployment**:
```bash
terminus node:logs:build:list jazz-nextjs15.test
terminus node:logs:build:list jazz-nextjs15.live
```

**Rollback**: tag a previous commit manually:
```bash
git tag pantheon_live_N <previous-commit-hash>
git push origin pantheon_live_N
```

> **Note for AI agents**: Do NOT merge to `test` or `live` branches without explicit user request. These are production-affecting actions. See `AGENTS.md` for the full rule.

## Build Process

When Pantheon receives a push or tag:

1. **Clone**: Repository cloned at the triggering commit
2. **Install**: `npm ci --quiet --no-fund --no-audit`
   - Uses `yarn` if `yarn.lock` present
   - Uses `pnpm` if `pnpm-lock.yaml` present
3. **Build**: `npm run build`
4. **Deploy**:
   - Static assets → shared object storage
   - Application code → Node.js containers
5. **Monitor** build status:
   ```bash
   terminus node:logs:build:list jazz-nextjs.<env>
   ```

### Build Statuses

- `BUILD_QUEUED` → Build waiting to start
- `BUILD_WORKING` → Build in progress
- `BUILD_SUCCESS` → Build completed successfully
- `DEPLOYMENT_QUEUED` → Deployment waiting
- `DEPLOYMENT_WORKING` → Deployment in progress
- `DEPLOYMENT_SUCCESS` → Live on Pantheon
- `BUILD_FAILURE` / `DEPLOYMENT_FAILURE` → Check logs

### Known Buildpack Restrictions

**Do not commit `.php` files to this repository.**

Pantheon's Google Cloud buildpack detects PHP files and runs the PHP runtime buildpack alongside the Node.js buildpack. When this happens, the Node.js runtime layer (`google.nodejs.runtime`) fails to install correctly, and the deployed container cannot find `node` at `/layers/google.nodejs.runtime/node/bin/node`, causing `DEPLOYMENT_FAILURE`.

If WordPress-related PHP code needs to be distributed alongside this repo (e.g., mu-plugins, webhook handlers), keep it in the WordPress repository (`jazzsequence.com`) rather than here. Reference the file path in comments or documentation if needed.

## Automated Testing on Pantheon

Tests run ON Pantheon environments VIA GitHub Actions workflows. This ensures tests execute against the actual deployed application, not just locally.

### Test Environment URLs

- **Dev**: `dev-jazz-nextjs15.pantheonsite.io` (terminus: `jazz-nextjs15.dev`)
- **PR**: `pr-{number}-jazz-nextjs15.pantheonsite.io` (terminus: `jazz-nextjs15.pr-{number}`)
- **Test**: `test-jazz-nextjs15.pantheonsite.io` (terminus: `jazz-nextjs15.test`)
- **Live**: `live-jazz-nextjs15.pantheonsite.io` (terminus: `jazz-nextjs15.live`)

### GitHub Actions Testing Workflow

The `.github/workflows/test-pantheon.yml` workflow runs automated tests against deployed Pantheon environments:

**Trigger events**:
- Push to `main` branch → tests run against `dev-jazz-nextjs15.pantheonsite.io`
- Pull request opened/updated → tests run against `pr-{number}-jazz-nextjs15.pantheonsite.io`

**Workflow steps**:
1. Checkout code and setup Node.js (version from `.nvmrc`)
2. Restore npm cache, then install dependencies with `npm ci`
3. **Run lint**: `npm run lint` — placed before the deployment wait so its output is
   visible in ~1 minute rather than after a ~10 minute build, and so it still reports
   when the Pantheon build fails
4. Determine target environment (dev or PR-specific)
5. Wait for Pantheon build and deployment (`jazzsequence/pantheon-wait-for-build@v1`)
6. Run unit tests: `npm test -- --run`
7. Install Playwright browsers (chromium)
8. Verify the Pantheon site responds with HTTP 200
9. Run E2E tests: `npm run test:e2e` with `BASE_URL` set to Pantheon environment
10. Upload the Playwright report and publish it to GitHub Pages
11. Report results in the GitHub Actions summary
12. Fail the workflow if lint, unit tests, or E2E did not succeed

**Re-running a failed job does not retry the build.** `wait-for-build.sh` selects the
first build record matching the commit SHA and exits non-zero on any terminal `*FAILURE*`
status — it never looks past that first match, so it will not pick up a newer build even
for the same SHA. A successful build must therefore exist *before* the job is re-run;
re-running against a failed build just re-reads the same dead record in seconds.

**Gating**: lint, unit tests, and E2E each use `continue-on-error: true` so that one
failure does not hide the others. The final step re-reads their `.outcome` values and
exits non-zero if any failed — so the workflow does go red, but only at the end of the
job rather than at the failing step.

**Deployment detection**:
- Build and deploy status come from the `pantheon-wait-for-build` action
- A follow-up accessibility check polls the environment URL for HTTP 200
  (12 attempts, 5s apart) before E2E runs
- Fails if the site is not reachable within that window

**GitHub Secrets used by this workflow**:
- `PANTHEON_MACHINE_TOKEN` - Machine token, passed to the `pantheon-wait-for-build` action
  - Generate at: https://dashboard.pantheon.io/users/#account/tokens
  - Add to GitHub: Settings → Secrets and variables → Actions → New repository secret
- `REVALIDATE_SECRET` - shared secret for `/api/revalidate`. **The whole E2E run fails
  without it.** `tests/e2e/api-revalidate.spec.ts` throws at collection time with a named
  error when `CI` is set and the secret is missing or empty, so the run aborts before any
  test executes — 0 tests, exit 1, and a GitHub annotation naming the secret. That is
  deliberate: it previously fell back to `'test-secret'`, which turned a missing secret
  into ~10 401 failures that read as an auth regression. The fallback is kept for local
  runs, where `webServer.env` uses the same value so client and server agree.
- `WORDPRESS_USERNAME`, `WORDPRESS_APP_PASSWORD` - **not GitHub secrets for this
  workflow.** They are consumed by the Next.js *server runtime*
  (`src/lib/wordpress/client.ts`, `src/lib/wordpress/greeting.ts`,
  `app/api/contact/route.ts`) for WordPress basic auth. On a deployed environment that
  runtime is on Pantheon, so it reads them from Pantheon dashboard env vars — see
  "WordPress Application Passwords" below. They were previously passed to the E2E step
  where they did nothing, and have been removed; do not re-add them.

Other workflows use their own secrets — `slack-notify-deploy.yml` needs
`SLACK_DEPLOYBOT_TOKEN` (see `@docs/architecture/SLACK_NOTIFICATIONS.md`), and it and
`promote-pantheon.yml` reuse `PANTHEON_MACHINE_TOKEN`.

See `.github/workflows/test-pantheon.yml` for full implementation.

### Pantheon API Integration

The [Pantheon API (beta)](https://api.pantheon.io/docs/swagger.json) can be used to:
- Poll build status before running tests
- Retrieve deployment information
- Monitor workflow progress

**Known Limitation**: The current Pantheon documentation repository workflow experiences timeouts waiting for builds to complete. This may require custom polling logic or Pantheon API integration improvements.

### Testing Strategy

1. **Local tests** (`npm test`) - Run during development and pre-commit
2. **Pantheon build** - Triggered by push/PR
3. **GitHub Actions** - Wait for Pantheon build, then run E2E tests
4. **Environment-specific tests** - Different test suites for Dev/PR/Test/Live

## Custom Domain Setup

To connect a custom domain (typically to Live):
1. Follow [Pantheon's custom domain guide](https://docs.pantheon.io/nextjs/connecting-custom-domain)
2. Update DNS records
3. Configure HTTPS certificate

## Pre-Deployment Checklist

Before deploying to Test or Live:

- [ ] All tests passing: `npm test`
- [ ] Build succeeds locally: `npm run build`
- [ ] Standalone build tested: `npm run start:test`
- [ ] E2E tests pass against standalone build
- [ ] No secrets in committed files
- [ ] Environment variables configured in Pantheon dashboard
- [ ] WordPress application passwords have NO spaces (critical for Pantheon)
- [ ] Documentation updated
- [ ] CLAUDE.md and AI_USAGE.md current

## Rollback Strategy

If a deployment causes issues:

1. **Quick fix**: Push fix to GitHub, create new tag
2. **Rollback**: Create tag pointing to previous working commit
   ```bash
   git tag pantheon_live_N <previous-commit-hash> -a -m "Rollback to working version"
   git push origin --tags
   ```

## Environment Variables

Set environment variables in Pantheon dashboard, not in committed files:
- WordPress API URL
- API keys
- Feature flags

Never commit `.env` files to version control.

### Local Development Environment Variables

For local development, create a `.env.local` file in the project root. See `.env.local.example` for the required format.

**CRITICAL**: WordPress application passwords must have all spaces removed, both locally AND in Pantheon.

WordPress displays application passwords with spaces for readability (e.g., `4Wjp 1234 abcd efgh`), but you must remove ALL spaces when storing them:
- **Local**: `.env.local` file
- **Pantheon**: Environment variables in dashboard

**Example `.env.local`**:
```bash
WORDPRESS_API_URL=https://jazzsequence.com/wp-json/wp/v2
WORDPRESS_USERNAME=your_username
WORDPRESS_APP_PASSWORD=4Wjp1234abcdefgh  # NO SPACES!
```

### WordPress Application Passwords (Pantheon)

**CRITICAL**: WordPress application passwords must have all spaces removed when stored in Pantheon environment variables.

WordPress displays application passwords with spaces for readability:
```
4Wjp 1234 abcd efgh
```

But when storing in Pantheon dashboard, remove ALL spaces:
```
4Wjp1234abcdefgh
```

**Why**: Pantheon's build scripts parse environment variables using shell, and values with spaces can cause syntax errors like `local: 4Wjp: bad variable name`, resulting in build failures.

**Affected secrets**:
- `WORDPRESS_APP_PASSWORD` (if using authenticated requests)
- Any other secrets containing spaces

## GitHub Application

Requires Pantheon's GitHub Application to be:
- Installed on the repository
- Authorized for the organization
- Configured with proper permissions

See [Pantheon GitHub Application docs](https://docs.pantheon.io/github-application) for setup.

## References

- [Pantheon Next.js Architecture](https://docs.pantheon.io/nextjs/architecture)
- [Test and Live Environments](https://docs.pantheon.io/nextjs/test-and-live-env)
- [Pantheon Documentation Repository](https://github.com/pantheon-systems/documentation) (reference implementation)

## OG Image URL Configuration

OG image URLs are set as absolute URLs via `OG_IMAGE_URL` in `src/lib/utils/og.ts` using `NEXT_PUBLIC_SITE_URL ?? https://next.jazzsequence.com`, preventing `metadataBase` domain mismatch.

## Last Updated
2026-04-03
