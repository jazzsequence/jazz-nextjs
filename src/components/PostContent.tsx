import Link from 'next/link';
import { format } from 'date-fns';
import parse, { domToReact } from 'html-react-parser';
import type { HTMLReactParserOptions, Element } from 'html-react-parser';
import type { DOMNode } from 'html-react-parser';
import DOMPurify from 'isomorphic-dompurify';
import { decodeHtmlEntities, normalizeWordPressUrl, stripWordPressSize } from '@/lib/utils/html';
import FeaturedImage from './FeaturedImage';
import PostBodyImage from './PostBodyImage';
import GalleryLightbox from './GalleryLightbox';
import type { GalleryImage } from './GalleryLightbox';
import SocialScriptLoader from './SocialScriptLoader';
import WPEmbedCard from './WPEmbedCard';
import ArticleCard from './ArticleCard';
import ArticleCardWithImage from './ArticleCardWithImage';
import type { WPContent, WPTerm } from '@/lib/wordpress/types';

interface PostContentProps {
  post: WPContent;
}

// Derive the WordPress backend hostname from env vars so migrating the backend
// to a different host (e.g. cms.jazzsequence.com) only requires an env var change.
const WP_BACKEND_HOSTNAME = (() => {
  const raw = process.env.WORDPRESS_BASE_URL || process.env.WORDPRESS_API_URL
  if (raw) {
    try { return new URL(raw).hostname } catch { /* fall through */ }
  }
  return 'jazzsequence.com'
})()
// Escape dots for use in a regex (other hostname chars don't need escaping)
const WP_HOST_RE = WP_BACKEND_HOSTNAME.replace(/\./g, '\\.')

/**
 * Rewrite absolute WordPress backend post/page URLs to relative routes.
 * Deliberately does NOT rewrite /wp-content/ paths — those are image URLs
 * that need to remain absolute (served from the backend host or CDN).
 * Rewriting them to relative paths breaks images because those paths
 * don't exist on this Next.js app.
 */
