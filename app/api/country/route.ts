import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Returns the visitor's country code detected from CDN headers.
 *
 * This route isolates the headers() call so the homepage remains
 * fully edge-cacheable. GreetingClient fetches this on mount to
 * enable country-based audience matching without making the page dynamic.
 *
 * Header priority:
 *   cf-ipcountry          Cloudflare (Pantheon GCDN future)
 *   x-vercel-ip-country   Vercel
 *   cloudfront-viewer-country  AWS CloudFront
 *   x-country-code        Generic
 *   fastly-client-country Fastly (Pantheon GCDN current)
 */
export async function GET() {
  const headersList = await headers()

  const country =
    headersList.get('cf-ipcountry') ||
    headersList.get('x-vercel-ip-country') ||
    headersList.get('cloudfront-viewer-country') ||
    headersList.get('x-country-code') ||
    headersList.get('fastly-client-country') ||
    null

  return NextResponse.json({ country })
}
