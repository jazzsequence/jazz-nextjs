import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { userEvent, within } from '@storybook/test'
import OpenSocialFollow from './OpenSocialFollow'

const meta: Meta<typeof OpenSocialFollow> = {
  title: 'Design System/OpenSocialFollow',
  component: OpenSocialFollow,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
    a11y: { test: 'error' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px', padding: '1.5rem', background: '#0a0a18', borderRadius: '0.75rem', border: '1px solid #2a2a4a' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof OpenSocialFollow>

export const Default: Story = {
  name: 'Default (collapsed)',
}

export const Expanded: Story = {
  name: 'Expanded (open)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')
    await userEvent.click(button)
  },
}
