'use client'

import { useState, useMemo } from 'react'
import type { GCGame } from '@/lib/wordpress/types'
import { GameCard } from './GameCard'
import { GameModal } from './GameModal'

interface GamesGridProps {
  games: GCGame[]
}

type PlayerFilter = '' | '2' | '4' | '6' | '8'
type DifficultyFilter = '' | 'easy' | 'moderate' | 'difficult' | 'hardcore'

function meetsPlayerCount(game: GCGame, minRequired: PlayerFilter): boolean {
  if (!minRequired) return true
  const required = parseInt(minRequired, 10)
  // Game supports this player count if max_players >= required
  if (game.max_players !== null && game.max_players >= required) return true
  // Or if min_players >= required (for games with open-ended max)
  if (game.max_players === null && game.min_players !== null && game.min_players <= required) return true
  return false
}

function getUniqueAttributes(games: GCGame[]): string[] {
  const attrs = new Set<string>()
  games.forEach((g) => g.attributes.forEach((a) => attrs.add(a)))
  return Array.from(attrs).sort()
}

export function GamesGrid({ games }: GamesGridProps) {
  const [selectedAttribute, setSelectedAttribute] = useState<string>('')
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('')
  const [players, setPlayers] = useState<PlayerFilter>('')
  const [activeGame, setActiveGame] = useState<GCGame | null>(null)

  const attributes = useMemo(() => getUniqueAttributes(games), [games])

  const filtered = useMemo(() => {
    return games.filter((game) => {
      if (selectedAttribute && !game.attributes.includes(selectedAttribute)) return false
      if (difficulty && game.difficulty !== difficulty) return false
      if (!meetsPlayerCount(game, players)) return false
      return true
    })
  }, [games, selectedAttribute, difficulty, players])

  function resetFilters() {
    setSelectedAttribute('')
    setDifficulty('')
    setPlayers('')
  }

  const hasActiveFilter = selectedAttribute || difficulty || players

  return (
    <div data-testid="games-grid">
      {/* Filters */}
      <div data-testid="game-filters" className="mb-6 flex flex-wrap items-center gap-3">
        {/* Show All */}
        <button
          type="button"
          onClick={resetFilters}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            !hasActiveFilter
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Show All
        </button>

        {/* Attribute buttons */}
        {attributes.map((attr) => (
          <button
            key={attr}
            type="button"
            onClick={() => setSelectedAttribute(selectedAttribute === attr ? '' : attr)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              selectedAttribute === attr
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {attr}
          </button>
        ))}

        {/* Player count select */}
        <label className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 font-medium">Players:</span>
          <select
            aria-label="Players"
            value={players}
            onChange={(e) => setPlayers(e.target.value as PlayerFilter)}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
          >
            <option value="">Any</option>
            <option value="2">2+</option>
            <option value="4">4+</option>
            <option value="6">6+</option>
            <option value="8">8+</option>
          </select>
        </label>

        {/* Difficulty select */}
        <label className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 font-medium">Difficulty:</span>
          <select
            aria-label="Difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as DifficultyFilter)}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
          >
            <option value="">Any</option>
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="difficult">Difficult</option>
            <option value="hardcore">Hardcore</option>
          </select>
        </label>
      </div>

      {/* Count */}
      <p className="mb-4 text-sm text-gray-500">
        {filtered.length} {filtered.length === 1 ? 'game' : 'games'}
        {hasActiveFilter ? ' matching filters' : ' in collection'}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="py-16 text-center text-gray-400">No games match the current filters.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((game) => (
            <GameCard key={game.id} game={game} onClick={setActiveGame} />
          ))}
        </div>
      )}

      {/* Modal */}
      <GameModal game={activeGame} onClose={() => setActiveGame(null)} />
    </div>
  )
}
