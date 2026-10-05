import type { Project } from '@/types/content'

import { site } from './site'

/**
 * Page titles and descriptions — one source for both the client (`useHead` in each view) and
 * the build (`plugins/vite-plugin-site.ts` writes them into a static HTML file per route, so
 * crawlers and link unfurlers that don't run JavaScript still see the right preview).
 *
 * Build-time safe: no browser APIs, value imports only from ./site.
 */

export interface PageMeta {
  /** Short title; `documentTitle` adds the site name. Omit for the home page. */
  title?: string
  description: string
  type?: 'website' | 'article' | 'profile'
}

export function documentTitle(title?: string): string {
  return title ? `${title} — ${site.name}` : `${site.name} — ${site.role}`
}

export const pages = {
  home: { description: site.description, type: 'website' },
  work: {
    title: 'Work',
    description: 'Selected web, mobile and desktop projects — each with the problem, the approach and the result.',
  },
  about: {
    title: 'About',
    description: `About ${site.name} — ${site.role} based in ${site.home.city}, ${site.home.country}.`,
    type: 'profile',
  },
  contact: { title: 'Contact', description: `Start a project with ${site.name}. ${site.replyTime}.` },
  notFound: { title: 'Not found', description: 'This page doesn’t exist — it may have moved.' },
} satisfies Record<string, PageMeta>

export function projectPage(project: Project): PageMeta {
  return { title: project.title, description: project.summary, type: 'article' }
}

/** Social preview image (1200 × 630), regenerated with `npm run assets`. */
export const ogImage = { path: '/og.png', width: 1200, height: 630 }
