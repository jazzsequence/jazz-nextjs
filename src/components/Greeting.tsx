import { headers } from 'next/headers';
import DOMPurify from 'isomorphic-dompurify';
import { fetchGreetingData } from '@/lib/wordpress/greeting';
import { matchAudiences, type EndpointData } from '@/lib/audience-matcher';

interface GreetingProps {
  searchParams?: Promise<{ greeting?: string }>;
}

export async function Greeting({ searchParams }: GreetingProps = {}) {
  let variant;

  try {
    const { variants, audiences } = await fetchGreetingData();

    if (variants.length === 0) {
      // No variants available, create a default fallback
      variant = {
        audienceId: null,
        isFallback: true,
        heading: "Hi, I'm Chris",
        content: '<p>Welcome to my website.</p>',
      };
    } else {
      // Check for ?greeting= query parameter (for E2E testing)
      const params = searchParams ? await searchParams : undefined;
      const greetingParam = params?.greeting;

      let matchedIds: number[];

      if (greetingParam && process.env.NODE_ENV !== 'production') {
        // E2E testing mode: Force specific greeting variant
        // Accepts audience ID (e.g., "16719") or named variant ("morning", "afternoon", "evening", "dnd", "china", "fallback")
        const namedVariants: Record<string, number | null> = {
          morning: 16719,
          afternoon: 16720,
          evening: 16722,
          dnd: 16726,
          china: 16377,
          fallback: null,
        };

        const audienceId = namedVariants[greetingParam.toLowerCase()] ?? parseInt(greetingParam, 10);
        matchedIds = isNaN(audienceId as number) ? [] : [audienceId as number];
      } else {
        // Normal mode: Match based on time/day and geo-location
        // Extract geo-location and timezone data from headers
        const headersList = await headers();
        const endpoints: EndpointData = {
          country: headersList.get('cf-ipcountry') || // Cloudflare
                   headersList.get('x-vercel-ip-country') || // Vercel
                   headersList.get('cloudfront-viewer-country') || // AWS CloudFront
                   headersList.get('x-country-code') || // Generic
                   undefined,
          timezone: headersList.get('cf-timezone') || // Cloudflare
                    headersList.get('x-vercel-ip-timezone') || // Vercel
                    undefined,
        };

        // Debug logging (temporary)
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Greeting Debug]', {
            country: endpoints.country,
            timezone: endpoints.timezone,
            serverTime: new Date().toISOString(),
            cfTimezone: headersList.get('cf-timezone'),
            vercelTimezone: headersList.get('x-vercel-ip-timezone'),
            // Guard entries() for test compatibility
            allHeaders: 'entries' in headersList
              ? Array.from(headersList.entries()).filter(([key]) =>
                  key.startsWith('cf-') || key.startsWith('x-vercel-') || key.startsWith('cloudfront-')
                )
              : [],
          });
        }

        // Match audiences based on current time/day metrics and geo-location
        // Uses actual Altis audience configurations with rules (in user's timezone)
        matchedIds = matchAudiences(audiences, endpoints);
      }

      // Select variant: first matching audience, or fallback
      let selectedVariant = undefined;

      if (matchedIds.length > 0) {
        // Use first matching audience
        selectedVariant = variants.find((v) => v.audienceId === matchedIds[0]);
      }

      // Fall back to fallback variant if no match
      if (!selectedVariant) {
        selectedVariant = variants.find((v) => v.isFallback);
      }

      // Ultimate fallback if nothing found
      if (!selectedVariant) {
        selectedVariant = variants[0];
      }

      variant = selectedVariant;
    }
  } catch (error) {
    console.error('Failed to fetch greeting:', error);
    // Show fallback on error
    variant = {
      audienceId: null,
      isFallback: true,
      heading: "Hi, I'm Chris",
      content: '<p>Welcome to my website.</p>',
    };
  }

  // Sanitize HTML content to prevent XSS
  const sanitizedContent = DOMPurify.sanitize(variant.content);

  return (
    <section>
      <h1>{variant.heading}</h1>
      <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
    </section>
  );
}
