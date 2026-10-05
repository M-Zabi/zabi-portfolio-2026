<script setup lang="ts">
import { ref } from 'vue'

import CapabilitiesSection from '@/components/home/CapabilitiesSection.vue'
import ContactSection from '@/components/home/ContactSection.vue'
import HeroSection from '@/components/home/HeroSection.vue'
import ManifestoSection from '@/components/home/ManifestoSection.vue'
import SelectedWork from '@/components/home/SelectedWork.vue'
import ServicesSection from '@/components/home/ServicesSection.vue'
import TestimonialsSection from '@/components/home/TestimonialsSection.vue'
import HeroScene from '@/components/scene/HeroScene.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { pages } from '@/config/seo'
import { testimonials } from '@/content/profile'

usePageMeta(pages.home)

const blast = ref(false)
</script>

<template>
  <div class="relative">
    <HeroScene :blast="blast" />
    <HeroSection v-model:blast="blast" />
    <ManifestoSection />
    <ServicesSection />
    <CapabilitiesSection />
    <SelectedWork />
    <TestimonialsSection v-if="testimonials.length" />
    <ContactSection />
  </div>
</template>
