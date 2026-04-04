import { describe, it, expect } from 'vitest'
import { decodeHtmlEntities, normalizeWordPressUrl, stripWordPressSize, excerptToDescription } from '@/lib/utils/html'

describe('normalizeWordPressUrl', () => {
  it('collapses double slash in wp-content path', () => {
    expect(normalizeWordPressUrl(
      'https://jazzsequence.com/wp-content/uploads//2017/01/image.jpg'
    )).toBe('https://jazzsequence.com/wp-content/uploads/2017/01/image.jpg')
  })

  it('preserves https:// protocol', () => {
    expect(normalizeWordPressUrl('https://example.com/path')).toBe('https://example.com/path')
  })

  it('does not affect URLs with no double slash', () => {
    expect(normalizeWordPressUrl(
      'https://sfo2.digitaloceanspaces.com/cdn.jazzsequence/wp-content/uploads/2022/10/image.jpg'
    )).toBe('https://sfo2.digitaloceanspaces.com/cdn.jazzsequence/wp-content/uploads/2022/10/image.jpg')
  })

  it('handles multiple double slashes', () => {
    expect(normalizeWordPressUrl('https://example.com//foo//bar.jpg')).toBe('https://example.com/foo/bar.jpg')
  })

  it('preserves empty string', () => {
    expect(normalizeWordPressUrl('')).toBe('')
  })
})

describe('stripWordPressSize', () => {
  it('strips WxH suffix from WordPress resized images', () => {
    expect(stripWordPressSize('photo-800x600.jpg')).toBe('photo.jpg')
  })

  it('strips suffix from URLs with full path', () => {
    expect(stripWordPressSize(
      'https://jazzsequence.com/wp-content/uploads/2025/12/1-800x800.jpg'
    )).toBe('https://jazzsequence.com/wp-content/uploads/2025/12/1.jpg')
  })

  it('does not strip when no WxH suffix is present', () => {
    expect(stripWordPressSize('photo.jpg')).toBe('photo.jpg')
  })

  it('does not strip hyphens that are part of the filename', () => {
    expect(stripWordPressSize('my-photo-name.jpg')).toBe('my-photo-name.jpg')
  })

  it('strips only the last WxH suffix, not internal hyphens', () => {
    expect(stripWordPressSize('my-photo-800x600.jpg')).toBe('my-photo.jpg')
  })

  it('preserves query strings after extension', () => {
    expect(stripWordPressSize('photo-300x200.jpg?v=2')).toBe('photo.jpg?v=2')
  })

  it('handles PNG extension', () => {
    expect(stripWordPressSize('image-1920x1080.png')).toBe('image.png')
  })

  it('handles WebP extension', () => {
    expect(stripWordPressSize('image-400x300.webp')).toBe('image.webp')
  })

  it('handles double slash in WordPress upload path (common quirk)', () => {
    expect(stripWordPressSize(
      'https://jazzsequence.com/wp-content/uploads//2025/10/IMG_1371-800x600.png'
    )).toBe('https://jazzsequence.com/wp-content/uploads//2025/10/IMG_1371.png')
  })
})

