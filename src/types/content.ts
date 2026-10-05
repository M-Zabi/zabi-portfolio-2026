export type BrandColor = 'ember' | 'volt' | 'cobalt' | 'mint' | 'blush'

export type ProjectCategory = 'web' | 'mobile' | 'desktop'

/** Which device composition `ProjectVisual` renders when a project has no cover image. */
export type ProjectVisualKind = 'phone' | 'browser' | 'window'

export interface ProjectMetric {
  value: string
  label: string
}

export interface ProjectSection {
  heading: string
  body: string
}

export interface Project {
  slug: string
  title: string
  client: string
  year: number
  category: ProjectCategory
  platforms: string[]
  role: string
  stack: string[]
  summary: string
  color: BrandColor
  visual: ProjectVisualKind
  /** Optional real screenshot. When present it replaces the generated device composition. */
  cover?: string
  featured: boolean
  metrics: ProjectMetric[]
  sections: ProjectSection[]
  links?: { live?: string; repo?: string }
  /** Illustrative sample content. The production build refuses to ship records marked this way. */
  sample?: boolean
}

export type ServiceIconKind = 'web' | 'mobile' | 'desktop' | 'flow'

export interface Service {
  id: string
  title: string
  tagline: string
  description: string
  icon: ServiceIconKind
  color: BrandColor
}

export interface Testimonial {
  id: string
  quote: string
  name: string
  role: string
  company: string
  avatar?: string
  color: BrandColor
  projectSlug?: string
  /** Illustrative sample content. The production build refuses to ship records marked this way. */
  sample?: boolean
}

export interface ExperienceEntry {
  period: string
  role: string
  company: string
  summary: string
  /** Illustrative sample content. The production build refuses to ship records marked this way. */
  sample?: boolean
}

export interface StackGroup {
  label: string
  items: string[]
}

export interface Principle {
  title: string
  body: string
}
