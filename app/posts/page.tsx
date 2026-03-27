import type { Metadata } from 'next';
import { fetchMenuItems, fetchPostsWithPagination } from '@/lib/wordpress/client';
import type { WPPost } from '@/lib/wordpress/types';
import PostsList from '@/components/PostsList';
import Navigation from '@/components/Navigation';
import Pagination from '@/components/Pagination';
import Footer from '@/components/Footer';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Posts',
  description: 'Writing by Chris Reynolds — development, music, games, and life.',
  alternates: { canonical: '/posts' },
};

interface PostsPageProps {
  searchParams: Promise<{ page?: string }>;
}

interface PostsData {
  posts: WPPost[];
  totalPages: number;
  error?: string;
}

async function fetchPostsData(page: number): Promise<PostsData> {
  try {
    const result = await fetchPostsWithPagination<WPPost>('posts', {
      page,
      perPage: 12,
      embed: true,
      isr: {
        revalidate: 3600,
        tags: ['posts'],
      },
    });

    return {
      posts: result.data,
      totalPages: result.totalPages,
    };
  } catch {
    return {
      posts: [],
      totalPages: 0,
      error: 'Failed to load posts',
    };
  }
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  const page = Number(params?.page) || 1;

  const [postsData, menuItems] = await Promise.allSettled([
    fetchPostsData(page),
    fetchMenuItems(1698, {
      isr: { revalidate: 3600, tags: ['menu', 'header'] },
    }),
  ]);

  const { posts, totalPages, error: postsError } =
    postsData.status === 'fulfilled'
      ? postsData.value
      : { posts: [], totalPages: 0, error: 'Failed to load posts' };

  const menuItemsData = menuItems.status === 'fulfilled' ? menuItems.value : undefined;
  const menuError = menuItems.status === 'rejected' ? 'Failed to fetch menu items' : undefined;

  return (
    <>
      <Navigation menuItems={menuItemsData} error={menuError} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading text-4xl font-bold text-brand-text mb-8">Posts</h1>

        {postsError && (
          <div className="p-4 bg-brand-surface border border-brand-border rounded-lg mb-6 text-brand-magenta">
            {postsError}
          </div>
        )}

        {!postsError && posts.length === 0 && (
          <div className="p-4 bg-brand-surface border border-brand-border rounded-lg text-brand-muted">
            No posts found.
          </div>
        )}

        {!postsError && posts.length > 0 && (
          <>
            <PostsList posts={posts} />
            <Pagination currentPage={page} totalPages={totalPages} basePath="/posts" />
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
