<script setup lang="ts">

import GameLeaderboard from '@/components/about/GameLeaderboard.vue'
import RigPanel from '@/components/about/RigPanel.vue'
import TechToolbox from '@/components/about/TechToolbox.vue'
import ArrowLink from '@/components/common/ArrowLink.vue'
import PageHero from '@/components/common/PageHero.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import AppMark from '@/components/layout/AppMark.vue'
import FadeIn from '@/components/motion/FadeIn.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { pages } from '@/config/seo'
import { site, yearsOfExperience } from '@/config/site'
import { experience, principles } from '@/content/profile'
import { padIndex } from '@/lib/utils'

usePageMeta(pages.about)
</script>

<template>
  <div>
    <PageHero label="(About)" :title="'Engineer by trade,\n*interaction designer*\nby obsession.'" />

    <section class="container-page grid gap-14 pb-(--space-section) lg:grid-cols-12" aria-label="Biography">
      <FadeIn class="lg:col-span-5">
        <figure>
          <div class="group/mark grain relative grid aspect-[4/5] place-items-center overflow-hidden rounded-3xl bg-ember text-ember-foreground">
            <AppMark explode class="w-3/4 drop-shadow-[0_30px_40px_rgb(0_0_0/0.25)]" />
            <span class="text-label absolute top-6 left-6 opacity-70">The mark</span>
            <span class="text-label absolute top-6 right-6 tabular opacity-70">Est. {{ site.startedYear }}</span>
          </div>
          <figcaption class="mt-4 text-sm text-muted-foreground">
            MZ — six strokes that come apart and lock back together. Hover the mark.
          </figcaption>
        </figure>
      </FadeIn>

      <div class="space-y-6 text-lead lg:col-span-6 lg:col-start-7 lg:pt-4">
        <FadeIn as="p">
          I’m {{ site.name }} — a senior full-stack engineer based in {{ site.home.city }}, {{ site.home.country }},
          with {{ yearsOfExperience }}+ years of building products
          people use every day: web platforms, React Native apps in both stores, and desktop tools built with Tauri and
          Electron.
        </FadeIn>
        <FadeIn as="p" :delay="0.08" class="text-muted-foreground">
          My focus is the layer most teams leave until last — how software <em class="text-foreground">feels</em>.
          Latency budgets, gesture physics, transitions that explain what just happened, and workflows with fewer steps
          than the ones they replace.
        </FadeIn>
        <FadeIn as="p" :delay="0.16" class="text-muted-foreground">
          I work best as an embedded senior engineer, or as the person who takes a product from prototype to launch:
          the API, the motion system and the release pipeline, shipped by one pair of hands.
        </FadeIn>
        <FadeIn :delay="0.2" class="flex flex-wrap gap-x-8 gap-y-2 pt-2">
          <ArrowLink :to="{ path: '/contact', query: { intent: 'resume' } }" label="Get my résumé" />
          <ArrowLink to="/contact" label="Start a project" />
        </FadeIn>
        <div class="pt-4">
          <FadeIn as="h2" :y="10" :delay="0.2" class="text-label text-muted-foreground">(Toolbox)</FadeIn>
          <TechToolbox class="mt-4" />
        </div>
      </div>
    </section>

    <section class="section-y container-page border-t border-border" aria-labelledby="principles-title">
      <SectionHeading index="01" label="Principles" title-id="principles-title" :title="'How I *work.*'" />
      <ol class="mt-14 grid gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-3">
        <li v-for="(principle, index) in principles" :key="principle.title" class="bg-background">
          <FadeIn :delay="index * 0.08" class="flex h-full flex-col gap-10 p-7 sm:p-9">
            <span class="text-label tabular text-muted-foreground">{{ padIndex(index + 1) }}</span>
            <div class="mt-auto">
              <h3 class="font-display text-2xl font-semibold tracking-tight">{{ principle.title }}</h3>
              <p class="mt-3 leading-relaxed text-muted-foreground">{{ principle.body }}</p>
            </div>
          </FadeIn>
        </li>
      </ol>
    </section>

    <section v-if="experience.length" class="section-y container-page border-t border-border" aria-labelledby="experience-title">
      <SectionHeading index="02" label="Experience" title-id="experience-title" :title="'Where I’ve *shipped.*'" />
      <ol class="mt-14 border-t border-border">
        <li v-for="(entry, index) in experience" :key="entry.period" class="border-b border-border">
          <FadeIn
            :delay="index * 0.05"
            class="grid gap-3 py-8 transition-colors duration-300 hover:bg-accent/40 md:grid-cols-12 md:gap-6 md:px-4"
          >
            <p class="text-label tabular text-muted-foreground md:col-span-3 md:pt-1.5">{{ entry.period }}</p>
            <div class="md:col-span-4">
              <h3 class="font-display text-xl font-semibold tracking-tight">{{ entry.role }}</h3>
              <p class="text-muted-foreground">{{ entry.company }}</p>
            </div>
            <p class="max-w-[52ch] leading-relaxed text-muted-foreground md:col-span-5">{{ entry.summary }}</p>
          </FadeIn>
        </li>
      </ol>
    </section>

    <section id="off-the-clock" class="section-y container-page border-t border-border" aria-labelledby="games-title">
      <SectionHeading
        index="03"
        label="Off the clock"
        title-id="games-title"
        :title="'Player *one.*'"
        description="When the editor closes, the PC stays on. Games taught me how low latency, steady frame pacing and a menu that respects your time actually feel — I’ve been chasing that feeling in software ever since."
      />
      <div class="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-8">
        <FadeIn class="lg:col-span-5">
          <RigPanel />
        </FadeIn>
        <GameLeaderboard class="lg:col-span-7 lg:pl-4" />
      </div>
    </section>
  </div>
</template>
