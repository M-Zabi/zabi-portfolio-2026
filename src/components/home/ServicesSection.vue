<script setup lang="ts">
import ArrowLink from '@/components/common/ArrowLink.vue'
import FadeIn from '@/components/motion/FadeIn.vue'
import RevealText from '@/components/motion/RevealText.vue'
import { site, yearsOfExperience } from '@/config/site'
import { services } from '@/content/profile'

import ServiceCard from './ServiceCard.vue'
</script>

<template>
  <section class="section-y relative z-10" aria-labelledby="services-title">
    <div class="container-page">
      <div class="grid gap-8 border-b border-border pb-16 lg:grid-cols-12 lg:pb-24">
        <FadeIn as="p" :y="10" class="text-label text-muted-foreground lg:col-span-3 lg:pt-2">(02) Info</FadeIn>
        <div class="lg:col-span-7 lg:col-start-6">
          <FadeIn as="p" class="text-lead text-muted-foreground">
            I’m <span class="font-medium text-foreground">{{ site.name }}</span>, a senior full-stack engineer with
            {{ yearsOfExperience }}+ years of shipping products for startups, agencies and product teams — on the web,
            in both app stores and on the desktop.
          </FadeIn>
          <FadeIn :delay="0.12" class="mt-8">
            <ArrowLink to="/about" label="Discover more" />
          </FadeIn>
        </div>
      </div>

      <div class="pt-16 lg:pt-24">
        <div class="flex items-end justify-between gap-6">
          <h2 id="services-title" class="font-display text-display-md">
            <RevealText text="Services" />
          </h2>
          <FadeIn as="p" class="text-label text-muted-foreground">(03) What I do</FadeIn>
        </div>

        <ul class="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <li v-for="(service, index) in services" :key="service.id">
            <FadeIn :delay="index * 0.08" class="h-full">
              <ServiceCard :service="service" />
            </FadeIn>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
