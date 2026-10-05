<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useTransitionStore } from '@/stores/transition'

/**
 * SPA navigations are silent to screen readers. Announce the new page and move focus to
 * the start of the content once the curtain has lifted.
 */
const router = useRouter()
const transition = useTransitionStore()
const message = ref('')

const removeHook = router.afterEach((to, from) => {
  if (!from.matched.length || to.path === from.path) return
  message.value = `${to.meta.title} page`
})
onBeforeUnmount(removeHook)

watch(
  () => transition.state,
  (state, previous) => {
    if (previous === 'revealing' && state === 'idle') {
      document.getElementById('main')?.focus({ preventScroll: true })
    }
  },
)
</script>

<template>
  <p class="sr-only" aria-live="polite" aria-atomic="true">{{ message }}</p>
</template>
