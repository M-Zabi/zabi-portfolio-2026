<script setup lang="ts">
import ArrowLink from '@/components/common/ArrowLink.vue'
import StatusDot from '@/components/common/StatusDot.vue'
import AppMark from '@/components/layout/AppMark.vue'
import { site, yearsOfExperience } from '@/config/site'
</script>

<template>
  <aside class="grain overflow-hidden rounded-3xl bg-ink p-7 text-paper sm:p-9" aria-label="About the author">
    <div class="flex flex-col gap-7 sm:flex-row sm:items-start">
      <span class="grid size-20 shrink-0 place-items-center rounded-2xl bg-ember text-ember-foreground">
        <AppMark class="w-12" />
      </span>
      <div>
        <p class="text-label opacity-60">About the author</p>
        <p class="mt-2 font-display text-2xl font-semibold tracking-tight">{{ site.fullName }}</p>
        <p class="mt-1 text-sm opacity-70">{{ site.role }} · {{ site.home.city }}</p>
        <p class="mt-4 max-w-[52ch] leading-relaxed opacity-85">
          {{ yearsOfExperience }}+ years shipping web platforms, React Native apps and Tauri/Electron desktop tools. I write
          about the AI tooling I actually use on client work — what holds up, what doesn’t, and what it costs.
        </p>
        <p class="mt-5 flex items-center gap-2.5 text-sm font-medium">
          <StatusDot />
          {{ site.availability.label }}
        </p>
        <div class="mt-6 flex flex-wrap gap-x-8 gap-y-2">
          <ArrowLink to="/contact" label="Start a project" />
          <ArrowLink :to="{ path: '/contact', query: { intent: 'resume' } }" label="Get my résumé" />
        </div>
      </div>
    </div>
  </aside>
</template>
