import Image from 'next/image';
import Link from 'next/link';
import { fetchMenuItems, fetchPostsWithPagination } from '@/lib/wordpress/client';
import Navigation from '@/components/Navigation';
import Pagination from '@/components/Pagination';
import Footer from '@/components/Footer';
import { Greeting } from '@/components/Greeting';
import { getBuildInfo } from '@/lib/build-info';
import type { WPPost } from '@/lib/wordpress/types';

interface HomePageProps {
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
      perPage: 10,
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
        <Greeting />

        <div className="text-xs text-gray-500 mb-6 font-mono">
          Build: {new Date(buildInfoData.buildTime).toLocaleString('en-US', { timeZone: 'America/Denver' })} MT • Commit: {buildInfoData.commitShort}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {posts.map(post => {
                const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
                const hasImage = post.featured_media > 0 && featuredMedia;
                const imageUrl = featuredMedia?.source_url;
                const imageAlt = featuredMedia?.alt_text || post.title.rendered;
                const excerpt = post.excerpt.rendered.replace(/<[^>]*>/g, '');
                const date = new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });

                return (
                  <article
                    key={post.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {hasImage && imageUrl && (
                      <div className="relative w-full h-64">
                        <Image
                          src={imageUrl}
                          alt={imageAlt}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h2 className="text-xl font-semibold mb-2">
                        <Link
                          href={`/posts/${post.slug}`}
                          className="text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {post.title.rendered}
                        </Link>
                      </h2>
                      <time className="text-sm text-gray-500 block mb-3">
                        {date}
                      </time>
                      <p className="text-gray-700 mb-4 line-clamp-3">
                        {excerpt}
                      </p>
                      <Link
                        href={`/posts/${post.slug}`}
                        className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                      >
                        Read more
                        <svg
                          className="w-4 h-4 ml-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            <Pagination currentPage={page} totalPages={totalPages} basePath="/" />
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
