import type { z } from 'zod'

import { site } from '@/config/site'
import {
  budgets,
  contactSchema,
  projectStages,
  projectTypes,
  resumeReasons,
  resumeRequestSchema,
  timelines,
} from '@/lib/validators/contact'

/**
 * The scripts the contact assistant follows. A flow is data: the conversation component
 * renders any flow, and every answer is validated by the same zod rules the submit service
 * re-checks, so the chat and the API can never disagree.
 */

export type AssistantMode = 'project' | 'resume'
export type StepKind = 'text' | 'email' | 'textarea' | 'choice'
export type Answers = Record<string, string>

export interface FlowStep {
  id: string
  kind: StepKind
  /** Short name used on the review card. */
  label: string
  /** What the assistant says before asking — one bubble per line. */
  prompt: (answers: Answers) => string[]
  placeholder?: string
  options?: readonly string[]
  optional?: boolean
  schema: z.ZodType
  autocomplete?: string
  inputmode?: 'text' | 'email'
  maxLength?: number
}

export interface Flow {
  mode: AssistantMode
  steps: FlowStep[]
  review: (answers: Answers) => string[]
  /** Label for the final button on the review card. */
  submitLabel: string
}

export function firstName(name: string | undefined): string {
  return (name ?? '').trim().split(/\s+/)[0] ?? ''
}

/** "Replies within one business day" → "replies within one business day". */
const reply = site.replyTime.replace(/^[A-Z]/, (char) => char.toLowerCase())

export const projectFlow: Flow = {
  mode: 'project',
  submitLabel: 'Send to Zabi',
  steps: [
    {
      id: 'name',
      kind: 'text',
      label: 'Name',
      prompt: () => [
        `Hi — I’m ${site.name}’s assistant.`,
        'A few quick questions and I’ll hand Zabi a proper brief, so the reply is a real answer, not a form letter. What should I call you?',
      ],
      placeholder: 'Your name',
      autocomplete: 'name',
      schema: contactSchema.shape.name,
      maxLength: 80,
    },
    {
      id: 'email',
      kind: 'email',
      label: 'Email',
      prompt: (answers) => [`Nice to meet you, ${firstName(answers.name)}. Where should Zabi reply?`],
      placeholder: 'you@company.com',
      autocomplete: 'email',
      inputmode: 'email',
      schema: contactSchema.shape.email,
      maxLength: 254,
    },
    {
      id: 'company',
      kind: 'text',
      label: 'Company',
      prompt: () => ['Who are you building with? A company or team name — or skip it if this one’s personal.'],
      placeholder: 'Company or team',
      autocomplete: 'organization',
      optional: true,
      schema: contactSchema.shape.company,
      maxLength: 120,
    },
    {
      id: 'projectType',
      kind: 'choice',
      label: 'Building',
      prompt: () => ['What are we building?'],
      options: projectTypes,
      schema: contactSchema.shape.projectType,
    },
    {
      id: 'stage',
      kind: 'choice',
      label: 'Stage',
      prompt: (answers) => [
        answers.projectType === 'AI feature'
          ? 'Good — that’s most of what I’m asked about lately. Where is it today?'
          : 'Got it. Where is it today?',
      ],
      options: projectStages,
      schema: contactSchema.shape.stage,
    },
    {
      id: 'timeline',
      kind: 'choice',
      label: 'Timeline',
      prompt: (answers) => [
        answers.stage === 'Live — needs a rescue'
          ? 'Rescues are a speciality — no judgement. How soon does it need to be fixed?'
          : 'When does it need to ship?',
      ],
      options: timelines,
      schema: contactSchema.shape.timeline,
    },
    {
      id: 'budget',
      kind: 'choice',
      label: 'Budget',
      prompt: () => ['And a rough budget? It only helps Zabi suggest the right kind of engagement.'],
      options: budgets,
      schema: contactSchema.shape.budget,
    },
    {
      id: 'message',
      kind: 'textarea',
      label: 'Brief',
      prompt: () => ['Last one. Tell me about it — the product, who it’s for, and what “great” looks like.'],
      placeholder: 'A few sentences is plenty…',
      schema: contactSchema.shape.message,
      maxLength: 4000,
    },
  ],
  review: (answers) => [`Here’s the brief I’ll send, ${firstName(answers.name)}. Anything to change before it goes?`],
}

export const resumeFlow: Flow = {
  mode: 'resume',
  submitLabel: 'Get the résumé',
  steps: [
    {
      id: 'name',
      kind: 'text',
      label: 'Name',
      prompt: () => ['Hi — I can get you Zabi’s résumé.', 'Zabi likes to know where it lands, so first: who’s asking?'],
      placeholder: 'Your name',
      autocomplete: 'name',
      schema: resumeRequestSchema.shape.name,
      maxLength: 80,
    },
    {
      id: 'email',
      kind: 'email',
      label: 'Email',
      prompt: (answers) => [`Thanks, ${firstName(answers.name)}. What’s your work email?`],
      placeholder: 'you@company.com',
      autocomplete: 'email',
      inputmode: 'email',
      schema: resumeRequestSchema.shape.email,
      maxLength: 254,
    },
    {
      id: 'company',
      kind: 'text',
      label: 'Company',
      prompt: () => ['Which company or team are you with?'],
      placeholder: 'Company — or “Independent”',
      autocomplete: 'organization',
      schema: resumeRequestSchema.shape.company,
      maxLength: 120,
    },
    {
      id: 'role',
      kind: 'text',
      label: 'Role',
      prompt: () => ['And your role there? Skip it if you’d rather not say.'],
      placeholder: 'e.g. Engineering manager',
      autocomplete: 'organization-title',
      optional: true,
      schema: resumeRequestSchema.shape.role,
      maxLength: 80,
    },
    {
      id: 'reason',
      kind: 'choice',
      label: 'Looking for',
      prompt: () => ['Last question — what brings you here?'],
      options: resumeReasons,
      schema: resumeRequestSchema.shape.reason,
    },
  ],
  review: (answers) => [`All set, ${firstName(answers.name)}. Confirm and it’s yours.`],
}

export const flows: Record<AssistantMode, Flow> = { project: projectFlow, resume: resumeFlow }

/** The error to show for an answer, or null when it is acceptable. */
export function validateAnswer(step: FlowStep, value: string): string | null {
  if (step.optional && value.trim() === '') return null
  const result = step.schema.safeParse(value)
  return result.success ? null : (result.error.issues[0]?.message ?? 'That doesn’t look right.')
}

/** What the assistant says once the work is done. */
export function closingLines(mode: AssistantMode, answers: Answers, channel: 'api' | 'mailto' | 'download'): string[] {
  const name = firstName(answers.name)
  if (mode === 'resume') {
    return [`Here you go, ${name}. It’s downloading now.`, 'If you’d rather talk than read, I can take a project brief too.']
  }
  if (channel === 'mailto') {
    return [`Your email app should be open with the brief filled in, ${name} — just press send.`]
  }
  return [`Sent. Thanks, ${name} — Zabi ${reply}.`, 'Keep an eye on your inbox.']
}
