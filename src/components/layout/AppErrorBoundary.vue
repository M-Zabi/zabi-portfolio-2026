<script setup lang="ts">
import { onErrorCaptured, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import ErrorState from '@/components/common/ErrorState.vue'
import { reportError } from '@/lib/monitoring'

/**
 * Contains a crashing page: the header, menu and footer keep working, the visitor gets a
 * designed explanation, and navigating anywhere else clears the error.
 */
const error = ref<unknown>(null)
const route = useRoute()

onErrorCaptured((captured) => {
  error.value = captured
  reportError(captured, 'page')
  return false
})

watch(
  () => route.path,
  () => (error.value = null),
)

function reload() {
  window.location.reload()
}
</script>

<template>
  <div v-if="error" class="container-page grid min-h-svh place-items-center pt-(--header-h) pb-24">
    <div class="w-full max-w-2xl">
      <ErrorState
        title="This page hit a snag"
        description="Something broke while drawing this page. Reloading usually fixes it — the rest of the site still works."
        @retry="reload"
      />
    </div>
  </div>
  <slot v-else />
</template>
