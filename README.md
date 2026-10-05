# MZ — Portfolio

Personal portfolio for a senior full-stack, React Native and desktop (Tauri/Electron) engineer.
Vue 3 + TypeScript, shadcn-vue, motion.dev (`motion-v`), Lenis and three.js.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build
npm run test         # vitest (unit + component)
npm run lint         # oxlint + eslint
npm run ui:add -- <component>   # add a shadcn-vue component
```

Node ≥ 22.18. If `npm install` fails with `Cannot read properties of null (reading 'edgesOut')`,
that is a bug in npm 11.3 — run `npx npm@11.21.0 install` instead.

---

## Make it yours

Everything personal is data, not markup:

| What | Where |
|---|---|
| Name, role, email, socials, time zone, availability, start year | `src/config/site.ts` |
| Case studies (copy, metrics, stack, colour, device art) | `src/content/projects.ts` |
| Services, testimonials, experience, principles, toolbox | `src/content/profile.ts` |
| Brand mark (MZ) — SVG, favicon *and* the 3D symbol | `src/lib/mark.ts`, `public/favicon.svg` |
| Contact form endpoint | `VITE_CONTACT_ENDPOINT` in `.env.local` (see `.env.example`) |

> **Placeholders:** the email, social links, projects, metrics, testimonials and experience entries
> are illustrative and marked `TODO` / `PLACEHOLDER`. Replace them before publishing.

Real screenshots: add `cover: '/images/<slug>.webp'` to a project and it replaces the generated
device composition (with a skeleton while it loads).

---

## Architecture

```
src/
  config/        site-wide personal config
  content/       typed content (projects, profile)
  services/      content API + contact submission (swap for a CMS/API here only)
  queries/       TanStack Query hooks — caching, loading and error states
  stores/        Pinia: boot progress, route-transition state machine, UI
  composables/   Lenis, theme (View Transitions), local time, page-ready gate
  lib/           motion tokens, zod→vee-validate adapter, mark geometry, utils
  components/
    ui/          shadcn-vue primitives (owned source — edit freely)
    layout/      header, sheet menu, footer, preloader, route curtain, logo
    motion/      RevealText, RotatingWord, ScrollHighlightText, FadeIn, Marquee…
    scene/       three.js hero symbol (lazy-loaded)
    home/        page sections + bento tiles
    work/        case-study building blocks
    skeletons/   layout-matched loading states
  views/         route components (all code-split)
```

### The motion pipeline

1. **Preloader** (`AppPreloader`) counts 0 → 100% from *real* work registered in the boot store —
   fonts, window load, the first route and the WebGL scene — eased, monotonic, with a minimum
   duration and a per-task timeout so a slow asset can never hold the site hostage.
2. When it lifts, `boot.hasRevealed` flips and the hero's reveal text starts underneath the curtain.
3. **Route changes** run through router guards: the curtain covers the page → lazy chunks load
   underneath (the curtain shows the destination and a loading bar) → scroll resets while covered →
   Lenis re-measures → the curtain lifts.
4. Every entrance animation waits on `usePageReady()`, so nothing animates behind an overlay.
5. Lenis runs on motion's frame loop, so smooth scroll and scroll-linked animation sample the same frame.

### The 3D symbol

`components/scene/symbol-scene.ts` extrudes each stroke of the MZ monogram (parsed from the same SVG
path data as the logo) into a bevelled physical-material solid, lit by an image-based studio
environment plus orbiting ember/cobalt lights. Scroll rotates, recedes and opens the strokes; the
pointer tilts it; press-and-hold scatters it. It is fetched on demand (three.js never blocks first
paint), pauses when hidden or faded out, renders on demand under reduced motion, and falls back to a
static composition without WebGL.

### The footer scene

`components/footer/` — a living landscape that the page lifts away from on large screens:

- **Sky** (`FooterSky`): twinkling stars and shooting stars at night; drifting clouds and a bird
  flock by day. **Sun / moon** (`CelestialToggle`) follows the theme and *is* a theme toggle.
- **Marquee** (`FooterMarquee`): drifts on its own, reverses with scroll direction, speeds up and
  leans with scroll velocity.
- **Forest** (`ForestScene`): far / mid / near silhouette layers generated procedurally
  (`lib/forest.ts`, seeded — identical on every load) with parallax, swaying grass and vines, and
  fireflies at night.
- **Jaguar** (`JaguarWalker`): a jointed silhouette with a lateral-sequence walk cycle driven by SVG
  SMIL, so every joint pivots in its own coordinate space. Its crossing speed is derived from the
  stride so the paws plant instead of skating. Eyes catch the moonlight in the dark theme.

All of it pauses off-screen (CSS `animation-play-state` + `svg.pauseAnimations()`) and stands still
under reduced motion.

---

## Design system

Tokens live in `src/styles/main.css` (oklch, light + dark). The structural rules follow
`docs/DESIGN.md` — hairline borders over shadows, semantic tokens only, focus always the accent ring,
44px touch targets, hover gated behind `(hover: hover)`, reduced motion collapses everything —
adapted for a portfolio: **full-colour brand blocks** (ember, volt, cobalt, mint, blush) carry
sections in both themes instead of a single scarce accent, and showcase sequences (preloader, route
curtain, hero) are allowed to run longer than the 500ms UI budget.

Type: Mona Sans (variable width — animated on menu links) for display, Schibsted Grotesk for body,
Martian Mono for labels. All self-hosted via Fontsource.

## Accessibility

Skip link, route announcements and focus management after navigation, `aria-live` where content
changes, reduced-motion paths for every animation, keyboard-operable carousel/testimonials/business
card, validated form with errors linked to fields, and contrast-checked colour pairs per block.

## Deploying

It is a static SPA with history routing: serve `dist/` and rewrite unknown paths to `/index.html`
(Netlify `_redirects`: `/* /index.html 200`; Vercel: a catch-all rewrite).
