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
      className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
    >
      {/* Box art */}
      <div className="relative aspect-[3/4] w-full bg-gray-100 overflow-hidden">
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
          <div className="flex h-full items-center justify-center text-gray-400 text-4xl">
            🎲
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-3">
        <h3 className="font-semibold text-sm leading-tight text-gray-900 line-clamp-2">
          {game.title.rendered}
        </h3>

        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
          {(game.min_players !== null) && (
            <span>{formatPlayers(game.min_players, game.max_players)} players</span>
          )}
          {game.time && <span>{game.time} min</span>}
          {game.difficulty && (
            <span className="capitalize">{game.difficulty}</span>
          )}
        </div>

        {game.attributes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {game.attributes.slice(0, 3).map((attr) => (
              <span
                key={attr}
                className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
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
