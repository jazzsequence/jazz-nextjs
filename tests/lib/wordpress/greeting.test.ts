import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchGreetingData, fetchGreetingVariants } from '@/lib/wordpress/greeting';

// Mock API responses
const mockBlockData = {
  id: 16738,
  ab_test_block: [
    {
      blockName: 'altis/variant',
      attrs: { fallback: true },
      innerBlocks: [
        {
          blockName: 'core/heading',
          innerHTML: "<h2 class=\"wp-block-heading\">Hi, I'm Chris</h2>",
        },
        {
          blockName: 'core/paragraph',
          innerHTML: '<p>I make websites and things.</p>',
        },
      ],
    },
    {
      blockName: 'altis/variant',
      attrs: { audience: 16719 },
      innerBlocks: [
        {
          blockName: 'core/heading',
          innerHTML: "<h2 class=\"wp-block-heading\">Good morning, I'm Chris</h2>",
        },
        {
          blockName: 'core/paragraph',
          innerHTML: '<p>I make websites and things.</p>',
        },
      ],
    },
    {
      blockName: 'altis/variant',
      attrs: { audience: 16720 },
      innerBlocks: [
        {
          blockName: 'core/heading',
          innerHTML: "<h2 class=\"wp-block-heading\">Good afternoon, I'm Chris</h2>",
        },
        {
          blockName: 'core/paragraph',
          innerHTML: '<p>I make websites and things.</p>',
        },
      ],
    },
    {
      blockName: 'altis/variant',
      attrs: { audience: 16722 },
      innerBlocks: [
        {
          blockName: 'core/heading',
          innerHTML: "<h2 class=\"wp-block-heading\">Good evening, I'm Chris</h2>",
        },
        {
          blockName: 'core/paragraph',
          innerHTML: '<p>I make websites and things.</p>',
        },
      ],
    },
    {
      blockName: 'altis/variant',
      attrs: { audience: 16726 },
      innerBlocks: [
        {
          blockName: 'core/heading',
          innerHTML: "<h2 class=\"wp-block-heading\">Welcome adventurer, I'm Chris</h2>",
        },
        {
          blockName: 'core/paragraph',
          innerHTML: '<p>D&amp;D themed content.</p>',
        },
      ],
    },
    {
      blockName: 'altis/variant',
      attrs: { audience: 16377 },
      innerBlocks: [
        {
          blockName: 'core/heading',
          innerHTML: '<h2 class="wp-block-heading">嗨，我是 Chris</h2>',
        },
        {
          blockName: 'core/paragraph',
          innerHTML: '<p>中文内容。</p>',
        },
      ],
    },
  ],
};

const mockAudiencesData = [
  {
    id: 16719,
    audience: {
      groups: [
        {
          rules: [
            { field: 'metrics.hour', operator: 'lt', value: '11', type: 'string' },
          ],
        },
      ],
    },
  },
  {
    id: 16720,
    audience: {
      groups: [
        {
          rules: [
            { field: 'metrics.hour', operator: 'gte', value: '11', type: 'string' },
            { field: 'metrics.hour', operator: 'lt', value: '17', type: 'string' },
          ],
        },
      ],
    },
  },
  {
    id: 16722,
    audience: {
      groups: [
        {
          rules: [
            { field: 'metrics.hour', operator: 'gte', value: '17', type: 'string' },
          ],
        },
      ],
    },
  },
  {
    id: 16726,
    audience: {
      groups: [
        {
          rules: [
            { field: 'metrics.day', operator: '=', value: '4', type: 'string' },
            { field: 'metrics.hour', operator: 'gt', value: '17', type: 'string' },
            { field: 'metrics.hour', operator: 'lte', value: '21', type: 'string' },
          ],
        },
      ],
    },
  },
  {
    id: 16377,
    audience: {
      groups: [
        {
          rules: [
            { field: 'endpoints.country', operator: '=', value: 'CN', type: 'string' },
          ],
        },
      ],
    },
  },
];

