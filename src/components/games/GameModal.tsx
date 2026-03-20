'use client'

import type { GCGame } from '@/lib/wordpress/types'
import { formatPlayers } from './utils'

interface GameModalProps {
  game: GCGame | null
  onClose: () => void
}

export function GameModal({ game, onClose }: GameModalProps) {
  if (!game) return null

  return (
    <div
      data-testid="modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        data-testid="modal-content"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-brand-surface border border-brand-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-brand-surface-high border border-brand-border p-1.5 text-brand-muted hover:text-brand-text transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Box art with retrowave overlay */}
        {game.featured_image && (
          <div className="relative aspect-[3/2] w-full overflow-hidden bg-brand-surface-high rounded-t-xl">
            {/* Using <img> instead of next/image: box art served from external CDN
                (sfo2.digitaloceanspaces.com) not configured in next.config.js image domains. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={game.featured_image.url}
              alt={game.featured_image.alt || game.title.rendered}
              className="h-full w-full object-contain"
            />
          </div>
        )}

        <div className="p-6">
          <h2 className="font-mono text-2xl font-bold text-brand-text mb-4">
            {game.title.rendered}
          </h2>

          {/* Metadata grid */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-5">
            {game.min_players !== null && (
              <>
                <dt className="font-heading font-medium text-brand-muted flex items-center gap-1.5">
                  <i className="fa-solid fa-user-group text-brand-cyan text-xs" aria-hidden="true" />
                  Players
                </dt>
                <dd className="font-heading text-brand-text-sub">{formatPlayers(game.min_players, game.max_players)}</dd>
              </>
            )}
            {game.time && (
              <>
                <dt className="font-heading font-medium text-brand-muted flex items-center gap-1.5">
                  <i className="fa-solid fa-clock text-brand-cyan text-xs" aria-hidden="true" />
                  Playing time
                </dt>
                <dd className="font-heading text-brand-text-sub">{game.time} min</dd>
              </>
            )}
            {game.age !== null && (
              <>
                <dt className="font-heading font-medium text-brand-muted flex items-center gap-1.5">
                  <i className="fa-solid fa-child-reaching text-brand-cyan text-xs" aria-hidden="true" />
                  Min age
                </dt>
                <dd className="font-heading text-brand-text-sub">{game.age}+</dd>
              </>
            )}
            {game.difficulty && (
              <>
                <dt className="font-heading font-medium text-brand-muted flex items-center gap-1.5">
                  <i className="fa-solid fa-gauge text-brand-cyan text-xs" aria-hidden="true" />
                  Difficulty
                </dt>
                <dd className="font-heading text-brand-text-sub capitalize">{game.difficulty}</dd>
              </>
            )}
          </dl>

          {/* Attributes */}
          {game.attributes.length > 0 && (
            <div className="mb-5">
              <p className="font-heading text-sm font-medium text-brand-muted mb-2 flex items-center gap-1.5">
                <i className="fa-solid fa-tags text-brand-cyan text-xs" aria-hidden="true" />
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {game.attributes.map((attr) => (
                  <span
                    key={attr}
                    className="rounded-full bg-brand-surface-high border border-brand-border px-3 py-1 text-sm font-heading text-brand-purple"
                  >
                    {attr}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* BGG link */}
          {game.url && (
            <a
              href={game.url}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline inline-flex items-center gap-1.5 rounded-lg bg-brand-cyan px-4 py-2 text-sm font-heading font-bold text-brand-bg hover:text-brand-bg hover:opacity-85 transition-opacity"
            >
              View on Board Game Geek
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
