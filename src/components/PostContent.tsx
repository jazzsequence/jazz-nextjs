import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import parse from 'html-react-parser';
import DOMPurify from 'isomorphic-dompurify';
import { decodeHtmlEntities } from '@/lib/utils/html';
import type { WPContent, WPTerm } from '@/lib/wordpress/types';

interface PostContentProps {
  post: WPContent;
}

// Rewrite absolute jazzsequence.com URLs to relative internal routes so
// WordPress-generated links work within this Next.js app.
function rewriteInternalLinks(html: string): string {
  return html
    .replace(/https?:\/\/jazzsequence\.com\//g, '/')
    .replace(/https?:\/\/jazzsequence\.com"/g, '/"')
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

  const sanitized = post.content.rendered
    ? rewriteInternalLinks(DOMPurify.sanitize(post.content.rendered))
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
          {/* Featured image */}
          <Image
            src={featuredMedia.source_url}
            alt={featuredMedia.alt_text || decodeHtmlEntities(post.title.rendered)}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
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
        {sanitized ? parse(sanitized) : null}
      </div>

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
                  {t.name}
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
                  {t.name}
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
                  {t.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
