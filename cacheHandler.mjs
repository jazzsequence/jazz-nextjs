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

/**
 * CACHE_INIT_FAULT=hang makes init never settle, so an environment can demonstrate
 * the bound instead of waiting for GCS to fail.
 *
 * ALLOWLISTED, not blocklisted, and that asymmetry is the whole point. A hung init
 * on live would leave every instance permanently past the bound, serving PREVIOUS
 * BUILD cache entries — which presents as /_next/static/ 404s, the same symptom as
 * the outage this file exists to contain. A console.warn is a notice, not a control.
 *
 * Arming requires an explicitly non-live PANTHEON_ENVIRONMENT, so an unset or
 * unrecognised environment stays inert rather than being treated as "not live".
 * Observed on pr-109: the flag took ~30 minutes to propagate on, and clearing it had
 * not confirmed at last check. A switch that is slow and unreliable to turn OFF must
 * be structurally prevented from applying where it would do damage.
 */
function resolveInitFault(env = process.env) {
  const requested = env.CACHE_INIT_FAULT || ''
  if (!requested) {
    return ''
  }
  const environment = env.PANTHEON_ENVIRONMENT || ''
  if (!environment || environment === 'live') {
    return ''
  }
  return requested
}

const INIT_FAULT = resolveInitFault()

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
 * Bounds on the tag-flush FAILURE path. Upstream has none of these.
 *
 * Measured 2026-09-08 on the test environment, which already carried every other
 * workaround in this file: a two-minute crawl tripped upstream's retry and it
 * never recovered. 404 "exceeded the rate limit for object mutation operations"
 * on cache/tags/tags.json were still firing 15 minutes after the last request,
 * with the site quiet. Write and retry log lines ran exactly 1:1.
 *
 * Upstream's doFlush (dist/utils/tags-buffer.js:121-133) retries on a CONSTANT
 * `flushIntervalMs * 2` — the comment says "backoff", the code has none — and
 * requeues failed updates uncapped. Since the whole mapping is rewritten to ONE
 * object per flush, each retry carries a larger payload than the one that just
 * failed. That is a positive feedback loop against a per-object rate limit.
 *
 * Widening flushIntervalMs cannot fix it; that only raises the load at which the
 * loop trips. These bound what happens once it has.
 */
const TAGS_MAX_RETRY_MS = Number(process.env.CACHE_TAGS_MAX_RETRY_MS) || 60_000
const TAGS_CIRCUIT_TRIP_FAILURES = Number(process.env.CACHE_TAGS_CIRCUIT_TRIP) || 5
const TAGS_CIRCUIT_COOLDOWN_MS = Number(process.env.CACHE_TAGS_CIRCUIT_COOLDOWN_MS) || 60_000
const TAGS_MAX_PENDING_UPDATES = Number(process.env.CACHE_TAGS_MAX_PENDING) || 2_000

/**
 * Bound the pending queue: coalesce first, then drop the OLDEST if still over.
 *
 * Dropping is a real loss, and asymmetric. A dropped ADD means revalidateTag()
 * will not purge that key and it falls back to its ISR TTL. A dropped DELETE is
 * worse: the mapping keeps pointing at a key whose object is gone, inflating the
 * very object under contention — the same rot pruneRouteKeysFromTagMap() exists
 * to clean up. Both are accepted deliberately, because an unbounded queue does
 * not preserve either, it just guarantees every subsequent write is larger and
 * likelier to fail. Newest are kept: they match the most recently published
 * content, and a stale mapping still expires by TTL.
 *
 * Pure by design — takes the array rather than the buffer — so the retention
 * policy can be asserted directly rather than only through doFlush().
 */
function capPendingUpdates(updates) {
  let next = coalesceTagUpdates(updates)
  if (next.length > TAGS_MAX_PENDING_UPDATES) {
    const dropped = next.length - TAGS_MAX_PENDING_UPDATES
    next = next.slice(next.length - TAGS_MAX_PENDING_UPDATES)
    console.warn(
      `[BoundedGcsCacheHandler] TAGS_QUEUE_TRIMMED dropped ${dropped} buffered tag ` +
        `update(s) over the ${TAGS_MAX_PENDING_UPDATES} cap; those keys will fall ` +
        `back to ISR expiry instead of explicit revalidation.`
    )
  }
  return next
}

