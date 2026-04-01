import type { ElementType, ReactNode } from 'react'

interface NeonTextProps {
  children: ReactNode
  /** HTML element to render. Defaults to span. */
  as?: ElementType
  className?: string
}

/**
 * NeonText — renders children with a neon-sign glow effect.
 *
 * The flicker animation and hover intensification are defined in globals.css
 * via the `.neon-text` class. Color defaults to the current text color so
 * the effect can be applied to any branded element.
 */
export default function NeonText({ children, as: Tag = 'span', className = '' }: NeonTextProps) {
  return (
    <Tag className={`neon-text${className ? ` ${className}` : ''}`}>
      {children}
    </Tag>
  )
}