function rewriteInternalLinks(html: string): string {
  return html
    // Normalize double slashes in wp-content paths (WordPress storage quirk)
    .replace(/(https?:\/\/[^"'\s]+\/wp-content\/uploads)\/\//g, '$1/')
    // Rewrite post/page links (excluding /wp-content/) to relative paths
    .replace(new RegExp(`https?://${WP_HOST_RE}/(?!wp-content/)`, 'g'), '/')
    // Handle bare domain in href attributes (e.g. href="https://backend.com")
    .replace(new RegExp(`https?://${WP_HOST_RE}"`, 'g'), '/"')
    // Rewrite WordPress date-based post URLs to Next.js /posts/[slug] routes.
    // WordPress: /2022/01/some-post/ → Next.js: /posts/some-post/
    // Matches quoted href values only, leaving absolute CDN/media URLs untouched.
    .replace(/"\/\d{4}\/\d{2}\/([^/"?#\s]+)\/?"/g, '"/posts/$1"')
    .replace(/'\/\d{4}\/\d{2}\/([^/"?#\s]+)\/?'/g, "'/posts/$1'")
}

/** Extract plain text from a DOM element and its descendants. */
function getTextContent(el: Element): string {
  const parts: string[] = []
  const walkText = (nodes: DOMNode[]) => {
    for (const n of nodes) {
      if (n.type === 'text') parts.push((n as { data: string }).data || '')
      if (n.type === 'tag' && 'children' in n) walkText((n as Element).children as DOMNode[])
    }
  }
  if (el.children) walkText(el.children as DOMNode[])
  return parts.join('').trim()
}

/** Resolve the full-size URL from an img element's src/srcset. */
function resolveFullSrc(img: Element): string {
  const srcset = img.attribs?.srcset
  if (srcset) {
    const largest = srcset
      .split(',')
      .map(s => { const [u, w] = s.trim().split(/\s+/); return { url: u, w: parseInt(w) || 0 } })
      .sort((a, b) => b.w - a.w)[0]
    if (largest?.url) return largest.url
  }
  return stripWordPressSize(img.attribs.src)
}

/**
 * Walk the parsed DOM to extract images (with optional captions) from a
 * wp-block-gallery figure.
 *
 * Gutenberg galleries nest each image inside a figure.wp-block-image with an
 * optional figcaption/.wp-element-caption sibling. This function walks those
 * inner figures to pair each <img> with its caption text.
 *
 * Falls back to bare <img> detection for older classic-editor gallery markup.
 */
function extractGalleryImages(node: Element): GalleryImage[] {
  const images: GalleryImage[] = []

  const walk = (nodes: DOMNode[]) => {
    for (const n of nodes) {
      if (n.type !== 'tag') continue
      const el = n as Element

      // Gutenberg format: inner figure.wp-block-image contains one img + optional caption
      if (el.name === 'figure' && el.attribs?.class?.includes('wp-block-image')) {
        let imgEl: Element | null = null
        let caption: string | undefined
        for (const child of ((el.children ?? []) as DOMNode[])) {
          if (child.type !== 'tag') continue
          const c = child as Element
          if (c.name === 'img' && c.attribs?.src) imgEl = c
          if (c.name === 'figcaption' || c.attribs?.class?.includes('wp-element-caption')) {
            const text = getTextContent(c)
            if (text) caption = text
          }
        }
        if (imgEl) {
          images.push({
            src: imgEl.attribs.src,
            full: resolveFullSrc(imgEl),
            alt: imgEl.attribs?.alt || '',
            caption,
          })
        }
        continue // don't recurse into the inner figure
      }

      // Fallback: bare <img> (classic-editor gallery markup)
      if (el.name === 'img' && el.attribs?.src) {
        images.push({
          src: el.attribs.src,
          full: resolveFullSrc(el),
          alt: el.attribs?.alt || '',
        })
        continue
      }

      if ('children' in el && el.children?.length) {
        walk(el.children as DOMNode[])
      }
    }
  }

  if (node.children) walk(node.children as DOMNode[])
  return images
}

const parseOptions: HTMLReactParserOptions = {
  replace(domNode) {
    if (domNode.type !== 'tag') return
    const el = domNode as Element
    const cls = el.attribs?.class ?? ''

    // Replace bare <img> elements with PostBodyImage for graceful 404 handling.
    // Hotlinked or old external images that no longer exist show as broken icons
    // without this — PostBodyImage hides them via onError instead.
    // Note: images inside figure.wp-block-gallery are handled by the gallery
    // interceptor below and never reach this branch.
    if (el.name === 'img' && el.attribs?.src) {
      const a = el.attribs
      // Extract pixel dimensions from inline style when no explicit width/height attrs.
      // Gutenberg resized images (e.g. favicons with style="width:32px;height:32px")
      // omit HTML attributes, so PostBodyImage receives no size constraints otherwise.
      const styleStr = a.style ?? ''
      const styleW = styleStr.match(/width:\s*(\d+)px/)?.[1]
      const styleH = styleStr.match(/height:\s*(\d+)px/)?.[1]
      return (
        <PostBodyImage
          src={a.src}
          alt={a.alt}
          className={a.class}
          width={a.width ? parseInt(a.width, 10) : styleW ? parseInt(styleW, 10) : undefined}
          height={a.height ? parseInt(a.height, 10) : styleH ? parseInt(styleH, 10) : undefined}
          title={a.title}
          srcSet={a.srcset}
        />
      )
    }

    // Replace wp-block-gallery figures with interactive lightbox
    if (el.name === 'figure' && cls.includes('wp-block-gallery')) {
      const images = extractGalleryImages(el)
      if (images.length > 0) {
        return <GalleryLightbox images={images} />
      }
    }

    // Twitter/X embeds: rebuild the figure structure so the blockquote renders correctly.
    // Script loading is handled by SocialScriptLoader at the component level.
    if (
      el.name === 'figure' &&
      (cls.includes('wp-block-embed-twitter') || cls.includes('wp-block-embed-x'))
    ) {
      return (
        <figure className={cls}>
          <div className="wp-block-embed__wrapper">
            {/* domToReact renders the blockquote.twitter-tweet content */}
            {domToReact(el.children as DOMNode[], parseOptions)}
          </div>
        </figure>
      )
    }

    // Native WordPress post embeds (is-type-wp-embed): WordPress renders these as a
    // blockquote.wp-embedded-content (title link) + a hidden iframe. In the headless
    // context the iframe never loads. Fetch oEmbed data via /api/oembed and render
    // an ArticleCard matching the WordPressPost Storybook design.
    if (el.name === 'figure' && cls.includes('is-type-wp-embed')) {
      // Extract the external URL from the blockquote fallback's <a> tag
      const blockquote = (el.children as DOMNode[]).flatMap(
        c => (c as Element).children ?? []
      ).find(c => (c as Element).name === 'blockquote')
      const anchor = ((blockquote as Element)?.children as DOMNode[])?.find(
        c => (c as Element).name === 'a'
      ) as Element | undefined
      const url = anchor?.attribs?.href
      const fallbackTitle = anchor ? getTextContent(anchor) : ''
      // Derive provider name from figure class: wp-block-embed-{provider}
      const providerMatch = cls.match(/wp-block-embed-([a-z0-9-]+)/)
      const providerSlug = providerMatch?.[1] ?? ''
      const providerName = providerSlug
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join('')

      if (url) {
        return (
          <WPEmbedCard
            url={url}
            providerName={providerName}
            fallbackTitle={fallbackTitle}
          />
        )
      }
    }

    // Pantheon custom article groups: wp-block-group.has-background containing a
    // wp-embed-heading paragraph. These were built to look like native WP post embeds
    // but use Gutenberg blocks (Pantheon.io is on Drupal, can't use native WP embeds).
    // Extract the structured content and render as ArticleCard for consistency.
    if (
      el.name === 'div' &&
      cls.includes('wp-block-group') &&
      cls.includes('has-background')
    ) {
      const children = (el.children as DOMNode[]).filter(
        c => c.type === 'tag'
      ) as Element[]

      const headingEl = children.find(c => c.attribs?.class?.includes('wp-embed-heading'))
      if (!headingEl) return // not a Pantheon article card — let it render normally

      // Find the primary article link in the heading paragraph.
      // Most articles: <a href="..."><strong>Title</strong></a>
      // Some articles: <strong>Title</strong> (<a href="wayback">wayback</a>) (<a href="local">local repost</a>)
      // Strategy: prefer a direct <a> child; if none, find any <a> in the paragraph
      // that is NOT a web.archive.org wayback link (those are archival references,
      // not the primary article URL).
      const headingLinks = (headingEl.children as DOMNode[])
        ?.filter(c => (c as Element).name === 'a') as Element[]
      const strongEl = (headingEl.children as DOMNode[])
        ?.find(c => (c as Element).name === 'strong') as Element | undefined
      // A link wrapping the strong (normal Pantheon pattern)
      const wrappingLink = (headingEl.children as DOMNode[])
        ?.find(c => {
          const e = c as Element
          return e.name === 'a' && e.children?.some(
            ch => (ch as Element).name === 'strong'
          )
        }) as Element | undefined
      // Primary link: wrapping <a>, then direct <a> (non-wayback), then any <a>
      const primaryLink = wrappingLink
        ?? headingLinks.find(a => !(a.attribs?.href ?? '').includes('web.archive.org'))
        ?? headingLinks[0]
        ?? (strongEl ? (strongEl.children as DOMNode[])
            ?.find(c => (c as Element).name === 'a') as Element | undefined : undefined)

      const href = primaryLink?.attribs?.href ?? ''
      // Title: text of the strong element (if present) or the whole heading
      const title = strongEl ? getTextContent(strongEl) : headingEl ? getTextContent(headingEl) : ''

      // Source paragraph (has-extra-small-font-size) → provider domain
      const sourceEl = children.find(
        c => c.name === 'p' && c.attribs?.class?.includes('has-extra-small-font-size')
      )
      const sourceName = sourceEl ? getTextContent(sourceEl) : ''

      if (!href || !title) return // incomplete data — fall through to default

      // Derive provider for the source attribution footer
      let sourceUrl = ''
      try { sourceUrl = new URL(href).origin } catch { /* internal link */ }
      const faviconUrl = sourceUrl
        ? `https://icons.duckduckgo.com/ip3/${new URL(sourceUrl).hostname}.ico`
        : undefined

      // Internal links (already rewritten to /posts/slug) → ArticleCard directly.
      // External links → ArticleCardWithImage: preserves DOM-extracted title/excerpt
      // but fetches og:image asynchronously so Pantheon articles get featured images
      // without OG data overwriting the article-specific title (avoids duplicates when
      // two groups share the same destination URL).
      if (!href.startsWith('http')) {
        return (
          <ArticleCard
            href={href}
            title={title}
            sourceName={sourceName || 'jazzsequence.com'}
            sourceUrl="/"
          />
        )
      }

      return (
        <ArticleCardWithImage
          href={href}
          title={title}
          sourceName={sourceName || 'Pantheon'}
          sourceUrl={sourceUrl || href}
          faviconUrl={faviconUrl}
        />
      )
    }

    // Pure-link list items: <li><a href="https://...">Title</a></li>
    // Used for EventEspresso articles and any other external article links in lists.
    // Renders as WPEmbedCard (fetches oEmbed, falls back to title+domain card).
    // Scoped to external URLs only — internal/relative links are left as plain list items.
    if (el.name === 'li') {
      const tagChildren = (el.children as DOMNode[]).filter(
        c => c.type === 'tag'
      ) as Element[]
      const textChildren = (el.children as DOMNode[]).filter(
        c => c.type === 'text' && ((c as unknown as { data: string }).data ?? '').trim()
      )
      if (tagChildren.length === 1 && textChildren.length === 0 && tagChildren[0].name === 'a') {
        const link = tagChildren[0]
        const href = link.attribs?.href ?? ''
        if (href.startsWith('https://') || href.startsWith('http://')) {
          const text = getTextContent(link)
          let providerName = ''
          try {
            const host = new URL(href).hostname.replace(/^www\./, '')
            const slug = host.split('.')[0]
            providerName = slug.charAt(0).toUpperCase() + slug.slice(1)
          } catch { /* keep empty */ }
          return (
            <li style={{ listStyle: 'none' }}>
              <WPEmbedCard url={href} providerName={providerName} fallbackTitle={text} />
            </li>
          )
        }
      }
    }
  },
}

export default function PostContent({ post }: PostContentProps) {
  const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
  const hasImage = post.featured_media > 0 && featuredMedia;
  const isPost = post.type === 'post';

  // Flatten wp:term arrays, partition by taxonomy
  const allTerms: WPTerm[] = (post._embedded?.['wp:term'] ?? []).flat();
  const tags       = allTerms.filter(t => t.taxonomy === 'post_tag');
  const categories = allTerms.filter(t => t.taxonomy === 'category');
  // Any remaining taxonomy (e.g. "series") grouped by name
  const otherTerms = allTerms.filter(t => t.taxonomy !== 'post_tag' && t.taxonomy !== 'category');
  const otherGroups = otherTerms.reduce<Record<string, WPTerm[]>>((acc, t) => {
    (acc[t.taxonomy] ??= []).push(t)
    return acc
  }, {})

  // Raw content passed to SocialScriptLoader to detect which platform scripts
  // need injecting. Checked before sanitization so no content is missed.
  const rawContent = post.content.rendered

  const sanitized = post.content.rendered
    ? rewriteInternalLinks(
        DOMPurify.sanitize(post.content.rendered, {
          // Allow iframes for embeds (Spotify, YouTube, etc.)
          // Content comes from our own WordPress instance — trusted source.
          ADD_TAGS: [
            'iframe',
            // SVG filter elements for wp-duotone
            'filter',
            'feColorMatrix',
            'feBlend',
            'feFlood',
            'feComposite',
            'feComponentTransfer',
            'feFuncR', 'feFuncG', 'feFuncB', 'feFuncA',
          ],
          ADD_ATTR: [
            // iframe embed attributes
            'allow', 'allowfullscreen', 'frameborder', 'scrolling', 'loading',
            // SVG filter attributes
            'type', 'values', 'in', 'in2', 'result', 'mode',
            'flood-color', 'flood-opacity', 'operator',
          ],
        })
      )
    : ''

  return (
    <article>
      <header className="mb-8">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-brand-text leading-tight mb-3">
          {decodeHtmlEntities(post.title.rendered)}
        </h1>
        {isPost && (
          <time
            className="font-mono text-brand-muted text-sm uppercase tracking-widest"
            dateTime={post.date}
          >
            {format(new Date(post.date), 'MMMM d, yyyy')}
          </time>
        )}
      </header>

      {hasImage && (
        <div className="relative w-full rounded-xl overflow-hidden mb-10" style={{ height: '28rem' }}>
          {/* Featured image — FeaturedImage handles broken URLs with a gradient fallback */}
          <FeaturedImage
            src={normalizeWordPressUrl(featuredMedia.source_url)}
            alt={featuredMedia.alt_text || decodeHtmlEntities(post.title.rendered)}
          />
          {/* Retrowave gradient overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(13,13,26,0.5) 0%, rgba(26,13,46,0.45) 40%, rgba(13,26,46,0.45) 100%)',
            }}
          />
          {/* Dark fade at bottom for legibility if text were added */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, transparent 50%, rgba(13,13,26,0.6) 100%)',
            }}
          />
        </div>
      )}

      {/* WordPress block content — styled via .post-body in globals.css */}
      <div className="post-body">
        {sanitized ? parse(sanitized, parseOptions) : null}
      </div>
      {/* Load scripts for social embeds — detects Twitter/X, TikTok, Instagram in raw content */}
      <SocialScriptLoader content={rawContent} />

      {/* Taxonomy metadata — posts only */}
      {isPost && (categories.length > 0 || tags.length > 0 || Object.keys(otherGroups).length > 0) && (
        <div className="mt-10 pt-6 border-t border-brand-border space-y-3">
          {Object.entries(otherGroups).map(([taxonomy, terms]) => (
            <div key={taxonomy} className="flex flex-wrap gap-2 items-center">
              <span className="font-mono text-xs uppercase tracking-widest text-brand-muted w-24 shrink-0">
                {taxonomy.replace(/_/g, ' ')}
              </span>
              {terms.map(t => (
                <Link
                  key={t.id}
                  href={`/${taxonomy}/${t.slug}`}
                  className="no-underline font-heading text-sm text-brand-cyan hover:text-brand-magenta transition-colors"
                >
                  {decodeHtmlEntities(t.name)}
                </Link>
              ))}
            </div>
          ))}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="font-mono text-xs uppercase tracking-widest text-brand-muted w-24 shrink-0">
                {categories.length === 1 ? 'Category' : 'Categories'}
              </span>
              {categories.map(t => (
                <Link
                  key={t.id}
                  href={`/category/${t.slug}`}
                  className="no-underline font-heading text-sm bg-brand-surface-high border border-brand-border text-brand-text-sub hover:text-brand-cyan hover:border-brand-cyan transition-colors px-2 py-0.5 rounded"
                >
                  {decodeHtmlEntities(t.name)}
                </Link>
              ))}
            </div>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="font-mono text-xs uppercase tracking-widest text-brand-muted w-24 shrink-0">
                Tags
              </span>
              {tags.map(t => (
                <Link
                  key={t.id}
                  href={`/tag/${t.slug}`}
                  className="no-underline font-heading text-sm bg-brand-surface-high border border-brand-border text-brand-text-sub hover:text-brand-cyan hover:border-brand-cyan transition-colors px-2 py-0.5 rounded"
                >
                  {decodeHtmlEntities(t.name)}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
