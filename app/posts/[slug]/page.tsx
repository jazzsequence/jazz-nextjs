import { fetchPost, WPNotFoundError } from '@/lib/wordpress/client';
import type { WPPost } from '@/lib/wordpress/types';
import PostContent from '@/components/PostContent';
import { notFound } from 'next/navigation';

export const revalidate = 3600; // ISR: Revalidate every hour

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  try {
    const post = await fetchPost<WPPost>('posts', slug, {
      isr: { revalidate: 3600 },
    });

    return <PostContent post={post} />;
  } catch (error) {
    if (error instanceof WPNotFoundError) {
      notFound();
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-600">
          Unable to load post. Please try again later.
        </p>
      </div>
    );
  }
}
