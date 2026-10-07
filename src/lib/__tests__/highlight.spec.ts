import { describe, expect, it } from 'vitest'

import { languageLabel, tokenize, tokenizeLines } from '../highlight'

const kinds = (code: string, lang: string) => tokenize(code, lang).filter((token) => token.kind !== 'plain')

describe('tokenize', () => {
  it('round-trips the source exactly', () => {
    const code = "import { a } from 'b'\nconst x = 42 // answer"
    expect(tokenize(code, 'ts').map((token) => token.value).join('')).toBe(code)
  })

  it('finds keywords, strings, numbers and comments in TypeScript', () => {
    const found = kinds("const x = 'hi' // note\nreturn 42", 'ts')
    expect(found).toEqual(
      expect.arrayContaining([
        { kind: 'keyword', value: 'const' },
        { kind: 'string', value: "'hi'" },
        { kind: 'comment', value: '// note' },
        { kind: 'number', value: '42' },
      ]),
    )
  })

  it('marks shell flags and variables', () => {
    const found = kinds('export OLLAMA_HOST=127.0.0.1\nllama-server --port 8080 $MODEL', 'bash')
    expect(found).toEqual(
      expect.arrayContaining([
        { kind: 'flag', value: '--port' },
        { kind: 'variable', value: '$MODEL' },
      ]),
    )
  })

  it('separates JSON keys from string values', () => {
    const found = kinds('{ "matcher": "Edit|Write" }', 'json')
    expect(found).toContainEqual({ kind: 'property', value: '"matcher"' })
    expect(found).toContainEqual({ kind: 'string', value: '"Edit|Write"' })
  })

  it('leaves unknown languages as plain text', () => {
    expect(tokenize('KV bytes = 2 × layers', 'text')).toEqual([{ kind: 'plain', value: 'KV bytes = 2 × layers' }])
  })
})

describe('tokenizeLines', () => {
  it('keeps one entry per source line, including blank ones', () => {
    expect(tokenizeLines('a\n\nb', 'text')).toHaveLength(3)
  })
})

describe('languageLabel', () => {
  it('names common languages and upper-cases the rest', () => {
    expect(languageLabel('ts')).toBe('TypeScript')
    expect(languageLabel('bash')).toBe('Shell')
    expect(languageLabel('rust')).toBe('RUST')
  })
})
