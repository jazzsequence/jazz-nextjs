import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Navigation from '@/components/Navigation'
import type { WPMenuItem } from '@/lib/wordpress/types'

/**
 * Navigation — the site header with logo, desktop menu, search bar, and mobile hamburger.
 *
 * Desktop (≥768px): logo left, SearchBar + menu items right.
 * Mobile (<768px): logo left, hamburger button right. Tap hamburger to expand menu.
 *
 * WCAG 2.1 AA: role="navigation", aria-expanded on hamburger, aria-controls linking
 * button to mobile menu panel, keyboard accessible dropdowns.
 */

const base = { attr_title: '', description: '', type_label: '', xfn: [], invalid: false, meta: {}, menus: 1698 }

const mockMenuItems: WPMenuItem[] = [
  { ...base, id: 5525, title: { rendered: 'Home' }, url: 'https://jazzsequence.com', parent: 0, menu_order: 1, target: '', classes: [], type: 'custom', object: 'custom', object_id: 0 },
  { ...base, id: 5549, title: { rendered: 'Music' }, url: 'https://jazzsequence.com/music/', parent: 0, menu_order: 2, target: '', classes: [], type: 'post_type', object: 'page', object_id: 989 },
  { ...base, id: 11442, title: { rendered: 'jazzsequence' }, url: 'http://music.jazzsequence.com/', parent: 5549, menu_order: 3, target: '', classes: [], type: 'custom', object: 'custom', object_id: 0 },
  { ...base, id: 12655, title: { rendered: 'Code' }, url: 'https://github.com/jazzsequence', parent: 0, menu_order: 9, target: '', classes: [], type: 'custom', object: 'custom', object_id: 0 },
  { ...base, id: 13566, title: { rendered: 'Games' }, url: 'https://jazzsequence.com/games/', parent: 0, menu_order: 18, target: '', classes: [], type: 'post_type', object: 'page', object_id: 13490 },
  { ...base, id: 15570, title: { rendered: 'Articles' }, url: 'https://jazzsequence.com/articles/', parent: 0, menu_order: 20, target: '', classes: [], type: 'post_type', object: 'page', object_id: 15559 },
  { ...base, id: 17071, title: { rendered: 'Media' }, url: 'https://jazzsequence.com/media/', parent: 0, menu_order: 21, target: '', classes: [], type: 'custom', object: 'custom', object_id: 0 },
  { ...base, id: 5553, title: { rendered: 'About' }, url: 'https://jazzsequence.com/about/', parent: 0, menu_order: 22, target: '', classes: [], type: 'post_type', object: 'page', object_id: 273 },
  { ...base, id: 14619, title: { rendered: 'Now' }, url: 'https://jazzsequence.com/now/', parent: 0, menu_order: 23, target: '', classes: [], type: 'post_type', object: 'page', object_id: 14616 },
]

const meta: Meta<typeof Navigation> = {
  title: 'Design System/Navigation',
  component: Navigation,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
    nextjs: {
      appDirectory: true,
      navigation: {
        push: () => {},
        replace: () => {},
        prefetch: () => {},
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof Navigation>

/** Desktop — full menu with SearchBar and dropdown items visible. */
export const Desktop: Story = {
  name: 'Desktop (≥768px)',
  args: { menuItems: mockMenuItems },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
}

/** Mobile collapsed — hamburger visible, desktop nav hidden. */
export const MobileCollapsed: Story = {
  name: 'Mobile — collapsed',
  args: { menuItems: mockMenuItems },
  globals: {
    viewport: { value: 'mobile' },
  },
}

/** Mobile expanded — hamburger clicked, menu panel open. */
export const MobileExpanded: Story = {
  name: 'Mobile — menu open',
  args: { menuItems: mockMenuItems },
  globals: {
    viewport: { value: 'mobile' },
  },
  play: async ({ canvasElement }) => {
    const { within, userEvent } = await import('@storybook/test')
    const canvas = within(canvasElement)
    const hamburger = canvas.getByRole('button', { name: /open menu/i })
    await userEvent.click(hamburger)
  },
}

/** Loading state — menu items are being fetched. */
export const Loading: Story = {
  args: { menuItems: [], isLoading: true },
}

/** Error state — menu fetch failed. */
export const ErrorState: Story = {
  args: { menuItems: [], error: 'Failed to load menu' },
}