describe('fetchGreetingData', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch and parse all greeting variants and audiences', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlockData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAudiencesData,
      });

    const result = await fetchGreetingData();

    expect(result.variants).toHaveLength(6);
    expect(result.audiences).toHaveLength(5);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should parse fallback variant correctly', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlockData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAudiencesData,
      });

    const result = await fetchGreetingData();
    const fallback = result.variants.find(v => v.isFallback);

    expect(fallback).toBeDefined();
    expect(fallback?.audienceId).toBeNull();
    expect(fallback?.heading).toContain("Hi, I'm Chris");
    expect(fallback?.content).toContain('I make websites');
  });

  it('should parse audience-targeted variants correctly', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlockData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAudiencesData,
      });

    const result = await fetchGreetingData();
    const morning = result.variants.find(v => v.audienceId === 16719);

    expect(morning).toBeDefined();
    expect(morning?.audienceId).toBe(16719);
    expect(morning?.heading).toContain("Good morning");
    expect(morning?.isFallback).toBe(false);
  });

  it('should extract heading text correctly', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlockData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAudiencesData,
      });

    const result = await fetchGreetingData();

    const headings = result.variants.map(v => v.heading);
    expect(headings).toContain("Hi, I'm Chris");
    expect(headings).toContain("Good morning, I'm Chris");
    expect(headings).toContain("Good afternoon, I'm Chris");
    expect(headings).toContain("Good evening, I'm Chris");
    expect(headings).toContain("Welcome adventurer, I'm Chris");
    expect(headings).toContain("嗨，我是 Chris");
  });

  it('should extract paragraph content correctly', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlockData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAudiencesData,
      });

    const result = await fetchGreetingData();
    const fallback = result.variants.find(v => v.isFallback);

    expect(fallback?.content).toContain('I make websites and things');
  });

  it('should handle multiple paragraphs', async () => {
    const blockDataWithMultipleParagraphs = {
      ...mockBlockData,
      ab_test_block: [
        {
          blockName: 'altis/variant',
          attrs: { audience: 16377 },
          innerBlocks: [
            {
              blockName: 'core/heading',
              innerHTML: '<h2>嗨，我是 Chris</h2>',
            },
            {
              blockName: 'core/paragraph',
              innerHTML: '<p>第一段内容。</p>',
            },
            {
              blockName: 'core/paragraph',
              innerHTML: '<p>第二段内容。</p>',
            },
          ],
        },
      ],
    };

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => blockDataWithMultipleParagraphs,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAudiencesData,
      });

    const result = await fetchGreetingData();
    const chinese = result.variants.find(v => v.audienceId === 16377);

    expect(chinese?.content).toContain('第一段内容');
    expect(chinese?.content).toContain('第二段内容');
  });

  it('should decode HTML entities', async () => {
    const blockDataWithEntities = {
      ...mockBlockData,
      ab_test_block: [
        {
          blockName: 'altis/variant',
          attrs: { fallback: true },
          innerBlocks: [
            {
              blockName: 'core/heading',
              innerHTML: "<h2>Hi, I&#8217;m Chris</h2>",
            },
            {
              blockName: 'core/paragraph',
              innerHTML: '<p>I make websites &amp; things.</p>',
            },
          ],
        },
      ],
    };

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => blockDataWithEntities,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAudiencesData,
      });

    const result = await fetchGreetingData();
    const fallback = result.variants.find(v => v.isFallback);

    // &#8217; = RIGHT SINGLE QUOTATION MARK (U+2019, curly apostrophe)
    // &amp; = AMPERSAND (U+0026, &)
    expect(fallback?.heading).toBe("Hi, I\u2019m Chris");
    expect(fallback?.content).toContain('websites & things');
  });

  it('should handle fetch errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(fetchGreetingData()).rejects.toThrow('Network error');
  });

  it('should handle HTTP errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(fetchGreetingData()).rejects.toThrow();
  });

  it('should handle missing ab_test_block gracefully', async () => {
    const blockDataWithoutVariants = { id: 16738 };

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => blockDataWithoutVariants,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAudiencesData,
      });

    const result = await fetchGreetingData();

    expect(result.variants).toHaveLength(0);
    expect(result.audiences).toHaveLength(5);
  });

  it('should parse all 6 expected variants from real structure', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlockData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAudiencesData,
      });

    const result = await fetchGreetingData();

    // Should have exactly 6 variants
    expect(result.variants).toHaveLength(6);

    // Check all expected audience IDs are present
    const audienceIds = result.variants.map(v => v.audienceId).filter(id => id !== null);
    expect(audienceIds).toContain(16719); // Morning
    expect(audienceIds).toContain(16720); // Afternoon
    expect(audienceIds).toContain(16722); // Evening
    expect(audienceIds).toContain(16726); // D&D
    expect(audienceIds).toContain(16377); // Chinese

    // Check fallback exists
    const fallback = result.variants.find(v => v.isFallback);
    expect(fallback).toBeDefined();
  });

  it('should preserve HTML in content', async () => {
    const blockDataWithFormatting = {
      ...mockBlockData,
      ab_test_block: [
        {
          blockName: 'altis/variant',
          attrs: { fallback: true },
          innerBlocks: [
            {
              blockName: 'core/heading',
              innerHTML: "<h2>Hi, I'm Chris</h2>",
            },
            {
              blockName: 'core/paragraph',
              innerHTML: '<p>I make <strong>websites</strong> and <em>things</em>.</p>',
            },
          ],
        },
      ],
    };

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => blockDataWithFormatting,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAudiencesData,
      });

    const result = await fetchGreetingData();
    const fallback = result.variants.find(v => v.isFallback);

    // Should preserve HTML tags in content
    expect(fallback?.content).toContain('<strong>');
    expect(fallback?.content).toContain('<em>');
  });

  it('should parse audience rules correctly', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlockData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAudiencesData,
      });

    const result = await fetchGreetingData();

    // Check morning audience rules
    const morning = result.audiences.find(a => a.id === 16719);
    expect(morning?.rules).toHaveLength(1);
    expect(morning?.rules[0].field).toBe('metrics.hour');
    expect(morning?.rules[0].operator).toBe('lt');
    expect(morning?.rules[0].value).toBe('11');

    // Check D&D audience rules (multiple rules)
    const dnd = result.audiences.find(a => a.id === 16726);
    expect(dnd?.rules).toHaveLength(3);
  });
});

describe('fetchGreetingVariants (deprecated)', () => {
  it('should return only variants array for backwards compatibility', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBlockData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAudiencesData,
      });

    const variants = await fetchGreetingVariants();

    expect(variants).toHaveLength(6);
    expect(variants[0]).toHaveProperty('heading');
    expect(variants[0]).toHaveProperty('content');
  });
});
