import { describe, expect, it } from 'vitest'

import { projects } from '@/content/projects'

import { fetchFeaturedProjects, fetchNextProject, fetchProject, fetchProjects } from '../content'

describe('content service', () => {
  it('lists every project, optionally by category', async () => {
    expect(await fetchProjects()).toHaveLength(projects.length)

    const mobile = await fetchProjects('mobile')
    expect(mobile.length).toBeGreaterThan(0)
    expect(mobile.every((project) => project.category === 'mobile')).toBe(true)
  })

  it('returns only featured projects for the home carousel', async () => {
    const featured = await fetchFeaturedProjects()
    expect(featured.every((project) => project.featured)).toBe(true)
  })

  it('resolves null — not an error — for an unknown slug', async () => {
    await expect(fetchProject('does-not-exist')).resolves.toBeNull()
  })

  it('wraps "next project" around to the first entry', async () => {
    const last = projects[projects.length - 1]!
    const next = await fetchNextProject(last.slug)
    expect(next?.slug).toBe(projects[0]!.slug)
  })

  it('has unique slugs and three story sections per case study', () => {
    expect(new Set(projects.map((project) => project.slug)).size).toBe(projects.length)
    for (const project of projects) expect(project.sections).toHaveLength(3)
  })
})
