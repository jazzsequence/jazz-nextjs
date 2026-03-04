/**
 * WordPress Greeting Block Fetcher
 *
 * Fetches personalized greeting variants from WordPress REST API.
 * Integrates with Altis Accelerate personalization system.
 */

import { decode } from 'html-entities';
import type { Audience } from '@/lib/audience-matcher';

const API_BASE_URL = process.env.WORDPRESS_API_URL || 'https://jazzsequence.com/wp-json/wp/v2';
const GREETING_BLOCK_ID = 16738;

const WORDPRESS_USERNAME = process.env.WORDPRESS_USERNAME;
const WORDPRESS_APP_PASSWORD = process.env.WORDPRESS_APP_PASSWORD;

export interface GreetingVariant {
  audienceId: number | null;
  isFallback: boolean;
  heading: string;
  content: string;
}

export interface GreetingData {
  variants: GreetingVariant[];
  audiences: Audience[];
}

/**
 * Generate authentication headers for WordPress REST API
 */
function getAuthHeaders(): HeadersInit {
  if (WORDPRESS_USERNAME && WORDPRESS_APP_PASSWORD) {
    const credentials = `${WORDPRESS_USERNAME}:${WORDPRESS_APP_PASSWORD}`;
    const encoded = Buffer.from(credentials).toString('base64');
    return {
      Authorization: `Basic ${encoded}`,
    };
  }
  return {};
}

/**
 * Fetch greeting block variants and audience configurations from WordPress REST API.
 *
 * Fetches from:
 * - `/wp-json/wp/v2/blocks/16738` - Greeting block with variants
 * - `/wp-json/accelerate/v1/audiences` - Audience configurations
 *
 * @returns Greeting variants and audience configurations
 */
export async function fetchGreetingData(): Promise<GreetingData> {
  try {
    // Fetch block data and audiences in parallel
    const [blockResponse, audiencesResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/blocks/${GREETING_BLOCK_ID}`, {
        headers: getAuthHeaders(),
      }),
      fetch('https://jazzsequence.com/wp-json/accelerate/v1/audiences', {
        headers: getAuthHeaders(),
      }),
    ]);

    if (!blockResponse.ok) {
      throw new Error(`Block fetch failed: ${blockResponse.status} ${blockResponse.statusText}`);
    }

    if (!audiencesResponse.ok) {
      throw new Error(`Audiences fetch failed: ${audiencesResponse.status} ${audiencesResponse.statusText}`);
    }

    const blockData = await blockResponse.json();
    const audiencesData = await audiencesResponse.json();

    // Parse variants from ab_test_block array
    const variants = parseBlockVariants(blockData.ab_test_block || []);

    // Parse audiences into our format
    const audiences = parseAudiences(audiencesData);

    return {
      variants,
      audiences,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch greeting data');
  }
}

/**
 * @deprecated Use fetchGreetingData() instead
 */
export async function fetchGreetingVariants(): Promise<GreetingVariant[]> {
  const data = await fetchGreetingData();
  return data.variants;
}

/**
 * Parse block variants from WordPress ab_test_block array
 */
function parseBlockVariants(blocks: Array<{
  blockName: string;
  attrs: {
    audience?: number;
    fallback?: boolean;
  };
  innerBlocks: Array<{
    blockName: string;
    innerHTML: string;
  }>;
}>): GreetingVariant[] {
  return blocks
    .filter(block => block.blockName === 'altis/variant')
    .map(block => {
      const isFallback = block.attrs.fallback || false;
      const audienceId = block.attrs.audience || null;

      // Find heading block (core/heading)
      const headingBlock = block.innerBlocks.find(b => b.blockName === 'core/heading');
      const headingHtml = headingBlock?.innerHTML || '';

      // Extract heading text from HTML
      const headingMatch = headingHtml.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/);
      const heading = headingMatch ? decode(headingMatch[1].trim(), { level: 'html5' }) : '';

      // Find all paragraph blocks (core/paragraph)
      const paragraphBlocks = block.innerBlocks.filter(b => b.blockName === 'core/paragraph');
      const paragraphs = paragraphBlocks.map(p => {
        const pMatch = p.innerHTML.match(/<p[^>]*>([\s\S]*?)<\/p>/);
        return pMatch ? decode(pMatch[1].trim(), { level: 'html5' }) : '';
      });

      const content = paragraphs.join('\n\n');

      return {
        audienceId,
        isFallback,
        heading,
        content,
      };
    });
}

/**
 * Parse audiences from Accelerate API response
 */
function parseAudiences(audiencesData: Array<{
  id: number;
  audience: {
    groups: Array<{
      rules: Array<{
        field: string;
        operator: string;
        value: string;
        type: string;
      }>;
    }>;
  };
}>): Audience[] {
  return audiencesData.map(aud => ({
    id: aud.id,
    rules: aud.audience.groups[0]?.rules.map(rule => ({
      field: rule.field,
      operator: rule.operator as '=' | 'lt' | 'gt' | 'lte' | 'gte',
      value: rule.value,
      type: rule.type,
    })) || [],
  }));
}
