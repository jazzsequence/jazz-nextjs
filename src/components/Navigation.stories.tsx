import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Navigation from './Navigation'
import type { WPMenuItem } from '@/lib/wordpress/types'

const menuBase = { attr_title: '', description: '', type: 'custom', type_label: 'Custom Link', object: 'custom', object_id: 0, parent: 0, target: '', classes: [], xfn: [], invalid: false, meta: {}, menus: 1 }

const menuItems: WPMenuItem[] = [
  { ...menuBase, id: 1, title: { rendered: 'Home' }, url: 'https://jazzsequence.com', menu_order: 1 },
  { ...menuBase, id: 2, title: { rendered: 'Posts' }, url: 'https://jazzsequence.com/posts', menu_order: 2 },
  { ...menuBase, id: 3, title: { rendered: 'Music' }, url: 'https://jazzsequence.com/music', menu_order: 3 },
  { ...menuBase, id: 4, title: { rendered: 'Games' }, url: 'https://jazzsequence.com/games', menu_order: 4 },
  { ...menuBase, id: 5, title: { rendered: 'About' }, url: 'https://jazzsequence.com/about', menu_order: 5 },
]

const nestedItems: WPMenuItem[] = [
  ...menuItems,
  { ...menuBase, id: 6, title: { rendered: 'Loafmen' }, url: 'https://jazzsequence.com/music/loafmen', parent: 3, menu_order: 1 },
  { ...menuBase, id: 7, title: { rendered: 'Blind Chaos' }, url: 'https://jazzsequence.com/music/blind-chaos', parent: 3, menu_order: 2 },
]

const meta: Meta<typeof Navigation> = {
  title: 'Design System/Navigation',
  component: Navigation,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
    a11y: { test: 'error' },
  },
}
export default meta

type Story = StoryObj<typeof Navigation>

export const WithMenuItems: Story = {
  args: { menuItems },
}

export const WithNestedItems: Story = {
  name: 'With Nested Dropdown',
  args: { menuItems: nestedItems },
}

export const Loading: Story = {
  name: 'Loading State',
  args: { menuItems: [], isLoading: true },
}

export const Error: Story = {
  name: 'Error State',
  args: { menuItems: [], error: 'Failed to fetch menu items' },
}

export const Empty: Story = {
  name: 'Empty (no items)',
  args: { menuItems: [] },
}
