import { z } from 'zod'

// The Content Security Policy forbids eval; without this zod probes `new Function` and the
// browser logs a CSP violation on every page load.
z.config({ jitless: true })

export const projectTypes = ['Web platform', 'Mobile app', 'Desktop app', 'Something else'] as const
export const budgets = ['< $10k', '$10k – 25k', '$25k – 50k', '$50k +'] as const

/** Shared by the form and the submit service so validation cannot drift. */
export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Tell me what to call you.').max(80, 'Keep it under 80 characters.'),
  email: z.email('That email doesn’t look right.'),
  company: z.string().trim().max(120, 'Keep it under 120 characters.').optional().or(z.literal('')),
  projectType: z.enum(projectTypes, 'Pick the closest match.'),
  budget: z.enum(budgets, 'Pick a rough range — it helps me plan.'),
  message: z
    .string()
    .trim()
    .min(20, 'A couple of sentences helps — at least 20 characters.')
    .max(4000, 'Keep it under 4,000 characters.'),
  /**
   * Honeypot. Humans never see it; bots fill it in. Deliberately unvalidated so a bot gets
   * a normal-looking success while `submitContact` silently drops the message.
   */
  website: z.string().optional(),
})

export type ContactInput = z.input<typeof contactSchema>
export type ContactPayload = z.output<typeof contactSchema>
