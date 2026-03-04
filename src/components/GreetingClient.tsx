'use client';

import { useEffect, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { matchAudiences, type Audience, type EndpointData } from '@/lib/audience-matcher';

interface GreetingVariant {
  audienceId: number | null;
  isFallback: boolean;
  heading: string;
  content: string;
}

interface GreetingClientProps {
  variants: GreetingVariant[];
  audiences: Audience[];
  serverCountry?: string;
  greetingParam?: string;
}

export function GreetingClient({ variants, audiences, serverCountry, greetingParam }: GreetingClientProps) {
  const [variant, setVariant] = useState<GreetingVariant | null>(null);

  useEffect(() => {
    // If no variants, show default fallback
    if (variants.length === 0) {
      setVariant({
        audienceId: null,
        isFallback: true,
        heading: "Hi, I'm Chris",
        content: '<p>Welcome to my website.</p>',
      });
      return;
    }

    let matchedIds: number[];

    // Check for ?greeting= query parameter (for E2E testing)
    // Allow in all environments so E2E tests work against production builds
    if (greetingParam) {
      // E2E testing mode: Force specific greeting variant
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
      // Normal mode: Match based on time/day using BROWSER timezone
      // Get browser's timezone
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const now = new Date();

      // DEBUG: Temporary logging to diagnose timezone issue
      console.log('[GreetingClient DEBUG]', {
        browserTimezone,
        currentTime: now.toLocaleString(),
        currentHour: now.getHours(),
        serverCountry,
        audienceCount: audiences.length,
        variantCount: variants.length,
      });

      // Match audiences based on browser timezone and server-detected country
      const endpoints: EndpointData = {
        country: serverCountry,
        timezone: browserTimezone, // Use browser timezone, not server
      };

      matchedIds = matchAudiences(audiences, endpoints);

      // DEBUG: Log matching results
      console.log('[GreetingClient DEBUG] Matched IDs:', matchedIds);
      console.log('[GreetingClient DEBUG] Variants:', variants.map(v => ({ id: v.audienceId, heading: v.heading })));
    }

    // Select variant: first matching audience, or fallback
    let selectedVariant: GreetingVariant | undefined;

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

    setVariant(selectedVariant);
  }, [variants, audiences, serverCountry, greetingParam]);

  // Show nothing until client-side matching completes (prevents flash)
  if (!variant) {
    return null;
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
