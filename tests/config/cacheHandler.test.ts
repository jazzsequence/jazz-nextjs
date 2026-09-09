import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// @ts-expect-error -- cacheHandler.mjs is plain ESM with no type declarations.
import {
  BoundedGcsCacheHandler,
  INIT_TIMEOUT_MS,
  INIT_BUILD_TIMEOUT_MS,
  observeInitDuration,
  shouldSuppressRouteEntry,
} from '../../cacheHandler.mjs'

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

describe('fault injection — must be structurally impossible on live', () => {
  // Written before the implementation. CACHE_INIT_FAULT=hang replaces initPromise
  // with one that never settles. That is exactly right on a PR environment and
  // catastrophic on live: every instance would sit permanently past the bound with
  // page entries suppressed, so the whole site would render uncached for the life of
  // every process — an origin-load failure rather than the stale-asset one this used
  // to cause, and no less catastrophic.
  //
  // A console.warn is a notice, not a control. And the timing makes it worse: on
  // pr-109, ~30 minutes elapsed between setting the flag and seeing it take effect,
  // and clearing it had not confirmed at last check. That interval covers a rebuild
  // — a secret reaches a running app no other way — rather than anything propagating
  // on its own. A switch that is slow and unreliable to turn OFF must be prevented
  // from applying where it would hurt.
  it('is inert on live even when the flag is set', async () => {
    const { resolveInitFault } = await import('../../cacheHandler.mjs')
    expect(resolveInitFault({ PANTHEON_ENVIRONMENT: 'live', CACHE_INIT_FAULT: 'hang' })).toBe('')
  })

  it('activates on a non-live environment', async () => {
    const { resolveInitFault } = await import('../../cacheHandler.mjs')
    expect(resolveInitFault({ PANTHEON_ENVIRONMENT: 'pr-109', CACHE_INIT_FAULT: 'hang' })).toBe(
      'hang'
    )
  })

  it('is inert when the flag is unset', async () => {
    const { resolveInitFault } = await import('../../cacheHandler.mjs')
    expect(resolveInitFault({ PANTHEON_ENVIRONMENT: 'dev' })).toBe('')
  })

  it('fails safe when the environment is unknown', async () => {
    // An unset PANTHEON_ENVIRONMENT must not be treated as "not live" by accident;
    // it should still require an explicit non-live environment to arm.
    const { resolveInitFault } = await import('../../cacheHandler.mjs')
    expect(resolveInitFault({ CACHE_INIT_FAULT: 'hang' })).toBe('')
  })
})

