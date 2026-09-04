import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// @ts-expect-error -- cacheHandler.mjs is plain ESM with no type declarations.
import { BoundedGcsCacheHandler, INIT_TIMEOUT_MS } from '../../cacheHandler.mjs'

/**
 * Covers the one behaviour this subclass exists for: a request must not wait
 * indefinitely on cache initialisation.
 *
 * On 2026-09-04 the live site stopped serving because 0.11.0 made get()/set()
 * await ensureInitialized(), and initialize() reaches a GCS read-modify-write of
 * a single rate-limited object (cache/tags/tags.json) that was failing with
 * ECONNRESET under multi-instance contention. Nothing in the suite touched the
 * cache handler at all, and nothing could have: next.config.ts gates it behind
 * NODE_ENV === production && PANTHEON_ENVIRONMENT, Playwright runs `next dev`,
 * and CACHE_BUCKET is unset locally.
 *
 * These tests do not close that gap — only a production-representative
 * environment can. What they do is pin the override's contract so it cannot
 * regress silently, and lock in the surprising part (below) as intended.
 *
 * ensureInitialized() is invoked via .call() on a plain object rather than a
 * real instance: constructing GcsCacheHandler builds a GCS Storage client. That
 * is safe because the inherited implementation touches only `this.initPromise`,
 * and `super` binds lexically to the class, so it still resolves through
 * BoundedGcsCacheHandler's prototype chain.
 */
describe('BoundedGcsCacheHandler.ensureInitialized()', () => {
  const ensureInitialized = BoundedGcsCacheHandler.prototype.ensureInitialized

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns immediately when there is no init in flight', async () => {
    const ctx = { initPromise: null }

    await ensureInitialized.call(ctx)

    // No timer is armed on the hot path. Arming one per request would leak a
    // pending handle for every cache read on a warm process.
    expect(vi.getTimerCount()).toBe(0)
  })

  it('resolves as soon as init settles, without waiting for the bound', async () => {
    const ctx: { initPromise: Promise<void> | null } = { initPromise: Promise.resolve() }

    // No timer advance: if this needed the bound to elapse, it would hang here.
    await ensureInitialized.call(ctx)

    expect(ctx.initPromise).toBeNull()
  })

  it('clears the timeout once init wins the race', async () => {
    const ctx: { initPromise: Promise<void> | null } = { initPromise: Promise.resolve() }

    await ensureInitialized.call(ctx)

    // The `finally { clearTimeout(timer) }` — without it every request that hit
    // a pending init would leave a live timer behind.
    expect(vi.getTimerCount()).toBe(0)
  })

  it('gives up at the bound when init never settles', async () => {
    // The outage shape: initialize() awaiting GCS that is not answering.
    const ctx = { initPromise: new Promise<void>(() => {}) }
    let settled = false

    const pending = ensureInitialized.call(ctx).then(() => {
      settled = true
    })

    await vi.advanceTimersByTimeAsync(INIT_TIMEOUT_MS - 1)
    expect(settled).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await pending

    expect(settled).toBe(true)
  })

  it('makes every request pay the bound while init is still pending', async () => {
    // Deliberately pinning the limitation, not a feature. Promise.race does not
    // cancel the loser, and the inherited ensureInitialized() only nulls
    // initPromise after ITS await resolves — which never happens here. So this
    // is not "2s once, then fine": it is 2s on every request until init settles.
    // Documented in cacheHandler.mjs; asserted here so it cannot be quietly
    // mistaken for a fix.
    const ctx = { initPromise: new Promise<void>(() => {}) }

    const first = ensureInitialized.call(ctx)
    await vi.advanceTimersByTimeAsync(INIT_TIMEOUT_MS)
    await first

    expect(ctx.initPromise).not.toBeNull()

    let secondSettled = false
    const second = ensureInitialized.call(ctx).then(() => {
      secondSettled = true
    })

    await vi.advanceTimersByTimeAsync(INIT_TIMEOUT_MS - 1)
    expect(secondSettled).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await second
    expect(secondSettled).toBe(true)
  })
})
