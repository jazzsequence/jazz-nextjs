import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import ContactForm from '@/components/ContactForm'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ContactForm', () => {
  it('renders name, email, and message fields', () => {
    render(<ContactForm />)
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
  })

  it('renders a submit button', () => {
    render(<ContactForm />)
    expect(screen.getByRole('button', { name: /send|submit/i })).toBeInTheDocument()
  })

  it('all fields and submit are required', () => {
    render(<ContactForm />)
    expect(screen.getByLabelText(/name/i)).toBeRequired()
    expect(screen.getByLabelText(/email/i)).toBeRequired()
    expect(screen.getByLabelText(/message/i)).toBeRequired()
  })

  it('email field has type=email for native browser validation', () => {
    render(<ContactForm />)
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email')
  })

  it('disables submit button while submitting', async () => {
    server.use(
      http.post('/api/contact', () => new Promise(() => {})) // never resolves
    )

    render(<ContactForm />)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Chris' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'chris@example.com' } })
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Hello' } })
    fireEvent.click(screen.getByRole('button', { name: /send|submit/i }))

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  it('shows success message after successful submission', async () => {
    server.use(
      http.post('/api/contact', () => HttpResponse.json({ success: true }))
    )

    render(<ContactForm />)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Chris' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'chris@example.com' } })
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Hello' } })
    fireEvent.click(screen.getByRole('button', { name: /send|submit/i }))

    await waitFor(() => {
      expect(screen.getByText(/thank you/i)).toBeInTheDocument()
    })
  })

  it('hides the form after successful submission', async () => {
    server.use(
      http.post('/api/contact', () => HttpResponse.json({ success: true }))
    )

    render(<ContactForm />)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Chris' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'chris@example.com' } })
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Hello' } })
    fireEvent.click(screen.getByRole('button', { name: /send|submit/i }))

    await waitFor(() => {
      expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument()
    })
  })

  it('shows error message on failed submission', async () => {
    server.use(
      http.post('/api/contact', () =>
        HttpResponse.json({ error: 'Something went wrong' }, { status: 500 })
      )
    )

    render(<ContactForm />)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Chris' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'chris@example.com' } })
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Hello' } })
    fireEvent.click(screen.getByRole('button', { name: /send|submit/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('re-enables submit after a failed submission so user can retry', async () => {
    server.use(
      http.post('/api/contact', () =>
        HttpResponse.json({ error: 'Something went wrong' }, { status: 500 })
      )
    )

    render(<ContactForm />)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Chris' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'chris@example.com' } })
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Hello' } })
    fireEvent.click(screen.getByRole('button', { name: /send|submit/i }))

    await waitFor(() => {
      expect(screen.getByRole('button')).not.toBeDisabled()
    })
  })

  it('posts to /api/contact with the correct fields', async () => {
    let capturedBody: unknown = null

    server.use(
      http.post('/api/contact', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ success: true })
      })
    )

    render(<ContactForm />)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Chris Reynolds' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'chris@example.com' } })
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Test message' } })
    fireEvent.click(screen.getByRole('button', { name: /send|submit/i }))

    await waitFor(() => {
      expect(capturedBody).toMatchObject({
        name: 'Chris Reynolds',
        email: 'chris@example.com',
        message: 'Test message',
        website: '',  // honeypot field — empty for real users
      })
    })
  })
})
