import { describe, it, expect, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import SocialScriptLoader from '@/components/SocialScriptLoader';

// Clean up any script tags injected by the loader between tests
afterEach(() => {
  document.head.querySelectorAll('script[data-social-embed]').forEach(s => s.remove());
});

describe('SocialScriptLoader', () => {
  it('injects Twitter widget script when content has twitter-tweet', () => {
    render(<SocialScriptLoader content='<blockquote class="twitter-tweet"><p>hello</p></blockquote>' />);
    expect(document.head.querySelector('script[data-social-embed="twitter"]')).toBeInTheDocument();
  });

  it('injects TikTok embed script when content has tiktok-embed', () => {
    render(<SocialScriptLoader content='<blockquote class="tiktok-embed" cite="https://tiktok.com/@user/video/123"></blockquote>' />);
    expect(document.head.querySelector('script[data-social-embed="tiktok"]')).toBeInTheDocument();
  });

  it('injects Instagram embed script when content has instagram-media', () => {
    render(<SocialScriptLoader content='<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/abc/"></blockquote>' />);
    expect(document.head.querySelector('script[data-social-embed="instagram"]')).toBeInTheDocument();
  });

  it('injects multiple scripts when content has multiple platform embeds', () => {
    const content = `
      <blockquote class="twitter-tweet"><p>tweet</p></blockquote>
      <blockquote class="tiktok-embed" cite="..."></blockquote>
    `;
    render(<SocialScriptLoader content={content} />);
    expect(document.head.querySelector('script[data-social-embed="twitter"]')).toBeInTheDocument();
    expect(document.head.querySelector('script[data-social-embed="tiktok"]')).toBeInTheDocument();
  });

  it('injects no scripts when content has no social embeds', () => {
    render(<SocialScriptLoader content='<p>Just a regular paragraph with no social embeds.</p>' />);
    expect(document.head.querySelectorAll('script[data-social-embed]')).toHaveLength(0);
  });

  it('does not inject a duplicate script if already present in head', () => {
    // Pre-inject a Twitter script to simulate already-loaded state
    const existing = document.createElement('script');
    existing.setAttribute('data-social-embed', 'twitter');
    existing.src = 'https://platform.twitter.com/widgets.js';
    document.head.appendChild(existing);

    render(<SocialScriptLoader content='<blockquote class="twitter-tweet"><p>hello</p></blockquote>' />);

    expect(document.head.querySelectorAll('script[data-social-embed="twitter"]')).toHaveLength(1);
  });

  it('renders null (no visible DOM node)', () => {
    const { container } = render(<SocialScriptLoader content='<p>plain</p>' />);
    expect(container.firstChild).toBeNull();
  });

  it('injects Reddit embed script when content has reddit-embed-bq', () => {
    render(<SocialScriptLoader content='<blockquote class="reddit-embed-bq"><a href="https://www.reddit.com/r/test/comments/abc/">Post</a></blockquote>' />);
    expect(document.head.querySelector('script[data-social-embed="reddit"]')).toBeInTheDocument();
  });

  it('injects Imgur embed script when content has imgur-embed-pub', () => {
    render(<SocialScriptLoader content='<blockquote class="imgur-embed-pub" lang="en" data-id="a/C3kGhJZ"><a href="https://imgur.com/a/C3kGhJZ">View post on imgur.com</a></blockquote>' />);
    expect(document.head.querySelector('script[data-social-embed="imgur"]')).toBeInTheDocument();
  });

  it('injects Tumblr post.js script when content has tumblr-post', () => {
    render(<SocialScriptLoader content='<div class="tumblr-post" data-href="https://embed.tumblr.com/embed/post/t:abc/123"><a href="https://example.tumblr.com/post/123">View on Tumblr</a></div>' />);
    expect(document.head.querySelector('script[data-social-embed="tumblr"]')).toBeInTheDocument();
  });

  it('injects Flickr embed script when content has data-flickr-embed', () => {
    render(<SocialScriptLoader content='<a data-flickr-embed="true" href="https://www.flickr.com/photos/jazzs3quence/">photos</a>' />);
    expect(document.head.querySelector('script[data-social-embed="flickr"]')).toBeInTheDocument();
  });
});
