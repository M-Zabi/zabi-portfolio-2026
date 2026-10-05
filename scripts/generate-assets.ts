/**
 * Renders the social preview image and app icons from the live config and the MZ mark.
 * Re-run after changing your name/role:  npm run assets
 *
 * Uses the locally installed Chrome when present (no browser download); falls back to
 * Playwright's Chromium (`npx playwright install chromium`).
 */
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from '@playwright/test'
import { loadEnv } from 'vite'

import { site } from '../src/config/site.ts'
import { markPieces, markViewBox } from '../src/lib/mark.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
const require = createRequire(import.meta.url)

// Embedded as data URLs: pages created with setContent may not load file:// resources.
const fontUrl = async (pkg: string, file: string) => {
  const data = await readFile(join(dirname(require.resolve(`${pkg}/package.json`)), 'files', file))
  return `data:font/woff2;base64,${data.toString('base64')}`
}

const fonts = `
  @font-face { font-family: 'Mona Sans'; src: url('${await fontUrl('@fontsource-variable/mona-sans', 'mona-sans-latin-wdth-normal.woff2')}') format('woff2'); font-weight: 200 900; font-stretch: 75% 125%; }
  @font-face { font-family: 'Martian Mono'; src: url('${await fontUrl('@fontsource-variable/martian-mono', 'martian-mono-latin-wdth-normal.woff2')}') format('woff2'); font-weight: 100 800; font-stretch: 75% 112.5%; }
`

const INK = '#191512'
const PAPER = '#f7f4ef'
const EMBER = '#f2622e'
const VOLT = '#e3ec4f'
const COBALT = '#2a4fd6'
const MINT = '#8fe0c0'

const mark = (fill: string, style = '') =>
  `<svg viewBox="${markViewBox}" style="${style}" fill="${fill}">${markPieces.map((piece) => `<path d="${piece.d}"/>`).join('')}</svg>`

const host = site.url.replace(/^https?:\/\//, '').replace(/\/$/, '')

const ogHtml = `<!doctype html><html><head><style>
  ${fonts}
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: ${INK}; color: ${PAPER}; font-family: 'Mona Sans'; overflow: hidden; position: relative; }
  .tile { position: absolute; border-radius: 36px; }
  .label { font-family: 'Martian Mono'; font-size: 17px; letter-spacing: 0.08em; text-transform: uppercase; font-stretch: 90%; }
</style></head><body>
  <div class="tile" style="width:330px;height:420px;right:150px;top:150px;background:${COBALT};transform:rotate(-9deg)"></div>
  <div class="tile" style="width:330px;height:420px;right:95px;top:118px;background:${VOLT};transform:rotate(4deg)"></div>
  <div class="tile" style="width:330px;height:420px;right:60px;top:96px;background:${EMBER};display:grid;place-items:center;transform:rotate(-2deg)">
    ${mark(INK, 'width:230px')}
  </div>
  <div style="position:absolute;left:72px;top:70px;display:flex;align-items:center;gap:16px">
    ${mark(EMBER, 'height:30px')}
    <span class="label" style="opacity:.7">Portfolio</span>
  </div>
  <div style="position:absolute;left:72px;top:190px;width:640px">
    <div style="font-size:118px;font-weight:760;font-stretch:112%;letter-spacing:-0.045em;line-height:.9">${site.fullName}</div>
    <div class="label" style="margin-top:28px;color:${MINT}">${site.role}</div>
    <div style="margin-top:22px;font-size:30px;line-height:1.3;font-weight:450;opacity:.85;max-width:560px">
      Web platforms, React Native apps and desktop tools that feel alive.
    </div>
  </div>
  <div class="label" style="position:absolute;left:72px;bottom:58px;opacity:.6">${host}</div>
</body></html>`

const iconHtml = (size: number, padding: number, background: string, fill: string) => `<!doctype html><html><head><style>
  * { margin: 0 } body { width: ${size}px; height: ${size}px; background: ${background}; display: grid; place-items: center; }
</style></head><body>${mark(fill, `width:${size - padding * 2}px`)}</body></html>`

async function launch() {
  try {
    return await chromium.launch({ channel: 'chrome' })
  } catch {
    return await chromium.launch()
  }
}

const browser = await launch()
const page = await browser.newPage()

async function render(html: string, width: number, height: number, file: string, transparent = false) {
  await page.setViewportSize({ width, height })
  await page.setContent(html, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: join(publicDir, file), omitBackground: transparent })
  console.log(`  ✓ public/${file}`)
}

console.log('Rendering assets…')
await render(ogHtml, 1200, 630, 'og.png')
await render(iconHtml(180, 30, EMBER, INK), 180, 180, 'apple-touch-icon.png')
await render(iconHtml(192, 34, EMBER, INK), 192, 192, 'icon-192.png')
// Maskable: the mark stays inside the 80% safe zone.
await render(iconHtml(512, 120, EMBER, INK), 512, 512, 'icon-512.png')
await render(iconHtml(32, 2, 'transparent', EMBER), 32, 32, 'favicon-32.png', true)

const manifest = {
  name: `${site.fullName} — ${site.role}`,
  short_name: site.name,
  description: site.description,
  start_url: '/',
  display: 'browser',
  background_color: PAPER,
  theme_color: INK,
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
}
await writeFile(join(publicDir, 'site.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log('  ✓ public/site.webmanifest')

await browser.close()
