export type TextToken =
  | { type: 'word'; value: string; emphasis: boolean }
  | { type: 'space' }
  | { type: 'break' }

/**
 * Splits copy into animatable tokens.
 *
 * - `\n` becomes a hard line break.
 * - `*wrapped words*` are flagged as emphasis (may span several words).
 */
export function tokenize(text: string): TextToken[] {
  const tokens: TextToken[] = []
  let emphasis = false

  text.split('\n').forEach((line, lineIndex) => {
    if (lineIndex > 0) tokens.push({ type: 'break' })

    const words = line.trim().split(/\s+/).filter(Boolean)
    words.forEach((raw, wordIndex) => {
      if (wordIndex > 0) tokens.push({ type: 'space' })

      let value = raw
      const opens = value.startsWith('*')
      if (opens) {
        emphasis = true
        value = value.slice(1)
      }
      const closes = value.endsWith('*')
      if (closes) value = value.slice(0, -1)

      tokens.push({ type: 'word', value, emphasis })
      if (closes) emphasis = false
    })
  })

  return tokens
}

/** The copy with markup removed — used for screen readers and document titles. */
export function plainText(text: string): string {
  return text.replace(/\*/g, '').replace(/\s*\n\s*/g, ' ').trim()
}
