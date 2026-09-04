#!/usr/bin/env bash
# Warm the ISR cache by crawling the sitemap, then report cache-status distribution.
#
# Why this exists: a PR environment starts with an empty GCS cache — roughly a
# hundred objects against live's tens of thousands. Deploying a cache-handler
# change there and seeing the site load proves almost nothing, because none of the
# cache paths are exercised at any meaningful scale. This populates the cache first
# so a measurement means something.
#
# Usage:
#   ./scripts/warm-cache.sh                                    # warm dev
#   BASE_URL=https://pr-109-jazz-nextjs15.pantheonsite.io ./scripts/warm-cache.sh
#   PASSES=3 CONCURRENCY=8 ./scripts/warm-cache.sh
#
# Two passes by default, and the distinction matters:
#   pass 1 populates  — expect mostly MISS
#   pass 2 measures   — expect mostly HIT/STALE
# A pass-2 result that is still mostly MISS is the interesting failure: it means
# entries are not being read back, which is what a broken handler looks like.
#
# Deliberately read-only: GET requests only, no revalidation, no purge. Safe to
# point at any environment including live.

set -euo pipefail

BASE_URL="${BASE_URL:-${NEXT_PUBLIC_SITE_URL:-https://dev-jazz-nextjs15.pantheonsite.io}}"
BASE_URL="${BASE_URL%/}"
PASSES="${PASSES:-2}"
CONCURRENCY="${CONCURRENCY:-4}"
# Cap so a run against a large site stays bounded; raise deliberately.
MAX_URLS="${MAX_URLS:-400}"

TMPDIR_RUN="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_RUN"' EXIT

URLS_FILE="$TMPDIR_RUN/urls.txt"

echo "Warming: $BASE_URL"
echo "Sitemap: $BASE_URL/sitemap.xml"

# Next emits either a urlset or a sitemapindex. Handle both: collect <loc>
# values, and if any of them are themselves sitemaps, expand one level.
fetch_locs() {
  curl -sS --fail --max-time 30 "$1" 2>/dev/null \
    | grep -o '<loc>[^<]*</loc>' \
    | sed -e 's|<loc>||' -e 's|</loc>||' || true
}

fetch_locs "$BASE_URL/sitemap.xml" > "$TMPDIR_RUN/raw.txt"

if [[ ! -s "$TMPDIR_RUN/raw.txt" ]]; then
  echo "ERROR: no URLs found in sitemap. Is $BASE_URL reachable?" >&2
  exit 1
fi

: > "$TMPDIR_RUN/expanded.txt"
while IFS= read -r loc; do
  case "$loc" in
    *sitemap*.xml) fetch_locs "$loc" >> "$TMPDIR_RUN/expanded.txt" ;;
    *)             printf '%s\n' "$loc" >> "$TMPDIR_RUN/expanded.txt" ;;
  esac
done < "$TMPDIR_RUN/raw.txt"

# Rebuild every URL against BASE_URL, keeping only the path.
#
# Load-bearing: sitemap.xml always emits the canonical production origin
# (https://jazzsequence.com/...), never the host being crawled. Warming those
# straight would populate WordPress's cache and leave the environment under test
# stone cold — while still printing a confident-looking summary. Strip the scheme
# and authority, keep the path.
#
# Also drop trailing slashes on non-root paths: Next 308-redirects "/posts/" to
# "/posts", and a redirect neither warms the cache nor reports a cache status.
sed -E -e 's#^[a-zA-Z][a-zA-Z0-9+.-]*://[^/]*##' -e 's#^$#/#' -e 's#(.)/$#\1#' \
  "$TMPDIR_RUN/expanded.txt" \
  | sed -E "s#^#${BASE_URL}#" > "$URLS_FILE"

sort -u "$URLS_FILE" -o "$URLS_FILE"
SEEDED=$(wc -l < "$URLS_FILE" | tr -d ' ')
echo "Seeded $SEEDED URLs from sitemap"

