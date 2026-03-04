'use client';

import { useEffect, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { fetchGreetingData, type GreetingVariant } from '@/lib/wordpress/greeting';
import { matchAudiences } from '@/lib/audience-matcher';

export function Greeting() {
  const [variant, setVariant] = useState<GreetingVariant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadGreeting() {
      try {
        const { variants, audiences } = await fetchGreetingData();

        if (variants.length === 0) {
          // No variants available, create a default fallback
          setVariant({
            audienceId: null,
            isFallback: true,
            heading: "Hi, I'm Chris",
            content: '<p>Welcome to my website.</p>',
          });
          setIsLoading(false);
          return;
        }

        // Match audiences based on current time/day metrics
        // Uses actual Altis audience configurations with rules
        const matchedIds = matchAudiences(audiences);

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
      } catch (error) {
        console.error('Failed to fetch greeting:', error);
        // Show fallback on error
        setVariant({
          audienceId: null,
          isFallback: true,
          heading: "Hi, I'm Chris",
          content: '<p>Welcome to my website.</p>',
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadGreeting();
  }, []);

  if (isLoading || !variant) {
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
