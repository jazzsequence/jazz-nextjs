import { test, expect } from '../fixtures'

/**
 * The checks that need a deployed Pantheon environment — everything else runs against a
 * server the Playwright config starts, with no Pantheon environment at all. Run with
 * `E2E_TARGET=pantheon BASE_URL=https://pr-N-jazz-nextjs15.pantheonsite.io npm run test:e2e:pantheon`.
 *
 * Kept to a handful of requests on purpose: the Pantheon zone rate-limits one IP to 50 dynamic
 * requests a minute with a 5-minute block, and the bypass token does not exempt it. A full
 * suite cannot run here; this one stays well under the limit.
 */

// Falling back to a dummy secret would turn a missing repository secret into a 401 that reads
// like an auth regression, so a missing one fails loudly here.
function requireRevalidateSecret(): string {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) {
    throw new Error(
      'REVALIDATE_SECRET is not set. The Pantheon environment checks /api/revalidate with the ' +
        'real secret, so it must come from the repository secret of the same name — see ' +
        'docs/configuration/DEPLOYMENT.md.',
    )
  }
  return secret
}

test.describe('Pantheon deployment', () => {
  let homepage: string

  test.beforeAll(async ({ api }) => {
    const response = await api.get('/')
    homepage = await response.text()
    if (response.status() !== 200) {
      throw new Error(
        `GET / returned HTTP ${response.status()}; body starts: ` +
          homepage.slice(0, 120).replace(/\s+/g, ' '),
      )
    }
  })

  test('the homepage serves post links', () => {
    expect(homepage).toMatch(/href="\/posts\/[^"]+"/)
  })

  // Linux sharp is a native binary, so a green local run says nothing about the one that ships.
  test('the image optimizer transcodes an image on the deployed runtime', async ({ api }) => {
    const match = homepage.match(/(?:src|srcset)="(\/_next\/image\?[^"\s]+)/)
    expect(match, 'no /_next/image URL on the homepage').toBeTruthy()

    const response = await api.get(match![1].replace(/&amp;/g, '&'))
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toMatch(/^image\//)
  })

  // Locally the revalidate route runs with no GCS cache handler and no CDN; here it does.
  test('the revalidate API rejects a wrong secret', async ({ api }) => {
    const response = await api.post('/api/revalidate', {
      headers: { 'X-Revalidate-Secret': 'wrong-secret' },
      data: { path: '/' },
    })
    expect(response.status()).toBe(401)
  })

  test('the revalidate API accepts the real secret and revalidates a path', async ({ api }) => {
    const response = await api.post('/api/revalidate', {
      headers: { 'X-Revalidate-Secret': requireRevalidateSecret() },
      data: { path: '/' },
    })
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.revalidated).toBe(true)
  })
})
