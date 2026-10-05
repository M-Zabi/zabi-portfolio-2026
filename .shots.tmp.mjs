import { chromium } from '@playwright/test'

const out = process.argv[2]
const base = 'http://localhost:4179/this-page-does-not-exist'
const browser = await chromium.launch({ channel: 'chrome' })
const errors = []

async function run(name, options, theme, all) {
  const context = await browser.newContext({ ...options, reducedMotion: 'reduce', colorScheme: theme })
  await context.addInitScript((t) => localStorage.setItem('zabi-theme', t), theme)
  const page = await context.newPage()
  page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`))
  page.on('console', (m) => m.type() === 'error' && errors.push(`${name}: ${m.text()}`))
  await page.goto(base)
  await page.getByRole('progressbar', { name: /loading portfolio/i }).waitFor({ state: 'hidden', timeout: 15000 })
  await page.waitForTimeout(1200)
  const seen = new Set()
  for (let i = 0; i < 40 && seen.size < (all ? 7 : 1); i++) {
    const caption = (await page.locator('figcaption span').first().innerText()).trim()
    const id = caption.split('·')[1].trim().replace(/[^a-z]+/gi, '-').toLowerCase()
    if (!seen.has(id)) {
      seen.add(id)
      await page.screenshot({ path: `${out}/${name}-${id}.png` })
    }
    await page.getByRole('button', { name: 'Another one' }).click()
    await page.waitForTimeout(700)
  }
  await context.close()
  return seen
}

console.log([...(await run('desk-light', { viewport: { width: 1440, height: 900 } }, 'light', true))])
console.log([...(await run('desk-dark', { viewport: { width: 1440, height: 900 } }, 'dark', false))])
console.log([...(await run('lg-light', { viewport: { width: 1024, height: 768 } }, 'light', false))])
console.log([...(await run('phone-light', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, 'light', true))])
console.log('errors:', errors)
await browser.close()
