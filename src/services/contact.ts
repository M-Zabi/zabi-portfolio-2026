import { site } from '@/config/site'
import {
  type ContactPayload,
  contactSchema,
  type ResumeRequestPayload,
  resumeRequestSchema,
} from '@/lib/validators/contact'

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
    `Stage: ${payload.stage}`,
    `Timeline: ${payload.timeline}`,
    `Budget: ${payload.budget}`,
    payload.company ? `Company: ${payload.company}` : null,
    `Reply to: ${payload.email}`,
  ]
    .filter((line) => line !== null)
    .join('\n')
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

async function post(endpoint: string, body: Record<string, unknown>) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new ContactRequestError(
      response.status >= 500
        ? 'The message service is having a moment. Please try again shortly.'
        : 'That didn’t go through. Please check your answers and try again.',
      response.status,
    )
  }
}

/**
 * Sends a project brief.
 *
 * With `VITE_CONTACT_ENDPOINT` set (Formspree, a serverless function, your API…) the
 * payload is POSTed as JSON with `intent: "project"`. Without one, the visitor's mail client
 * opens pre-filled — a message is never silently dropped.
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
  await post(endpoint, { intent: 'project', ...body })
  return 'api'
}

/**
 * Records who asked for the résumé, then hands it over. The conversation itself is the gate:
 * with an endpoint the request is logged (and a failure is reported); without one the
 * download simply proceeds — a visitor is never blocked by missing infrastructure.
 */
export async function requestResume(input: ResumeRequestPayload): Promise<'logged' | 'unlogged'> {
  const payload = resumeRequestSchema.parse(input)
  if (payload.website) return 'unlogged'

  const endpoint = import.meta.env.VITE_CONTACT_ENDPOINT
  if (!endpoint) return 'unlogged'

  const { website: _honeypot, ...body } = payload
  await post(endpoint, { intent: 'resume', ...body })
  return 'logged'
}

/** Starts the download in the visitor's browser. */
export function downloadResume() {
  const link = document.createElement('a')
  link.href = site.resume.href
  link.download = site.resume.fileName
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()
}

/** True when a résumé file is actually deployed (a missing file would download a 404 page). */
export async function resumeAvailable(): Promise<boolean> {
  try {
    const response = await fetch(site.resume.href, { method: 'HEAD', cache: 'no-store' })
    const type = response.headers.get('content-type') ?? ''
    return response.ok && !type.includes('text/html')
  } catch {
    return false
  }
}
