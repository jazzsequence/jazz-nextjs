'use client'

import { useEffect } from 'react'
import type { Meta, StoryObj, Decorator } from '@storybook/nextjs-vite'
import { EmbedBlock } from '@/components/embeds/EmbedBlock'

/**
 * Embeds — All WordPress core oEmbed providers
 *
 * Documents the CSS classes and markup WordPress generates for every
 * supported oEmbed provider. All styles live in the `.post-body` scope
 * in globals.css.
 *
 * Stories marked [Requires URL] need a specific content URL to render live
 * content — the CSS layout and class structure are still documented.
 *
 * Stories marked [Defunct] document providers removed from WordPress core
 * or whose services have shut down; CSS classes remain for backward compat.
 */

const meta: Meta = {
  title: 'Design System/Embeds',
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

const InfoCard = ({ provider, cls, status, note }: {
  provider: string; cls: string; status: 'requires-url' | 'defunct'; note: string
}) => (
  <div style={{ display: 'flex', justifyContent: 'center' }}>
    <div style={{
      maxWidth: '600px', width: '100%',
      background: status === 'defunct' ? 'rgba(255,45,120,0.05)' : 'var(--color-surface)',
      border: `1px solid ${status === 'defunct' ? 'rgba(255,45,120,0.3)' : 'var(--color-border)'}`,
      borderRadius: '0.75rem', padding: '1.25rem', fontFamily: 'var(--font-heading)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', textTransform: 'uppercase' as const,
          letterSpacing: '0.08em', padding: '0.2rem 0.5rem', borderRadius: '0.25rem',
          background: status === 'defunct' ? 'rgba(255,45,120,0.15)' : 'rgba(0,229,204,0.1)',
          color: status === 'defunct' ? 'var(--color-magenta)' : 'var(--color-cyan)',
        }}>{status === 'defunct' ? 'Defunct' : 'Requires URL'}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-muted)' }}>{provider}</span>
      </div>
      <p style={{ color: 'var(--color-text-sub)', fontSize: '0.875rem', margin: '0 0 0.5rem' }}>{note}</p>
      <p style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', margin: 0 }}>
        CSS: <code style={{ color: 'var(--color-cyan)' }}>.{cls}</code>
      </p>
    </div>
  </div>
)

// ── Decorators ────────────────────────────────────────────────────────────────

const withTwitterScript: Decorator = (Story) => {
  useEffect(() => {
    const w = window as typeof window & { twttr?: { widgets?: { load?: () => void } } }
    if (w.twttr?.widgets?.load) { w.twttr.widgets.load(); return }
    if (!document.querySelector('script[data-social-embed="twitter"]')) {
      const s = document.createElement('script')
      s.src = 'https://platform.twitter.com/widgets.js'
      s.async = true; s.charset = 'utf-8'
      s.setAttribute('data-social-embed', 'twitter')
      document.head.appendChild(s)
    }
  }, [])
  return <Story />
}

const withRedditScript: Decorator = (Story) => {
  useEffect(() => {
    const w = window as typeof window & { reddit?: { embed?: { process?: () => void } } }
    if (w.reddit?.embed?.process) { w.reddit.embed.process(); return }
    if (!document.querySelector('script[data-social-embed="reddit"]')) {
      const s = document.createElement('script')
      s.src = 'https://embed.reddit.com/widgets.js'
      s.async = true; s.charset = 'UTF-8'
      s.setAttribute('data-social-embed', 'reddit')
      document.head.appendChild(s)
    }
  }, [])
  return <Story />
}

const withTumblrScript: Decorator = (Story) => {
  useEffect(() => {
    const w = window as typeof window & { tumblr?: { aus?: { process?: () => void } } }
    if (w.tumblr?.aus?.process) { w.tumblr.aus.process(); return }
    if (!document.querySelector('script[data-social-embed="tumblr"]')) {
      const s = document.createElement('script')
      s.src = 'https://assets.tumblr.com/post.js'
      s.async = true
      s.setAttribute('data-social-embed', 'tumblr')
      document.head.appendChild(s)
    }
  }, [])
  return <Story />
}

const withImgurScript: Decorator = (Story) => {
  useEffect(() => {
    if (!document.querySelector('script[data-social-embed="imgur"]')) {
      const s = document.createElement('script')
      s.src = 'https://s.imgur.com/min/embed.js'
      s.async = true; s.charset = 'utf-8'
      s.setAttribute('data-social-embed', 'imgur')
      document.head.appendChild(s)
    }
  }, [])
  return <Story />
}

