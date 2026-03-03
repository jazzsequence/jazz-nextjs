import { NextResponse } from 'next/server';
import { fetchPostsWithPagination } from '@/lib/wordpress/client';
import type { WPPost } from '@/lib/wordpress/types';

export async function GET() {
  try {
    const result = await fetchPostsWithPagination<WPPost>('posts', {
      page: 1,
      perPage: 3,
      embed: true,
    });

    // Extract debug info from first post
    const debugInfo = result.data.map(post => ({
      id: post.id,
      title: post.title.rendered,
      featured_media: post.featured_media,
      has_embedded: !!post._embedded,
      embedded_keys: post._embedded ? Object.keys(post._embedded) : [],
      has_featured_media_embedded: !!post._embedded?.['wp:featuredmedia'],
      featured_media_count: post._embedded?.['wp:featuredmedia']?.length || 0,
      featured_media_url: post._embedded?.['wp:featuredmedia']?.[0]?.source_url,
      featured_media_id: post._embedded?.['wp:featuredmedia']?.[0]?.id,
    }));

    return NextResponse.json({
      success: true,
      count: result.data.length,
      totalItems: result.totalItems,
      posts: debugInfo,
      raw_first_post: result.data[0],
    }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}
