import type { Project } from '@/types/content'

/**
 * PLACEHOLDER CASE STUDIES — illustrative projects that show the layout across web,
 * mobile and desktop. Replace every entry (and its metrics) with your real work before
 * publishing. Add `cover: '/images/<slug>.webp'` to swap the generated device art for a
 * real screenshot.
 */
export const projects: Project[] = [
  {
    slug: 'cadence',
    title: 'Cadence',
    client: 'Cadence Health',
    year: 2025,
    category: 'mobile',
    platforms: ['iOS', 'Android'],
    role: 'Lead mobile engineer',
    stack: ['React Native', 'Expo', 'Reanimated', 'Skia', 'TypeScript', 'Supabase'],
    summary:
      'A habit coach where every gesture runs on the UI thread — spring-driven onboarding, haptic streaks and offline-first sync.',
    color: 'volt',
    visual: 'phone',
    featured: true,
    sample: true,
    metrics: [
      { value: '120fps', label: 'Sustained on ProMotion devices' },
      { value: '4.8★', label: 'Average store rating' },
      { value: '−38%', label: 'Onboarding drop-off' },
    ],
    sections: [
      {
        heading: 'Challenge',
        body: 'The first version felt like a form with a progress bar. Users quit during onboarding because nothing responded to them — taps lagged behind the JS thread and animations stuttered on mid-range Android phones.',
      },
      {
        heading: 'Approach',
        body: 'Rebuilt every interaction on Reanimated worklets and Skia, so gestures never wait on JavaScript. Streaks became a tactile object you drag and release, and sync moved to a local-first queue that reconciles in the background.',
      },
      {
        heading: 'Outcome',
        body: 'Onboarding completion climbed within two releases, store reviews started mentioning how the app "feels", and the same codebase ships to both stores from one CI pipeline.',
      },
    ],
  },
  {
    slug: 'relay-studio',
    title: 'Relay Studio',
    client: 'Relay Labs',
    year: 2025,
    category: 'desktop',
    platforms: ['macOS', 'Windows', 'Linux'],
    role: 'Principal engineer',
    stack: ['Electron', 'Vue 3', 'Node.js', 'SQLite', 'WebSockets'],
    summary:
      'A visual workflow builder that turns forty-step operations runbooks into drag-and-drop automations that run locally.',
    color: 'cobalt',
    visual: 'window',
    featured: true,
    sample: true,
    metrics: [
      { value: '9h → 12m', label: 'Weekly reconciliation' },
      { value: '3 OS', label: 'From one codebase' },
      { value: '0 bytes', label: 'Customer data leaving the machine' },
    ],
    sections: [
      {
        heading: 'Challenge',
        body: 'Operations lived in spreadsheets and wiki pages. Every reconciliation meant copying data between six tools by hand, and anything cloud-hosted was ruled out by compliance.',
      },
      {
        heading: 'Approach',
        body: 'An Electron app with a node-graph canvas, a sandboxed local runtime and an encrypted SQLite store. Each node is a typed plugin, so the ops team composes workflows without waiting on engineering.',
      },
      {
        heading: 'Outcome',
        body: 'The weekly reconciliation that took a full day now runs during a coffee break, and the team has published over a hundred internal workflows.',
      },
    ],
  },
  {
    slug: 'northstar',
    title: 'Northstar',
    client: 'Northstar Analytics',
    year: 2024,
    category: 'desktop',
    platforms: ['macOS', 'Windows'],
    role: 'Desktop & Rust engineer',
    stack: ['Tauri', 'Rust', 'Vue 3', 'DuckDB', 'Web Workers'],
    summary:
      'A 9 MB data-exploration app that opens a two-gigabyte CSV before your coffee cools.',
    color: 'mint',
    visual: 'window',
    featured: true,
    sample: true,
    metrics: [
      { value: '9 MB', label: 'Installer size' },
      { value: '< 3s', label: 'To open a 2 GB file' },
      { value: '−84%', label: 'Memory vs. the Electron prototype' },
    ],
    sections: [
      {
        heading: 'Challenge',
        body: 'Analysts were waiting minutes for files to open in a browser-based tool, and the Electron prototype used more memory than the datasets themselves.',
      },
      {
        heading: 'Approach',
        body: 'Moved parsing and querying into Rust with an embedded DuckDB engine behind Tauri commands, and kept the Vue UI virtualised so millions of rows scroll at native speed.',
      },
      {
        heading: 'Outcome',
        body: 'A single-digit-megabyte installer that outperforms the web tool it replaced, with auto-updates and native file associations on both platforms.',
      },
    ],
  },
  {
    slug: 'atlas-commerce',
    title: 'Atlas Commerce',
    client: 'Atlas Supply Co.',
    year: 2024,
    category: 'web',
    platforms: ['Web'],
    role: 'Full-stack lead',
    stack: ['Nuxt', 'Vue 3', 'Node.js', 'PostgreSQL', 'Stripe', 'Redis'],
    summary:
      'A headless storefront and admin that ships limited product drops to hundreds of thousands of shoppers without a wobble.',
    color: 'ember',
    visual: 'browser',
    featured: true,
    sample: true,
    metrics: [
      { value: '0.9s', label: 'Median LCP on 4G' },
      { value: '+22%', label: 'Checkout conversion' },
      { value: '400k', label: 'Shoppers on drop day' },
    ],
    sections: [
      {
        heading: 'Challenge',
        body: 'Drops sold out in minutes and the old platform fell over every time. Inventory oversold, carts expired mid-checkout and the admin was too slow to react.',
      },
      {
        heading: 'Approach',
        body: 'A Nuxt storefront rendered at the edge, a queue-backed inventory service with atomic reservations, and an admin rebuilt around keyboard-first workflows for the merchandising team.',
      },
      {
        heading: 'Outcome',
        body: 'The next drop served its largest audience yet with zero oversells, and checkout conversion rose after the redesign of the cart and payment flow.',
      },
    ],
  },
  {
    slug: 'fieldnote',
    title: 'Fieldnote',
    client: 'Meridian Utilities',
    year: 2023,
    category: 'mobile',
    platforms: ['iOS', 'Android'],
    role: 'Senior mobile engineer',
    stack: ['React Native', 'WatermelonDB', 'GraphQL', 'Mapbox'],
    summary: 'Offline-first inspections for crews who work where the signal doesn’t.',
    color: 'blush',
    visual: 'phone',
    featured: false,
    sample: true,
    metrics: [
      { value: '100%', label: 'Usable with zero signal' },
      { value: '3×', label: 'Faster inspection reports' },
      { value: '12k', label: 'Inspections synced weekly' },
    ],
    sections: [
      {
        heading: 'Challenge',
        body: 'Field crews filled in paper forms and re-typed them at the depot. Previous apps failed the moment they lost signal — which was most of the time.',
      },
      {
        heading: 'Approach',
        body: 'A local-first data layer with conflict-aware sync, offline map tiles, and forms generated from a schema the operations team can edit without an app release.',
      },
      {
        heading: 'Outcome',
        body: 'Crews retired paper entirely within a quarter, and reports reach the office the moment a phone sees a network.',
      },
    ],
  },
  {
    slug: 'signal-ops',
    title: 'Signal Ops',
    client: 'Signal Cloud',
    year: 2023,
    category: 'web',
    platforms: ['Web', 'Desktop'],
    role: 'Staff frontend engineer',
    stack: ['React', 'TypeScript', 'tRPC', 'WebSockets', 'Electron'],
    summary:
      'A realtime incident console that keeps sixty on-call engineers looking at the same truth.',
    color: 'volt',
    visual: 'browser',
    featured: false,
    sample: true,
    metrics: [
      { value: '< 200ms', label: 'Event-to-screen latency' },
      { value: '60', label: 'Engineers on one timeline' },
      { value: '−31%', label: 'Mean time to resolve' },
    ],
    sections: [
      {
        heading: 'Challenge',
        body: 'During incidents, every engineer had a different tab open and a different picture of what was happening. Context was lost in chat scrollback.',
      },
      {
        heading: 'Approach',
        body: 'A shared, realtime timeline over WebSockets with optimistic updates, keyboard-driven triage, and an Electron wrapper for native notifications and global shortcuts.',
      },
      {
        heading: 'Outcome',
        body: 'Incidents now run from one screen, hand-offs carry their full context, and resolution times dropped in the first quarter after launch.',
      },
    ],
  },
]
