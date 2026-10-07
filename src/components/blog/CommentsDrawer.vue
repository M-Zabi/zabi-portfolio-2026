<script setup lang="ts">
import { LoaderIcon, MessageSquareDashedIcon, SendIcon } from '@lucide/vue'
import { useStorage } from '@vueuse/core'
import { AnimatePresence, motion } from 'motion-v'
import { useForm } from 'vee-validate'
import { computed, nextTick, ref, watch } from 'vue'
import { toast } from 'vue-sonner'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { timeAgo } from '@/lib/blog'
import { ease } from '@/lib/motion'
import { toTypedSchema } from '@/lib/validation'
import { commentSchema } from '@/lib/validators/comment'
import { useCommentMutation } from '@/queries/blog'
import { EngagementError } from '@/services/engagement'
import type { PostComment } from '@/types/blog'

const props = defineProps<{ slug: string; title: string; comments: PostComment[]; shared: boolean; loading?: boolean }>()
const open = defineModel<boolean>('open', { required: true })

const sort = ref<'newest' | 'oldest'>('newest')
const sorted = computed(() => {
  const list = [...props.comments]
  return sort.value === 'newest' ? list.reverse() : list
})

/** Remember the commenter's name for next time — it's theirs, so it stays in their browser. */
const savedName = useStorage('mz:commenter', '')

const { handleSubmit, defineField, errors, resetForm } = useForm({
  validationSchema: toTypedSchema(commentSchema),
  initialValues: { name: savedName.value, body: '', website: '' },
})
const lazy = (state: { errors: string[] }) => ({ validateOnBlur: true, validateOnModelUpdate: state.errors.length > 0 })
const [name, nameAttrs] = defineField('name', lazy)
const [body, bodyAttrs] = defineField('body', lazy)
const [website] = defineField('website')

const mutation = useCommentMutation(() => props.slug)
const justPosted = ref<string | null>(null)

const onSubmit = handleSubmit(
  (values) =>
    mutation.mutate(values, {
      onSuccess: (comment) => {
        savedName.value = values.name
        resetForm({ values: { name: values.name, body: '', website: '' } })
        justPosted.value = comment.id
        sort.value = 'newest'
        toast.success('Comment posted', { description: props.shared ? 'Thanks for adding to the discussion.' : 'Saved in this browser.' })
      },
      onError: (error) =>
        toast.error('Comment not posted', { description: error instanceof EngagementError ? error.message : 'Please try again.' }),
    }),
  ({ errors: invalid }) => {
    const first = Object.keys(invalid)[0]
    if (first) document.querySelector<HTMLElement>(`#comments-form [name="${first}"]`)?.focus()
  },
)

function onKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') void onSubmit()
}

const palette = ['bg-ember text-ember-foreground', 'bg-volt text-volt-foreground', 'bg-cobalt text-cobalt-foreground', 'bg-mint text-mint-foreground', 'bg-blush text-blush-foreground']
function avatar(person: string) {
  let hash = 0
  for (const char of person) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  const initials = person
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
  return { initials, tone: palette[hash % palette.length] }
}

