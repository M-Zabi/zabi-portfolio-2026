import type { Post } from '@/types/blog'

export const post: Post = {
  slug: 'ai-design-tools-stack-2026',
  title: 'The AI design stack I would actually use in 2026',
  dek: 'Claude Design, Figma Make, Stitch and v0 all turn prompts into interfaces. Which one you pick matters less than what you feed it.',
  excerpt:
    'A working engineer’s guide to AI design tools — what each is good at, where they all fail, and the token-first workflow that keeps generated UI on-brand from canvas to code.',
  category: 'design',
  tags: ['Claude Design', 'Figma Make', 'Google Stitch', 'v0', 'Design tokens', 'OKLCH'],
  color: 'blush',
  cover: 'palette',
  publishedAt: '2026-09-25',
  summary: {
    tldr: 'Prompt-to-UI tools are now genuinely useful, but left alone they all converge on the same generic look. Give them a real design system first — tokens in the W3C format, OKLCH colour ramps, type and motion rules in a DESIGN.md — then pick the tool by where its output needs to land: a canvas, a Figma file, a React repo, or your own codebase.',
    points: [
      'Claude Design (April 2026) reads your codebase and design files to establish a visual language, and exports to PDF, PPTX, URLs and Canva.',
      'Figma Make imports your Figma library so prototypes inherit your palette, type and styling.',
      'Google Stitch turns prompts and sketches into UI and front-end code, with a paste-to-Figma handoff.',
      'The new v0 (February 2026) works inside a real repository: a branch per chat, PRs, deploy on merge.',
      'What AI still skips: brand-specific iconography and illustration, restrained motion, real-device feel, and the error, empty and accessibility states.',
    ],
  },
  body: [
    {
      type: 'lead',
      text: 'You can now describe an app and get a credible interface back in under a minute. The catch is that everyone else can too, and without direction every tool reaches for the same defaults: the same icon set, the same soft gradients, the same rounded cards. The work has shifted from *drawing* the interface to *specifying* it well enough that the output is yours.',
    },
    {
      type: 'p',
      text: 'Nicolas Solerieu, a product and brand designer at Expo, put the gap well: the obvious flaws in AI-generated apps are disappearing, and what remains is the difference between an app that works and one that feels considered[^1][^2]. That difference lives in a brand system, and that is where I start.',
    },
    { type: 'h2', id: 'system-first', text: 'Start with a system, not a prompt' },
    {
      type: 'p',
      text: 'Ask a model to “design a fitness app” and it will improvise a brand to suit itself. Give it tokens and rules and it will follow them. Three artefacts do most of the work:',
    },
    {
      type: 'list',
      ordered: true,
      items: [
        '**Design tokens** in the W3C Design Tokens Community Group format, which reached its first stable version, 2025.10, in October 2025[^8]. One JSON file that Figma plugins, Style Dictionary pipelines and AI tools can all read.',
        '**Colour in OKLCH.** Its lightness channel is perceptually uniform, so ramps step evenly and you can hold contrast while changing hue — the reason this site’s ember, cobalt and volt blocks keep their identity in both themes[^9]. Check every text pair against WCAG 2.2: 4.5:1 for body text, 3:1 for large text and UI components[^10].',
        '**A DESIGN.md** — the design equivalent of an AGENTS.md. Type scale, spacing rhythm, motion budgets, anti-patterns, what “done” means. This portfolio has one, and every AI tool I point at the repository reads it.',
      ],
    },
    {
      type: 'code',
      lang: 'json',
      filename: 'tokens/color.tokens.json',
      code: '{\n  "color": {\n    "$type": "color",\n    "ember": {\n      "$value": { "colorSpace": "oklch", "components": [0.68, 0.205, 38] },\n      "$description": "Primary action and brand block"\n    },\n    "ember-foreground": {\n      "$value": { "colorSpace": "oklch", "components": [0.17, 0.02, 40] }\n    }\n  }\n}',
      caption: 'A DTCG 2025.10-style token file. Colour values are objects with an explicit colour space, so OKLCH survives the trip between tools instead of being flattened to hex[^8].',
    },
    {
      type: 'figure',
      figure: 'design-pipeline',
      caption: 'The system goes in first and the checks come out last. Generation is the cheap middle step.',
      alt: 'A pipeline diagram: brand system (tokens, type, motion, DESIGN.md) feeds a constrained prompt, then generation on a canvas, then critique against a rubric, then implementation in code, then verification for contrast, devices and states.',
    },
    { type: 'h2', id: 'four-tools', text: 'Four tools, four landing zones' },
    {
      type: 'p',
      text: 'The useful way to compare these tools is not by output quality — they leapfrog each other monthly — but by **where the output needs to land** and how much of your system they can absorb.',
    },
    { type: 'h3', text: 'Claude Design — exploration that starts from your codebase' },
    {
      type: 'p',
      text: 'Anthropic launched Claude Design as a research preview on 17 April 2026, powered by Claude Opus 4.7, for prototypes, slides and one-pagers. Its most interesting feature is onboarding: it reads a company’s codebase and design files to establish a shared visual language, so colour, type and components carry into new work. Refinement happens through conversation, comments, direct edits and generated sliders; output goes to PDF, URL, PPTX or Canva for collaborative editing[^3].',
    },
    { type: 'h3', text: 'Figma Make — when the team already lives in Figma' },
    {
      type: 'p',
      text: 'Figma Make is a prompt-to-app tool for interactive, high-fidelity prototypes. Since general availability in July 2025 it can import an existing Figma library — palette, usage guidelines, typography and core styles — and connect to a Supabase backend for richer prototypes[^4]. If your source of truth is a Figma library, this is the shortest path from system to working prototype.',
    },
    { type: 'h3', text: 'Google Stitch — fast, free UI exploration' },
    {
      type: 'p',
      text: 'Stitch, from Google Labs, turns natural-language prompts or images — a whiteboard sketch, a screenshot, a wireframe — into UI designs and front-end code, and pastes the result into Figma for refinement[^5]. It has since moved to Gemini 3[^6]. I use it for breadth: twenty directions in ten minutes, then throw nineteen away.',
    },
    { type: 'h3', text: 'v0 — production React in a real repository' },
    {
      type: 'p',
      text: 'Vercel rebuilt v0 in February 2026 around a sandboxed runtime that imports any GitHub repository, pulls environment configuration from Vercel, and works through git: a branch per chat, pull requests against main, deploy on merge[^7]. For a React or Next.js product, that makes it a design tool whose output is already a reviewable diff.',
    },
    {
      type: 'table',
      caption: 'Pick by landing zone.',
      head: ['Tool', 'Absorbs your system from', 'Output lands in', 'Best for'],
      rows: [
        ['Claude Design', 'Codebase and design files[^3]', 'PDF, PPTX, URL, Canva', 'Exploration, decks, one-pagers that must look on-brand'],
        ['Figma Make', 'An imported Figma library[^4]', 'Figma prototypes and web apps', 'Teams whose source of truth is Figma'],
        ['Google Stitch', 'Prompt and reference images[^5]', 'Figma paste, front-end code', 'Fast, broad exploration'],
        ['v0', 'Your GitHub repository[^7]', 'Branches and PRs', 'React and Next.js products'],
        ['An agent in your repo', 'DESIGN.md, tokens, existing components', 'Commits', 'Final implementation and polish'],
      ],
    },
    { type: 'h2', id: 'workflow', text: 'A workflow that keeps the brand' },
    {
      type: 'list',
      ordered: true,
      items: [
        '**Write the system down** — tokens, type, motion, anti-references — before opening any generator.',
        '**Constrain the prompt.** Name the tokens, the type scale and what to avoid. “Ember blocks for primary actions, hairline borders instead of shadows, no gradients” beats three paragraphs of mood.',
        '**Generate wide, then narrow.** Many cheap directions, one chosen. Never polish the first output.',
        '**Critique against a rubric**: hierarchy, rhythm, contrast, density, states, motion. Ask the model to critique its own output against your DESIGN.md — it catches more than you expect.',
        '**Implement in the codebase** with an agent that reads the same DESIGN.md and reuses existing components rather than inventing new ones.',
        '**Verify on real devices**, in both themes, with reduced motion on, with a screen reader, and with the network throttled.',
      ],
    },
    { type: 'h2', id: 'still-missing', text: 'What AI design still gets wrong' },
    {
      type: 'p',
      text: 'Solerieu’s list of where human judgement still matters matches my experience almost exactly[^2]:',
    },
    {
      type: 'list',
      items: [
        '**Default icons and generic illustration.** Replace the stock set; draw the illustrations that make the product recognisable.',
        '**Motion without restraint.** Purposeful, short transitions that explain state — not everything bouncing.',
        '**Native feel.** Gestures, haptics and keyboard behaviour only reveal themselves on real hardware.',
        '**Consistency and hierarchy.** Generators drift between screens; a system and a critique pass pull them back.',
        '**The unhappy paths.** Error states, empty states, loading states and accessibility are exactly what a prompt about the happy path never mentions.',
      ],
    },
    {
      type: 'callout',
      tone: 'tip',
      title: 'Write your anti-references down',
      text: 'My DESIGN.md lists what this site must *not* look like: purple-to-blue gradient heroes, glassmorphism everywhere, gradient text, neon-on-black “developer” aesthetics. Models are very good at avoiding things you name explicitly.',
    },
    {
      type: 'p',
      text: 'The tools will keep changing. The system you hand them is the durable asset — and it is also exactly what makes your product look like nobody else’s.',
    },
  ],
  references: [
    {
      id: 1,
      title: 'How to apply professional design principles in AI app development (Nicolas Solerieu)',
      publisher: 'Expo blog',
      url: 'https://expo.dev/blog/how-to-apply-professional-design-principles-in-ai-app-development',
    },
    {
      id: 2,
      title: '7 Ways To Close The Gap Between AI-Generated Apps and Great Product Design',
      publisher: 'daily.dev',
      url: 'https://daily.dev/posts/7-ways-to-close-the-gap-between-ai-generated-apps-and-great-product-design-pjkdqvwwq',
    },
    {
      id: 3,
      title: 'Anthropic launches Claude Design, a new product for creating quick visuals',
      publisher: 'TechCrunch',
      url: 'https://techcrunch.com/2026/04/17/anthropic-launches-claude-design-a-new-product-for-creating-quick-visuals/',
    },
    { id: 4, title: 'Figma Make is now available to all users', publisher: 'Figma blog', url: 'https://www.figma.com/blog/figma-make-general-availability/' },
    { id: 5, title: 'From idea to app: Introducing Stitch, a new way to design UIs', publisher: 'Google Developers Blog', url: 'https://developers.googleblog.com/stitch-a-new-way-to-design-uis/' },
    { id: 6, title: 'Bring your app ideas to life with Gemini 3 in Stitch', publisher: 'Google', url: 'https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-gemini-3/' },
    { id: 7, title: 'Introducing the new v0', publisher: 'Vercel', url: 'https://vercel.com/blog/introducing-the-new-v0' },
    { id: 8, title: 'Design Tokens Format Module (first stable version, 2025.10)', publisher: 'W3C Design Tokens Community Group', url: 'https://www.designtokens.org/' },
    { id: 9, title: 'CSS Color Module Level 4 — OKLab and OKLCH', publisher: 'W3C', url: 'https://www.w3.org/TR/css-color-4/' },
    { id: 10, title: 'Web Content Accessibility Guidelines (WCAG) 2.2', publisher: 'W3C', url: 'https://www.w3.org/TR/WCAG22/' },
  ],
}
