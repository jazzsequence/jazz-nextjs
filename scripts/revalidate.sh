#!/usr/bin/env bash
# Force ISR cache revalidation on the target environment.
#
# Usage:
#   ./scripts/revalidate.sh                  # revalidate all tags against dev
#   ./scripts/revalidate.sh menu             # revalidate a single tag
#   ./scripts/revalidate.sh posts media menu # revalidate multiple tags
#   BASE_URL=https://live-jazz-nextjs15.pantheonsite.io ./scripts/revalidate.sh
#
# Requires REVALIDATE_SECRET in .env.local (or set in the environment).

set -euo pipefail

# Load .env.local if present and secret not already set
if [[ -z "${REVALIDATE_SECRET:-}" && -f "$(dirname "$0")/../.env.local" ]]; then
  # shellcheck disable=SC1091
  source "$(dirname "$0")/../.env.local"
fi

if [[ -z "${REVALIDATE_SECRET:-}" ]]; then
  echo "ERROR: REVALIDATE_SECRET is not set. Add it to .env.local or export it." >&2
  exit 1
fi

BASE_URL="${BASE_URL:-https://dev-jazz-nextjs15.pantheonsite.io}"
ENDPOINT="${BASE_URL}/api/revalidate"

# Default: revalidate all common tags
ALL_TAGS=(posts pages menu header media games)

if [[ $# -gt 0 ]]; then
  TAGS=("$@")
else
  TAGS=("${ALL_TAGS[@]}")
fi

echo "Target: ${ENDPOINT}"
echo "Tags:   ${TAGS[*]}"
echo ""

for tag in "${TAGS[@]}"; do
  body=$(curl -s -o /tmp/revalidate-body.txt -w "%{http_code}" -X POST "${ENDPOINT}" \
    -H "Content-Type: application/json" \
    -H "X-Revalidate-Secret: ${REVALIDATE_SECRET}" \
    -d "{\"tag\":\"${tag}\"}")
  code="$body"
  body=$(cat /tmp/revalidate-body.txt)

  if [[ "$code" == "200" ]]; then
    echo "✓ ${tag}"
  else
    echo "✗ ${tag} (HTTP ${code}): ${body}" >&2
  fi
done

echo ""
echo "Done."
