import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { http, HttpResponse } from 'msw'
import ContactForm from '@/components/ContactForm'

/**
 * ContactForm — headless contact form for the About page.
 *
 * Submits to `/api/contact` (Next.js proxy route) which forwards to the
 * WordPress Ninja Forms backend. Includes a honeypot field hidden from users.
 *
 * States: idle → submitting (button disabled) → success (form replaced) / error (alert + retry)
 */

const meta: Meta<typeof ContactForm> = {
  title: 'Components/ContactForm',
  component: ContactForm,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        component: 'Contact form rendered on the About page. Proxies to WordPress Ninja Forms.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof ContactForm>

/** Default empty state — how the form appears when the About page loads. */
export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post('/api/contact', () => HttpResponse.json({ success: true })),
      ],
    },
  },
}

/** Submitting state — button disabled and shows "Sending…" during the network request. */
export const Submitting: Story = {
  parameters: {
    msw: {
      handlers: [
        // Never resolves — keeps the form in submitting state for visual review
        http.post('/api/contact', () => new Promise(() => {})),
      ],
    },
  },
  play: async ({ canvas }) => {
    const { fireEvent } = await import('@storybook/test')
    const name = canvas.getByLabelText(/name/i)
    const email = canvas.getByLabelText(/email/i)
    const message = canvas.getByLabelText(/message/i)
    const submit = canvas.getByRole('button')

    fireEvent.change(name, { target: { value: 'Chris Reynolds' } })
    fireEvent.change(email, { target: { value: 'chris@example.com' } })
    fireEvent.change(message, { target: { value: 'This is a test message.' } })
    fireEvent.click(submit)
  },
}

/** Success state — form replaced by thank-you message after successful submission. */
export const Success: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post('/api/contact', () => HttpResponse.json({ success: true })),
      ],
    },
  },
  play: async ({ canvas }) => {
    const { fireEvent } = await import('@storybook/test')
    const name = canvas.getByLabelText(/name/i)
    const email = canvas.getByLabelText(/email/i)
    const message = canvas.getByLabelText(/message/i)
    const submit = canvas.getByRole('button')

    fireEvent.change(name, { target: { value: 'Chris Reynolds' } })
    fireEvent.change(email, { target: { value: 'chris@example.com' } })
    fireEvent.change(message, { target: { value: 'This is a test message.' } })
    fireEvent.click(submit)
  },
}

/** Error state — alert shown and submit button re-enabled for retry. */
export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post('/api/contact', () =>
          HttpResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
          )
        ),
      ],
    },
  },
  play: async ({ canvas }) => {
    const { fireEvent } = await import('@storybook/test')
    const name = canvas.getByLabelText(/name/i)
    const email = canvas.getByLabelText(/email/i)
    const message = canvas.getByLabelText(/message/i)
    const submit = canvas.getByRole('button')

    fireEvent.change(name, { target: { value: 'Chris Reynolds' } })
    fireEvent.change(email, { target: { value: 'chris@example.com' } })
    fireEvent.change(message, { target: { value: 'This is a test message.' } })
    fireEvent.click(submit)
  },
}
