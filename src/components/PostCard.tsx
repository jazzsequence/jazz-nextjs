import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import parse from 'html-react-parser';
import DOMPurify from 'isomorphic-dompurify';
import type { WPPost } from '@/lib/wordpress/types';

interface PostCardProps {
  post: WPPost;
}

export default function PostCard({ post }: PostCardProps) {
  const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
  const hasImage = post.featured_media > 0 && featuredMedia;

  // Sanitize excerpt HTML
  const sanitizedExcerpt = post.excerpt.rendered
    ? parse(DOMPurify.sanitize(post.excerpt.rendered))
    : '';

  // Format date
  const formattedDate = format(new Date(post.date), 'MMMM d, yyyy');

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {hasImage && (
        <Link href={`/posts/${post.slug}`}>
          <div className="relative w-full h-48">
            <Image
              src={featuredMedia.source_url}
              alt={featuredMedia.alt_text || post.title.rendered}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </Link>
      )}
      <div className="p-6">
        <Link href={`/posts/${post.slug}`}>
          <h2 className="text-2xl font-bold mb-2 hover:text-blue-600 transition-colors">
            {post.title.rendered}
          </h2>
        </Link>
        <time className="text-sm text-gray-500 mb-3 block">
          {formattedDate}
        </time>
        {sanitizedExcerpt && (
          <div className="text-gray-700 prose prose-sm max-w-none">
            {sanitizedExcerpt}
          </div>
        )}
      </div>
    </article>
  );
}
