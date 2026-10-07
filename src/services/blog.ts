import { relatedPosts, sortByDate } from '@/lib/blog'
import type { Post, PostCategory } from '@/types/blog'

/**
 * Blog content API. Like the projects service, it reads code-split local modules today —
 * moving the articles to a CMS only changes this file.
 */

async function loadPosts(): Promise<Post[]> {
  const { posts } = await import('@/content/blog')
  return sortByDate(posts)
}

export async function fetchPosts(category?: PostCategory): Promise<Post[]> {
  const posts = await loadPosts()
  return category ? posts.filter((post) => post.category === category) : posts
}

/** Resolves `null` (not an error) for an unknown slug so the view can render a designed 404. */
export async function fetchPost(slug: string): Promise<Post | null> {
  const posts = await loadPosts()
  return posts.find((post) => post.slug === slug) ?? null
}

export async function fetchRelatedPosts(slug: string, limit = 2): Promise<Post[]> {
  const posts = await loadPosts()
  const post = posts.find((candidate) => candidate.slug === slug)
  return post ? relatedPosts(post, posts, limit) : []
}
