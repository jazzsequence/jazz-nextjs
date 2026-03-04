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

  // Sanitize content HTML
  const sanitizedContent = post.content.rendered
    ? parse(DOMPurify.sanitize(post.content.rendered))
    : '';

  // Format date
  const formattedDate = format(new Date(post.date), 'MMMM d, yyyy');

  return (
    <article className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {post.title.rendered}
        </h1>
        <time className="text-gray-600" dateTime={post.date}>
          {formattedDate}
        </time>
      </header>

      {hasImage && (
        <div className="relative w-full h-96 mb-8">
          <Image
            src={featuredMedia.source_url}
            alt={featuredMedia.alt_text || post.title.rendered}
            fill
            className="object-cover rounded-lg"
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
          />
        </div>
      )}

      <div className="prose prose-lg max-w-none">
        {sanitizedContent}
      </div>
    </article>
  );
}
