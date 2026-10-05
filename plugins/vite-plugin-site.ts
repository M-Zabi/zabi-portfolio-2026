import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { type IndexHtmlTransformContext, loadEnv, type Plugin, type ResolvedConfig } from 'vite'

import { documentTitle, ogImage, type PageMeta, pages, projectPage } from '../src/config/seo'
import { site } from '../src/config/site'
import { experience, games, rig, testimonials } from '../src/content/profile'
import { projects } from '../src/content/projects'
import { WEATHER_ENDPOINT } from '../src/services/weather'

/**
 * Production concerns for a client-rendered site, done at build time:
 *
 *  1. Content guard — every build lists the placeholder content still in the site.
 *  2. Per-route HTML — every route gets its own index.html with title, description, canonical,
 *     Open Graph / Twitter tags and JSON-LD, so link unfurlers (which don't run JS) and crawlers
 *     see the right page. Unknown paths get a real 404.html (served with a 404 status by
 *     Vercel, Netlify, Cloudflare Pages and GitHub Pages alike).
 *  3. sitemap.xml + robots.txt from the same route list.
 *  4. Font preloads for the two faces the first paint needs.
 *  5. A Content Security Policy (as a meta tag, so it works on any static host).
 */

const MARKER = '<!-- site:head -->'

interface Page extends PageMeta {
  path: string
  noindex?: boolean
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function routes(): Page[] {
  return [
    { path: '/', ...pages.home },
    { path: '/work', ...pages.work },
    ...projects.map((project) => ({ path: `/work/${project.slug}`, ...projectPage(project) })),
    { path: '/about', ...pages.about },
    { path: '/contact', ...pages.contact },
  ]
}

/** Every reason the current content is not ready to publish. */
export function contentIssues(siteUrl: string): string[] {
  const issues: string[] = []
  if (!siteUrl || /example\.com/i.test(siteUrl)) {
    issues.push('VITE_SITE_URL is not set to your real domain (e.g. https://yourname.dev).')
  }
  if (/@example\.com$/i.test(site.email)) issues.push(`site.email is a placeholder (${site.email}) — src/config/site.ts`)
  for (const social of site.socials) {
    if (/^https?:\/\/[^/]+\/?$/i.test(social.href)) {
      issues.push(`Social link "${social.label}" points at a bare domain (${social.href}) — src/config/site.ts`)
    }
  }
  const samples = [
    [projects.filter((item) => item.sample).length, 'sample projects', 'src/content/projects.ts'],
    [testimonials.filter((item) => item.sample).length, 'sample testimonials', 'src/content/profile.ts'],
    [experience.filter((item) => item.sample).length, 'sample experience entries', 'src/content/profile.ts'],
    [games.filter((item) => item.sample).length, 'sample games', 'src/content/profile.ts'],
    [rig.filter((item) => item.sample).length, 'sample rig parts', 'src/content/profile.ts'],
  ] as const
  for (const [count, label, file] of samples) {
    if (count > 0) issues.push(`${count} ${label} still marked \`sample: true\` — replace or delete them in ${file}`)
  }
  return issues
}

function headTags(page: Page, siteUrl: string): string {
  const url = `${siteUrl}${page.path === '/' ? '/' : page.path}`
  const title = escapeHtml(documentTitle(page.title))
  const description = escapeHtml(page.description)
  const image = `${siteUrl}${ogImage.path}`
  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    page.noindex ? '<meta name="robots" content="noindex" />' : `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="${page.type ?? 'website'}" />`,
    `<meta property="og:site_name" content="${escapeHtml(site.name)}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="${ogImage.width}" />`,
    `<meta property="og:image:height" content="${ogImage.height}" />`,
    `<meta property="og:image:alt" content="${escapeHtml(`${site.fullName} — ${site.role}`)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ]
  return tags.join('\n    ')
}

function structuredData(siteUrl: string): string {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${siteUrl}/#person`,
        name: site.fullName,
        jobTitle: site.role,
        description: site.description,
        url: `${siteUrl}/`,
        email: `mailto:${site.email}`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: site.home.city,
          addressRegion: site.home.region,
          addressCountry: site.home.countryCode,
        },
        sameAs: site.socials.map((social) => social.href),
      },
      { '@type': 'WebSite', '@id': `${siteUrl}/#website`, url: `${siteUrl}/`, name: site.name, publisher: { '@id': `${siteUrl}/#person` } },
    ],
  }
  // `<` is escaped so content can never close the script element.
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`
}

function contentSecurityPolicy(contactEndpoint: string | undefined): string {
  // The footer's weather report (src/services/weather.ts) reads from Open-Meteo.
  let connect = `'self' ${new URL(WEATHER_ENDPOINT).origin}`
  if (contactEndpoint) {
    try {
      connect += ` ${new URL(contactEndpoint).origin}`
    } catch {
      // Invalid URL — the contact service will report it; keep the policy strict.
    }
  }
  return [
    "default-src 'self'",
    "script-src 'self'",
    // Inline styles: Vue style bindings and motion's popLayout <style>.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src ${connect}`,
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].join('; ')
}

