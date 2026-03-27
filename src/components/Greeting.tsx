import { fetchGreetingData } from '@/lib/wordpress/greeting';
import { GreetingClient } from './GreetingClient';

interface GreetingProps {
  searchParams?: Promise<{ greeting?: string }>;
}

export async function Greeting({ searchParams }: GreetingProps = {}) {
  try {
    const { variants, audiences } = await fetchGreetingData();

    // Country detection is deferred to GreetingClient via /api/country.
    // Keeping headers() out of this server component allows the homepage
    // to be edge-cached by Pantheon's CDN — headers() forces no-store.
    const params = searchParams ? await searchParams : undefined;
    const greetingParam = params?.greeting;

    return (
      <GreetingClient
        variants={variants}
        audiences={audiences}
        greetingParam={greetingParam}
      />
    );
  } catch (error) {
    console.error('Failed to fetch greeting:', error);

    return (
      <GreetingClient
        variants={[]}
        audiences={[]}
      />
    );
  }
}
