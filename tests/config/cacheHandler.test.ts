import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// @ts-expect-error -- cacheHandler.mjs is plain ESM with no type declarations.
import { BoundedGcsCacheHandler, INIT_TIMEOUT_MS, observeInitDuration } from '../../cacheHandler.mjs'

/**
 * Covers the two things this subclass exists for.
 *
 * On 2026-09-04 the live site stopped serving. Nothing in the suite touched the
 * cache handler, and nothing could have: next.config.ts gates it behind
 * NODE_ENV === production && PANTHEON_ENVIRONMENT, Playwright runs `next dev`,
 * and CACHE_BUCKET is unset locally. These tests do not close that gap — only a
 * production-representative environment can — but they pin the contracts so they
 * cannot regress silently.
 *
 * Methods are invoked via .call() on plain objects rather than real instances:
 * constructing GcsCacheHandler builds a GCS Storage client. That is safe because
 * each implementation touches only the fields stubbed here, and `super` binds
 * lexically to the class, so it still resolves through the prototype chain.
 */

describe('BoundedGcsCacheHandler.writeTagsMapping() — removes a write amplifier', () => {
  const writeTagsMapping = BoundedGcsCacheHandler.prototype.writeTagsMapping

  function makeCtx(saveImpl?: () => Promise<void>) {
    const save = vi.fn(saveImpl ?? (() => Promise.resolve()))
    return {
      ctx: {
        tagsMapKey: 'cache/tags/tags.json',
        bucket: { file: vi.fn(() => ({ save })) },
        log: { error: vi.fn() },
      },
      save,
    }
  }

  it('disables resumable uploads', async () => {
    // The defect: @google-cloud/storage enables resumable uploads by default and
    // its own docs recommend disabling them below 10MB, because the per-upload
    // overhead degrades "a series of small files". tags.json is ~100KB rewritten
    // every second by every instance — exactly that case. Upstream's
    // writeTagsMapping() omits the option, so each flush POSTs a resumable
    // SESSION INITIATION to /upload/storage/v1/, which is what the outage log
    // shows failing with ECONNRESET.
    const { ctx, save } = makeCtx()

    await writeTagsMapping.call(ctx, { posts: ['key-1'] })

    expect(save).toHaveBeenCalledTimes(1)
    expect(save.mock.calls[0][1]).toMatchObject({ resumable: false })
  })

  it('still sets the JSON content type', async () => {
    // Must not be lost while adding the resumable flag.
    const { ctx, save } = makeCtx()

    await writeTagsMapping.call(ctx, { posts: ['key-1'] })

    expect(save.mock.calls[0][1]).toMatchObject({
      metadata: { contentType: 'application/json' },
    })
  })

  it('writes to the tags map key, serialized as JSON', async () => {
    const { ctx, save } = makeCtx()

    await writeTagsMapping.call(ctx, { posts: ['key-1'] })

    expect(ctx.bucket.file).toHaveBeenCalledWith('cache/tags/tags.json')
    expect(JSON.parse(save.mock.calls[0][0])).toEqual({ posts: ['key-1'] })
  })

  it('re-throws on failure so the buffer can retry', async () => {
    // Load-bearing. TagsBuffer.doFlush() catches this to re-queue the pending
    // updates. Swallowing it would silently drop tag mappings and quietly break
    // revalidateTag() — the exact class of invisible failure that made this
    // outage take a day to characterise.
    const boom = new Error('ECONNRESET')
    const { ctx } = makeCtx(() => Promise.reject(boom))

    await expect(writeTagsMapping.call(ctx, { posts: ['key-1'] })).rejects.toThrow(boom)
    expect(ctx.log.error).toHaveBeenCalled()
  })
})

