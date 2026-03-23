import Link from 'next/link';
import { format } from 'date-fns';
import parse, { domToReact } from 'html-react-parser';
import type { HTMLReactParserOptions, Element } from 'html-react-parser';
import type { DOMNode } from 'html-react-parser';
import DOMPurify from 'isomorphic-dompurify';
import { decodeHtmlEntities, normalizeWordPressUrl, stripWordPressSize } from '@/lib/utils/html';
import FeaturedImage from './FeaturedImage';
import GalleryLightbox from './GalleryLightbox';
import type { GalleryImage } from './GalleryLightbox';
import TwitterScriptLoader from './TwitterScriptLoader';
import type { WPContent, WPTerm } from '@/lib/wordpress/types';

interface PostContentProps {
  post: WPContent;
}

/**
 * Rewrite absolute jazzsequence.com post/page URLs to relative routes.
 * Deliberately does NOT rewrite /wp-content/ paths — those are image URLs
 * that need to remain absolute (served from jazzsequence.com or CDN).
 * Rewriting them to relative paths breaks images because those paths
 * don't exist on this Next.js app.
 */
function rewriteInternalLinks(html: string): string {
  return html
    // Normalize double slashes in wp-content paths (WordPress storage quirk)
    .replace(/(https?:\/\/[^"'\s]+\/wp-content\/uploads)\/\//g, '$1/')
    // Rewrite post/page links (excluding /wp-content/) to relative paths
    .replace(/https?:\/\/jazzsequence\.com\/(?!wp-content\/)/g, '/')
    // Handle bare domain in href attributes (e.g. href="https://jazzsequence.com")
    .replace(/https?:\/\/jazzsequence\.com"/g, '/"')
}

/** Walk the parsed DOM to extract <img> elements from a wp-block-gallery figure. */
function extractGalleryImages(node: Element): GalleryImage[] {
  const images: GalleryImage[] = []

  const walk = (nodes: DOMNode[]) => {
    for (const n of nodes) {
      if (n.type !== 'tag') continue
      const el = n as Element

      if (el.name === 'img' && el.attribs?.src) {
        const src = el.attribs.src

        // Prefer largest entry from srcset for the lightbox full view
        let full = src
        const srcset = el.attribs?.srcset
        if (srcset) {
          const largest = srcset
            .split(',')
            .map(s => { const [u, w] = s.trim().split(/\s+/); return { url: u, w: parseInt(w) || 0 } })
            .sort((a, b) => b.w - a.w)[0]
          if (largest?.url) full = largest.url
        } else {
          // No srcset — strip the WordPress size suffix to get the original
          full = stripWordPressSize(src)
        }

        // Caption: look for .wp-element-caption sibling (nearest parent figure's caption)
        let caption: string | undefined
        // Note: caption extraction from nested figcaption would require more complex traversal;
        // skip for now and leave undefined (caption is optional in GalleryImage)

        images.push({ src, full, alt: el.attribs?.alt || '', caption })
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

    // Replace wp-block-gallery figures with interactive lightbox
    if (el.name === 'figure' && cls.includes('wp-block-gallery')) {
      const images = extractGalleryImages(el)
      if (images.length > 0) {
        return <GalleryLightbox images={images} />
      }
    }

    // Twitter/X embeds: rebuild the figure structure so the blockquote renders correctly.
    // TwitterScriptLoader is handled at the component level via hasTwitterEmbeds — no need
    // to render it here too.
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

  // Classic-editor posts embed tweets as bare blockquote.twitter-tweet without a
  // figure.wp-block-embed-twitter wrapper. The parseOptions handler only fires for
  // the Gutenberg block format, so we need a top-level check to load widgets.js
  // for classic-editor posts too.
  const hasTwitterEmbeds = post.content.rendered.includes('twitter-tweet')

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
      {/* Load Twitter widget script for both classic-editor and Gutenberg block embeds */}
      {hasTwitterEmbeds && <TwitterScriptLoader />}

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
