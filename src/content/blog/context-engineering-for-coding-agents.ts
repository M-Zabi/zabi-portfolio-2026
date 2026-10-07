import type { Post } from '@/types/blog'

export const post: Post = {
  slug: 'context-engineering-for-coding-agents',
  title: 'Context engineering for coding agents',
  dek: 'The context window is a budget, a cache key and an attention span at once. Treat it like all three.',
  excerpt:
    'Why a 1M-token window does not mean you should fill it: instruction hierarchies, path-scoped rules, prompt-cache prefixes, subagents and hooks — the practical mechanics of feeding a coding agent well.',
  category: 'editors',
  tags: ['Context engineering', 'Prompt caching', 'CLAUDE.md', 'AGENTS.md', 'Subagents', 'Hooks'],
  color: 'volt',
  cover: 'planes',
  publishedAt: '2026-09-18',
  summary: {
    tldr: 'A coding agent’s context window is simultaneously a token budget, a prompt-cache key and the model’s attention. Keep the stable parts (tools, system prompt, instruction files) small and byte-identical so they cache; load everything else just in time; push exploration into subagents; and enforce rules with hooks rather than prose.',
    points: [
      'Prompt caches are prefix matches in the order tools → system → messages; one changed byte (a timestamp, a reordered tool list) invalidates everything after it.',
      'On Claude, a cache read costs 10% of base input (5% on Opus 5.5, 2.5% on Fable 5.1); a 5-minute write costs 1.25×, so caching pays for itself after one hit.',
      'Instruction files should stay under ~200 lines; move file-type-specific rules into path-scoped rules that load only when matching files are touched.',
      'Long contexts lose material in the middle — retrieve precisely instead of pre-loading “just in case”.',
      'Subagents keep noisy searches out of the main context; hooks make rules deterministic.',
    ],
  },
  body: [
    {
      type: 'lead',
      text: 'Frontier models now accept a million tokens. That number is a ceiling, not a target. Every token you put in front of a coding agent costs money, adds latency, competes for the model’s attention and — if it sits in the wrong place — breaks the prompt cache for everything that follows.',
    },
    {
      type: 'p',
      text: '“Prompt engineering” suggested that the craft was in the wording. With agents that run forty tool calls per task, the craft is in the *plumbing*: what is loaded automatically, what is loaded on demand, what is cached, and what never enters the main conversation at all. That is context engineering, and it is mostly a set of mechanical decisions you can get right once.',
    },
    { type: 'h2', id: 'anatomy', text: 'What is actually in the window' },
    {
      type: 'p',
      text: 'Before optimising, measure. A typical agent turn in a mid-sized repository is dominated not by your prompt but by things you did not type: tool definitions, the system prompt, instruction files, and — above all — the accumulated output of earlier tool calls.',
    },
    {
      type: 'figure',
      figure: 'context-budget',
      caption: 'An illustrative turn forty minutes into a refactor. Tool results dominate; the stable prefix is small but is re-sent on every single request, which is why it must cache.',
      alt: 'Stacked bar of a 200,000 token budget: tools and system prompt about 12k, instruction files 6k, conversation 38k, tool results 96k, and 48k unused.',
    },
    {
      type: 'p',
      text: 'Claude Code exposes this directly (`/context` shows the breakdown), and its documentation includes an interactive simulation of how the window fills over a session[^1]. Whatever tool you use, find the equivalent and look before you tune.',
    },
    { type: 'h2', id: 'cache', text: 'The prompt cache is a prefix match' },
    {
      type: 'p',
      text: 'Every major API now discounts repeated input. Anthropic’s implementation is the most explicit about the mechanics: the cache is keyed on an exact prefix of the request rendered in the order **tools → system → messages**, and any byte that changes invalidates everything after it[^2].',
    },
    {
      type: 'table',
      caption: 'Prompt-cache multipliers on Anthropic’s API, relative to base input price (October 2026)[^3].',
      head: ['Operation', 'Multiplier', 'Lifetime'],
      rows: [
        ['5-minute cache write', '1.25×', '5 minutes, refreshed on every hit'],
        ['1-hour cache write', '2×', '1 hour'],
        ['Cache read', '0.1× (0.05× Opus 5.5, 0.025× Fable 5.1)', 'Same as the write it reads'],
      ],
      numeric: [1],
    },
    {
      type: 'p',
      text: 'The arithmetic is stark. With a 5-minute write at 1.25× and reads at 0.1×, caching breaks even after a single hit[^3]. An agent loop re-sends its whole prefix on every turn, so a session with forty turns and a 40k-token stable prefix is paying for roughly 1.6M input tokens — or about 0.2M equivalent if the prefix caches. Silent invalidation is the most expensive bug in agent infrastructure.',
    },
    {
      type: 'list',
      items: [
        '**Timestamps and request IDs in the system prompt.** Move volatile values to the end of the latest user message.',
        '**Non-deterministic tool lists.** Sort tool definitions; never let a plugin system reorder them per request.',
        '**Re-serialised JSON.** Object key order must be stable byte-for-byte.',
        '**Editing instruction files mid-session.** The new file is a new prefix. Claude Code deliberately does not apply CLAUDE.md edits mid-session for this reason[^9].',
        '**Switching models.** Caches are scoped to a model; a mid-session switch starts cold[^9].',
      ],
    },
    {
      type: 'code',
      lang: 'ts',
      filename: 'agent/request.ts',
      code: "import Anthropic from '@anthropic-ai/sdk'\n\nconst client = new Anthropic()\n\nexport function runTurn(history: Anthropic.MessageParam[]) {\n  return client.messages.create({\n    model: 'claude-opus-5-5',\n    max_tokens: 16000,\n    // Stable prefix first: tools and system never change between turns.\n    tools: SORTED_TOOLS,\n    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],\n    // Volatile state (time, branch, diff stats) rides at the end of the newest message.\n    messages: history,\n  })\n}",
      caption: 'Put the breakpoint at the end of the stable prefix. Check `usage.cache_read_input_tokens` — if it stays at zero across turns, something in the prefix is changing.',
    },
    { type: 'h2', id: 'attention', text: 'Attention is the scarcer resource' },
    {
      type: 'p',
      text: 'Even when tokens are cheap, attention is not. Liu et al. showed that models use information at the beginning and end of a long context far better than information in the middle, with accuracy forming a U-shaped curve as the relevant passage moves through the prompt[^5]. Models have improved since, but the engineering lesson holds: a precise 8k-token context beats a padded 80k-token one.',
    },
    {
      type: 'p',
      text: 'That argues for **just-in-time loading**. Instead of pre-stuffing the window with every file that might matter, give the agent good tools to find what does — fast search, a symbol index, a “read lines 120–180” tool — and let it pull material in as the task reveals what is relevant.',
    },
    { type: 'h2', id: 'instructions', text: 'Instruction files: short, layered, scoped' },
    {
      type: 'p',
      text: 'Instruction files are the one part of the prefix you fully control, and they are re-read on every request. Claude Code’s guidance is to keep each CLAUDE.md under about 200 lines and to move rules that only matter for part of the codebase into `.claude/rules/` files with a `paths` glob, which load only when the agent reads or edits a matching file[^4]. AGENTS.md follows the same nearest-file-wins principle for monorepos[^6].',
    },
    {
      type: 'code',
      lang: 'markdown',
      filename: 'AGENTS.md',
      code: '# Portfolio — agent notes\n\n## Commands\n- `npm run dev` — Vite on :5173\n- `npm run verify` — type-check, lint and unit tests (~20s). Run before every hand-off.\n\n## Conventions\n- Vue 3 `<script setup>` + TypeScript; no Options API.\n- Personal data lives in `src/config` and `src/content` only.\n- Motion tokens come from `src/lib/motion.ts`; never hard-code easings.\n\n## Never\n- Commit `.env*` files or edit `dist/`.',
      caption: 'A good instruction file reads like onboarding notes for a sharp new teammate: commands, conventions, sharp edges. No essays.',
    },
    {
      type: 'callout',
      tone: 'warning',
      title: 'Contradictions are worse than omissions',
      text: 'When two instructions conflict, the model may pick either one[^4]. Audit nested files and rules together — a stale rule in a subdirectory silently overrides a fresh one at the root.',
    },
    { type: 'h2', id: 'isolation', text: 'Isolate exploration with subagents' },
    {
      type: 'p',
      text: 'The biggest single consumer of context is exploration: grepping, listing directories, reading files that turn out to be irrelevant. Subagents move that work into a separate context window and return only the conclusion[^7]. The main session gets “dates are parsed in three places: …” instead of twelve file dumps, and its cache prefix stays intact.',
    },
    {
      type: 'p',
      text: 'Use them for anything with a high read-to-insight ratio: audits, “where is X handled?”, dependency research, log spelunking. Do not use them for edits that need the main session’s full understanding of the plan — the handoff loses nuance.',
    },
    { type: 'h2', id: 'enforcement', text: 'Enforce with hooks, not adjectives' },
    {
      type: 'p',
      text: 'Writing “NEVER modify the migrations folder” in capital letters is a request. A `PreToolUse` hook that exits with code 2 when the target path matches `migrations/` is a guarantee — Claude Code blocks the call and feeds your stderr message back to the model so it can adjust[^8]. Formatting, linting and test runs after edits belong in hooks for the same reason: they should happen every time, not when the model remembers.',
    },
    {
      type: 'code',
      lang: 'shell',
      filename: '.claude/hooks/protect-migrations.sh',
      code: '#!/usr/bin/env bash\n# PreToolUse: refuse edits to applied migrations.\npath=$(jq -r \'.tool_input.file_path // empty\')\nif [[ "$path" == *"/migrations/"* ]]; then\n  echo "Applied migrations are immutable. Create a new migration instead." >&2\n  exit 2\nfi',
    },
    { type: 'h2', id: 'checklist', text: 'A checklist for every agent setup' },
    {
      type: 'list',
      items: [
        'Measure the window before tuning it; know your tool-result share.',
        'Freeze the prefix: sorted tools, static system prompt, instruction files that change only between sessions.',
        'Verify cache hits on every deploy — `cache_read_input_tokens` should climb from turn two.',
        'Keep instruction files short; scope the rest with path rules.',
        'Give the agent precise retrieval tools instead of pre-loading files.',
        'Send exploration to subagents; keep edits in the main session.',
        'Turn every “never” into a hook or a permission rule.',
      ],
    },
    {
      type: 'p',
      text: 'None of this is glamorous. All of it compounds: a faster, cheaper, better-focused agent on every task, for every model you will switch to next year.',
    },
  ],
  references: [
    { id: 1, title: 'Explore the context window', publisher: 'Claude Code docs', url: 'https://code.claude.com/docs/en/context-window' },
    { id: 2, title: 'Prompt caching', publisher: 'Claude Platform docs', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-caching' },
    { id: 3, title: 'Pricing — prompt caching multipliers', publisher: 'Claude Platform docs', url: 'https://platform.claude.com/docs/en/about-claude/pricing' },
    { id: 4, title: 'How Claude remembers your project', publisher: 'Claude Code docs', url: 'https://code.claude.com/docs/en/memory' },
    { id: 5, title: 'Lost in the Middle: How Language Models Use Long Contexts (Liu et al., TACL 2024)', publisher: 'arXiv', url: 'https://arxiv.org/abs/2307.03172' },
    { id: 6, title: 'AGENTS.md', publisher: 'agents.md', url: 'https://agents.md/' },
    { id: 7, title: 'Create custom subagents', publisher: 'Claude Code docs', url: 'https://code.claude.com/docs/en/sub-agents' },
    { id: 8, title: 'Automate actions with hooks', publisher: 'Claude Code docs', url: 'https://code.claude.com/docs/en/hooks-guide' },
    { id: 9, title: 'How Claude Code uses prompt caching', publisher: 'Claude Code docs', url: 'https://code.claude.com/docs/en/prompt-caching' },
  ],
}
