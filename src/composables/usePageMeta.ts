import { useHead } from '@unhead/vue'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useRoute } from 'vue-router'

import type { PageMeta } from '@/config/seo'
import { site } from '@/config/site'

/**
 * Keeps the live document in step with the page: title, description, canonical and robots.
 * The static per-route HTML written at build time carries the same values (plus Open Graph),
 * so what a crawler sees on first load matches what the app shows after navigation.
 */
export function usePageMeta(meta: MaybeRefOrGetter<PageMeta & { noindex?: boolean }>) {
  const route = useRoute()
  const current = computed(() => toValue(meta))

  useHead({
    title: computed(() => current.value.title),
    meta: computed(() => [
      { name: 'description', content: current.value.description },
      ...(current.value.noindex ? [{ name: 'robots', content: 'noindex' }] : []),
    ]),
    link: computed(() =>
      current.value.noindex ? [] : [{ rel: 'canonical', href: `${site.url}${route.path === '/' ? '/' : route.path}` }],
    ),
  })
}
