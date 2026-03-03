import { fetchPost, fetchMenuItems, WPNotFoundError } from '@/lib/wordpress/client';
import type { WPPost } from '@/lib/wordpress/types';
import PostContent from '@/components/PostContent';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getBuildInfo } from '@/lib/build-info';
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
    // Fetch post, menu items, and build info in parallel
    const [post, menuItems, buildInfo] = await Promise.allSettled([
      fetchPost<WPPost>('posts', slug, {
        isr: { revalidate: 3600, tags: ['posts', `post-${slug}`] },
      }),
      fetchMenuItems(1698, {
        isr: { revalidate: 3600, tags: ['menu', 'header'] },
      }),
      getBuildInfo(),
    ]);

    if (post.status === 'rejected') {
      const error = post.reason;
      if (error instanceof WPNotFoundError) {
        notFound();
      }
      throw error;
    }

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
          <div className="text-xs text-gray-500 mb-6 font-mono">
            Build: {new Date(buildInfoData.buildTime).toLocaleString()} • Commit: {buildInfoData.commitShort}
          </div>

          <PostContent post={post.value} />
        </main>

        <Footer />
      </>
    );
  } catch (error) {
    if (error instanceof WPNotFoundError) {
      notFound();
    }

    const [menuItems] = await Promise.allSettled([
      fetchMenuItems(1698, {
        isr: { revalidate: 3600, tags: ['menu', 'header'] },
      }),
    ]);

    const menuItemsData =
      menuItems.status === 'fulfilled' ? menuItems.value : undefined;
    const menuError =
      menuItems.status === 'rejected' ? 'Failed to fetch menu items' : undefined;

    return (
      <>
        <Navigation menuItems={menuItemsData} error={menuError} />
        <main className="container mx-auto px-4 py-8">
          <p className="text-red-600">
            Unable to load post. Please try again later.
          </p>
        </main>
        <Footer />
      </>
    );
  }
}
