import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import PostBodyImage from '@/components/PostBodyImage'

/**
 * PostBodyImage — inline post content image with broken-URL fallback
 *
 * Replaces bare `<img>` elements in post body HTML (via parseOptions in
 * PostContent). When the image URL 404s (hotlinked images that no longer
 * exist, etc.), the component returns null rather than showing the browser's
 * broken image icon.
 */
const meta: Meta<typeof PostBodyImage> = {
  title: 'Components/PostBodyImage',
  component: PostBodyImage,
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="post-body max-w-2xl">
        <p>Text before the image.</p>
        <Story />
        <p>Text after the image.</p>
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof PostBodyImage>

export const Default: Story = {
  name: 'Valid image',
  args: {
    src: 'https://placehold.co/600x400/2d0b4e/00e5cc?text=Post+Body+Image',
    alt: 'A placeholder post body image',
    className: 'aligncenter',
    width: 600,
    height: 400,
  },
}

export const BrokenUrl: Story = {
  name: 'Broken URL → hidden (returns null)',
  args: {
    src: 'https://example.com/image-that-does-not-exist.jpg',
    alt: 'This image will fail to load and disappear',
  },
}

export const FloatLeft: Story = {
  name: 'Float left (alignleft)',
  args: {
    src: 'https://placehold.co/300x200/0b2d4e/00e5cc?text=Float+Left',
    alt: 'Float left image',
    className: 'alignleft',
    width: 300,
    height: 200,
  },
}