describe('readCacheEntry — make read failures visible', () => {
  // Written before the implementation. Upstream (gcs.js:123) ends in a bare
  // `catch { return null }` with no logging, and null is indistinguishable from a
  // cache miss. Every GCS read failure is therefore invisible by construction —
  // the single reason the 2026-09-04 outage went unnoticed for months and then took
  // a day to characterise.
  //
  // This is the hot path — every cache read — so logging must be throttled, using
  // the same powers-of-ten pattern as INIT_BOUND_EXCEEDED. Unthrottled it would
  // bury the signal it exists to provide.
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const realGetCacheKey = Object.getPrototypeOf(BoundedGcsCacheHandler.prototype).getCacheKey

  function makeCtx(fileImpl: Record<string, unknown>) {
    return {
      readCacheFailureCount: 0,
      routeCachePrefix: 'route-cache/',
      fetchCachePrefix: 'fetch-cache/',
      imageCachePrefix: 'image-cache/',
      getCacheKey: realGetCacheKey,
      deserializeFromStorage: (o: Record<string, unknown>) => o,
      bucket: { file: () => fileImpl },
    }
  }

  const failing = {
    exists: () => Promise.reject(new Error('ECONNRESET')),
    download: () => Promise.reject(new Error('ECONNRESET')),
  }

  it('still returns null on failure, so behaviour is unchanged', async () => {
    const ctx = makeCtx(failing)

    const result = await BoundedGcsCacheHandler.prototype.readCacheEntry.call(ctx, 'x', 'route')

    expect(result).toBeNull()
  })

  it('logs the first failure instead of swallowing it', async () => {
    const ctx = makeCtx(failing)

    await BoundedGcsCacheHandler.prototype.readCacheEntry.call(ctx, 'x', 'route')

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('CACHE_READ_FAILED'),
      expect.anything()
    )
  })

  it('throttles on the hot path rather than logging every read', async () => {
    const ctx = makeCtx(failing)

    for (let i = 0; i < 9; i += 1) {
      await BoundedGcsCacheHandler.prototype.readCacheEntry.call(ctx, 'x', 'route')
    }

    expect(ctx.readCacheFailureCount).toBe(9)
    expect(console.warn).toHaveBeenCalledTimes(1)
  })

  it('returns null for a genuine miss without logging', async () => {
    // A miss is not a failure. Conflating them is the whole problem being fixed.
    const ctx = makeCtx({ exists: () => Promise.resolve([false]) })

    const result = await BoundedGcsCacheHandler.prototype.readCacheEntry.call(ctx, 'x', 'route')

    expect(result).toBeNull()
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('upstream still swallows read failures — DELETE THE OVERRIDE WHEN THIS GOES RED', async () => {
    // Pins the *reason the override exists*, not the override's own behaviour.
    //
    // The other tests here assert what our override does, so if upstream changed
    // readCacheEntry they would all stay green while our copy silently kept the old
    // semantics — drift with no signal, which is the exact failure class this PR is
    // about. This one watches upstream directly: the moment it reports its own read
    // failures, this goes red and the override should be deleted.
    const upstreamRead = Object.getPrototypeOf(BoundedGcsCacheHandler.prototype).readCacheEntry
    const log = { warn: vi.fn(), error: vi.fn(), debug: vi.fn(), info: vi.fn() }
    const ctx = { ...makeCtx(failing), log }

    const result = await upstreamRead.call(ctx, 'x', 'route')

    expect(result).toBeNull()
    expect(console.warn).not.toHaveBeenCalled()
    expect(log.warn).not.toHaveBeenCalled()
    expect(log.error).not.toHaveBeenCalled()
  })

  it('returns the entry on a successful read', async () => {
    const ctx = makeCtx({
      exists: () => Promise.resolve([true]),
      download: () => Promise.resolve([Buffer.from(JSON.stringify({ value: 'ok' }))]),
    })

    const result = await BoundedGcsCacheHandler.prototype.readCacheEntry.call(ctx, 'x', 'route')

    expect(result).toEqual({ value: 'ok' })
    expect(console.warn).not.toHaveBeenCalled()
  })
})

describe('tag flush interval — headroom under the GCS per-object limit', () => {
  // Written before the implementation. Reproduced on pr-109: flooding the
  // environment produced 476 "exceeded the rate limit for object mutation
  // operations" on cache/tags/tags.json. GCS allows ~1 mutation/sec to a single
  // object; upstream hardcodes flushIntervalMs: 1000, so it runs exactly at the
  // ceiling with zero headroom and any burst goes over. The visible damage is not
  // a crash — it is revalidateTag() silently failing to record anything, so new
  // content never invalidates.
  it('widens the buffer flush interval above the 1/sec ceiling', async () => {
    const { TAGS_FLUSH_INTERVAL_MS } = await import('../../cacheHandler.mjs')
    expect(TAGS_FLUSH_INTERVAL_MS).toBeGreaterThan(1000)
  })

  it('applies the wider interval to the buffer upstream already built', async () => {
    // Must mutate the existing buffer rather than replace it: super's constructor
    // already handed its callbacks to that instance, and TagsBuffer reads
    // flushIntervalMs inside scheduleFlush() at call time, so a later write takes
    // effect. Replacing the object would orphan any pending updates.
    const { BoundedGcsCacheHandler: Handler, TAGS_FLUSH_INTERVAL_MS } = await import(
      '../../cacheHandler.mjs'
    )
    const buffer = { flushIntervalMs: 1000 }
    const ctx = { tagsBuffer: buffer }

    Handler.prototype.widenTagsFlushInterval.call(ctx)

    expect(buffer.flushIntervalMs).toBe(TAGS_FLUSH_INTERVAL_MS)
  })

  it('does not throw when there is no buffer', async () => {
    const { BoundedGcsCacheHandler: Handler } = await import('../../cacheHandler.mjs')
    expect(() => Handler.prototype.widenTagsFlushInterval.call({})).not.toThrow()
  })
})

describe('pruneRouteKeysFromTagMap — stop the tag map growing forever', () => {
  // Written before the implementation. invalidateRouteCache() (gcs.js:166) deletes
  // every route-cache object but never calls tagsBuffer.deleteKeys(), so the tag
  // map keeps references to keys whose objects are gone — dev's is 604KB with ~89%
  // dead. That inflates the one object every instance mutates, which is what runs
  // into the GCS per-object rate limit.
  //
  // Object names are lossy (getCacheKey replaces non-alphanumerics with "_"), so a
  // name cannot be turned back into a key. Match forward instead: compute each
  // key's route-cache object name and test it against the deleted set.
  // Borrow the REAL getCacheKey off GcsCacheHandler.prototype rather than
  // reimplementing the lossy name transform. A hand-written copy would drift from
  // upstream and quietly stop matching, which is the failure this guards against.
  const realGetCacheKey = Object.getPrototypeOf(BoundedGcsCacheHandler.prototype).getCacheKey

  function makeCtx(mapping: Record<string, string[]>) {
    const deleted: string[][] = []
    return {
      ctx: {
        routeCachePrefix: 'route-cache/',
        fetchCachePrefix: 'fetch-cache/',
        imageCachePrefix: 'image-cache/',
        getCacheKey: realGetCacheKey,
        log: { error: () => {}, warn: () => {}, debug: () => {} },
        readTagsMapping: () => Promise.resolve(mapping),
        tagsBuffer: { deleteKeys: (k: string[]) => deleted.push(k) },
      },
      deleted,
    }
  }

  it('drops keys whose route-cache object was deleted', async () => {
    const { ctx, deleted } = makeCtx({ posts: ['/posts/a', '/posts/b'] })

    await BoundedGcsCacheHandler.prototype.pruneRouteKeysFromTagMap.call(
      ctx,
      new Set(['route-cache/_posts_a.json'])
    )

    expect(deleted).toHaveLength(1)
    expect(deleted[0]).toEqual(['/posts/a'])
  })

  it('leaves keys alone when their object still exists', async () => {
    const { ctx, deleted } = makeCtx({ posts: ['/posts/a'] })

    await BoundedGcsCacheHandler.prototype.pruneRouteKeysFromTagMap.call(ctx, new Set())

    expect(deleted).toHaveLength(0)
  })

  it('does not touch fetch-cache keys, which this sweep never deletes', async () => {
    // The sweep enumerates route-cache/ only. Live holds tens of objects there
    // against ~18k under fetch-cache/, so pruning by the wrong prefix would
    // discard the overwhelming majority of a live tag map.
    const { ctx, deleted } = makeCtx({ posts: ['/api/data'] })

    await BoundedGcsCacheHandler.prototype.pruneRouteKeysFromTagMap.call(
      ctx,
      new Set(['fetch-cache/_api_data.json'])
    )

    expect(deleted).toHaveLength(0)
  })

  it('de-duplicates a key referenced by several tags', async () => {
    const { ctx, deleted } = makeCtx({
      posts: ['/posts/a'],
      menu: ['/posts/a'],
      header: ['/posts/a'],
    })

    await BoundedGcsCacheHandler.prototype.pruneRouteKeysFromTagMap.call(
      ctx,
      new Set(['route-cache/_posts_a.json'])
    )

    expect(deleted[0]).toEqual(['/posts/a'])
  })

  it('skips the tag-map read entirely when nothing was deleted', async () => {
    // This runs inside initialize(), which 0.11.0 puts on the request path. Reading
    // a ~100KB object for a no-op would add latency to the exact path the bound
    // exists to protect.
    let read = false
    const ctx = {
      routeCachePrefix: 'route-cache/',
      log: { error: () => {}, warn: () => {}, debug: () => {} },
      readTagsMapping: () => {
        read = true
        return Promise.resolve({})
      },
      tagsBuffer: { deleteKeys: () => {} },
    }

    await BoundedGcsCacheHandler.prototype.pruneRouteKeysFromTagMap.call(ctx, new Set())

    expect(read).toBe(false)
  })

  it('swallows failures — pruning is best effort and must not break startup', async () => {
    const ctx = {
      routeCachePrefix: 'route-cache/',
      log: { error: () => {}, warn: () => {}, debug: () => {} },
      readTagsMapping: () => Promise.reject(new Error('429')),
      tagsBuffer: { deleteKeys: () => {} },
    }

    await expect(
      BoundedGcsCacheHandler.prototype.pruneRouteKeysFromTagMap.call(
        ctx,
        new Set(['route-cache/_x.json'])
      )
    ).resolves.toBeUndefined()
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
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  function lastInfo(): string {
    const calls = (console.warn as unknown as { mock: { calls: string[][] } }).mock.calls
    return calls[calls.length - 1][0]
  }

  it('logs at warn level, because Pantheon drops info-level output', async () => {
    // Regression guard for a bug that only appeared in production. This used
    // console.info, which passes every local test and emits nothing on Pantheon:
    // pr-109 showed zero INIT_OBSERVED lines and zero of upstream's own
    // log.info('Initializing cache handler'), while warn/error came through fine.
    // A measurement you cannot read is not a measurement.
    const initPromise = Promise.resolve()

    observeInitDuration(initPromise, Date.now(), () => 0)
    await initPromise
    await vi.advanceTimersByTimeAsync(0)

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('INIT_OBSERVED'))
    expect(console.info).not.toHaveBeenCalled()
  })

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

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('INIT_OBSERVED'))
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

    expect(console.warn).not.toHaveBeenCalledWith(expect.stringContaining('INIT_OBSERVED'))
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

describe('hardenTagsFlush() — stop the retry storm', () => {
  // Written before the implementation. Measured 2026-09-08 against the test
  // environment, which already carries every other workaround in this file: a
  // two-minute crawl tripped upstream's flush retry and it never recovered.
  // 404 "exceeded the rate limit for object mutation operations" on
  // cache/tags/tags.json were still firing 15 minutes after the last request,
  // with the site completely quiet. Write and retry lines ran exactly 1:1.
  //
  // Upstream's doFlush (dist/utils/tags-buffer.js:121-133) has three problems:
  //   1. The comment says "Schedule a retry with backoff"; the code is a CONSTANT
  //      setTimeout(..., flushIntervalMs * 2). Against a per-object rate limit a
  //      fixed interval can never recover — it just keeps hitting the ceiling.
  //   2. pendingUpdates is requeued and never dropped or capped, so the payload
  //      grows monotonically and each retry is likelier to fail than the last.
  //   3. No circuit breaker and no attempt cap, so nothing ever gives up.
  //
  // Widening flushIntervalMs cannot fix any of that — it only raises the load at
  // which the loop trips. This replaces the failure path, not the success path.

  function makeBuffer(overrides = {}) {
    return {
      pendingUpdates: [],
      flushTimer: null,
      isFlushing: false,
      lastFlushTime: 0,
      flushIntervalMs: 5000,
      readTagsMapping: vi.fn(async () => ({})),
      writeTagsMapping: vi.fn(async () => {}),
      applyUpdates: vi.fn(),
      log: { error: vi.fn(), warn: vi.fn(), debug: vi.fn(), info: vi.fn() },
      ...overrides,
    }
  }

  async function harden(buffer: Record<string, unknown>) {
    const { BoundedGcsCacheHandler: Handler } = await import('../../cacheHandler.mjs')
    Handler.prototype.hardenTagsFlush.call({ tagsBuffer: buffer })
    return buffer
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('does not throw when there is no buffer', async () => {
    const { BoundedGcsCacheHandler: Handler } = await import('../../cacheHandler.mjs')
    expect(() => Handler.prototype.hardenTagsFlush.call({})).not.toThrow()
  })

  it('still writes the mapping on the success path', async () => {
    // The failure path is what changes; a healthy flush must behave as before.
    const buffer = await harden(makeBuffer({ pendingUpdates: [{ type: 'add', cacheKey: 'a', tags: ['t'] }] }))

    await buffer.doFlush()

    expect(buffer.writeTagsMapping).toHaveBeenCalledTimes(1)
    expect(buffer.pendingUpdates).toEqual([])
    expect(buffer.lastFlushTime).toBeGreaterThan(0)
  })

  it('backs off exponentially instead of retrying on a fixed delay', async () => {
    // The defect: upstream waits flushIntervalMs * 2 forever. Attempt 1 and
    // attempt 500 wait the same, so a rate-limited object is hammered until it
    // relents — which, with the payload growing each round, it does not.
    const buffer = await harden(
      makeBuffer({
        writeTagsMapping: vi.fn(async () => {
          throw new Error('exceeded the rate limit for object mutation operations')
        }),
      })
    )

    const delays: number[] = []
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => void, ms: number) => {
      delays.push(ms)
      return 0 as unknown as NodeJS.Timeout
    }) as typeof setTimeout)

    for (let i = 0; i < 3; i++) {
      buffer.pendingUpdates = [{ type: 'add', cacheKey: `k${i}`, tags: ['t'] }]
      buffer.flushTimer = null
      await buffer.doFlush()
    }

    expect(delays.length).toBe(3)
    expect(delays[1]).toBeGreaterThan(delays[0])
    expect(delays[2]).toBeGreaterThan(delays[1])
  })

  it('caps the retry delay so it cannot grow without bound', async () => {
    const { TAGS_MAX_RETRY_MS } = await import('../../cacheHandler.mjs')
    const buffer = await harden(
      makeBuffer({
        writeTagsMapping: vi.fn(async () => {
          throw new Error('boom')
        }),
      })
    )

    const delays: number[] = []
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => void, ms: number) => {
      delays.push(ms)
      return 0 as unknown as NodeJS.Timeout
    }) as typeof setTimeout)

    for (let i = 0; i < 20; i++) {
      buffer.pendingUpdates = [{ type: 'add', cacheKey: `k${i}`, tags: ['t'] }]
      buffer.flushTimer = null
      buffer.circuitOpenUntil = 0
      await buffer.doFlush()
    }

    expect(Math.max(...delays)).toBeLessThanOrEqual(TAGS_MAX_RETRY_MS)
  })

  it('opens a circuit after repeated failures and stops touching storage', async () => {
    // This is the property that ends the storm. While the circuit is open the
    // buffer must not issue a single write — that is the difference between
    // "degraded" and "still hammering a rate-limited object 15 minutes later".
    const { TAGS_CIRCUIT_TRIP_FAILURES } = await import('../../cacheHandler.mjs')
    const buffer = await harden(
      makeBuffer({
        writeTagsMapping: vi.fn(async () => {
          throw new Error('exceeded the rate limit for object mutation operations')
        }),
      })
    )

    for (let i = 0; i < TAGS_CIRCUIT_TRIP_FAILURES; i++) {
      buffer.pendingUpdates = [{ type: 'add', cacheKey: `k${i}`, tags: ['t'] }]
      buffer.flushTimer = null
      await buffer.doFlush()
    }

    const writesBefore = (buffer.writeTagsMapping as ReturnType<typeof vi.fn>).mock.calls.length

    buffer.pendingUpdates = [{ type: 'add', cacheKey: 'after', tags: ['t'] }]
    buffer.flushTimer = null
    await buffer.doFlush()

    expect((buffer.writeTagsMapping as ReturnType<typeof vi.fn>).mock.calls.length).toBe(writesBefore)
  })

  it('closes the circuit again once the cooldown has elapsed', async () => {
    // A permanently open circuit would be its own outage: tags would never be
    // recorded again for the life of the process.
    const { TAGS_CIRCUIT_TRIP_FAILURES, TAGS_CIRCUIT_COOLDOWN_MS } = await import(
      '../../cacheHandler.mjs'
    )
    let fail = true
    const buffer = await harden(
      makeBuffer({
        writeTagsMapping: vi.fn(async () => {
          if (fail) throw new Error('rate limit')
        }),
      })
    )

    for (let i = 0; i < TAGS_CIRCUIT_TRIP_FAILURES; i++) {
      buffer.pendingUpdates = [{ type: 'add', cacheKey: `k${i}`, tags: ['t'] }]
      buffer.flushTimer = null
      await buffer.doFlush()
    }

    fail = false
    vi.setSystemTime(Date.now() + TAGS_CIRCUIT_COOLDOWN_MS + 1)

    const before = (buffer.writeTagsMapping as ReturnType<typeof vi.fn>).mock.calls.length
    buffer.pendingUpdates = [{ type: 'add', cacheKey: 'recovered', tags: ['t'] }]
    buffer.flushTimer = null
    await buffer.doFlush()

    expect((buffer.writeTagsMapping as ReturnType<typeof vi.fn>).mock.calls.length).toBe(before + 1)
  })

  it('resets the failure count after a success, so one bad patch is not permanent', async () => {
    let fail = true
    const buffer = await harden(
      makeBuffer({
        writeTagsMapping: vi.fn(async () => {
          if (fail) throw new Error('rate limit')
        }),
      })
    )

    buffer.pendingUpdates = [{ type: 'add', cacheKey: 'a', tags: ['t'] }]
    await buffer.doFlush()
    expect(buffer.consecutiveFlushFailures).toBeGreaterThan(0)

    fail = false
    buffer.pendingUpdates = [{ type: 'add', cacheKey: 'b', tags: ['t'] }]
    buffer.flushTimer = null
    await buffer.doFlush()

    expect(buffer.consecutiveFlushFailures).toBe(0)
  })

  it('bounds the pending queue so the payload cannot grow forever', async () => {
    // Upstream prepends failed updates back with no cap. Because the whole
    // mapping is rewritten to ONE object each flush, an unbounded queue means
    // every retry sends a larger payload than the one that just failed.
    const { TAGS_MAX_PENDING_UPDATES } = await import('../../cacheHandler.mjs')
    const buffer = await harden(
      makeBuffer({
        writeTagsMapping: vi.fn(async () => {
          throw new Error('rate limit')
        }),
      })
    )

    for (let round = 0; round < 3; round++) {
      buffer.pendingUpdates = Array.from({ length: TAGS_MAX_PENDING_UPDATES }, (_, i) => ({
        type: 'add',
        cacheKey: `r${round}-k${i}`,
        tags: ['t'],
      }))
      buffer.flushTimer = null
      buffer.circuitOpenUntil = 0
      await buffer.doFlush()
      expect(buffer.pendingUpdates.length).toBeLessThanOrEqual(TAGS_MAX_PENDING_UPDATES)
    }
  })

  it('coalesces repeat updates for the same key rather than dropping information', async () => {
    // Dedupe before the cap: collapsing duplicates shrinks the payload without
    // losing any mapping, so it is strictly better than discarding entries.
    const buffer = await harden(
      makeBuffer({
        writeTagsMapping: vi.fn(async () => {
          throw new Error('rate limit')
        }),
      })
    )

    buffer.pendingUpdates = [
      { type: 'add', cacheKey: 'same', tags: ['t'] },
      { type: 'add', cacheKey: 'same', tags: ['t'] },
      { type: 'add', cacheKey: 'same', tags: ['t'] },
    ]
    await buffer.doFlush()

    expect(buffer.pendingUpdates.length).toBeLessThan(3)
  })
})

