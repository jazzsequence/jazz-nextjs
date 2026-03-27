import { fetchMenuItems, fetchPostsWithPagination } from '@/lib/wordpress/client';
import Navigation from '@/components/Navigation';
import Pagination from '@/components/Pagination';
import Footer from '@/components/Footer';
import PostsList from '@/components/PostsList';
import { Greeting } from '@/components/Greeting';
import type { WPPost } from '@/lib/wordpress/types';

interface HomePageProps {
  searchParams: Promise<{ page?: string; greeting?: string }>;
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
        tags: ['homepage', 'posts'],
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

export default async function HomePage({ searchParams }: HomePageProps) {
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
        {/* min-height reserves space for the greeting so the grid below doesn't shift
            when the client component resolves the correct variant. The greeting with
            py-12 padding + h1 + p runs ~220px; 200px is a stable floor. */}
        <div className="min-h-[200px]">
          <Greeting searchParams={searchParams} />
        </div>

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
            <Pagination currentPage={page} totalPages={totalPages} basePath="/" />
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