watch(open, async (value) => {
  if (!value) return
  await nextTick()
  if (!props.comments.length) document.querySelector<HTMLElement>('#comments-form [name="body"]')?.focus()
})
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      side="right"
      data-lenis-prevent
      class="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[30rem]"
    >
      <header class="border-b border-border px-6 pt-6 pb-5">
        <p class="text-label text-muted-foreground">Discussion</p>
        <SheetTitle class="mt-2 pr-10 font-display text-2xl font-semibold tracking-tight">
          {{ comments.length }} {{ comments.length === 1 ? 'comment' : 'comments' }}
        </SheetTitle>
        <SheetDescription class="mt-1 line-clamp-1 text-sm text-muted-foreground">On “{{ title }}”</SheetDescription>
        <div v-if="comments.length > 1" class="mt-4 inline-flex rounded-full border border-border p-0.5 text-xs" role="group" aria-label="Sort comments">
          <button
            v-for="option in (['newest', 'oldest'] as const)"
            :key="option"
            type="button"
            class="h-8 rounded-full px-3 font-medium capitalize transition-colors"
            :class="sort === option ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'"
            :aria-pressed="sort === option"
            @click="sort = option"
          >
            {{ option }}
          </button>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
        <div v-if="loading" class="space-y-5" aria-busy="true" aria-label="Loading comments">
          <div v-for="index in 3" :key="index" class="flex gap-3">
            <span class="size-9 shrink-0 animate-pulse rounded-full bg-muted" />
            <span class="flex-1 space-y-2">
              <span class="block h-3 w-28 animate-pulse rounded bg-muted" />
              <span class="block h-3 w-full animate-pulse rounded bg-muted" />
            </span>
          </div>
        </div>

        <div v-else-if="!comments.length" class="flex h-full flex-col items-center justify-center py-12 text-center">
          <span class="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
            <MessageSquareDashedIcon class="size-6" aria-hidden="true" />
          </span>
          <p class="mt-5 font-display text-xl font-semibold tracking-tight">Start the conversation</p>
          <p class="mt-2 max-w-[30ch] text-sm text-muted-foreground">A question, a counterpoint, a better link — all welcome.</p>
        </div>

        <ol v-else class="space-y-6">
          <AnimatePresence :initial="false">
            <motion.li
              v-for="comment in sorted"
              :key="comment.id"
              layout
              class="flex gap-3.5"
              :initial="{ opacity: 0, y: -12, scale: 0.98 }"
              :animate="{ opacity: 1, y: 0, scale: 1 }"
              :transition="{ duration: 0.45, ease: ease.outQuint }"
            >
              <span
                class="grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold"
                :class="avatar(comment.name).tone"
                aria-hidden="true"
              >{{ avatar(comment.name).initials }}</span>
              <div class="min-w-0 flex-1">
                <p class="flex flex-wrap items-baseline gap-x-2">
                  <span class="font-semibold">{{ comment.name }}</span>
                  <time :datetime="comment.createdAt" class="text-xs text-muted-foreground">{{ timeAgo(comment.createdAt) }}</time>
                  <span v-if="comment.id === justPosted" class="text-label rounded-full bg-mint px-2 py-0.5 text-[0.5625rem] text-mint-foreground">You</span>
                </p>
                <p class="mt-1 text-[0.9375rem] leading-relaxed break-words whitespace-pre-line text-foreground/85">{{ comment.body }}</p>
              </div>
            </motion.li>
          </AnimatePresence>
        </ol>
      </div>

      <form id="comments-form" novalidate class="border-t border-border bg-background/60 px-6 pt-5 pb-6" @submit.prevent="onSubmit">
        <p v-if="!shared" class="mb-4 rounded-xl bg-muted px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground">
          Comments are saved in this browser for now — a shared discussion is on the way.
        </p>
        <Field :data-invalid="Boolean(errors.name)">
          <FieldLabel for="comment-name">Name</FieldLabel>
          <Input id="comment-name" v-model="name" v-bind="nameAttrs" name="name" autocomplete="name" class="h-11 rounded-xl" :aria-invalid="Boolean(errors.name)" />
          <FieldError :errors="[errors.name]" />
        </Field>
        <Field class="mt-4" :data-invalid="Boolean(errors.body)">
          <FieldLabel for="comment-body">Comment</FieldLabel>
          <Textarea
            id="comment-body"
            v-model="body"
            v-bind="bodyAttrs"
            name="body"
            rows="3"
            class="max-h-48 min-h-24 rounded-xl"
            placeholder="What did you think?"
            :aria-invalid="Boolean(errors.body)"
            aria-describedby="comment-body-hint"
            @keydown="onKeydown"
          />
          <FieldError v-if="errors.body" :errors="[errors.body]" />
          <p v-else id="comment-body-hint" class="flex justify-between text-xs text-muted-foreground">
            <span><kbd class="font-mono">Ctrl</kbd> + <kbd class="font-mono">Enter</kbd> to post</span>
            <span class="tabular">{{ body?.length ?? 0 }} / 1500</span>
          </p>
        </Field>
        <div class="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
          <label for="comment-website">Website</label>
          <input id="comment-website" v-model="website" name="website" tabindex="-1" autocomplete="off" />
        </div>
        <button
          type="submit"
          class="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground text-sm font-semibold text-background transition-[background-color,transform] hover:bg-foreground/85 active:scale-[0.98] disabled:opacity-60"
          :disabled="mutation.isPending.value"
        >
          <LoaderIcon v-if="mutation.isPending.value" class="size-4 animate-spin" aria-hidden="true" />
          <SendIcon v-else class="size-4" aria-hidden="true" />
          Post comment
        </button>
      </form>
    </SheetContent>
  </Sheet>
</template>
