import {
  type SimpleIcon,
  siElectron,
  siExpo,
  siFigma,
  siGraphql,
  siNextdotjs,
  siNodedotjs,
  siNuxt,
  siPostgresql,
  siReact,
  siRedis,
  siRust,
  siSupabase,
  siTailwindcss,
  siTauri,
  siThreedotjs,
  siTrpc,
  siTypescript,
  siVuedotjs,
} from 'simple-icons'

/**
 * Brand marks for the toolbox — paths from Simple Icons (CC0), drawn on a 24×24 grid.
 * Icons are imported by name so the bundle only carries the ones listed here.
 */
export const techIcons = {
  'Vue 3': siVuedotjs,
  Nuxt: siNuxt,
  React: siReact,
  'Next.js': siNextdotjs,
  TypeScript: siTypescript,
  'Tailwind CSS': siTailwindcss,
  'React Native': siReact,
  Expo: siExpo,
  Tauri: siTauri,
  Rust: siRust,
  Electron: siElectron,
  'Node.js': siNodedotjs,
  tRPC: siTrpc,
  GraphQL: siGraphql,
  PostgreSQL: siPostgresql,
  Redis: siRedis,
  Supabase: siSupabase,
  'three.js': siThreedotjs,
  Figma: siFigma,
} satisfies Record<string, SimpleIcon>

export type TechName = keyof typeof techIcons

/** The brand colour — or the text colour for near-black marks, which would vanish in dark mode. */
export function techColor(icon: Pick<SimpleIcon, 'hex'>): string {
  const value = Number.parseInt(icon.hex, 16)
  const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255]
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return luma < 0.2 ? 'currentColor' : `#${icon.hex}`
}