/**
 * Collapse repeat updates sharing a (type, key, tags) signature, keeping the LAST.
 *
 * Deduping before capping shrinks the payload without discarding any mapping, so
 * it is strictly better than dropping entries.
 *
 * Why it is safe is stronger than an ordering argument: upstream's applyUpdates()
 * (tags-buffer.js:139-168) collects every delete in the batch into a Set and
 * applies them all before any add, and each add is guarded by includes() before
 * push. Deletes are therefore duplicate-free and adds are idempotent, so
 * collapsing identical signatures is result-preserving for ANY batch — it does
 * not depend on upstream staying order-insensitive.
 *
 * Fields are NUL-separated including the tag join: joining tags on a comma would
 * make ['a,b'] and ['a','b'] collide and silently drop a distinct update.
 */
function coalesceTagUpdates(updates) {
  const seen = new Set()
  const out = []
  for (let i = updates.length - 1; i >= 0; i--) {
    const u = updates[i]
    const signature = `${u.type}\u0000${u.cacheKey}\u0000${(u.tags || []).join('\u0000')}`
    if (seen.has(signature)) continue
    seen.add(signature)
    out.push(u)
  }
  return out.reverse()
}

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
    this.hardenTagsFlush()

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
   * drift if upstream changes the read. The tests pin miss, hit and failure — but
   * note those pin THIS override, so on their own they would stay green while a
   * changed upstream drifted silently underneath. A separate test therefore watches
   * upstream's own readCacheEntry and asserts it still swallows failures; that one
   * goes red the moment upstream reports them, which is the signal to delete this.
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
   * Replace TagsBuffer.doFlush()'s failure handling with something that can end.
   *
   * The success path is unchanged — read, apply, write. Only what happens after a
   * failed write differs, because that is where upstream spirals: constant-delay
   * retries against a rate-limited object, an uncapped requeue that makes every
   * retry heavier than the last, and nothing that ever gives up.
   *
   * Three bounds, in the order they matter:
   *   - a circuit breaker, so a sustained failure stops issuing writes entirely
   *     rather than hammering a refusing object indefinitely;
   *   - exponential backoff with jitter, so retries spread out instead of
   *     repeating at a fixed cadence — jitter because every instance shares the
   *     one object and lockstep retries are part of the pressure;
   *   - a cap on the queue, after coalescing, so the payload cannot grow forever.
   *
   * Mutates the buffer instance rather than subclassing TagsBuffer: super already
   * handed its read/write callbacks to this exact object, and replacing it would
   * orphan queued updates. Same reasoning as widenTagsFlushInterval().
   *
   * DELETE THIS when upstream's doFlush grows real backoff and a breaker.
   */
  hardenTagsFlush() {
    const buffer = this.tagsBuffer
    if (!buffer) {
      return
    }

    buffer.consecutiveFlushFailures = 0
    buffer.circuitOpenUntil = 0

    buffer.doFlush = async () => {
      if (buffer.isFlushing || buffer.pendingUpdates.length === 0) {
        return
      }

      // Circuit open: keep buffering (bounded) but do not touch storage. This is
      // the property that ends the storm — without it the retry timer and
      // flush()'s own recursion keep issuing writes to an object that is refusing
      // them, which is exactly what was measured running 15 minutes past the load.
      if (Date.now() < buffer.circuitOpenUntil) {
        buffer.pendingUpdates = capPendingUpdates(buffer.pendingUpdates)
        // Reschedule before returning. Upstream scheduleFlush() (tags-buffer.js:89)
        // runs on every addTags()/deleteKey() and computes its delay as
        // max(0, flushIntervalMs - timeSinceLastFlush) — and lastFlushTime only
        // advances on SUCCESS, so during a sustained failure that delay is 0ms.
        // Such a timer fires straight into this branch and clears itself. Without
        // re-arming here, the queue is left with no live timer and no log line
        // until some later addTags() happens by. Measured: 2 of 12 synthetic
        // crawls ended stranded that way.
        if (!buffer.flushTimer) {
          buffer.flushTimer = setTimeout(() => {
            buffer.flushTimer = null
            buffer.flush().catch(() => {})
          }, Math.max(1, buffer.circuitOpenUntil - Date.now()))
        }
        return
      }

      buffer.isFlushing = true
      const updates = buffer.pendingUpdates
      buffer.pendingUpdates = []

      try {
        const mapping = await buffer.readTagsMapping()
        buffer.applyUpdates(mapping, updates)
        await buffer.writeTagsMapping(mapping)
        buffer.lastFlushTime = Date.now()
        if (buffer.consecutiveFlushFailures > 0) {
          // Recovery needs its own line. Without it "it stopped" is only ever
          // inferable from the absence of errors, which is not a signal.
          console.warn(
            `[BoundedGcsCacheHandler] TAGS_FLUSH_RECOVERED after ` +
              `${buffer.consecutiveFlushFailures} consecutive failure(s)`
          )
        }
        buffer.consecutiveFlushFailures = 0
        buffer.circuitOpenUntil = 0
      } catch (error) {
        buffer.pendingUpdates = capPendingUpdates([...updates, ...buffer.pendingUpdates])
        buffer.consecutiveFlushFailures += 1

        if (buffer.consecutiveFlushFailures >= TAGS_CIRCUIT_TRIP_FAILURES) {
          buffer.circuitOpenUntil = Date.now() + TAGS_CIRCUIT_COOLDOWN_MS
          // `error` is carried deliberately. writeTagsMapping() logs and rethrows,
          // but readTagsMapping() swallows and applyUpdates() does not log at all,
          // so without this a throw from either reaches no log anywhere.
          console.warn(
            `[BoundedGcsCacheHandler] TAGS_CIRCUIT_OPEN after ` +
              `${buffer.consecutiveFlushFailures} consecutive flush failures; ` +
              `pausing tag writes for ${TAGS_CIRCUIT_COOLDOWN_MS}ms. ` +
              `revalidateTag() will not record during this window. Last error: ` +
              `${error instanceof Error ? error.message : String(error)}`
          )
        }

        // Exponential, jittered, capped. Jitter is applied before the cap, so
        // `capped` never exceeds TAGS_MAX_RETRY_MS. Note `delay` below can: the
        // cooldown clamp may raise it, so its real bound is
        // max(TAGS_MAX_RETRY_MS, TAGS_CIRCUIT_COOLDOWN_MS).
        //
        // Then clamped to outlast any open circuit, so this timer does not fire
        // into the early return and waste a cycle. That is an optimisation, NOT
        // the safety property: the early return re-arms its own timer, which is
        // what actually guarantees the queue drains. Relying on the clamp alone
        // would be wrong, because most timers during a failure are scheduled by
        // upstream's scheduleFlush(), not here — see the early return above.
        const growth = TAGS_FLUSH_INTERVAL_MS * 2 ** buffer.consecutiveFlushFailures
        const jittered = growth * (0.8 + Math.random() * 0.4)
        const capped = Math.min(Math.round(jittered), TAGS_MAX_RETRY_MS)
        const remainingCooldown = Math.max(0, buffer.circuitOpenUntil - Date.now())
        const delay = Math.max(capped, remainingCooldown)

        if (!buffer.flushTimer) {
          buffer.flushTimer = setTimeout(() => {
            buffer.flushTimer = null
            buffer.flush().catch(() => {})
          }, delay)
        }
      } finally {
        buffer.isFlushing = false
      }
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
  resolveInitFault,
  BoundedGcsCacheHandler,
  INIT_TIMEOUT_MS,
  INIT_FAULT,
  TAGS_FLUSH_INTERVAL_MS,
  TAGS_MAX_RETRY_MS,
  TAGS_CIRCUIT_TRIP_FAILURES,
  TAGS_CIRCUIT_COOLDOWN_MS,
  TAGS_MAX_PENDING_UPDATES,
  coalesceTagUpdates,
  capPendingUpdates,
  observeInitDuration,
}
export default CacheHandler
