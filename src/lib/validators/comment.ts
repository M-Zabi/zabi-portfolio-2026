import { z } from 'zod'

// See validators/contact.ts: the CSP forbids eval, so zod must not probe `new Function`.
z.config({ jitless: true })

/** Shared by the comment form and the engagement service so validation cannot drift. */
export const commentSchema = z.object({
  name: z.string().trim().min(2, 'Add a name so people know who’s talking.').max(60, 'Keep it under 60 characters.'),
  body: z
    .string()
    .trim()
    .min(2, 'Say a little more.')
    .max(1500, 'Keep it under 1,500 characters — or write a post of your own.'),
  /** Honeypot — see `lib/validators/contact.ts`. */
  website: z.string().optional(),
})

export type CommentInput = z.input<typeof commentSchema>
export type CommentPayload = z.output<typeof commentSchema>
