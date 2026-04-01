'use client'

import { useState } from 'react'

const WEBFINGER = '@jazzsequence@jazzsequence.com'
const ACTIVITYPUB_PROFILE = 'https://jazzsequence.com/@jazzsequence'

export default function OpenSocialFollow() {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(WEBFINGER).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex items-start gap-4">
      {/* Profile card */}
      <div className="flex-1 min-w-0">
        <p className="font-heading font-semibold text-brand-text text-sm leading-tight">jazzsequence</p>
        <p className="font-mono text-brand-muted text-xs mt-0.5">{WEBFINGER}</p>
        <p className="text-brand-muted text-xs mt-0.5 font-heading">I make websites and things.</p>

        {/* Follow CTA */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="neon-border-hover inline-flex items-center gap-1.5 font-heading text-xs font-semibold bg-brand-surface-high border border-brand-border text-brand-cyan px-3 py-1.5 rounded transition-colors"
            aria-expanded={open}
            aria-controls="opensocial-instructions"
          >
            <i className="fa-solid fa-rss" aria-hidden="true" />
            Follow on the Open Social Web
          </button>

          <a
            href={ACTIVITYPUB_PROFILE}
            target="_blank"
            rel="me noopener noreferrer"
            className="font-heading text-xs text-brand-muted hover:text-brand-cyan transition-colors underline underline-offset-2"
          >
            View profile
          </a>
        </div>

        {/* Instructions panel */}
        {open && (
          <div
            id="opensocial-instructions"
            className="mt-3 p-3 bg-brand-surface border border-brand-border rounded-lg"
          >
            <p className="text-brand-text-sub text-xs font-heading mb-2 leading-relaxed">
              Paste this handle into the search field of your Mastodon, Pixelfed, or any ActivityPub-compatible app:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-brand-cyan text-xs bg-brand-surface-high px-2 py-1.5 rounded truncate">
                {WEBFINGER}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="neon-border-hover font-heading text-xs font-medium text-brand-text-sub hover:text-brand-cyan border border-brand-border bg-brand-surface-high px-2 py-1.5 rounded transition-colors flex-shrink-0"
              >
                {copied ? (
                  <span className="text-brand-cyan">Copied!</span>
                ) : (
                  'Copy'
                )}
              </button>
            </div>
            <p className="text-brand-muted text-xs font-heading mt-2">
              This site is part of the open social web (ActivityPub / Fediverse).
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
