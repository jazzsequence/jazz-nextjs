'use client'

import type { GCGame } from '@/lib/wordpress/types'
import { formatPlayers } from './utils'

interface GameCardProps {
  game: GCGame
  onClick: (game: GCGame) => void
}

export function GameCard({ game, onClick }: GameCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(game)}
      className="group flex flex-col overflow-hidden rounded-xl border border-brand-border bg-brand-surface transition hover:border-brand-border-bright focus:outline-none focus:ring-2 focus:ring-brand-cyan text-left"
    >
      {/* Box art */}
      <div className="relative aspect-[3/4] w-full bg-brand-surface-high overflow-hidden">
        {game.featured_image ? (
          // Using <img> instead of next/image: box art is served from an external CDN
          // (sfo2.digitaloceanspaces.com) not configured in next.config.js image domains.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.featured_image.url}
            alt={game.featured_image.alt || game.title.rendered}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-brand-border text-4xl">
            <i className="fa-solid fa-dice" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-3">
        <h3 className="font-heading font-semibold text-sm leading-tight text-brand-text line-clamp-2">
          {game.title.rendered}
        </h3>

        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-brand-muted font-heading">
          {(game.min_players !== null) && (
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-user-group text-brand-cyan" aria-hidden="true" />
              {formatPlayers(game.min_players, game.max_players)}
            </span>
          )}
          {game.time && (
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-clock text-brand-cyan" aria-hidden="true" />
              {game.time} min
            </span>
          )}
          {game.difficulty && (
            <span className="flex items-center gap-1 capitalize">
              <i className="fa-solid fa-gauge text-brand-cyan" aria-hidden="true" />
              {game.difficulty}
            </span>
          )}
        </div>

        {game.attributes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {game.attributes.slice(0, 3).map((attr) => (
              <span
                key={attr}
                className="rounded-full bg-brand-surface border border-brand-border px-2 py-0.5 text-xs font-heading text-brand-purple"
              >
                {attr}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}
