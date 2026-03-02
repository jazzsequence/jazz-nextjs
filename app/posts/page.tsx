import { fetchPosts } from '@/lib/wordpress/client';
import type { WPPost } from '@/lib/wordpress/types';
import PostsList from '@/components/PostsList';

export const revalidate = 3600; // ISR: Revalidate every hour

export default async function PostsPage() {
  try {
    const posts = await fetchPosts<WPPost>('posts', {
      isr: { revalidate: 3600 },
    });

    if (posts.length === 0) {
      return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8">Posts</h1>
          <p className="text-gray-600">No posts found.</p>
        </div>
      );
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Posts</h1>
        <PostsList posts={posts} />
      </div>
    );
  } catch {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Posts</h1>
        <p className="text-red-600">
          Unable to load posts. Please try again later.
        </p>
      </div>
    );
  }
}
