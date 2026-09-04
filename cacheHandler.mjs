import { GcsCacheHandler, FileCacheHandler } from '@pantheon-systems/nextjs-cache-handler'

// 2000ms is measured, not guessed. From 1265 INIT_OBSERVED samples on a Pantheon
// environment: p50=166 p90=427 p95=551 p99=825 max=1111, and ZERO exceeded 2000ms.
// So the bound sits at ~1.8x the worst observed init and never fires in normal
// operation — which matters, because when it does fire get() falls through to
// previous-build cache entries.
//
// WHAT THAT SAMPLE COVERS, because the population matters more than the numbers:
// init takes a cheap path when the stored buildId matches (base.js:78-86) and an
// expensive one when it does not — only the latter reaches invalidateRouteCache()
// and its awaited nukeCache(), which is bounded at 10000ms. Most of the 1265
// samples are the cheap path. Deploy-path inits ARE present but few: a rebuild
// produced six at 175-257ms, and a rebuild mints a new buildId even for the same
// commit, so those did run the full sweep.
//
// NOT COVERED: that sweep on an environment with a large edge cache. A PR
// environment's CDN purge returns almost immediately because there is nearly
// nothing to purge; live has a real edge cache. **The bound is therefore
// unvalidated for the slowest known path — a deploy-time purge on live.** If
// deploy-time init there runs past 2000ms, this fires on every deploy and get()
// falls through to previous-build entries, which looks like a CDN problem rather
// than this. Watch INIT_BOUND_EXCEEDED on the first deploy to any busy environment.
//
// Do not raise it casually: every additional second is worst-case blocking on the
// request path, and the sampled data says none is needed. Do not lower it below
// ~1200ms without re-measuring, or normal inits start tripping it.
//
// Re-measure by reading INIT_OBSERVED from the runtime log. Overridable per
// environment for tuning without a deploy.
const INIT_TIMEOUT_MS = Number(process.env.CACHE_INIT_TIMEOUT_MS) || 2000

// CACHE_INIT_FAULT=hang makes init never settle, so an environment can demonstrate
// the bound instead of waiting for GCS to fail. Opt-in, announced at construction.
const INIT_FAULT = process.env.CACHE_INIT_FAULT || ''

// GCS allows roughly one mutation per second to a single object. Upstream hardcodes
// flushIntervalMs: 1000, so cache/tags/tags.json runs exactly at that ceiling with
// no headroom and any burst goes over. Measured on pr-109: a 350-URL flood produced
// 476 "exceeded the rate limit for object mutation operations" on that one object.
//
// The damage is not a crash. Failed tag writes mean revalidateTag() records nothing,
// so published content silently never invalidates.
//
// 5s trades a slightly later tag landing for 5x headroom.
//
// Within one process, explicit revalidation is unaffected: readTagsMapping() flushes
// the buffer before reading, so a purge does not wait for the timer.
//
// ACROSS processes it is not. Instance A can hold a tag->key mapping in its in-memory
// buffer while instance B takes the revalidation webhook, flushes its own (empty)
// buffer, reads GCS, and never sees A's pending mapping. That race exists upstream at
// 1s; widening to 5s widens the window 5x. The trade is deliberate: a missed
// revalidation self-corrects at the next flush or ISR expiry, whereas a throttled
// tag write fails repeatedly and blocks invalidation outright. Revisit if content
// updates start needing more than one purge to appear.
const TAGS_FLUSH_INTERVAL_MS = Number(process.env.CACHE_TAGS_FLUSH_MS) || 5000

/**
 * Report real wall-clock init duration, once.
 *
 * Must be anchored to the promise, not to a request. Timing from inside
 * ensureInitialized() measures how long one REQUEST waited, which converges on
 * INIT_TIMEOUT_MS — the number you would then calibrate the bound from. It also
 * never fires when the request times out, which is the case that matters most.
 */
function observeInitDuration(initPromise, startedAt, getWaitCount) {
  if (!initPromise) {
    return
  }
  // Side-effect only: do not reassign this.initPromise. The fast path depends on
  // super nulling that exact object. Never rejects — super wraps it in .catch().
  //
  // console.warn, not console.info: Pantheon's runtime log drops info-level output.
  // Verified on pr-109 — zero INIT_OBSERVED lines, and zero of upstream's own
  // log.info('Initializing cache handler'), while 117 warn/error lines came through.
  // An unreadable measurement is the same as no measurement.
  initPromise.then(() => {
    console.warn(
      `[BoundedGcsCacheHandler] INIT_OBSERVED durationMs=${Date.now() - startedAt} ` +
        `bound=${INIT_TIMEOUT_MS}ms boundExceededWhileWaiting=${getWaitCount()}`
    )
  })
}

/**
 * GcsCacheHandler that bounds initialise and cheapens the tag-map write.
 *
 * 0.11.0 made get()/set() await ensureInitialized() (base.js:237/:323), where 0.9.0
 * discarded the init promise. Init's GCS reads are unbounded, so when they hang the
 * site stops serving rather than serving uncached.
 */