describe('capPendingUpdates() / coalesceTagUpdates() — the claims the comments make', () => {
  // These two helpers were previously exercised only through doFlush(), so the
  // retention policy and the collision-safety of the signature were asserted by
  // comments and by nothing executable.

  it('keeps the NEWEST updates when it trims, not the oldest', async () => {
    // The comment claims newest are kept because they match the most recently
    // published content. Nothing pinned that, so a slice() off the wrong end
    // would have silently inverted the policy.
    const { capPendingUpdates, TAGS_MAX_PENDING_UPDATES } = await import('../../cacheHandler.mjs')
    const over = Array.from({ length: TAGS_MAX_PENDING_UPDATES + 50 }, (_, i) => ({
      type: 'add',
      cacheKey: `k${i}`,
      tags: ['t'],
    }))

    const kept = capPendingUpdates(over)

    expect(kept.length).toBe(TAGS_MAX_PENDING_UPDATES)
    expect(kept[kept.length - 1].cacheKey).toBe(`k${over.length - 1}`)
    expect(kept[0].cacheKey).toBe(`k${over.length - TAGS_MAX_PENDING_UPDATES}`)
  })

  it('does not collide tags that differ only by where the commas are', async () => {
    // Signature fields are NUL-separated including the tag join. Joining tags on
    // a comma would make ['a,b'] and ['a','b'] produce the same signature, so one
    // distinct update would be dropped as a duplicate.
    const { coalesceTagUpdates } = await import('../../cacheHandler.mjs')

    const out = coalesceTagUpdates([
      { type: 'add', cacheKey: 'k', tags: ['a,b'] },
      { type: 'add', cacheKey: 'k', tags: ['a', 'b'] },
    ])

    expect(out.length).toBe(2)
  })

  it('collapses genuinely identical updates', async () => {
    const { coalesceTagUpdates } = await import('../../cacheHandler.mjs')

    const out = coalesceTagUpdates([
      { type: 'add', cacheKey: 'k', tags: ['a'] },
      { type: 'add', cacheKey: 'k', tags: ['a'] },
    ])

    expect(out.length).toBe(1)
  })

  it('keeps adds and deletes for the same key distinct', async () => {
    // Deduping must never collapse an add into a delete or vice versa — they are
    // different operations on the same key and both have to reach applyUpdates().
    const { coalesceTagUpdates } = await import('../../cacheHandler.mjs')

    const out = coalesceTagUpdates([
      { type: 'add', cacheKey: 'k', tags: ['a'] },
      { type: 'delete', cacheKey: 'k' },
    ])

    expect(out.length).toBe(2)
  })
})

