import type {
  ExperienceEntry,
  Principle,
  Service,
  StackGroup,
  Testimonial,
} from '@/types/content'

export const services: Service[] = [
  {
    id: '001',
    title: 'Web platforms',
    tagline: 'Fast by default, delightful by design.',
    description:
      'Vue, React and Node products — from the first schema to the last micro-interaction, with performance budgets that hold up in production.',
    icon: 'web',
    color: 'ember',
  },
  {
    id: '002',
    title: 'Mobile apps',
    tagline: 'Native feel, one codebase.',
    description:
      'React Native and Expo apps that run at the refresh rate of the device, work offline, and pass store review the first time.',
    icon: 'mobile',
    color: 'volt',
  },
  {
    id: '003',
    title: 'Desktop apps',
    tagline: 'Small installers, serious power.',
    description:
      'Tauri and Electron tools with native menus, auto-updates and file-system workflows your team actually enjoys opening.',
    icon: 'desktop',
    color: 'mint',
  },
  {
    id: '004',
    title: 'Workflow & UX',
    tagline: 'Smooth from the first click.',
    description:
      'Prototypes, motion systems and components that turn a complicated process into a few obvious steps.',
    icon: 'flow',
    color: 'blush',
  },
]

/**
 * PLACEHOLDER TESTIMONIALS — replace with real quotes (and permission) before publishing.
 */
export const testimonials: Testimonial[] = [
  {
    id: 't1',
    quote:
      'Our onboarding was rebuilt in three weeks and it’s now the first thing investors comment on. The app finally feels like the product we pitched.',
    name: 'Maya Okafor',
    role: 'Head of Product',
    company: 'Cadence Health',
    color: 'ember',
    projectSlug: 'cadence',
    sample: true,
  },
  {
    id: 't2',
    quote:
      'We handed over a forty-step runbook and got back a desktop tool our ops team opens before their email.',
    name: 'Daniel Brooks',
    role: 'VP Operations',
    company: 'Relay Labs',
    color: 'cobalt',
    projectSlug: 'relay-studio',
    sample: true,
  },
  {
    id: 't3',
    quote:
      'A rare combination: ships fast, sweats the motion details, and leaves every codebase cleaner than it was.',
    name: 'Priya Raman',
    role: 'CTO',
    company: 'Atlas Supply Co.',
    color: 'mint',
    projectSlug: 'atlas-commerce',
    sample: true,
  },
  {
    id: 't4',
    quote: 'Our crews stopped carrying paper. That’s the whole review.',
    name: 'Tomás Herrera',
    role: 'Field Director',
    company: 'Meridian Utilities',
    color: 'blush',
    projectSlug: 'fieldnote',
    sample: true,
  },
]

/** PLACEHOLDER — Northwind, Contoso and Fabrikam are sample company names. */
export const experience: ExperienceEntry[] = [
  {
    period: '2023 — Now',
    sample: true,
    role: 'Independent engineer',
    company: 'Self-employed',
    summary:
      'Product engineering for startups and scale-ups across web, React Native and desktop — usually as the first senior hire or the person who unblocks a stuck launch.',
  },
  {
    period: '2020 — 2023',
    sample: true,
    role: 'Lead mobile engineer',
    company: 'Northwind Studio',
    summary:
      'Led a team of five shipping React Native apps for health and fintech clients; introduced the motion system and the shared component library.',
  },
  {
    period: '2018 — 2020',
    sample: true,
    role: 'Full-stack engineer',
    company: 'Contoso Labs',
    summary:
      'Built the customer dashboard and the internal Electron tooling that replaced a tangle of scripts and spreadsheets.',
  },
  {
    period: '2016 — 2018',
    sample: true,
    role: 'Frontend developer',
    company: 'Fabrikam Digital',
    summary:
      'Marketing sites and the first product UIs — where the obsession with smooth, interruptible interactions started.',
  },
]

export const principles: Principle[] = [
  {
    title: 'Feel is a feature',
    body: 'Latency, easing and feedback decide whether software feels trustworthy. They get designed and measured like any other requirement.',
  },
  {
    title: 'Workflows over screens',
    body: 'I start from the job someone is trying to finish, then remove steps until the interface is the shortest path to done.',
  },
  {
    title: 'Leave it better',
    body: 'Typed boundaries, tests where they matter, and documentation the next engineer will actually read.',
  },
]

export const stack: StackGroup[] = [
  {
    label: 'Frontend',
    items: ['Vue 3', 'Nuxt', 'React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Motion'],
  },
  { label: 'Mobile', items: ['React Native', 'Expo', 'Reanimated', 'Skia', 'Native modules'] },
  { label: 'Desktop', items: ['Tauri', 'Rust', 'Electron', 'Auto-update', 'Code signing'] },
  { label: 'Backend', items: ['Node.js', 'tRPC', 'GraphQL', 'PostgreSQL', 'Redis', 'Supabase'] },
  { label: 'Craft', items: ['Design systems', 'Motion design', 'three.js', 'Accessibility', 'Figma'] },
]

export const marqueeStack = [
  'Vue',
  'React Native',
  'TypeScript',
  'Tauri',
  'Electron',
  'Node.js',
  'Expo',
  'Rust',
  'PostgreSQL',
  'three.js',
  'Nuxt',
  'Reanimated',
]
