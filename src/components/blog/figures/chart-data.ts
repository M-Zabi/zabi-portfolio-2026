/**
 * Data behind the article charts, computed from the inputs quoted in the posts so a price
 * change is a one-line edit and the arithmetic is unit-tested.
 */

// ───────────── Cost per agentic task (llm-cost-per-task-2026) ─────────────

/** The worked example: 30 turns × (44k cached + 4k fresh input, 1.2k output). */
export const TASK = { turns: 30, cachedPerTurn: 44_000, freshPerTurn: 4_000, outputPerTurn: 1_200 } as const

interface RateCard {
  model: string
  provider: 'Anthropic' | 'OpenAI' | 'Google' | 'DeepSeek'
  /** US$ per million tokens. */
  input: number
  cacheRead: number
  output: number
  /** Claude bills fresh prefix as a 5-minute cache write (1.25× input). */
  freshMultiplier?: number
}

export const RATE_CARDS: RateCard[] = [
  { model: 'GPT-6 Astra', provider: 'OpenAI', input: 10, cacheRead: 1, output: 50 },
  { model: 'Claude Fable 5.1', provider: 'Anthropic', input: 10, cacheRead: 0.25, output: 50, freshMultiplier: 1.25 },
  { model: 'GPT-5.6 Sol', provider: 'OpenAI', input: 4, cacheRead: 0.4, output: 20 },
  { model: 'Claude Opus 5.5', provider: 'Anthropic', input: 4, cacheRead: 0.2, output: 20, freshMultiplier: 1.25 },
  { model: 'Gemini 3.1 Pro', provider: 'Google', input: 2, cacheRead: 0.2, output: 12 },
  { model: 'Claude Sonnet 5.5', provider: 'Anthropic', input: 2, cacheRead: 0.2, output: 10, freshMultiplier: 1.25 },
  { model: 'Claude Haiku 4.5', provider: 'Anthropic', input: 1, cacheRead: 0.1, output: 5, freshMultiplier: 1.25 },
  { model: 'DeepSeek V4 Pro', provider: 'DeepSeek', input: 1.32, cacheRead: 0.044, output: 3.96 },
  { model: 'GPT-5.4 mini', provider: 'OpenAI', input: 0.75, cacheRead: 0.075, output: 4.5 },
  { model: 'Gemini 3.8 Flash', provider: 'Google', input: 0.75, cacheRead: 0.075, output: 3.75 },
  { model: 'DeepSeek Flash', provider: 'DeepSeek', input: 0.3, cacheRead: 0.006, output: 1.2 },
]

export interface TaskCost {
  model: string
  provider: RateCard['provider']
  cached: number
  fresh: number
  output: number
  total: number
}

export function taskCost(card: RateCard, task = TASK): TaskCost {
  const perMillion = (tokens: number, price: number) => (tokens / 1_000_000) * price
  const cached = perMillion(task.turns * task.cachedPerTurn, card.cacheRead)
  const fresh = perMillion(task.turns * task.freshPerTurn, card.input * (card.freshMultiplier ?? 1))
  const output = perMillion(task.turns * task.outputPerTurn, card.output)
  return { model: card.model, provider: card.provider, cached, fresh, output, total: cached + fresh + output }
}

export const taskCosts = (): TaskCost[] => RATE_CARDS.map((card) => taskCost(card)).sort((a, b) => b.total - a.total)

// ───────────── VRAM budget (local-llm-field-guide) ─────────────

/** Llama-3.1-8B: 32 layers, 8 KV heads, head_dim 128. */
export const KV_BYTES_PER_TOKEN_F16 = 2 * 32 * 8 * 128 * 2
export const WEIGHTS_Q4_K_M_GB = 4.92
export const RUNTIME_OVERHEAD_GB = 0.8

export interface VramRow {
  label: string
  weights: number
  kv: number
  overhead: number
  total: number
}

export function vramRow(label: string, tokens: number, kvBytesPerElement = 2): VramRow {
  const kv = (KV_BYTES_PER_TOKEN_F16 * (kvBytesPerElement / 2) * tokens) / 1e9
  return { label, weights: WEIGHTS_Q4_K_M_GB, kv, overhead: RUNTIME_OVERHEAD_GB, total: WEIGHTS_Q4_K_M_GB + kv + RUNTIME_OVERHEAD_GB }
}

export const vramRows = (): VramRow[] => [
  vramRow('8k context', 8_192),
  vramRow('32k context', 32_768),
  vramRow('128k context', 131_072),
  vramRow('128k · q8_0 cache', 131_072, 1),
]

// ───────────── Context window composition (context-engineering-for-coding-agents) ─────────────

export const CONTEXT_WINDOW = 200_000

export const contextSegments = [
  { key: 'prefix', label: 'Tools + system prompt', tokens: 12_000 },
  { key: 'instructions', label: 'Instruction files', tokens: 6_000 },
  { key: 'conversation', label: 'Conversation', tokens: 38_000 },
  { key: 'tools', label: 'Tool results', tokens: 96_000 },
] as const

export const usd = (value: number) => (value < 0.1 ? `$${value.toFixed(3)}` : `$${value.toFixed(2)}`)
export const gb = (value: number) => `${value.toFixed(1)} GB`
export const kTokens = (value: number) => `${Math.round(value / 1000)}k`