describe('retry delay outlasts an open circuit', () => {
  // TAGS_MAX_RETRY_MS and TAGS_CIRCUIT_COOLDOWN_MS are independently overridable
  // and default to the same value. Clamping the retry past the cooldown stops
  // this timer firing into the early return and wasting a cycle.
  //
  // This is an optimisation, NOT the safety property — the early return re-arms
  // its own timer, and that is what actually guarantees the queue drains. Most
  // timers during a sustained failure come from upstream's scheduleFlush(), not
  // from here, so a clamp on this one could never have been sufficient. Keeping
  // that straight matters: the earlier version of this comment claimed the clamp
  // prevented stranding, and stranding was real and reachable at the defaults.
  it('never schedules a retry that lands before the circuit closes', async () => {
    const { BoundedGcsCacheHandler: Handler, TAGS_CIRCUIT_TRIP_FAILURES } = await import(
      '../../cacheHandler.mjs'
    )
    const buffer: Record<string, unknown> = {
      pendingUpdates: [],
      flushTimer: null,
      isFlushing: false,
      lastFlushTime: 0,
      flushIntervalMs: 5000,
      readTagsMapping: vi.fn(async () => ({})),
      writeTagsMapping: vi.fn(async () => {
        throw new Error('rate limit')
      }),
      applyUpdates: vi.fn(),
      log: { error: vi.fn(), warn: vi.fn(), debug: vi.fn(), info: vi.fn() },
    }
    Handler.prototype.hardenTagsFlush.call({ tagsBuffer: buffer })

    const delays: number[] = []
    vi.useFakeTimers()
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => void, ms: number) => {
      delays.push(ms)
      return 0 as unknown as NodeJS.Timeout
    }) as typeof setTimeout)

    for (let i = 0; i < TAGS_CIRCUIT_TRIP_FAILURES; i++) {
      buffer.pendingUpdates = [{ type: 'add', cacheKey: `k${i}`, tags: ['t'] }]
      buffer.flushTimer = null
      await buffer.doFlush()
    }

    const remaining = (buffer.circuitOpenUntil as number) - Date.now()
    expect(delays[delays.length - 1]).toBeGreaterThanOrEqual(remaining)

    vi.useRealTimers()
    vi.restoreAllMocks()
  })
})

