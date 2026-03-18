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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        data-testid="modal-content"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 text-gray-500 hover:text-gray-900 shadow"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Box art */}
        {game.featured_image && (
          <div className="relative aspect-[3/2] w-full overflow-hidden bg-gray-100 rounded-t-xl">
            {/* Using <img> instead of next/image: box art is served from an external CDN
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {game.title.rendered}
          </h2>

          {/* Metadata grid */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-5">
            {game.min_players !== null && (
              <>
                <dt className="font-medium text-gray-500">Players</dt>
                <dd className="text-gray-900">{formatPlayers(game.min_players, game.max_players)}</dd>
              </>
            )}
            {game.time && (
              <>
                <dt className="font-medium text-gray-500">Playing time</dt>
                <dd className="text-gray-900">{game.time} min</dd>
              </>
            )}
            {game.age !== null && (
              <>
                <dt className="font-medium text-gray-500">Min age</dt>
                <dd className="text-gray-900">{game.age}+</dd>
              </>
            )}
            {game.difficulty && (
              <>
                <dt className="font-medium text-gray-500">Difficulty</dt>
                <dd className="capitalize text-gray-900">{game.difficulty}</dd>
              </>
            )}
          </dl>

          {/* Attributes */}
          {game.attributes.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-500 mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {game.attributes.map((attr) => (
                  <span
                    key={attr}
                    className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700"
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition"
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