describe('writeTagsMapping wiring — the override actually reaches TagsBuffer', () => {
  // The gap every other test here leaves open. They invoke the prototype method
  // directly, so they pass identically whether or not the buffer ever calls it.
  // Upstream builds the buffer inside the SUPER constructor with
  //   writeTagsMapping: (mapping) => this.writeTagsMapping(mapping)
  // If that arrow captured the method rather than doing the lookup at call time,
  // the override would be inert and every assertion above would still be green.
  it('routes a buffer flush through the subclass override, with resumable disabled', async () => {
    const saves: Array<{ key: string; opts: Record<string, unknown> }> = []

    const handler = Object.create(BoundedGcsCacheHandler.prototype)
    handler.boundExceededCount = 0
    handler.tagsMapKey = 'cache/tags/tags.json'
    handler.log = { error: () => {}, warn: () => {}, debug: () => {} }
    handler.bucket = {
      file: (key: string) => ({
        save: (_data: string, opts: Record<string, unknown>) => {
          saves.push({ key, opts })
          return Promise.resolve()
        },
      }),
    }

    // Reproduce upstream's wiring verbatim: the callback is built here, in "super",
    // before any subclass member exists — the exact condition under suspicion.
    //
    // Deep relative path because the package `exports` map only exposes "." and
    // "./use-cache", so TagsBuffer is not reachable by package name. Using the REAL
    // buffer is the point: a hand-rolled stub would test this test's assumptions
    // rather than upstream's dispatch. Mirrors gcs.js:30-36 — if that wiring
    // changes shape upstream, this needs updating with it.
    const { TagsBuffer } = await import(
      // @ts-expect-error -- untyped internal module, deliberately reached into
      '../../node_modules/@pantheon-systems/nextjs-cache-handler/dist/utils/tags-buffer.js'
    )
    handler.tagsBuffer = new TagsBuffer({
      flushIntervalMs: 10,
      readTagsMapping: () => Promise.resolve({}),
      writeTagsMapping: (mapping: Record<string, string[]>) => handler.writeTagsMapping(mapping),
      handlerName: 'GcsCacheHandler',
    })

    handler.tagsBuffer.addTags('route-cache/x', ['posts'])
    await handler.tagsBuffer.flush()

    expect(saves).toHaveLength(1)
    expect(saves[0].key).toBe('cache/tags/tags.json')
    expect(saves[0].opts).toMatchObject({ resumable: false })
  })
})

describe('observeInitDuration() — what INIT_OBSERVED actually reports', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  function lastInfo(): string {
    const calls = (console.info as unknown as { mock: { calls: string[][] } }).mock.calls
    return calls[calls.length - 1][0]
  }

  it('reports the REAL init duration, not the bound and not a request wait', async () => {
    // The bug this exists to prevent: with a 100ms bound against an init genuinely
    // taking 500ms, the old implementation reported durationMs=100 — exactly the
    // bound, and exactly the number you would then use to justify the bound.
    let settle: () => void
    const initPromise = new Promise<void>((resolve) => {
      settle = resolve
    })

    observeInitDuration(initPromise, Date.now(), () => 0)

    await vi.advanceTimersByTimeAsync(500)
    settle!()
    await initPromise

    expect(lastInfo()).toContain('durationMs=500')
  })

  it('fires even when no request ever waited on init', async () => {
    // The second failure mode: the old code returned early on timeout, so on a
    // low-traffic environment with a slow init — precisely a PR environment — it
    // logged nothing at all. The measurement must not depend on traffic.
    const initPromise = Promise.resolve()

    observeInitDuration(initPromise, Date.now(), () => 0)
    await initPromise
    await vi.advanceTimersByTimeAsync(0)

    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('INIT_OBSERVED'))
  })

  it('reports how many requests hit the bound while init was still running', async () => {
    let waiting = 0
    const initPromise = Promise.resolve()

    observeInitDuration(initPromise, Date.now(), () => waiting)
    waiting = 7
    await initPromise
    await vi.advanceTimersByTimeAsync(0)

    // Read at settle time, not capture time — otherwise it always reports zero.
    expect(lastInfo()).toContain('boundExceededWhileWaiting=7')
  })

  it('does nothing when there is no init promise', () => {
    observeInitDuration(null, Date.now(), () => 0)
    observeInitDuration(undefined, Date.now(), () => 0)

    expect(console.info).not.toHaveBeenCalled()
  })
})

