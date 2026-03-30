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
  /** Forward-compat: allows SSR country injection if needed in future.
   *  Currently always undefined — Greeting.tsx omits it so the homepage
   *  stays edge-cacheable. Country is fetched client-side via /api/country. */
  serverCountry?: string;
  greetingParam?: string;
}

function selectVariant(
  variants: GreetingVariant[],
  audiences: Audience[],
  country: string | undefined,
  greetingParam: string | undefined
): GreetingVariant {
  if (variants.length === 0) {
    return { audienceId: null, isFallback: true, heading: "Hi, I'm Chris", content: '<p>Welcome to my website.</p>' };
  }

  let matchedIds: number[];

  if (greetingParam) {
    const namedVariants: Record<string, number | null> = {
      morning: 16719, afternoon: 16720, evening: 16722, dnd: 16726, china: 16377, fallback: null,
    };
    const audienceId = namedVariants[greetingParam.toLowerCase()] ?? parseInt(greetingParam, 10);
    matchedIds = isNaN(audienceId as number) ? [] : [audienceId as number];
  } else {
    const endpoints: EndpointData = {
      country,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    matchedIds = matchAudiences(audiences, endpoints);
  }

  return (
    (matchedIds.length > 0 ? variants.find((v) => v.audienceId === matchedIds[0]) : undefined) ??
    variants.find((v) => v.isFallback) ??
    variants[0]
  );
}

export function GreetingClient({ variants, audiences, serverCountry, greetingParam: greetingParamProp }: GreetingClientProps) {
  const [variant, setVariant] = useState<GreetingVariant | null>(null);

  // Pass 1: match without country (runs immediately, enables edge caching on the page).
  // greetingParam comes from the prop (tests/Storybook) or from ?greeting= in the URL
  // (production). Server no longer reads searchParams for this — that would force the
  // homepage into dynamic rendering (Cache-Control: no-store).
  useEffect(() => {
    const greetingParam = greetingParamProp ?? new URLSearchParams(window.location.search).get('greeting') ?? undefined;
    setVariant(selectVariant(variants, audiences, serverCountry, greetingParam));
  }, [variants, audiences, serverCountry, greetingParamProp]);

  // Pass 2: fetch country from /api/country and re-match if it adds new info
  useEffect(() => {
    const greetingParam = greetingParamProp ?? new URLSearchParams(window.location.search).get('greeting') ?? undefined;
    if (greetingParam || serverCountry) return; // already have what we need
    fetch('/api/country')
      .then((r) => r.json())
      .then(({ country }: { country: string | null }) => {
        if (country) {
          setVariant(selectVariant(variants, audiences, country, greetingParam));
        }
      })
      .catch(() => { /* country fetch failed — keep time-based variant */ });
  }, [variants, audiences, serverCountry, greetingParamProp]);

  // Show nothing until client-side matching completes (prevents flash)
  if (!variant) {
    return null;
  }

  // Sanitize HTML content to prevent XSS
  const sanitizedContent = DOMPurify.sanitize(variant.content);

  return (
    <section
      data-testid="greeting-card"
      className="relative rounded-xl overflow-hidden border border-brand-border mb-12"
      style={{ background: 'linear-gradient(135deg, #0d0d1a 0%, #1a0d2e 40%, #0d1a2e 100%)' }}
    >
      {/* Retrowave grid overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#2a2a4a33 1px, transparent 1px), linear-gradient(90deg, #2a2a4a33 1px, transparent 1px)',
          backgroundSize: '2rem 2rem',
        }}
      />
      <div className="relative px-8 py-12 sm:px-12">
        <h1 className="font-heading text-brand-text text-4xl sm:text-5xl font-bold mb-4 leading-tight">
          {variant.heading}
        </h1>
        <div
          className="text-brand-text-sub text-lg leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      </div>
    </section>
  );
}