describe('an open circuit must not strand the queue', () => {
  // Found by review, by running against the real upstream TagsBuffer rather than
  // reasoning about it. The circuit-open early return scheduled no timer. Under
  // load that matters, because upstream scheduleFlush() (tags-buffer.js:89-102)
  // is called by every addTags()/deleteKey() and computes its delay as
  // max(0, flushIntervalMs - timeSinceLastFlush) — and lastFlushTime only
  // advances on SUCCESS. During a sustained failure that delay is 0ms. The 0ms
  // timer fires into the early return, clears itself, and leaves pending updates
  // with no live timer and no log line until the next addTags() happens by.
  //
  // Every other test in this file sets flushTimer = null before each doFlush(),
  // so none of them could ever observe this — the vanity-test shape checklist
  // item 32 exists to reject.
  it('schedules a retry when it returns early, rather than clearing the timer and stopping', async () => {
    const { BoundedGcsCacheHandler: Handler, TAGS_CIRCUIT_TRIP_FAILURES } = await import(
      '../../cacheHandler.mjs'
    )
    vi.useFakeTimers()
    const buffer: Record<string, unknown> = {
      pendingUpdates: [],
      flushTimer: null,
      isFlushing: false,
      lastFlushTime: 0,
      flushIntervalMs: 5000,
      readTagsMapping: vi.fn(async () => ({})),
      writeTagsMapping: vi.fn(async () => {
        throw new Error('rate limit')
      }),
      applyUpdates: vi.fn(),
      flush: vi.fn(async () => {}),
      log: { error: vi.fn(), warn: vi.fn(), debug: vi.fn(), info: vi.fn() },
    }
    Handler.prototype.hardenTagsFlush.call({ tagsBuffer: buffer })

    for (let i = 0; i < TAGS_CIRCUIT_TRIP_FAILURES; i++) {
      buffer.pendingUpdates = [{ type: 'add', cacheKey: `k${i}`, tags: ['t'] }]
      buffer.flushTimer = null
      await buffer.doFlush()
    }
    expect(buffer.circuitOpenUntil as number).toBeGreaterThan(Date.now())

    // A fired timer has already nulled itself; work is still queued.
    buffer.flushTimer = null
    buffer.pendingUpdates = [{ type: 'add', cacheKey: 'stranded', tags: ['t'] }]

    await buffer.doFlush()

    expect(buffer.pendingUpdates.length).toBeGreaterThan(0)
    expect(buffer.flushTimer).not.toBeNull()

    vi.useRealTimers()
    vi.restoreAllMocks()
  })
})

