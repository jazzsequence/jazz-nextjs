import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import ContactForm from '@/components/ContactForm'

/**
 * ContactForm — headless contact form for the About page.
 *
 * Submits to `/api/contact` (Next.js proxy route) which forwards to the
 * WordPress Ninja Forms backend. Includes a honeypot field hidden from users.
 *
 * States: idle → submitting (button disabled) → success (form replaced) / error (alert + retry)
 *
 * The `initialState` prop is used here for Storybook rendering — it has no effect
 * in production where the form always starts in idle state.
 */

const meta: Meta<typeof ContactForm> = {
  title: 'Design System/ContactForm',
  component: ContactForm,
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component: 'Contact form rendered on the About page. Submits to `/api/contact` which proxies to WordPress Ninja Forms (form ID 1). Includes a honeypot `website` field hidden from real users.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof ContactForm>

/** Default empty state — how the form appears when the About page loads. */
export const Default: Story = {}

/** Submitting — button is disabled and shows "Sending…" while the request is in flight. */
export const Submitting: Story = {
  args: {
    initialState: 'submitting',
  },
}

/** Success — form replaced by thank-you message after a successful submission. */
export const Success: Story = {
  args: {
    initialState: 'success',
  },
}

/** Error — alert shown with a retry-enabled submit button. */
export const Error: Story = {
  args: {
    initialState: 'error',
    initialError: 'Something went wrong. Please try again.',
  },
}
