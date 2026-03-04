import DOMPurify from 'isomorphic-dompurify';
import { fetchGreetingData } from '@/lib/wordpress/greeting';
import { matchAudiences } from '@/lib/audience-matcher';

export async function Greeting() {
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
      // Match audiences based on current time/day metrics
      // Uses actual Altis audience configurations with rules
      const matchedIds = matchAudiences(audiences);

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
