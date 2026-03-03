import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchGreetingVariants } from '@/lib/wordpress/greeting';

// Mock fetch for testing
const mockHomepageHtml = `
<main>
  <template data-fallback data-parent-id="16738">
    <h2>Hi, I'm Chris</h2>
    <p>I make websites and things.</p>
  </template>

  <template data-parent-id="16738" data-audience="16719">
    <h2>Good morning, I'm Chris</h2>
    <p>I make websites and things.</p>
  </template>

  <template data-parent-id="16738" data-audience="16720">
    <h2>Good afternoon, I'm Chris</h2>
    <p>I make websites and things.</p>
  </template>

  <template data-parent-id="16738" data-audience="16722">
    <h2>Good evening, I'm Chris</h2>
    <p>I make websites and things.</p>
  </template>

  <template data-parent-id="16738" data-audience="16726">
    <h2>Welcome adventurer, I'm Chris</h2>
    <p>D&D themed content.</p>
  </template>

  <template data-parent-id="16738" data-audience="16377">
    <h2>嗨，我是 Chris</h2>
    <p>中文内容。</p>
  </template>
</main>
`;

describe('fetchGreetingVariants', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch and parse all greeting variants from homepage', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockHomepageHtml,
    });

    const variants = await fetchGreetingVariants();

    expect(variants).toHaveLength(6); // 5 audience variants + 1 fallback
    expect(global.fetch).toHaveBeenCalledWith('https://jazzsequence.com/');
  });

  it('should parse fallback variant correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockHomepageHtml,
    });

    const variants = await fetchGreetingVariants();
    const fallback = variants.find(v => v.isFallback);

    expect(fallback).toBeDefined();
    expect(fallback?.audienceId).toBeNull();
    expect(fallback?.heading).toContain("Hi, I'm Chris");
    expect(fallback?.content).toContain('I make websites');
  });

  it('should parse audience-targeted variants correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockHomepageHtml,
    });

    const variants = await fetchGreetingVariants();
    const morning = variants.find(v => v.audienceId === 16719);

    expect(morning).toBeDefined();
    expect(morning?.audienceId).toBe(16719);
    expect(morning?.heading).toContain("Good morning");
    expect(morning?.isFallback).toBe(false);
  });

  it('should extract heading text correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockHomepageHtml,
    });

    const variants = await fetchGreetingVariants();

    const headings = variants.map(v => v.heading);
    expect(headings).toContain("Hi, I'm Chris");
    expect(headings).toContain("Good morning, I'm Chris");
    expect(headings).toContain("Good afternoon, I'm Chris");
    expect(headings).toContain("Good evening, I'm Chris");
    expect(headings).toContain("Welcome adventurer, I'm Chris");
    expect(headings).toContain("嗨，我是 Chris");
  });

  it('should extract paragraph content correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockHomepageHtml,
    });

    const variants = await fetchGreetingVariants();
    const fallback = variants.find(v => v.isFallback);

    expect(fallback?.content).toContain('I make websites and things');
  });

  it('should handle multiple paragraphs', async () => {
    const htmlWithMultipleParagraphs = `
      <template data-parent-id="16738" data-audience="16377">
        <h2>嗨，我是 Chris</h2>
        <p>第一段内容。</p>
        <p>第二段内容。</p>
      </template>
    `;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => htmlWithMultipleParagraphs,
    });

    const variants = await fetchGreetingVariants();
    const chinese = variants.find(v => v.audienceId === 16377);

    expect(chinese?.content).toContain('第一段内容');
    expect(chinese?.content).toContain('第二段内容');
  });

  it('should decode HTML entities', async () => {
    const htmlWithEntities = `
      <template data-fallback data-parent-id="16738">
        <h2>Hi, I&#8217;m Chris</h2>
        <p>I make websites &amp; things.</p>
      </template>
    `;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => htmlWithEntities,
    });

    const variants = await fetchGreetingVariants();
    const fallback = variants.find(v => v.isFallback);

    expect(fallback?.heading).toBe("Hi, I'm Chris");
    expect(fallback?.content).toContain('websites & things');
  });

  it('should handle fetch errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(fetchGreetingVariants()).rejects.toThrow('Network error');
  });

  it('should handle HTTP errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(fetchGreetingVariants()).rejects.toThrow();
  });

  it('should handle missing greeting block gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<html><body><p>No greeting block here</p></body></html>',
    });

    const variants = await fetchGreetingVariants();

    expect(variants).toHaveLength(0);
  });

  it('should parse all 6 expected variants from real structure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => mockHomepageHtml,
    });

    const variants = await fetchGreetingVariants();

    // Should have exactly 6 variants
    expect(variants).toHaveLength(6);

    // Check all expected audience IDs are present
    const audienceIds = variants.map(v => v.audienceId).filter(id => id !== null);
    expect(audienceIds).toContain(16719); // Morning
    expect(audienceIds).toContain(16720); // Afternoon
    expect(audienceIds).toContain(16722); // Evening
    expect(audienceIds).toContain(16726); // D&D
    expect(audienceIds).toContain(16377); // Chinese

    // Check fallback exists
    const fallback = variants.find(v => v.isFallback);
    expect(fallback).toBeDefined();
  });

  it('should preserve HTML in content', async () => {
    const htmlWithFormatting = `
      <template data-fallback data-parent-id="16738">
        <h2>Hi, I'm Chris</h2>
        <p>I make <strong>websites</strong> and <em>things</em>.</p>
      </template>
    `;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => htmlWithFormatting,
    });

    const variants = await fetchGreetingVariants();
    const fallback = variants.find(v => v.isFallback);

    // Should preserve HTML tags in content
    expect(fallback?.content).toContain('<strong>');
    expect(fallback?.content).toContain('<em>');
  });
});
