import type { Metadata } from 'next';
import { fetchPost, fetchMenuItems, WPNotFoundError, WPForbiddenError } from '@/lib/wordpress/client';
import type { WPPost } from '@/lib/wordpress/types';
import { decodeHtmlEntities, excerptToDescription } from '@/lib/utils/html';
import PostContent from '@/components/PostContent';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { notFound, forbidden } from 'next/navigation';

export const revalidate = 3600;

// Empty array registers this route in prerenderManifest.dynamicRoutes so
// Next.js treats it as ISR (isSSG=true) and sends s-maxage Cache-Control
// headers. Pages are still generated on-demand — nothing is pre-built.
export async function generateStaticParams() {
  return []
}

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await fetchPost<WPPost>('posts', slug, {
      embed: true,
      isr: { revalidate: 3600, tags: ['posts'] },
    });
    const title = decodeHtmlEntities(post.title.rendered);
    const description = excerptToDescription(post.excerpt?.rendered);
    const featuredImage = post._embedded?.['wp:featuredmedia']?.[0];

    return {
      title,
      description,
      alternates: { canonical: `/posts/${slug}` },
      openGraph: {
        type: 'article',
        title,
        description,
        url: `/posts/${slug}`,
        publishedTime: post.date_gmt,
        modifiedTime: post.modified_gmt,
        images: featuredImage
          ? [{ url: featuredImage.source_url, alt: featuredImage.alt_text }]
          : [{ url: '/opengraph-image', alt: 'jazzsequence.com' }],
      },
    };
  } catch {
    return { title: 'Post Not Found' };
  }
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
      if (error instanceof WPForbiddenError) forbidden();
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
    if (error instanceof WPForbiddenError) forbidden();
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
