#!/usr/bin/env node

/**
 * Debug wrapper for Next.js server startup
 * Logs detailed information about the startup process
 */

console.log('[DEBUG] Server startup initiated');
console.log('[DEBUG] Current directory:', process.cwd());
console.log('[DEBUG] Node version:', process.version);
console.log('[DEBUG] Platform:', process.platform);

// Log environment variables
console.log('[DEBUG] Environment variables:');
console.log('  PORT:', process.env.PORT || 'not set');
console.log('  HOSTNAME:', process.env.HOSTNAME || 'not set');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');

// Set defaults
const PORT = process.env.PORT || '3000';
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

console.log('[DEBUG] Will use PORT:', PORT);
console.log('[DEBUG] Will use HOSTNAME:', HOSTNAME);

// Set for the server
process.env.PORT = PORT;
process.env.HOSTNAME = HOSTNAME;

console.log('[DEBUG] Checking for server.js...');
const fs = await import('fs');
const path = await import('path');

const serverPath = path.join(process.cwd(), 'server.js');
console.log('[DEBUG] Server path:', serverPath);
console.log('[DEBUG] Server exists:', fs.existsSync(serverPath));

if (!fs.existsSync(serverPath)) {
  console.error('[ERROR] server.js not found at:', serverPath);
  process.exit(1);
}

console.log('[DEBUG] Starting Next.js server...');

// Import and start the server
try {
  await import(serverPath);
  console.log('[DEBUG] Server started successfully');
} catch (error) {
  console.error('[ERROR] Failed to start server:', error);
  process.exit(1);
}

// Handle shutdown signals
process.on('SIGTERM', () => {
  console.log('[DEBUG] Received SIGTERM signal');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[DEBUG] Received SIGINT signal');
  process.exit(0);
});
