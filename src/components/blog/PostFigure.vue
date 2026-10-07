<script setup lang="ts">
import { type Component, computed } from 'vue'

import type { PostFigureKind } from '@/types/blog'

import AgentLoopFigure from './figures/AgentLoopFigure.vue'
import ContextBudgetFigure from './figures/ContextBudgetFigure.vue'
import CostPerTaskFigure from './figures/CostPerTaskFigure.vue'
import DesignPipelineFigure from './figures/DesignPipelineFigure.vue'
import McpArchitectureFigure from './figures/McpArchitectureFigure.vue'
import MerkleFigure from './figures/MerkleFigure.vue'
import OnDeviceStackFigure from './figures/OnDeviceStackFigure.vue'
import VramBudgetFigure from './figures/VramBudgetFigure.vue'

const props = defineProps<{ figure: PostFigureKind; index: number; caption: string; alt: string }>()

const figures: Record<PostFigureKind, Component> = {
  'agent-loop': AgentLoopFigure,
  'merkle-index': MerkleFigure,
  'context-budget': ContextBudgetFigure,
  'vram-budget': VramBudgetFigure,
  'cost-per-task': CostPerTaskFigure,
  'mcp-architecture': McpArchitectureFigure,
  'design-pipeline': DesignPipelineFigure,
  'on-device-stack': OnDeviceStackFigure,
}

const component = computed(() => figures[props.figure])
</script>

<template>
  <component :is="component" :index="index" :caption="caption" :alt="alt" />
</template>
