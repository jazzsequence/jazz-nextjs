#!/bin/bash
# Headless WordPress Menu API test script
# Usage: ./scripts/test-menu-api.sh <username> <app-password>
# Or set WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD environment variables

set -e

# Get credentials from arguments or environment
USERNAME="${1:-$WORDPRESS_USERNAME}"
PASSWORD="${2:-$WORDPRESS_APP_PASSWORD}"

# Check if credentials are provided
if [ -z "$USERNAME" ] || [ -z "$PASSWORD" ]; then
    echo "❌ Error: No credentials provided"
    echo ""
    echo "Usage:"
    echo "  1. Pass as arguments: $0 <username> <app-password>"
    echo "  2. Set environment variables: WORDPRESS_USERNAME and WORDPRESS_APP_PASSWORD"
    echo "  3. Create .env.local file with credentials"
    echo ""
    exit 1
fi

echo "Testing WordPress Menu API..."
echo "Endpoint: https://jazzsequence.com/wp-json/wp/v2/menus"
echo ""

# Test /menus endpoint
response=$(curl -u "$USERNAME:$PASSWORD" -s -w "\n%{http_code}" https://jazzsequence.com/wp-json/wp/v2/menus)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo "✅ Success! Menus endpoint is accessible."
    echo ""
    echo "Found menus:"
    echo "$body" | jq -r '.[] | "  - \(.name) (ID: \(.id), slug: \(.slug), count: \(.count))"'
    echo ""

    # Get first menu ID and test menu-items endpoint
    first_menu_id=$(echo "$body" | jq -r '.[0].id')
    if [ -n "$first_menu_id" ] && [ "$first_menu_id" != "null" ]; then
        echo "Testing menu-items endpoint for menu ID $first_menu_id..."
        items_response=$(curl -u "$USERNAME:$PASSWORD" -s -w "\n%{http_code}" "https://jazzsequence.com/wp-json/wp/v2/menu-items?menus=$first_menu_id")
        items_http_code=$(echo "$items_response" | tail -n1)
        items_body=$(echo "$items_response" | sed '$d')

        if [ "$items_http_code" = "200" ]; then
            echo "✅ Menu items retrieved successfully!"
            item_count=$(echo "$items_body" | jq -r 'length')
            echo "Found $item_count menu items:"
            echo "$items_body" | jq -r '.[] | "  - \(.title.rendered) (\(.url))"' | head -10
        else
            echo "❌ Menu items failed with HTTP $items_http_code"
        fi
    fi
else
    echo "❌ Failed with HTTP $http_code"
    echo ""
    echo "Response:"
    echo "$body" | jq -r 'if .message then .message else . end'
fi
