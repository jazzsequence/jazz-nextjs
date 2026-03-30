import { fetchGreetingData } from '@/lib/wordpress/greeting';
import { GreetingClient } from './GreetingClient';

export async function Greeting() {
  try {
    const { variants, audiences } = await fetchGreetingData();

    // No searchParams here — accessing searchParams forces dynamic rendering
    // (Cache-Control: no-store) on the homepage. The ?greeting= param is read
    // client-side by GreetingClient via window.location.search instead.
    return (
      <GreetingClient
        variants={variants}
        audiences={audiences}
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
