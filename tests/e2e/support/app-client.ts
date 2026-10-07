import { botBypassHeaders } from './bot-bypass'

/**
 * A minimal HTTP client for specs that call the app's own API, in place of Playwright's
 * `request` fixture. Pantheon's Cloudflare-backed GCDN challenges Playwright's request client
 * like everything else it cannot verify, so API calls need the bot-bypass token too — but
 * Playwright records every request header of an APIRequestContext call, in the error it throws
 * and in the report step that the HTML report embeds, and CI publishes that report to a public
 * GitHub Pages site. Wrapping the error does not help (measured). Node's fetch has no such log,
 * so the token goes through here and never through a Playwright API client.
 *
 * Mirrors the slice of the `request` API the specs use: get/post with `data`, `headers` and
 * `timeout`, and a response with status(), ok(), headers(), json() and text().
 */
export interface AppRequestOptions {
  data?: unknown
  headers?: Record<string, string>
  timeout?: number
}

export interface AppResponse {
  status(): number
  ok(): boolean
  headers(): Record<string, string>
  // Specs read arbitrary fields off the parsed body, as they did with Playwright's json().
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json(): Promise<any>
  text(): Promise<string>
}

export interface AppClient {
  get(url: string, options?: AppRequestOptions): Promise<AppResponse>
  post(url: string, options?: AppRequestOptions): Promise<AppResponse>
}

type FetchLike = (url: string | URL | Request, init?: RequestInit) => Promise<Response>

const DEFAULT_TIMEOUT_MS = 30_000

export function createAppClient(
  baseURL: string,
  token: string | undefined,
  fetchImpl: FetchLike = fetch,
): AppClient {
  async function send(method: 'GET' | 'POST', path: string, options: AppRequestOptions = {}) {
    const url = new URL(path, baseURL).href
    const headers: Record<string, string> = {
      ...botBypassHeaders(url, baseURL, token),
      ...options.headers,
    }
    let body: string | undefined
    if (options.data !== undefined) {
      body = JSON.stringify(options.data)
      headers['content-type'] = headers['content-type'] ?? 'application/json'
    }

    const response = await fetchImpl(url, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(options.timeout ?? DEFAULT_TIMEOUT_MS),
    })

    return {
      status: () => response.status,
      ok: () => response.ok,
      headers: () => Object.fromEntries(response.headers.entries()),
      json: () => response.json(),
      text: () => response.text(),
    } satisfies AppResponse
  }

  return {
    get: (url, options) => send('GET', url, options),
    post: (url, options) => send('POST', url, options),
  }
}
