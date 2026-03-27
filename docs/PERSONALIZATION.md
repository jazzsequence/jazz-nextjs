# Personalization — Altis Experience Blocks

This document covers how Altis Accelerate Experience Blocks are integrated into the Next.js frontend, how the system works, and how to add or modify personalized content in the future.

---

## Quick Reference: Who Does What

### Adding a new variant to an existing Experience Block (e.g., new greeting)

**You do (in WordPress):**
1. Go to **Altis → Audiences**, create an audience with the rules you want.
2. Open the reusable block in the block editor, add a new `altis/variant`, assign it the audience, add a Heading + Paragraph block.
3. Save.

**Claude does:** Nothing — the Next.js site picks it up automatically.

---

### Adding a completely new Experience Block to a new part of the site

**You do (in WordPress):**
1. Create audiences (if new ones are needed).
2. Create a new Reusable Block with `altis/variant` inner blocks, note its post ID.

**You tell Claude:**
- "Add a new personalized block at [route/location], using WordPress block ID [N]."

**Claude does:**
1. Adds a new fetcher in `src/lib/wordpress/` modeled on `greeting.ts`.
2. Creates a server + client component pair (modeled on `Greeting` / `GreetingClient`).
3. Adds the `?myblock=<name>` test parameter mapping in the client component.
4. Adds E2E test coverage.
5. Wires the component into the target route.

