#!/usr/bin/env node

/**
 * Test script for standalone build with environment variables
 * Loads .env.local for local testing of production builds
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
const envPath = resolve(__dirname, '../.env.local');
const result = config({ path: envPath });

if (result.error) {
  console.warn('⚠️  Warning: Could not load .env.local file');
  console.warn('   Standalone server will run without local environment variables');
  console.warn('   This is normal in production (Pantheon) where env vars are set in dashboard');
} else {
  console.log('✅ Loaded environment variables from .env.local');
  console.log('   WORDPRESS_API_URL:', process.env.WORDPRESS_API_URL ? '✓ set' : '✗ not set');
  console.log('   WORDPRESS_USERNAME:', process.env.WORDPRESS_USERNAME ? '✓ set' : '✗ not set');
  console.log('   WORDPRESS_APP_PASSWORD:', process.env.WORDPRESS_APP_PASSWORD ? '✓ set' : '✗ not set');
}

// Start the standalone server
const serverPath = resolve(__dirname, '../.next/standalone/server.js');
console.log('\n🚀 Starting standalone server...\n');

const server = spawn('node', [serverPath], {
  env: { ...process.env },
  stdio: 'inherit'
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
  }
  process.exit(code || 0);
});

// Handle termination signals
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
});
