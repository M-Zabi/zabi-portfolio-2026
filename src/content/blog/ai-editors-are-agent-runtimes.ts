import type { Post } from '@/types/blog'

export const post: Post = {
  slug: 'ai-editors-are-agent-runtimes',
  title: 'Your AI editor is an agent runtime now',
  dek: 'Cursor, Copilot, Claude Code, Zed and the terminal agents have converged on the same architecture. Here is how it works — and how to choose.',
  excerpt:
    'Autocomplete was the demo. The product is now a retrieval system, an instruction hierarchy, a tool loop and a permission model. A field guide to how AI editors actually work in 2026.',
  category: 'editors',
  tags: ['Cursor', 'Claude Code', 'GitHub Copilot', 'Zed', 'MCP', 'ACP', 'AGENTS.md'],
  color: 'cobalt',
  cover: 'terminal',
  publishedAt: '2026-10-02',
  featured: true,
  summary: {
    tldr: 'Every serious AI editor is now the same four subsystems — context retrieval, an instruction hierarchy, a tool-calling loop and a permission model — wrapped in different form factors. Pick by how each one handles context and control, not by which model it ships with.',
    points: [
      'Codebase indexing is a sync problem first: Cursor hashes the workspace into a Merkle tree, re-embeds only the changed branches, and reuses teammates’ indexes via simhash.',
      'Instruction files (AGENTS.md, CLAUDE.md, path-scoped rules) are context, not configuration — enforcement belongs in hooks and permissions.',
      'The agent loop is plan → read → edit → run → observe; the quality gap between tools is mostly how well they feed test and type-checker output back in.',
      'MCP standardises tools an agent can call; ACP standardises how an editor hosts an agent. Together they decouple the model, the agent and the editor.',
      'Choose with a small eval on your own repo: time-to-green on five real tickets beats any leaderboard.',
    ],
  },
  body: [
    {
      type: 'lead',
      text: 'Two years ago the question was “which editor has the best autocomplete?”. In 2026 that question is almost meaningless. Ghost text is table stakes; what separates the tools is everything that happens *around* the model call — how they gather context, how they decide what to do next, and how much they let an agent touch before a human looks.',
    },
    {
      type: 'p',
      text: 'I use these tools every day across web, React Native and desktop codebases, and I have watched them converge. Strip away the branding and every serious AI editor is the same four subsystems in a different chassis. Once you can name those subsystems, comparing tools — and getting far more out of the one you already pay for — becomes an engineering exercise instead of a vibe check.',
    },
    { type: 'h2', id: 'four-subsystems', text: 'The four subsystems' },
    {
      type: 'list',
      ordered: true,
      items: [
        '**Context retrieval** — deciding which slices of a 200,000-file monorepo the model sees on this turn: embeddings, symbol graphs, grep, open tabs, recent edits.',
        '**An instruction hierarchy** — organisation, user, project and directory-level rules that are injected into every request.',
        '**A tool loop** — the model proposes an action (read a file, apply a diff, run a command), the host executes it, and the observation goes back into context until the task converges.',
        '**A permission model** — what the agent may do unattended, what needs approval, and what is blocked outright.',
      ],
    },
    {
      type: 'figure',
      figure: 'agent-loop',
      caption: 'The loop every agentic editor runs. The model only ever proposes; the host executes, captures the observation and decides whether to go round again.',
      alt: 'Diagram of the agent loop: context assembly feeds the model, which proposes a tool call; the host checks permissions, executes the tool, and returns the observation into context until tests pass.',
    },
    { type: 'h2', id: 'retrieval', text: 'Retrieval is a sync problem before it is a search problem' },
    {
      type: 'p',
      text: 'Semantic search over code is well understood: split files into syntactic chunks (tree-sitter boundaries rather than fixed windows), embed each chunk, and run nearest-neighbour search for the query. The hard part is keeping that index fresh on a repository that changes every few seconds, for thousands of developers, without shipping source code around unnecessarily.',
    },
    {
      type: 'p',
      text: 'Cursor’s write-up of its indexing pipeline is the clearest public description of how this is done at scale[^1]. The client builds a **Merkle tree** over the workspace — a SHA-256 hash for every file, and for every directory a hash of its children. Syncing becomes a tree walk: compare root hashes, descend only into branches whose hashes differ, re-chunk and re-embed only those files. Embeddings are cached by content, so an unchanged chunk is never embedded twice.',
    },
    {
      type: 'figure',
      figure: 'merkle-index',
      caption: 'A changed file invalidates exactly one path to the root. The sync walks only the highlighted branch; every other subtree is proven unchanged by its hash[^1].',
      alt: 'A Merkle tree of a repository with one modified file; the hashes on the path from that file to the root are highlighted, the rest are unchanged.',
    },
    {
      type: 'p',
      text: 'The second trick is reuse. Most people in an organisation open near-identical clones of the same repository, so Cursor derives a **simhash** from the tree and looks for an existing index to start from — they report clones averaging 92% similarity across users in an organisation. The access-control story falls out of the same structure: a client can only produce a node’s hash if it holds the content beneath it, so search results are filtered to code the client can prove it already has[^1].',
    },
    {
      type: 'stats',
      items: [
        { value: '7.87s → 525ms', label: 'Median time to first query with index reuse' },
        { value: '2.82 min → 1.87s', label: 'p90 time to first query' },
        { value: '4.03 h → 21s', label: 'p99 — the giant monorepos' },
      ],
    },
    {
      type: 'p',
      text: 'Not every tool indexes. Terminal agents such as Claude Code lean on *agentic search* instead — the model greps, globs and reads its way through the tree with ordinary tools, which costs more turns but is always fresh and needs no server-side index. In practice the best results come from combining both: an index to find the neighbourhood, then precise reads to load the exact lines.',
    },
    {
      type: 'callout',
      tone: 'tip',
      title: 'Retrieval is not free context',
      text: 'Long contexts degrade non-uniformly: models recall material at the start and end of a prompt better than material buried in the middle[^9]. Ten precise chunks beat fifty “just in case” chunks, both for quality and for your token bill.',
    },
    { type: 'h2', id: 'instructions', text: 'Instruction files are context, not configuration' },
    {
      type: 'p',
      text: 'Every tool now reads a Markdown file of project rules on every request, and the ecosystem has largely settled on **AGENTS.md** as the vendor-neutral name — described by its maintainers as “a README for agents”, and read by Codex, Copilot, Cursor, Gemini CLI, Devin, Windsurf, Aider and others. In a monorepo, the nearest AGENTS.md in the directory tree wins, so each package can ship its own rules[^2].',
    },
    {
      type: 'p',
      text: 'Claude Code has the most elaborate hierarchy: a managed policy file for the whole organisation, `~/.claude/CLAUDE.md` for the individual, `./CLAUDE.md` for the project, and `.claude/rules/*.md` files that can be scoped to globs with a `paths` frontmatter field so they only load when matching files are touched. It reads an existing AGENTS.md when there is no CLAUDE.md, and supports `@path` imports up to four hops deep[^3].',
    },
    {
      type: 'code',
      lang: 'markdown',
      filename: '.claude/rules/api.md',
      code: '---\npaths:\n  - "src/api/**/*.ts"\n---\n\n# API rules\n\n- Validate every request body with the shared zod schemas in src/lib/validators.\n- Return errors in the RFC 9457 problem+json shape.\n- Never log request bodies; they can contain tokens.',
      caption: 'A path-scoped rule loads only when the agent reads or edits a matching file, so it costs nothing on unrelated work[^3].',
    },
    {
      type: 'p',
      text: 'The most important sentence in Claude Code’s memory documentation is easy to skim past: these files are “context, not enforced configuration”[^3]. The model *usually* follows them — more reliably when they are short, specific and non-contradictory (the docs suggest keeping each file under about 200 lines). If something must never happen, do not write a sterner paragraph. Use the permission system or a hook.',
    },
    { type: 'h2', id: 'tool-loop', text: 'The tool loop is where quality is won' },
    {
      type: 'p',
      text: 'Agent mode in Cursor, Copilot’s cloud agent, Windsurf’s Cascade and Claude Code all run the loop in the figure above. What differs is the quality of the *observations*. An agent that sees the full type-checker output, the failing test’s assertion diff and the stack trace converges in a few turns. One that sees “command failed (exit 1)” flails.',
    },
    {
      type: 'p',
      text: 'This is why the investment with the highest return is boring: make your project’s checks fast, deterministic and readable. A `npm run verify` that finishes in twenty seconds and prints one clear failure per problem turns a mediocre agent into a good one. Hooks let you wire that in deterministically — Claude Code, for example, can run a command after every edit and feed the result back, or block a tool call outright with exit code 2[^4].',
    },
    {
      type: 'code',
      lang: 'json',
      filename: '.claude/settings.json',
      code: '{\n  "hooks": {\n    "PostToolUse": [\n      {\n        "matcher": "Edit|Write",\n        "hooks": [\n          {\n            "type": "command",\n            "command": "jq -r \'.tool_input.file_path\' | xargs npx prettier --write"\n          }\n        ]\n      }\n    ]\n  }\n}',
      caption: 'The formatter runs after every edit whether or not the model remembers to — this is the example from Claude Code’s hooks guide[^4].',
    },
    {
      type: 'p',
      text: 'Parallelism is the other frontier. Claude Code’s subagents each run in their own context window, so a noisy exploration (“find every place we parse dates”) returns a summary instead of filling the main session with file dumps[^5]. GitHub’s Copilot cloud agent pushes the same idea off your machine entirely: it works in an ephemeral cloud environment, runs tests and linters there, and hands back a branch for review[^6].',
    },
    { type: 'h2', id: 'protocols', text: 'Two protocols decouple the stack' },
    {
      type: 'p',
      text: 'The **Model Context Protocol** standardises the tools and data an agent can reach — a database, an issue tracker, a design file — as JSON-RPC servers any client can mount. Its 2026-07-28 revision made the core stateless so servers can sit behind ordinary load balancers[^7]. I cover it in depth in a separate post.',
    },
    {
      type: 'p',
      text: 'The **Agent Client Protocol**, created by Zed, standardises the other seam: how an *editor* hosts an *agent*. It is JSON-RPC over stdio for local agents, reuses MCP’s JSON shapes where it can, and adds coding-specific types such as diffs[^8]. The practical upshot is that the agent you like and the editor you like no longer have to come from the same vendor.',
    },
    {
      type: 'table',
      caption: 'How the main tools package the same four subsystems (October 2026).',
      head: ['Tool', 'Form factor', 'Retrieval', 'Instructions', 'Runs where'],
      rows: [
        ['Cursor', 'VS Code fork', 'Server-side embeddings + Merkle sync[^1]', '`.cursor/rules`, AGENTS.md', 'Local editor, background agents'],
        ['GitHub Copilot', 'Extension (VS Code, JetBrains, Xcode…)', 'Workspace index + GitHub code search', 'Custom instructions, AGENTS.md', 'Editor; cloud agent in an ephemeral environment[^6]'],
        ['Claude Code', 'Terminal, IDE, desktop, web', 'Agentic search (grep, glob, read)', 'CLAUDE.md hierarchy, rules, AGENTS.md[^3]', 'Your machine; subagents in separate contexts[^5]'],
        ['Zed', 'Native editor (Rust)', 'Editor-native + agent of choice', 'Per-agent', 'Hosts external agents over ACP[^8]'],
        ['Windsurf', 'VS Code fork', 'Indexed context engine', 'Rules, AGENTS.md', 'Local editor (Cascade)'],
      ],
    },
    { type: 'h2', id: 'choosing', text: 'How to choose: run a five-ticket eval' },
    {
      type: 'p',
      text: 'Leaderboards measure models on someone else’s repository. What you care about is time-to-green on *yours*. My process for a team evaluation takes an afternoon:',
    },
    {
      type: 'list',
      ordered: true,
      items: [
        'Pick five closed tickets with known-good diffs: one bug fix, one refactor across many files, one feature touching UI and API, one test-writing task, one “investigate and explain”.',
        'Reset the repository to the parent commit of each fix and give every tool the ticket text verbatim, plus the same AGENTS.md.',
        'Measure wall-clock time to a passing `verify`, number of human interventions, tokens or credits spent, and whether a reviewer would merge the diff unchanged.',
        'Weight the results by how often your team does each kind of task. A tool that is brilliant at greenfield features but sloppy at refactors is the wrong tool for a mature codebase.',
      ],
    },
    {
      type: 'callout',
      tone: 'note',
      title: 'My current setup',
      text: 'A terminal agent for multi-file work and investigations, an editor with fast inline completion for the small stuff, a 20-second `verify` script, and one AGENTS.md shared by both. Swapping models is a config change; the instruction file and the checks are the durable assets.',
    },
    {
      type: 'p',
      text: 'The editor wars will keep producing headlines, but the architecture has settled. Invest in the parts that transfer — crisp instructions, fast checks, well-scoped tools — and every agent you try will be better for it.',
    },
  ],
  references: [
    { id: 1, title: 'Securely indexing large codebases', publisher: 'Cursor', url: 'https://cursor.com/blog/secure-codebase-indexing' },
    { id: 2, title: 'AGENTS.md — a simple, open format for guiding coding agents', publisher: 'agents.md', url: 'https://agents.md/' },
    { id: 3, title: 'How Claude remembers your project (CLAUDE.md, rules, AGENTS.md)', publisher: 'Claude Code docs', url: 'https://code.claude.com/docs/en/memory' },
    { id: 4, title: 'Automate actions with hooks', publisher: 'Claude Code docs', url: 'https://code.claude.com/docs/en/hooks-guide' },
    { id: 5, title: 'Create custom subagents', publisher: 'Claude Code docs', url: 'https://code.claude.com/docs/en/sub-agents' },
    {
      id: 6,
      title: 'About GitHub Copilot cloud agent',
      publisher: 'GitHub Docs',
      url: 'https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent',
    },
    { id: 7, title: 'The 2026-07-28 MCP specification release candidate', publisher: 'Model Context Protocol blog', url: 'https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/' },
    { id: 8, title: 'Agent Client Protocol', publisher: 'agentclientprotocol.com', url: 'https://agentclientprotocol.com/' },
    { id: 9, title: 'Lost in the Middle: How Language Models Use Long Contexts (Liu et al.)', publisher: 'arXiv', url: 'https://arxiv.org/abs/2307.03172' },
  ],
}
