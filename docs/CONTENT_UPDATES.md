# Content Update Strategy

This document explains how the Next.js frontend stays in sync with WordPress content changes.

## Overview

When new posts, pages, or custom content is created/updated in WordPress, the Next.js frontend needs to know about it. We use a combination of strategies depending on the content type and freshness requirements.

## Update Strategies

### 1. Incremental Static Regeneration (ISR) - Primary Method

**Best for**: Individual pages, posts, recipes, games, artist profiles

**How it works**:
- Pages are statically generated at build time
- After the `revalidate` period expires, the next request triggers a rebuild
- Subsequent requests get the fresh cached version
- Background regeneration doesn't block users

**Implementation**:
```typescript
// app/posts/[slug]/page.tsx
export const revalidate = 300 // Revalidate every 5 minutes

export async function generateStaticParams() {
  const posts = await fetchAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

async function getPost(slug: string) {
  const res = await fetch(
    `${process.env.WORDPRESS_API_URL}/wp-json/wp/v2/posts?slug=${slug}`,
    { next: { revalidate: 300 } }
  )
  return res.json()
}
```

**Pros**:
- Fast performance (serves cached pages)
- Automatic updates within revalidation window
- No manual rebuilds needed
- Works on Pantheon's Next.js platform

**Cons**:
- Not instant (delayed by revalidation period)
- First user after expiration gets slower response

**Recommended revalidation times**:
- Blog posts: 5-10 minutes
- Static pages: 30-60 minutes
- Games/Recipes: 10-15 minutes
- Artist profiles: 15-30 minutes

### 2. On-Demand Revalidation - For Instant Updates

**Best for**: Important content that needs immediate visibility

**How it works**:
- WordPress triggers a webhook when content is published/updated
- Next.js API route receives webhook and revalidates specific paths
- Content updates appear immediately (within seconds)

**Implementation**:

**Next.js API Route** (`app/api/revalidate/route.ts`):
```typescript
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { secret, path, tag, type, slug } = await request.json()

  // Verify secret to prevent unauthorized revalidation
  if (secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ message: 'Invalid secret' }, { status: 401 })
  }

  try {
    // Revalidate by path
    if (path) {
      await revalidatePath(path)
    }

    // Revalidate by tag (e.g., all posts)
    if (tag) {
      await revalidateTag(tag)
    }

    // Revalidate based on content type
    if (type && slug) {
      const paths = {
        post: `/posts/${slug}`,
        page: `/${slug}`,
        gc_game: `/games/${slug}`,
        rb_recipe: `/recipes/${slug}`,
        'plague-artist': `/artists/${slug}`,
      }

      if (paths[type]) {
        await revalidatePath(paths[type])
      }
    }

    return Response.json({
      revalidated: true,
      now: Date.now(),
      path: path || `${type}/${slug}`
    })
  } catch (err) {
    return Response.json({
      message: 'Error revalidating',
      error: err.message
    }, { status: 500 })
  }
}
```

**WordPress Plugin** (Custom or use existing webhook plugin):
```php
<?php
// Add to WordPress functions.php or custom plugin

add_action('save_post', 'trigger_nextjs_revalidation', 10, 3);

function trigger_nextjs_revalidation($post_id, $post, $update) {
    // Only revalidate on publish, not drafts
    if ($post->post_status !== 'publish') {
        return;
    }

    $nextjs_url = getenv('NEXTJS_REVALIDATION_URL');
    $secret = getenv('NEXTJS_REVALIDATION_SECRET');

    if (!$nextjs_url || !$secret) {
        return;
    }

    $data = [
        'secret' => $secret,
        'type' => $post->post_type,
        'slug' => $post->post_name,
        'action' => $update ? 'update' : 'create',
    ];

    wp_remote_post($nextjs_url, [
        'body' => json_encode($data),
        'headers' => ['Content-Type' => 'application/json'],
        'timeout' => 5,
    ]);
}
```

**Environment Variables** (Set in Pantheon dashboard):
```env
NEXTJS_REVALIDATION_URL=https://your-site.pantheonsite.io/api/revalidate
REVALIDATION_SECRET=your-secure-random-string
WORDPRESS_API_URL=https://jazzsequence.com
```

**Pros**:
- Instant content updates
- No waiting for revalidation period
- Efficient (only rebuilds changed pages)

**Cons**:
- Requires WordPress plugin/configuration
- Needs secure webhook setup
- More complex to implement

### 3. Client-Side Fetching (SWR) - For Dynamic Lists

**Best for**: Homepage, latest posts, search results, feeds

**How it works**:
- Component fetches data on the client
- SWR (stale-while-revalidate) keeps UI responsive
- Automatic background updates and caching

**Implementation**:
```typescript
'use client'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function LatestPosts() {
  const { data, error, isLoading } = useSWR(
    '/api/posts/latest',
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true, // Refresh when tab gains focus
    }
  )

  if (isLoading) return <PostsSkeleton />
  if (error) return <ErrorMessage />

  return <PostList posts={data.posts} />
}
```

**Pros**:
- Always fresh data
- Automatic background updates
- Great UX with loading states
- No server rebuilds needed