describe('a longer bound for build invalidation only', () => {
  // Measured, not guessed. The first Dev deploy carrying this handler logged nine
  // INIT_BOUND_EXCEEDED, every one inside the deploy minute, while steady-state
  // init across thousands of samples ran 51-72ms. So 2000ms is generous for normal
  // operation and too small for exactly one path: init that finds a changed buildId
  // and runs invalidateRouteCache(), whose awaited nukeCache() alone aborts at
  // 10000ms (edge-cache-clear.js:23).
  //
  // Raising the bound globally would put that worst case on every request. This
  // extends it only while build invalidation is actually in flight.
  function makeCtx(initPromise: Promise<void> | null, inFlight = false) {
    return {
      initPromise,
      boundExceededCount: 0,
      buildBoundExtendedCount: 0,
      buildInvalidationInFlight: inFlight,
    }
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('still gives up at the short bound when no build invalidation is running', async () => {
    const ctx = makeCtx(new Promise<void>(() => {}), false)
    let settled = false

    const pending = BoundedGcsCacheHandler.prototype.ensureInitialized.call(ctx).then(() => {
      settled = true
    })

    await vi.advanceTimersByTimeAsync(INIT_TIMEOUT_MS)
    await pending

    expect(settled).toBe(true)
    expect(ctx.boundExceededCount).toBe(1)
  })

  it('keeps waiting past the short bound while build invalidation is in flight', async () => {
    const ctx = makeCtx(new Promise<void>(() => {}), true)
    let settled = false

    const pending = BoundedGcsCacheHandler.prototype.ensureInitialized.call(ctx).then(() => {
      settled = true
    })

    await vi.advanceTimersByTimeAsync(INIT_TIMEOUT_MS)
    expect(settled).toBe(false)

    await vi.advanceTimersByTimeAsync(INIT_BUILD_TIMEOUT_MS - INIT_TIMEOUT_MS)
    await pending

    expect(settled).toBe(true)
  })

  it('gives up at the longer bound rather than waiting forever', async () => {
    const ctx = makeCtx(new Promise<void>(() => {}), true)

    const pending = BoundedGcsCacheHandler.prototype.ensureInitialized.call(ctx)
    await vi.advanceTimersByTimeAsync(INIT_BUILD_TIMEOUT_MS)
    await pending

    expect(ctx.boundExceededCount).toBe(1)
  })

  it('resolves as soon as init settles, without waiting out either bound', async () => {
    const ctx = makeCtx(Promise.resolve(), true)

    await BoundedGcsCacheHandler.prototype.ensureInitialized.call(ctx)

    expect(ctx.boundExceededCount).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('reports the bound it actually waited, not the one it started with', async () => {
    // After extending, the request has waited the long bound. Reporting the short
    // one would tell an operator grepping INIT_BOUND_EXCEEDED that the extension
    // never fired, when it fired and was still insufficient — the opposite
    // conclusion, on the only evidence a live deploy provides.
    const ctx = makeCtx(new Promise<void>(() => {}), true)

    const pending = BoundedGcsCacheHandler.prototype.ensureInitialized.call(ctx)
    await vi.advanceTimersByTimeAsync(INIT_BUILD_TIMEOUT_MS)
    await pending

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(`bound=${INIT_BUILD_TIMEOUT_MS}ms`)
    )
  })

  it('reports the short bound when it never extended', async () => {
    const ctx = makeCtx(new Promise<void>(() => {}), false)

    const pending = BoundedGcsCacheHandler.prototype.ensureInitialized.call(ctx)
    await vi.advanceTimersByTimeAsync(INIT_TIMEOUT_MS)
    await pending

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(`bound=${INIT_TIMEOUT_MS}ms`)
    )
  })

  it('announces the extension once', async () => {
    const ctx = makeCtx(new Promise<void>(() => {}), true)

    const pending = BoundedGcsCacheHandler.prototype.ensureInitialized.call(ctx)
    await vi.advanceTimersByTimeAsync(INIT_BUILD_TIMEOUT_MS)
    await pending

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('INIT_BOUND_EXTENDED'))
    expect(ctx.buildBoundExtendedCount).toBe(1)
  })

  it('extends when invalidation starts DURING the short bound, not only before it', async () => {
    // The discriminating test. Every other case here passes just as well if the
    // bound is chosen up front, so none of them justifies checking the flag after
    // the short bound instead of before. This one fails under that design: the
    // request arrives first, invalidateRouteCache() sets the flag partway through,
    // and an up-front decision would already have committed to 2000ms.
    const ctx = makeCtx(new Promise<void>(() => {}), false)
    let settled = false

    const pending = BoundedGcsCacheHandler.prototype.ensureInitialized.call(ctx).then(() => {
      settled = true
    })

    await vi.advanceTimersByTimeAsync(INIT_TIMEOUT_MS / 2)
    ctx.buildInvalidationInFlight = true
    await vi.advanceTimersByTimeAsync(INIT_TIMEOUT_MS / 2)

    expect(settled).toBe(false)

    await vi.advanceTimersByTimeAsync(INIT_BUILD_TIMEOUT_MS - INIT_TIMEOUT_MS)
    await pending

    expect(settled).toBe(true)
    expect(ctx.buildBoundExtendedCount).toBe(1)
  })

  it('the longer bound covers nukeCache, which aborts at 10s', async () => {
    // If this ever drops below the upstream abort, the extension stops covering
    // the very operation it exists for.
    expect(INIT_BUILD_TIMEOUT_MS).toBeGreaterThan(10_000)
    expect(INIT_BUILD_TIMEOUT_MS).toBeGreaterThan(INIT_TIMEOUT_MS)
  })
})

