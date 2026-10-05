<script setup lang="ts">
import { ArrowLeftIcon, ArrowRightIcon } from '@lucide/vue'
import { useMediaQuery } from '@vueuse/core'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion-v'
import { ref, shallowRef, useTemplateRef } from 'vue'

import ArrowLink from '@/components/common/ArrowLink.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import ProjectCard from '@/components/common/ProjectCard.vue'
import SectionHeading from '@/components/common/SectionHeading.vue'
import CarouselSkeleton from '@/components/skeletons/CarouselSkeleton.vue'
import { Button } from '@/components/ui/button'
import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { spring } from '@/lib/motion'
import { clamp, padIndex } from '@/lib/utils'
import { useFeaturedProjectsQuery } from '@/queries/projects'

const { data: projects, isPending, isError, isRefetching, refetch } = useFeaturedProjectsQuery()
const reducedMotion = useReducedMotion()

const api = shallowRef<CarouselApi>()
const selected = ref(0)
const snapCount = ref(0)
const progress = ref(0)
const canPrev = ref(false)
const canNext = ref(false)

function sync() {
  const embla = api.value
  if (!embla) return
  selected.value = embla.selectedScrollSnap()
  snapCount.value = embla.scrollSnapList().length
  canPrev.value = embla.canScrollPrev()
  canNext.value = embla.canScrollNext()
}

/** Scroll-linked tween: progress bar plus a subtle parallax drift of each slide's devices. */
function tween() {
  const embla = api.value
  if (!embla) return
  const scrollProgress = embla.scrollProgress()
  progress.value = clamp(scrollProgress)
  if (reducedMotion.value) return
  const snaps = embla.scrollSnapList()
  embla.slideNodes().forEach((node, index) => {
    const distance = (snaps[index] ?? 0) - scrollProgress
    node.style.setProperty('--parallax', `${(distance * -18).toFixed(2)}%`)
  })
}

function onInit(instance: CarouselApi) {
  if (!instance) return
  api.value = instance
  instance.on('select', sync).on('reInit', sync).on('scroll', tween).on('reInit', tween)
  sync()
  tween()
}

// "Drag" cursor that trails the pointer over the track (fine pointers only).
const stage = useTemplateRef<HTMLElement>('stage')
const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)')
const cursorVisible = ref(false)
const cursorX = useMotionValue(0)
const cursorY = useMotionValue(0)
const smoothX = useSpring(cursorX, spring.soft)
const smoothY = useSpring(cursorY, spring.soft)

function onPointerMove(event: PointerEvent) {
  if (!finePointer.value || !stage.value) return
  const rect = stage.value.getBoundingClientRect()
  cursorX.set(event.clientX - rect.left - 44)
  cursorY.set(event.clientY - rect.top - 44)
  cursorVisible.value = true
}
</script>

<template>
  <!-- Hidden entirely once loaded with nothing featured — no empty carousel on the home page. -->
  <section
    v-if="isPending || isError || projects?.length"
    class="section-y relative z-10 overflow-x-clip"
    aria-labelledby="work-title"
  >
    <div class="container-page">
      <SectionHeading index="05" label="Selected work" title-id="work-title" :title="'Recent things\nI’ve *shipped.*'">
        <template #actions>
          <div v-if="projects?.length" class="flex items-center gap-4">
            <p class="text-label tabular text-muted-foreground" aria-live="polite">
              {{ padIndex(selected + 1) }} / {{ padIndex(snapCount) }}
            </p>
            <Button
              variant="outline"
              size="icon-lg"
              :disabled="!canPrev"
              aria-label="Previous project"
              @click="api?.scrollPrev()"
            >
              <ArrowLeftIcon />
            </Button>
            <Button variant="outline" size="icon-lg" :disabled="!canNext" aria-label="Next project" @click="api?.scrollNext()">
              <ArrowRightIcon />
            </Button>
          </div>
        </template>
      </SectionHeading>

      <div class="mt-14">
        <CarouselSkeleton v-if="isPending" />
        <ErrorState
          v-else-if="isError"
          description="The projects didn’t load. Check your connection and try again."
          :retrying="isRefetching"
          @retry="refetch()"
        />

        <div
          v-else-if="projects?.length"
          ref="stage"
          class="relative"
          :class="finePointer && 'cursor-none'"
          @pointermove="onPointerMove"
          @pointerleave="cursorVisible = false"
        >
          <Carousel :opts="{ align: 'start', containScroll: 'trimSnaps' }" aria-label="Selected projects" @init-api="onInit">
            <CarouselContent viewport-class="overflow-visible" class="-ml-4 lg:-ml-6">
              <CarouselItem
                v-for="(project, index) in projects"
                :key="project.slug"
                class="basis-[86%] pl-4 sm:basis-[64%] lg:basis-[44%] lg:pl-6"
                :aria-label="`${index + 1} of ${projects.length}`"
              >
                <ProjectCard :project="project" :index="index" />
              </CarouselItem>
            </CarouselContent>
          </Carousel>

          <motion.div
            v-if="finePointer"
            class="text-label pointer-events-none absolute top-0 left-0 z-20 grid size-22 place-items-center rounded-full bg-foreground text-background"
            :style="{ x: smoothX, y: smoothY }"
            :animate="{ scale: cursorVisible ? 1 : 0, opacity: cursorVisible ? 1 : 0 }"
            :transition="spring.snappy"
            aria-hidden="true"
          >
            Drag
          </motion.div>
        </div>
      </div>

      <div v-if="projects?.length" class="mt-12 flex flex-wrap items-center justify-between gap-8">
        <div class="h-px max-w-md flex-1 bg-border" aria-hidden="true">
          <div class="h-full origin-left bg-foreground" :style="{ transform: `scaleX(${progress})` }" />
        </div>
        <ArrowLink to="/work" label="All projects" />
      </div>
    </div>
  </section>
</template>