# Follow links rather than trusting the sitemap.
#
# app/sitemap.ts lists only /, /posts, /games, /media and post detail pages. It
# omits /media/<slug>, tag/category/series archives, WordPress pages and every
# paginated route — so a sitemap-only warm leaves most of the site cold while
# reporting success. Since the point of warming is to make an environment
# representative, seeding from an incomplete list defeats it.
#
# Same-origin, GET-only, depth-limited, and capped by MAX_URLS.
discover_from() {
  curl -sSL --max-time 30 "$1" 2>/dev/null \
    | grep -o 'href="[^"]*"' \
    | sed -e 's|^href="||' -e 's|"$||' \
    | grep '^/' \
    | grep -v '^//' \
    | sed -E -e 's/[#?].*$//' -e 's#(.)/$#\1#' \
    | grep -v -E '\.(xml|json|txt|ico|png|jpe?g|gif|svg|webp|css|js|rss|atom)$' \
    | grep -v -E '^/(api|_next)/' \
    || true
}

if [[ "${DISCOVER:-1}" == "1" ]]; then
  FRONTIER="$TMPDIR_RUN/frontier.txt"
  cp "$URLS_FILE" "$FRONTIER"

  for ((d = 1; d <= ${DEPTH:-2}; d++)); do
    [[ -s "$FRONTIER" ]] || break

    # Say so loudly rather than reporting "+0 new URLs", which is ambiguous between
    # "discovery ran and the site is fully covered" and "discovery never ran". Those
    # mean opposite things, and the silent version implies the good one while the
    # summary below measures an arbitrary subset. Same failure class as the canonical
    # -origin and Fastly-artifact bugs: output that looks like a result but isn't.
    HAVE=$(wc -l < "$URLS_FILE" | tr -d ' ')
    if [[ "$HAVE" -ge "$MAX_URLS" ]]; then
      echo "  !! discovery SKIPPED at depth $d: already have $HAVE URLs, cap is $MAX_URLS."
      echo "     Coverage is an arbitrary subset. Raise MAX_URLS to crawl properly."
      CAPPED=1
      break
    fi

    : > "$TMPDIR_RUN/found.txt"

    while IFS= read -r u; do
      if [[ $(wc -l < "$URLS_FILE") -ge $MAX_URLS ]]; then
        echo "  !! hit MAX_URLS ($MAX_URLS) partway through depth $d — discovery truncated."
        CAPPED=1
        break
      fi
      discover_from "$u" | sed -E "s#^#${BASE_URL}#" >> "$TMPDIR_RUN/found.txt"
    done < "$FRONTIER"

    # Frontier = only what we had not already seen, or depth 2 re-crawls depth 1.
    sort -u "$TMPDIR_RUN/found.txt" -o "$TMPDIR_RUN/found.txt"
    comm -13 "$URLS_FILE" "$TMPDIR_RUN/found.txt" > "$FRONTIER"
    NEW=$(wc -l < "$FRONTIER" | tr -d ' ')
    echo "  depth $d: +$NEW new URLs"
    [[ "$NEW" -eq 0 ]] && break
    cat "$FRONTIER" >> "$URLS_FILE"
    sort -u "$URLS_FILE" -o "$URLS_FILE"
  done
fi

FOUND_TOTAL=$(wc -l < "$URLS_FILE" | tr -d ' ')
head -n "$MAX_URLS" "$URLS_FILE" > "$TMPDIR_RUN/final.txt"
mv "$TMPDIR_RUN/final.txt" "$URLS_FILE"
TOTAL=$(wc -l < "$URLS_FILE" | tr -d ' ')

if [[ "$FOUND_TOTAL" -gt "$TOTAL" ]]; then
  echo "  !! truncated: $FOUND_TOTAL URLs known, warming only the first $TOTAL (MAX_URLS)."
  CAPPED=1
fi

echo "Warming $TOTAL URLs, $CONCURRENCY at a time, $PASSES passes"
echo

