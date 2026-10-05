import { describe, expect, it } from 'vitest'

import { toTypedSchema } from '../validation'
import { type ContactInput, contactSchema } from '../validators/contact'

const valid = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  company: '',
  projectType: 'Mobile app',
  budget: '$25k – 50k',
  message: 'We need an offline-first field app for our inspection crews.',
  website: '',
} satisfies ContactInput

describe('toTypedSchema (zod 4 → vee-validate)', () => {
  const schema = toTypedSchema(contactSchema)
  /** Form state is untrusted at runtime — these tests deliberately feed it bad values. */
  const parse = (values: Record<string, unknown>) => schema.parse(values as ContactInput)

  it('identifies itself to vee-validate', () => {
    expect(schema.__type).toBe('VVTypedSchema')
  })

  it('returns parsed output and no errors for valid input', async () => {
    const result = await parse({ ...valid, name: '  Ada Lovelace  ' })
    expect(result.errors).toEqual([])
    expect(result.value?.name).toBe('Ada Lovelace')
  })

  it('groups issues by field path', async () => {
    const result = await parse({ ...valid, email: 'nope', message: 'too short' })
    const byPath = Object.fromEntries(result.errors.map((error) => [error.path, error.errors]))

    expect(result.value).toBeUndefined()
    expect(byPath.email).toEqual(['That email doesn’t look right.'])
    expect(byPath.message?.[0]).toMatch(/at least 20 characters/)
  })

  it('rejects options that are not offered in the form', async () => {
    const result = await parse({ ...valid, budget: 'one million dollars' })
    expect(result.errors.map((error) => error.path)).toEqual(['budget'])
  })
})
