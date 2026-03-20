import Image from 'next/image';
import { format } from 'date-fns';
import parse from 'html-react-parser';
import DOMPurify from 'isomorphic-dompurify';
import type { WPContent } from '@/lib/wordpress/types';

interface PostContentProps {
  post: WPContent;
}

export default function PostContent({ post }: PostContentProps) {
  const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
  const hasImage = post.featured_media > 0 && featuredMedia;

  const sanitizedContent = post.content.rendered
    ? parse(DOMPurify.sanitize(post.content.rendered))
    : '';

  const formattedDate = format(new Date(post.date), 'MMMM d, yyyy');

  return (
    <article>
      <header className="mb-8">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-brand-text leading-tight mb-3">
          {post.title.rendered}
        </h1>
        <time
          className="font-mono text-brand-muted text-sm uppercase tracking-widest"
          dateTime={post.date}
        >
          {formattedDate}
        </time>
      </header>

      {hasImage && (
        <div className="relative w-full rounded-xl overflow-hidden mb-10" style={{ height: '28rem' }}>
          {/* Featured image */}
          <Image
            src={featuredMedia.source_url}
            alt={featuredMedia.alt_text || post.title.rendered}
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
        {sanitizedContent}
      </div>
    </article>
  );
}
