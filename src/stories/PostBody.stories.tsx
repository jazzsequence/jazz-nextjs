import type { Meta, StoryObj } from '@storybook/nextjs-vite'

/**
 * PostBody — WordPress block content styles
 *
 * This story documents the CSS classes applied by WordPress's block editor
 * when rendering post content. All styles live in the `.post-body` scope
 * in globals.css. Add new blocks here first; verify in Storybook before
 * updating globals.css.
 */

const meta: Meta = {
  title: 'Design System/PostBody',
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
}

export default meta
type Story = StoryObj

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="post-body max-w-2xl">{children}</div>
)

export const Images: Story = {
  name: 'Images — alignment',
  render: () => (
    <Wrapper>
      <p>Default (centered):</p>
      <figure className="wp-block-image size-large">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://placehold.co/600x400/2d0b4e/00e5cc?text=Default+Image" alt="Default image" />
        <figcaption>This is an image caption using &lt;figcaption&gt;</figcaption>
      </figure>
      <p>With .wp-element-caption:</p>
      <figure className="wp-block-image size-large">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://placehold.co/600x400/0b2d4e/00e5cc?text=WP+Element+Caption" alt="WP element caption" />
        <p className="wp-element-caption">Caption using .wp-element-caption</p>
      </figure>
      <p>Align left:</p>
      <figure className="wp-block-image size-medium alignleft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://placehold.co/300x200/1a0d2e/ff2d78?text=Align+Left" alt="Align left" />
      </figure>
      <p>This text wraps around the left-aligned image. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <div style={{ clear: 'both' }} />
      <p>Align right:</p>
      <figure className="wp-block-image size-medium alignright">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://placehold.co/300x200/1a0d2e/9d5cff?text=Align+Right" alt="Align right" />
      </figure>
      <p>This text wraps around the right-aligned image. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
      <div style={{ clear: 'both' }} />
    </Wrapper>
  ),
}

export const Blockquotes: Story = {
  render: () => (
    <Wrapper>
      <p>WordPress block quote (.wp-block-quote):</p>
      <blockquote className="wp-block-quote">
        <p>Players also told us that their experiences of verbal abuse and blurred relationships with coaches in youth soccer impacted their ability to discern what was out of bounds in the NWSL.</p>
        <cite>NWSL Investigation Report</cite>
      </blockquote>
      <p>Pull quote (.wp-block-pullquote):</p>
      <figure className="wp-block-pullquote">
        <blockquote>
          <p>The future is already here — it&rsquo;s just not evenly distributed.</p>
          <cite>William Gibson</cite>
        </blockquote>
      </figure>
      <p>Twitter/X embed fallback (before widgets.js loads):</p>
      <blockquote className="twitter-tweet" data-width="550" data-dnt="true">
        <p lang="en" dir="ltr">Build a bonfire, build a bonfire, Merritt Paulson at the top, put Wilkinson in the middle, and we&rsquo;ll burn the fucking lot. <a href="#">#RCTID</a></p>
        &mdash; Allie. (@alliesander) <a href="#">October 3, 2022</a>
      </blockquote>
    </Wrapper>
  ),
}

export const CodeBlocks: Story = {
  name: 'Code — inline and block',
  render: () => (
    <Wrapper>
      <p>Inline code: use <code>sudo update-alternatives --config php</code> to switch versions.</p>
      <p>WordPress code block (pre + code):</p>
      <pre className="wp-block-code"><code>{`$ sudo update-alternatives --config php
There are 4 choices for the alternative php (providing /usr/bin/php).

  Selection    Path             Priority   Status
------------------------------------------------------------
* 0            /usr/bin/php8.1   81        auto mode
  1            /usr/bin/php7.4   74        manual mode

Press <enter> to keep the current choice[*], or type selection number:`}</code></pre>
      <p>Plain pre block (older posts):</p>
      <pre>{`function my_function() {
  return 'Hello, world!';
}`}</pre>
    </Wrapper>
  ),
}

