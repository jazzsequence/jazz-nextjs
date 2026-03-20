import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Pagination from './Pagination'

const meta: Meta<typeof Pagination> = {
  title: 'Design System/Pagination',
  component: Pagination,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
    a11y: { test: 'error' },
  },
  args: {
    basePath: '/posts',
  },
}
export default meta

type Story = StoryObj<typeof Pagination>

export const FirstPage: Story = {
  name: 'First Page (Previous disabled)',
  args: { currentPage: 1, totalPages: 10 },
}

export const MiddlePage: Story = {
  args: { currentPage: 5, totalPages: 10 },
}

export const LastPage: Story = {
  name: 'Last Page (Next disabled)',
  args: { currentPage: 10, totalPages: 10 },
}

export const FewPages: Story = {
  name: 'Few Pages (no ellipsis)',
  args: { currentPage: 2, totalPages: 5 },
}

export const ManyPages: Story = {
  name: 'Many Pages (with ellipsis)',
  args: { currentPage: 8, totalPages: 25 },
}

export const SinglePage: Story = {
  name: 'Single Page (renders nothing)',
  args: { currentPage: 1, totalPages: 1 },
}

export const HomepagePath: Story = {
  name: 'Homepage pagination',
  args: { currentPage: 2, totalPages: 5, basePath: '/' },
}
