<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import ContactAssistant from '@/components/assistant/ContactAssistant.vue'
import IndiaFlag from '@/components/common/IndiaFlag.vue'
import LocalTime from '@/components/common/LocalTime.vue'
import PageHero from '@/components/common/PageHero.vue'
import StatusDot from '@/components/common/StatusDot.vue'
import FadeIn from '@/components/motion/FadeIn.vue'
import RollingText from '@/components/motion/RollingText.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { pages } from '@/config/seo'
import { site } from '@/config/site'

usePageMeta(pages.contact)

const route = useRoute()
const wantsResume = computed(() => route.query.intent === 'resume')
</script>

<template>
  <div>
    <PageHero
      label="(Contact)"
      :title="wantsResume ? 'Ask for the\n*résumé.*' : 'Tell me what\nyou’re *building.*'"
      :description="
        wantsResume
          ? 'My assistant asks who’s reading, then hands it straight over. About thirty seconds.'
          : `My assistant asks the questions I’d ask on a first call — it takes about a minute. ${site.replyTime}.`
      "
    />

    <section class="container-page pb-16" aria-label="Talk to the assistant">
      <FadeIn :delay="0.25">
        <ContactAssistant />
      </FadeIn>
    </section>

    <section class="container-page pb-(--space-section)" aria-label="Details">
      <FadeIn :delay="0.1">
        <dl class="grid grid-cols-2 gap-x-6 gap-y-8 border-t border-border pt-10 lg:grid-cols-4">
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
          <div>
            <dt class="text-label text-muted-foreground">Based in</dt>
            <dd class="mt-2 flex items-center gap-2.5 font-medium">
              <IndiaFlag class="w-6 shrink-0" />
              {{ site.home.city }}, {{ site.home.country }}
            </dd>
          </div>
          <div>
            <dt class="text-label text-muted-foreground">Elsewhere</dt>
            <dd class="mt-1">
              <ul class="flex flex-wrap gap-x-5">
                <li v-for="social in site.socials" :key="social.label">
                  <a :href="social.href" target="_blank" rel="noopener noreferrer" class="roll-trigger inline-flex min-h-11 items-center font-medium">
                    <RollingText :text="social.label" />
                  </a>
                </li>
              </ul>
            </dd>
          </div>
        </dl>
      </FadeIn>
    </section>
  </div>
</template>
