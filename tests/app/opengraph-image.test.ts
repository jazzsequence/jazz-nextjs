import { describe, it, expect } from 'vitest';
import { size, contentType, alt, runtime } from '@/app/opengraph-image';

describe('app/opengraph-image', () => {
  it('exports the correct dimensions', () => {
    expect(size).toEqual({ width: 1200, height: 630 });
  });

  it('exports the correct content type', () => {
    expect(contentType).toBe('image/png');
  });

  it('exports the correct alt text', () => {
    expect(alt).toBe('jazzsequence.com');
  });

  it('uses edge runtime', () => {
    expect(runtime).toBe('edge');
  });
});
