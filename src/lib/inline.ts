/**
 * A deliberately small inline markup for article copy, parsed into nodes and rendered as
 * VNodes — never as HTML strings — so content can't inject markup.
 *
 *   **strong**   *emphasis*   `code`   [label](https://…)   [^3] (reference marker)
 */

export type InlineNode =
  | { type: 'text'; value: string }
  | { type: 'code'; value: string }
  | { type: 'strong'; children: InlineNode[] }
  | { type: 'em'; children: InlineNode[] }
  | { type: 'link'; href: string; children: InlineNode[] }
  | { type: 'ref'; id: number }

const PATTERN =
  /(`[^`]+`)|(\*\*(?=\S)[\s\S]+?(?<=\S)\*\*)|(\*(?=\S)[^*]+?(?<=\S)\*)|(\[\^(\d+)\])|(\[([^\]]+)\]\(([^)\s]+)\))/g

/** Only web, mail, in-site and in-page links survive; anything else renders as its label. */
export function isSafeHref(href: string): boolean {
  return /^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(href)
}

export function parseInline(source: string): InlineNode[] {
  const nodes: InlineNode[] = []
  let cursor = 0

  const pushText = (value: string) => {
    if (!value) return
    const last = nodes[nodes.length - 1]
    if (last?.type === 'text') last.value += value
    else nodes.push({ type: 'text', value })
  }

  for (const match of source.matchAll(PATTERN)) {
    const index = match.index ?? 0
    pushText(source.slice(cursor, index))
    cursor = index + match[0].length

    const [token, code, strong, em, , refId, link, label = '', href = ''] = match
    if (code) nodes.push({ type: 'code', value: code.slice(1, -1) })
    else if (strong) nodes.push({ type: 'strong', children: parseInline(strong.slice(2, -2)) })
    else if (em) nodes.push({ type: 'em', children: parseInline(em.slice(1, -1)) })
    else if (refId) nodes.push({ type: 'ref', id: Number(refId) })
    else if (link) {
      if (isSafeHref(href)) nodes.push({ type: 'link', href, children: parseInline(label) })
      else pushText(label)
    } else pushText(token)
  }

  pushText(source.slice(cursor))
  return nodes
}

/** The copy with markup and reference markers removed — for word counts, meta and search. */
export function plainInline(source: string): string {
  const flatten = (nodes: InlineNode[]): string =>
    nodes
      .map((node) => {
        switch (node.type) {
          case 'text':
          case 'code':
            return node.value
          case 'ref':
            return ''
          default:
            return flatten(node.children)
        }
      })
      .join('')
  return flatten(parseInline(source))
}

/** Every `[^n]` marker in the copy, in order of appearance. */
export function referenceIds(source: string): number[] {
  return [...source.matchAll(/\[\^(\d+)\]/g)].map((match) => Number(match[1]))
}
