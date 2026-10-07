import { describe, expect, it } from 'vitest'

import { contactSchema, resumeRequestSchema } from '@/lib/validators/contact'

import { closingLines, firstName, flows, projectFlow, resumeFlow, validateAnswer } from '../assistant'

const step = (flow: typeof projectFlow, id: string) => flow.steps.find((item) => item.id === id)!

describe('assistant flows', () => {
  it('ask for exactly the fields the submit schemas need', () => {
    const projectFields = Object.keys(contactSchema.shape).filter((key) => key !== 'website').sort()
    expect(projectFlow.steps.map((item) => item.id).sort()).toEqual(projectFields)

    const resumeFields = Object.keys(resumeRequestSchema.shape).filter((key) => key !== 'website').sort()
    expect(resumeFlow.steps.map((item) => item.id).sort()).toEqual(resumeFields)
  })

  it('give every choice question its options', () => {
    const choices = Object.values(flows).flatMap((flow) => flow.steps.filter((item) => item.kind === 'choice'))
    expect(choices.length).toBeGreaterThan(0)
    for (const item of choices) expect(item.options?.length).toBeGreaterThanOrEqual(2)
  })

  it('personalise prompts with the visitor’s first name', () => {
    expect(step(projectFlow, 'email').prompt({ name: 'Ada Lovelace' }).join(' ')).toContain('Ada')
    expect(projectFlow.review({ name: 'Ada Lovelace' }).join(' ')).toContain('Ada')
  })

  it('react to earlier answers', () => {
    const rescue = step(projectFlow, 'timeline').prompt({ stage: 'Live — needs a rescue' }).join(' ')
    expect(rescue).toMatch(/rescue/i)
  })
})

describe('validateAnswer', () => {
  it('uses the same messages as the schema', () => {
    expect(validateAnswer(step(projectFlow, 'name'), 'A')).toBe('Tell me what to call you.')
    expect(validateAnswer(step(projectFlow, 'email'), 'nope')).toBe('That email doesn’t look right.')
    expect(validateAnswer(step(projectFlow, 'email'), 'ada@example.com')).toBeNull()
  })

  it('accepts a blank optional answer but still checks a filled one', () => {
    const company = step(projectFlow, 'company')
    expect(validateAnswer(company, '')).toBeNull()
    expect(validateAnswer(company, 'x'.repeat(121))).toMatch(/120/)
  })

  it('only accepts offered options for choices', () => {
    expect(validateAnswer(step(projectFlow, 'budget'), '$1M')).toBe('Pick a rough range — it helps me plan.')
    expect(validateAnswer(step(projectFlow, 'budget'), '$50k +')).toBeNull()
  })
})

describe('closing lines', () => {
  it('match how the brief was delivered', () => {
    expect(closingLines('project', { name: 'Ada' }, 'api').join(' ')).toMatch(/Sent/)
    expect(closingLines('project', { name: 'Ada' }, 'mailto').join(' ')).toMatch(/email app/)
    expect(closingLines('resume', { name: 'Ada' }, 'download').join(' ')).toMatch(/downloading/)
  })

  it('use first names only', () => {
    expect(firstName('  Ada   Lovelace ')).toBe('Ada')
    expect(firstName(undefined)).toBe('')
  })
})
