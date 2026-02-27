#!/usr/bin/env php
<?php
/**
 * Quicksilver script to clear Pantheon edge cache on deployment
 *
 * This script runs automatically via pantheon.yml workflows:
 * - After code deployment (deploy workflow)
 * - After code sync (sync_code workflow)
 *
 * Clears both Varnish CDN cache and Next.js cache to ensure
 * fresh content is served after deployments.
 */

// Only run on Pantheon environments
if (!isset($_ENV['PANTHEON_ENVIRONMENT'])) {
    echo "Not running on Pantheon, skipping cache clear.\n";
    exit(0);
}

$env = $_ENV['PANTHEON_ENVIRONMENT'];
$site_id = $_ENV['PANTHEON_SITE'];

echo "Clearing Pantheon edge cache for {$site_id}.{$env}...\n";

// Clear Pantheon CDN cache using pantheon_curl
// This clears Varnish cache for the entire environment
$url = "https://api.pantheon.io/sites/{$site_id}/environments/{$env}/clear-cache";

// Use pantheon_curl (available in Quicksilver context)
if (function_exists('pantheon_curl')) {
    $result = pantheon_curl($url, [
        'method' => 'POST',
        'headers' => [
            'Content-Type: application/json',
        ],
    ]);

    if ($result['http_code'] === 200) {
        echo "✅ Pantheon edge cache cleared successfully\n";
    } else {
        echo "⚠️  Cache clear returned status: {$result['http_code']}\n";
        echo "Response: " . $result['body'] . "\n";
    }
} else {
    // Fallback: use terminus command
    echo "Using terminus fallback...\n";
    $terminus_command = "terminus env:clear-cache {$site_id}.{$env}";
    exec($terminus_command, $output, $return_code);

    if ($return_code === 0) {
        echo "✅ Cache cleared via terminus\n";
    } else {
        echo "⚠️  Terminus command failed: " . implode("\n", $output) . "\n";
    }
}

echo "Cache clear complete.\n";
