import { fetchMenuItems, fetchPostsWithPagination } from '@/lib/wordpress/client';
import type { WPPost } from '@/lib/wordpress/types';
import PostsList from '@/components/PostsList';
import Navigation from '@/components/Navigation';
import Pagination from '@/components/Pagination';
import Footer from '@/components/Footer';
import { getBuildInfo } from '@/lib/build-info';

export const revalidate = 3600; // ISR: Revalidate every hour

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

  // Fetch posts, menu items, and build info in parallel
  const [postsData, menuItems, buildInfo] = await Promise.allSettled([
    fetchPostsData(page),
    fetchMenuItems(1698, {
      isr: { revalidate: 3600, tags: ['menu', 'header'] },
    }),
    getBuildInfo(),
  ]);

  const { posts, totalPages, error: postsError } =
    postsData.status === 'fulfilled'
      ? postsData.value
      : { posts: [], totalPages: 0, error: 'Failed to load posts' };

  const menuItemsData =
    menuItems.status === 'fulfilled' ? menuItems.value : undefined;
  const menuError =
    menuItems.status === 'rejected' ? 'Failed to fetch menu items' : undefined;

  const buildInfoData =
    buildInfo.status === 'fulfilled'
      ? buildInfo.value
      : { commitShort: 'unknown', buildTime: new Date().toISOString() };

  return (
    <>
      <Navigation menuItems={menuItemsData} error={menuError} />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Posts</h1>

        <div className="text-xs text-gray-500 mb-6 font-mono">
          Build: {new Date(buildInfoData.buildTime).toLocaleString()} • Commit: {buildInfoData.commitShort}
        </div>

        {postsError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6 text-red-800">
            {postsError}
          </div>
        )}

        {!postsError && posts.length === 0 && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
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