describe('invalidateRouteCache flags itself as in flight', () => {
  it('sets the flag while running and clears it afterwards', async () => {
    const seen: boolean[] = []
    const ctx = {
      buildInvalidationInFlight: false,
      routeCachePrefix: 'route-cache/',
      bucket: {
        getFiles: async () => {
          seen.push(ctx.buildInvalidationInFlight)
          return [[]]
        },
      },
      pruneRouteKeysFromTagMap: vi.fn(),
    }

    await BoundedGcsCacheHandler.prototype.invalidateRouteCache.call(ctx)

    // super.invalidateRouteCache() lists the bucket too, so getFiles runs more than
    // once. What matters is that the flag is set for every one of them, not how
    // many there are — asserting a count would break on an upstream change that
    // is none of this test's business.
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.every(Boolean)).toBe(true)
    expect(ctx.buildInvalidationInFlight).toBe(false)
  })

  it('clears the flag even when the sweep throws', async () => {
    // A stuck flag would apply the long bound to every later request forever.
    const ctx = {
      buildInvalidationInFlight: false,
      routeCachePrefix: 'route-cache/',
      bucket: {
        getFiles: async () => {
          throw new Error('boom')
        },
      },
      pruneRouteKeysFromTagMap: vi.fn(),
    }

    await BoundedGcsCacheHandler.prototype.invalidateRouteCache.call(ctx)

    expect(ctx.buildInvalidationInFlight).toBe(false)
  })
})

