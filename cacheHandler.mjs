import { GcsCacheHandler, FileCacheHandler } from '@pantheon-systems/nextjs-cache-handler'

/**
 * Upper bound on how long a request will wait for cache initialisation.
 *
 * WIP: 2000ms is a placeholder. The real value comes from measuring what
 * initialize() actually costs against a warm cache on a PR environment.
 */
const INIT_TIMEOUT_MS = 2000

/**
 * GcsCacheHandler with a bounded initialise.
 *
 * WHY THIS EXISTS — from the live runtime log of 2026-09-04, not from inference:
 *
 *   [GcsCacheHandler] Error reading tags mapping: FetchError: request to
 *   .../o/cache%2Ftags%2Ftags.json failed, reason: Client network socket
 *   disconnected before secure TLS connection was established  (ECONNRESET)
 *
 * 153 of those, ramping 3 -> 71 per minute, alongside 13 SIGTERMs.
 *
 * The bottleneck is NOT new in 0.11.0. TagsBuffer is byte-identical in 0.9.0:
 * both keep the whole tag->key mapping in ONE object (cache/tags/tags.json) and
 * flush it as a full read-modify-write on a 1s timer. Upstream comments the
 * constraint itself — "GCS rate limit is 1 write/second per object" — but that
 * budget is per object across ALL writers while the interval is per process, so
 * N autoscaled instances are N x over budget on the same object. Failure then
 * re-queues every pending update and retries at 2x interval, unbounded, so each
 * failure makes the next attempt larger.
 *
 * What 0.11.0 changed is one line — gcs.js:37 `this.initialize().catch(...)`
 * became gcs.js:39 `this.setInitPromise(this.initialize().catch(...))`, with
 * get() (base.js:237) and set() (base.js:323) now awaiting ensureInitialized().
 * initialize() does NOT reach the buffered flush — worth stating because the
 * obvious reading is wrong. It is initializeTagsMapping() + checkBuildInvalidation():
 * an exists() metadata check on tags.json (the .save() branch only fires when the
 * object is absent, which it is not on live), a build-meta.json download, and on a
 * new buildId the route sweep. readTagsMapping() -> flush() has two callers,
 * base.js:92 and base.js:365, and neither is reachable from init — gcs.js:105
 * overrides updateTagsMapping() to be buffer-only, so the base version never runs
 * on this path.
 *
 * So init is a VICTIM of whatever is breaking these connections, not a participant.
 * What 0.11.0 does is move init's unbounded GCS calls onto the request path; under
 * the connection failures in the log, any of them can hang a request that 0.9.0
 * would have served uncached. Same I/O, same failures, different blast radius.
 *
 * The platform could not see it: Next binds :3000 before any cache code runs, so
 * "STARTUP TCP probe succeeded" logged 25 times, every time. Restart reason was
 * always AUTOSCALING, never a failed health check — unanswered requests read as
 * demand, so the platform added instances, i.e. added writers to the one object.
 *
 * Deliberately NOT cited: the route-cache delete sweep. Investigated and ruled
 * out — live's route-cache/ holds tens of objects, and the sweep is identical in
 * 0.9.0. See DEPLOYMENT.md. (Separately, invalidateRouteCache() never calls
 * tagsBuffer.deleteKeys(), so tags.json accrues dead references and grows without
 * bound — that inflates the object being contended, but it is not the mechanism.)
 *
 * WHAT THIS DOES: restores 0.9.0's property — GCS is off the request path — while
 * staying on 0.11.0. If init has not finished within the bound, serve from the
 * PREVIOUS BUILD'S CACHE rather than not serving at all.
 *
 * Not "serve uncached" — that wording was wrong and the distinction is the whole
 * risk. Past the bound, get() falls through to readCacheEntry() (gcs.js:123),
 * which reads route-cache entries that checkBuildInvalidation() has not wiped
 * yet. Bounding the wait therefore knowingly re-opens the cross-build staleness
 * race that 0.11.0 added initPromise to close — upstream documents that race at
 * base.js:44-50 and again at base.js:233-237. It is a defensible trade (a stale
 * page beats a 502) but it is a trade, not a free win.
 *
 * CONCRETE HAZARD when interpreting multidev results: previous-build HTML/RSC can
 * reference /_next/static/<old-buildId>/… assets absent from the deployed image.
 * That presents as static assets 404ing — the same symptom as the outage this is
 * meant to address. If 404s appear after a deploy, THIS CHANGE is a candidate
 * cause, not only the thing being tested.
 *
 * ALSO UNBOUNDED: readCacheEntry() itself — file.exists() then file.download(),
 * neither bounded. And because Promise.race does not cancel the loser, the init
 * I/O keeps running after the bound expires. Since init does not perform the
 * contended write (see above), bounding it cannot relieve contention — it only
 * stops requests waiting on a hung read, i.e. it relocates where they queue.
 * Measure on the multidev rather than assuming the bound is sufficient.
 *
 * Do NOT cite "5000 requests in-flight" as a measured peak. That is teeny-request's
 * DEFAULT_WARN_CONCURRENT_REQUESTS, and requestStarting() latches
 * _didConcurrentRequestWarn on first emission, so it fires once per process ever and
 * never reports a maximum. N occurrences means N processes each crossed the
 * threshold once; the true ceiling is unknown and unbounded above.
 *
 * WHAT THIS DOES NOT FIX: Promise.race does not cancel the loser, and
 * super.ensureInitialized() only clears initPromise after its await resolves. So
 * while init is pending EVERY request pays the full bound, not just the first.
 * If init never settles this converts "hard down" into "permanently slower by the
 * bound, and uncached" — a large improvement, not a repair. Each timed-out request
 * also leaves a suspended async frame that never drains. The real fix is upstream:
 * keep the tags flush off the request path, and stop holding a global mutable
 * index in a single rate-limited object.
 *
 * Upstream already bounds its edge-purge calls with an AbortController and a
 * timeout (edge/edge-cache-clear.js); the GCS path simply does not. If that is
 * fixed upstream, this subclass can be deleted.
 */
class BoundedGcsCacheHandler extends GcsCacheHandler {
  async ensureInitialized() {
    if (!this.initPromise) {
      return
    }

    let timer
    try {
      await Promise.race([
        super.ensureInitialized(),
        new Promise((resolve) => {
          timer = setTimeout(resolve, INIT_TIMEOUT_MS)
        }),
      ])
    } finally {
      clearTimeout(timer)
    }
  }
}

/**
 * Mirrors upstream's `shouldUseGcs('auto')`: GCS when a bucket is configured,
 * file-based otherwise. Inlined rather than calling createCacheHandler() because
 * that returns the unbounded GcsCacheHandler. This is a copy, so it will not
 * track upstream if they add a condition to shouldUseGcs().
 */
const CacheHandler = process.env.CACHE_BUCKET ? BoundedGcsCacheHandler : FileCacheHandler

export { BoundedGcsCacheHandler, INIT_TIMEOUT_MS }
export default CacheHandler