**Cons**:
- Requires JavaScript
- Client-side API calls
- Not SEO-optimal for static content

### 4. Build-Time Generation - For Truly Static Content

**Best for**: About pages, contact forms, static content that rarely changes

**How it works**:
- Pages generated once at build time
- No automatic updates
- Requires new build/deployment to update

**Implementation**:
```typescript
// app/about/page.tsx
export default async function AboutPage() {
  const data = await fetchAboutPage()
  return <AboutContent data={data} />
}
```

**Pros**:
- Fastest possible performance
- Lowest server load
- Perfect for unchanging content

**Cons**:
- Requires rebuild for updates
- Not suitable for dynamic content

## Recommended Architecture

### Homepage
- **Strategy**: Client-side SWR for latest posts
- **Reason**: Always current, good UX, frequently changes
- **Fallback**: ISR with 5-minute revalidation for SSR

### Individual Posts/Pages
- **Strategy**: ISR with 5-10 minute revalidation
- **Enhancement**: On-demand revalidation for instant updates
- **Reason**: Balance between performance and freshness

### Custom Post Types (Games, Recipes, Artists)
- **Strategy**: ISR with 10-15 minute revalidation
- **Enhancement**: On-demand revalidation for new content
- **Reason**: Less frequently updated, performance priority

### Archive/Listing Pages
- **Strategy**: ISR with tag-based revalidation
- **Reason**: Multiple content items, needs coordination
- **Example**:
```typescript
export const revalidate = 300

export default async function PostsArchive() {
  const posts = await fetch(WP_API_URL, {
    next: {
      revalidate: 300,
      tags: ['posts'] // Tag for grouped revalidation
    }
  })
  return <ArchiveView posts={posts} />
}
```

### Search/Filters
- **Strategy**: Client-side with SWR
- **Reason**: User-specific, real-time filtering
- **Note**: Use server-side for SEO if needed

## Implementation Priority

### Phase 1: MVP (Current)
- [x] TypeScript types for WordPress content
- [x] Test infrastructure
- [ ] Basic ISR implementation (5-minute revalidation)
- [ ] WordPress API client functions

### Phase 2: Enhanced
- [ ] On-demand revalidation API route
- [ ] WordPress webhook plugin
- [ ] Environment variables configuration
- [ ] Tag-based cache invalidation

### Phase 3: Optimized
- [ ] SWR for client-side lists
- [ ] Advanced caching strategies
- [ ] Performance monitoring
- [ ] Cache warming on build

## Testing Content Updates

### Manual Testing
```bash
# 1. Create/update content in WordPress
# 2. Wait for revalidation period (or trigger webhook)
# 3. Verify update appears on site
# 4. Check Network tab for cache headers
```

### Automated Testing
```typescript
describe('Content Revalidation', () => {
  it('should revalidate post on webhook trigger', async () => {
    // Trigger webhook
    const response = await fetch('/api/revalidate', {
      method: 'POST',
      body: JSON.stringify({
        secret: process.env.REVALIDATION_SECRET,
        type: 'post',
        slug: 'test-post',
      }),
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.revalidated).toBe(true)
  })
})
```

## Monitoring

Track revalidation:
- Webhook success/failure rates
- Revalidation API response times
- Cache hit/miss ratios
- Content freshness (time between WP update and Next.js update)

Use Pantheon logs:
```bash
terminus node:logs:build:list jazz-nextjs.dev
```

## Troubleshooting

### Content Not Updating

**Check**:
1. Revalidation period hasn't expired yet
2. Webhook secret matches
3. WordPress can reach Next.js URL
4. No firewall blocking webhooks
5. Check Pantheon build logs

**Fix**:
- Manually trigger: Call `/api/revalidate` directly
- Clear cache: Redeploy site
- Check logs: `terminus node:logs`

### Webhook Failures

**Common Issues**:
- Incorrect URL in WordPress
- Secret mismatch
- Network timeout
- WordPress not published (still draft)

**Debug**:
```php
// Add logging to WordPress plugin
error_log('Next.js revalidation: ' . print_r($response, true));
```

## Security Considerations

1. **Secret Protection**: Never commit revalidation secret
2. **Rate Limiting**: Add rate limiting to webhook endpoint
3. **Input Validation**: Validate all webhook payloads
4. **HTTPS Only**: Enforce HTTPS for webhook URLs
5. **IP Whitelisting**: Restrict to WordPress server IPs (if possible)

## Performance Impact

**ISR**:
- Minimal: One rebuild per revalidation period per path
- Scales well with traffic

**On-Demand**:
- Low: Only rebuilds on actual changes
- Best for frequently updated content

**Client-Side**:
- Variable: Depends on API response time
- Increases client-side load

## References

- [Next.js ISR Documentation](https://nextjs.org/docs/app/guides/caching#revalidating)
- [On-Demand Revalidation](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- [SWR Documentation](https://swr.vercel.app)
- [Pantheon Next.js Caching](https://docs.pantheon.io/nextjs/architecture#runtime-architecture)

## Last Updated
2026-02-26