export const EmbedSpotify: Story = {
  name: 'Embeds — Spotify (rich/fixed-height)',
  render: () => (
    <Wrapper>
      <p>Spotify embed (is-type-rich, fixed 152px height):</p>
      <figure className="wp-block-embed is-type-rich is-provider-spotify wp-block-embed-spotify wp-embed-aspect-21-9 wp-has-aspect-ratio">
        <div className="wp-block-embed__wrapper">
          <iframe
            title="Spotify Embed: Love Reign O'er Me"
            style={{ borderRadius: '12px' }}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            src="https://open.spotify.com/embed/track/4Mqs0h95KAeNiGp7u4udlt"
          />
        </div>
      </figure>
    </Wrapper>
  ),
}

export const EmbedYouTube: Story = {
  name: 'Embeds — YouTube (16:9 aspect ratio)',
  render: () => (
    <Wrapper>
      <p>YouTube embed (is-type-video, 16:9 aspect ratio):</p>
      <figure className="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio">
        <div className="wp-block-embed__wrapper">
          <iframe
            title="YouTube video"
            width="560"
            height="315"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </figure>
    </Wrapper>
  ),
}

export const Columns: Story = {
  name: 'Columns (wp-block-columns)',
  render: () => (
    <Wrapper>
      <div className="wp-block-columns">
        <div className="wp-block-column">
          <h3>Column One</h3>
          <p>Content in the first column. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        </div>
        <div className="wp-block-column">
          <h3>Column Two</h3>
          <p>Content in the second column. Sed do eiusmod tempor incididunt ut labore et dolore.</p>
        </div>
        <div className="wp-block-column">
          <h3>Column Three</h3>
          <p>Content in the third column. Ut enim ad minim veniam, quis nostrud exercitation.</p>
        </div>
      </div>
    </Wrapper>
  ),
}

export const AudioVideo: Story = {
  name: 'Audio and Video blocks',
  render: () => (
    <Wrapper>
      <p>Audio block (.wp-block-audio):</p>
      <figure className="wp-block-audio">
        <audio controls src="https://www.w3schools.com/html/horse.ogg">
          <track kind="captions" />
        </audio>
        <figcaption>A sample audio file</figcaption>
      </figure>
      <p>Video block (.wp-block-video):</p>
      <figure className="wp-block-video">
        <video controls width="640" height="360">
          <track kind="captions" />
          <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
        </video>
        <figcaption>A sample video file</figcaption>
      </figure>
    </Wrapper>
  ),
}

export const Separator: Story = {
  render: () => (
    <Wrapper>
      <p>Before separator.</p>
      <hr className="wp-block-separator" />
      <p>After separator.</p>
    </Wrapper>
  ),
}

export const AllBlocks: Story = {
  name: 'All blocks (overview)',
  render: () => (
    <Wrapper>
      <h2>Heading 2</h2>
      <h3>Heading 3</h3>
      <p>Paragraph with <a href="#">a link</a> and <code>inline code</code> and <strong>bold text</strong> and <em>italic text</em>.</p>
      <ul>
        <li>Unordered list item one</li>
        <li>Unordered list item two</li>
        <li>Unordered list item three</li>
      </ul>
      <ol>
        <li>Ordered list item one</li>
        <li>Ordered list item two</li>
        <li>Ordered list item three</li>
      </ol>
      <blockquote className="wp-block-quote">
        <p>This is a block quote. It should stand out from the surrounding text.</p>
        <cite>Citation Author</cite>
      </blockquote>
      <pre className="wp-block-code"><code>{`const greeting = "Hello, world!"`}</code></pre>
      <hr className="wp-block-separator" />
      <figure className="wp-block-pullquote">
        <blockquote>
          <p>This is a pull quote — it emphasizes a key statement.</p>
        </blockquote>
      </figure>
    </Wrapper>
  ),
}