const withFlickrScript: Decorator = (Story) => {
  useEffect(() => {
    if (!document.querySelector('script[data-social-embed="flickr"]')) {
      const s = document.createElement('script')
      s.src = 'https://embedr.flickr.com/assets/client-code.js'
      s.async = true; s.charset = 'utf-8'
      s.setAttribute('data-social-embed', 'flickr')
      document.head.appendChild(s)
    }
  }, [])
  return <Story />
}

const withInstagramScript: Decorator = (Story) => {
  useEffect(() => {
    const w = window as typeof window & { instgrm?: { Embeds?: { process?: () => void } } }
    if (w.instgrm?.Embeds?.process) { w.instgrm.Embeds.process(); return }
    if (!document.querySelector('script[data-social-embed="instagram"]')) {
      const s = document.createElement('script')
      s.src = 'https://www.instagram.com/embed.js'
      s.async = true
      s.setAttribute('data-social-embed', 'instagram')
      document.head.appendChild(s)
    }
  }, [])
  return <Story />
}

// ── VIDEO ─────────────────────────────────────────────────────────────────────

export const YouTube: Story = {
  name: 'Video — YouTube (16:9)',
  render: () => (
    <Wrapper>
      <EmbedBlock provider="youtube" type="video" aspectRatio="16-9">
        <iframe title="YouTube" src="https://www.youtube.com/embed/dQw4w9WgXcQ"
          frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </EmbedBlock>
    </Wrapper>
  ),
}

export const Vimeo: Story = {
  name: 'Video — Vimeo (16:9)',
  render: () => (
    <Wrapper>
      <EmbedBlock provider="vimeo" type="video" aspectRatio="16-9">
        <iframe title="Vimeo — Big Buck Bunny" src="https://player.vimeo.com/video/76979871"
          frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
      </EmbedBlock>
    </Wrapper>
  ),
}

export const DailyMotion: Story = {
  name: 'Video — DailyMotion (16:9)',
  render: () => (
    <Wrapper>
      <EmbedBlock provider="dailymotion" type="video" aspectRatio="16-9">
        <iframe title="DailyMotion" src="https://www.dailymotion.com/embed/video/x7tgad0"
          frameBorder="0" allowFullScreen allow="autoplay" />
      </EmbedBlock>
    </Wrapper>
  ),
}

export const VideoPress: Story = {
  name: 'Video — VideoPress (WordPress-hosted)',
  render: () => (
    <Wrapper>
      {/* VideoPress GUID 6d5m67oo — WP Theme Development 101 talk by @jazzsequence */}
      <EmbedBlock provider="videopress" type="video" aspectRatio="16-9">
        <iframe title="VideoPress — WP Theme Development 101"
          src="https://video.wordpress.com/embed/6d5m67oo?hd=1&cover=1"
          frameBorder="0" allowFullScreen allow="clipboard-write" />
      </EmbedBlock>
    </Wrapper>
  ),
}

export const WordPressTV: Story = {
  name: 'Video — WordPress.tv',
  render: () => (
    <Wrapper>
      {/* Real WordPress.tv talk: Chris Reynolds — WP Theme Development 101, WordCamp SLC 2011.
          WordPress.tv uses VideoPress under the hood; embed via VideoPress GUID 6d5m67oo. */}
      <EmbedBlock provider="wordpress-tv" type="video" aspectRatio="16-9">
        <iframe title="WordPress.tv — WP Theme Development 101"
          src="https://video.wordpress.com/embed/6d5m67oo?hd=1&cover=1"
          frameBorder="0" allowFullScreen allow="clipboard-write" />
      </EmbedBlock>
    </Wrapper>
  ),
}

// ── AUDIO ─────────────────────────────────────────────────────────────────────

export const Spotify: Story = {
  name: 'Audio — Spotify (fixed-height)',
  render: () => (
    <Wrapper>
      <EmbedBlock provider="spotify" type="rich">
        <iframe title="Spotify — Love Reign O'er Me" style={{ borderRadius: '12px' }}
          width="100%" height="152" frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy" src="https://open.spotify.com/embed/track/4Mqs0h95KAeNiGp7u4udlt" />
      </EmbedBlock>
    </Wrapper>
  ),
}

