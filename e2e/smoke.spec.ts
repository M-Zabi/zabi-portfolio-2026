import { expect, type Page, test } from '@playwright/test'

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
const routes = ['/', '/work', ...(firstProject ? [`/work/${firstProject.slug}`] : []), '/about', '/contact']

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

test('the contact form validates before sending', async ({ page }) => {
  await page.goto('/contact')
  await waitForSite(page)

  await page.getByRole('button', { name: /send message/i }).click()
  await expect(page.getByText('Tell me what to call you.')).toBeVisible()
  await expect(page.getByLabel('Your name')).toBeFocused()

  await page.getByLabel('Your name').fill('Ada Lovelace')
  await page.getByLabel('Email').fill('not-an-email')
  await page.getByLabel('Email').blur()
  await expect(page.getByText('That email doesn’t look right.')).toBeVisible()
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
