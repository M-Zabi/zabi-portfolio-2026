import type { Post } from '@/types/blog'

export const post: Post = {
  slug: 'mcp-2026-07-28-explained',
  title: 'MCP went stateless. Here is what changes',
  dek: 'The 2026-07-28 Model Context Protocol revision removed sessions, server-initiated requests and the initialize handshake. A builder’s guide to the new shape.',
  excerpt:
    'The Model Context Protocol’s 2026-07-28 specification is its biggest change yet: a stateless core, routable HTTP headers, multi-round-trip requests, extensions, and hardened OAuth. What it means for the servers you run.',
  category: 'protocols',
  tags: ['MCP', 'JSON-RPC', 'OAuth 2.1', 'Streamable HTTP', 'Security'],
  color: 'ember',
  cover: 'protocol',
  publishedAt: '2026-08-21',
  summary: {
    tldr: 'MCP 2026-07-28 turns the protocol from a long-lived session into plain request/response. Every request carries its protocol version and capabilities, Streamable HTTP mirrors the method and target into headers so ordinary load balancers can route it, servers ask for more input by returning a result instead of calling the client, and authorization lines up with mainstream OAuth and OpenID Connect.',
    points: [
      'No more initialize handshake or Mcp-Session-Id: version and client capabilities ride in each request’s _meta.',
      'Streamable HTTP requires MCP-Protocol-Version, Mcp-Method and Mcp-Name headers, so gateways route without parsing bodies.',
      'Servers no longer send JSON-RPC requests; they return an InputRequiredResult and the client retries with the answers.',
      'Roots, sampling and logging are deprecated (12-month minimum); MCP Apps and Tasks ship as official extensions.',
      'Security rules to internalise: never pass tokens through, never treat a state handle as authentication, and require consent before running local server commands.',
    ],
  },
  body: [
    {
      type: 'lead',
      text: 'The Model Context Protocol began life as a way for a desktop chat app to launch a subprocess and talk to it over stdin. Two years later it is how agents reach databases, issue trackers, design files and internal APIs — often across the network, behind gateways, at scale. The 2026-07-28 revision is the spec catching up with that reality.',
    },
    { type: 'h2', id: 'refresher', text: 'A thirty-second refresher' },
    {
      type: 'p',
      text: 'MCP has three roles. A **host** is the application the user sees — an editor, a chat app, an agent runtime. Inside it, an MCP **client** holds a connection to each **server**, and each server exposes capabilities: **tools** the model can call, **resources** it can read, and **prompts** the user can invoke. Messages are JSON-RPC 2.0, UTF-8 encoded[^1][^2].',
    },
    {
      type: 'figure',
      figure: 'mcp-architecture',
      caption: 'One host, many clients, one server per client. In 2026-07-28 every arrow is a self-contained request: any replica behind the load balancer can answer it.',
      alt: 'Architecture diagram: a host application containing three MCP clients, each connected to a server — a local stdio server for the file system, and two remote Streamable HTTP servers for an issue tracker and a database, behind a load balancer.',
    },
    { type: 'h2', id: 'stateless', text: 'The core is stateless now' },
    {
      type: 'p',
      text: 'Earlier revisions opened every connection with an `initialize` / `initialized` handshake, negotiated capabilities once, and — over HTTP — pinned the conversation to a server instance with an `Mcp-Session-Id` header. That made horizontal scaling miserable: sticky sessions, shared session stores, and reconnection logic everywhere[^3].',
    },
    {
      type: 'p',
      text: 'In 2026-07-28 the handshake and the session header are gone. Every request carries its protocol version and client capabilities in `_meta` fields, so the protocol becomes plain request/response and “a plain round-robin load balancer” works[^3]. Message direction is simplified too: servers no longer initiate JSON-RPC requests, and clients no longer send JSON-RPC responses[^1].',
    },
    {
      type: 'callout',
      tone: 'note',
      title: 'Where did state go?',
      text: 'Into your tools, explicitly. A server that needs a cart, a workflow or a cursor mints a handle, returns it in a tool result, and receives it back as an ordinary tool argument. The spec is blunt about the consequence: possession of a handle **MUST NOT** be treated as authentication[^4].',
    },
    { type: 'h2', id: 'transports', text: 'Transports: stdio and routable HTTP' },
    {
      type: 'p',
      text: 'Two standard bindings remain. **stdio** is newline-delimited JSON-RPC over the standard streams of a client-launched subprocess; custom byte-stream transports should reuse that framing. **Streamable HTTP** sends each message as an HTTP POST to a single endpoint; the reply arrives either as a JSON object or as a request-scoped Server-Sent Events stream, and closing that stream cancels the request[^1].',
    },
    {
      type: 'p',
      text: 'The interesting change is that Streamable HTTP now mirrors routing metadata into headers. Requests carry `MCP-Protocol-Version: 2026-07-28` plus `Mcp-Method` and `Mcp-Name`, so a gateway can rate-limit `tools/call` for one expensive tool, or route it to a GPU pool, without parsing JSON. The body stays authoritative, and servers reject requests whose headers and body disagree[^3].',
    },
    {
      type: 'code',
      lang: 'text',
      filename: 'HTTP request',
      code: 'POST /mcp HTTP/1.1\nHost: tracker.example.com\nContent-Type: application/json\nAccept: application/json, text/event-stream\nAuthorization: Bearer eyJhbGciOi…\nMCP-Protocol-Version: 2026-07-28\nMcp-Method: tools/call\nMcp-Name: search_issues\n\n{"jsonrpc":"2.0","id":7,"method":"tools/call",\n "params":{"name":"search_issues","arguments":{"query":"crash on launch"},\n           "_meta":{ … protocol version and client capabilities … }}}',
      caption: 'Everything a load balancer needs is in the headers; everything the server needs is in the body.',
    },
    { type: 'h2', id: 'multi-round-trip', text: 'Asking for more input without calling back' },
    {
      type: 'p',
      text: 'Previously a server that needed something mid-request — user confirmation, an LLM completion — sent its own JSON-RPC request back over a held-open stream. That is incompatible with stateless scaling, so 2026-07-28 inverts it. The server returns an `InputRequiredResult` containing `inputRequests` and an opaque `requestState`; the client gathers the answers and re-submits the original request with `inputResponses`. Because all the context is in the payload, *any* replica can process the retry[^3].',
    },
    {
      type: 'p',
      text: 'Two smaller additions round this out. Results can carry `ttlMs` and `cacheScope`, modelled on HTTP `Cache-Control`, so clients can cache tool listings and idempotent reads. And W3C Trace Context (`traceparent`, `tracestate`, `baggage`) is formalised in `_meta`, which means a single OpenTelemetry trace can follow a user’s request from the host, through the model’s tool call, into your server and its database[^3][^7].',
    },
    { type: 'h2', id: 'extensions', text: 'Extensions, and what got deprecated' },
    {
      type: 'p',
      text: 'Extensions are now first-class, negotiated through an `extensions` map with reverse-DNS identifiers. Two official ones ship with this release. **MCP Apps** lets a server ship interactive HTML interfaces that the host renders in a sandboxed iframe, with templates declared up front for prefetching and security review. **Tasks** graduates long-running work from the experimental core: `tools/call` returns a task handle and the client drives it with `tasks/get`, `tasks/update` and `tasks/cancel`[^3].',
    },
    {
      type: 'table',
      caption: 'Deprecated in 2026-07-28 — annotation-only, with at least twelve months before removal[^3].',
      head: ['Feature', 'Use instead'],
      rows: [
        ['Roots', 'Tool parameters or server configuration'],
        ['Sampling (server asks the client’s model)', 'A direct integration with an LLM provider'],
        ['Logging', 'stderr or OpenTelemetry'],
      ],
    },
    {
      type: 'p',
      text: 'Tool `inputSchema` and `outputSchema` also move to full **JSON Schema 2020-12**, so `oneOf`, conditionals and `$ref` are legal[^3][^8]. If your tools take discriminated unions, you no longer have to flatten them into optional fields.',
    },
    { type: 'h2', id: 'authorization', text: 'Authorization: closer to plain OAuth' },
    {
      type: 'p',
      text: 'HTTP-based MCP servers are OAuth 2.1 resource servers. The 2026-07-28 changes align that more tightly with mainstream OAuth and OpenID Connect deployments: clients must validate the `iss` parameter on authorization responses per RFC 9207, which defeats mix-up attacks where a malicious authorization server tricks a client into handing over another server’s code; clients declare an OIDC `application_type` at registration; credentials are bound to the issuing server; and refresh and step-up flows are spelled out, with clients accumulating the union of granted scopes[^3][^4][^9].',
    },
    {
      type: 'callout',
      tone: 'warning',
      title: 'Token passthrough is forbidden',
      text: 'An MCP server **MUST NOT** accept tokens that were not explicitly issued for it — and therefore must never forward a client’s token to a downstream API. Validate the audience, and mint or exchange your own downstream credentials[^4].',
    },
    { type: 'h2', id: 'build', text: 'Building a server today' },
    {
      type: 'p',
      text: 'The TypeScript SDK’s v2 line implements 2026-07-28. Tools are declared with any Standard Schema validator — zod in this example — and the same server can be exposed over stdio or HTTP[^5].',
    },
    {
      type: 'code',
      lang: 'ts',
      filename: 'server.ts',
      code: "import { McpServer } from '@modelcontextprotocol/server'\nimport { StdioServerTransport } from '@modelcontextprotocol/server/stdio'\nimport * as z from 'zod/v4'\n\nconst server = new McpServer({ name: 'release-notes', version: '1.0.0' })\n\nserver.registerTool(\n  'search_changelog',\n  {\n    description: 'Search shipped release notes by keyword. Read-only.',\n    inputSchema: z.object({\n      query: z.string().min(2),\n      limit: z.number().int().max(20).default(5),\n    }),\n  },\n  async ({ query, limit }) => {\n    const hits = await changelog.search(query, limit)\n    return { content: [{ type: 'text', text: hits.map((hit) => `${hit.version}: ${hit.title}`).join('\\n') }] }\n  },\n)\n\nawait server.connect(new StdioServerTransport())",
      caption: 'Write tool descriptions for the model, not for humans: say what the tool does, what it never does, and when to prefer another tool.',
    },
    {
      type: 'p',
      text: 'Registering it with a client is one line. In Claude Code, a project-scoped server lives in `.mcp.json` so the whole team gets it[^6]:',
    },
    {
      type: 'code',
      lang: 'json',
      filename: '.mcp.json',
      code: '{\n  "mcpServers": {\n    "release-notes": {\n      "command": "node",\n      "args": ["./tools/mcp/server.js"]\n    }\n  }\n}',
    },
    { type: 'h2', id: 'security', text: 'A security checklist for MCP servers' },
    {
      type: 'list',
      items: [
        '**Least-privilege scopes.** Start with a minimal read scope and step up with targeted `WWW-Authenticate` challenges; never publish omnibus scopes like `admin:*`[^4].',
        '**Handles are not credentials.** Generate state handles with a secure RNG and bind them server-side to the authenticated user[^4].',
        '**Local servers are code execution.** Clients must show the exact command and get consent before launching one; prefer stdio over an open localhost port[^4].',
        '**Block SSRF in discovery.** Clients fetching OAuth metadata should require HTTPS and refuse private, loopback and link-local ranges such as `169.254.169.254`[^4].',
        '**Treat tool output as untrusted input.** Anything a tool returns can contain instructions aimed at the model; hosts should keep a human in the loop for destructive actions.',
      ],
    },
    {
      type: 'p',
      text: 'The protocol is finally shaped like the rest of your infrastructure: stateless requests, standard headers, standard OAuth, standard tracing. Build MCP servers the way you build any other API, and they will scale like one.',
    },
  ],
  references: [
    { id: 1, title: 'Transports — Model Context Protocol specification 2026-07-28', publisher: 'modelcontextprotocol.io', url: 'https://modelcontextprotocol.io/specification/2026-07-28/basic/transports' },
    { id: 2, title: 'JSON-RPC 2.0 Specification', publisher: 'jsonrpc.org', url: 'https://www.jsonrpc.org/specification' },
    { id: 3, title: 'The 2026-07-28 MCP specification release candidate', publisher: 'Model Context Protocol blog', url: 'https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/' },
    { id: 4, title: 'Security best practices — MCP specification 2026-07-28', publisher: 'modelcontextprotocol.io', url: 'https://modelcontextprotocol.io/specification/2026-07-28/basic/security_best_practices' },
    { id: 5, title: 'MCP TypeScript SDK (v2)', publisher: 'GitHub', url: 'https://github.com/modelcontextprotocol/typescript-sdk' },
    { id: 6, title: 'Connect Claude Code to tools via MCP', publisher: 'Claude Code docs', url: 'https://code.claude.com/docs/en/mcp' },
    { id: 7, title: 'Trace Context', publisher: 'W3C Recommendation', url: 'https://www.w3.org/TR/trace-context/' },
    { id: 8, title: 'JSON Schema Draft 2020-12', publisher: 'json-schema.org', url: 'https://json-schema.org/draft/2020-12' },
    { id: 9, title: 'RFC 9207: OAuth 2.0 Authorization Server Issuer Identification', publisher: 'IETF', url: 'https://www.rfc-editor.org/rfc/rfc9207' },
  ],
}