export const SoundCloud: Story = {
  name: 'Audio — SoundCloud (fixed-height)',
  render: () => (
    <Wrapper>
      <EmbedBlock provider="soundcloud" type="rich">
        <iframe title="SoundCloud" width="100%" height="166" scrolling="no" frameBorder="no"
          src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/293&color=%239d5cff" />
      </EmbedBlock>
    </Wrapper>
  ),
}

export const Mixcloud: Story = {
  name: 'Audio — Mixcloud (fixed-height)',
  render: () => (
    <Wrapper>
      {/* jazzsequence Mixcloud profile — https://www.mixcloud.com/jazzsequence/ */}
      <EmbedBlock provider="mixcloud" type="rich">
        <iframe title="Mixcloud — jazzsequence" width="100%" height="120" frameBorder="0"
          src="https://www.mixcloud.com/widget/iframe/?hide_cover=1&feed=%2Fjazzsequence%2F" />
      </EmbedBlock>
    </Wrapper>
  ),
}

export const ReverbNation: Story = {
  name: 'Audio — ReverbNation',
  render: () => (
    <Wrapper>
      {/* jazzsequence — "Lisbeth" (Colin C. Allrich Soundtrack), artist 1364844, song 10539893.
          pwc[size]=small produces the compact horizontal player (150px). */}
      <EmbedBlock provider="reverbnation" type="rich">
        <iframe title="ReverbNation — Lisbeth" width="100%" height="150" frameBorder="0" scrolling="no"
          src="https://www.reverbnation.com/widget_code/html_widget/artist_1364844?widget_id=55&pwc[song_ids]=10539893&context_type=song&pwc[size]=small"
          style={{ display: 'block', minWidth: '100%', maxWidth: '100%' }} />
      </EmbedBlock>
    </Wrapper>
  ),
}

// ── SOCIAL ────────────────────────────────────────────────────────────────────

export const Twitter: Story = {
  name: 'Social — Twitter/X',
  decorators: [withTwitterScript],
  render: () => (
    <Wrapper>
      <blockquote className="twitter-tweet" data-dnt="true">
        <p lang="en" dir="ltr">
          To those fleeing persecution, terror &amp; war, Canadians will welcome you, regardless
          of your faith. Diversity is our strength{' '}
          <a href="https://twitter.com/hashtag/WelcomeToCanada">#WelcomeToCanada</a>
        </p>
        &mdash; Justin Trudeau (@JustinTrudeau){' '}
        <a href="https://twitter.com/JustinTrudeau/status/825438460265762816">January 28, 2017</a>
      </blockquote>
    </Wrapper>
  ),
}

export const TikTok: Story = {
  name: 'Social — TikTok',
  render: () => (
    <Wrapper>
      <EmbedBlock provider="tiktok" type="rich">
        <iframe src="https://www.tiktok.com/embed/v2/7106594312292453675"
          style={{ maxWidth: '605px', minWidth: '325px', width: '100%', height: '739px', border: 'none' }}
          allowFullScreen allow="encrypted-media" title="TikTok embed" />
      </EmbedBlock>
    </Wrapper>
  ),
}

export const Instagram: Story = {
  name: 'Social — Instagram',
  decorators: [withInstagramScript],
  render: () => (
    <Wrapper>
      {/* jazzsequence Instagram post DT6-jtQFc5d.
          Uses Instagram's native blockquote+embed.js pattern (auto-sizes). */}
      <EmbedBlock provider="instagram" type="rich" wrapperStyle={{ display: 'flex', justifyContent: 'center' }}>
        <blockquote
          className="instagram-media"
          data-instgrm-permalink="https://www.instagram.com/p/DT6-jtQFc5d/"
          data-instgrm-version="14"
          style={{ margin: '0', maxWidth: '540px', minWidth: '326px', width: '540px' }}
        >
          <a href="https://www.instagram.com/p/DT6-jtQFc5d/">View this post on Instagram</a>
        </blockquote>
      </EmbedBlock>
    </Wrapper>
  ),
}

