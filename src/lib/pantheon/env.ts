/**
 * Pantheon environment detection utilities
 */

export type PantheonEnvironment = 'dev' | 'test' | 'live' | 'local' | 'unknown';

/**
 * Get the current Pantheon environment
 * Returns 'dev', 'test', 'live', 'local', or 'unknown'
 */
export function getPantheonEnvironment(): PantheonEnvironment {
  // Check PANTHEON_ENVIRONMENT env var (set by Pantheon)
  const pantheonEnv = process.env.PANTHEON_ENVIRONMENT;
  if (pantheonEnv === 'dev' || pantheonEnv === 'test' || pantheonEnv === 'live') {
    return pantheonEnv;
  }

  // Check NODE_ENV for local development
  if (process.env.NODE_ENV === 'development') {
    return 'local';
  }

  // Fallback: detect from hostname if available (server-side only)
  if (typeof window === 'undefined') {
    const hostname = process.env.PANTHEON_SITE_NAME;
    if (hostname) {
      // Pantheon hostnames follow pattern: {env}-{site}.pantheonsite.io
      if (hostname.includes('dev-')) return 'dev';
      if (hostname.includes('test-')) return 'test';
      if (hostname.includes('live-')) return 'live';
    }
  }

  return 'unknown';
}

/**
 * Check if current environment is production (live)
 */
export function isProduction(): boolean {
  return getPantheonEnvironment() === 'live';
}

/**
 * Check if current environment is non-production (dev/test/local)
 */
export function isNonProduction(): boolean {
  const env = getPantheonEnvironment();
  return env === 'dev' || env === 'test' || env === 'local';
}

/**
 * Get environment display name
 */
export function getEnvironmentDisplayName(): string {
  const env = getPantheonEnvironment();
  switch (env) {
    case 'dev':
      return 'Development';
    case 'test':
      return 'Test';
    case 'live':
      return 'Production';
    case 'local':
      return 'Local';
    default:
      return 'Unknown';
  }
}
