import PostCard from './PostCard';
import type { WPPost } from '@/lib/wordpress/types';

interface PostsListProps {
  posts: WPPost[];
}

export default function PostsList({ posts }: PostsListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
