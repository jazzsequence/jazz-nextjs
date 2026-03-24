import type { Meta, StoryObj, Decorator } from '@storybook/nextjs-vite'
import PostCard from './PostCard'
import type { WPPost } from '@/lib/wordpress/types'

const base: WPPost = {
  id: 1,
  type: 'post',
  slug: 'teh-s3quence-016-spring-mix',
  title: { rendered: 'teh s3quence 016 — spring mix' },
  excerpt: { rendered: '<p>After a seemingly long winter, Spring is here again. A collection of tracks hinting at the Summer to come — electronic, atmospheric, and warm.</p>' },
  content: { rendered: '<p>Full content here.</p>' },
  date: '2012-04-28T10:14:41',
  date_gmt: '2012-04-28T10:14:41',
  modified: '2012-04-28T10:14:41',
  modified_gmt: '2012-04-28T10:14:41',
  status: 'publish',
  link: 'https://jazzsequence.com/teh-s3quence-016-spring-mix',
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

const withImage: WPPost = {
  ...base,
  id: 2,
  featured_media: 123,
  _embedded: {
    'wp:featuredmedia': [{
      id: 123,
      source_url: 'https://picsum.photos/seed/springmix/720/480',
      alt_text: 'Spring mix artwork',
      media_details: { width: 1200, height: 800, sizes: {} },
    }],
  },
}

const cardDecorator: Decorator = (Story) => (
  <div style={{ width: '360px' }}>
    <Story />
  </div>
)

const meta: Meta<typeof PostCard> = {
  title: 'Design System/PostCard',
  component: PostCard,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
}
export default meta

type Story = StoryObj<typeof PostCard>

export const WithoutImage: Story = {
  name: 'Without Featured Image',
  args: { post: base },
  decorators: [cardDecorator],
}

export const WithImage: Story = {
  name: 'With Featured Image',
  args: { post: withImage },
  decorators: [cardDecorator],
}

export const LongTitle: Story = {
  args: {
    post: {
      ...base,
      title: { rendered: 'Building a Headless WordPress Frontend with Next.js, MCP, and the Pantheon Platform' },
    },
  },
  decorators: [cardDecorator],
}

export const NoExcerpt: Story = {
  args: {
    post: { ...base, excerpt: { rendered: '' } },
  },
  decorators: [cardDecorator],
}

export const GridLayout: Story = {
  name: '3-Column Grid (as deployed)',
  parameters: { layout: 'fullscreen' },
  decorators: [
    (_Story) => (
      // Matches PostsList: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
      <div className="min-h-screen bg-brand-bg px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PostCard post={base} />
            <PostCard post={{ ...base, id: 2, title: { rendered: 'A Second Post With Longer Title Text' } }} />
            <PostCard post={withImage} />
            <PostCard post={{ ...base, id: 4, excerpt: { rendered: '' } }} />
            <PostCard post={{ ...base, id: 5, title: { rendered: 'Short' } }} />
            <PostCard post={withImage} />
          </div>
        </div>
      </div>
    ),
  ],
  render: () => <></>,
}
