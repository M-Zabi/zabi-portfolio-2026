import type { Project, ProjectCategory } from '@/types/content'

/**
 * Content API. Today it reads code-split local modules; swapping in a CMS or REST
 * endpoint only changes this file — queries, loading and error states stay the same.
 */

async function loadProjects(): Promise<Project[]> {
  const { projects } = await import('@/content/projects')
  return projects
}

export async function fetchProjects(category?: ProjectCategory): Promise<Project[]> {
  const projects = await loadProjects()
  return category ? projects.filter((project) => project.category === category) : projects
}

export async function fetchFeaturedProjects(): Promise<Project[]> {
  const projects = await loadProjects()
  return projects.filter((project) => project.featured)
}

/** Resolves `null` (not an error) for an unknown slug so the view can render a designed 404. */
export async function fetchProject(slug: string): Promise<Project | null> {
  const projects = await loadProjects()
  return projects.find((project) => project.slug === slug) ?? null
}

/** The project after `slug`, wrapping around — powers the "Next project" link. */
export async function fetchNextProject(slug: string): Promise<Project | null> {
  const projects = await loadProjects()
  const index = projects.findIndex((project) => project.slug === slug)
  if (index === -1 || projects.length < 2) return null
  return projects[(index + 1) % projects.length] ?? null
}