describe('decodeHtmlEntities', () => {
  it('passes through strings with no entities unchanged', () => {
    expect(decodeHtmlEntities('Hello world')).toBe('Hello world')
  })

  it('passes through empty string', () => {
    expect(decodeHtmlEntities('')).toBe('')
  })

  // The primary bug trigger: WordPress wptexturize converts ' to &#8217;
  it('decodes &#8217; (right single quotation mark / curly apostrophe)', () => {
    expect(decodeHtmlEntities("I&#8217;ll tell you")).toBe("I\u2019ll tell you")
  })

  it('decodes &#8216; (left single quotation mark)', () => {
    expect(decodeHtmlEntities('&#8216;quoted&#8217;')).toBe('\u2018quoted\u2019')
  })

  it('decodes &#8220; and &#8221; (double quotation marks)', () => {
    expect(decodeHtmlEntities('&#8220;Hello&#8221;')).toBe('\u201cHello\u201d')
  })

  it('decodes &#8211; (en dash)', () => {
    expect(decodeHtmlEntities('word&#8211;word')).toBe('word\u2013word')
  })

  it('decodes &#8212; (em dash)', () => {
    expect(decodeHtmlEntities('word&#8212;word')).toBe('word\u2014word')
  })

  it('decodes &#8230; (horizontal ellipsis)', () => {
    expect(decodeHtmlEntities('and so on&#8230;')).toBe('and so on\u2026')
  })

  it('decodes hex entities: &#x2019; (right single quotation mark)', () => {
    expect(decodeHtmlEntities("won&#x2019;t")).toBe("won\u2019t")
  })

  it('decodes hex entities: &#x201C; and &#x201D; (double quotes)', () => {
    expect(decodeHtmlEntities('&#x201C;hello&#x201D;')).toBe('\u201chello\u201d')
  })

  it('decodes &amp; → &', () => {
    expect(decodeHtmlEntities('fish &amp; chips')).toBe('fish & chips')
  })

  it('decodes &lt; and &gt;', () => {
    expect(decodeHtmlEntities('a &lt; b &gt; c')).toBe('a < b > c')
  })

  it('decodes &quot;', () => {
    expect(decodeHtmlEntities('say &quot;hello&quot;')).toBe('say "hello"')
  })

  it('decodes &apos;', () => {
    expect(decodeHtmlEntities("it&apos;s")).toBe("it's")
  })

  it('decodes &#039; (numeric apostrophe)', () => {
    expect(decodeHtmlEntities("it&#039;s")).toBe("it's")
  })

  it('decodes &ndash;', () => {
    expect(decodeHtmlEntities('2020&ndash;2024')).toBe('2020\u20132024')
  })

  it('decodes &mdash;', () => {
    expect(decodeHtmlEntities('wait&mdash;what')).toBe('wait\u2014what')
  })

  it('decodes &hellip;', () => {
    expect(decodeHtmlEntities('more&hellip;')).toBe('more\u2026')
  })

  it('decodes &nbsp; to non-breaking space', () => {
    expect(decodeHtmlEntities('a&nbsp;b')).toBe('a\u00a0b')
  })

  it('decodes multiple entities in the same string', () => {
    const input = "What does it feel like to be banned from WordPress? I&#8217;ll tell you"
    const expected = "What does it feel like to be banned from WordPress? I\u2019ll tell you"
    expect(decodeHtmlEntities(input)).toBe(expected)
  })

  it('does not double-decode (single pass only)', () => {
    // &amp;amp; should become &amp; (one level decoded), not &
    expect(decodeHtmlEntities('&amp;amp;')).toBe('&amp;')
  })
})

describe('excerptToDescription', () => {
  const seriesPrefix = '<div class="pps-series-post-details pps-series-post-details-variant-classic pps-series-post-details-16399 pps-series-meta-excerpt" data-series-id="5188"><div class="pps-series-meta-content"><div class="pps-series-meta-text">This entry is part 22 of 22 in the series <a href="https://jazzsequence.com/series/artificial-intelligence/">Artificial Intelligence</a></div></div></div>'

  it('strips pps-series-post-details block from excerpt', () => {
    const excerpt = `${seriesPrefix}<p>Actual post excerpt text here.</p>`
    const result = excerptToDescription(excerpt)
    expect(result).not.toContain('pps-series')
    expect(result).not.toContain('This entry is part')
    expect(result).toContain('Actual post excerpt text here.')
  })

  it('strips all HTML tags after removing series block', () => {
    const excerpt = `${seriesPrefix}<p>Plain text excerpt.</p>`
    const result = excerptToDescription(excerpt)
    expect(result).toBe('Plain text excerpt.')
  })

  it('does not truncate — lets WordPress handle excerpt length', () => {
    const longText = 'A'.repeat(400)
    const result = excerptToDescription(`<p>${longText}</p>`)
    expect(result?.length).toBe(400)
  })

  it('returns undefined for empty or missing excerpt', () => {
    expect(excerptToDescription('')).toBeUndefined()
    expect(excerptToDescription(undefined)).toBeUndefined()
  })

  it('works on excerpts without a series block', () => {
    const excerpt = '<p>Normal excerpt with no series info.</p>'
    expect(excerptToDescription(excerpt)).toBe('Normal excerpt with no series info.')
  })

  it('decodes HTML entities in the excerpt', () => {
    const excerpt = '<p>They&#8217;re moving the entire agency off of WordPress &amp; onto AI.</p>'
    const result = excerptToDescription(excerpt)
    expect(result).toBe('They\u2019re moving the entire agency off of WordPress & onto AI.')
    expect(result).not.toContain('&#8217;')
    expect(result).not.toContain('&amp;')
  })
})
