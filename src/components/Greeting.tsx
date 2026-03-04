import { headers } from 'next/headers';
import { fetchGreetingData } from '@/lib/wordpress/greeting';
import { GreetingClient } from './GreetingClient';

interface GreetingProps {
  searchParams?: Promise<{ greeting?: string }>;
}

export async function Greeting({ searchParams }: GreetingProps = {}) {
  try {
    const { variants, audiences } = await fetchGreetingData();

    // Extract server-detected country from headers
    const headersList = await headers();
    const serverCountry = headersList.get('cf-ipcountry') || // Cloudflare
                          headersList.get('x-vercel-ip-country') || // Vercel
                          headersList.get('cloudfront-viewer-country') || // AWS CloudFront
                          headersList.get('x-country-code') || // Generic
                          headersList.get('fastly-client-country') || // Fastly (Pantheon)
                          undefined;

    // Get query parameter for E2E testing
    const params = searchParams ? await searchParams : undefined;
    const greetingParam = params?.greeting;

    // Pass data to client component for browser-timezone-based matching
    return (
      <GreetingClient
        variants={variants}
        audiences={audiences}
        serverCountry={serverCountry}
        greetingParam={greetingParam}
      />
    );
  } catch (error) {
    console.error('Failed to fetch greeting:', error);

    // Show default fallback on error
    return (
      <GreetingClient
        variants={[]}
        audiences={[]}
        serverCountry={undefined}
      />
    );
  }
}
