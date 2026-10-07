/**
 * A compact syntax highlighter for article code blocks. It is a first-match lexer — not a
 * parser — which is plenty for short, well-formed snippets and costs ~2 kB instead of a
 * grammar engine. Unknown languages render as plain text.
 */

export type TokenKind =
  | 'plain'
  | 'comment'
  | 'string'
  | 'keyword'
  | 'number'
  | 'function'
  | 'type'
  | 'property'
  | 'variable'
  | 'flag'
  | 'punctuation'
  | 'heading'

export interface Token {
  kind: TokenKind
  value: string
}

type Rule = [TokenKind, RegExp]

const sticky = (source: string, flags = '') => new RegExp(source, `y${flags}`)

const STRING_DQ = '"(?:[^"\\\\\\n]|\\\\.)*"'
const STRING_SQ = "'(?:[^'\\\\\\n]|\\\\.)*'"
const NUMBER = '\\b(?:0x[\\da-f]+|\\d[\\d_]*(?:\\.\\d+)?(?:e[+-]?\\d+)?)\\b'

const TS_KEYWORDS =
  'import|from|export|default|const|let|var|function|return|async|await|if|else|for|of|in|new|class|extends|interface|type|implements|throw|try|catch|finally|while|switch|case|break|continue|as|satisfies|typeof|keyof|readonly|public|private|protected|static|true|false|null|undefined|this|void'

const rules: Record<string, Rule[]> = {
  ts: [
    ['comment', sticky('//[^\\n]*|/\\*[\\s\\S]*?\\*/')],
    ['string', sticky(`${STRING_DQ}|${STRING_SQ}|\`(?:[^\`\\\\]|\\\\.)*\``)],
    ['keyword', sticky(`\\b(?:${TS_KEYWORDS})\\b`)],
    ['number', sticky(NUMBER, 'i')],
    ['type', sticky('\\b[A-Z][A-Za-z0-9_]*\\b')],
    ['function', sticky('\\b[a-zA-Z_$][\\w$]*(?=\\s*\\()')],
    ['property', sticky('(?<=\\.)[a-zA-Z_$][\\w$]*')],
    ['punctuation', sticky('[{}()[\\];,.:?<>=+\\-*/!&|]+')],
  ],
  shell: [
    ['comment', sticky('#[^\\n]*')],
    ['string', sticky(`${STRING_DQ}|${STRING_SQ}`)],
    ['variable', sticky('\\$\\{?[A-Za-z_][\\w]*\\}?')],
    ['flag', sticky('(?<=\\s)--?[a-zA-Z][\\w-]*')],
    ['keyword', sticky('\\b(?:export|sudo|if|then|fi|for|do|done|echo|cd|curl|set)\\b')],
    ['function', sticky('(?<=^|\\n|\\|\\s?|&&\\s?)[a-zA-Z][\\w.-]*')],
    ['number', sticky(NUMBER, 'i')],
    ['punctuation', sticky('[|&;<>\\\\=]+')],
  ],
  json: [
    ['property', sticky(`${STRING_DQ}(?=\\s*:)`)],
    ['string', sticky(STRING_DQ)],
    ['keyword', sticky('\\b(?:true|false|null)\\b')],
    ['number', sticky('-?\\d+(?:\\.\\d+)?(?:e[+-]?\\d+)?', 'i')],
    ['punctuation', sticky('[{}[\\],:]')],
  ],
  yaml: [
    ['comment', sticky('#[^\\n]*')],
    ['property', sticky('[\\w.-]+(?=\\s*:(?:\\s|$))', 'm')],
    ['string', sticky(`${STRING_DQ}|${STRING_SQ}`)],
    ['keyword', sticky('\\b(?:true|false|null|yes|no)\\b')],
    ['number', sticky(NUMBER, 'i')],
    ['punctuation', sticky('[:\\-|>[\\]{},]')],
  ],
  markdown: [
    ['heading', sticky('#{1,6} [^\\n]*')],
    ['comment', sticky('<!--[\\s\\S]*?-->')],
    ['string', sticky('`[^`\\n]+`')],
    ['keyword', sticky('\\*\\*[^*\\n]+\\*\\*')],
    ['property', sticky('@[\\w./~-]+')],
    ['punctuation', sticky('^\\s*[-*] ', 'm')],
  ],
  swift: [
    ['comment', sticky('//[^\\n]*|/\\*[\\s\\S]*?\\*/')],
    ['string', sticky(STRING_DQ)],
    ['keyword', sticky('@\\w+|\\b(?:import|struct|enum|class|func|let|var|return|async|await|try|throws|in|case|if|else|guard|for|true|false|nil|some|static|init|self)\\b')],
    ['number', sticky(NUMBER, 'i')],
    ['type', sticky('\\b[A-Z][A-Za-z0-9_]*\\b')],
    ['function', sticky('\\b[a-z_][\\w]*(?=\\s*\\()')],
    ['punctuation', sticky('[{}()[\\];,.:?<>=+\\-*/!&|]+')],
  ],
  python: [
    ['comment', sticky('#[^\\n]*')],
    ['string', sticky(`[rbf]?(?:"""[\\s\\S]*?"""|${STRING_DQ}|${STRING_SQ})`)],
    ['keyword', sticky('\\b(?:import|from|as|def|return|if|elif|else|for|in|while|with|class|try|except|raise|async|await|None|True|False|and|or|not|lambda|yield)\\b')],
    ['number', sticky(NUMBER, 'i')],
    ['function', sticky('\\b[a-zA-Z_]\\w*(?=\\s*\\()')],
    ['punctuation', sticky('[{}()[\\];,.:<>=+\\-*/%]+')],
  ],
}

