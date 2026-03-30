import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import DOMPurify from 'isomorphic-dompurify';
import { decodeHtmlEntities, normalizeWordPressUrl } from '@/lib/utils/html';
import type { WPPost } from '@/lib/wordpress/types';

interface PostCardProps {
  post: WPPost;
  /** Preload this card's image — set true for above-the-fold cards to prevent CLS */
  priority?: boolean;
  /** Override the excerpt with custom content (e.g. highlighted search result text) */
  excerptContent?: React.ReactNode;
}

export default function PostCard({ post, priority = false, excerptContent }: PostCardProps) {
  const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
  const hasImage = post.featured_media > 0 && featuredMedia;
  const formattedDate = format(new Date(post.date), 'MMMM d, yyyy');

  const sanitizedExcerpt = post.excerpt.rendered
    ? DOMPurify.sanitize(post.excerpt.rendered, { ALLOWED_TAGS: [] }).trim()
    : '';

  return (
    <article className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden group transition-colors hover:border-brand-border-bright">

      {/* Image area — eyebrow + title overlaid at the bottom */}
      <Link href={`/posts/${post.slug}`} className="block relative h-56 overflow-hidden no-underline">
        {hasImage ? (
          <Image
            src={normalizeWordPressUrl(featuredMedia.source_url)}
            alt={featuredMedia.alt_text || decodeHtmlEntities(post.title.rendered)}
            fill
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) calc(100vw - 32px), (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          // Retrowave image placeholder — matches style guide Image Overlay section (#2d0b4e → #0b2d4e → #1a0d2e)
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #2d0b4e 0%, #0b2d4e 50%, #1a0d2e 100%)' }}
          />
        )}

        {/* Retrowave color tint on real images — same gradient, semi-transparent */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(45,11,78,0.5) 0%, rgba(11,45,78,0.45) 50%, rgba(26,13,46,0.45) 100%)',
          }}
        />

        {/* Dark fade at bottom for text legibility */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 30%, rgba(13,13,26,0.75) 75%, #13132b 100%)',
          }}
        />

        {/* Retrowave grid overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#2a2a4a44 1px, transparent 1px), linear-gradient(90deg, #2a2a4a44 1px, transparent 1px)',
            backgroundSize: '1.5rem 1.5rem',
          }}
        />

        {/* Date eyebrow + title overlaid at bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <time className="font-mono text-brand-cyan text-xs uppercase tracking-widest block mb-1">
            {formattedDate}
          </time>
          <h2 className="font-heading font-bold text-brand-text text-lg leading-snug">
            {decodeHtmlEntities(post.title.rendered)}
          </h2>
        </div>
      </Link>

      {/* Card body — excerpt and read more */}
      <div className="p-4">
        {(excerptContent ?? (sanitizedExcerpt || null)) && (
          <p className="text-brand-text-sub text-sm leading-relaxed mb-3 line-clamp-3">
            {excerptContent ?? sanitizedExcerpt}
          </p>
        )}
        <Link
          href={`/posts/${post.slug}`}
          className="font-heading text-brand-cyan text-sm font-medium hover:text-brand-magenta transition-colors no-underline"
        >
          Read more →
        </Link>
      </div>
    </article>
  );
}
