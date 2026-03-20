import { describe, it, expect } from 'vitest'
import { decodeHtmlEntities } from '@/lib/utils/html'

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
