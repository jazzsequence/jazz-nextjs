import { GcsCacheHandler, FileCacheHandler } from '@pantheon-systems/nextjs-cache-handler'

// Overridable per environment so the bound can be tuned without a code change.
const INIT_TIMEOUT_MS = Number(process.env.CACHE_INIT_TIMEOUT_MS) || 2000

// CACHE_INIT_FAULT=hang makes init never settle, so an environment can demonstrate
// the bound instead of waiting for GCS to fail. Opt-in, announced at construction.
const INIT_FAULT = process.env.CACHE_INIT_FAULT || ''

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
  initPromise.then(() => {
    console.info(
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

export { BoundedGcsCacheHandler, INIT_TIMEOUT_MS, INIT_FAULT, observeInitDuration }
export default CacheHandler