class BoundedGcsCacheHandler extends GcsCacheHandler {
  constructor(...args) {
    super(...args)

    this.boundExceededCount = 0
    this.widenTagsFlushInterval()

    // Captured before the fault swap below, so this times the real init.
    observeInitDuration(this.initPromise, Date.now(), () => this.boundExceededCount)

    if (INIT_FAULT === 'hang') {
      console.warn(
        '[BoundedGcsCacheHandler] FAULT INJECTION ACTIVE (CACHE_INIT_FAULT=hang): ' +
          'init will never settle. This is a deliberate test of the timeout bound. ' +
          'Unset CACHE_INIT_FAULT for normal operation.'
      )
      this.initPromise = new Promise(() => {})
    }
  }

  /**
   * Make cache read failures visible. They are invisible upstream.
   *
   * gcs.js:123 ends in a bare `catch { return null }`, and null is what a genuine
   * cache miss also returns. So a GCS read that fails — ECONNRESET, throttling,
   * anything — is indistinguishable from "not cached". That is the single reason the
   * 2026-09-04 outage went unnoticed for months and then took a day to characterise:
   * the busiest code path in the handler cannot report that it is failing.
   *
   * COST, stated plainly: this mirrors upstream's body rather than wrapping super(),
   * because super() swallows the error before we could see it. That means ~8 lines
   * duplicated from gcs.js:123-137 on the hottest path in the handler, and it will
   * drift if upstream changes the read. The tests below pin the contract — miss,
   * hit, and failure — so drift surfaces as a test failure rather than silently.
   * Delete this override the moment upstream logs its own read failures.
   *
   * Throttled by powers of ten, like INIT_BOUND_EXCEEDED: this runs on every cache
   * read, and one line per failure would bury the signal it exists to provide.
   */
  async readCacheEntry(cacheKey, cacheType) {
    try {
      const gcsKey = this.getCacheKey(cacheKey, cacheType)
      const file = this.bucket.file(gcsKey)
      const [exists] = await file.exists()
      if (!exists) {
        // A miss is not a failure. Conflating the two is the defect being fixed.
        return null
      }
      const [data] = await file.download()
      const parsed = JSON.parse(data.toString())
      return this.deserializeFromStorage({ [cacheKey]: parsed })[cacheKey] || null
    } catch (error) {
      this.readCacheFailureCount = (this.readCacheFailureCount || 0) + 1
      const n = this.readCacheFailureCount
      if (n === 1 || n === 10 || n === 100 || n % 1000 === 0) {
        console.warn(
          `[BoundedGcsCacheHandler] CACHE_READ_FAILED count=${n} key=${cacheKey} ` +
            `type=${cacheType} — serving as a cache MISS. Sustained counts mean GCS ` +
            'reads are failing, which upstream would report as an ordinary miss.',
          error
        )
      }
      return null
    }
  }

  /**
   * Widen the tag-buffer flush interval to get under the GCS per-object limit.
   *
   * Mutates the buffer super already built rather than replacing it: super handed
   * its callbacks to that exact instance, and replacing it would orphan any queued
   * updates. Safe because TagsBuffer reads flushIntervalMs inside scheduleFlush()
   * at call time, so a later write is picked up by the next schedule.
   */
  widenTagsFlushInterval() {
    if (this.tagsBuffer) {
      this.tagsBuffer.flushIntervalMs = TAGS_FLUSH_INTERVAL_MS
    }
  }

  /**
   * Drop tag-map references to route-cache keys that no longer exist.
   *
   * invalidateRouteCache() (gcs.js:166) deletes every route-cache object but never
   * calls tagsBuffer.deleteKeys(), so the map keeps pointing at keys whose objects
   * are gone. Dev's is 604KB with ~89% dead references. That matters here because
   * it inflates the single object every instance mutates once per flush, and that
   * object is the one hitting the GCS per-object rate limit.
   *
   * Object names are lossy — getCacheKey() replaces every non-alphanumeric with "_",
   * so a name cannot be turned back into a key. Matching runs forward instead:
   * compute each key's route-cache object name and test it against the deleted set.
   * Lossy in that direction too, so two keys can collide onto one name; the cost is
   * a spurious cache miss, which is the safe way to be wrong.
   *
   * Best effort by design. Never throws: this runs during startup, and a failed
   * prune must not be able to stop a process from serving.
   */
  async pruneRouteKeysFromTagMap(deletedObjectNames) {
    if (!deletedObjectNames || deletedObjectNames.size === 0) {
      return
    }
    try {
      const mapping = await this.readTagsMapping()
      const orphaned = new Set()
      for (const keys of Object.values(mapping)) {
        for (const key of keys) {
          if (deletedObjectNames.has(this.getCacheKey(key, 'route'))) {
            orphaned.add(key)
          }
        }
      }
      if (orphaned.size > 0) {
        this.tagsBuffer.deleteKeys([...orphaned])
      }
    } catch (error) {
      // Best effort — never rethrow. But LOG it: a bare silent catch here is the
      // same blindness as readCacheEntry()'s `catch { return null }`, which is why
      // the original outage went unnoticed for months. It already bit once during
      // development, swallowing a TypeError and presenting as "pruned nothing".
      console.warn('[BoundedGcsCacheHandler] TAG_PRUNE_FAILED', error)
    }
  }