---

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Current Implementation: Homepage Greeting](#current-implementation-homepage-greeting)
- [WordPress Side: Adding New Variants or Audiences](#wordpress-side-adding-new-variants-or-audiences)
- [Next.js Side: Adding New Experience Blocks](#nextjs-side-adding-new-experience-blocks)
- [Supported Audience Rules](#supported-audience-rules)
- [Variant Priority and Fallback](#variant-priority-and-fallback)
- [E2E Testing](#e2e-testing)
- [Limitations and Known Constraints](#limitations-and-known-constraints)

---

## Overview

The homepage greeting ("Good morning, I'm Chris" / "Good evening, I'm Chris" / etc.) is served by an **Altis Experience Block** — a WordPress reusable block that holds multiple `altis/variant` inner blocks, each targeted to a different **Altis Accelerate audience**.

The Next.js app fetches the block data and audience definitions from WordPress at request time (server-side), then runs the audience matching logic in the browser using the visitor's local timezone and server-detected country, and renders the correct variant — all without a full page reload or server round-trip for the selection step.

---

## How It Works

### Data flow

```
WordPress (Altis Accelerate)
  ├── Reusable Block (ID 16738)         ← contains all variants
  │     └── altis/variant (fallback)    ← shown when no audience matches
  │     └── altis/variant (morning)     ← audience ID 16719
  │     └── altis/variant (afternoon)   ← audience ID 16720
  │     └── ...
  └── /wp-json/accelerate/v1/audiences  ← audience rule definitions

Next.js (server, per request)
  ├── fetchGreetingData()               ← fetches both endpoints in parallel
  ├── Reads CDN country header          ← fastly-client-country / cf-ipcountry / etc.
  └── Passes {variants, audiences, serverCountry} to client component

Browser (client)
  ├── Gets browser's IANA timezone      ← Intl.DateTimeFormat().resolvedOptions().timeZone
  ├── matchAudiences(audiences, {country, timezone})
  │     └── evaluates rules against current hour/day/date/country
  ├── Selects first matching variant (or fallback)
  └── Renders heading + content (sanitized via DOMPurify)
```

### Why the matching runs in the browser

Time-of-day greetings must reflect the **visitor's local time**, not the server's timezone. Matching runs client-side so the browser's timezone is used. The server only contributes the visitor's country (read from CDN-injected headers), which cannot be spoofed client-side.

### The two WordPress API endpoints

| Endpoint | What it returns |
|---|---|
| `GET /wp-json/wp/v2/blocks/{BLOCK_ID}` | Reusable block with `ab_test_block` array of variants |
| `GET /wp-json/accelerate/v1/audiences` | All Altis audience definitions (rules) |

Both require authentication (WordPress application password) since reusable blocks are private by default.

---

## Current Implementation: Homepage Greeting

### Block ID

The greeting block ID is hardcoded in `src/lib/wordpress/greeting.ts`:

```typescript
const GREETING_BLOCK_ID = 16738;
```

### Current variants

| Audience ID | Condition | Heading |
|---|---|---|
| *(fallback)* | No match | "Hi, I'm Chris" |
| 16719 | hour < 11 | "Good morning, I'm Chris" |
| 16720 | 11 ≤ hour < 17 | "Good afternoon, I'm Chris" |
| 16722 | hour ≥ 17 | "Good evening, I'm Chris" |
| 16726 | Thursday, 17 < hour ≤ 21 | "Welcome adventurer, I'm Chris" |
| 16377 | country = CN | "嗨，我是 Chris" |

### Relevant files

| File | Role |
|---|---|
| `src/lib/wordpress/greeting.ts` | Fetches block + audiences from WP REST API, parses variants |
| `src/lib/audience-matcher.ts` | Client-side rule evaluation against time/geo metrics |
| `src/components/Greeting.tsx` | Server component — fetches data, reads country header |
| `src/components/GreetingClient.tsx` | Client component — runs matching, renders selected variant |
| `app/page.tsx` | Renders `<Greeting />` on the homepage |

---

## WordPress Side: Adding New Variants or Audiences

No Next.js code changes are required to add new variants or audiences, **as long as they use supported rule fields** (see [Supported Audience Rules](#supported-audience-rules)). The Next.js app dynamically fetches all audiences from `/accelerate/v1/audiences` and all variants from the block.

### Adding a new audience in Altis Accelerate

1. In WordPress admin → **Altis** → **Audiences**, create a new audience.
2. Add rules using supported fields: `metrics.hour`, `metrics.day`, `metrics.date`, `metrics.month`, `metrics.year`, `endpoints.country`, `endpoints.city`, `endpoints.region`.
3. Note the audience ID from the URL or the REST API response. You'll need it in step 4.
4. In the Experience Block (block ID 16738), add a new `altis/variant` block and assign it to the new audience.

The Next.js site will pick it up automatically on the next request (ISR revalidation or page refresh).

### Adding a new variant to the greeting block

1. Open the reusable block (ID 16738) in the WordPress block editor.
2. Inside the Experience Block, click **+ Add variant**.
3. Set the **Audience** to the audience you want to target.
4. Add a **Heading block** (`core/heading`) and one or more **Paragraph blocks** (`core/paragraph`).
5. Save. The variant is live on the next page request.

### Important constraints

- Each variant must contain at least one `core/heading` block — the first `<h1>`–`<h6>` found is used as the heading.
- Each variant can contain multiple `core/paragraph` blocks — all are joined with `\n\n` and rendered as the content body.
- The variant marked **Fallback** is shown when no audience matches. There should always be exactly one fallback variant.
- HTML inline formatting within paragraphs (`<strong>`, `<em>`, `<a>`, etc.) is preserved and sanitized by DOMPurify before rendering.
- Other block types inside a variant (images, lists, etc.) are currently **not rendered** — only `core/heading` and `core/paragraph` inner blocks are parsed. See [Limitations](#limitations-and-known-constraints).

---

## Next.js Side: Adding New Experience Blocks

If you want to add a **second** Experience Block to a different part of the site (not the homepage greeting), you'll need to add corresponding code.

### Step 1 — Create the WordPress block

Follow the same process as above: create audiences, create a reusable block with `altis/variant` inner blocks.

### Step 2 — Add a fetcher in `src/lib/wordpress/`

Model it on `greeting.ts`. The key parts:

```typescript
const MY_BLOCK_ID = 12345; // WordPress block post ID

export async function fetchMyBlockData(): Promise<{ variants: MyVariant[]; audiences: Audience[] }> {
  const [blockResponse, audiencesResponse] = await Promise.all([
    fetch(`${API_BASE_URL}/blocks/${MY_BLOCK_ID}`, { headers: getAuthHeaders() }),
    fetch(`${WP_BASE_URL}/wp-json/accelerate/v1/audiences`, { headers: getAuthHeaders() }),
  ]);
  // ... parse and return
}
```

The `getAuthHeaders()` pattern and `parseAudiences()` logic can be reused directly from `greeting.ts` — consider extracting them to a shared utility if you add a second block.

### Step 3 — Create server + client components

Follow the `Greeting` / `GreetingClient` split:

- **Server component**: fetches data, reads the country header from `next/headers`, passes `{ variants, audiences, serverCountry }` as props.
- **Client component** (`'use client'`): runs `matchAudiences()` in `useEffect`, selects a variant, renders it. Sanitize any HTML content with DOMPurify.

### Step 4 — Place the component

Add `<MyBlock searchParams={searchParams} />` wherever the personalized content should appear.

---

## Supported Audience Rules

The `matchAudiences()` function in `src/lib/audience-matcher.ts` supports the following rule fields:

### Time-based fields (use browser's local timezone)

| Field | Type | Description | Example |
|---|---|---|---|
| `metrics.hour` | number | Current hour (0–23) | `lt: 11` = before 11am |
| `metrics.day` | number | Day of week (0=Sun, 6=Sat) | `= 4` = Thursday |
| `metrics.date` | number | Day of month (1–31) | `= 25` = 25th |
| `metrics.month` | number | Month (0-indexed: 0=Jan, 11=Dec) | `= 11` = December |
| `metrics.year` | number | Full year | `= 2025` |

### Geo-targeting fields (use server-detected country from CDN headers)

| Field | Type | Description | Example |
|---|---|---|---|
| `endpoints.country` | string | ISO 3166-1 alpha-2 country code | `= CN` |
| `endpoints.city` | string | City name (from CDN) | `= Seattle` |
| `endpoints.region` | string | Region/state code | `= CA` |

### Supported operators

| Operator | Meaning |
|---|---|
| `=` | Equal to |
| `lt` | Less than |
| `gt` | Greater than |
| `lte` | Less than or equal |
| `gte` | Greater than or equal |

### Rule logic

- **Within an audience**: all rules must match (AND logic).
- **Across audiences**: the first matching audience ID is used.
- **Priority**: audiences are evaluated in the order returned by `/accelerate/v1/audiences`. More specific audiences (e.g., the D&D Thursday audience) should be ordered before broader ones (e.g., Evening) in the Altis Audiences list if you want them to take priority when both match.

---

## Variant Priority and Fallback

When multiple audiences match (e.g., Thursday evening matches both "Evening" and "D&D"), the **first match** in the audiences array wins. Audience order in Altis controls priority.

When no audience matches:
1. The variant with `attrs.fallback: true` is shown.
2. If no fallback variant exists, the first variant in the block is shown.
3. If the block fetch fails entirely, a hardcoded emergency fallback (`"Hi, I'm Chris"`) is rendered.

---

## E2E Testing

The `?greeting=<name>` query parameter forces a specific variant for E2E testing:

| Value | Forces variant |
|---|---|
| `morning` | Audience 16719 |
| `afternoon` | Audience 16720 |
| `evening` | Audience 16722 |
| `dnd` | Audience 16726 |
| `china` | Audience 16377 |
| `fallback` | Fallback variant |

> These mappings are hardcoded in `GreetingClient.tsx`. If you add a new variant, add its name → audience ID mapping there so it can be tested via `?greeting=<name>`.

---

## Limitations and Known Constraints

| Constraint | Detail |
|---|---|
| Only `core/heading` and `core/paragraph` are parsed | Other block types (images, lists, buttons) inside a variant are silently ignored |
| Only the first `groups[0]` rule group is evaluated per audience | Altis supports multiple groups (OR logic), but the matcher only reads the first group |
| Geo-targeting requires a CDN that injects country headers | Works on Pantheon (Fastly), Cloudflare, Vercel, and CloudFront. Country detection fails in local development without mocking |
| Block must be a WordPress Reusable Block | The `/wp/v2/blocks/:id` endpoint only serves reusable blocks, not page-embedded blocks |
| Authentication required | The `WORDPRESS_USERNAME` and `WORDPRESS_APP_PASSWORD` env vars must be set; block fetches fail without them |
| Block ID is hardcoded | `GREETING_BLOCK_ID = 16738` in `greeting.ts`. If the block is recreated or a new one is needed, update this constant |
| No ISR cache tags for the greeting | The greeting block is fetched without ISR tags, so it re-fetches on every server render. If this becomes a performance concern, add `next: { revalidate: 3600, tags: ['greeting'] }` to the fetch calls |

---

## Last Updated
2026-03-27
