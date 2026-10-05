<script setup lang="ts">
import { CheckIcon, LoaderIcon, SendIcon } from '@lucide/vue'
import { useMutation } from '@tanstack/vue-query'
import { AnimatePresence, motion } from 'motion-v'
import { useForm } from 'vee-validate'
import { ref } from 'vue'
import { toast } from 'vue-sonner'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { site } from '@/config/site'
import { ease } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { toTypedSchema } from '@/lib/validation'
import { budgets, type ContactPayload, contactSchema, projectTypes } from '@/lib/validators/contact'
import { ContactRequestError, submitContact } from '@/services/contact'

const { handleSubmit, defineField, errors, resetForm } = useForm({
  validationSchema: toTypedSchema(contactSchema),
  initialValues: { name: '', email: '', company: '', message: '', website: '' },
})

// Validate on blur first; once a field shows an error, re-check it as the visitor types.
const lazy = (state: { errors: string[] }) => ({
  validateOnBlur: true,
  validateOnModelUpdate: state.errors.length > 0,
})

const [name, nameAttrs] = defineField('name', lazy)
const [email, emailAttrs] = defineField('email', lazy)
const [company, companyAttrs] = defineField('company', lazy)
const [projectType] = defineField('projectType', { validateOnModelUpdate: true })
const [budget] = defineField('budget', { validateOnModelUpdate: true })
const [message, messageAttrs] = defineField('message', lazy)
const [website] = defineField('website')

const sentTo = ref<string | null>(null)

const mutation = useMutation({
  mutationFn: (payload: ContactPayload) => submitContact(payload),
  onSuccess: (channel, payload) => {
    if (channel === 'mailto') {
      toast.info('Opening your email app', { description: 'Your message is pre-filled — just press send.' })
      return
    }
    sentTo.value = payload.name.split(' ')[0] ?? payload.name
    toast.success('Message sent', { description: site.replyTime })
    resetForm()
  },
  onError: (error) => {
    toast.error('Message not sent', {
      description: error instanceof ContactRequestError ? error.message : `Please try again, or email ${site.email}.`,
    })
  },
})

const onSubmit = handleSubmit(
  (values) => mutation.mutate(values),
  ({ errors: invalid }) => {
    // Take keyboard and screen-reader users straight to the first problem.
    const first = Object.keys(invalid)[0]
    if (first) document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
  },
)

const chipClass =
  'relative inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border px-4 text-sm font-medium transition-colors duration-200 select-none hover:border-foreground/40 has-checked:border-foreground has-checked:bg-foreground has-checked:text-background has-focus-visible:ring-3 has-focus-visible:ring-ring/50'
</script>

