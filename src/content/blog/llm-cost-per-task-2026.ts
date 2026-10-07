import type { Post } from '@/types/blog'

export const post: Post = {
  slug: 'llm-cost-per-task-2026',
  title: 'What an LLM call really costs in October 2026',
  dek: 'List prices per million tokens are the least useful number on the pricing page. Here is how to compute cost per completed task instead.',
  excerpt:
    'A side-by-side of Anthropic, OpenAI, Google and DeepSeek pricing as of October 2026 — and a worked agentic-coding example showing why caching, output share and success rate matter more than the headline rate.',
  category: 'economics',
  tags: ['Pricing', 'Prompt caching', 'Batch API', 'Claude', 'GPT', 'Gemini', 'DeepSeek'],
  color: 'ember',
  cover: 'ledger',
  publishedAt: '2026-10-06',
  featured: true,
  summary: {
    tldr: 'For agentic workloads, the input price you see is mostly irrelevant: 90%+ of input tokens should be cache reads, output and reasoning tokens dominate the bill, and the only number that matters is cost per *completed* task. In a 30-turn coding task, prompt caching cuts the Claude Opus 5.5 bill by about 76%, and model prices span roughly 50× from DeepSeek Flash to GPT-6 Astra.',
    points: [
      'Cache reads cost 10% of input on most Claude models (5% on Opus 5.5, 2.5% on Fable 5.1), 10% on OpenAI’s GPT-5.x line, and about 2–3% on DeepSeek.',
      'Batch APIs at Anthropic, OpenAI and Google halve the price for work that can wait up to 24 hours; DeepSeek halves it off-peak instead.',
      'Tokenisers differ — Anthropic notes its 4.7+ tokenizer emits ~30% more tokens for the same text — so per-token prices are not directly comparable.',
      'Divide cost per attempt by success rate: a model at half the price with half the success rate costs the same per finished task, plus your review time.',
      'Gemini Flash introductory prices double on 1 January 2027; re-run your numbers then.',
    ],
  },
  body: [
    {
      type: 'lead',
      text: 'Every model launch comes with a price per million tokens, and every comparison table lines those prices up as if they were the cost of using the model. For chat they are close enough. For agents — which re-send a growing context on every turn, think before they answer and sometimes fail — they are off by an order of magnitude.',
    },
    {
      type: 'p',
      text: 'This post does three things: lists the October 2026 rate cards from the four providers I use most, works through a realistic agentic coding task to show where the money actually goes, and gives you a formula to evaluate the next model that launches.',
    },
    {
      type: 'callout',
      tone: 'note',
      title: 'Prices move',
      text: 'Every figure below was read from the providers’ official pricing pages in the first week of October 2026[^1][^2][^3][^4]. They will change — the method will not.',
    },
    { type: 'h2', id: 'rate-cards', text: 'The rate cards' },
    {
      type: 'table',
      caption: 'Standard pay-as-you-go prices in US dollars per million tokens. “Cache read” is the price of input served from a prompt cache.',
      head: ['Model', 'Input', 'Cache read', 'Output'],
      rows: [
        ['Claude Fable 5.1', '$10.00', '$0.25', '$50.00'],
        ['Claude Opus 5.5', '$4.00', '$0.20', '$20.00'],
        ['Claude Sonnet 5.5', '$2.00', '$0.20', '$10.00'],
        ['Claude Haiku 4.5', '$1.00', '$0.10', '$5.00'],
        ['GPT-6 Astra', '$10.00', '$1.00', '$50.00'],
        ['GPT-5.6 Sol', '$4.00', '$0.40', '$20.00'],
        ['GPT-5.4 mini', '$0.75', '$0.075', '$4.50'],
        ['Gemini 3.1 Pro Preview (≤200k)', '$2.00', '$0.20', '$12.00'],
        ['Gemini 3.8 Flash (intro, to 31 Dec)', '$0.75', '$0.075', '$3.75'],
        ['DeepSeek V4 Pro (peak)', '$1.32', '$0.044', '$3.96'],
        ['DeepSeek Flash (peak)', '$0.30', '$0.006', '$1.20'],
      ],
      numeric: [1, 2, 3],
    },
    {
      type: 'p',
      text: 'Some fine print changes the picture materially:',
    },
    {
      type: 'list',
      items: [
        '**Cache writes are not free on Claude.** A 5-minute cache write costs 1.25× base input, a 1-hour write 2×; reads then cost 0.1× — or 0.05× on Opus 5.5 and 0.025× on Fable 5.1, which is why those two have unusually cheap cache reads[^1].',
        '**Gemini Pro doubles past 200k tokens** of prompt: $4 input and $18 output[^3]. Claude 4.6 and later bill the full 1M window at the standard rate[^1].',
        '**Gemini Flash prices are introductory** and double on 1 January 2027[^3].',
        '**DeepSeek is time-of-day priced**: off-peak is half of peak. Peak is 01:00–04:00 and 06:00–10:00 UTC on weekdays[^4].',
        '**Data residency costs extra**: pinning Claude inference to the US multiplies every token category by 1.1×[^1].',
      ],
    },
    { type: 'h2', id: 'tokens-are-not-tokens', text: 'A token is not a token' },
    {
      type: 'p',
      text: 'Per-token prices assume you are counting the same thing. You are not. Each provider has its own tokenizer, and the same source file splits into different numbers of tokens. Anthropic is unusually candid about this: its Claude 4.7-and-later tokenizer “produces approximately 30% more tokens for the same text” than earlier models[^1]. A model that looks 20% cheaper per token can be more expensive per *character*.',
    },
    {
      type: 'p',
      text: 'Reasoning makes it worse. Thinking tokens are billed as output on every major API, and output costs three to six times as much as input. A model that thinks for 3,000 tokens before a 300-token answer has a real output price eleven times what the answer suggests. Effort settings — `low` through `max` on current Claude models — are therefore a cost control, not just a quality dial.',
    },
    { type: 'h2', id: 'worked-example', text: 'A worked example: one agentic coding task' },
    {
      type: 'p',
      text: 'Consider a typical task for a coding agent — “fix this failing integration test and the bug behind it” — that converges in **30 turns**. Each turn re-sends the conversation. Assume a realistic shape for a cached agent loop:',
    },
    {
      type: 'list',
      items: [
        '**44k tokens** of stable prefix per turn (tools, system prompt, instruction files, earlier turns) served from cache: 1.32M cached tokens per task.',
        '**4k new tokens** per turn (tool results, the latest diff): 120k uncached tokens, written to a 5-minute cache on Claude.',
        '**1.2k output tokens** per turn, reasoning included: 36k output tokens per task.',
      ],
    },
    {
      type: 'code',
      lang: 'text',
      code: 'cost = cached × cache_read + fresh × input (× 1.25 for a Claude cache write) + output × output_price\n\nClaude Opus 5.5:\n  1.32M × $0.20  = $0.264   cache reads\n  0.12M × $5.00  = $0.600   cache writes (1.25 × $4)\n  0.036M × $20   = $0.720   output\n                   ------\n                   $1.584 per task\n\nSame task, no caching: 1.44M × $4 + $0.720 = $6.48  →  caching saves ~76%',
      caption: 'Output is under 3% of the tokens but 45% of the cached bill. Cache writes are the next biggest line — keep each turn’s fresh content lean.',
    },
    {
      type: 'figure',
      figure: 'cost-per-task',
      caption: 'Cost of the same 30-turn task on each model at October 2026 list prices, assuming identical token counts. Real counts differ by tokenizer and by how many turns each model needs.',
      alt: 'Horizontal bar chart of cost per task: GPT-6 Astra $4.32, Claude Fable 5.1 $3.63, GPT-5.6 Sol $1.73, Claude Opus 5.5 $1.58, Gemini 3.1 Pro $0.94, Claude Sonnet 5.5 $0.92, Claude Haiku 4.5 $0.46, DeepSeek V4 Pro $0.36, GPT-5.4 mini $0.35, Gemini 3.8 Flash $0.32, DeepSeek Flash $0.09.',
    },
    {
      type: 'stats',
      items: [
        { value: '~50×', label: 'Spread between the cheapest and dearest model on the same task' },
        { value: '−76%', label: 'Opus 5.5 bill with prompt caching vs without' },
        { value: '45%', label: 'Share of the cached Opus 5.5 bill that is output' },
      ],
    },
    { type: 'h2', id: 'success-rate', text: 'Divide by the success rate' },
    {
      type: 'p',
      text: 'The chart is the cost of an *attempt*. What you pay for is a *finished* task, and cheaper models fail more often, need more turns, or produce diffs that take longer to review. The honest number is:',
    },
    {
      type: 'code',
      lang: 'text',
      code: 'cost per completed task = (cost per attempt ÷ success rate) + (review minutes × your hourly rate ÷ 60)',
    },
    {
      type: 'p',
      text: 'Haiku 4.5 at $0.46 per attempt with a 50% success rate costs $0.92 per success — the same as Sonnet 5.5 succeeding every time, before you count the failed attempts you had to read. Anthropic’s own guidance makes the same point: measure the most capable model at a lower effort setting before building a multi-model cascade, and judge cost per completed task rather than per request[^8]. Run the five-ticket eval from my editor post on your own repository; it will tell you more than any table.',
    },
    { type: 'h2', id: 'levers', text: 'The levers, in order' },
    {
      type: 'list',
      ordered: true,
      items: [
        '**Cache everything stable.** Freeze the prefix and verify hits. It is the largest saving and costs nothing in quality. Gemini also offers explicit context caches with a storage fee per hour, worth it for large shared documents[^5][^7].',
        '**Batch what can wait.** Anthropic, OpenAI and Google all discount asynchronous batch jobs by 50%, and the discounts stack with caching[^1][^2][^3][^6].',
        '**Trim output.** Ask for diffs, not whole files; cap verbosity; set effort to match the task.',
        '**Route by difficulty, after measuring.** Use a small model for classification and extraction, a large one for planning — but only once an eval shows the small one holds quality.',
        '**Shift time-insensitive DeepSeek work off-peak** for a flat 50%[^4].',
      ],
    },
    { type: 'h2', id: 'local', text: 'What about running it yourself?' },
    {
      type: 'p',
      text: 'Local inference has no per-token price, but it is not free. A rough, illustrative model: a $2,400 workstation amortised over three years of eight-hour days is about $0.27 an hour; at 450 W and $0.15/kWh, power adds about $0.07. If a local model completes four tasks an hour, that is roughly **$0.09 per task** — DeepSeek Flash territory, on a model that is usually weaker. Local wins on privacy and offline use far more often than on cost; see my field guide to sizing a local setup.',
    },
    {
      type: 'callout',
      tone: 'tip',
      title: 'Put the formula in your dashboard',
      text: 'Log `input_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens` and `output_tokens` per request, join them to task outcomes, and chart cost per completed task weekly. Price changes, model launches and prompt regressions all show up there first.',
    },
  ],
  references: [
    { id: 1, title: 'Pricing (model rates, prompt caching, batch, long context, data residency)', publisher: 'Claude Platform docs', url: 'https://platform.claude.com/docs/en/about-claude/pricing' },
    { id: 2, title: 'API pricing', publisher: 'OpenAI', url: 'https://developers.openai.com/api/docs/pricing' },
    { id: 3, title: 'Gemini Developer API pricing', publisher: 'Google AI for Developers', url: 'https://ai.google.dev/gemini-api/docs/pricing' },
    { id: 4, title: 'Models & pricing', publisher: 'DeepSeek API docs', url: 'https://api-docs.deepseek.com/quick_start/pricing' },
    { id: 5, title: 'Prompt caching', publisher: 'Claude Platform docs', url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-caching' },
    { id: 6, title: 'Batch processing', publisher: 'Claude Platform docs', url: 'https://platform.claude.com/docs/en/build-with-claude/batch-processing' },
    { id: 7, title: 'Context caching', publisher: 'Google AI for Developers', url: 'https://ai.google.dev/gemini-api/docs/caching' },
    { id: 8, title: 'Optimizing for cost and intelligence', publisher: 'Claude Platform docs', url: 'https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence' },
  ],
}
