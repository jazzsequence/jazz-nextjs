/**
 * Patches @pantheon-systems/nextjs-cache-handler to expose its middleware
 * directory via the package exports map.
 *
 * WHY: The package ships `dist/middleware/surrogate-key.js` which is needed
 * by proxy.ts to emit Surrogate-Key headers on every response so Fastly can
 * build its tag→response mapping. Without it, revalidateTag() calls purge
 * nothing because Fastly has no tag index.
 *
 * The package (v0.4.0) does not include `./middleware` in its exports field,
 * so Turbopack blocks the deep import. This script adds it as a postinstall step.
 *
 * When the package adds this export officially, this script becomes a no-op
 * (the key is already present, JSON.stringify is idempotent for same content).
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
  // Non-fatal: package may not be installed yet or path may differ
  console.warn('⚠️  Could not patch @pantheon-systems/nextjs-cache-handler:', err.message)
}
