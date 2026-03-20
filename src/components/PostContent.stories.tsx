/**
 * PostContent — renders WordPress Gutenberg block HTML via .post-body CSS class.
 *
 * These stories are the canonical reference for how WordPress-generated HTML
 * should look in the design system. Only block classes confirmed present in
 * actual jazzsequence.com REST API output are styled (verified against live posts).
 *
 * If a block type looks wrong or unstyled, fix app/globals.css — not this story.
 */
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import PostContent from './PostContent'
import type { WPPost } from '@/lib/wordpress/types'

const basePost: WPPost = {
  id: 1,
  type: 'post',
  slug: 'test-post',
  title: { rendered: 'teh s3quence 016 — spring mix' },
  content: { rendered: '' },
  excerpt: { rendered: '' },
  date: '2012-04-28T10:14:41',
  date_gmt: '2012-04-28T10:14:41',
  modified: '2012-04-28T10:14:41',
  modified_gmt: '2012-04-28T10:14:41',
  status: 'publish',
  link: 'https://jazzsequence.com/test',
  author: 1,
  featured_media: 0,
  comment_status: 'open',
  ping_status: 'open',
  sticky: false,
  template: '',
  format: 'standard',
  meta: {},
  categories: [],
  tags: [],
}

// ── Sample HTML blocks (matching what WordPress REST API actually returns) ────

const PARAGRAPHS = `
<p class="wp-block-paragraph">After a seemingly long winter, Spring is here again. A collection of tracks hinting at the Summer to come — electronic, atmospheric, and warm.</p>
<p class="wp-block-paragraph">What makes a good spring mix? Tracks that feel like opening a window after months of cold. Eskmo's <em>Cloudlight</em> captures that perfectly — weight lifting, light returning.</p>
`

const HEADINGS = `
<p class="wp-block-paragraph">The following mix covers several moods and tempos, organized loosely by energy.</p>
<h2 class="wp-block-heading">The Model Context Protocol</h2>
<p class="wp-block-paragraph">The MCP is an open standard, originally developed by Anthropic, for connecting AI systems to external data sources and tools.</p>
<h3 class="wp-block-heading">What WordPress Exposes</h3>
<p class="wp-block-paragraph">The foundation is the WordPress Abilities API — a custom API layer built on top of WordPress's capabilities system.</p>
<h4 class="wp-block-heading">Subsection heading example</h4>
<p class="wp-block-paragraph">H4 is used for minor subsections and call-outs within a section.</p>
`

const LISTS = `
<p class="wp-block-paragraph">The tracklist spans a range of subgenres:</p>
<ul class="wp-block-list">
  <li>Eskmo — Cloudlight</li>
  <li>Gramatik — DreamBIG</li>
  <li>MJ Cole — I See Love</li>
  <li>Bonobo — Kiara</li>
  <li>James Blake — Limit to Your Love</li>
</ul>
<p class="wp-block-paragraph">The mix also borrows from this numbered process:</p>
<ol class="wp-block-list">
  <li>Select tracks that share a harmonic identity</li>
  <li>Arrange by energy arc — build, peak, release</li>
  <li>Bridge between sections with transitional tracks</li>
</ol>
`

const PULLQUOTE = `
<p class="wp-block-paragraph">Some quotes from the session that stuck with me:</p>
<figure class="wp-block-pullquote">
  <blockquote>
    <p>The goal is to make the listener feel like they're watching a sunrise happen in slow motion.</p>
    <cite>Chris Reynolds, session notes</cite>
  </blockquote>
</figure>
<p class="wp-block-paragraph">That's the aesthetic target for the spring series.</p>
`

const SEPARATOR = `
<p class="wp-block-paragraph">First section content ends here.</p>
<hr class="wp-block-separator has-alpha-channel-opacity"/>
<p class="wp-block-paragraph">Second section picks up with a change in energy.</p>
`

const IMAGE_CAPTION = `
<p class="wp-block-paragraph">The session took place over a rainy weekend in April:</p>
<figure class="wp-block-image size-large">
  <img src="https://picsum.photos/seed/spring/800/450" alt="Session setup" />
  <figcaption class="wp-element-caption">The studio setup — minimalist by design, chaotic in practice.</figcaption>
</figure>
<p class="wp-block-paragraph">The monitor mix at this point was still rough — all the instruments bleeding into each other.</p>
`

const FULL_GUTENBERG = `
${PARAGRAPHS}
${HEADINGS}
${LISTS}
${PULLQUOTE}
${SEPARATOR}
${IMAGE_CAPTION}
`

// ─────────────────────────────────────────────────────────────────────────────

function makePost(content: string, hasImage = false): WPPost {
  return {
    ...basePost,
    content: { rendered: content },
    featured_media: hasImage ? 123 : 0,
    _embedded: hasImage ? {
      'wp:featuredmedia': [{
        id: 123,
        source_url: 'https://picsum.photos/seed/springmix/1200/600',
        alt_text: 'Featured image',
        media_details: { width: 1200, height: 600, sizes: {} },
      }],
    } : undefined,
  }
}

const meta: Meta<typeof PostContent> = {
  title: 'Design System/PostContent',
  component: PostContent,
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof PostContent>

export const Paragraphs: Story = {
  name: 'Paragraphs (wp-block-paragraph)',
  args: { post: makePost(PARAGRAPHS) },
}

export const Headings: Story = {
  name: 'Headings (wp-block-heading)',
  args: { post: makePost(HEADINGS) },
}

export const Lists: Story = {
  name: 'Lists (wp-block-list)',
  args: { post: makePost(LISTS) },
}

export const Pullquote: Story = {
  name: 'Pullquote (wp-block-pullquote)',
  args: { post: makePost(PULLQUOTE) },
}

export const Separator: Story = {
  name: 'Separator (wp-block-separator)',
  args: { post: makePost(SEPARATOR) },
}

export const ImageWithCaption: Story = {
  name: 'Image + Caption (wp-element-caption)',
  args: { post: makePost(IMAGE_CAPTION) },
}

export const WithFeaturedImage: Story = {
  args: { post: makePost(PARAGRAPHS, true) },
}

export const AllBlocks: Story = {
  name: 'All Block Types',
  args: { post: makePost(FULL_GUTENBERG) },
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '720px', margin: '3rem auto', padding: '0 1.5rem' }}>
        <Story />
      </div>
    ),
  ],
}
