import { describe, it, expect } from 'vitest';
import { transformMenuUrl } from '@/lib/url-transform';

describe('transformMenuUrl', () => {
  describe('jazzsequence.com URLs', () => {
    it('should transform jazzsequence.com homepage to root path', () => {
      expect(transformMenuUrl('https://jazzsequence.com')).toBe('/');
      expect(transformMenuUrl('https://jazzsequence.com/')).toBe('/');
    });

    it('should transform jazzsequence.com paths to local paths', () => {
      expect(transformMenuUrl('https://jazzsequence.com/music/')).toBe('/music/');
      expect(transformMenuUrl('https://jazzsequence.com/about/')).toBe('/about/');
      expect(transformMenuUrl('https://jazzsequence.com/posts/my-post')).toBe('/posts/my-post');
    });

    it('should handle nested paths', () => {
      expect(transformMenuUrl('https://jazzsequence.com/music/blind-chaos/')).toBe('/music/blind-chaos/');
      expect(transformMenuUrl('https://jazzsequence.com/articles/tech/nextjs')).toBe('/articles/tech/nextjs');
    });

    it('should preserve query parameters', () => {
      expect(transformMenuUrl('https://jazzsequence.com/search?q=test')).toBe('/search?q=test');
    });

    it('should preserve hash fragments', () => {
      expect(transformMenuUrl('https://jazzsequence.com/about/#team')).toBe('/about/#team');
    });
  });

  describe('external URLs', () => {
    it('should keep external URLs unchanged', () => {
      expect(transformMenuUrl('https://github.com/jazzsequence')).toBe('https://github.com/jazzsequence');
      expect(transformMenuUrl('https://twitter.com/jazzs3quence')).toBe('https://twitter.com/jazzs3quence');
      expect(transformMenuUrl('https://example.com/page')).toBe('https://example.com/page');
    });

    it('should handle http external URLs', () => {
      expect(transformMenuUrl('http://example.com')).toBe('http://example.com');
    });

    it('should handle URLs without protocol', () => {
      // WordPress sometimes returns URLs without protocol
      expect(transformMenuUrl('//example.com/page')).toBe('//example.com/page');
    });
  });

  describe('relative URLs', () => {
    it('should keep relative URLs unchanged', () => {
      expect(transformMenuUrl('/music/')).toBe('/music/');
      expect(transformMenuUrl('/about')).toBe('/about');
    });

    it('should handle root relative URL', () => {
      expect(transformMenuUrl('/')).toBe('/');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(transformMenuUrl('')).toBe('');
    });

    it('should handle malformed URLs gracefully', () => {
      expect(transformMenuUrl('not-a-valid-url')).toBe('not-a-valid-url');
    });
  });
});
