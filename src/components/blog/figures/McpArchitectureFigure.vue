<script setup lang="ts">
import { DatabaseIcon, FolderTreeIcon, MonitorIcon, ServerIcon, TicketIcon } from '@lucide/vue'

import FigureFrame from './FigureFrame.vue'

defineProps<{ index: number; caption: string; alt: string }>()

const servers = [
  { icon: FolderTreeIcon, name: 'Filesystem', transport: 'stdio', detail: 'Child process of the host', remote: false },
  { icon: TicketIcon, name: 'Issue tracker', transport: 'Streamable HTTP', detail: 'OAuth 2.1 · stateless replicas', remote: true },
  { icon: DatabaseIcon, name: 'Postgres', transport: 'Streamable HTTP', detail: 'Read-only scope', remote: true },
]
</script>

<template>
  <FigureFrame :index="index" :caption="caption" :alt="alt" surface="none">
    <div class="grid items-stretch gap-4 @2xl:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1.1fr)] @2xl:gap-0">
      <!-- Host -->
      <div class="rounded-2xl border border-border bg-card p-4">
        <p class="flex items-center gap-2 text-sm font-semibold">
          <MonitorIcon class="size-4" aria-hidden="true" /> Host
          <span class="font-normal text-muted-foreground">editor · agent runtime</span>
        </p>
        <ul class="mt-3 space-y-2">
          <li
            v-for="(server, i) in servers"
            :key="server.name"
            class="flex items-center justify-between rounded-xl border border-dashed border-border px-3 py-2.5 text-[0.8125rem]"
          >
            <span>MCP client <span class="tabular text-muted-foreground">#{{ i + 1 }}</span></span>
            <span class="text-label text-[0.5625rem] text-muted-foreground">1 : 1</span>
          </li>
        </ul>
      </div>

      <!-- Wires -->
      <div class="relative hidden @2xl:block" aria-hidden="true">
        <svg viewBox="0 0 112 200" preserveAspectRatio="none" class="absolute inset-0 size-full">
          <path v-for="(y, i) in [62, 106, 150]" :key="i" :d="`M0 ${y} C 56 ${y}, 56 ${48 + i * 52}, 112 ${48 + i * 52}`" class="fill-none stroke-border" stroke-width="1.5" vector-effect="non-scaling-stroke" />
          <path v-for="(y, i) in [62, 106, 150]" :key="`f${i}`" :d="`M0 ${y} C 56 ${y}, 56 ${48 + i * 52}, 112 ${48 + i * 52}`" class="wire fill-none stroke-mint" stroke-width="2" stroke-dasharray="4 10" vector-effect="non-scaling-stroke" :style="{ animationDelay: `${i * -0.6}s` }" />
        </svg>
        <span class="text-label absolute top-2 left-1/2 -translate-x-1/2 text-center text-[0.5625rem] whitespace-nowrap text-muted-foreground">JSON-RPC 2.0</span>
      </div>
      <p class="text-label text-center text-[0.625rem] text-muted-foreground @2xl:hidden" aria-hidden="true">↓ JSON-RPC 2.0 ↓</p>

      <!-- Servers -->
      <ul class="space-y-3">
        <li v-for="server in servers" :key="server.name" class="rounded-2xl border border-border bg-card p-3.5">
          <p class="flex items-center justify-between gap-3">
            <span class="flex items-center gap-2 text-sm font-semibold">
              <span class="grid size-7 place-items-center rounded-full bg-mint text-mint-foreground"><component :is="server.icon" class="size-3.5" /></span>
              {{ server.name }}
            </span>
            <span class="rounded-full border border-border px-2 py-0.5 font-mono text-[0.625rem] whitespace-nowrap text-muted-foreground">{{ server.transport }}</span>
          </p>
          <p class="mt-1.5 flex items-center gap-1.5 pl-9 text-xs text-muted-foreground">
            <ServerIcon v-if="server.remote" class="size-3" aria-hidden="true" />
            {{ server.detail }}
          </p>
        </li>
      </ul>
    </div>

    <div class="mt-5 rounded-xl bg-muted/60 px-4 py-3 font-mono text-[0.6875rem] leading-relaxed text-muted-foreground">
      <span class="text-foreground">POST /mcp</span> · MCP-Protocol-Version: 2026-07-28 · <span class="text-foreground">Mcp-Method: tools/call</span> · Mcp-Name: search_issues
    </div>
  </FigureFrame>
</template>

<style scoped>
.wire {
  animation: wire-flow 1.6s linear infinite;
}

@keyframes wire-flow {
  to {
    stroke-dashoffset: -28;
  }
}
</style>