describe('BoundedGcsCacheHandler.ensureInitialized() — blast-radius bound', () => {
  const ensureInitialized = BoundedGcsCacheHandler.prototype.ensureInitialized

  function makeCtx(initPromise: Promise<void> | null) {
    return { initPromise, boundExceededCount: 0, initOutcomeLogged: false }
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('returns immediately when there is no init in flight', async () => {
    const ctx = makeCtx(null)

    await ensureInitialized.call(ctx)

    // No timer armed on the hot path — one per cache read would leak handles.
    expect(vi.getTimerCount()).toBe(0)
  })

  it('resolves as soon as init settles, without waiting for the bound', async () => {
    const ctx = makeCtx(Promise.resolve())

    // No timer advance: if this needed the bound to elapse, it would hang here.
    await ensureInitialized.call(ctx)

    expect(ctx.initPromise).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not report init duration from the request path', async () => {
    // Regression guard. This used to log INIT_OBSERVED from inside here, timing
    // from when a REQUEST started waiting — so it reported the wait, not the init,
    // and converged on the bound. Measuring the thing you calibrate against with a
    // number derived from that same thing is circular. It belongs on the promise.
    const ctx = makeCtx(Promise.resolve())

    await ensureInitialized.call(ctx)

    expect(console.info).not.toHaveBeenCalledWith(expect.stringContaining('INIT_OBSERVED'))
  })

  it('gives up at the bound when init never settles, and says so', async () => {
    // The outage shape: init awaiting GCS that is not answering.
    const ctx = makeCtx(new Promise<void>(() => {}))
    let settled = false

    const pending = ensureInitialized.call(ctx).then(() => {
      settled = true
    })

    await vi.advanceTimersByTimeAsync(INIT_TIMEOUT_MS - 1)
    expect(settled).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await pending

    expect(settled).toBe(true)
    expect(ctx.boundExceededCount).toBe(1)
    // Without this line firing in production we would have no idea the bound had
    // ever engaged — the blind spot that made the original failure invisible.
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('INIT_BOUND_EXCEEDED'))
  })

  it('makes every request pay the bound while init is still pending', async () => {
    // Pinning a limitation, not a feature. Promise.race does not cancel the loser,
    // and the inherited implementation only nulls initPromise after ITS await
    // resolves — which never happens here. So this is not "2s once, then fine".
    const ctx = makeCtx(new Promise<void>(() => {}))

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
    expect(ctx.boundExceededCount).toBe(2)
  })

  it('throttles the bound-exceeded warning instead of logging per request', async () => {
    // Every request pays the bound while init is pending, so an unthrottled log
    // would emit once per request and bury the signal it exists to provide.
    const ctx = makeCtx(new Promise<void>(() => {}))

    for (let i = 0; i < 5; i += 1) {
      const p = ensureInitialized.call(ctx)
      await vi.advanceTimersByTimeAsync(INIT_TIMEOUT_MS)
      await p
    }

    expect(ctx.boundExceededCount).toBe(5)
    expect(console.warn).toHaveBeenCalledTimes(1)
  })

  it('recovers: once init settles, later calls are immediate', async () => {
    // The half the docblock leans on. After a timeout the init promise is still
    // pending; when it eventually settles, initPromise must clear so requests stop
    // paying the bound. Without this the "degraded, not broken" claim is unproven.
    let release: () => void
    const ctx = makeCtx(
      new Promise<void>((resolve) => {
        release = resolve
      })
    )

    const first = ensureInitialized.call(ctx)
    await vi.advanceTimersByTimeAsync(INIT_TIMEOUT_MS)
    await first
    expect(ctx.boundExceededCount).toBe(1)

    release!()
    await ensureInitialized.call(ctx)

    expect(ctx.initPromise).toBeNull()
    expect(ctx.boundExceededCount).toBe(1)

    // And a subsequent call short-circuits without arming a timer at all.
    await ensureInitialized.call(ctx)
    expect(vi.getTimerCount()).toBe(0)
  })
})
