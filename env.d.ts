/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** POST endpoint for the contact form. When unset, the form opens a pre-filled email. */
  readonly VITE_CONTACT_ENDPOINT?: string
  /** Base URL of the hearts & comments API (see src/services/engagement.ts). Unset: browser-only. */
  readonly VITE_ENGAGEMENT_ENDPOINT?: string
  /** Streams a live AI summary of a post (see src/services/summary.ts). Unset: pre-written summary. */
  readonly VITE_SUMMARY_ENDPOINT?: string
  /** Canonical origin, e.g. https://zabi.dev */
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
