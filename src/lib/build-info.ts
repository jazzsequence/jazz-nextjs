/**
 * Build information - Runtime fetched
 * No physical file generation required
 */

interface BuildInfo {
  commitHash: string;
  commitShort: string;
  buildTime: string;
}

let cachedBuildInfo: BuildInfo | null = null;

/**
 * Fetch commit hash from GitHub API
 */
async function fetchCommitFromGitHub(): Promise<string | null> {
  try {
    // Get repo info from package.json via API route or hardcode
    const owner = 'jazzsequence';
    const repo = 'jazz-nextjs';

    const url = `https://api.github.com/repos/${owner}/${repo}/commits/main`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'jazz-nextjs-runtime',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`GitHub API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.sha;
  } catch (error) {
    console.error('Failed to fetch commit from GitHub API:', error);
    return null;
  }
}

/**
 * Get build information at runtime
 * Fetches commit hash from GitHub API with caching
 */
export async function getBuildInfo(): Promise<BuildInfo> {
  // Return cached if available (for same request)
  if (cachedBuildInfo) {
    return cachedBuildInfo;
  }

  const commitHash = await fetchCommitFromGitHub();

  const buildInfo: BuildInfo = {
    commitHash: commitHash || 'unknown',
    commitShort: commitHash ? commitHash.substring(0, 7) : 'unknown',
    buildTime: new Date().toISOString(),
  };

  cachedBuildInfo = buildInfo;
  return buildInfo;
}

/**
 * Static export for compatibility (deprecated)
 * Use getBuildInfo() instead for runtime fetching
 */
export const BUILD_INFO = {
  commitHash: 'runtime',
  commitShort: 'runtime',
  buildTime: new Date().toISOString(),
} as const;
