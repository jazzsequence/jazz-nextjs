import { createCacheHandler } from '@pantheon-systems/nextjs-cache-handler'

const CacheHandler = createCacheHandler({
  type: 'auto', // Auto-detect: GCS if CACHE_BUCKET exists, else file-based
})

export default CacheHandler
