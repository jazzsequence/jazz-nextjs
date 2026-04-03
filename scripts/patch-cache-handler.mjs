/**
 * Patches @pantheon-systems/nextjs-cache-handler to expose its middleware
 * directory via the package exports map.
 *
 * WHY: The package (v0.4.0) ships `dist/middleware/surrogate-key.js` and
 * `dist/middleware/index.js` with full TypeScript types, but does not include
 * `./middleware` in its `exports` field. This prevents Turbopack from resolving
 * the import in `proxy.ts`, which is the correct Pantheon-provided mechanism
 * for emitting Surrogate-Key response headers for GCDN cache tagging.
 *
 * This is tracked upstream:
 *   https://github.com/pantheon-systems/nextjs-cache-handler/issues/28
 *
 * When the package adds `./middleware` to its exports map, this script becomes
 * a no-op (the idempotency check prevents double-patching).
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const pkgPath = resolve(__dirname, '../node_modules/@pantheon-systems/nextjs-cache-handler/package.json')

try {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))

  if (!pkg.exports['./middleware']) {
    pkg.exports['./middleware'] = {
      import: './dist/middleware/index.js',
      types: './dist/middleware/index.d.ts',
    }
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
    console.log('✅ Patched @pantheon-systems/nextjs-cache-handler: added ./middleware export')
  } else {
    console.log('ℹ️  @pantheon-systems/nextjs-cache-handler already has ./middleware export — no patch needed')
  }
} catch (err) {
  console.warn('⚠️  Could not patch @pantheon-systems/nextjs-cache-handler:', err.message)
}
