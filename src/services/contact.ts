import { site } from '@/config/site'
import { type ContactPayload, contactSchema } from '@/lib/validators/contact'

export type ContactChannel = 'api' | 'mailto'

export class ContactRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'ContactRequestError'
  }
}

export function buildMailto(payload: ContactPayload): string {
  const subject = `${payload.projectType} — ${payload.name}`
  const body = [
    payload.message,
    '',
    `Budget: ${payload.budget}`,
    payload.company ? `Company: ${payload.company}` : null,
    `Reply to: ${payload.email}`,
  ]
    .filter((line) => line !== null)
    .join('\n')
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/**
 * Sends an enquiry.
 *
 * With `VITE_CONTACT_ENDPOINT` set (Formspree, a serverless function, your API…) the
 * payload is POSTed as JSON. Without one, the visitor's mail client opens pre-filled —
 * a message is never silently dropped.
 */
export async function submitContact(input: ContactPayload): Promise<ContactChannel> {
  const payload = contactSchema.parse(input)

  // Honeypot tripped — pretend success so bots learn nothing.
  if (payload.website) return 'api'

  const endpoint = import.meta.env.VITE_CONTACT_ENDPOINT
  if (!endpoint) {
    window.open(buildMailto(payload), '_self')
    return 'mailto'
  }

  const { website: _honeypot, ...body } = payload
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new ContactRequestError(
      response.status >= 500
        ? 'The message service is having a moment. Please try again shortly.'
        : 'That didn’t go through. Please check the form and try again.',
      response.status,
    )
  }
  return 'api'
}