export const Tumblr: Story = {
  name: 'Social — Tumblr',
  decorators: [withTumblrScript],
  render: () => (
    <Wrapper>
      {/* jazzsequence Tumblr post 743493549704839168.
          Uses Tumblr's native div+post.js pattern (matches WordPress oEmbed output).
          post.js creates the iframe and auto-resizes it via postMessage — full post
          (image, caption, tags) is visible. In production, SocialScriptLoader handles
          the script injection when it detects .tumblr-post in post content. */}
      <EmbedBlock provider="tumblr" type="rich" wrapperStyle={{ display: 'flex', justifyContent: 'center' }}>
        <div
          className="tumblr-post"
          data-href="https://embed.tumblr.com/embed/post/t:bBEDLlUJfJiICCV5AotZFA/743493549704839168"
          data-did="da39a3ee5e6b4b0d3255bfef95601890afd80709"
        >
          <a href="https://jazzsequence.tumblr.com/post/743493549704839168">
            View on Tumblr
          </a>
        </div>
      </EmbedBlock>
    </Wrapper>
  ),
}

export const Reddit: Story = {
  name: 'Social — Reddit',
  decorators: [withRedditScript],
  render: () => (
    <Wrapper>
      {/* r/Wordpress — "Making Composer-based WordPress fair", post 1m2i4mi (u/jazzs3quence).
          Uses Reddit's blockquote + widgets.js pattern (same as WordPress oEmbed output). */}
      <EmbedBlock provider="reddit" type="rich">
        <blockquote className="reddit-embed-bq" style={{ height: '316px', maxWidth: '640px', margin: '0 auto', display: 'block' }}>
          <a href="https://www.reddit.com/r/Wordpress/comments/1m2i4mi/making_composerbased_wordpress_fair/">
            Making Composer-based WordPress FAIR
          </a>
          <br />
          by <a href="https://www.reddit.com/user/jazzs3quence/">u/jazzs3quence</a>{' '}
          in <a href="https://www.reddit.com/r/Wordpress/">r/Wordpress</a>
        </blockquote>
      </EmbedBlock>
    </Wrapper>
  ),
}

// ── DOCUMENTS ─────────────────────────────────────────────────────────────────

export const Issuu: Story = {
  name: 'Documents — Issuu',
  render: () => (
    <Wrapper>
      <EmbedBlock provider="issuu" type="rich" aspectRatio="4-3">
        <InfoCard provider="Issuu" cls="wp-block-embed-issuu" status="requires-url"
          note="Issuu embeds require a document URL + username. The iframe src is https://e.issuu.com/embed.html?d={slug}&u={username}. Paste any issuu.com/{user}/docs/{doc} URL in WordPress." />
      </EmbedBlock>
    </Wrapper>
  ),
}

export const Scribd: Story = {
  name: 'Documents — Scribd',
  render: () => (
    <Wrapper>
      <EmbedBlock provider="scribd" type="rich" aspectRatio="4-3">
        <InfoCard provider="Scribd" cls="wp-block-embed-scribd" status="requires-url"
          note="Scribd embeds require a document ID. The iframe src is https://www.scribd.com/embeds/{id}/content. Paste any scribd.com/document/{id} URL in WordPress." />
      </EmbedBlock>
    </Wrapper>
  ),
}

export const SlideShare: Story = {
  name: 'Documents — SlideShare',
  render: () => (
    <Wrapper>
      {/* jazzsequence — "Drop Kick Imposter Syndrome" — embed key ehBH03d9jRfjsY */}
      <EmbedBlock provider="slideshare" type="rich">
        <iframe title="SlideShare — Drop Kick Imposter Syndrome"
          src="https://www.slideshare.net/slideshow/embed_code/key/ehBH03d9jRfjsY"
          width="510" height="420" frameBorder="0"
          marginWidth={0} marginHeight={0} scrolling="no"
          style={{ display: 'block', margin: '0 auto', maxWidth: '510px', border: '1px solid #CCC', marginBottom: '5px' }}
          allowFullScreen />
      </EmbedBlock>
    </Wrapper>
  ),
}

// ── PHOTOS ────────────────────────────────────────────────────────────────────