# Emits "<status> <url>" where status is the x-nextjs-cache value, HTTP code on
# error, or "none" when the header is absent. Absent is normal and expected for
# dynamic routes, which never consult the ISR route cache.
probe_one() {
  local url="$1"
  local headers code status edge
  headers=$(curl -sS -o /dev/null -D - --max-time 45 "$url" 2>/dev/null) || {
    printf 'ERROR %s\n' "$url"; return 0
  }
  headers=$(printf '%s' "$headers" | tr -d '\r')
  code=$(printf '%s' "$headers" | head -1 | awk '{print $2}')
  status=$(printf '%s' "$headers" \
    | awk 'BEGIN{IGNORECASE=1} /^x-nextjs-cache:/ {print $2}' | head -1)
  # Fastly reports one token per tier, e.g. "MISS, HIT". The origin was only
  # reached when NO tier hit.
  edge=$(printf '%s' "$headers" \
    | awk 'BEGIN{IGNORECASE=1} /^x-cache:/ {sub(/^[^:]*: */,""); print}' | head -1)

  if [[ "$code" != "200" ]]; then
    printf 'HTTP%s %s\n' "$code" "$url"
    return 0
  fi

  # Critical: an edge hit returns a response CACHED EARLIER, headers and all — so
  # its x-nextjs-cache value describes whenever that response was generated, not
  # this request. Counting those silently turns the whole report into fiction.
  # They get their own bucket rather than being folded into the origin numbers.
  if [[ "$edge" == *HIT* ]]; then
    printf 'EDGE(%s) %s\n' "${status:-none}" "$url"
  else
    printf '%s %s\n' "${status:-none}" "$url"
  fi
}
export -f probe_one

for ((pass = 1; pass <= PASSES; pass++)); do
  RESULTS="$TMPDIR_RUN/pass$pass.txt"
  START=$(date +%s)

  # xargs -P for concurrency without needing GNU parallel.
  xargs -P "$CONCURRENCY" -I{} bash -c 'probe_one "$@"' _ {} < "$URLS_FILE" > "$RESULTS"

  ELAPSED=$(( $(date +%s) - START ))
  echo "── pass $pass  (${ELAPSED}s) ──"
  awk '{print $1}' "$RESULTS" | sort | uniq -c | sort -rn | sed 's/^/   /'

  if grep -q '^ERROR\|^HTTP5' "$RESULTS"; then
    echo "   failures:"
    grep '^ERROR\|^HTTP5' "$RESULTS" | head -10 | sed 's/^/     /'
  fi
  echo
done

if [[ "${CAPPED:-0}" == "1" ]]; then
  echo "!! MAX_URLS was hit. The numbers above describe a subset of the site chosen by"
  echo "   crawl order, not by you. Do not read them as coverage."
  echo
fi

echo "Interpretation — read the EDGE() rows first:"
echo "  EDGE(x)          → served by Fastly; the origin was NOT reached and the"
echo "                     x-nextjs-cache value shown is a stale artifact of"
echo "                     whenever that response was first generated. Says nothing"
echo "                     about the handler. On a warm public site most rows are"
echo "                     these; use a fresh PR environment to see origin numbers."
echo "  MISS/HIT/STALE   → origin actually answered. These are the real signal."
echo "  none             → dynamic route, never consults the ISR route cache."
echo
echo "  pass 1 mostly MISS, later passes mostly HIT/STALE  → cache is working"
echo "  later passes still mostly MISS at the ORIGIN       → entries are not being"
echo "                                                        read back; investigate"
echo
echo "Note: a MISS becoming HIT can take tens of seconds — a STALE response"
echo "triggers regeneration in the background, so back-to-back passes will still"
echo "show the old value. Space passes out before concluding anything."
echo
echo "If testing the init bound, check the app logs for INIT_OBSERVED (real init"
echo "duration, once per process) and INIT_BOUND_EXCEEDED (the bound engaged)."
