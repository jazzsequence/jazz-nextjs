#!/usr/bin/env node

/**
 * Generate build info at build time
 * Creates src/lib/build-info.ts with commit hash and build timestamp
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = join(__dirname, '..');
const outputFile = join(rootDir, 'src/lib/build-info.ts');

/**
 * Get commit hash from GitHub API
 * Reads repo info from package.json and fetches latest commit
 */
async function getCommitFromGitHub() {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(rootDir, 'package.json'), 'utf8')
    );

    // Extract repo from package.json repository field
    const repoUrl = packageJson.repository?.url || packageJson.repository;
    if (!repoUrl) {
      console.log('⚠️  No repository field in package.json');
      return null;
    }

    // Parse GitHub repo (supports various formats)
    const match = repoUrl.match(/github\.com[/:]([\w-]+)\/([\w-]+)/);
    if (!match) {
      console.log('⚠️  Could not parse GitHub repo from:', repoUrl);
      return null;
    }

    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, '');

    console.log(`📡 Fetching commit from GitHub API: ${owner}/${cleanRepo}`);

    // Fetch latest commit from main branch
    const url = `https://api.github.com/repos/${owner}/${cleanRepo}/commits/main`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'jazz-nextjs-build-script',
      },
    });

    if (!response.ok) {
      console.log(`⚠️  GitHub API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.sha;
  } catch (error) {
    console.log('⚠️  Failed to fetch from GitHub API:', error.message);
    return null;
  }
}

async function generateBuildInfo() {
  try {
    let commitHash;

    // Try git command first (works locally and in GitHub Actions)
    try {
      commitHash = execSync('git rev-parse HEAD', {
        cwd: rootDir,
        encoding: 'utf8',
      }).trim();
      console.log('✓ Got commit hash from git');
    } catch {
      console.log('⚠️  git command failed, trying GitHub API...');
      commitHash = await getCommitFromGitHub();
    }

    if (!commitHash) {
      throw new Error('Could not determine commit hash');
    }

    const commitShort = commitHash.substring(0, 7);

  // Get build timestamp
  const buildTime = new Date().toISOString();

  // Generate TypeScript file
  const content = `/**
 * Build information
 * Auto-generated at build time by scripts/generate-build-info.mjs
 * DO NOT EDIT MANUALLY
 */

export const BUILD_INFO = {
  commitHash: '${commitHash}',
  commitShort: '${commitShort}',
  buildTime: '${buildTime}',
} as const;
`;

  writeFileSync(outputFile, content, 'utf8');

  console.log('✅ Generated build info:');
  console.log(`   Commit: ${commitShort} (${commitHash})`);
  console.log(`   Build time: ${buildTime}`);
} catch (error) {
  console.error('❌ Failed to generate build info:', error.message);

  // Create fallback file so build doesn't fail
  const fallbackContent = `/**
 * Build information (fallback)
 * Auto-generated at build time by scripts/generate-build-info.mjs
 */

export const BUILD_INFO = {
  commitHash: 'unknown',
  commitShort: 'unknown',
  buildTime: '${new Date().toISOString()}',
} as const;
`;

  writeFileSync(outputFile, fallbackContent, 'utf8');
  console.log('⚠️  Created fallback build info');
  }
}

// Run the async function
generateBuildInfo().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
