import { describe, expect, it } from 'vitest'

import { CONTEXT_WINDOW, contextSegments, KV_BYTES_PER_TOKEN_F16, RATE_CARDS, taskCost, taskCosts, vramRow } from '../chart-data'

/** The numbers printed in the cost and local-LLM articles must match what the charts draw. */

const card = (model: string) => RATE_CARDS.find((item) => item.model === model)!

describe('cost per task', () => {
  it('reproduces the worked Opus 5.5 example ($1.584)', () => {
    const cost = taskCost(card('Claude Opus 5.5'))
    expect(cost.cached).toBeCloseTo(0.264, 6)
    expect(cost.fresh).toBeCloseTo(0.6, 6)
    expect(cost.output).toBeCloseTo(0.72, 6)
    expect(cost.total).toBeCloseTo(1.584, 6)
  })

  it('makes output ~45% of the cached Opus 5.5 bill', () => {
    const cost = taskCost(card('Claude Opus 5.5'))
    expect(cost.output / cost.total).toBeCloseTo(0.4545, 3)
  })

  it('spans roughly 50× from cheapest to dearest, sorted for the chart', () => {
    const costs = taskCosts()
    expect(costs[0]!.model).toBe('GPT-6 Astra')
    expect(costs[costs.length - 1]!.model).toBe('DeepSeek Flash')
    expect(costs[0]!.total / costs[costs.length - 1]!.total).toBeGreaterThan(45)
    expect(costs[0]!.total / costs[costs.length - 1]!.total).toBeLessThan(55)
    for (let i = 1; i < costs.length; i++) expect(costs[i - 1]!.total).toBeGreaterThanOrEqual(costs[i]!.total)
  })

  it('only charges the cache-write premium where the provider does', () => {
    expect(taskCost(card('GPT-5.6 Sol')).fresh).toBeCloseTo(0.48, 6)
    expect(taskCost(card('Claude Sonnet 5.5')).fresh).toBeCloseTo(0.3, 6)
  })
})

describe('VRAM budget', () => {
  it('stores 128 KiB per token for Llama-3.1-8B at FP16', () => {
    expect(KV_BYTES_PER_TOKEN_F16).toBe(131_072)
  })

  it('matches the figures quoted in the article', () => {
    expect(vramRow('8k', 8_192).kv).toBeCloseTo(1.07, 2)
    expect(vramRow('32k', 32_768).kv).toBeCloseTo(4.29, 2)
    expect(vramRow('128k', 131_072).kv).toBeCloseTo(17.18, 2)
    expect(vramRow('128k', 131_072).total).toBeCloseTo(22.9, 1)
    expect(vramRow('128k q8', 131_072, 1).total).toBeCloseTo(14.3, 1)
  })
})

describe('context budget', () => {
  it('fits inside the window', () => {
    const used = contextSegments.reduce((sum, segment) => sum + segment.tokens, 0)
    expect(used).toBeLessThan(CONTEXT_WINDOW)
  })
})
