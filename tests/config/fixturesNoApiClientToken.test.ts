import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// An invariant that no behavioural test can see: the bypass token must never be handed to a
// Playwright APIRequestContext. Playwright logs every request header there, in the thrown error
// and again in the report step the HTML report embeds, and CI publishes that report to a public
// GitHub Pages site. API calls go through createAppClient (Node fetch) instead.

// Comments are allowed to name the forbidden API — fixtures.ts explains why it is not used —
// so only code is checked. Block comments first, then line comments.
function codeOnly(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

describe('codeOnly', () => {
  it('drops comments but keeps code', () => {
    const src = [
      '// not `use.extraHTTPHeaders`',
      '/* request.newContext( */',
      'const c = pw.request.newContext({ extraHTTPHeaders: h }) // trailing',
    ].join('\n')
    const code = codeOnly(src)
    expect(code).toContain('request.newContext(')
    expect(code).toContain('extraHTTPHeaders: h')
    expect(code).not.toContain('use.extraHTTPHeaders')
    expect(code).not.toContain('trailing')
  })
})

describe('tests/e2e/fixtures.ts', () => {
  const code = codeOnly(readFileSync(resolve(__dirname, '../e2e/fixtures.ts'), 'utf8'))

  it('does not send headers through a Playwright API request context', () => {
    expect(code).not.toMatch(/extraHTTPHeaders/)
    expect(code).not.toMatch(/request\.newContext\(/)
  })
})
