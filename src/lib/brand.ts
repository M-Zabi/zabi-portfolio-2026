import type { BrandColor } from '@/types/content'

/**
 * Static class maps so Tailwind can see every brand-block class at build time.
 * Never build these names with string interpolation.
 */
export const blockClass: Record<BrandColor, string> = {
  ember: 'bg-ember text-ember-foreground',
  volt: 'bg-volt text-volt-foreground',
  cobalt: 'bg-cobalt text-cobalt-foreground',
  mint: 'bg-mint text-mint-foreground',
  blush: 'bg-blush text-blush-foreground',
}

export const fillClass: Record<BrandColor, string> = {
  ember: 'bg-ember',
  volt: 'bg-volt',
  cobalt: 'bg-cobalt',
  mint: 'bg-mint',
  blush: 'bg-blush',
}

export const textOnClass: Record<BrandColor, string> = {
  ember: 'text-ember-foreground',
  volt: 'text-volt-foreground',
  cobalt: 'text-cobalt-foreground',
  mint: 'text-mint-foreground',
  blush: 'text-blush-foreground',
}

/** CSS custom property for a brand colour — for inline `color-mix()` work. */
export function brandVar(color: BrandColor): string {
  return `var(--${color})`
}
