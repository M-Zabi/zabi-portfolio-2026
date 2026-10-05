<script setup lang="ts">

import BusinessCard3D from '@/components/business-card/BusinessCard3D.vue'
import LocalTime from '@/components/common/LocalTime.vue'
import PageHero from '@/components/common/PageHero.vue'
import StatusDot from '@/components/common/StatusDot.vue'
import ContactForm from '@/components/contact/ContactForm.vue'
import FadeIn from '@/components/motion/FadeIn.vue'
import RollingText from '@/components/motion/RollingText.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { pages } from '@/config/seo'
import { site } from '@/config/site'

usePageMeta(pages.contact)
</script>

<template>
  <div>
    <PageHero
      label="(Contact)"
      :title="'Tell me what\nyou’re *building.*'"
      :description="`A few details is all it takes. ${site.replyTime}.`"
    />

    <section class="container-page grid grid-cols-1 gap-16 pb-(--space-section) lg:grid-cols-12" aria-label="Get in touch">
      <FadeIn :delay="0.2" class="lg:col-span-7">
        <ContactForm />
      </FadeIn>

      <aside class="order-first flex flex-col gap-12 lg:order-none lg:col-span-5 lg:col-start-8">
        <FadeIn :delay="0.3">
          <BusinessCard3D />
          <p class="text-label mt-2 text-center text-muted-foreground">Tilt it · Click to flip</p>
        </FadeIn>

        <FadeIn :delay="0.4">
          <dl class="grid grid-cols-2 gap-x-6 gap-y-8 border-t border-border pt-8">
            <div>
              <dt class="text-label text-muted-foreground">Status</dt>
              <dd class="mt-2 flex items-start gap-2.5 font-medium">
                <StatusDot class="mt-2" />
                {{ site.availability.label }}
              </dd>
            </div>
            <div>
              <dt class="text-label text-muted-foreground">Local time</dt>
              <dd class="mt-2 font-medium"><LocalTime /></dd>
            </div>
            <div class="col-span-2">
              <dt class="text-label text-muted-foreground">Elsewhere</dt>
              <dd class="mt-2">
                <ul class="flex flex-wrap gap-x-6">
                  <li v-for="social in site.socials" :key="social.label">
                    <a
                      :href="social.href"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="roll-trigger inline-flex min-h-11 items-center font-medium"
                    >
                      <RollingText :text="social.label" />
                    </a>
                  </li>
                </ul>
              </dd>
            </div>
          </dl>
        </FadeIn>
      </aside>
    </section>
  </div>
</template>
