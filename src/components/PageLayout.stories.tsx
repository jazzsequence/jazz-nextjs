/**
 * PageLayout — full page context: Navigation + main content + Footer.
 *
 * These stories show the overall page shell and layout concerns:
 * - Sticky header behaviour
 * - Main content width and padding
 * - Footer positioning
 * - Spacing between greeting card, post grid, and footer
 *
 * Note: Navigation and Footer are rendered with static mock data here.
 * The actual components use live WordPress data on the deployed site.
 */
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Navigation from './Navigation'
import Pagination from './Pagination'
import PostsList from './PostsList'
import type { WPMenuItem, WPPost } from '@/lib/wordpress/types'

// ── Mock data ─────────────────────────────────────────────────────────────────

const menuBase = { attr_title: '', description: '', type: 'custom', type_label: 'Custom Link', object: 'custom', object_id: 0, parent: 0, target: '', classes: [], xfn: [], invalid: false, meta: {}, menus: 1 }

const menuItems: WPMenuItem[] = [
  { ...menuBase, id: 1, title: { rendered: 'Home' }, url: 'https://jazzsequence.com', menu_order: 1 },
  { ...menuBase, id: 2, title: { rendered: 'Posts' }, url: 'https://jazzsequence.com/posts', menu_order: 2 },
  { ...menuBase, id: 3, title: { rendered: 'Music' }, url: 'https://jazzsequence.com/music', menu_order: 3 },
  { ...menuBase, id: 4, title: { rendered: 'Games' }, url: 'https://jazzsequence.com/games', menu_order: 4 },
  { ...menuBase, id: 5, title: { rendered: 'About' }, url: 'https://jazzsequence.com/about', menu_order: 5 },
]

function makePost(id: number, slug: string, title: string): WPPost {
  return {
    id,
    type: 'post',
    slug,
    title: { rendered: title },
    excerpt: { rendered: `<p>This is the excerpt for the post titled "${title}". It gives readers a brief idea of what the post covers.</p>` },
    content: { rendered: '<p>Full content here.</p>' },
    date: `2026-${String(id).padStart(2, '0')}-15T10:00:00`,
    date_gmt: `2026-${String(id).padStart(2, '0')}-15T10:00:00`,
    modified: `2026-${String(id).padStart(2, '0')}-15T10:00:00`,
    modified_gmt: `2026-${String(id).padStart(2, '0')}-15T10:00:00`,
    status: 'publish',
    link: `https://jazzsequence.com/${slug}`,
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
}

const posts: WPPost[] = [
  makePost(1, 'building-a-headless-wordpress-frontend', 'Building a Headless WordPress Frontend with Next.js and MCP'),
  makePost(2, 'teh-s3quence-016-spring-mix', 'teh s3quence 016 — spring mix'),
  makePost(3, 'twilight-imperium-review', 'Twilight Imperium: A Game That Consumes Weekends'),
  makePost(4, 'ai-development-tools', 'What Makes AI Development Tools Actually Understand Your Site'),
  makePost(5, 'music-production-notes', 'Music Production Notes — February 2026'),
  makePost(6, 'board-game-collection-2026', 'My Board Game Collection: 2026 Edition'),
  makePost(7, 'nextjs-isr-patterns', 'ISR Patterns for WordPress Content in Next.js'),
  makePost(8, 'teh-s3quence-015-halloween', 'teh s3quence 015 — HALLOWEEN EDITION'),
  makePost(9, 'codenames-strategy', 'Codenames: Strategy and Team Dynamics'),
  makePost(10, 'pantheon-nextjs-deployment', 'Deploying Next.js on Pantheon — Lessons Learned'),
  makePost(11, 'electronic-music-influences', 'Electronic Music Influences: What Shaped My Sound'),
  makePost(12, 'hero-realms-expansion', 'Hero Realms: The Character Pack Expansion Review'),
]

// ── Mock Footer that works synchronously in Storybook ─────────────────────────

function MockFooter() {
  return (
    <footer className="bg-brand-header border-t border-brand-border mt-16">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-brand-border">
          <span className="font-mono font-bold text-brand-cyan text-sm">jazzsequence</span>
          <span className="font-heading text-brand-muted text-sm">&copy; 2026 Chris Reynolds</span>
        </div>
      </div>
    </footer>
  )
}

// ── Stories ───────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'Design System/PageLayout',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
    a11y: { test: 'todo' }, // Page-level layouts tested via E2E a11y spec instead
  },
}
export default meta

/** Homepage: greeting hero + post grid + pagination */
export const Homepage: StoryObj = {
  name: 'Homepage (post grid)',
  render: () => (
    <div className="min-h-screen bg-brand-bg">
      <Navigation menuItems={menuItems} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Greeting card — retrowave featured card */}
        <section
          data-testid="greeting-card"
          className="relative rounded-xl overflow-hidden border border-brand-border mb-12"
          style={{ background: 'linear-gradient(135deg, #0d0d1a 0%, #1a0d2e 40%, #0d1a2e 100%)' }}
        >
          <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(#2a2a4a33 1px, transparent 1px), linear-gradient(90deg, #2a2a4a33 1px, transparent 1px)',
            backgroundSize: '2rem 2rem',
          }} />
          <div className="relative px-8 py-12 sm:px-12">
            <h1 className="font-heading text-brand-text text-4xl sm:text-5xl font-bold mb-4 leading-tight">
              Good afternoon, I&rsquo;m Chris.
            </h1>
            <div className="text-brand-text-sub text-lg leading-relaxed">
              <p>Welcome to jazzsequence.com — music, games, writing, and tech.</p>
            </div>
          </div>
        </section>

        <PostsList posts={posts} />
        <Pagination currentPage={1} totalPages={5} basePath="/" />
      </main>
      <MockFooter />
    </div>
  ),
}

/** Posts archive page */
export const PostsArchive: StoryObj = {
  render: () => (
    <div className="min-h-screen bg-brand-bg">
      <Navigation menuItems={menuItems} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading text-4xl font-bold text-brand-text mb-8">Posts</h1>
        <PostsList posts={posts} />
        <Pagination currentPage={2} totalPages={5} basePath="/posts" />
      </main>
      <MockFooter />
    </div>
  ),
}

/** Navigation states */
export const NavigationLoading: StoryObj = {
  name: 'Navigation — Loading State',
  render: () => (
    <div className="min-h-screen bg-brand-bg">
      <Navigation menuItems={[]} isLoading={true} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-brand-muted font-heading">Page content would appear here.</p>
      </main>
    </div>
  ),
}

export const NavigationError: StoryObj = {
  name: 'Navigation — Error State',
  render: () => (
    <div className="min-h-screen bg-brand-bg">
      <Navigation menuItems={[]} error="Failed to fetch menu items" />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-brand-muted font-heading">Page content would appear here.</p>
      </main>
    </div>
  ),
}
