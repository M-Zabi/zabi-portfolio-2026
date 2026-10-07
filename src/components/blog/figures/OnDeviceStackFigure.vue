<script setup lang="ts">
import FigureFrame from './FigureFrame.vue'

defineProps<{ index: number; caption: string; alt: string }>()

const columns = [
  {
    title: 'Platform model',
    tone: 'bg-cobalt text-cobalt-foreground',
    items: ['Apple Foundation Models (~3B)', 'Gemini Nano via ML Kit · AICore'],
    note: 'Nothing to ship · OS-managed',
  },
  {
    title: 'Portable runtime',
    tone: 'bg-mint text-mint-foreground',
    items: ['React Native ExecuTorch', 'llama.rn (llama.cpp · GGUF)'],
    note: 'Your weights · native threads',
  },
  {
    title: 'Sidecar server',
    tone: 'bg-volt text-volt-foreground',
    items: ['llama-server via Tauri sidecar', 'OpenAI-compatible on 127.0.0.1'],
    note: 'Desktop only · biggest models',
  },
]
</script>

<template>
  <FigureFrame :index="index" :caption="caption" :alt="alt" surface="none">
    <div class="space-y-3">
      <div class="rounded-2xl border border-border bg-card px-4 py-3 text-center text-sm font-semibold">
        App UI — React Native (JS thread) · Tauri (webview)
      </div>
      <p class="text-label text-center text-[0.5625rem] text-muted-foreground" aria-hidden="true">JSI · TurboModules · IPC · HTTP</p>
      <div class="grid gap-3 @lg:grid-cols-3">
        <div v-for="column in columns" :key="column.title" class="grain flex flex-col rounded-2xl p-4" :class="column.tone">
          <p class="font-display text-lg font-semibold tracking-tight">{{ column.title }}</p>
          <ul class="mt-3 space-y-1.5 text-[0.8125rem]">
            <li v-for="item in column.items" :key="item" class="rounded-lg bg-current/8 px-2.5 py-1.5">{{ item }}</li>
          </ul>
          <p class="text-label mt-auto pt-4 text-[0.5625rem] opacity-70">{{ column.note }}</p>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border bg-border text-center text-sm">
        <span class="bg-ink py-3 text-paper">CPU</span>
        <span class="bg-ink py-3 text-paper">GPU · Metal / OpenCL / CUDA</span>
        <span class="bg-ink py-3 text-paper">Neural engine · NPU</span>
      </div>
    </div>
  </FigureFrame>
</template>
