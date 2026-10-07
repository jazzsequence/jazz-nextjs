/**
 * Pantheon's next-generation GCDN (Cloudflare) serves a managed challenge (HTTP 403,
 * `cf-mitigated: challenge`) to automated clients it cannot verify — Playwright's Chromium,
 * its request client, GitHub Actions runners. A per-site bypass token, sent in this header,
 * exempts our own test traffic. Get it with `terminus gcdn:bot-bypass <site>`.
 */
export const BOT_BYPASS_HEADER = 'x-pantheon-bot-bypass'

/**
 * Header(s) to add to a request, or `{}` when it must not carry the token.
 *
 * The token is a credential, so it goes only to the app's own origin, and only over https.
 * Playwright's `use.extraHTTPHeaders` is deliberately not used: it applies to every host the
 * page requests, which would hand the token to YouTube, Spotify, jsdelivr and the image CDN.
 */
export function botBypassHeaders(
  url: string,
  baseURL: string | undefined,
  token: string | undefined,
): Record<string, string> {
  if (!token || !baseURL) return {}

  try {
    const target = new URL(url)
    const base = new URL(baseURL)
    // URL.origin includes scheme, host and port, so a lookalike host or another port differs.
    if (base.protocol !== 'https:' || target.origin !== base.origin) return {}
    return { [BOT_BYPASS_HEADER]: token }
  } catch {
    return {}
  }
}
