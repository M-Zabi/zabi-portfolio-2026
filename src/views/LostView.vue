<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'

import VaultGate from '@/components/vault/VaultGate.vue'
import { vaults } from '@/content/vault'
import { type SealedVault, vaultId } from '@/lib/vault'

import NotFoundView from './NotFoundView.vue'

/**
 * Every unknown path lands here. Most are genuinely lost; a few open a private page. Paths are
 * compared by hash, so the private ones never appear anywhere in the code.
 */
const route = useRoute()
const state = ref<'checking' | 'vault' | 'lost'>('checking')
const sealed = shallowRef<SealedVault | null>(null)

watch(
  () => route.path,
  async (path) => {
    state.value = 'checking'
    try {
      const match = vaults.size ? vaults.get(await vaultId(path)) : undefined
      sealed.value = match ?? null
      state.value = match ? 'vault' : 'lost'
    } catch {
      // No Web Crypto (an insecure context): nothing can be unlocked here anyway.
      state.value = 'lost'
    }
  },
  { immediate: true },
)
</script>

<template>
  <VaultGate v-if="state === 'vault' && sealed" :sealed="sealed" />
  <NotFoundView v-else-if="state === 'lost'" />
  <div v-else class="min-h-svh" aria-busy="true" />
</template>
