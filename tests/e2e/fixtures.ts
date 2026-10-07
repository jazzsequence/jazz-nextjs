import { test as base, expect } from '@playwright/test'
import { botBypassHeaders } from './support/bot-bypass'
import { createAppClient, type AppClient } from './support/app-client'

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

export const test = base.extend<{ api: AppClient }>({
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

  // API calls (api-revalidate, post-single's beforeAll) use `api`, NOT Playwright's
  // `request` or `page.request`. Playwright records every request header of an
  // APIRequestContext call — in the error it throws and in the report step the HTML report
  // embeds — and CI publishes that report to a public GitHub Pages site, so the bypass token
  // must never be handed to one. `api` is a Node-fetch client that writes no such log. See
  // support/app-client.ts. (Plain `request` still works, but carries no token.)
  api: async ({ baseURL }, provide) => {
    await provide(createAppClient(baseURL ?? 'http://localhost:3001', token))
  },
})
