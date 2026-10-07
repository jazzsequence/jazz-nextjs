import { test as base, expect } from '@playwright/test'
import { botBypassHeaders } from './support/bot-bypass'

export type { Page } from '@playwright/test'
export { expect }

/**
 * Specs import `test` from here, not from '@playwright/test', so Pantheon's bot-bypass token
 * rides along on requests to the app's own origin. Without it the next-gen GCDN answers
 * Playwright with a Cloudflare managed challenge (HTTP 403) and every page assertion fails.
 * See support/bot-bypass.ts. The token is only set where CI provides it; locally it is unset
 * and both overrides below are no-ops.
 */
const token = process.env.BOT_BYPASS_TOKEN

// The fixture callback is named `provide`, not Playwright's conventional `use`, because
// eslint-plugin-react-hooks reads `use(...)` as a React Hook and rejects it.

export const test = base.extend({
  // Browser traffic. A route per request, not `use.extraHTTPHeaders`, so the token never
  // reaches third-party hosts (embeds, fonts, the image CDN).
  context: async ({ context, baseURL }, provide) => {
    if (token) {
      await context.route('**/*', (route) => {
        const extra = botBypassHeaders(route.request().url(), baseURL, token)
        if (Object.keys(extra).length === 0) return route.fallback()
        return route.fallback({ headers: { ...route.request().headers(), ...extra } })
      })
    }
    await provide(context)
  },

  // Standalone `request` fixture (api-revalidate, post-single beforeAll). Every call in the
  // suite targets the app origin, so the header is set for the whole client. For anything
  // external, use `page.request.get(url, { headers: botBypassHeaders(...) })` instead.
  // `page.request` is NOT covered by the route above: routes don't intercept API requests.
  request: async ({ playwright, baseURL }, provide) => {
    const context = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: botBypassHeaders(baseURL ?? '', baseURL, token),
    })
    await provide(context)
    await context.dispose()
  },
})
