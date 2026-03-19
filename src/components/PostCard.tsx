import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import DOMPurify from 'isomorphic-dompurify';
import type { WPPost } from '@/lib/wordpress/types';

interface PostCardProps {
  post: WPPost;
}

export default function PostCard({ post }: PostCardProps) {
  const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
  const hasImage = post.featured_media > 0 && featuredMedia;
  const formattedDate = format(new Date(post.date), 'MMMM d, yyyy');

  const sanitizedExcerpt = post.excerpt.rendered
    ? DOMPurify.sanitize(post.excerpt.rendered, { ALLOWED_TAGS: [] }).trim()
    : '';

  return (
    <article className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden group transition-colors hover:border-brand-border-bright">

      {/* Image area with gradient overlay */}
      <Link href={`/posts/${post.slug}`} className="block relative h-48 overflow-hidden no-underline">
        {hasImage ? (
          <Image
            src={featuredMedia.source_url}
            alt={featuredMedia.alt_text || post.title.rendered}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #1c1c3a 0%, #0d1a2e 100%)' }}
          />
        )}

        {/* Dark gradient fade — always present for text legibility */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(13,13,26,0.7) 70%, #13132b 100%)' }}
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

        {/* Eyebrow date overlaid at bottom of image */}
        <div className="absolute bottom-3 left-4">
          <time className="font-mono text-brand-cyan text-xs uppercase tracking-widest">
            {formattedDate}
          </time>
        </div>
      </Link>

      {/* Card body */}
      <div className="p-5">
        <h2 className="font-heading font-bold text-brand-text text-lg leading-snug mb-3">
          <Link
            href={`/posts/${post.slug}`}
            className="hover:text-brand-cyan transition-colors no-underline"
          >
            {post.title.rendered}
          </Link>
        </h2>

        {sanitizedExcerpt && (
          <p className="text-brand-text-sub text-sm leading-relaxed mb-4 line-clamp-3">
            {sanitizedExcerpt}
          </p>
        )}

        <Link
          href={`/posts/${post.slug}`}
          className="text-brand-cyan text-sm font-medium hover:text-brand-magenta transition-colors no-underline"
        >
          Read more →
        </Link>
      </div>
    </article>
  );
}