<template>
  <AnimatePresence mode="wait" :initial="false">
    <motion.div
      v-if="sentTo"
      key="sent"
      class="flex flex-col items-start gap-6 rounded-3xl border border-border bg-card p-8 sm:p-12"
      role="status"
      :initial="{ opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :exit="{ opacity: 0, y: -12 }"
      :transition="{ duration: 0.5, ease: ease.outQuint }"
    >
      <span class="grid size-14 place-items-center rounded-full bg-success text-background">
        <CheckIcon class="size-6" aria-hidden="true" />
      </span>
      <div>
        <h2 class="font-display text-display-sm">Thanks, {{ sentTo }} — message received.</h2>
        <p class="mt-3 max-w-[44ch] text-muted-foreground">{{ site.replyTime }}. Keep an eye on your inbox.</p>
      </div>
      <Button variant="outline" size="lg" @click="sentTo = null">Send another message</Button>
    </motion.div>

    <motion.form
      v-else
      key="form"
      novalidate
      class="flex flex-col gap-8"
      :initial="{ opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :exit="{ opacity: 0, y: -12 }"
      :transition="{ duration: 0.5, ease: ease.outQuint }"
      @submit.prevent="onSubmit"
    >
      <div class="grid gap-6 sm:grid-cols-2">
        <Field :data-invalid="Boolean(errors.name)">
          <FieldLabel for="contact-name">Your name</FieldLabel>
          <Input
            id="contact-name"
            v-model="name"
            v-bind="nameAttrs"
            name="name"
            autocomplete="name"
            class="h-12 rounded-xl px-4 text-base"
            :aria-invalid="Boolean(errors.name)"
            aria-describedby="contact-name-error"
          />
          <FieldError id="contact-name-error" :errors="[errors.name]" />
        </Field>

        <Field :data-invalid="Boolean(errors.email)">
          <FieldLabel for="contact-email">Email</FieldLabel>
          <Input
            id="contact-email"
            v-model="email"
            v-bind="emailAttrs"
            name="email"
            type="email"
            inputmode="email"
            autocomplete="email"
            class="h-12 rounded-xl px-4 text-base"
            :aria-invalid="Boolean(errors.email)"
            aria-describedby="contact-email-error"
          />
          <FieldError id="contact-email-error" :errors="[errors.email]" />
        </Field>
      </div>

      <Field :data-invalid="Boolean(errors.company)">
        <FieldLabel for="contact-company">Company <span class="font-normal text-muted-foreground">(optional)</span></FieldLabel>
        <Input
          id="contact-company"
          v-model="company"
          v-bind="companyAttrs"
          name="company"
          autocomplete="organization"
          class="h-12 rounded-xl px-4 text-base"
          :aria-invalid="Boolean(errors.company)"
        />
        <FieldError :errors="[errors.company]" />
      </Field>

      <fieldset class="flex flex-col gap-3" :aria-invalid="Boolean(errors.projectType)" aria-describedby="contact-type-error">
        <legend class="text-sm font-medium">What are we building?</legend>
        <div class="mt-3 flex flex-wrap gap-2">
          <label v-for="type in projectTypes" :key="type" :class="chipClass">
            <input v-model="projectType" type="radio" name="projectType" :value="type" class="sr-only" />
            {{ type }}
          </label>
        </div>
        <FieldError id="contact-type-error" :errors="[errors.projectType]" />
      </fieldset>

      <fieldset class="flex flex-col gap-3" :aria-invalid="Boolean(errors.budget)" aria-describedby="contact-budget-error">
        <legend class="text-sm font-medium">Rough budget</legend>
        <div class="mt-3 flex flex-wrap gap-2">
          <label v-for="range in budgets" :key="range" :class="cn(chipClass, 'tabular')">
            <input v-model="budget" type="radio" name="budget" :value="range" class="sr-only" />
            {{ range }}
          </label>
        </div>
        <FieldError id="contact-budget-error" :errors="[errors.budget]" />
      </fieldset>

      <Field :data-invalid="Boolean(errors.message)">
        <FieldLabel for="contact-message">Tell me about it</FieldLabel>
        <Textarea
          id="contact-message"
          v-model="message"
          v-bind="messageAttrs"
          name="message"
          rows="6"
          class="min-h-40 rounded-xl px-4 py-3 text-base"
          placeholder="The product, the timeline, and what “great” looks like…"
          :aria-invalid="Boolean(errors.message)"
          aria-describedby="contact-message-hint"
        />
        <FieldError v-if="errors.message" id="contact-message-hint" :errors="[errors.message]" />
        <FieldDescription v-else id="contact-message-hint" class="flex justify-between gap-4">
          <span>A few sentences is plenty.</span>
          <span class="tabular">{{ message?.length ?? 0 }} / 4000</span>
        </FieldDescription>
      </Field>

      <!-- Honeypot: invisible to people, irresistible to bots. -->
      <div class="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label for="contact-website">Website</label>
        <input id="contact-website" v-model="website" name="website" tabindex="-1" autocomplete="off" />
      </div>

      <div class="flex flex-wrap items-center gap-x-6 gap-y-4 pt-2">
        <Button type="submit" size="xl" :disabled="mutation.isPending.value" class="min-w-52">
          <LoaderIcon v-if="mutation.isPending.value" class="animate-spin" aria-hidden="true" />
          <SendIcon v-else aria-hidden="true" />
          Send message
        </Button>
        <p class="text-sm text-muted-foreground">
          Or email <a :href="`mailto:${site.email}`" class="font-medium text-foreground underline underline-offset-4">{{ site.email }}</a>
        </p>
      </div>
    </motion.form>
  </AnimatePresence>
</template>
