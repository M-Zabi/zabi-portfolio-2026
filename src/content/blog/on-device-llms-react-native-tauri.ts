import type { Post } from '@/types/blog'

export const post: Post = {
  slug: 'on-device-llms-react-native-tauri',
  title: 'Shipping on-device LLMs in React Native and Tauri apps',
  dek: 'Platform models, portable runtimes and a sidecar server: the architecture choices for putting a language model inside a mobile or desktop app.',
  excerpt:
    'How to run language models locally inside React Native and Tauri apps in 2026 — Apple’s Foundation Models, Gemini Nano, ExecuTorch, llama.rn and llama.cpp sidecars — and the memory, threading and delivery problems you will hit.',
  category: 'mobile',
  tags: ['React Native', 'Tauri', 'On-device AI', 'Foundation Models', 'Gemini Nano', 'llama.cpp'],
  color: 'cobalt',
  cover: 'device',
  publishedAt: '2026-08-07',
  summary: {
    tldr: 'For small, private, offline tasks — summarise, extract, classify, rewrite — an on-device model is now a realistic feature. Prefer the platform model where it exists (Apple’s Foundation Models, Gemini Nano via ML Kit), use a portable runtime (ExecuTorch, llama.rn) when you need your own weights on both platforms, and on desktop run llama.cpp as a sidecar process bound to localhost.',
    points: [
      'Apple’s on-device model is about 3B parameters with guided generation into Swift types; Android exposes Gemini Nano through ML Kit GenAI APIs on AICore, foreground-only.',
      'Bring-your-own-model on phones means roughly 1–4B parameters at 4-bit — a 3B model at Q4_K_M is about 2 GB, which is near the practical ceiling.',
      'Keep inference off the JS thread and batch streamed tokens per animation frame, or your UI will drop frames while the model talks.',
      'Never bundle multi-gigabyte weights in the binary: download after install, verify a checksum, resume on failure.',
      'In Tauri, ship llama-server as a sidecar, bind it to 127.0.0.1 on a random port with an API key, and grant only that binary in capabilities.',
    ],
  },
  body: [
    {
      type: 'lead',
      text: 'The best AI feature is sometimes the one that never touches a network. A note-taking app that summarises offline, a field-service tool that extracts data from photos in a basement with no signal, a journaling app whose entries must never leave the phone — these are now buildable with models that run on the device itself.',
    },
    {
      type: 'p',
      text: 'I build in React Native for mobile and Tauri for desktop, so this is the guide I wanted: which runtime to choose on each platform, and the engineering problems — memory, threads, model delivery — that the demos skip.',
    },
    { type: 'h2', id: 'when', text: 'When on-device is the right call' },
    {
      type: 'list',
      items: [
        '**Privacy is the product.** Health, finance, journals, enterprise documents.',
        '**Offline is common.** Field work, travel, poor connectivity.',
        '**Latency must be predictable.** Autocomplete, live transcription, as-you-type rewriting.',
        '**Volume is high and tasks are narrow.** Classifying thousands of items locally costs nothing at the margin.',
      ],
    },
    {
      type: 'p',
      text: 'It is the wrong call for open-ended reasoning, broad world knowledge or long documents. Phone-sized models are good at transforming the text you give them, and poor at knowing things you did not.',
    },
    {
      type: 'figure',
      figure: 'on-device-stack',
      caption: 'Three ways to reach a model from a cross-platform app. The closer to the platform, the less you ship — and the less you control.',
      alt: 'Layered diagram: the React Native or Tauri UI layer at the top; below it three columns — platform models (Apple Foundation Models, Gemini Nano via AICore), portable runtimes (ExecuTorch, llama.rn via JSI), and a local server sidecar (llama.cpp) — all running on the CPU, GPU and neural engine at the bottom.',
    },
    { type: 'h2', id: 'platform-models', text: 'Option 1: the platform’s own model' },
    {
      type: 'p',
      text: 'Both mobile platforms now ship a model with the operating system. You download nothing, share memory with the OS, and get hardware-tuned inference for free.',
    },
    {
      type: 'p',
      text: '**Apple’s Foundation Models framework** exposes the roughly 3-billion-parameter model behind Apple Intelligence. Its standout feature is *guided generation*: annotate a Swift type with `@Generable` and the model is constrained to produce exactly that structure, so you get typed values instead of parsing JSON[^1][^2]. The context window is small — plan for about 4,000 tokens — and the model is tuned for summarisation, extraction and classification rather than world knowledge.',
    },
    {
      type: 'code',
      lang: 'swift',
      filename: 'ReceiptExtractor.swift',
      code: 'import FoundationModels\n\n@Generable\nstruct Receipt {\n  @Guide(description: "Merchant name as printed")\n  var merchant: String\n  @Guide(description: "Total in minor units, e.g. 1299 for 12.99")\n  var totalMinor: Int\n  var currency: String\n}\n\nfunc extract(_ text: String) async throws -> Receipt {\n  let session = LanguageModelSession(instructions: "Extract receipt fields. Never invent values.")\n  return try await session.respond(to: text, generating: Receipt.self).content\n}',
      caption: 'Expose this to React Native as a native module (an Expo Module or a TurboModule) and return the struct as a plain object.',
    },
    {
      type: 'p',
      text: 'On Android, **ML Kit’s GenAI APIs** run Gemini Nano through AICore, a system service. Task-specific APIs cover summarisation, proofreading, rewriting and image description, and a general Prompt API is in beta; device support is limited to recent flagships, and inference is only permitted while your app is the foreground app[^3].',
    },
    {
      type: 'callout',
      tone: 'note',
      title: 'Always feature-detect',
      text: 'Platform models are absent on older devices, disabled by user settings, or still downloading. Check availability at runtime and design a graceful path — a cloud fallback with consent, or simply hiding the feature.',
    },
    { type: 'h2', id: 'portable', text: 'Option 2: a portable runtime with your own weights' },
    {
      type: 'p',
      text: 'When you need the same model on both platforms, a fine-tuned model, or a device that has no platform model, bring your own. Two React Native options lead:',
    },
    {
      type: 'list',
      items: [
        '**React Native ExecuTorch** from Software Mansion wraps Meta’s ExecuTorch runtime with hooks for LLMs, vision models, Whisper speech-to-text and Kokoro text-to-speech, and works with Expo[^4][^5].',
        '**llama.rn** binds llama.cpp, so it runs any GGUF model, with Metal acceleration on iOS and OpenCL on recent Adreno GPUs on Android[^6].',
      ],
    },
    {
      type: 'code',
      lang: 'ts',
      filename: 'features/summarise.ts',
      code: "import { initLlama } from 'llama.rn'\n\nconst context = await initLlama({\n  model: modelPath, // downloaded after install — never bundled\n  n_ctx: 2048,\n  n_gpu_layers: 99, // offload everything the GPU will take\n  use_mlock: true,\n})\n\nconst result = await context.completion(\n  {\n    messages: [\n      { role: 'system', content: 'Summarise in three bullet points. Use only the text provided.' },\n      { role: 'user', content: note },\n    ],\n    n_predict: 200,\n  },\n  ({ token }) => tokenBuffer.push(token), // stream into a buffer, not into React state\n)",
      caption: 'Based on the llama.rn README’s basic usage. The token callback writes into a buffer; the UI drains it once per frame[^6].',
    },
    {
      type: 'table',
      caption: 'Sizing a bring-your-own model for phones.',
      head: ['Model class', 'Q4_K_M size', 'Fits'],
      rows: [
        ['~1B parameters', '~0.8 GB', 'Most phones from the last four years'],
        ['~3B parameters', '~2 GB', 'Recent phones with 8 GB of RAM'],
        ['7B and up', '4 GB+', 'Not a realistic mobile target'],
      ],
      numeric: [1],
    },
    {
      type: 'callout',
      tone: 'warning',
      title: 'iOS will kill you for memory',
      text: 'iOS terminates apps that exceed their memory limit without warning. Load the model only when the feature opens, release it when the feature closes, keep `n_ctx` modest — the KV cache is extra memory on top of the weights — and request the increased-memory-limit entitlement if your feature genuinely needs it.',
    },
    { type: 'h2', id: 'threads', text: 'Keep the UI at 60 fps while the model talks' },
    {
      type: 'p',
      text: 'Inference must never run on the JavaScript thread. Both libraries above do the work in native code and call back with tokens. The trap is the callback: calling `setState` per token re-renders the whole message list 20–40 times a second.',
    },
    {
      type: 'p',
      text: 'Buffer tokens in a ref and flush them once per animation frame, so React renders at display rate no matter how fast the model is. The New Architecture’s JSI removes the old bridge’s serialisation cost, but it does not remove React’s render cost — that part is on you[^7].',
    },
    {
      type: 'code',
      lang: 'ts',
      filename: 'hooks/useTokenStream.ts',
      code: "export function useTokenStream() {\n  const buffer = useRef('')\n  const [text, setText] = useState('')\n\n  useEffect(() => {\n    let frame = requestAnimationFrame(function flush() {\n      if (buffer.current) {\n        const chunk = buffer.current\n        buffer.current = ''\n        setText((previous) => previous + chunk)\n      }\n      frame = requestAnimationFrame(flush)\n    })\n    return () => cancelAnimationFrame(frame)\n  }, [])\n\n  return { text, push: (token: string) => (buffer.current += token) }\n}",
    },
    { type: 'h2', id: 'delivery', text: 'Model delivery is a product feature' },
    {
      type: 'list',
      ordered: true,
      items: [
        '**Download after install**, on Wi-Fi by default, with clear progress and an estimate. Apple’s Background Assets and Google Play Asset Delivery exist for exactly this.',
        '**Verify a SHA-256 checksum** before loading; a truncated file can crash the native runtime.',
        '**Support resume.** Two-gigabyte downloads fail on mobile networks.',
        '**Version the weights** independently of the app, and keep the previous version until the new one verifies.',
        '**Let users delete it.** A model the size of a feature film deserves a line in your settings screen.',
      ],
    },
    { type: 'h2', id: 'desktop', text: 'Option 3 (desktop): a sidecar server' },
    {
      type: 'p',
      text: 'Desktop has the memory and GPUs to run larger models, and llama.cpp’s `llama-server` already exposes an OpenAI-compatible API. Tauri can bundle it as a **sidecar** — an external binary shipped with your app, named with the target triple for each platform — and start it from the frontend through the shell plugin[^8]. Your app then talks to it with any OpenAI-compatible client.',
    },
    {
      type: 'code',
      lang: 'json',
      filename: 'src-tauri/tauri.conf.json (excerpt)',
      code: '{\n  "bundle": {\n    "externalBin": ["binaries/llama-server"]\n  }\n}',
    },
    {
      type: 'code',
      lang: 'ts',
      filename: 'src/lib/local-model.ts',
      code: "import { Command } from '@tauri-apps/plugin-shell'\n\nexport async function startLocalModel(modelPath: string, port: number, apiKey: string) {\n  const command = Command.sidecar('binaries/llama-server', [\n    '-m', modelPath,\n    '--host', '127.0.0.1',\n    '--port', String(port),\n    '--api-key', apiKey,\n    '--ctx-size', '16384',\n  ])\n  return command.spawn() // keep the Child to kill it on quit\n}",
      caption: 'Grant `shell:allow-spawn` for this one sidecar in your capabilities file, and validate its arguments there too[^8].',
    },
    {
      type: 'callout',
      tone: 'warning',
      title: 'A localhost port is not private',
      text: 'Any process on the machine — and any web page that can reach localhost — can talk to an unauthenticated local server. Bind to 127.0.0.1, pick a random free port, generate a per-launch API key, and kill the child process when the app quits.',
    },
    {
      type: 'p',
      text: 'Electron apps can take the same sidecar approach or embed llama.cpp through Node bindings; web apps can run small models in the browser over WebGPU. The architecture is the same everywhere: a narrow, well-specified task, a model sized to the device, inference off the UI thread, and a delivery story that treats gigabytes with respect.',
    },
  ],
  references: [
    { id: 1, title: 'Meet the Foundation Models framework (WWDC25, session 286)', publisher: 'Apple Developer', url: 'https://developer.apple.com/videos/play/wwdc2025/286/' },
    { id: 2, title: 'Updates to Apple’s On-Device and Server Foundation Language Models', publisher: 'Apple Machine Learning Research', url: 'https://machinelearning.apple.com/research/apple-foundation-models-2025-updates' },
    { id: 3, title: 'ML Kit GenAI APIs', publisher: 'Google for Developers', url: 'https://developers.google.com/ml-kit/genai' },
    { id: 4, title: 'React Native ExecuTorch', publisher: 'Software Mansion', url: 'https://executorch.swmansion.com/' },
    { id: 5, title: 'The future of AI apps is on the device: How to run AI models with React Native ExecuTorch', publisher: 'Expo blog', url: 'https://expo.dev/blog/how-to-run-ai-models-with-react-native-executorch' },
    { id: 6, title: 'llama.rn — React Native binding of llama.cpp', publisher: 'GitHub', url: 'https://github.com/mybigday/llama.rn' },
    { id: 7, title: 'About the New Architecture', publisher: 'React Native docs', url: 'https://reactnative.dev/architecture/landing-page' },
    { id: 8, title: 'Embedding external binaries (sidecars)', publisher: 'Tauri v2 docs', url: 'https://v2.tauri.app/develop/sidecar/' },
  ],
}