describe('shouldSuppressRouteEntry() — do not serve previous-build pages', () => {
  /**
   * The 2026-09-09 live outage, from the runtime log rather than from reasoning.
   *
   * Deploy succeeded, then one instance logged INIT_BOUND_EXTENDED followed by
   * INIT_BOUND_EXCEEDED at the long bound. The eventual INIT_OBSERVED durations for
   * that window were 15561ms, 15577ms and 22369ms — init did finish, well past the
   * bound it was given. Within about half a minute later instances were back to
   * ~100-250ms, so the origin recovered on its own.
   *
   * The site did not. Under the code as it then stood, get() past the bound fell
   * through to readCacheEntry() and returned previous-build entries, whose HTML
   * referenced /_next/static/<buildId>/ assets the running build no longer had.
   * Those responses were cacheable, so a brief origin fault was written into the
   * edge and outlived it by hours. Clearing the edge cache — which touches nothing
   * in the origin — fixed it immediately.
   *
   * So the durable damage is not the timeout, it is that a broken response gets
   * stored. Returning a miss instead makes the same window render fresh from the
   * current build: slower, and correct.
   */

  it('suppresses a route entry read before init completed', () => {
    expect(shouldSuppressRouteEntry(true, 'route')).toBe(true)
  })

  it('serves route entries normally once init has completed', () => {
    // The whole point of the bound is that the common path is unaffected.
    expect(shouldSuppressRouteEntry(false, 'route')).toBe(false)
  })

  it('never suppresses fetch entries, even before init completes', () => {
    // Fetch entries hold WordPress JSON. They carry no asset hashes, so a
    // previous-build one is harmless — and suppressing them would turn every
    // request in the window into an origin fetch, which is the flooding this
    // handler exists to prevent.
    expect(shouldSuppressRouteEntry(true, 'fetch')).toBe(false)
  })

  it('never suppresses image entries, even before init completes', () => {
    // Optimized image bytes, likewise hash-free and expensive to regenerate.
    expect(shouldSuppressRouteEntry(true, 'image')).toBe(false)
  })
})

describe('get() — wiring the suppression to a real read', () => {
  function makeCtx(cacheType: string, initPromise: unknown) {
    return {
      initPromise,
      // super.get() calls this; stubbed so these cases test get()'s decision
      // rather than re-testing the bound, which has its own describe block.
      ensureInitialized: async () => {},
      determineCacheType: () => cacheType,
      readCacheEntry: async () => ({ value: 'cached' }),
      getBuildPrerender: async () => null,
      log: { debug: () => {}, error: () => {}, info: () => {}, warn: () => {} },
    }
  }

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a miss for a route entry while init is still pending', async () => {
    const ctx = makeCtx('route', Promise.resolve())

    const entry = await BoundedGcsCacheHandler.prototype.get.call(ctx, 'k', {})

    expect(entry).toBeNull()
  })

  it('returns the entry for a route once init has completed', async () => {
    // initPromise is nulled by the base class exactly when init finishes, so a
    // null here is the signal that the entry is from the current build.
    const ctx = makeCtx('route', null)

    const entry = await BoundedGcsCacheHandler.prototype.get.call(ctx, 'k', {})

    expect(entry).toEqual({ value: 'cached' })
  })

  it('returns the entry for a fetch while init is still pending', async () => {
    const ctx = makeCtx('fetch', Promise.resolve())

    const entry = await BoundedGcsCacheHandler.prototype.get.call(ctx, 'k', {})

    expect(entry).toEqual({ value: 'cached' })
  })

  it('passes a genuine miss through untouched', async () => {
    const ctx = makeCtx('route', null)
    ctx.readCacheEntry = async () => null

    const entry = await BoundedGcsCacheHandler.prototype.get.call(ctx, 'k', {})

    expect(entry).toBeNull()
  })

  it('reports the running suppression count, throttled', async () => {
    // Asserts what the line SAYS, not merely that one was emitted. The last commit
    // shipped an INIT_BOUND_EXCEEDED that reported the wrong bound, and DEPLOYMENT.md
    // tells operators to grep these strings to judge whether the mechanism engaged —
    // a warning carrying the wrong number argues the opposite of what happened.
    const ctx = makeCtx('route', Promise.resolve())
    const warn = console.warn as unknown as ReturnType<typeof vi.fn>

    await BoundedGcsCacheHandler.prototype.get.call(ctx, 'k', {})
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenLastCalledWith(expect.stringContaining('ROUTE_ENTRY_SUPPRESSED count=1'))

    // Every request in the window suppresses; one line each would bury the signal.
    for (let i = 2; i <= 9; i++) {
      await BoundedGcsCacheHandler.prototype.get.call(ctx, 'k', {})
    }
    expect(warn).toHaveBeenCalledTimes(1)

    await BoundedGcsCacheHandler.prototype.get.call(ctx, 'k', {})
    expect(warn).toHaveBeenCalledTimes(2)
    expect(warn).toHaveBeenLastCalledWith(
      expect.stringContaining('ROUTE_ENTRY_SUPPRESSED count=10')
    )
  })
})

