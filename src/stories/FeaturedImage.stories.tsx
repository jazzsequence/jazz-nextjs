import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import FeaturedImage from '@/components/FeaturedImage'

/**
 * FeaturedImage — post hero image with broken-URL fallback
 *
 * Wraps next/image with an onError handler. When the image URL 404s
 * (e.g. a WordPress image offloaded to CDN but URL not rewritten),
 * shows the retrowave gradient placeholder instead of a broken icon.
 */
const meta: Meta<typeof FeaturedImage> = {
  title: 'Components/FeaturedImage',
  component: FeaturedImage,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="relative w-full rounded-xl overflow-hidden" style={{ height: '28rem' }}>
        <Story />
        {/* Retrowave overlay — same as PostContent */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(13,13,26,0.5) 0%, rgba(26,13,46,0.45) 40%, rgba(13,26,46,0.45) 100%)',
          }}
        />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof FeaturedImage>

export const Default: Story = {
  name: 'With image',
  args: {
    src: 'https://placehold.co/1024x448/2d0b4e/00e5cc?text=Featured+Image',
    alt: 'A placeholder featured image',
  },
}

export const BrokenUrl: Story = {
  name: 'Broken URL → fallback placeholder',
  args: {
    src: 'https://example.com/image-that-does-not-exist.jpg',
    alt: 'This image will fail to load',
  },
}
