#!/usr/bin/env node

/**
 * Generate build info at build time
 * Creates src/lib/build-info.ts with commit hash and build timestamp
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = join(__dirname, '..');
const outputFile = join(rootDir, 'src/lib/build-info.ts');

try {
  // Get git commit hash
  const commitHash = execSync('git rev-parse HEAD', {
    cwd: rootDir,
    encoding: 'utf8',
  }).trim();

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
