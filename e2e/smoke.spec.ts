import { expect, type Page, test } from '@playwright/test'

import { posts } from '../src/content/blog'
import { projects } from '../src/content/projects'

/** Collects anything the browser reports as broken: exceptions, console errors, CSP violations. */
function watchForErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  return errors
}

/** The preloader is a progressbar; the site is interactive once it has gone. */
async function waitForSite(page: Page) {
  await expect(page.getByRole('progressbar', { name: /loading portfolio/i })).toBeHidden({ timeout: 15_000 })
}

const firstProject = projects[0]
const firstPost = posts[0]
const routes = [
  '/',
  '/work',
  ...(firstProject ? [`/work/${firstProject.slug}`] : []),
  '/about',
  '/blog',
  ...(firstPost ? [`/blog/${firstPost.slug}`] : []),
  '/contact',
  '/contact?intent=resume',
]

test.describe('every route', () => {
  for (const path of routes) {
    test(`${path} loads cleanly`, async ({ page }) => {
      const errors = watchForErrors(page)
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      await waitForSite(page)
      await expect(page.locator('h1')).toBeVisible()
      expect(errors).toEqual([])
    })
  }
})

test('static HTML carries page-specific previews for link unfurlers', async ({ request }) => {
  test.skip(!firstProject, 'no projects')
  const html = await (await request.get(`/work/${firstProject!.slug}`)).text()
  expect(html).toContain(`<title>${firstProject!.title} — `)
  expect(html).toMatch(/<meta property="og:image" content="[^"]+\/og\.png" \/>/)
  expect(html).toMatch(/<link rel="canonical" href="[^"]+\/work\/[^"]+" \/>/)
  expect(html).toContain('http-equiv="Content-Security-Policy"')
})

test('menu navigation runs through the route curtain', async ({ page }) => {
  const errors = watchForErrors(page)
  await page.goto('/')
  await waitForSite(page)

  await page.getByRole('button', { name: /menu/i }).click()
  const menu = page.getByRole('dialog', { name: 'Menu' })
  await expect(menu).toBeVisible()
  await menu.getByRole('link', { name: /work/i }).click()

  await expect(page).toHaveURL(/\/work$/)
  await expect(page.getByRole('heading', { level: 1, name: /selected work/i })).toBeVisible()
  await expect(menu).toBeHidden()
  await expect(page).toHaveTitle(/^Work — /)
  expect(errors).toEqual([])
})

test('the contact assistant asks one question at a time and validates each answer', async ({ page }) => {
  await page.goto('/contact')
  await waitForSite(page)

  const name = page.getByLabel(/what should i call you/i)
  await expect(name).toBeFocused({ timeout: 10_000 })
  await name.press('Enter')
  await expect(page.getByRole('alert').filter({ hasText: 'Tell me what to call you.' })).toBeVisible()

  await name.fill('Ada Lovelace')
  await name.press('Enter')
  const email = page.getByLabel(/where should zabi reply/i)
  await expect(email).toBeFocused({ timeout: 10_000 })
  await email.fill('not-an-email')
  await email.press('Enter')
  await expect(page.getByRole('alert').filter({ hasText: 'That email doesn’t look right.' })).toBeVisible()

  // Going back removes the answer and asks again.
  await page.getByRole('button', { name: /^back$/i }).click()
  await expect(page.getByLabel(/what should i call you/i)).toBeFocused({ timeout: 10_000 })
})

test('an article supports hearts, comments and the AI summary', async ({ page }) => {
  test.skip(!firstPost, 'no posts')
  const errors = watchForErrors(page)
  await page.goto(`/blog/${firstPost!.slug}`)
  await waitForSite(page)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(firstPost!.title.split(' ')[0]!)

  await page.getByRole('button', { name: /summarize with ai/i }).click()
  const summary = page.getByRole('region', { name: 'AI summary' })
  await expect(summary).toBeVisible()
  await expect(summary.getByText(/key points/i)).toBeVisible({ timeout: 15_000 })

  await page.getByRole('button', { name: /be the first to comment|read \d+ comment/i }).click()
  const drawer = page.getByRole('dialog')
  await expect(drawer).toBeVisible()
  await drawer.getByLabel('Name').fill('Ada')
  await drawer.getByLabel('Comment').fill('The KV cache arithmetic finally clicked.')
  await drawer.getByRole('button', { name: /post comment/i }).click()
  await expect(drawer.getByText('The KV cache arithmetic finally clicked.')).toBeVisible()
  await expect(drawer.getByRole('heading', { name: '1 comment' })).toBeVisible()
  expect(errors).toEqual([])
})

test('the theme toggle switches and persists', async ({ page }) => {
  await page.goto('/')
  await waitForSite(page)
  const html = page.locator('html')
  const wasDark = ((await html.getAttribute('class')) ?? '').includes('dark')

  await page.getByRole('button', { name: /switch to (light|dark) theme/i }).click()
  await expect(html).toHaveClass(wasDark ? /^(?!.*\bdark\b)/ : /\bdark\b/)

  await page.reload()
  await waitForSite(page)
  await expect(html).toHaveClass(wasDark ? /^(?!.*\bdark\b)/ : /\bdark\b/)
})

test('unknown paths render the designed not-found page', async ({ page }) => {
  await page.goto('/this-page-does-not-exist')
  await waitForSite(page)
  await expect(page.getByRole('heading', { level: 1, name: /different route/i })).toBeVisible()
  await expect(page.locator('meta[name="robots"][content="noindex"]').first()).toBeAttached()
})

test('reduced motion: the site is ready quickly and fully usable', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = watchForErrors(page)
  await page.goto('/')
  await expect(page.getByRole('progressbar', { name: /loading portfolio/i })).toBeHidden({ timeout: 6_000 })
  await expect(page.locator('h1')).toBeVisible()
  expect(errors).toEqual([])
  await context.close()
})