const ALIASES: Record<string, string> = {
  ts: 'ts',
  typescript: 'ts',
  tsx: 'ts',
  js: 'ts',
  javascript: 'ts',
  vue: 'ts',
  bash: 'shell',
  sh: 'shell',
  shell: 'shell',
  zsh: 'shell',
  console: 'shell',
  json: 'json',
  jsonc: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'yaml',
  md: 'markdown',
  markdown: 'markdown',
  swift: 'swift',
  py: 'python',
  python: 'python',
}

/** Human label for the language chip on a code block. */
export function languageLabel(lang: string): string {
  const labels: Record<string, string> = {
    ts: 'TypeScript',
    tsx: 'TSX',
    js: 'JavaScript',
    vue: 'Vue',
    bash: 'Shell',
    sh: 'Shell',
    shell: 'Shell',
    json: 'JSON',
    jsonc: 'JSON',
    yaml: 'YAML',
    yml: 'YAML',
    toml: 'TOML',
    md: 'Markdown',
    markdown: 'Markdown',
    swift: 'Swift',
    py: 'Python',
    python: 'Python',
    text: 'Text',
  }
  return labels[lang.toLowerCase()] ?? lang.toUpperCase()
}

export function tokenize(code: string, lang: string): Token[] {
  const grammar = rules[ALIASES[lang.toLowerCase()] ?? '']
  if (!grammar) return [{ kind: 'plain', value: code }]

  const tokens: Token[] = []
  const push = (kind: TokenKind, value: string) => {
    const last = tokens[tokens.length - 1]
    if (last && last.kind === kind) last.value += value
    else tokens.push({ kind, value })
  }

  let position = 0
  outer: while (position < code.length) {
    for (const [kind, pattern] of grammar) {
      pattern.lastIndex = position
      const match = pattern.exec(code)
      if (match && match[0].length > 0) {
        push(kind, match[0])
        position += match[0].length
        continue outer
      }
    }
    push('plain', code[position]!)
    position += 1
  }
  return tokens
}

/** Tokens regrouped by line, so blocks can render line numbers and highlight rows. */
export function tokenizeLines(code: string, lang: string): Token[][] {
  const lines: Token[][] = [[]]
  for (const token of tokenize(code, lang)) {
    const parts = token.value.split('\n')
    parts.forEach((part, index) => {
      if (index > 0) lines.push([])
      if (part) lines[lines.length - 1]!.push({ kind: token.kind, value: part })
    })
  }
  return lines
}
