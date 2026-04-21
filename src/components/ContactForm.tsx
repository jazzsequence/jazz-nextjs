'use client'

import { useState, FormEvent } from 'react'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

interface ContactFormProps {
  /** Override initial state — used in Storybook to render specific states without interaction */
  initialState?: FormState
  /** Override initial error message — used with initialState='error' in Storybook */
  initialError?: string
}

export default function ContactForm({ initialState = 'idle', initialError = '' }: ContactFormProps = {}) {
  const [state, setState] = useState<FormState>(initialState)
  const [errorMessage, setErrorMessage] = useState<string>(initialError)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('submitting')
    setErrorMessage('')

    const form = e.currentTarget
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
      website: (form.elements.namedItem('website') as HTMLInputElement).value,
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setState('success')
      } else {
        const body = await res.json().catch(() => ({}))
        setErrorMessage(body.error ?? 'Something went wrong. Please try again.')
        setState('error')
      }
    } catch {
      setErrorMessage('Something went wrong. Please try again.')
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="rounded-xl border border-brand-border bg-brand-surface p-8 text-center">
        <p className="font-heading text-xl text-brand-cyan mb-2">Thank you!</p>
        <p className="text-brand-muted">Your message has been sent. I&apos;ll get back to you soon.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Honeypot: hidden from real users, bots fill it in — server rejects if non-empty */}
      <div aria-hidden="true" style={{ display: 'none' }}>
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {state === 'error' && (
        <div role="alert" className="rounded-lg border border-brand-magenta bg-brand-surface p-4 text-brand-magenta text-sm">
          {errorMessage}
        </div>
      )}

      <p className="text-xs text-brand-muted">
        Fields marked <span className="text-brand-magenta" aria-hidden="true">*</span>
        {' '}<span className="sr-only">with an asterisk</span> are required.
      </p>

      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium text-brand-text mb-1">
          Name <span className="text-brand-magenta" aria-hidden="true">*</span>
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          disabled={state === 'submitting'}
          className="w-full rounded-lg border border-brand-border bg-brand-surface-high px-4 py-2 text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-cyan disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-brand-text mb-1">
          Email <span className="text-brand-magenta" aria-hidden="true">*</span>
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={state === 'submitting'}
          className="w-full rounded-lg border border-brand-border bg-brand-surface-high px-4 py-2 text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-cyan disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-brand-text mb-1">
          Message <span className="text-brand-magenta" aria-hidden="true">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          disabled={state === 'submitting'}
          className="w-full rounded-lg border border-brand-border bg-brand-surface-high px-4 py-2 text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-cyan disabled:opacity-50 resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="w-full rounded-lg bg-brand-cyan px-6 py-3 font-heading font-bold text-brand-bg transition-colors hover:bg-brand-magenta disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === 'submitting' ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}
