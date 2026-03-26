import Link from 'next/link'

/**
 * Forbidden page — rendered when a user tries to access private or restricted content.
 * Triggered via forbidden() from Next.js navigation (same pattern as notFound()).
 *
 * This is distinct from not-found (the content exists, it is just restricted)
 * and from a server error (no bug occurred, this is intentional access control).
 */
export default function ForbiddenPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-brand-cyan text-sm uppercase tracking-widest mb-4">
          403 — Access Restricted
        </p>
        <h1 className="font-heading text-4xl font-bold text-brand-text mb-4">
          Private Content
        </h1>
        <p className="text-brand-text-sub mb-8 leading-relaxed">
          This content is private and not available to the public.
          If you believe you should have access, please get in touch.
        </p>
        <Link
          href="/"
          className="inline-block font-heading font-semibold text-brand-cyan border border-brand-cyan px-6 py-2 rounded hover:bg-brand-cyan hover:text-brand-bg transition-colors"
        >
          Back to home
        </Link>
      </div>
    </main>
  )
}
