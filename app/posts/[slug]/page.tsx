import { fetchPost, fetchMenuItems, WPNotFoundError } from '@/lib/wordpress/client';
import type { WPPost } from '@/lib/wordpress/types';
import PostContent from '@/components/PostContent';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  try {
    const [post, menuItems] = await Promise.allSettled([
      fetchPost<WPPost>('posts', slug, {
        isr: { revalidate: 3600, tags: ['posts', `post-${slug}`] },
        embed: true,
      }),
      fetchMenuItems(1698, {
        isr: { revalidate: 3600, tags: ['menu', 'header'] },
      }),
    ]);

    if (post.status === 'rejected') {
      const error = post.reason;
      if (error instanceof WPNotFoundError) notFound();
      throw error;
    }

    const menuItemsData = menuItems.status === 'fulfilled' ? menuItems.value : undefined;
    const menuError = menuItems.status === 'rejected' ? 'Failed to fetch menu items' : undefined;

    return (
      <>
        <Navigation menuItems={menuItemsData} error={menuError} />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <PostContent post={post.value} />
        </main>
        <Footer />
      </>
    );
  } catch (error) {
    if (error instanceof WPNotFoundError) notFound();

    const [menuItems] = await Promise.allSettled([
      fetchMenuItems(1698, { isr: { revalidate: 3600, tags: ['menu', 'header'] } }),
    ]);

    const menuItemsData = menuItems.status === 'fulfilled' ? menuItems.value : undefined;
    const menuError = menuItems.status === 'rejected' ? 'Failed to fetch menu items' : undefined;

    return (
      <>
        <Navigation menuItems={menuItemsData} error={menuError} />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-brand-magenta font-heading">
            Unable to load post. Please try again later.
          </p>
        </main>
        <Footer />
      </>
    );
  }
}
