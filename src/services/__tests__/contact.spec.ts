import { afterEach, describe, expect, it, vi } from 'vitest'

import { site } from '@/config/site'
import type { ContactPayload } from '@/lib/validators/contact'

import { buildMailto, ContactRequestError, submitContact } from '../contact'

const payload: ContactPayload = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  company: 'Analytical Engines',
  projectType: 'Desktop app',
  budget: '$50k +',
  message: 'We would like a Tauri tool for our analysts, with offline support.',
  website: '',
}

describe('submitContact', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('POSTs JSON (without the honeypot) when an endpoint is configured', async () => {
    vi.stubEnv('VITE_CONTACT_ENDPOINT', 'https://forms.example.com/submit')
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(submitContact(payload)).resolves.toBe('api')

    const [url, init = {}] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://forms.example.com/submit')
    expect(init.method).toBe('POST')
    const body = JSON.parse(String(init.body))
    expect(body).toMatchObject({ name: 'Ada Lovelace', budget: '$50k +' })
    expect(body).not.toHaveProperty('website')
  })

  it('raises a readable error when the endpoint fails', async () => {
    vi.stubEnv('VITE_CONTACT_ENDPOINT', 'https://forms.example.com/submit')
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 503 })))

    const error = await submitContact(payload).catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(ContactRequestError)
    expect((error as ContactRequestError).status).toBe(503)
  })

  it('falls back to a pre-filled email when no endpoint is set', async () => {
    vi.stubEnv('VITE_CONTACT_ENDPOINT', '')
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)

    await expect(submitContact(payload)).resolves.toBe('mailto')
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/^mailto:/), '_self')
  })

  it('pretends to succeed but sends nothing when the honeypot is filled', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('VITE_CONTACT_ENDPOINT', 'https://forms.example.com/submit')

    await expect(submitContact({ ...payload, website: 'https://spam.example' })).resolves.toBe('api')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('buildMailto', () => {
  it('addresses the site owner and encodes the brief', () => {
    const url = buildMailto(payload)
    expect(url.startsWith(`mailto:${site.email}?subject=`)).toBe(true)
    expect(decodeURIComponent(url)).toContain('Budget: $50k +')
    expect(decodeURIComponent(url)).toContain('Reply to: ada@example.com')
  })
})