  /**
   * Prune the tag map after the build sweep, without slowing startup.
   *
   * The enumeration must happen before super deletes the objects, and is cheap:
   * live's route-cache/ holds tens of objects, and super enumerates again anyway.
   * The expensive part — reading a ~100KB map, scanning it, writing it back —
   * runs unawaited, because initialize() is on the request path in 0.11.0 and
   * adding latency here would worsen the exact problem the bound exists to contain.
   */
  async invalidateRouteCache() {
    let deletedObjectNames = new Set()
    try {
      const [files] = await this.bucket.getFiles({ prefix: this.routeCachePrefix })
      deletedObjectNames = new Set(files.map((file) => file.name))
    } catch (error) {
      // Skip pruning this cycle rather than block the sweep — but emit. A silent
      // failure here means pruning no-ops on EVERY build while the tag map grows
      // unboundedly and nobody knows: the exact defect this method exists to fix,
      // reintroduced one level up. Catch to prevent propagation, always emit.
      console.warn('[BoundedGcsCacheHandler] TAG_PRUNE_LISTING_FAILED', error)
    }

    await super.invalidateRouteCache()

    void this.pruneRouteKeysFromTagMap(deletedObjectNames)
  }

  /**
   * Disable resumable uploads on the tag-map write.
   *
   * @google-cloud/storage enables resumable by default and recommends against it
   * below 10MB (file.js:3164-3175) because of the per-upload overhead on "a series
   * of small files". tags.json is ~100KB rewritten every second by every instance.
   *
   * This removes an amplifier, not the cause: writeCacheEntry() uses the same
   * file.save() with resumable equally enabled across ~18k objects and never failed.
   * The cause is per-object write frequency against a ~1 write/sec/object limit.
   *
   * The re-throw is load-bearing — TagsBuffer.doFlush() catches it to retry.
   */
  async writeTagsMapping(tagsMapping) {
    try {
      const file = this.bucket.file(this.tagsMapKey)
      await file.save(JSON.stringify(tagsMapping, null, 2), {
        resumable: false,
        metadata: { contentType: 'application/json' },
      })
    } catch (error) {
      this.log.error('Error writing tags mapping:', error)
      throw error
    }
  }

  /**
   * Bound the wait on init.
   *
   * Two things this does NOT do. Promise.race does not cancel the loser and super
   * only nulls initPromise after its own await resolves, so while init is pending
   * EVERY request pays the full bound, not just the first. And past the bound get()
   * falls through to readCacheEntry(), which returns PREVIOUS BUILD entries that
   * checkBuildInvalidation() has not wiped — reopening the staleness race
   * initPromise exists to close (base.js:44-50). That can surface as /_next/static/
   * 404s, so INIT_BOUND_EXCEEDED is the signal that distinguishes it from a genuine
   * asset problem.
   */
  async ensureInitialized() {
    if (!this.initPromise) {
      return
    }

    let timer
    let timedOut = false

    try {
      await Promise.race([
        super.ensureInitialized(),
        new Promise((resolve) => {
          timer = setTimeout(() => {
            timedOut = true
            resolve()
          }, INIT_TIMEOUT_MS)
        }),
      ])
    } finally {
      clearTimeout(timer)
    }

    if (timedOut) {
      this.boundExceededCount += 1
      // Throttled: every request pays the bound while init is pending, so one line
      // per request would bury the signal.
      const n = this.boundExceededCount
      if (n === 1 || n === 10 || n === 100 || n % 1000 === 0) {
        console.warn(
          `[BoundedGcsCacheHandler] INIT_BOUND_EXCEEDED count=${n} bound=${INIT_TIMEOUT_MS}ms — ` +
            'serving without completed init. Cache reads may return PREVIOUS BUILD entries, ' +
            'which can reference stale /_next/static/<buildId>/ assets.'
        )
      }
    }
  }
}

// Mirrors upstream shouldUseGcs('auto'). Inlined because createCacheHandler()
// returns the unbounded GcsCacheHandler; will not track upstream changes.
const CacheHandler = process.env.CACHE_BUCKET ? BoundedGcsCacheHandler : FileCacheHandler

export {
  BoundedGcsCacheHandler,
  INIT_TIMEOUT_MS,
  INIT_FAULT,
  TAGS_FLUSH_INTERVAL_MS,
  observeInitDuration,
}
export default CacheHandler
