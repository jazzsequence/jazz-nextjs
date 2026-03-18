/**
 * Format a player count range for display.
 * Returns "N – M" for ranges, "N+" for open-ended, "—" when unknown.
 */
export function formatPlayers(min: number | null, max: number | null): string {
  if (min === null) return '—'
  if (max === null || max === 0) return `${min}+`
  if (min === max) return `${min}`
  return `${min} – ${max}`
}