export const Flickr: Story = {
  name: 'Photos — Flickr',
  decorators: [withFlickrScript],
  render: () => (
    <Wrapper>
      {/* jazzs3quence Flickr photostream — oEmbed format (a[data-flickr-embed] + client-code.js) */}
      <EmbedBlock provider="flickr" type="photo">
        <a
          data-flickr-embed="true"
          href="https://www.flickr.com/photos/jazzs3quence/"
          title="jazzs3quence"
          style={{ display: 'block', margin: '0 auto', maxWidth: '800px' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://live.staticflickr.com/678/21365746680_7b61095a00_b.jpg"
            width="800" height="600"
            alt="jazzs3quence on Flickr"
            style={{ width: '100%', height: 'auto', margin: 0 }}
          />
        </a>
      </EmbedBlock>
    </Wrapper>
  ),
}

export const Imgur: Story = {
  name: 'Photos — Imgur',
  decorators: [withImgurScript],
  render: () => (
    <Wrapper>
      {/* imgur.com/a/C3kGhJZ — blockquote+script (oEmbed format, auto-sizes to 540×500) */}
      <EmbedBlock provider="imgur" type="rich" wrapperStyle={{ display: 'flex', justifyContent: 'center' }}>
        <blockquote
          className="imgur-embed-pub"
          lang="en"
          data-id="a/C3kGhJZ"
          style={{ margin: '0', maxWidth: '540px', width: '540px' }}
        >
          <a href="https://imgur.com/a/C3kGhJZ">View post on imgur.com</a>
        </blockquote>
      </EmbedBlock>
    </Wrapper>
  ),
}

export const SmugMug: Story = {
  name: 'Photos — SmugMug',
  render: () => (
    <Wrapper>
      <EmbedBlock provider="smugmug" type="rich">
        <InfoCard provider="SmugMug" cls="wp-block-embed-smugmug" status="requires-url"
          note="SmugMug embeds require a SmugMug account with a public gallery/photo URL. Paste any smugmug.com/{user}/... URL in WordPress." />
      </EmbedBlock>
    </Wrapper>
  ),
}

// ── OTHER ─────────────────────────────────────────────────────────────────────

export const Kickstarter: Story = {
  name: 'Other — Kickstarter',
  render: () => (
    <Wrapper>
      {/* Pebble E-Paper Watch — Kickstarter project 1523379957.
          card.html = project card (title, image, funding progress).
          220px is Kickstarter's fixed card width; height 420 shows the full card. */}
      <EmbedBlock provider="kickstarter" type="rich" wrapperStyle={{ display: 'flex', justifyContent: 'center' }}>
        <iframe title="Kickstarter — Pebble E-Paper Watch"
          src="https://www.kickstarter.com/projects/1523379957/pebble-e-paper-watch-for-iphone-and-android/widget/card.html"
          width="220" height="420" frameBorder="0" scrolling="no"
          style={{ width: '220px', flexShrink: 0, borderRadius: '0.5rem' }} />
      </EmbedBlock>
    </Wrapper>
  ),
}

export const Meetup: Story = {
  name: 'Other — Meetup [Defunct]',
  render: () => (
    <Wrapper>
      <EmbedBlock provider="meetup-com" type="rich">
        <InfoCard provider="Meetup.com" cls="wp-block-embed-meetup-com" status="defunct"
          note="Meetup.com removed their oEmbed endpoint. WordPress still generates this CSS class for previously embedded events, but the iframe will not load." />
      </EmbedBlock>
    </Wrapper>
  ),
}

export const Crowdsignal: Story = {
  name: 'Other — Crowdsignal (polls)',
  render: () => (
    <Wrapper>
      <EmbedBlock provider="crowdsignal" type="rich">
        <InfoCard provider="Crowdsignal" cls="wp-block-embed-crowdsignal" status="requires-url"
          note="Crowdsignal (formerly PollDaddy) embeds require a poll URL from your account. Paste any crowdsignal.com/polls/{id} or polldaddy.com/poll/{id} URL in WordPress." />
      </EmbedBlock>
    </Wrapper>
  ),
}

export const Screencast: Story = {
  name: 'Other — Screencast [Defunct]',
  render: () => (
    <Wrapper>
      <EmbedBlock provider="screencast" type="video" aspectRatio="16-9">
        <InfoCard provider="Screencast (TechSmith)" cls="wp-block-embed-screencast" status="defunct"
          note="Screencast.com was shut down in 2023. WordPress still generates this CSS class for previously embedded screen recordings." />
      </EmbedBlock>
    </Wrapper>
  ),
}

export const AmazonKindle: Story = {
  name: 'Other — Amazon Kindle',
  render: () => (
    <Wrapper>
      <EmbedBlock provider="amazon-kindle" type="rich">
        <InfoCard provider="Amazon Kindle" cls="wp-block-embed-amazon-kindle" status="requires-url"
          note="Kindle embeds require a book ASIN and the book must have a public preview enabled. Paste any amazon.com/dp/{ASIN} or read.amazon.com URL in WordPress." />
      </EmbedBlock>
    </Wrapper>
  ),
}

// ── WORDPRESS NATIVE POST EMBED ───────────────────────────────────────────────

export const WordPressPost: Story = {
  name: 'WordPress — Native post embed',
  render: () => (
    <Wrapper>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-sub)', marginBottom: '1rem' }}>
        Design reference for <code>figure.is-type-wp-embed</code> and for Pantheon.io article embeds
        on /articles. Layout matches jazzsequence.com/articles: title → excerpt → favicon + source.
      </p>
      <figure className="wp-block-embed is-type-wp-embed wp-block-embed-wordpress">
        {/* Note: wp-embed uses a non-standard is-type-wp-embed class; EmbedBlock is not used here
            because 'wp-embed' is not a provider — it's a content type with its own class pattern. */}
        <div className="wp-block-embed__wrapper">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/posts/teaching-an-ai-to-read-my-website-over-mcp"
            style={{
              display: 'block', maxWidth: '600px', margin: '0 auto',
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: '0.75rem', overflow: 'hidden', textDecoration: 'none',
              fontFamily: 'var(--font-heading)',
            }}
          >
            <div style={{ height: '180px', overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://sfo2.digitaloceanspaces.com/cdn.jazzsequence/wp-content/uploads/2026/03/16122320/mcp.png"
                alt="MCP article"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ padding: '0.875rem 1rem 1rem' }}>
              <h3 style={{
                color: 'var(--color-text)', fontSize: '1rem', fontWeight: 700,
                margin: '0 0 0.4rem', lineHeight: 1.35, textAlign: 'left',
              }}>
                Teaching an AI to Read My Website (Over MCP)
              </h3>
              <p style={{
                color: 'var(--color-text-sub)', fontSize: '0.8125rem',
                margin: '0 0 0.875rem', lineHeight: 1.5, textAlign: 'left',
              }}>
                For the last couple weeks, I&rsquo;ve been building a headless Next.js frontend
                for this site. What&rsquo;s less straightforward is how to make AI development
                tools actually understand the site they&rsquo;re building against.
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                borderTop: '1px solid var(--color-border)', paddingTop: '0.625rem',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://sfo2.digitaloceanspaces.com/cdn.jazzsequence/wp-content/uploads/2025/11/10154604/cropped-chris-hiking-dall-e-2021-1024x1024-1.jpg"
                  alt=""
                  width={24} height={24}
                  style={{ flexShrink: 0, borderRadius: '50%', objectFit: 'cover', margin: 0, display: 'block' }}
                />
                <span style={{
                  color: 'var(--color-muted)', fontSize: '0.8125rem',
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.02em',
                }}>
                  jazzsequence.com
                </span>
              </div>
            </div>
          </a>
        </div>
      </figure>
    </Wrapper>
  ),
}

// ── DEPRECATED / DEFUNCT ──────────────────────────────────────────────────────

export const Defunct: Story = {
  name: 'Defunct providers',
  render: () => (
    <Wrapper>
      <p style={{ color: 'var(--color-text-sub)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        These WordPress core oEmbed providers are shut down. WordPress still outputs their CSS classes
        for backward compatibility — the base <code>.wp-block-embed</code> styles apply.
      </p>
      {[
        { provider: 'Animoto', cls: 'wp-block-embed-animoto', note: 'Video slideshow creator — shut down 2023' },
        { provider: 'Funny Or Die', cls: 'wp-block-embed-funny-or-die', note: 'Comedy video site — service ended' },
        { provider: 'CollegeHumor', cls: 'wp-block-embed-college-humor', note: 'Rebranded to Dropout; oEmbed removed' },
        { provider: 'Cloudup', cls: 'wp-block-embed-cloudup', note: 'File sharing by Automattic — shut down 2021' },
        { provider: 'Photobucket', cls: 'wp-block-embed-photobucket', note: 'Moved to paid-only hotlinking; embeds broken' },
        { provider: 'Blip.tv', cls: 'wp-block-embed-blip-tv', note: 'Video hosting — shut down 2015' },
      ].map(({ provider, cls, note }) => (
        <div key={cls} style={{ marginBottom: '0.75rem' }}>
          <InfoCard provider={provider} cls={cls} status="defunct" note={note} />
        </div>
      ))}
    </Wrapper>
  ),
}