function fontPreloads(bundle: NonNullable<IndexHtmlTransformContext['bundle']>, base: string): string {
  const critical = [/mona-sans-latin-wdth-normal-[\w-]+\.woff2$/, /schibsted-grotesk-latin-wght-normal-[\w-]+\.woff2$/]
  return Object.keys(bundle)
    .filter((file) => critical.some((pattern) => pattern.test(file)))
    .map((file) => `<link rel="preload" href="${base}${file}" as="font" type="font/woff2" crossorigin />`)
    .join('\n    ')
}

function sitemap(siteUrl: string, all: Page[]): string {
  const today = new Date().toISOString().slice(0, 10)
  const urls = all
    .map((page) => `  <url><loc>${siteUrl}${page.path === '/' ? '/' : page.path}</loc><lastmod>${today}</lastmod></url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export function sitePlugin(): Plugin {
  let config: ResolvedConfig
  let siteUrl = ''
  let contactEndpoint: string | undefined

  return {
    name: 'portfolio:site',

    configResolved(resolved) {
      config = resolved
      const env = loadEnv(resolved.mode, resolved.root, 'VITE_')
      siteUrl = (env.VITE_SITE_URL || site.url).replace(/\/+$/, '')
      contactEndpoint = env.VITE_CONTACT_ENDPOINT || undefined
    },

    buildStart() {
      if (config.command !== 'build') return
      const issues = contentIssues(siteUrl)
      if (!issues.length) return
      this.warn(`Placeholder content is shipping:\n  • ${issues.join('\n  • ')}\n`)
    },

    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        const home = { path: '/', ...pages.home }
        const build = config.command === 'build' && context.bundle
        // A CSP meta tag only governs what follows it, so it leads the head.
        const tags = [
          build ? `<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy(contactEndpoint)}" />` : '',
          headTags(home, siteUrl || 'http://localhost'),
          build ? fontPreloads(context.bundle!, config.base) : '',
          structuredData(siteUrl || 'http://localhost'),
        ].filter(Boolean)
        return html.replace(MARKER, `${MARKER}\n    ${tags.join('\n    ')}`)
      },
    },

    async closeBundle() {
      if (config.command !== 'build') return
      const outDir = config.build.outDir
      const shell = await readFile(join(outDir, 'index.html'), 'utf8')

      // Replace only the generated per-page tags (title … twitter:image), keep everything else.
      const pageBlock = /<title>[\s\S]*?<meta name="twitter:image" content="[^"]*" \/>/
      if (!shell.includes(MARKER) || !pageBlock.test(shell)) {
        this.warn('portfolio:site — head marker not found; per-route HTML skipped.')
        return
      }

      const render = (page: Page) => shell.replace(pageBlock, headTags(page, siteUrl))
      const all = routes()

      await Promise.all(
        all
          .filter((page) => page.path !== '/')
          .map(async (page) => {
            const file = join(outDir, page.path, 'index.html')
            await mkdir(dirname(file), { recursive: true })
            await writeFile(file, render(page))
          }),
      )
      await writeFile(join(outDir, '404.html'), render({ path: '/404', ...pages.notFound, noindex: true }))
      await writeFile(join(outDir, 'sitemap.xml'), sitemap(siteUrl, all))
      await writeFile(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`)
    },
  }
}
