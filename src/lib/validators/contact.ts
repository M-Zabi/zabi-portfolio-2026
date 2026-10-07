import { z } from 'zod'

// The Content Security Policy forbids eval; without this zod probes `new Function` and the
// browser logs a CSP violation on every page load.
z.config({ jitless: true })

export const projectTypes = ['Web platform', 'Mobile app', 'Desktop app', 'AI feature', 'Something else'] as const
export const projectStages = ['Just an idea', 'Designs ready', 'Live — needs new features', 'Live — needs a rescue'] as const
export const timelines = ['ASAP (under a month)', '1–3 months', '3–6 months', 'Flexible'] as const
export const budgets = ['< $10k', '$10k – 25k', '$25k – 50k', '$50k +'] as const
export const resumeReasons = [
  'Hiring for a full-time role',
  'Contract or freelance work',
  'Partnership or collaboration',
  'Just curious',
] as const

/** Field rules shared by the project brief and the résumé request. */
export const fields = {
  name: z.string().trim().min(2, 'Tell me what to call you.').max(80, 'Keep it under 80 characters.'),
  email: z.email('That email doesn’t look right.'),
  company: z.string().trim().max(120, 'Keep it under 120 characters.').optional().or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(20, 'A couple of sentences helps — at least 20 characters.')
    .max(4000, 'Keep it under 4,000 characters.'),
  /**
   * Honeypot. Humans never see it; bots fill it in. Deliberately unvalidated so a bot gets
   * a normal-looking success while the service silently drops the message.
   */
  website: z.string().optional(),
}

/** Shared by the assistant and the submit service so validation cannot drift. */
export const contactSchema = z.object({
  name: fields.name,
  email: fields.email,
  company: fields.company,
  projectType: z.enum(projectTypes, 'Pick the closest match.'),
  stage: z.enum(projectStages, 'Pick where it is today.'),
  timeline: z.enum(timelines, 'Pick a rough timeline.'),
  budget: z.enum(budgets, 'Pick a rough range — it helps me plan.'),
  message: fields.message,
  website: fields.website,
})

export type ContactInput = z.input<typeof contactSchema>
export type ContactPayload = z.output<typeof contactSchema>

export const resumeRequestSchema = z.object({
  name: fields.name,
  email: fields.email,
  company: z.string().trim().min(2, 'Which company or team? “Independent” works too.').max(120, 'Keep it under 120 characters.'),
  role: z.string().trim().max(80, 'Keep it under 80 characters.').optional().or(z.literal('')),
  reason: z.enum(resumeReasons, 'Pick the closest one.'),
  website: fields.website,
})

export type ResumeRequestInput = z.input<typeof resumeRequestSchema>
export type ResumeRequestPayload = z.output<typeof resumeRequestSchema>
